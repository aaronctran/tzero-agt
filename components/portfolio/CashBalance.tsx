'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
} from '@mui/material'
import { ArrowForward } from '@mui/icons-material'
import PortfolioSummaryCard from './PortfolioSummaryCard'
import InvestmentsSection from './InvestmentsSection'

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
        setCashAvailable((prev) => prev + (Number(t.balance) || 0))
      }
    } catch (error) {
      console.error('Error fetching cash balance:', error)
    }
  }

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
    fetchInvestments()
    fetchBalances()
    fetchOrders()

    const fetchTradingDetails = async () => {
      try {
        const positionsResp = await fetch('/api/trading/positions')
        if (positionsResp.ok) {
          const jp = await positionsResp.json()
          setTradingPositions(Array.isArray(jp) ? jp : jp.positions ?? [])
        }
      } catch (e) {
        console.error('Error fetching trading details:', e)
      }
    }
    fetchTradingDetails()
  }, [])

  const investmentsValue = investments
    .filter((inv) => inv.payment_status === 'COMPLETED')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const positionsValue = tradingPositions.reduce(
    (sum, p) => sum + Number(p.shares || 0) * Number(p.avg_cost || 0), 0
  )

  const investedAmount = investmentsValue + positionsValue
  const portfolioValue = investedAmount + cashAvailable

  const fmtCurrency = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

  const fmtDate = (d: string | number) => {
    try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return '—' }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Page header */}
      <Box sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '22px', color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
          Portfolio
        </Typography>
        <Typography sx={{ color: '#555', fontSize: '13px' }}>
          Your holdings, balances, and transaction history.
        </Typography>
      </Box>

      <PortfolioSummaryCard
        totalValue={portfolioValue}
        cashAvailable={cashAvailable}
        investedAmount={investedAmount}
        onInvestedClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      <InvestmentsSection
        isPositionsExpanded={isPositionsExpanded}
        onTogglePositions={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      {/* History */}
      <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        {/* Section label */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Activity
          </Typography>
        </Box>

        {/* Recent orders */}
        {orders.length > 0 && (
          <>
            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
              <Typography sx={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Recent Orders
              </Typography>
            </Box>
            {orders.map((o, idx) => (
              <Box
                key={o.id}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 3, py: 1.5,
                  borderBottom: idx < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                }}
              >
                <Box>
                  <Typography sx={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>
                    <Box component="span" sx={{ color: o.side === 'buy' ? '#22c55e' : '#ef4444', mr: 0.5 }}>
                      {(o.side || '').toUpperCase()}
                    </Box>
                    {o.quantity} {o.symbol ?? ''}
                    {o.price ? ` @ ${fmtCurrency(Number(o.price))}` : ' (Market)'}
                  </Typography>
                  <Typography sx={{ color: '#444', fontSize: '11px', mt: 0.25 }}>
                    {fmtDate(o.created_at || o.createdAt || Date.now())}
                  </Typography>
                </Box>
                <Box sx={{
                  px: 1.25, py: 0.25, borderRadius: '5px', fontSize: '10px', fontWeight: 600,
                  backgroundColor:
                    o.status === 'Completed' ? 'rgba(34,197,94,0.12)' :
                    o.status === 'Cancelled' ? 'rgba(239,68,68,0.12)' :
                    'rgba(255,255,255,0.06)',
                  color:
                    o.status === 'Completed' ? '#22c55e' :
                    o.status === 'Cancelled' ? '#ef4444' : '#888',
                }}>
                  {o.status ?? 'Open'}
                </Box>
              </Box>
            ))}
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
          </>
        )}

        {/* Static links */}
        {[
          { label: 'All Transactions', sub: 'Past Transactions' },
          { label: 'All Documents', sub: 'Account Statements, Tax Docs…' },
        ].map(({ label, sub }, idx, arr) => (
          <Box
            key={label}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 3, py: 2, cursor: 'pointer',
              borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
              '&:hover .arrow': { color: '#00ff88', transform: 'translateX(3px)' },
            }}
          >
            <Box>
              <Typography sx={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>{label}</Typography>
              <Typography sx={{ color: '#444', fontSize: '11px', mt: 0.25 }}>{sub}</Typography>
            </Box>
            <IconButton size="small" className="arrow" sx={{ color: '#333', transition: 'color 0.15s, transform 0.15s', p: 0.5 }}>
              <ArrowForward sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Paper>

    </Box>
  )
}


