import db from './db'

export interface PaymentMethod {
  id: string
  user_id: string
  type: 'ACH' | 'CREDIT_CARD'
  status: 'ACTIVE' | 'INACTIVE' | 'VERIFICATION_FAILED'
  plaid_item_id?: string
  plaid_access_token?: string
  bank_name?: string
  account_name?: string
  account_type?: string
  account_subtype?: string
  account_number_masked?: string
  routing_number?: string
  card_last_four?: string
  card_brand?: string
  card_exp_month?: number
  card_exp_year?: number
  cardholder_name?: string
  billing_address?: string
  is_default: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  payment_method_id?: string
  type: 'ACH' | 'CREDIT_CARD'
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'REFUNDED'
  direction: 'DEPOSIT' | 'WITHDRAWAL'
  amount: number
  currency: string
  description?: string
  reference_number?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export function getCashBalance(userId: string): number {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(
      CASE
        WHEN direction = 'DEPOSIT' AND status = 'COMPLETED' THEN amount
        WHEN direction = 'WITHDRAWAL' AND status = 'COMPLETED' THEN -amount
        ELSE 0
      END
    ), 0) as balance
    FROM payments
    WHERE user_id = ?
  `)
  const row = stmt.get(userId) as { balance: number } | undefined
  return row?.balance ?? 0
}

export function getTodayDepositTotal(userId: string): number {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE user_id = ?
      AND direction = 'DEPOSIT'
      AND status = 'COMPLETED'
      AND date(created_at, 'localtime') = date('now', 'localtime')
  `)
  const row = stmt.get(userId) as { total: number } | undefined
  return row?.total ?? 0
}

export function getPaymentMethods(userId: string): PaymentMethod[] {
  const stmt = db.prepare('SELECT * FROM payment_methods WHERE user_id = ? AND status = ? ORDER BY is_default DESC, created_at DESC')
  return stmt.all(userId, 'ACTIVE') as PaymentMethod[]
}

export function getPaymentMethod(paymentMethodId: string): PaymentMethod | null {
  const stmt = db.prepare('SELECT * FROM payment_methods WHERE id = ?')
  return stmt.get(paymentMethodId) as PaymentMethod | null
}

export function getDefaultPaymentMethod(userId: string): PaymentMethod | null {
  const stmt = db.prepare('SELECT * FROM payment_methods WHERE user_id = ? AND is_default = 1 AND status = ?')
  return stmt.get(userId, 'ACTIVE') as PaymentMethod | null
}

export function createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Payment {
  const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  const stmt = db.prepare(`
    INSERT INTO payments (
      id, user_id, payment_method_id, type, status, direction, amount, currency,
      description, reference_number, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    payment.user_id,
    payment.payment_method_id || null,
    payment.type,
    payment.status,
    payment.direction,
    payment.amount,
    payment.currency,
    payment.description || null,
    payment.reference_number || null,
    payment.completed_at || null
  )

  return getPayment(id)!
}

export function getPayment(paymentId: string): Payment | null {
  const stmt = db.prepare('SELECT * FROM payments WHERE id = ?')
  return stmt.get(paymentId) as Payment | null
}

export function getPayments(userId: string, filters?: {
  status?: Payment['status']
  type?: Payment['type']
  direction?: Payment['direction']
  limit?: number
}): Payment[] {
  let query = 'SELECT * FROM payments WHERE user_id = ?'
  const params: any[] = [userId]

  if (filters?.status) {
    query += ' AND status = ?'
    params.push(filters.status)
  }

  if (filters?.type) {
    query += ' AND type = ?'
    params.push(filters.type)
  }

  if (filters?.direction) {
    query += ' AND direction = ?'
    params.push(filters.direction)
  }

  query += ' ORDER BY created_at DESC'

  if (filters?.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
  }

  const stmt = db.prepare(query)
  return stmt.all(...params) as Payment[]
}

export function updatePaymentStatus(
  paymentId: string,
  status: Payment['status'],
  additionalData?: {
    completed_at?: string
  }
): void {
  const stmt = db.prepare(`
    UPDATE payments
    SET status = ?,
        completed_at = COALESCE(?, completed_at),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)

  stmt.run(
    status,
    additionalData?.completed_at || null,
    paymentId
  )
}

export function setDefaultPaymentMethod(userId: string, paymentMethodId: string): void {
  const unsetStmt = db.prepare('UPDATE payment_methods SET is_default = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
  unsetStmt.run(userId)

  const setStmt = db.prepare('UPDATE payment_methods SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
  setStmt.run(paymentMethodId, userId)
}
