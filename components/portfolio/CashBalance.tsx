'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  List,
  Typography,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material'
import {
  ArrowForward,
} from '@mui/icons-material'
import PortfolioSummaryCard from './PortfolioSummaryCard'
import InvestmentsSection from './InvestmentsSection'
import styles from './CashBalance.module.css'

interface Investment {
  id: string
  amount: number
  payment_status: string
}

export default function CashBalance() {
  const [cashAvailable, setCashAvailable] = useState(0)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false)

  const fetchBalances = async () => {
    try {
      const balanceResponse= await fetch('/api/banking/balance');

      if (balanceResponse.ok) {
        const data = await balanceResponse.json()
        setCashAvailable(Number(data.balance) || 0)
      }

    } catch (error) {
      console.error('Error fetching cash balance:', error)
    }
  }

  useEffect(() => {
    fetchInvestments()
    fetchBalances()
  }, [])

  const fetchInvestments = async () => {
    try {
      const response = await fetch('/api/investments')
      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments || [])
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate portfolio values
  const investedAmount = investments
    .filter((inv) => inv.payment_status === 'COMPLETED')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const portfolioValue = investedAmount + cashAvailable

  return (
    <Box className={styles.content}>
      {/* Portfolio Summary Section */}
      <PortfolioSummaryCard
        totalValue={portfolioValue}
        cashAvailable={cashAvailable}
        investedAmount={investedAmount}
        onInvestedClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      {/* Investments Section */}
      <InvestmentsSection
        isPositionsExpanded={isPositionsExpanded}
        onTogglePositions={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      {/* All History Section */}
      <Box className={styles.historySection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          ALL HISTORY
        </Typography>
        <List className={styles.historyList}>
          <ListItem
            className={styles.historyItem}
            onClick={() => {
              // Handle transactions click
            }}
          >
            <ListItemText
              primary="All Transactions"
              secondary="Past Transactions"
              className={styles.historyText}
            />
            <IconButton edge="end" className={styles.historyArrow}>
              <ArrowForward />
            </IconButton>
          </ListItem>
          <ListItem
            className={styles.historyItem}
            onClick={() => {
              // Handle documents click
            }}
          >
            <ListItemText
              primary="All Documents"
              secondary="Account Statements, Tax Docs..."
              className={styles.historyText}
            />
            <IconButton edge="end" className={styles.historyArrow}>
              <ArrowForward />
            </IconButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}
