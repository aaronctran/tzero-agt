import { NextRequest, NextResponse } from 'next/server'
import { findUserById, updateUser } from '@/lib/userStore'
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
    const { phoneNumber, countryCode } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Phone number is required.' },
        { status: 400 }
      )
    }

    // Update user phone number
    updateUser(userId, {
      phoneNumber,
      countryCode: countryCode || '+1',
    })

    return NextResponse.json({
      message: 'Phone number updated successfully',
      user: {
        id: user.id,
        email: user.email,
        phoneNumber,
        countryCode: countryCode || '+1',
      },
    })
  } catch (error: any) {
    console.error('Update phone error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
