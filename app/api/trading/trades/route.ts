import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/trades
 * Returns all matched trades where the authenticated user was the buyer or seller.
 * Joins trading_orders to determine which side the user was on for each trade.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const trades = db.prepare(`
      SELECT
        t.id,
        t.symbol,
        t.quantity,
        t.price,
        t.created_at,
        t.buy_order_id,
        t.sell_order_id,
        CASE WHEN buy_ord.user_id = ? THEN 'buy' ELSE 'sell' END AS side
      FROM trading_trades t
      JOIN trading_orders buy_ord  ON t.buy_order_id  = buy_ord.id
      JOIN trading_orders sell_ord ON t.sell_order_id = sell_ord.id
      WHERE buy_ord.user_id = ? OR sell_ord.user_id = ?
      ORDER BY t.created_at DESC
    `).all(userId, userId, userId) as any[]

    return NextResponse.json({ trades })
  } catch (err: any) {
    console.error('GET /api/trading/trades error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
