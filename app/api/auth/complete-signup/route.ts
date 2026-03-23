import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createUser, userExists } from '@/lib/userStore'
import { getPendingSignup, deletePendingSignup } from '@/lib/pendingSignups'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pendingToken,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      countryCode,
      termsAgreed,
    } = body

    let pendingEmail: string
    let pendingPassword: string

    // Try to get from pending token first
    if (pendingToken) {
      try {
        const pending = getPendingSignup(pendingToken)
        if (pending) {
          pendingEmail = pending.email
          pendingPassword = pending.password
        } else {
          // Token expired, try to use email/password if provided
          if (email && password) {
            pendingEmail = email
            pendingPassword = password
          } else {
            return NextResponse.json(
              { message: 'Signup session expired. Please provide your email and password to continue.' },
              { status: 400 }
            )
          }
        }
      } catch (dbError: any) {
        console.error('Error getting pending signup:', dbError)
        // If database error, try to use email/password if provided
        if (email && password) {
          pendingEmail = email
          pendingPassword = password
        } else {
          return NextResponse.json(
            { message: 'Database error. Please provide your email and password to continue.' },
            { status: 400 }
          )
        }
      }
    } else if (email && password) {
      // No token, but email/password provided
      pendingEmail = email
      pendingPassword = password
    } else {
      return NextResponse.json(
        { message: 'Invalid signup session. Please provide your email and password.' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json(
        { message: 'First name, last name, and phone number are required' },
        { status: 400 }
      )
    }

    if (!termsAgreed) {
      return NextResponse.json(
        { message: 'You must agree to the terms and conditions' },
        { status: 400 }
      )
    }

    // Validate email format if provided directly (not from pending token)
    if (!pendingToken || (email && password)) {
      if (!pendingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingEmail)) {
        return NextResponse.json(
          { message: 'Please provide a valid email address' },
          { status: 400 }
        )
      }

      // Validate password if provided directly
      if (!pendingPassword || pendingPassword.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters long' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists
    try {
      if (userExists(pendingEmail)) {
        if (pendingToken) {
          try {
            deletePendingSignup(pendingToken)
          } catch (e) {
            // Ignore delete errors
          }
        }
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 409 }
        )
      }
    } catch (dbError: any) {
      console.error('Error checking user existence:', dbError)
      return NextResponse.json(
        { message: 'Database error. Please try again.' },
        { status: 500 }
      )
    }

    // Create the user in database with all information
    let user
    try {
      user = createUser(pendingEmail, pendingPassword, {
        firstName,
        lastName,
        phoneNumber,
        countryCode: countryCode || '+1',
        termsAgreed: true,
      })
    } catch (createError: any) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { message: createError?.message || 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Delete pending signup if token was used
    if (pendingToken) {
      try {
        deletePendingSignup(pendingToken)
      } catch (e) {
        // Ignore delete errors - user is already created
        console.warn('Failed to delete pending signup:', e)
      }
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      token,
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
    console.error('Complete signup error:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { message: error?.message || 'Internal server error', details: process.env.NODE_ENV === 'development' ? error?.stack : undefined },
      { status: 500 }
    )
  }
}
