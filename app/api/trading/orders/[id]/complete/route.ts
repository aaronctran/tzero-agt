import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'
import { matchExistingOrder, upsertHolding } from '@/lib/matchingEngine'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // extract order id from URL path using a regex to be robust against trailing slashes
    const url = new URL(request.url)
    const match = url.pathname.match(/\/api\/trading\/orders\/([^/]+)\/complete\/?$/)
    const orderId = match ? match[1] : null
    if (!orderId) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

    const order = db.prepare('SELECT * FROM trading_orders WHERE id = ?').get(orderId) as any
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // only owner may execute their order (or in future, admins)
    if (order.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return NextResponse.json({ error: 'Order cannot be executed' }, { status: 400 })
    }

    // Allow optional update payload to modify quantity/price before matching
    let payload: any = null
    try {
      payload = await request.json()
    } catch (e) {
      payload = null
    }

    if (payload && (payload.quantity !== undefined || payload.price !== undefined)) {
      const updates: string[] = []
      const params: any[] = []
      if (payload.quantity !== undefined) {
        updates.push('quantity = ?')
        params.push(Number(payload.quantity))
      }
      if (payload.price !== undefined) {
        updates.push('price = ?')
        params.push(Number(payload.price))
      }
      if (updates.length) {
        updates.push('updated_at = ?')
        params.push(new Date().toISOString())
        params.push(orderId)
        db.prepare(`UPDATE trading_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params)
      }
    }

    // Run matching engine on existing order - this will create trades, update holdings and balances
    let result
    try {
      result = matchExistingOrder(orderId)
    } catch (e: any) {
      console.error('matching error', e)
      return NextResponse.json({ error: e?.message || 'Matching failed' }, { status: 500 })
    }

    // Force-complete: regardless of whether the engine found counterparty matches,
    // mark the order as Completed so it clears from the open orders list.
    if (result.status !== 'Completed') {
      // Re-fetch the latest order state (quantity/price may have been updated by payload above)
      const latestOrder = db.prepare('SELECT * FROM trading_orders WHERE id = ?').get(orderId) as any
      const unfilledQty = result.remaining  // shares the engine didn't match

      if (unfilledQty > 0) {
        // Credit/debit the holding for the unfilled portion so the position reflects the full order
        const fillPrice = Number(latestOrder.price)
        const symbol = latestOrder.symbol
        if (latestOrder.side === 'buy') {
          // Buyer's cash was already pre-debited at order placement — just add the shares
          upsertHolding(userId, symbol, unfilledQty, fillPrice)
        } else {
          // Sell: remove shares and credit the seller's cash balance with the proceeds
          upsertHolding(userId, symbol, -unfilledQty, fillPrice)
          const proceeds = unfilledQty * fillPrice
          db.prepare(
            `UPDATE trading_balances SET cash_balance = cash_balance + ?, updated_at = datetime('now') WHERE user_id = ?`
          ).run(proceeds, userId)
        }
      }

      db.prepare(
        `UPDATE trading_orders SET status = 'Completed', remaining_quantity = 0, updated_at = datetime('now') WHERE id = ?`
      ).run(orderId)
      result = { ...result, status: 'Completed', remaining: 0 }
    }

    // Return updated order and match result
    const updatedOrder = db.prepare('SELECT * FROM trading_orders WHERE id = ?').get(orderId) as any

    // Fetch updated holdings for the authenticated user so client can update positions immediately
    const updatedPositions = db.prepare('SELECT id, symbol, shares, avg_cost FROM trading_holdings WHERE user_id = ?').all(userId)

    return NextResponse.json({ order: updatedOrder, matchResult: result, positions: updatedPositions })
  } catch (err: any) {
    console.error('POST /api/trading/orders/[id]/complete error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
