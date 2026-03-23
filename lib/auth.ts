import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Extract the authenticated user ID from the request.
 * Checks cookies first (set by API routes), then falls back to
 * the Authorization header (sent by the Axios client from localStorage).
 */
export async function getAuthUserId(request?: NextRequest): Promise<string | null> {
  let token: string | undefined

  // Try cookies first
  try {
    const cookieStore = await cookies()
    token = cookieStore.get('auth_token')?.value
  } catch {
    // cookies() may fail in some contexts
  }

  // Fallback to Authorization header
  if (!token && request) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token) return null

  try {
    const tokenData = Buffer.from(token, 'base64').toString('utf-8')
    const userId = tokenData.split(':')[0]
    return userId || null
  } catch {
    return null
  }
}
