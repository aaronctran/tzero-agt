import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Get database path
const dbPath = path.join(process.cwd(), 'data', 'tzero.db')

// Ensure data directory exists
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize database
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize schema
export function initializeDatabase() {
  // Users table - authentication data
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone_number TEXT,
      country_code TEXT,
      terms_agreed INTEGER DEFAULT 0,
      email_verified INTEGER DEFAULT 0,
      onboarding_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Onboarding data table - account setup information
  db.exec(`
    CREATE TABLE IF NOT EXISTS onboarding_data (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      legal_first_name TEXT,
      legal_middle_name TEXT,
      legal_last_name TEXT,
      account_type TEXT DEFAULT 'Individual',
      date_of_birth TEXT,
      citizenship TEXT DEFAULT 'United States',
      taxation_country TEXT DEFAULT 'United States',
      employment_status TEXT,
      physical_country TEXT,
      physical_address TEXT,
      physical_apt_ste TEXT,
      physical_city TEXT,
      physical_state TEXT,
      physical_zip_code TEXT,
      mailing_address_same INTEGER DEFAULT 0,
      mailing_country TEXT,
      mailing_address TEXT,
      mailing_apt_ste TEXT,
      mailing_city TEXT,
      mailing_state TEXT,
      mailing_zip_code TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_onboarding_data_user_id ON onboarding_data(user_id)
  `)

  // Pending signups table - temporary signup tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_signups (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pending_signups_expires ON pending_signups(expires_at)
  `)

  // Clean up expired pending signups
  db.exec(`
    DELETE FROM pending_signups WHERE expires_at < datetime('now')
  `)

  // Payment methods table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ACH', 'CREDIT_CARD')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'VERIFICATION_FAILED')),
      -- ACH fields
      plaid_item_id TEXT,
      plaid_access_token TEXT,
      bank_name TEXT,
      account_name TEXT,
      account_type TEXT,
      account_subtype TEXT,
      account_number_masked TEXT,
      routing_number TEXT,
      -- Credit Card fields
      card_last_four TEXT,
      card_brand TEXT,
      card_exp_month INTEGER,
      card_exp_year INTEGER,
      cardholder_name TEXT,
      billing_address TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Payments table - deposit/withdrawal transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      payment_method_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('ACH', 'CREDIT_CARD')),
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED')),
      direction TEXT NOT NULL CHECK(direction IN ('DEPOSIT', 'WITHDRAWAL')),
      amount DECIMAL(15, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      description TEXT,
      reference_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)
  `)

  // Investments table - tracks investment purchases
  db.exec(`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'SECONDARY_TRADING',
      asset_title TEXT NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      payment_method_id TEXT,
      payment_method_type TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
      shares_quantity DECIMAL(15, 4),
      price_per_share DECIMAL(15, 2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id)
  `)

  // ─── Trading Tables ───────────────────────────────────────────

  // Trading orders - buy/sell orders placed by users
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL CHECK(side IN ('buy', 'sell')),
      quantity INTEGER NOT NULL,
      remaining_quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('New', 'Pending', 'PartiallyFilled', 'Filled', 'Completed', 'Cancelled')),
      time_in_force TEXT NOT NULL CHECK(time_in_force IN ('day', 'gtd', 'gtc')),
      good_til_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Trading trades - matched trades between buy and sell orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_trades (
      id TEXT PRIMARY KEY,
      buy_order_id TEXT NOT NULL,
      sell_order_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buy_order_id) REFERENCES trading_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (sell_order_id) REFERENCES trading_orders(id) ON DELETE CASCADE
    )
  `)

  // Trading holdings - user's share positions per symbol
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_holdings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      shares INTEGER NOT NULL,
      avg_cost REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Trading balances - user's cash balance for trading
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_balances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      cash_balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_trades_symbol ON trading_trades(symbol)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_holdings_user_id ON trading_holdings(user_id)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_balances_user_id ON trading_balances(user_id)
  `)

  console.log('✅ Database initialized successfully')
}

// Initialize on import
initializeDatabase()

export default db
export function getDb() { return db }
