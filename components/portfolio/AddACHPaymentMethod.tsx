'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { usePlaidLink } from 'react-plaid-link'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AddACHPaymentMethod.module.css'

export default function AddACHPaymentMethod() {
  const router = useRouter()
  const { user } = useAuth()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch Plaid Link token
  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!user?.id) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to create link token')
        }

        const data = await response.json()
        setLinkToken(data.link_token)
      } catch (err: any) {
        setError(err.message || 'Failed to initialize Plaid')
      } finally {
        setLoading(false)
      }
    }

    fetchLinkToken()
  }, [user])

  const onSuccess = async (publicToken: string, metadata: any) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link bank account')
      }

      setSuccess(true)
      // Redirect to payment methods page after a short delay
      setTimeout(() => {
        router.push('/account/banking/payment-methods')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to link bank account')
      setLoading(false)
    }
  }

  const config = linkToken ? {
    token: linkToken,
    onSuccess,
    onExit: (err: any, metadata: any) => {
      if (err) {
        setError(err.error_message || 'Plaid Link exited with an error')
      }
      setLoading(false)
    },
    onEvent: (eventName: string, metadata: any) => {
      // Handle Plaid Link events for debugging
      if (eventName === 'ERROR') {
        console.error('Plaid Link error:', metadata)
      }
    },
  } : {
    token: null,
    onSuccess: () => {},
    onExit: () => {},
    onEvent: () => {},
  }

  const { open, ready, exit } = usePlaidLink(config)

  if (loading && !linkToken) {
    return (
      <Box className={styles.container}>
        <Box className={styles.loadingContainer}>
          <CircularProgress sx={{ color: '#00ff88' }} />
          <Typography variant="body1" className={styles.loadingText}>
            Initializing Plaid...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box className={styles.container}>
      {/* Header with Back button */}
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/account/banking/add-payment-method')}
          className={styles.backButton}
        >
          Back
        </Button>
        <Typography variant="h4" className={styles.title}>
          Link Bank Account
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className={styles.alert}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className={styles.alert}>
          Bank account linked successfully! Redirecting...
        </Alert>
      )}

      <Box className={styles.content}>
        <Typography variant="body1" className={styles.description}>
          Securely connect your bank account using Plaid. Your banking credentials are never shared with tZERO.
        </Typography>

        <Button
          variant="contained"
          className={styles.linkButton}
          onClick={() => {
            if (linkToken && ready) {
              open()
            }
          }}
          disabled={!linkToken || !ready || loading || success}
          sx={{
            backgroundColor: '#00ff88',
            color: '#000000',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#00cc6a',
            },
            '&:disabled': {
              backgroundColor: '#2a2a2a',
              color: '#888888',
            },
          }}
        >
          {loading ? 'Processing...' : 'Continue with Plaid'}
        </Button>
      </Box>
    </Box>
  )
}
