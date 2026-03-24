import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Extract id from URL path: /api/trading/orders/[id]/cancel
    const url = new URL((request as any).url)
    const parts = url.pathname.split('/')
    const id = parts[parts.length - 2] // penultimate segment should be the order id

    if (!id) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

    const order = db.prepare('SELECT * FROM trading_orders WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 })
    }

    db.prepare('UPDATE trading_orders SET status = ?, remaining_quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run('Cancelled', 0, id)

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('POST /api/trading/orders/[id]/cancel error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
