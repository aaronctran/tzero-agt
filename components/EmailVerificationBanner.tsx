'use client'

import { useState } from 'react'
import { Box, Typography, Button, IconButton } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import api from '@/lib/api'

interface EmailVerificationBannerProps {
  email: string
  onVerificationComplete?: () => void
}

export default function EmailVerificationBanner({ email, onVerificationComplete }: EmailVerificationBannerProps) {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleResendEmail = async () => {
    setLoading(true)
    setMessage('')
    try {
      await api.post('/auth/resend-verification', { email })
      setMessage('Verification email sent! Please check your inbox.')
      setTimeout(() => setMessage(''), 5000)
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to send verification email. Please try again.')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#0a3d1f', // Dark green matching theme
        borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        position: 'relative',
      }}
    >
      {/* Left arrow button */}
      <IconButton
        sx={{
          color: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          width: 32,
          height: 32,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        <ChevronLeft />
      </IconButton>

      {/* Center content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Typography
          sx={{
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Almost there! Confirm your email to start investing.
        </Typography>
        <Button
          variant="outlined"
          onClick={handleResendEmail}
          disabled={loading}
          sx={{
            borderColor: '#ffffff',
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            px: 2,
            py: 0.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            '&:hover': {
              borderColor: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:disabled': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
            },
          }}
        >
          {loading ? 'Sending...' : "Didn't get it? Resend Email"}
        </Button>
        {message && (
          <Typography
            sx={{
              color: theme.palette.primary.main,
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>

      {/* Right arrow button */}
      <IconButton
        sx={{
          color: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          width: 32,
          height: 32,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        <ChevronRight />
      </IconButton>
    </Box>
  )
}
