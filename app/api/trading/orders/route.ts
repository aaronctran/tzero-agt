import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'
import { matchOrder } from '@/lib/matchingEngine'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = db.prepare('SELECT * FROM trading_orders WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[]
    return NextResponse.json({ orders: rows })
  } catch (err: any) {
    console.error('GET /api/trading/orders error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { assetId, side, orderType, quantity, price: rawPrice, timeInForce, goodTilDate } = body as any

    // ── Input validation ──────────────────────────────────────────────────────
    if (!assetId || !side || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'Invalid side. Must be "buy" or "sell"' }, { status: 400 })
    }
    if (!['market', 'limit'].includes(orderType ?? 'market')) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: 'Quantity must be a positive whole number' }, { status: 400 })
    }

    const asset = (secondaryTradingAssets.investments as any[]).find((a) => a.id === assetId)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    const symbol: string = asset.symbol || asset.title

    // ── Price resolution ──────────────────────────────────────────────────────
    // Limit orders use the submitted price.
    // Market buys use the best available ask (or fallback to currentValue).
    // Market sells use the best available bid (or fallback to currentValue).
    let price: number
    if (orderType === 'limit') {
      price = Number(rawPrice)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: 'Invalid limit price' }, { status: 400 })
      }
    } else {
      // Market order — find best opposing price in the live order book
      if (side === 'buy') {
        const bestAsk = db.prepare(
          `SELECT MIN(price) as best FROM trading_orders
           WHERE symbol = ? AND side = 'sell' AND status IN ('New','Pending','PartiallyFilled')`
        ).get(symbol) as any
        price = bestAsk?.best != null ? Number(bestAsk.best) : Number(asset.currentValue || asset.basePrice)
      } else {
        const bestBid = db.prepare(
          `SELECT MAX(price) as best FROM trading_orders
           WHERE symbol = ? AND side = 'buy' AND status IN ('New','Pending','PartiallyFilled')`
        ).get(symbol) as any
        price = bestBid?.best != null ? Number(bestBid.best) : Number(asset.currentValue || asset.basePrice)
      }
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: 'Cannot determine market price — no liquidity available' }, { status: 400 })
      }
    }

    // ── Ensure balance row exists ─────────────────────────────────────────────
    db.prepare(
      `INSERT OR IGNORE INTO trading_balances (id, user_id, cash_balance, created_at, updated_at)
       VALUES (?, ?, 0, datetime('now'), datetime('now'))`
    ).run(crypto.randomUUID(), userId)

    // ── Pre-trade checks ──────────────────────────────────────────────────────
    if (side === 'buy') {
      const notional = qty * price
      const balRow = db.prepare('SELECT cash_balance FROM trading_balances WHERE user_id = ?').get(userId) as any
      const cash = balRow ? Number(balRow.cash_balance) : 0
      if (cash < notional) {
        return NextResponse.json(
          { error: `Insufficient funds. Need ${fmtUSD(notional)}, have ${fmtUSD(cash)}` },
          { status: 400 }
        )
      }

      // Reserve cash immediately so concurrent orders can't over-spend.
      // The matching engine will reconcile the exact amount per-trade; any
      // unmatched remainder sits as "reserved" until the order is cancelled.
      db.prepare(
        `UPDATE trading_balances SET cash_balance = cash_balance - ?, updated_at = datetime('now')
         WHERE user_id = ?`
      ).run(notional, userId)

    } else {
      // sell: verify sufficient shares
      const holding = db.prepare(
        'SELECT shares FROM trading_holdings WHERE user_id = ? AND symbol = ?'
      ).get(userId, symbol) as any
      const shares = holding ? Number(holding.shares) : 0
      if (shares < qty) {
        return NextResponse.json(
          { error: `Insufficient shares. Need ${qty}, have ${shares}` },
          { status: 400 }
        )
      }
    }

    // ── Call the matching engine ──────────────────────────────────────────────
    // matchOrder inserts the order, matches against the book, creates trade records,
    // updates trading_holdings for both parties, and adjusts trading_balances for fills.
    // For buys: the engine will CREDIT back the buyer's balance per fill at the actual
    //           trade price (since we pre-debited at the order price above). For fills
    //           at a better (lower) price the credit will leave a surplus which is the
    //           price improvement — this is handled below.
    const orderId = crypto.randomUUID()
    const result = matchOrder(orderId, userId, symbol, side, qty, price, timeInForce ?? 'day', goodTilDate ?? null)

    // ── Post-match: refund price improvement for buy orders ───────────────────
    // We reserved qty*orderPrice upfront. The engine charged qty*tradePrice per fill.
    // If tradePrice < orderPrice for some fills the difference stays in the balance
    // already (engine credits buyer at tradePrice, we deducted at orderPrice).
    // For the UNfilled portion we already deducted; leave it reserved until cancel/expiry.
    // Nothing extra needed here — the invariant holds.

    return NextResponse.json({ id: orderId, ...result })
  } catch (err: any) {
    console.error('POST /api/trading/orders error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}
