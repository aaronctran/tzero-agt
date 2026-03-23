'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { usePlaidLink } from 'react-plaid-link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import styles from './AddACHPaymentMethodDialog.module.css'

interface AddACHPaymentMethodDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddACHPaymentMethodDialog({
  open,
  onClose,
  onSuccess,
}: AddACHPaymentMethodDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch Plaid Link token
  useEffect(() => {
    if (open && user?.id) {
      const fetchLinkToken = async () => {
        try {
          setLoading(true)
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
    }
  }, [open, user])

  const onSuccessPlaid = async (publicToken: string, metadata: any) => {
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

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to link bank account')
      setLoading(false)
    }
  }

  const config = linkToken ? {
    token: linkToken,
    onSuccess: onSuccessPlaid,
    onExit: (err: any, metadata: any) => {
      if (err) {
        setError(err.error_message || 'Plaid Link exited with an error')
      }
      setLoading(false)
    },
    onEvent: (eventName: string, metadata: any) => {
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

  const { open: openPlaid, ready } = usePlaidLink(config)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: '#ffffff',
          borderRadius: 4,
          border: '1px solid rgba(0, 255, 136, 0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Typography variant="h6" className={styles.title}>
          Add Bank Account
        </Typography>
        <IconButton
          onClick={onClose}
          className={styles.closeButton}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        {error && (
          <Alert severity="error" className={styles.alert}>
            {error}
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
                openPlaid()
              }
            }}
            disabled={!linkToken || !ready || loading}
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
      </DialogContent>
    </Dialog>
  )
}
