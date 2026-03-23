'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
} from '@mui/material'
import { ArrowBack, CreditCard, CheckCircle } from '@mui/icons-material'
import styles from './AddPaymentMethod.module.css'

interface PaymentMethodOption {
  id: string
  name: string
  icon: React.ReactNode
  features: string[]
  recommended?: boolean
}

const paymentMethodOptions: PaymentMethodOption[] = [
  {
    id: 'credit',
    name: 'Credit Card',
    icon: <CreditCard />,
    features: ['Angel Investments'],
  },
]

export default function AddPaymentMethod() {
  const router = useRouter()

  const handleSelect = (methodId: string) => {
    if (methodId === 'credit') {
      router.push('/account/banking/add-payment-method/credit-card')
    }
  }

  return (
    <Box className={styles.container}>
      {/* Header with Back button */}
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/account/banking/payment-methods')}
          className={styles.backButton}
        >
          Back
        </Button>
        <Typography variant="h4" className={styles.title}>
          ADD PAYMENT METHOD
        </Typography>
      </Box>

      {/* Payment Method Options */}
      <Box className={styles.optionsContainer}>
        {paymentMethodOptions.map((option) => (
          <Paper key={option.id} className={styles.optionCard}>
            {option.recommended && (
              <Chip
                label="RECOMMENDED"
                className={styles.recommendedChip}
                size="small"
              />
            )}
            <Box className={styles.cardContent}>
              <Box className={styles.cardHeader}>
                <Box className={styles.iconContainer}>
                  {option.icon}
                </Box>
                <Typography variant="h6" className={styles.optionName}>
                  {option.name}
                </Typography>
              </Box>
              <Box className={styles.featuresList}>
                {option.features.map((feature, index) => (
                  <Box key={index} className={styles.featureItem}>
                    <CheckCircle className={styles.checkIcon} />
                    <Typography variant="body2" className={styles.featureText}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant="outlined"
                className={styles.selectButton}
                onClick={() => handleSelect(option.id)}
              >
                Select
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}
