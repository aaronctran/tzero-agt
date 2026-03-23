import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, updateUser } from '@/lib/userStore'
import db from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email } = body

    if (!token && !email) {
      return NextResponse.json(
        { message: 'Verification token or email is required' },
        { status: 400 }
      )
    }

    // In a real application, you would verify the token
    // For now, we'll use email to find and verify the user
    if (email) {
      const user = findUserByEmail(email)
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Update email_verified to true
      const stmt = db.prepare('UPDATE users SET email_verified = 1, updated_at = datetime("now") WHERE id = ?')
      stmt.run(user.id)

      return NextResponse.json({
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: true,
        },
      })
    }

    return NextResponse.json(
      { message: 'Invalid verification token' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
