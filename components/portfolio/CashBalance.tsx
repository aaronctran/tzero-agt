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
  const [orders, setOrders] = useState<any[]>([])
  const [tradingPositions, setTradingPositions] = useState<any[]>([])

  const fetchBalances = async () => {
    try {
      const [bankResp, tradingResp] = await Promise.all([fetch('/api/banking/balance'), fetch('/api/trading/balance')])

      if (bankResp.ok) {
        const data = await bankResp.json()
        setCashAvailable(Number(data.balance) || 0)
      }

      if (tradingResp.ok) {
        const t = await tradingResp.json()
        // trading balance is separate from bank balance; show sum in cashAvailable
        const tradingCash = Number(t.balance) || 0
        setCashAvailable((prev) => prev + tradingCash)
      }

    } catch (error) {
      console.error('Error fetching cash balance:', error)
    }
  }

  useEffect(() => {
    fetchInvestments()
    fetchBalances()

    // fetch orders and positions for portfolio details
    const fetchTradingDetails = async () => {
      try {
        const [ordersResp, positionsResp] = await Promise.all([fetch('/api/trading/orders'), fetch('/api/trading/positions')])
        if (ordersResp.ok) {
          const jo = await ordersResp.json()
          // store orders in investments list as a simple history item (optional)
          // not changing investments state shape to avoid breaking others
        }
        if (positionsResp.ok) {
          const jp = await positionsResp.json()
          // store trading holdings so we can include their value under "Invested"
          const list = Array.isArray(jp) ? jp : jp.positions ?? []
          setTradingPositions(list)
        }
      } catch (e) {
        console.error('Error fetching trading details:', e)
      }
    }

    fetchTradingDetails()
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

  // Fetch recent trading orders
  const fetchOrders = async () => {
    try {
      const resp = await fetch('/api/trading/orders')
      if (resp.ok) {
        const data = await resp.json()
        const list = Array.isArray(data) ? data : data.orders ?? []
        setOrders(list.slice(0, 10))
      }
    } catch (err) {
      console.error('Error fetching trading orders:', err)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Calculate portfolio values
  // value from completed investments
  const investmentsValue = investments
    .filter((inv) => inv.payment_status === 'COMPLETED')
    .reduce((sum, inv) => sum + inv.amount, 0)

  // value from trading positions (use avg_cost as conservative position value)
  const positionsValue = tradingPositions.reduce((sum, p) => sum + Number(p.shares || 0) * Number(p.avg_cost || 0), 0)

  const investedAmount = investmentsValue + positionsValue

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
        {/* Recent Orders */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 1 }}>Recent Orders</Typography>
          {orders.length ? (
            <List className={styles.historyList}>
              {orders.map((o) => (
                <ListItem key={o.id} className={styles.historyItem}>
                  <ListItemText
                    primary={`${(o.side || '').toUpperCase()} ${o.quantity} @ ${o.price ? `$${Number(o.price).toFixed(2)}` : 'MKT'}`}
                    secondary={`Status: ${o.status ?? 'open'} • ${new Date(o.created_at || o.createdAt || Date.now()).toLocaleString()}`}
                    className={styles.historyText}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{ color: '#666', fontSize: 13 }}>No recent orders</Typography>
          )}
        </Box>
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
