'use client'

/**
 * SECONDARY MARKETPLACE - Asset Listing Page
 *
 * Build this page to display available trading assets with filtering and search.
 * Navigate to /investing/secondary-trading/[id] on asset click.
 *
 * Data: GET /api/trading/assets → { assets: [...], total: 5 }
 * Or: import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
 * Utils: import { formatCurrency, slugify } from '@/lib/investmentUtils'
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import { formatCurrency, getSecondaryTradingSymbol, getSeededColor } from '@/lib/investmentUtils'

type Asset = {
  id: string
  title: string
  category: string
  basePrice: number
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  volume: string
  companyDescription: string
  symbol?: string
}

export default function SecondaryTradingPage() {
  const router = useRouter()
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()
  const allAssets = secondaryTradingAssets.investments as Asset[]

  // ─── Replace this placeholder layout with your implementation ───

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />

      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 1 }}>
          Secondary Marketplace
        </Typography>
        <Typography sx={{ color: '#888888', mb: 4 }}>
          Browse and trade digital securities on the secondary market.
        </Typography>

        {/* Search & Filters */}
        <Paper sx={{
          p: 2, mb: 3,
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: 2,
        }}>
          <Typography sx={{ color: '#555', fontSize: '14px' }}>
            Search & filter controls
          </Typography>
        </Paper>

        {/* Asset Cards */}
        <Grid container spacing={2}>
          {allAssets.map((asset) => {
            const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
            return (
              <Grid item xs={12} sm={6} md={4} key={asset.id}>
                <Paper
                  onClick={() => router.push(`/investing/secondary-trading/${asset.id}`)}
                  sx={{
                    p: 2.5,
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'rgba(0, 255, 136, 0.3)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '8px',
                      backgroundColor: getSeededColor(symbol),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                        {symbol.slice(0, 2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                        {asset.title}
                      </Typography>
                      <Typography sx={{ color: '#888', fontSize: '12px' }}>
                        {symbol}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }}>
                      {formatCurrency(asset.currentValue)}
                    </Typography>
                    <Typography sx={{
                      color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
                      fontWeight: 600, fontSize: '13px',
                    }}>
                      {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>

        {/* Remove this notice once you start building */}
        <Paper sx={{
          mt: 4, p: 2.5,
          border: '1px dashed rgba(255, 200, 0, 0.25)',
          borderRadius: 2,
          backgroundColor: 'rgba(255, 200, 0, 0.02)',
        }}>
          <Typography sx={{ color: '#998a00', fontSize: '13px', lineHeight: 1.7 }}>
            The layout above is a generic wireframe to help you get started.
            Remove it and build your own — this is your playground, feel free to explore.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
