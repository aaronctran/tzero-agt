'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material'
import { Close, CreditCard } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AddCreditCardDialog.module.css'

interface AddCreditCardDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddCreditCardDialog({
  open,
  onClose,
  onSuccess,
}: AddCreditCardDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [billingAddress, setBillingAddress] = useState('')

  // Fetch user's legal name from onboarding data
  useEffect(() => {
    if (open && user?.id) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/profile/onboarding-data')
          if (response.ok) {
            const data = await response.json()
            const onboardingData = data.onboardingData
            
            if (onboardingData) {
              const nameParts = []
              if (onboardingData.legal_first_name) nameParts.push(onboardingData.legal_first_name)
              if (onboardingData.legal_middle_name) nameParts.push(onboardingData.legal_middle_name)
              if (onboardingData.legal_last_name) nameParts.push(onboardingData.legal_last_name)
              
              if (nameParts.length > 0) {
                setCardholderName(nameParts.join(' '))
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }

      fetchUserData()
    }
  }, [open, user])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  // Detect card brand from number
  const getCardBrand = (number: string): string => {
    const num = number.replace(/\s/g, '')
    if (/^4/.test(num)) return 'VISA'
    if (/^5[1-5]/.test(num)) return 'MASTERCARD'
    if (/^3[47]/.test(num)) return 'AMEX'
    if (/^6(?:011|5)/.test(num)) return 'DISCOVER'
    return 'UNKNOWN'
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleExpMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2)
    setExpMonth(value)
  }

  const handleExpYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setExpYear(value)
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvv(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!cardholderName.trim()) {
      setError('Cardholder name is required')
      setLoading(false)
      return
    }

    const cardNumberClean = cardNumber.replace(/\s/g, '')
    if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
      setError('Invalid card number')
      setLoading(false)
      return
    }

    if (!expMonth || expMonth.length !== 2 || parseInt(expMonth) < 1 || parseInt(expMonth) > 12) {
      setError('Invalid expiration month')
      setLoading(false)
      return
    }

    if (!expYear || expYear.length !== 4) {
      setError('Invalid expiration year')
      setLoading(false)
      return
    }

    if (!cvv || cvv.length < 3) {
      setError('Invalid CVV')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/payment-methods/add-credit-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardholderName: cardholderName.trim(),
          cardNumber: cardNumberClean,
          cardLastFour: cardNumberClean.slice(-4),
          cardBrand: getCardBrand(cardNumberClean),
          expMonth: parseInt(expMonth),
          expYear: parseInt(expYear),
          billingAddress: billingAddress.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add credit card')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to add credit card')
      setLoading(false)
    }
  }

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
          Add Credit Card
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
          <Box className={styles.errorAlert}>
            <Typography variant="body2" sx={{ color: '#ff4d4d' }}>
              {error}
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} className={styles.form}>
          <TextField
            fullWidth
            label="Name on Card"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
            disabled={loading}
            sx={textFieldStyles}
          />

          <TextField
            fullWidth
            label="Card number"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            required
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CreditCard sx={{ color: '#888888', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <Box className={styles.row}>
            <TextField
              label="MM"
              value={expMonth}
              onChange={handleExpMonthChange}
              placeholder="MM"
              required
              disabled={loading}
              sx={{ ...textFieldStyles, flex: 1 }}
            />
            <TextField
              label="YYYY"
              value={expYear}
              onChange={handleExpYearChange}
              placeholder="YYYY"
              required
              disabled={loading}
              sx={{ ...textFieldStyles, flex: 1 }}
            />
            <TextField
              label="CVV"
              value={cvv}
              onChange={handleCvvChange}
              placeholder="CVV"
              type="password"
              required
              disabled={loading}
              sx={{ ...textFieldStyles, flex: 1 }}
            />
          </Box>

          <TextField
            fullWidth
            label="Billing Address"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            disabled={loading}
            sx={textFieldStyles}
          />

          <Box className={styles.buttonContainer}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              className={styles.submitButton}
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
              {loading ? 'Processing...' : 'Add Credit Card'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00ff88',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#888888',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#00ff88',
  },
}
