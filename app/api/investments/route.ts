import { NextRequest, NextResponse } from 'next/server'
import { getUserInvestments } from '@/lib/investmentStore'
import { findUserById } from '@/lib/userStore'
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

    // Get user investments
    const investments = getUserInvestments(userId)

    return NextResponse.json({ investments })
  } catch (error: any) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch investments' },
      { status: 500 }
    )
  }
}
