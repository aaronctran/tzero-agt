'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Box, Typography, Container, Paper, Button, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Profile from '@/components/profile/Profile'

export default function ProfilePage() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [onboardingData, setOnboardingData] = useState<any>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, authLoading, router])

  // Load onboarding data
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const response = await api.get('/profile/onboarding-data')
        if (response.data.onboardingData) {
          setOnboardingData(response.data.onboardingData)
        }
      } catch (error: any) {
        console.error('Error loading onboarding data:', error)
        // If 404, it means no onboarding data exists yet
        if (error.response?.status !== 404) {
          console.error('Failed to load onboarding data')
        }
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user) {
      loadOnboardingData()
    }
  }, [user, isAuthenticated])

  if (authLoading || loading) {
    return (
      <Box sx={{ minHeight: '100vh',  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh',  color: '#ffffff' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Header with back button and logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, sm: 4 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/')}
            sx={{
              color: '#ffffff',
              mr: { xs: 1, sm: 2 },
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ height: { xs: 30, sm: 35 }, position: 'relative' }}>
              <Image
                src="/tzero-logo.png"
                alt="tZERO Logo"
                width={140}
                height={35}
                style={{
                  height: 'auto',
                  width: 'auto',
                  maxHeight: '35px',
                  objectFit: 'contain',
                }}
                priority
              />
            </Box>
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          Profile
        </Typography>

        <Profile onboardingData={onboardingData} setOnboardingData={setOnboardingData} />
      </Container>
    </Box>
  )
}
