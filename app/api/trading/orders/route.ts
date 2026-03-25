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

    const stmt = db.prepare('SELECT * FROM trading_orders WHERE user_id = ? ORDER BY created_at DESC')
    const rows = stmt.all(userId) as any[]
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

    if (!assetId || !side || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })

    const asset = (secondaryTradingAssets.investments as any[]).find((a) => a.id === assetId)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    // derive symbol and price
    const symbol = asset.symbol || asset.title
    const price = orderType === 'limit' ? Number(rawPrice) : Number(asset.currentValue || asset.basePrice || 0)

    if (orderType === 'limit' && (!Number.isFinite(price) || price <= 0)) {
      return NextResponse.json({ error: 'Invalid limit price' }, { status: 400 })
    }

    // Ensure a trading balance row exists for the user (so updates are straightforward)
    const ensureBal = db.prepare("INSERT OR IGNORE INTO trading_balances (id, user_id, cash_balance, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))")
    ensureBal.run(crypto.randomUUID(), userId, 0)

    // Simple pre-checks: cash for buys, shares for sells
    if (side === 'buy') {
      const notional = qty * price
      const balRow = db.prepare('SELECT cash_balance FROM trading_balances WHERE user_id = ?').get(userId) as any
      const cash = balRow ? Number(balRow.cash_balance) : 0
      if (cash < notional) {
        return NextResponse.json({ error: 'Insufficient cash balance' }, { status: 400 })
      }
    } else {
      // sell: ensure holdings
      const holding = db.prepare('SELECT shares FROM trading_holdings WHERE user_id = ? AND symbol = ?').get(userId, symbol) as any
      const shares = holding ? Number(holding.shares) : 0
      if (shares < qty) return NextResponse.json({ error: 'Insufficient shares to sell' }, { status: 400 })
    }

    // Create an order id and call matching engine (it inserts the order and performs matches)
    const orderId = crypto.randomUUID()
    const result = matchOrder(orderId, userId, symbol, side, qty, price, timeInForce ?? 'day', goodTilDate ?? null)

    // After matching, reconcile cash balances for any executed trades
    try {
      const reconcile = db.transaction(() => {
        const trades = db.prepare(
          `SELECT t.*, b.user_id as buy_user_id, s.user_id as sell_user_id
           FROM trading_trades t
           JOIN trading_orders b ON t.buy_order_id = b.id
           JOIN trading_orders s ON t.sell_order_id = s.id
           WHERE t.buy_order_id = ? OR t.sell_order_id = ?`
        ).all(orderId, orderId) as any[]

        const getBal = db.prepare('SELECT id, cash_balance FROM trading_balances WHERE user_id = ?')
        const insertBal = db.prepare('INSERT INTO trading_balances (id, user_id, cash_balance, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))')
        const updateBal = db.prepare('UPDATE trading_balances SET cash_balance = ?, updated_at = datetime(\'now\') WHERE id = ?')

        for (const t of trades) {
          const tradeNotional = Number(t.price) * Number(t.quantity)

          // buyer: subtract
          const buyerRow = getBal.get(t.buy_user_id) as any
          if (!buyerRow) {
            insertBal.run(crypto.randomUUID(), t.buy_user_id, -tradeNotional)
          } else {
            const newBal = Number(buyerRow.cash_balance ?? 0) - tradeNotional
            updateBal.run(newBal, (buyerRow.id as string) ?? buyerRow.id)
          }

          // seller: add
          const sellerRow = getBal.get(t.sell_user_id) as any
          if (!sellerRow) {
            insertBal.run(crypto.randomUUID(), t.sell_user_id, tradeNotional)
          } else {
            const newBal = Number(sellerRow.cash_balance ?? 0) + tradeNotional
            updateBal.run(newBal, (sellerRow.id as string) ?? sellerRow.id)
          }
        }
      })

      reconcile()
    } catch (e) {
      console.error('Balance reconciliation failed', e)
      // continue — matching completed, but balances might be inconsistent; surface a warning
    }

    return NextResponse.json({ id: orderId, ...result })
  } catch (err: any) {
    console.error('POST /api/trading/orders error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
