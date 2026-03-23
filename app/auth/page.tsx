'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import styles from './page.module.css'

export default function AuthPage() {
  const theme = useTheme()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <Box className={styles.page} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.centered}>
        {/* Header with back button */}
        <Box className={styles.header}>
          <IconButton
            component={Link}
            href="/"
            className={styles.backButton}
            aria-label="Back to home"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" className={styles.headerTitle}>
            Sign In / Sign Up
          </Typography>
        </Box>

        {/* Auth Form */}
        <Box className={styles.authContent}>
          <AuthForm />
        </Box>
      </Box>
    </Box>
  )
}
