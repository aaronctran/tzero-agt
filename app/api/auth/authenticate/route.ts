import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findUserByEmail, userExists, verifyPassword } from '@/lib/userStore'
import { savePendingSignup } from '@/lib/pendingSignups'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user exists
    if (userExists(email)) {
      // User exists - try to login
      const user = findUserByEmail(email)
      if (!user) {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Verify password using bcrypt
      if (!verifyPassword(user, password)) {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        )
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
        needsCompletion: false,
      })
    } else {
      // User doesn't exist - save as pending signup and return token for completion
      const pendingToken = savePendingSignup(email, password)
      
      return NextResponse.json({
        needsCompletion: true,
        pendingToken,
        email,
      })
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
