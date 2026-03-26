import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const id = parts[parts.length - 2]
    if (!id) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

    const body = await request.json()
    const { quantity, price } = body as any

    const order = db.prepare('SELECT * FROM trading_orders WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return NextResponse.json({ error: 'Order cannot be modified' }, { status: 400 })
    }

    const newQty = quantity !== undefined ? Number(quantity) : Number(order.quantity)
    if (!Number.isFinite(newQty) || newQty <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }
    const newPrice = price !== undefined ? Number(price) : Number(order.price)
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const oldQty = Number(order.quantity)
    const oldPrice = Number(order.price)
    const oldRemaining = Number(order.remaining_quantity)
    const newRemaining = Math.max(0, oldRemaining + (newQty - oldQty))

    // For buy orders, adjust the cash reservation to reflect the new qty*price.
    // Old reservation = oldRemaining * oldPrice; new reservation = newRemaining * newPrice.
    if (order.side === 'buy') {
      const oldReservation = oldRemaining * oldPrice
      const newReservation = newRemaining * newPrice
      const delta = newReservation - oldReservation  // positive = need more cash, negative = refund

      if (delta > 0) {
        // Increasing reservation — check the user has enough
        const balRow = db.prepare('SELECT cash_balance FROM trading_balances WHERE user_id = ?').get(userId) as any
        const cash = balRow ? Number(balRow.cash_balance) : 0
        if (cash < delta) {
          return NextResponse.json({ error: 'Insufficient funds for the updated order size' }, { status: 400 })
        }
        db.prepare(
          `UPDATE trading_balances SET cash_balance = cash_balance - ?, updated_at = datetime('now') WHERE user_id = ?`
        ).run(delta, userId)
      } else if (delta < 0) {
        // Decreasing reservation — refund the difference
        db.prepare(
          `UPDATE trading_balances SET cash_balance = cash_balance + ?, updated_at = datetime('now') WHERE user_id = ?`
        ).run(Math.abs(delta), userId)
      }
    }

    db.prepare(
      `UPDATE trading_orders SET quantity = ?, remaining_quantity = ?, price = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(newQty, newRemaining, newPrice, id)

    const updated = db.prepare('SELECT * FROM trading_orders WHERE id = ?').get(id)
    return NextResponse.json({ order: updated })
  } catch (err: any) {
    console.error('PATCH /api/trading/orders/[id] error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
