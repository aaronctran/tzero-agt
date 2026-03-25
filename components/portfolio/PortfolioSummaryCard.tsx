'use client'

import { Box, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/navigation'
import { TrendingUp, AccountBalance } from '@mui/icons-material'

interface PortfolioSummaryCardProps {
  totalValue: number
  investedAmount: number
  cashAvailable: number
  onInvestedClick?: () => void
}

export default function PortfolioSummaryCard({
  totalValue,
  investedAmount,
  cashAvailable,
  onInvestedClick,
}: PortfolioSummaryCardProps) {
  const router = useRouter()

  const handleDepositClick = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      if (response.status === 401) { router.push('/auth'); return }
      if (!response.ok) return
      const data = await response.json()
      const hasMethods = Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0
      router.push(hasMethods ? '/account/banking/deposit' : '/account/banking/add-payment-method')
    } catch (error) {
      console.error('Error checking payment methods:', error)
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

  return (
    <Paper sx={{
      backgroundColor: '#111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 2,
      p: 3,
    }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Portfolio Overview
        </Typography>
        <Button
          onClick={handleDepositClick}
          size="small"
          variant="contained"
          sx={{
            backgroundColor: '#00ff88', color: '#000', fontWeight: 700,
            fontSize: '12px', textTransform: 'none', px: 2, py: 0.75, borderRadius: '7px',
            '&:hover': { backgroundColor: '#00cc6a' },
          }}
        >
          + Deposit
        </Button>
      </Box>

      {/* Two-column body: total value left, stats right */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left — total */}
        <Box sx={{ flex: '1 1 200px' }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '38px', lineHeight: 1, letterSpacing: '-1px' }}>
            {fmt(totalValue)}
          </Typography>
          <Typography sx={{ color: '#444', fontSize: '12px', mt: 0.75 }}>Total Portfolio Value</Typography>
        </Box>

        {/* Right — stat cards */}
        <Box sx={{ flex: '1 1 300px', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Invested */}
          <Box
            onClick={onInvestedClick}
            sx={{
              flex: '1 1 130px', display: 'flex', alignItems: 'center', gap: 1.5,
              p: 2, borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: onInvestedClick ? 'pointer' : 'default',
              transition: 'background-color 0.15s, border-color 0.15s',
              '&:hover': onInvestedClick ? {
                backgroundColor: 'rgba(255,255,255,0.055)',
                borderColor: 'rgba(255,255,255,0.1)',
              } : {},
            }}
          >
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              backgroundColor: 'rgba(0,188,212,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp sx={{ color: '#00bcd4', fontSize: 17 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                Invested
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                {fmt(investedAmount)}
              </Typography>
            </Box>
          </Box>

          {/* Cash */}
          <Box sx={{
            flex: '1 1 130px', display: 'flex', alignItems: 'center', gap: 1.5,
            p: 2, borderRadius: '10px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              backgroundColor: 'rgba(136,136,136,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AccountBalance sx={{ color: '#888', fontSize: 17 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                Cash Available
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                {fmt(cashAvailable)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

