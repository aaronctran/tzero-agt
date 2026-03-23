'use client'

import { Box, Typography, Button, Paper, Grid } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/navigation'
import { TrendingUp, AccountBalance } from '@mui/icons-material'
import styles from './PortfolioSummaryCard.module.css'

interface PortfolioSummaryCardProps {
  totalValue: number
  investedAmount: number
  cashAvailable: number
  onInvestedClick?: () => void
}

export default function PortfolioSummaryCard({
  totalValue,
  investedAmount,
  cashAvailable,
  onInvestedClick,
}: PortfolioSummaryCardProps) {
  const theme = useTheme()
  const router = useRouter()

  const handleDepositClick = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      if (response.status === 401) {
        router.push('/auth')
        return
      }
      if (!response.ok) {
        return
      }
      const data = await response.json()
      const hasMethods = Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0
      router.push(hasMethods ? '/account/banking/deposit' : '/account/banking/add-payment-method')
    } catch (error) {
      console.error('Error checking payment methods:', error)
    }
  }

  return (
    <Paper className={styles.card}>
      <Box className={styles.header}>
        <Typography variant="h6" className={styles.title}>
          Portfolio Overview
        </Typography>
      </Box>

      <Box className={styles.content}>
        <Box className={styles.mainValue}>
          <Typography variant="h3" className={styles.totalValue}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2" className={styles.totalLabel}>
            Total Portfolio Value
          </Typography>
        </Box>

        <Grid container spacing={2} className={styles.statsGrid}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Box 
              className={styles.statCard}
              onClick={onInvestedClick}
              sx={{
                cursor: onInvestedClick ? 'pointer' : 'default',
                '&:hover': onInvestedClick ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                } : {},
              }}
            >
              <Box className={styles.statIcon} sx={{ backgroundColor: 'rgba(0, 188, 212, 0.15)' }}>
                <TrendingUp sx={{ color: '#00bcd4', fontSize: 24 }} />
              </Box>
              <Box className={styles.statContent}>
                <Typography variant="body2" className={styles.statLabel}>
                  Invested
                </Typography>
                <Typography variant="h6" className={styles.statValue}>
                  ${investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Box className={styles.statCard}>
              <Box className={styles.statIcon} sx={{ backgroundColor: 'rgba(136, 136, 136, 0.15)' }}>
                <AccountBalance sx={{ color: '#888888', fontSize: 24 }} />
              </Box>
              <Box className={styles.statContent}>
                <Typography variant="body2" className={styles.statLabel}>
                  Cash Available
                </Typography>
                <Typography variant="h6" className={styles.statValue}>
                  ${cashAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Button
              variant="contained"
              fullWidth
              className={styles.depositButton}
              onClick={handleDepositClick}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: '#000000',
                fontWeight: 600,
                py: 2,
                '&:hover': {
                  backgroundColor: '#00cc6a',
                },
              }}
            >
              Deposit Funds
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  )
}
