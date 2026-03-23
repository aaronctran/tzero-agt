'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import LandingPage from '@/components/LandingPage'
import EmailVerificationBannerWrapper from '@/components/EmailVerificationBannerWrapper'
import { Box } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before using auth state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Calculate if banner will be visible - use mounted state to prevent hydration mismatch
  const hasNotifications = mounted && isAuthenticated && user && (!user.emailVerified || true) // Account completion always shows
  
  // Calculate top padding: header (56/64) + banner if visible (approx 48-52)
  const topPadding = hasNotifications 
    ? { xs: '104px', sm: '116px' } // Header + Banner
    : { xs: '56px', sm: '64px' }   // Just Header
  
  return (
    <main>
      <Header />
      <EmailVerificationBannerWrapper />
      <Box sx={{ pt: topPadding }}>
        <LandingPage />
      </Box>
    </main>
  )
}
