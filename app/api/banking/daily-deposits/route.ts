import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
import { getTodayDepositTotal } from '@/lib/paymentStore'
import { getAuthUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    const total = getTodayDepositTotal(userId)
    return NextResponse.json({ total })
  } catch (error: any) {
    console.error('Error fetching daily deposits:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch daily deposits' },
      { status: 500 }
    )
  }
}
