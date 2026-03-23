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

    // Check if user exists
    const user = findUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // In a real application, you would send an email here
    // For now, we'll just return success
    // TODO: Implement actual email sending service
    
    console.log(`Verification email would be sent to: ${email}`)
    
    return NextResponse.json({
      message: 'Verification email sent successfully',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
