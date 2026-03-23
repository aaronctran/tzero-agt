'use client'

import { Box, Typography, Paper, Chip, Grid } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { CalendarToday, Payment } from '@mui/icons-material'
import styles from './InvestmentCard.module.css'

interface InvestmentCardProps {
  id: string
  assetTitle: string
  amount: number
  paymentMethodType: string
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  createdAt: string
  onClick?: () => void
}

export default function InvestmentCard({
  assetTitle,
  amount,
  paymentMethodType,
  paymentStatus,
  createdAt,
  onClick,
}: InvestmentCardProps) {
  const theme = useTheme()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'TZERO_BALANCE':
        return 'tZERO Balance'
      case 'ACH':
        return 'Bank Account'
      case 'CREDIT_CARD':
        return 'Credit Card'
      default:
        return type
    }
  }

  return (
    <Paper
      className={styles.card}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 255, 136, 0.15)',
        } : {},
      }}
    >
      <Box className={styles.header}>
        <Box className={styles.titleSection}>
          <Typography variant="h6" className={styles.title}>
            {assetTitle}
          </Typography>
          <Typography variant="h5" className={styles.amount}>
            {formatCurrency(amount)}
          </Typography>
        </Box>
      </Box>

      <Box className={styles.content}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box className={styles.infoItem}>
              <Box className={styles.infoIcon}>
                <CalendarToday sx={{ fontSize: 18 }} />
              </Box>
              <Box className={styles.infoContent}>
                <Typography variant="caption" className={styles.infoLabel}>
                  Date
                </Typography>
                <Typography variant="body2" className={styles.infoValue}>
                  {formatDate(createdAt)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles.infoItem}>
              <Box className={styles.infoIcon}>
                <Payment sx={{ fontSize: 18 }} />
              </Box>
              <Box className={styles.infoContent}>
                <Typography variant="caption" className={styles.infoLabel}>
                  Payment Method
                </Typography>
                <Typography variant="body2" className={styles.infoValue}>
                  {getPaymentMethodLabel(paymentMethodType)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box className={styles.statusRow}>
          <Chip
            label={paymentStatus}
            size="small"
            className={styles.paymentChip}
            sx={{
              backgroundColor:
                paymentStatus === 'COMPLETED'
                  ? 'rgba(0, 255, 136, 0.2)'
                  : paymentStatus === 'PENDING'
                  ? 'rgba(255, 193, 7, 0.2)'
                  : 'rgba(255, 77, 77, 0.2)',
              color:
                paymentStatus === 'COMPLETED'
                  ? theme.palette.primary.main
                  : paymentStatus === 'PENDING'
                  ? '#ffc107'
                  : '#ff4d4d',
              fontSize: '12px',
              fontWeight: 600,
              height: 28,
            }}
          />
        </Box>
      </Box>
    </Paper>
  )
}
