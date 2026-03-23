import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import db from '@/lib/db'
import { randomUUID } from 'crypto'
import { findUserById } from '@/lib/userStore'
import { getAuthUserId } from '@/lib/auth'

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
})

const plaidClient = new PlaidApi(configuration)

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
    const { publicToken } = body

    if (!publicToken) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const accounts = accountsResponse.data.accounts

    // For now, we'll save the first checking or savings account
    const bankAccount = accounts.find(
      (acc) => acc.type === 'depository' && 
      (acc.subtype === 'checking' || acc.subtype === 'savings')
    )

    if (!bankAccount) {
      return NextResponse.json(
        { error: 'No valid bank account found' },
        { status: 400 }
      )
    }

    // Try to get account details (auth product may not be ready immediately)
    let accountNumber = null
    let routingNumber = ''
    try {
      const accountNumberResponse = await plaidClient.authGet({
        access_token: accessToken,
      })

      if (accountNumberResponse.data.numbers?.ach) {
        const accountNumbers = accountNumberResponse.data.numbers.ach
        accountNumber = accountNumbers.find(
          (num) => num.account_id === bankAccount.account_id
        )
        routingNumber = accountNumber?.routing || ''
      }
    } catch (authError: any) {
      // If auth product is not ready, we'll use the account mask instead
      console.warn('Auth product not ready yet, using account mask:', authError?.response?.data?.error_message)
      // Continue without account number - we'll use the mask
    }

    // Save payment method to database
    const paymentMethodId = `pm_${randomUUID()}`
    const stmt = db.prepare(`
      INSERT INTO payment_methods (
        id, user_id, type, status, plaid_item_id, plaid_access_token,
        bank_name, account_name, account_type, account_subtype,
        account_number_masked, routing_number, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      paymentMethodId,
      userId,
      'ACH',
      'ACTIVE',
      itemId,
      accessToken,
      bankAccount.name || 'Bank Account',
      bankAccount.name || 'Bank Account',
      bankAccount.type,
      bankAccount.subtype,
      accountNumber?.account || bankAccount.mask || '****',
      routingNumber,
      // Set as default if it's the first payment method
      (() => {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?')
        const result = countStmt.get(userId) as { count: number } | undefined
        return result && result.count === 0 ? 1 : 0
      })()
    )

    return NextResponse.json({
      success: true,
      paymentMethodId,
      account: {
        name: bankAccount.name,
        type: bankAccount.type,
        subtype: bankAccount.subtype,
        mask: bankAccount.mask,
      },
    })
  } catch (error: any) {
    console.error('Error exchanging public token:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to exchange public token' },
      { status: 500 }
    )
  }
}
