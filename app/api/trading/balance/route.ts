import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const row = db.prepare('SELECT cash_balance FROM trading_balances WHERE user_id = ?').get(userId) as any
    const balance = row ? Number(row.cash_balance) : 0
    return NextResponse.json({ balance })
  } catch (err: any) {
    console.error('GET /api/trading/balance error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
