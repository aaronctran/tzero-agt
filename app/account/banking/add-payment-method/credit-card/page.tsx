'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import AccountLayout from '@/components/portfolio/AccountLayout'
import AddCreditCardPaymentMethod from '@/components/portfolio/AddCreditCardPaymentMethod'

export default function CreditCardPaymentMethodPage() {
  const theme = useTheme()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <Header />
      <Box sx={{ pt: '64px' }}>
        <AccountLayout>
          <AddCreditCardPaymentMethod />
        </AccountLayout>
      </Box>
    </Box>
  )
}
