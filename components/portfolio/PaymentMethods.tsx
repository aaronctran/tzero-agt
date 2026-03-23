'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import AvailablePaymentMethods from './AvailablePaymentMethods'
import { mapPaymentMethodData, PaymentMethodData } from './paymentMethodHelpers'
import styles from './PaymentMethods.module.css'


export default function PaymentMethods() {
  const router = useRouter()
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingDefault, setUpdatingDefault] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/payment-methods')
        if (response.ok) {
          const data = await response.json()
          const methods = data.paymentMethods.map(mapPaymentMethodData)
          setPaymentMethods(methods)
        } else if (response.status === 401) {
          // User not authenticated, redirect to login
          router.push('/auth')
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
 }, [user,router])

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!user?.id) return

    setUpdatingDefault(paymentMethodId)
    try {
      const response = await fetch('/api/payment-methods/set-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
        }),
      })

      if (response.ok) {
        // Refresh payment methods list
        const fetchResponse = await fetch('/api/payment-methods')
        if (fetchResponse.ok) {
          const data = await fetchResponse.json()
          const methods = data.paymentMethods.map(mapPaymentMethodData)
          setPaymentMethods(methods)
        }
      }
    } catch (error) {
      console.error('Error setting default payment method:', error)
    } finally {
      setUpdatingDefault(null)
    }
  }

  return (
    <Box className={styles.container}>
      {/* Header with Back button */}
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/account/banking')}
          className={styles.backButton}
        >
          Back
        </Button>
        <Box className={styles.titleSection}>
          <Typography variant="h4" className={styles.title}>
            PAYMENT METHOD
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            All info is kept highly secure.
          </Typography>
        </Box>
      </Box>

      {/* Add Payment Method Button */}
      <Box className={styles.addButtonContainer}>
        <Button
          variant="outlined"
          className={styles.addButton}
          onClick={() => {
            router.push('/account/banking/add-payment-method')
          }}
        >
          Add Payment Method
        </Button>
      </Box>

      {/* Available Payment Methods Container */}
      <AvailablePaymentMethods
        paymentMethods={paymentMethods}
        loading={loading}
        updatingDefault={updatingDefault}
        onSetDefault={handleSetDefault}
      />
    </Box>
  )
}
