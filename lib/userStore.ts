import db from './db'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  password: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  countryCode?: string
  termsAgreed?: boolean
  emailVerified?: boolean
  onboardingCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

interface UserRow {
  id: string
  email: string
  password: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  country_code: string | null
  terms_agreed: number
  email_verified: number
  onboarding_completed: number
  created_at: string
  updated_at: string
}

// Helper to convert database row to User object
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    firstName: row.first_name || undefined,
    lastName: row.last_name || undefined,
    phoneNumber: row.phone_number || undefined,
    countryCode: row.country_code || undefined,
    termsAgreed: row.terms_agreed === 1,
    emailVerified: row.email_verified === 1,
    onboardingCompleted: row.onboarding_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Find user by email (case-insensitive)
export function findUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
  const row = stmt.get(email) as UserRow | undefined
  return row ? rowToUser(row) : undefined
}

// Find user by ID
export function findUserById(id: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  const row = stmt.get(id) as UserRow | undefined
  return row ? rowToUser(row) : undefined
}

// Check if user exists
export function userExists(email: string): boolean {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE LOWER(email) = LOWER(?)')
  const result = stmt.get(email) as { count: number }
  return result.count > 0
}

// Create new user with hashed password
export function createUser(
  email: string,
  password: string,
  additionalData?: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    countryCode?: string
    termsAgreed?: boolean
  }
): User {
  try {
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10)

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const emailLower = email.toLowerCase()

    const stmt = db.prepare(`
      INSERT INTO users (
        id, email, password, first_name, last_name, phone_number,
        country_code, terms_agreed, email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      emailLower,
      hashedPassword,
      additionalData?.firstName || null,
      additionalData?.lastName || null,
      additionalData?.phoneNumber || null,
      additionalData?.countryCode || null,
      additionalData?.termsAgreed ? 1 : 0,
      0 // email_verified defaults to false (0)
    )

    // Seed trading balance and holdings for new users (test experience)
    const seedTradingAccount = db.transaction(() => {
      const balanceExists = db.prepare('SELECT 1 FROM trading_balances WHERE user_id = ?').get(id)
      if (!balanceExists) {
        db.prepare(
          `INSERT INTO trading_balances (id, user_id, cash_balance, created_at, updated_at)
           VALUES (?, ?, ?, datetime('now'), datetime('now'))`
        ).run(`bal_${id}`, id, 1000)
      }

      const holdings = [
        { symbol: 'TECH', shares: 20, avgCost: 52.4 },
        { symbol: 'HYPE', shares: 12, avgCost: 76.5 },
      ]

      holdings.forEach((holding) => {
        const exists = db.prepare('SELECT 1 FROM trading_holdings WHERE user_id = ? AND symbol = ?').get(id, holding.symbol)
        if (!exists) {
          db.prepare(
            `INSERT INTO trading_holdings (id, user_id, symbol, shares, avg_cost, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
          ).run(
            `hold_${id}_${holding.symbol}`,
            id,
            holding.symbol,
            holding.shares,
            holding.avgCost
          )
        }
      })
    })
    seedTradingAccount()

    const user = findUserById(id)
    if (!user) {
      throw new Error('Failed to create user - user not found after creation')
    }

    return user
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.message?.includes('UNIQUE constraint')) {
      throw new Error('User with this email already exists')
    }
    throw new Error(error?.message || 'Failed to create user')
  }
}

// Update user
export function updateUser(
  id: string,
  updates: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    countryCode?: string
    termsAgreed?: boolean
  }
): User | undefined {
  const fields: string[] = []
  const values: any[] = []

  if (updates.firstName !== undefined) {
    fields.push('first_name = ?')
    values.push(updates.firstName || null)
  }
  if (updates.lastName !== undefined) {
    fields.push('last_name = ?')
    values.push(updates.lastName || null)
  }
  if (updates.phoneNumber !== undefined) {
    fields.push('phone_number = ?')
    values.push(updates.phoneNumber || null)
  }
  if (updates.countryCode !== undefined) {
    fields.push('country_code = ?')
    values.push(updates.countryCode || null)
  }
  if (updates.termsAgreed !== undefined) {
    fields.push('terms_agreed = ?')
    values.push(updates.termsAgreed ? 1 : 0)
  }

  if (fields.length === 0) {
    return findUserById(id)
  }

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  const stmt = db.prepare(`
    UPDATE users 
    SET ${fields.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)
  return findUserById(id)
}

// Verify password
export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password)
}
