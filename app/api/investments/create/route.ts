import { NextRequest, NextResponse } from 'next/server'
import { createInvestment } from '@/lib/investmentStore'
import { findUserById } from '@/lib/userStore'
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
    const {
      asset_id,
      asset_title,
      amount,
      payment_method_id,
      payment_method_type,
      price_per_share,
    } = body

    if (!asset_id || !asset_title || !amount || !payment_method_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const shares_quantity = price_per_share ? parseFloat(amount) / parseFloat(price_per_share) : null

    const investment = createInvestment({
      user_id: userId,
      asset_id,
      asset_type: 'SECONDARY_TRADING',
      asset_title,
      amount: parseFloat(amount),
      currency: 'USD',
      payment_method_id: payment_method_id || null,
      payment_method_type,
      payment_status: 'COMPLETED',
      shares_quantity,
      price_per_share: price_per_share ? parseFloat(price_per_share) : null,
    })

    return NextResponse.json({
      success: true,
      investment,
    })
  } catch (error: any) {
    console.error('Error creating investment:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create investment' },
      { status: 500 }
    )
  }
}
