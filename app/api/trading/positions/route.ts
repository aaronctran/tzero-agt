import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stmt = db.prepare('SELECT * FROM trading_holdings WHERE user_id = ?')
    const rows = stmt.all(userId) as any[]
    return NextResponse.json({ positions: rows })
  } catch (err: any) {
    console.error('GET /api/trading/positions error', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
