import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { randomUUID } from 'crypto'
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
    const {
      cardholderName,
      cardNumber,
      cardLastFour,
      cardBrand,
      expMonth,
      expYear,
      billingAddress,
    } = body

    if (!cardholderName || !cardNumber || !cardLastFour || !expMonth || !expYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if this is the first payment method (to set as default)
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?')
    const countResult = countStmt.get(userId) as { count: number } | undefined
    const isDefault = countResult && countResult.count === 0 ? 1 : 0

    // Save payment method to database
    const paymentMethodId = `pm_${randomUUID()}`
    const stmt = db.prepare(`
      INSERT INTO payment_methods (
        id, user_id, type, status, card_last_four, card_brand,
        card_exp_month, card_exp_year, cardholder_name, billing_address, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      paymentMethodId,
      userId,
      'CREDIT_CARD',
      'ACTIVE',
      cardLastFour,
      cardBrand,
      expMonth,
      expYear,
      cardholderName,
      billingAddress || null,
      isDefault
    )

    return NextResponse.json({
      success: true,
      paymentMethodId,
      message: 'Credit card added successfully',
    })
  } catch (error: any) {
    console.error('Error adding credit card:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to add credit card' },
      { status: 500 }
    )
  }
}
