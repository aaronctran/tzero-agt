import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
import { findOnboardingDataByUserId } from '@/lib/onboardingStore'
import { getAuthUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found.' },
        { status: 404 }
      )
    }

    // Get onboarding data
    const onboardingData = findOnboardingDataByUserId(userId)

    if (!onboardingData) {
      return NextResponse.json({
        message: 'No onboarding data found',
        onboardingData: null,
      })
    }

    return NextResponse.json({
      onboardingData,
    })
  } catch (error: any) {
    console.error('Get onboarding data error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
