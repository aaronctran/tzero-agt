import db from './db'
import { randomUUID } from 'crypto'

export interface Investment {
  id: string
  user_id: string
  asset_id: string
  asset_type: string
  asset_title: string
  amount: number
  currency: string
  payment_method_id: string | null
  payment_method_type: string
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  shares_quantity: number | null
  price_per_share: number | null
  created_at: string
  updated_at: string
}

export function getInvestedTotal(userId: string): number {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM investments
    WHERE user_id = ?
      AND payment_status = 'COMPLETED'
  `)
  const row = stmt.get(userId) as { total: number } | undefined
  return row?.total ?? 0
}

export function createInvestment(investment: Omit<Investment, 'id' | 'created_at' | 'updated_at'>): Investment {
  const id = `inv_${randomUUID()}`
  const stmt = db.prepare(`
    INSERT INTO investments (
      id, user_id, asset_id, asset_type, asset_title, amount, currency,
      payment_method_id, payment_method_type, payment_status,
      shares_quantity, price_per_share
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    investment.user_id,
    investment.asset_id,
    investment.asset_type,
    investment.asset_title,
    investment.amount,
    investment.currency,
    investment.payment_method_id,
    investment.payment_method_type,
    investment.payment_status,
    investment.shares_quantity,
    investment.price_per_share
  )

  return getInvestment(id)!
}

export function getInvestment(investmentId: string): Investment | null {
  const stmt = db.prepare('SELECT * FROM investments WHERE id = ?')
  const row = stmt.get(investmentId) as any
  if (!row) return null
  return rowToInvestment(row)
}

export function getUserInvestments(userId: string): Investment[] {
  const stmt = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC')
  const rows = stmt.all(userId) as any[]
  return rows.map(rowToInvestment)
}

function rowToInvestment(row: any): Investment {
  return {
    id: row.id,
    user_id: row.user_id,
    asset_id: row.asset_id,
    asset_type: row.asset_type,
    asset_title: row.asset_title,
    amount: parseFloat(row.amount),
    currency: row.currency,
    payment_method_id: row.payment_method_id,
    payment_method_type: row.payment_method_type,
    payment_status: row.payment_status,
    shares_quantity: row.shares_quantity ? parseFloat(row.shares_quantity) : null,
    price_per_share: row.price_per_share ? parseFloat(row.price_per_share) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
