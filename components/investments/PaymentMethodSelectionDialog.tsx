'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material'
import { Close, AccountBalance, CreditCard } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AddCreditCardDialog from './AddCreditCardDialog'
import AddACHPaymentMethodDialog from './AddACHPaymentMethodDialog'
import styles from './PaymentMethodSelectionDialog.module.css'

interface PaymentMethod {
  id: string
  type: 'TZERO_BALANCE' | 'ACH' | 'CREDIT_CARD'
  name: string
  description: string
  icon: React.ReactNode
  available?: number
  isUserMethod?: boolean
}

interface PaymentMethodSelectionDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (paymentMethodId: string | null, paymentMethodType: string) => void
  selectedPaymentMethodId?: string | null
  selectedPaymentMethodType?: string
}

export default function PaymentMethodSelectionDialog({
  open,
  onClose,
  onSelect,
  selectedPaymentMethodId,
  selectedPaymentMethodType,
}: PaymentMethodSelectionDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [userPaymentMethods, setUserPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddCreditCard, setShowAddCreditCard] = useState(false)
  const [showAddACH, setShowAddACH] = useState(false)

  useEffect(() => {
    if (open && user?.id) {
      fetchUserPaymentMethods()
    }
  }, [open, user])

  const fetchUserPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setUserPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (paymentMethod: PaymentMethod) => {
    if (paymentMethod.isUserMethod) {
      onSelect(paymentMethod.id, paymentMethod.type)
    } else {
      // For non-user methods (tZERO Balance), pass null as ID
      onSelect(null, paymentMethod.type)
    }
    onClose()
  }

  const handleAddCreditCard = () => {
    setShowAddCreditCard(true)
  }

  const handleAddBankAccount = () => {
    setShowAddACH(true)
  }

  const handleCreditCardAdded = () => {
    setShowAddCreditCard(false)
    fetchUserPaymentMethods()
  }

  const handleACHAdded = () => {
    setShowAddACH(false)
    fetchUserPaymentMethods()
  }

  // Build payment methods list
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'tzero-balance',
      type: 'TZERO_BALANCE',
      name: 'tZERO Balance',
      description: '$0.00 Available',
      icon: <AccountBalance />,
      available: 0.00,
    },
    // Add user's payment methods
    ...userPaymentMethods.map((pm) => {
      let name = 'Payment Method'
      let icon = <AccountBalance />
      let description = ''

      if (pm.type === 'ACH') {
        name = pm.bank_name || pm.account_name || 'Bank Account'
        icon = <AccountBalance />
        description = pm.account_number_masked ? `•••• ${pm.account_number_masked}` : ''
      } else if (pm.type === 'CREDIT_CARD') {
        name = `${pm.card_brand || 'Card'} •••• ${pm.card_last_four || ''}`
        icon = <CreditCard />
        description = pm.cardholder_name || ''
      }

      return {
        id: pm.id,
        type: pm.type,
        name,
        description,
        icon,
        isUserMethod: true,
      }
    }),
  ]

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            borderRadius: 4,
            border: '1px solid rgba(0, 255, 136, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogTitle className={styles.dialogTitle}>
          <Box className={styles.titleContainer}>
            <Typography variant="h6" className={styles.title}>
              Select Payment Method
            </Typography>
            <Typography variant="body2" className={styles.subtitle}>
              All info is kept highly secure.
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            className={styles.closeButton}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent className={styles.dialogContent}>
          {loading ? (
            <Box className={styles.loadingContainer}>
              <CircularProgress sx={{ color: '#00ff88' }} />
            </Box>
          ) : (
            <Box className={styles.paymentMethodsList}>
              {paymentMethods.map((method) => {
                // Check if this method is selected
                const isSelected = method.isUserMethod
                  ? selectedPaymentMethodId === method.id
                  : selectedPaymentMethodId === null && selectedPaymentMethodType === method.type
                return (
                  <Paper
                    key={method.id}
                    className={`${styles.paymentMethodCard} ${isSelected ? styles.selected : ''}`}
                  >
                    <Box className={styles.paymentMethodContent}>
                      <Box className={styles.paymentMethodIcon}>
                        {method.icon}
                      </Box>
                      <Box className={styles.paymentMethodInfo}>
                        <Typography variant="body1" className={styles.paymentMethodName}>
                          {method.name}
                        </Typography>
                        <Typography variant="body2" className={styles.paymentMethodDescription}>
                          {method.description}
                        </Typography>
                      </Box>
                      <Button
                        variant={isSelected ? 'contained' : 'outlined'}
                        className={styles.selectButton}
                        onClick={() => handleSelect(method)}
                        sx={{
                          ...(isSelected
                            ? {
                                backgroundColor: '#00ff88',
                                color: '#000000',
                                '&:hover': {
                                  backgroundColor: '#00cc6a',
                                },
                              }
                            : {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                color: '#ffffff',
                                '&:hover': {
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                },
                              }),
                          textTransform: 'none',
                          minWidth: '80px',
                        }}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          )}

          <Divider className={styles.divider} />

          <Box className={styles.addButtonsContainer}>
            <Button
              variant="outlined"
              className={styles.addButton}
              onClick={handleAddBankAccount}
              sx={{
                borderColor: '#00ff88',
                color: '#00ff88',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#00cc6a',
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                },
              }}
            >
              Add Bank Account
            </Button>
            <Button
              variant="outlined"
              className={styles.addButton}
              onClick={handleAddCreditCard}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Add Credit Card
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <AddCreditCardDialog
        open={showAddCreditCard}
        onClose={() => setShowAddCreditCard(false)}
        onSuccess={handleCreditCardAdded}
      />

      <AddACHPaymentMethodDialog
        open={showAddACH}
        onClose={() => setShowAddACH(false)}
        onSuccess={handleACHAdded}
      />
    </>
  )
}
