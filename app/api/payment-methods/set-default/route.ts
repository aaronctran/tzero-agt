import { NextRequest, NextResponse } from 'next/server'
import { setDefaultPaymentMethod, getPaymentMethod } from '@/lib/paymentStore'
import { findUserById } from '@/lib/userStore'
import { getAuthUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment Method ID is required' },
        { status: 400 }
      )
    }

    // Verify payment method exists and belongs to user
    const paymentMethod = getPaymentMethod(paymentMethodId)
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    if (paymentMethod.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Set as default
    setDefaultPaymentMethod(userId, paymentMethodId)

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully',
    })
  } catch (error: any) {
    console.error('Error setting default payment method:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to set default payment method' },
      { status: 500 }
    )
  }
}
