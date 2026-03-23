'use client'

import { Box, Typography, Button } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { InfoOutlined } from '@mui/icons-material'
import styles from './PortfolioCircle.module.css'

interface PortfolioCircleProps {
  portfolioValue: number
  cashAvailable: number
  investedAmount: number
}

export default function PortfolioCircle({
  portfolioValue,
  cashAvailable,
  investedAmount,
}: PortfolioCircleProps) {
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
    <Box className={styles.portfolioContainer}>
      {/* Circular Progress Indicator with open bottom */}
      <Box className={styles.portfolioCircleWrapper}>
        <svg className={styles.circularProgress} viewBox="0 0 200 200">
          {/* Background circle (light gray) */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 90 * 0.75} ${2 * Math.PI * 90 * 0.25}`}
            strokeDashoffset={2 * Math.PI * 90 * 0.125}
            transform="rotate(-90 100 100)"
          />
          {/* Progress circle (white border, empty pipe/progress bar style) */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 90 * 0.75} ${2 * Math.PI * 90 * 0.25}`}
            strokeDashoffset={2 * Math.PI * 90 * 0.125}
            transform="rotate(-90 100 100)"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Content - Total Portfolio Value */}
        <Box className={styles.portfolioCenter}>
          <Typography variant="h3" className={styles.valueAmount}>
            ${portfolioValue.toFixed(2)}
          </Typography>
        </Box>

        {/* Cash Available inside circle */}
        <Box className={styles.cashAvailableInside}>
          <Typography variant="body2" className={styles.cashAvailableText}>
            ${cashAvailable.toFixed(2)} Cash Available
            <InfoOutlined className={styles.infoIcon} />
          </Typography>
        </Box>

        {/* Deposit Button inside circle */}
        <Box className={styles.depositButtonContainer}>
          <Button
            variant="outlined"
            className={styles.depositButton}
            onClick={handleDepositClick}
          >
            Deposit
          </Button>
        </Box>

        {/* Bottom Left Edge - Invest */}
        <Box className={styles.breakdownLeft}>
          <Box className={styles.breakdownDot} sx={{ backgroundColor: '#00bcd4' }} />
          <Box className={styles.breakdownText}>
            <Typography variant="body2" className={styles.breakdownLabel}>
              Invest.
            </Typography>
            <Typography variant="body2" className={styles.breakdownValue}>
              ${investedAmount.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Bottom Right Edge - Cash */}
        <Box className={styles.breakdownRight}>
          <Box className={styles.breakdownText}>
            <Typography variant="body2" className={styles.breakdownLabel}>
              Cash
            </Typography>
            <Typography variant="body2" className={styles.breakdownValue}>
              ${cashAvailable.toFixed(2)}
            </Typography>
          </Box>
          <Box className={styles.breakdownDot} sx={{ backgroundColor: '#888888' }} />
        </Box>
      </Box>
    </Box>
  )
}
