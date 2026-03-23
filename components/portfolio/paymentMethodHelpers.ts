import React from 'react'
import { AccountBalance, CreditCard } from '@mui/icons-material'

export interface PaymentMethodData {
  id: string
  name: string
  icon: React.ReactNode
  available: number
  type?: string
  account_number_masked?: string
  displayInfo?: string
  isDefault: boolean
}

// Generate mock available balance based on payment method type
function generateMockBalance(type: string, id: string): number {
  // Use the payment method ID as a seed for consistent balance per method
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = (seed % 1000) / 1000 // Pseudo-random between 0 and 1

  switch (type) {
    case 'ACH':
      // Bank accounts: $5,000 - $50,000
      return Math.round((5000 + random * 45000) * 100) / 100
    case 'CREDIT_CARD':
      // Credit cards: $2,000 - $10,000 available credit
      return Math.round((2000 + random * 8000) * 100) / 100
    case 'TZERO_BALANCE':
      // tZERO balance: $1,000 - $25,000
      return Math.round((1000 + random * 24000) * 100) / 100
    default:
      return Math.round((1000 + random * 5000) * 100) / 100
  }
}

export function mapPaymentMethodData(pm: any): PaymentMethodData {
  let name = 'Payment Method'
  let icon: React.ReactNode = React.createElement(AccountBalance)
  let displayInfo = ''

  if (pm.type === 'ACH') {
    name = pm.bank_name || pm.account_name || 'Bank Account'
    icon = React.createElement(AccountBalance)
    displayInfo = pm.account_number_masked ? `•••• ${pm.account_number_masked}` : ''
  } else if (pm.type === 'CREDIT_CARD') {
    name = `${pm.card_brand || 'Card'} •••• ${pm.card_last_four || ''}`
    icon = React.createElement(CreditCard)
    displayInfo = pm.cardholder_name || ''
  } else if (pm.type === 'TZERO_BALANCE') {
    name = 'tZERO Account'
    icon = React.createElement(AccountBalance)
  }

  return {
    id: pm.id,
    name,
    icon,
    available: generateMockBalance(pm.type, pm.id),
    type: pm.type,
    account_number_masked: pm.account_number_masked,
    displayInfo,
    isDefault: pm.is_default === 1,
  }
}
