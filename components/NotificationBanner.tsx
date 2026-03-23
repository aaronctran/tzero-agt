'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { ChevronLeft, ChevronRight, CheckCircle } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  type: 'email_verification' | 'opportunity' | 'info' | 'account_completion'
  title: string
  actionText?: string
  actionUrl?: string
  onAction?: () => void
  backgroundColor?: string
  borderColor?: string
}

export default function NotificationBanner() {
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before using auth state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Build notifications array based on user state
  const notifications: Notification[] = []

  // Only show notifications if user is authenticated and component is mounted
  if (mounted && isAuthenticated && user) {
    // Email verification notification
    if (!user.emailVerified) {
      notifications.push({
        id: 'email_verification',
        type: 'email_verification',
        title: 'Almost there! Confirm your email to start investing.',
        actionText: "Didn't get it? Resend Email",
        backgroundColor: '#8B0000', // Burgundy color
        borderColor: 'rgba(255, 255, 255, 0.2)',
        onAction: async () => {
          setLoading(true)
          setMessage('')
          try {
            await api.post('/auth/resend-verification', { email: user.email })
            setShowSuccessDialog(true)
          } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to send verification email. Please try again.')
            setTimeout(() => setMessage(''), 5000)
          } finally {
            setLoading(false)
          }
        },
      })
    }

    // Account completion notification - only show if onboarding is not completed
    if (!user.onboardingCompleted) {
      notifications.push({
        id: 'account_completion',
        type: 'account_completion',
        title: 'Complete your investment account',
        actionText: 'Complete Now',
        actionUrl: '/account/setup',
        backgroundColor: '#1976d2', // Blue color
        borderColor: 'rgba(255, 255, 255, 0.2)',
      })
    }
  }

  // eslint-disable-next-line
  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === notifications.length - 1 ? 0 : prev + 1))
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [notifications.length])

  // Don't show banner if no notifications, user is not authenticated, or not mounted
  if (!mounted || notifications.length === 0 || !isAuthenticated) {
    return null
  }

  const currentNotification = notifications[currentIndex]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? notifications.length - 1 : prev - 1))
    setMessage('') // Clear any messages when navigating
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === notifications.length - 1 ? 0 : prev + 1))
    setMessage('') // Clear any messages when navigating
  }

  const handleAction = () => {
    if (currentNotification.onAction) {
      currentNotification.onAction()
    } else if (currentNotification.actionUrl) {
      window.location.href = currentNotification.actionUrl
    }
  }

  const bannerBackground = currentNotification.backgroundColor || '#0a3d1f'
  const bannerBorder = currentNotification.borderColor || 'rgba(0, 255, 136, 0.2)'

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: bannerBackground,
        borderBottom: `1px solid ${bannerBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 0.5, sm: 1.5, md: 2, lg: 3 },
        py: { xs: 1, sm: 1.25, md: 1.5, lg: 1.75 },
        position: 'fixed',
        top: { xs: 56, sm: 64 }, // Position below header
        left: 0,
        right: 0,
        overflow: 'hidden',
        transition: 'background-color 0.3s ease-in-out, border-color 0.3s ease-in-out',
        flexDirection: 'row',
        gap: { xs: 0.5, sm: 1, md: 0 },
        minHeight: { xs: 'auto', sm: 44, md: 48, lg: 52 },
        zIndex: 1200,
      }}
    >
      {/* Left arrow button */}
      {notifications.length > 1 && (
        <IconButton
          onClick={handlePrevious}
          sx={{
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            width: { xs: 28, sm: 30, md: 32, lg: 36 },
            height: { xs: 28, sm: 30, md: 32, lg: 36 },
            minWidth: { xs: 28, sm: 30, md: 32, lg: 36 },
            flexShrink: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ChevronLeft sx={{ fontSize: { xs: 18, sm: 20, md: 24, lg: 26 } }} />
        </IconButton>
      )}

      {/* Center content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: { xs: 0.75, sm: 1.5, md: 2, lg: 2.5 }, 
        minHeight: { xs: 'auto', sm: 40, md: 44, lg: 48 },
        flexDirection: 'row',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        px: { xs: 0.5, sm: 0.75, md: 0, lg: 0 },
        pb: { xs: notifications.length > 1 ? 2.5 : 0, sm: 0 },
      }}>
        <Typography
          sx={{
            color: '#ffffff',
            fontWeight: 600,
            fontSize: { xs: '12px', sm: '13px', md: '15px', lg: '16px' },
            textAlign: 'center',
            lineHeight: { xs: 1.3, sm: 1.4, md: 1.5 },
            flex: { xs: '1 1 auto', sm: 'none' },
            minWidth: 0,
            maxWidth: { xs: '100%', sm: 'none' },
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {currentNotification.title}
        </Typography>
        {currentNotification.actionText && (
          <Button
            variant="outlined"
            onClick={handleAction}
            disabled={loading}
            sx={{
              borderColor: '#ffffff',
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              px: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
              py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '11px', sm: '12px', md: '14px', lg: '15px' },
              whiteSpace: 'nowrap',
              flexShrink: 0,
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
            {loading ? 'Sending...' : currentNotification.actionText}
          </Button>
        )}
        {message && (
          <Typography
            sx={{
              color: theme.palette.primary.main,
              fontSize: { xs: '11px', sm: '12px', md: '13px', lg: '14px' },
              fontWeight: 500,
              whiteSpace: { xs: 'normal', sm: 'nowrap', md: 'nowrap' },
              textAlign: 'center',
              flex: { xs: '1 1 100%', sm: 'none' },
              width: { xs: '100%', sm: 'auto' },
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {message}
          </Typography>
        )}
      </Box>

      {/* Right arrow button */}
      {notifications.length > 1 && (
        <IconButton
          onClick={handleNext}
          sx={{
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            width: { xs: 28, sm: 30, md: 32, lg: 36 },
            height: { xs: 28, sm: 30, md: 32, lg: 36 },
            minWidth: { xs: 28, sm: 30, md: 32, lg: 36 },
            flexShrink: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ChevronRight sx={{ fontSize: { xs: 18, sm: 20, md: 24, lg: 26 } }} />
        </IconButton>
      )}

      {/* Notification indicators (dots) */}
      {notifications.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 6, sm: 5, md: 4, lg: 4 },
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: { xs: 0.5, sm: 0.5, md: 0.5, lg: 0.75 },
            zIndex: 1,
          }}
        >
          {notifications.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: { xs: 6, sm: 6, md: 7, lg: 8 },
                height: { xs: 6, sm: 6, md: 7, lg: 8 },
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                transition: 'background-color 0.2s ease-in-out',
              }}
            />
          ))}
        </Box>
      )}

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        PaperProps={{
          sx: {
            
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            minWidth: { xs: '90%', sm: 400 },
            maxWidth: { xs: '90%', sm: 500 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: '#ffffff',
            pb: 1,
          }}
        >
          <CheckCircle sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            Email Sent Successfully
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#cccccc', fontSize: '15px', lineHeight: 1.6 }}>
            A verification email has been sent successfully to:
          </Typography>
          <Typography
            sx={{
              color: theme.palette.primary.main,
              fontSize: '16px',
              fontWeight: 600,
              mt: 1,
              wordBreak: 'break-word',
            }}
          >
            {user?.email}
          </Typography>
          <Typography sx={{ color: '#cccccc', fontSize: '14px', mt: 2, lineHeight: 1.6 }}>
            Please check your inbox and click the verification link to complete your email verification.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setShowSuccessDialog(false)}
            variant="contained"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#333333',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#00E677',
              },
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
