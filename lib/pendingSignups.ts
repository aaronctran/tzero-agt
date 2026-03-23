// Pending signups storage in database
import db from './db'

interface PendingSignup {
  email: string
  password: string
  expiresAt: number
}

export function savePendingSignup(email: string, password: string): string {
  try {
    const token = Buffer.from(`${email}:${Date.now()}:${Math.random()}`).toString('base64')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    
    const stmt = db.prepare(`
      INSERT INTO pending_signups (token, email, password, expires_at)
      VALUES (?, ?, ?, ?)
    `)
    
    stmt.run(token, email.toLowerCase(), password, expiresAt)
    
    return token
  } catch (error) {
    console.error('Error saving pending signup:', error)
    throw error
  }
}

export function getPendingSignup(token: string): PendingSignup | null {
  try {
    // First, clean up expired signups
    try {
      db.prepare("DELETE FROM pending_signups WHERE expires_at < datetime('now')").run()
    } catch (cleanupError) {
      // Ignore cleanup errors
      console.warn('Failed to cleanup expired signups:', cleanupError)
    }
    
    const stmt = db.prepare(`
      SELECT email, password, expires_at 
      FROM pending_signups 
      WHERE token = ? AND expires_at > datetime('now')
    `)
    
    const row = stmt.get(token) as { email: string; password: string; expires_at: string } | undefined
    
    if (!row) {
      return null
    }
    
    return {
      email: row.email,
      password: row.password,
      expiresAt: new Date(row.expires_at).getTime(),
    }
  } catch (error) {
    console.error('Error getting pending signup:', error)
    return null
  }
}

export function deletePendingSignup(token: string): void {
  try {
    const stmt = db.prepare('DELETE FROM pending_signups WHERE token = ?')
    stmt.run(token)
  } catch (error) {
    console.error('Error deleting pending signup:', error)
    // Don't throw - deletion is not critical
  }
}
