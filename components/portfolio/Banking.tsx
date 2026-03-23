'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Button,
} from '@mui/material'
import { ArrowBack, ArrowForward } from '@mui/icons-material'
import styles from './Banking.module.css'

export default function Banking() {
  const router = useRouter()
  const [todayDepositTotal, setTodayDepositTotal] = useState(0)

  useEffect(() => {
    const fetchDailyDeposits = async () => {
      try {
        const response = await fetch('/api/banking/daily-deposits')
        if (!response.ok) {
          return
        }
        const data = await response.json()
        setTodayDepositTotal(Number(data.total) || 0)
      } catch (error) {
        console.error('Error fetching daily deposits:', error)
      }
    }

    fetchDailyDeposits()
  }, [])

  const bankingOptions = [
    {
      title: 'Payment Methods',
      description: 'Add or view payment methods',
      onClick: () => {
        router.push('/account/banking/payment-methods')
      },
    },
    {
      title: 'Withdraw Funds',
      status: '$0.00',
      onClick: () => {
        // Handle navigation
      },
    },
    {
      title: 'Deposit Funds',
      limit: `$${todayDepositTotal.toFixed(2)}/$250,000 daily limit`,
      onClick: () => {
        router.push('/account/banking/deposit')
      },
    },
    {
      title: 'Transfer History',
      description: 'Withdraw and deposit history',
      onClick: () => {
        // Handle navigation
      },
    },
  ]

  return (
    <Box className={styles.container}>
      {/* Header with Back button */}
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/account/portfolio')}
          className={styles.backButton}
        >
          Back
        </Button>
        <Typography variant="h4" className={styles.title}>
          TRANSFERS
        </Typography>
      </Box>

      {/* Banking Options List */}
      <List className={styles.bankingList}>
        {bankingOptions.map((option, index) => (
          <Box key={option.title}>
            <ListItem
              className={styles.bankingItem}
              onClick={option.onClick}
            >
              <ListItemText
                primary={option.title}
                secondary={option.description || option.status || option.limit}
                className={styles.bankingText}
              />
              <IconButton edge="end" className={styles.arrowButton}>
                <ArrowForward />
              </IconButton>
            </ListItem>
            {index < bankingOptions.length - 1 && (
              <Divider className={styles.divider} />
            )}
          </Box>
        ))}
      </List>
    </Box>
  )
}
