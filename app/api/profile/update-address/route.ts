import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
import { saveOnboardingData } from '@/lib/onboardingStore'
import { getAuthUserId } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    
    // Save address data to onboarding_data table
    saveOnboardingData(userId, body)

    return NextResponse.json({
      message: 'Address updated successfully',
    })
  } catch (error: any) {
    console.error('Update address error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
