'use client'

import { Box, Typography, CircularProgress } from '@mui/material'
import PaymentMethodCard from './PaymentMethodCard'
import styles from './AvailablePaymentMethods.module.css'

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  available: number
  displayInfo?: string
  isDefault: boolean
}

interface AvailablePaymentMethodsProps {
  paymentMethods: PaymentMethod[]
  loading: boolean
  updatingDefault: string | null
  onSetDefault: (paymentMethodId: string) => void
}

export default function AvailablePaymentMethods({
  paymentMethods,
  loading,
  updatingDefault,
  onSetDefault,
}: AvailablePaymentMethodsProps) {
  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress sx={{ color: '#00ff88' }} />
      </Box>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <Box className={styles.emptyState}>
        <Typography variant="body1" className={styles.emptyStateText}>
          No payment methods added yet
        </Typography>
        <Typography variant="body2" className={styles.emptyStateSubtext}>
          Add a payment method to get started
        </Typography>
      </Box>
    )
  }

  return (
    <Box className={styles.container}>
      <Typography variant="h6" className={styles.title}>
        Available Payment Methods
      </Typography>
      <Box className={styles.list}>
        {paymentMethods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            id={method.id}
            name={method.name}
            icon={method.icon}
            available={method.available}
            displayInfo={method.displayInfo}
            isDefault={method.isDefault}
            onSetDefault={() => onSetDefault(method.id)}
            isUpdating={updatingDefault === method.id}
          />
        ))}
      </Box>
    </Box>
  )
}
