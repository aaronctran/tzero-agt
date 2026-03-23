import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
import { createPayment, getPaymentMethod } from '@/lib/paymentStore'
import { getAuthUserId } from '@/lib/auth'

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
    const { amount, paymentMethodId } = body || {}
    const numericAmount = Number(amount)

    if (!paymentMethodId || !numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid deposit request.' },
        { status: 400 }
      )
    }

    const paymentMethod = getPaymentMethod(paymentMethodId)
    if (!paymentMethod || paymentMethod.user_id !== userId || paymentMethod.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Payment method not available.' },
        { status: 400 }
      )
    }

    const payment = createPayment({
      user_id: userId,
      payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      status: 'COMPLETED',
      direction: 'DEPOSIT',
      amount: numericAmount,
      currency: 'USD',
      description: 'Account deposit',
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({ payment })
  } catch (error: any) {
    console.error('Error creating deposit:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create deposit' },
      { status: 500 }
    )
  }
}
