import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/userStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
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

    // Check if user exists
    const user = findUserByEmail(email)
    
    // For security, we don't reveal if the email exists or not
    // In a real application, you would send an email with a reset link
    // For this POC, we'll just return success
    
    // In production, you would:
    // 1. Generate a reset token
    // 2. Store it in the database with an expiration time
    // 3. Send an email with a link containing the token
    // 4. User clicks link, enters new password, token is validated
    
    return NextResponse.json({
      message: 'If an account with that email exists, password reset instructions have been sent.',
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
