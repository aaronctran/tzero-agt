'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

function ForgotPasswordContent() {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setMessage('Password reset instructions have been sent to your email address.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh',  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh',  color: '#ffffff' }}>
      <Container maxWidth="sm" sx={{ py: 4, px: 3 }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            onClick={() => router.push('/auth')}
            sx={{
              color: '#ffffff',
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Forgot Password
          </Typography>
        </Box>

        {message && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              color: theme.palette.primary.main,
              border: `1px solid rgba(0, 255, 136, 0.3)`,
            }}
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: '#ff6b6b',
              border: '1px solid rgba(211, 47, 47, 0.3)',
            }}
          >
            {error}
          </Alert>
        )}

        <Typography
          sx={{
            mb: 3,
            color: '#cccccc',
            lineHeight: 1.6,
          }}
        >
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                
                borderRadius: 3,
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#d0d0d0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#b0b0b0',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#666666',
                '&.Mui-focused': {
                  color: '#888888',
                },
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="outlined"
            disabled={loading}
            sx={{
              py: 1.5,
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
              backgroundColor: '#ffffff',
              color: theme.palette.primary.main,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              '&:hover': {
                borderColor: '#00E677',
                backgroundColor: '#f0fff0',
                borderWidth: 2,
              },
              '&:disabled': {
                borderColor: 'rgba(0, 255, 136, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                color: 'rgba(0, 255, 136, 0.5)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
            ) : (
              'Send Reset Instructions'
            )}
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E677',
          }}
        >
          <CircularProgress sx={{ color: '#00E677' }} />
        </Box>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  )
}
