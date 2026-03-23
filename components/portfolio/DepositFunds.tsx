'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  InputBase,
  Radio,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { mapPaymentMethodData, PaymentMethodData } from './paymentMethodHelpers'
import styles from './DepositFunds.module.css'

export default function DepositFunds() {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('500')
  const [balance, setBalance] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const [methodsResponse, balanceResponse] = await Promise.all([
          fetch('/api/payment-methods'),
          fetch('/api/banking/balance'),
        ])

        if (methodsResponse.status === 401 || balanceResponse.status === 401) {
          router.push('/auth')
          return
        }

        if (!methodsResponse.ok) {
          throw new Error('Failed to fetch payment methods')
        }

        const methodsData = await methodsResponse.json()
        const methods = methodsData.paymentMethods.map(mapPaymentMethodData)
        if (!methods.length) {
          router.push('/account/banking/payment-methods')
          return
        }
        setPaymentMethods(methods)
        const defaultMethod = methods.find((method: any) => method.isDefault) || methods[0]
        setSelectedMethodId(defaultMethod?.id || null)

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setBalance(Number(balanceData.balance) || 0)
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [router])

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.id === selectedMethodId) || null,
    [paymentMethods, selectedMethodId]
  )

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value)
  }

  const handleConfirmDeposit = () => {
    if (!selectedMethod) return
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return
    const submitDeposit = async () => {
      try {
        setSubmitting(true)
        const response = await fetch('/api/banking/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: numericAmount,
            paymentMethodId: selectedMethod.id,
          }),
        })

        if (response.status === 401) {
          router.push('/auth')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to create deposit')
        }

        const balanceResponse = await fetch('/api/banking/balance')
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setBalance(Number(balanceData.balance) || 0)
        }
      } catch (error) {
        console.error('Error creating deposit:', error)
      } finally {
        setSubmitting(false)
      }
    }

    submitDeposit()
  }

  const selectMethod = (methodId: string) => {
    setSelectedMethodId(methodId)
  }

  const isConfirmDisabled = !selectedMethod || Number(amount) <= 0 || submitting

  return (
    <Box
      className={styles.container}
      sx={{
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/account/banking')}
          className={styles.backButton}
        >
          Back
        </Button>
      </Box>

      <Box className={styles.content}>
        <Box className={styles.summary}>
          <Typography className={styles.accountLabel} color="text.secondary">
            Individual Account
          </Typography>
          <Typography variant="h3" className={styles.title} color="text.primary">
            DEPOSIT TO STARTENGINE
          </Typography>
          <Typography className={styles.balance} color="text.secondary">
            Current Balance: ${balance.toFixed(2)}
          </Typography>
        </Box>

        <Box
          className={styles.panel}
          sx={{
            backgroundColor: 'background.paper',
            boxShadow: 3,
          }}
        >
          {loading ? (
            <Box className={styles.loading}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Box
                className={styles.amountRow}
                sx={{
                  backgroundColor: 'action.hover',
                  borderColor: 'divider',
                }}
              >
                <Typography className={styles.amountLabel} color="text.secondary">
                  Deposit Amount:
                </Typography>
                <Typography className={styles.amountPrefix} color="text.secondary">
                  $
                </Typography>
                <InputBase
                  className={styles.amountInput}
                  type="number"
                  inputProps={{ min: 0, 'aria-label': 'Deposit amount' }}
                  value={amount}
                  onChange={handleAmountChange}
                  sx={{
                    color: 'text.primary',
                    '& input': {
                      textAlign: 'center',
                    },
                  }}
                />
              </Box>

              <Box className={styles.methodList}>
                {paymentMethods.map((method) => {
                  const isSelected = method.id === selectedMethodId
                  return (
                    <Box
                      key={method.id}
                      className={styles.methodItem}
                      onClick={() => selectMethod(method.id)}
                      sx={{
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        backgroundColor: isSelected ? 'action.selected' : 'transparent',
                      }}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          selectMethod(method.id)
                        }
                      }}
                    >
                      <Box className={styles.methodInfo} sx={{ color: 'text.primary' }}>
                        <Box className={styles.methodNameRow}>
                          <Box className={styles.methodLabel}>
                            {method.name}
                            {method.displayInfo ? ` • ${method.displayInfo}` : ''}
                          </Box>
                          <Box className={styles.methodAvailable} style={{ color: 'inherit', opacity: 0.7 }}>
                            ${method.available.toFixed(2)} Available
                          </Box>
                        </Box>
                      </Box>
                      <Radio
                        checked={isSelected}
                        onChange={() => selectMethod(method.id)}
                        color="primary"
                      />
                    </Box>
                  )
                })}
              </Box>

              <Typography className={styles.notice} color="text.secondary">
                Notice: Funds can only be withdrawn back to the bank account used to deposit.
              </Typography>

              <Typography className={styles.limit} color="text.secondary">
                $250,000 Daily Limit
              </Typography>

              <Button
                variant="contained"
                className={styles.confirmButton}
                disabled={isConfirmDisabled}
                onClick={handleConfirmDeposit}
                sx={{
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'text.disabled',
                  },
                }}
              >
                {submitting ? 'Processing...' : 'Confirm Deposit'}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
