import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
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

    // Get user
    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        emailVerified: user.emailVerified,
        onboardingCompleted: user.onboardingCompleted,
      },
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
