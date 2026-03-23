'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  InputAdornment,
} from '@mui/material'
import { ArrowBack, CreditCard } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AddCreditCardPaymentMethod.module.css'

export default function AddCreditCardPaymentMethod() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [billingAddress, setBillingAddress] = useState('')

  // Fetch user's legal name from onboarding data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return

      try {
        const response = await fetch('/api/profile/onboarding-data')
        if (response.ok) {
          const data = await response.json()
          const onboardingData = data.onboardingData
          
          if (onboardingData) {
            // Build full legal name
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
  }, [user])

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

      setSuccess(true)
      setTimeout(() => {
        router.push('/account/banking/payment-methods')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to add credit card')
      setLoading(false)
    }
  }

  const cardBrand = cardNumber ? getCardBrand(cardNumber) : null
  const cardLastFour = cardNumber.replace(/\s/g, '').slice(-4)

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
          ADD PAYMENT METHOD
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className={styles.alert}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className={styles.alert}>
          Credit card added successfully! Redirecting...
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} className={styles.form}>
        {/* Name on Card */}
        <TextField
          fullWidth
          label="Name on Card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className={styles.textField}
          required
          disabled={loading || success}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1a1a1a',
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
          }}
        />

        {/* Card Number */}
        <TextField
          fullWidth
          label="Card number"
          value={cardNumber}
          onChange={handleCardNumberChange}
          className={styles.textField}
          placeholder="0000 0000 0000 0000"
          required
          disabled={loading || success}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CreditCard sx={{ color: '#888888', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: cardBrand && cardLastFour ? (
              <InputAdornment position="end">
                <Box className={styles.cardBrandBadge}>
                  <Typography variant="caption" className={styles.cardBrandText}>
                    {cardBrand === 'VISA' ? 'VISA' : cardBrand === 'MASTERCARD' ? 'MC' : cardBrand}
                  </Typography>
                  <Typography variant="caption" className={styles.cardLastFour}>
                    {cardLastFour}
                  </Typography>
                </Box>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1a1a1a',
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
          }}
        />

        {/* Expiration and CVV Row */}
        <Box className={styles.row}>
          <TextField
            label="MM"
            value={expMonth}
            onChange={handleExpMonthChange}
            className={styles.textField}
            placeholder="MM"
            required
            disabled={loading || success}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a1a1a',
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
            }}
          />
          <TextField
            label="YYYY"
            value={expYear}
            onChange={handleExpYearChange}
            className={styles.textField}
            placeholder="YYYY"
            required
            disabled={loading || success}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a1a1a',
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
            }}
          />
          <TextField
            label="CVV"
            value={cvv}
            onChange={handleCvvChange}
            className={styles.textField}
            placeholder="CVV"
            type="password"
            required
            disabled={loading || success}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a1a1a',
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
            }}
          />
        </Box>

        {/* Billing Address */}
        <TextField
          fullWidth
          label="Billing Address"
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          className={styles.textField}
          disabled={loading || success}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1a1a1a',
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
          }}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          className={styles.submitButton}
          disabled={loading || success}
          sx={{
            backgroundColor: '#00ff88',
            color: '#000000',
            fontWeight: 600,
            fontSize: '16px',
            textTransform: 'none',
            padding: '14px 32px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#00cc6a',
            },
            '&:disabled': {
              backgroundColor: '#2a2a2a',
              color: '#888888',
            },
          }}
        >
          {loading ? 'Processing...' : 'Add Payment Method'}
        </Button>
      </Box>
    </Box>
  )
}
