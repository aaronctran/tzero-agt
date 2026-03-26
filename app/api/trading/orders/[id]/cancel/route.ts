import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Extract id from URL path: /api/trading/orders/[id]/cancel
    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const id = parts[parts.length - 2]

    if (!id) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

    const order = db.prepare('SELECT * FROM trading_orders WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 })
    }

    db.transaction(() => {
      // Mark order cancelled
      db.prepare(
        `UPDATE trading_orders SET status = 'Cancelled', remaining_quantity = 0, updated_at = datetime('now') WHERE id = ?`
      ).run(id)

      // Refund the reserved cash for the unfilled portion of a buy order.
      // When the buy was placed, cash was pre-debited for qty * price.
      // Filled shares already went through the matching engine, so only
      // remaining_quantity * price needs to come back.
      if (order.side === 'buy') {
        const refund = Number(order.remaining_quantity) * Number(order.price)
        if (refund > 0) {
          db.prepare(
            `UPDATE trading_balances SET cash_balance = cash_balance + ?, updated_at = datetime('now') WHERE user_id = ?`
          ).run(refund, userId)
        }
      }
    })()

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('POST /api/trading/orders/[id]/cancel error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
