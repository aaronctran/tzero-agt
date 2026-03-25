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
    if (!Number.isFinite(newQty) || newQty <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })

    const newPrice = price !== undefined ? Number(price) : Number(order.price)
    if (!Number.isFinite(newPrice) || newPrice <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

    // Adjust remaining quantity relative to original quantity
    const newRemaining = Math.max(0, Number(order.remaining_quantity) + (newQty - Number(order.quantity)))

    db.prepare('UPDATE trading_orders SET quantity = ?, remaining_quantity = ?, price = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(newQty, newRemaining, newPrice, id)

    const updated = db.prepare('SELECT * FROM trading_orders WHERE id = ?').get(id)
    return NextResponse.json({ order: updated })
  } catch (err: any) {
    console.error('PATCH /api/trading/orders/[id] error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
