import { NextResponse } from 'next/server'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/assets
 * Returns all available trading assets.
 *
 * TODO: Add query params for filtering/searching (e.g. ?category=tech, ?search=nova)
 * TODO: Consider making this authenticated using getAuthUserId() from '@/lib/auth'
 */
export async function GET() {
  try {
    const assets = secondaryTradingAssets.investments

    return NextResponse.json({
      assets,
      total: assets.length,
    })
  } catch (error: any) {
    console.error('Error fetching trading assets:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}
