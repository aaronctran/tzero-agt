'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

const countryCodes = [
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+91', label: 'IN +91' },
  { code: '+61', label: 'AU +61' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+81', label: 'JP +81' },
  { code: '+86', label: 'CN +86' },
]

export default function FinishSignupPage() {
  const theme = useTheme()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, completeSignup } = useAuth()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingEmail = localStorage.getItem('pendingEmail')
      if (pendingEmail) {
        setEmail(pendingEmail)
      } else if (!authLoading && !isAuthenticated) {
        router.push('/auth')
      }
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: '#ffffff',
      borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
    },
    '& .MuiInputLabel-root': {
      color: '#888888',
      fontWeight: 600,
      '&.Mui-focused': { color: '#cccccc' },
    },
    '& .MuiInputBase-input': { color: '#ffffff' },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName || !lastName || !phoneNumber) {
      setError('Please fill in all required fields')
      return
    }

    if (!termsAgreed) {
      setError('You must agree to the terms and conditions')
      return
    }

    const pendingToken = localStorage.getItem('pendingToken')

    setLoading(true)
    try {
      await completeSignup({
        pendingToken,
        email,
        firstName,
        lastName,
        phoneNumber,
        countryCode,
        termsAgreed: true,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Box sx={{ width: '100%', maxWidth: 440, px: 3, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            onClick={() => router.push('/auth')}
            sx={{ color: '#ffffff', mr: 1.5 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
            Complete Sign Up
          </Typography>
        </Box>

        <Typography sx={{ color: '#aaa', fontSize: '0.9375rem', mb: 3, lineHeight: 1.6 }}>
          Just a few more details to set up your account.
        </Typography>

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

        <Box component="form" onSubmit={handleSubmit}>
          {/* Email (read-only) */}
          <TextField
            fullWidth
            label="Email"
            value={email}
            disabled
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: '#888',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
              '& .MuiInputLabel-root': { color: '#666', fontWeight: 600 },
              '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#888' },
            }}
          />

          {/* Name Fields */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              sx={textFieldSx}
            />
          </Box>

          {/* Phone Number */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl sx={{ minWidth: 110, ...textFieldSx }}>
              <InputLabel sx={{ color: '#888', fontWeight: 600, '&.Mui-focused': { color: '#cccccc' } }}>
                Code
              </InputLabel>
              <Select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                label="Code"
                sx={{ color: '#ffffff' }}
              >
                {countryCodes.map((cc) => (
                  <MenuItem key={cc.code} value={cc.code}>
                    {cc.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              sx={textFieldSx}
            />
          </Box>

          {/* Terms */}
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  '&.Mui-checked': { color: theme.palette.primary.main },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.8125rem', color: '#aaa' }}>
                I agree to the Terms of Service and Privacy Policy
              </Typography>
            }
            sx={{ mb: 3, alignItems: 'flex-start' }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: theme.palette.text.primary }} />
            ) : (
              'Create Account'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
