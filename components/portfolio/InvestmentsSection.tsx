'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Button, Paper, IconButton, Skeleton, Alert } from '@mui/material'
import { ExpandMore, ExpandLess, TrendingUp } from '@mui/icons-material'

interface Investment {
  id: string
  asset_id: string
  asset_type: string
  asset_title: string
  amount: number
  currency: string
  payment_method_type: string
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  created_at: string
}

interface InvestmentsSectionProps {
  isPositionsExpanded?: boolean
  onTogglePositions?: () => void
}

const fmtCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return '—' }
}

const getPaymentLabel = (type: string) =>
  type === 'TZERO_BALANCE' ? 'tZERO Balance' : type === 'ACH' ? 'Bank Account' : type === 'CREDIT_CARD' ? 'Credit Card' : type

const StatusPill = ({ status }: { status: string }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    COMPLETED: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    PENDING:   { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    FAILED:    { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    REFUNDED:  { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  }
  const c = colors[status] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888' }
  return (
    <Box sx={{ display: 'inline-flex', px: 1.25, py: 0.25, borderRadius: '5px', fontSize: '10px', fontWeight: 700, ...c }}>
      {status}
    </Box>
  )
}

export default function InvestmentsSection({
  isPositionsExpanded = false,
  onTogglePositions,
}: InvestmentsSectionProps) {
  const router = useRouter()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [positions, setPositions] = useState<Array<{ id: string; user_id: string; symbol: string; shares: number; avg_cost: number }>>([])

  useEffect(() => {
    const fetchInvestments = async () => {
      const response = await fetch('/api/investments')
      if (!response.ok) throw new Error('Failed to load investments')
      const data = await response.json()
      setInvestments(data.investments || [])
    }
    const fetchPositions = async () => {
      const resp = await fetch('/api/trading/positions')
      if (!resp.ok) throw new Error('Failed to load positions')
      const data = await resp.json()
      setPositions(data.positions || [])
    }
    Promise.all([fetchInvestments(), fetchPositions()])
      .catch((err) => {
        console.error('Error fetching positions:', err)
        setError('Failed to load positions. Please refresh and try again.')
      })
      .finally(() => setLoading(false))
  }, [])

  const secondaryTradingInvestments = investments.filter((inv) => inv.asset_type === 'SECONDARY_TRADING')
  const hasPositions = secondaryTradingInvestments.length > 0 || positions.length > 0

  // Column header row
  const ColHeaders = ({ cols }: { cols: string[] }) => (
    <Box sx={{
      display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
      px: 3, py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {cols.map((c) => (
        <Typography key={c} sx={{ color: '#444', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c}</Typography>
      ))}
    </Box>
  )

  if (loading) {
    return (
      <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width={90} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
        </Box>
        {[...Array(4)].map((_, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center', px: 3, py: 1.75, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            {[...Array(5)].map((__, j) => (
              <Skeleton key={j} variant="text" width={j === 0 ? 80 : 60} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            ))}
          </Box>
        ))}
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, p: 3 }}>
        <Alert
          severity="error"
          sx={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', '& .MuiAlert-icon': { color: '#ef4444' } }}
        >
          {error}
        </Alert>
      </Paper>
    )
  }

  if (!hasPositions) {
    return (
      <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, p: 4, textAlign: 'center' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: 'rgba(0,255,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <TrendingUp sx={{ color: '#00ff88', fontSize: 24 }} />
        </Box>
        <Typography sx={{ color: '#ccc', fontWeight: 600, mb: 0.5 }}>No positions yet</Typography>
        <Typography sx={{ color: '#444', fontSize: '13px', mb: 2.5 }}>Start trading to build your portfolio</Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/investing/secondary-trading')}
          sx={{
            backgroundColor: '#00ff88', color: '#000', fontWeight: 700, fontSize: '13px',
            borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { backgroundColor: '#00e07a' },
          }}
        >
          Explore Markets
        </Button>
      </Paper>
    )
  }

  return (
    <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
      {/* Collapsible header */}
      <Box
        onClick={onTogglePositions}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 2, cursor: onTogglePositions ? 'pointer' : 'default',
          borderBottom: isPositionsExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
          '&:hover': onTogglePositions ? { backgroundColor: 'rgba(255,255,255,0.02)' } : {},
        }}
      >
        <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          My Positions
        </Typography>
        <IconButton size="small" sx={{ color: '#555', p: 0.25 }}>
          {isPositionsExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

      {isPositionsExpanded && (
        <Box>
          {/* Marketplace investments */}
          {secondaryTradingInvestments.length > 0 && (
            <Box>
              <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                <Typography sx={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Marketplace</Typography>
              </Box>
              <ColHeaders cols={['Asset', 'Amount', 'Method', 'Date', 'Status']} />
              {secondaryTradingInvestments.map((inv, idx, arr) => (
                <Box
                  key={inv.id}
                  sx={{
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                    alignItems: 'center', px: 3, py: 1.5,
                    borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Typography sx={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>{inv.asset_title}</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>{fmtCurrency(inv.amount)}</Typography>
                  <Typography sx={{ color: '#555', fontSize: '12px' }}>{getPaymentLabel(inv.payment_method_type)}</Typography>
                  <Typography sx={{ color: '#555', fontSize: '12px' }}>{fmtDate(inv.created_at)}</Typography>
                  <StatusPill status={inv.payment_status} />
                </Box>
              ))}
            </Box>
          )}

          {/* Trading positions */}
          {positions.length > 0 && (
            <Box sx={{ borderTop: secondaryTradingInvestments.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                <Typography sx={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trading Positions</Typography>
              </Box>
              <ColHeaders cols={['Symbol', 'Shares', 'Avg Cost', 'Value']} />
              {positions.map((p, idx, arr) => (
                <Box
                  key={p.id}
                  sx={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    alignItems: 'center', px: 3, py: 1.5,
                    borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Typography sx={{ color: '#ccc', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>{p.symbol}</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>{p.shares}</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>{fmtCurrency(p.avg_cost)}</Typography>
                  <Typography sx={{ color: '#00ff88', fontSize: '13px', fontFamily: 'monospace' }}>{fmtCurrency(p.shares * p.avg_cost)}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  )
}

