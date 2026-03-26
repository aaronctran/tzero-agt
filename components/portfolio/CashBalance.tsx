'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material'
import { ArrowForward, Refresh } from '@mui/icons-material'
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
  const [error, setError] = useState<string | null>(null)
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [tradingPositions, setTradingPositions] = useState<any[]>([])
  const [snack, setSnack] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const fetchBalances = async () => {
    try {
      const [bankResp, tradingResp] = await Promise.all([fetch('/api/banking/balance'), fetch('/api/trading/balance')])
      let cash = 0
      if (bankResp.ok) {
        const data = await bankResp.json()
        cash += Number(data.balance) || 0
      }
      if (tradingResp.ok) {
        const t = await tradingResp.json()
        cash += Number(t.balance) || 0
      }
      setCashAvailable(cash)
    } catch (error) {
      console.error('Error fetching cash balance:', error)
      throw error
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
      throw error
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

  const fetchTrades = async () => {
    try {
      const resp = await fetch('/api/trading/trades')
      if (resp.ok) {
        const data = await resp.json()
        setTrades((data.trades ?? []).slice(0, 10))
      }
    } catch (err) {
      console.error('Error fetching trading trades:', err)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchInvestments(), fetchBalances(), fetchOrders(), fetchTrades()])
      const positionsResp = await fetch('/api/trading/positions')
      if (positionsResp.ok) {
        const jp = await positionsResp.json()
        setTradingPositions(Array.isArray(jp) ? jp : jp.positions ?? [])
      }
    } catch (e) {
      setError('Some data failed to load. Your balances may be incomplete.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '22px', color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
            Portfolio
          </Typography>
          <Typography sx={{ color: '#555', fontSize: '13px' }}>
            Your holdings, balances, and transaction history.
          </Typography>
        </Box>
        <IconButton
          onClick={loadAll}
          size="small"
          disabled={loading}
          sx={{ color: '#555', mt: 0.5, '&:hover': { color: '#fff' }, '&:disabled': { color: '#333' } }}
          title="Refresh"
        >
          <Refresh sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Error banner */}
      {error && (
        <Alert severity="warning" onClose={() => setError(null)} sx={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', '& .MuiAlert-icon': { color: '#fbbf24' } }}>
          {error}
        </Alert>
      )}

      {/* Summary card — skeleton while loading */}
      {loading ? (
        <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, p: 3 }}>
          <Skeleton variant="text" width={120} height={16} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
          <Skeleton variant="text" width={200} height={48} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', mb: 1 }} />
          <Skeleton variant="text" width={100} height={14} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rounded" height={72} sx={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} />
            <Skeleton variant="rounded" height={72} sx={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} />
          </Box>
        </Paper>
      ) : (
        <PortfolioSummaryCard
          totalValue={portfolioValue}
          cashAvailable={cashAvailable}
          investedAmount={investedAmount}
          onInvestedClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
        />
      )}

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
        {loading ? (
          <Box sx={{ px: 3, py: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <Box>
                  <Skeleton variant="text" width={180} height={16} sx={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <Skeleton variant="text" width={100} height={12} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', mt: 0.5 }} />
                </Box>
                <Skeleton variant="rounded" width={56} height={22} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '5px' }} />
              </Box>
            ))}
          </Box>
        ) : orders.length > 0 && (
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

        {/* Trade history */}
        {!loading && trades.length > 0 && (
          <>
            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
              <Typography sx={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Executed Trades
              </Typography>
            </Box>
            {trades.map((t, idx) => {
              const notional = Number(t.price) * Number(t.quantity)
              return (
                <Box
                  key={t.id}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 3, py: 1.5,
                    borderBottom: idx < trades.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Box>
                    <Typography sx={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>
                      <Box component="span" sx={{ color: t.side === 'buy' ? '#22c55e' : '#ef4444', mr: 0.5 }}>
                        {(t.side as string).toUpperCase()}
                      </Box>
                      {t.quantity} {t.symbol}
                      {' @ '}{fmtCurrency(Number(t.price))}
                    </Typography>
                    <Typography sx={{ color: '#444', fontSize: '11px', mt: 0.25 }}>
                      {fmtDate(t.created_at)} · {fmtCurrency(notional)} notional
                    </Typography>
                  </Box>
                  <Box sx={{
                    px: 1.25, py: 0.25, borderRadius: '5px', fontSize: '10px', fontWeight: 600,
                    backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e',
                  }}>
                    Filled
                  </Box>
                </Box>
              )
            })}
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

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

    </Box>
  )
}


