import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'
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

    // Create Link token for Plaid Link
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'tZERO',
      products: [Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI || undefined,
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    })

    return NextResponse.json({
      link_token: linkTokenResponse.data.link_token,
    })
  } catch (error: any) {
    console.error('Error creating Plaid link token:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create link token' },
      { status: 500 }
    )
  }
}
