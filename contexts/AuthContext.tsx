'use client'

import { createContext, useContext, useState, useLayoutEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  countryCode?: string
  emailVerified?: boolean
  onboardingCompleted?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  authenticate: (email: string, password: string) => Promise<void>
  completeSignup: (data: any) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useLayoutEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('auth_token')
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          localStorage.removeItem('user')
          localStorage.removeItem('auth_token')
          setUser(null)
        }
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const authenticate = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/authenticate', { email, password })

      if (response.data.needsCompletion) {
        localStorage.setItem('pendingToken', response.data.pendingToken)
        localStorage.setItem('pendingEmail', response.data.email)
        router.push('/auth/finish-signup')
        return
      }

      const { token, user: userData } = response.data
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Authentication failed')
    }
  }

  const completeSignup = async (data: any) => {
    try {
      const response = await api.post('/auth/complete-signup', data)
      const { token, user: userData } = response.data

      localStorage.removeItem('pendingToken')
      localStorage.removeItem('pendingEmail')
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete signup')
    }
  }

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await api.get('/auth/user')
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('pendingToken')
    localStorage.removeItem('pendingEmail')
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticate,
        completeSignup,
        refreshUser,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
