'use client'

/**
 * ASSET DETAIL PAGE - Secondary Trading
 *
 * Build this page to show asset details and allow order placement.
 * You'll also need to build the trading API routes that this page calls.
 *
 * Available: lib/matchingEngine.ts — order matching engine (matchOrder, upsertHolding)
 * Data: import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
 *   - Each asset has dailyHistory (30 OHLCV candles) and company info
 *   - Order book: templates.orderBook.asks/bids — multiply priceMultiplier × asset.basePrice
 */

import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getSecondaryTradingSymbol, slugify, getSeededColor } from '@/lib/investmentUtils'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import api from '@/lib/api'

export default function SecondaryTradingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()

  const investmentSlug = Array.isArray(params.id) ? params.id[0] : params.id
  const decodedSlug = investmentSlug ? decodeURIComponent(investmentSlug) : ''
  const allAssets = secondaryTradingAssets.investments as any[]
  const asset = allAssets.find((a) => a.id === decodedSlug || slugify(a.title) === decodedSlug)

  if (!asset) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Header />
        <Container maxWidth="lg" sx={{ pt: '120px', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#ffffff' }}>Asset not found</Typography>
          <Button onClick={() => router.push('/investing/secondary-trading')} sx={{ mt: 2, color: theme.palette.primary.main }}>
            Back to Marketplace
          </Button>
        </Container>
      </Box>
    )
  }

  const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)

  // ─── Replace this placeholder layout with your implementation ───

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />

      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/investing/secondary-trading')}
          sx={{ color: '#ffffff', mb: 2, textTransform: 'none' }}
        >
          Back to Marketplace
        </Button>

        {/* Asset Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '12px',
            backgroundColor: getSeededColor(symbol),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
              {symbol.slice(0, 2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>
              {asset.title}
            </Typography>
            <Typography sx={{ color: '#888888' }}>
              {symbol} &bull; {asset.category}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#ffffff', mt: 2 }}>
          {formatCurrency(asset.currentValue)}
        </Typography>
        <Typography sx={{
          color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
          fontWeight: 600, mb: 4,
        }}>
          {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
        </Typography>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#555' }}>Price chart</Typography>
            </Paper>

            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#555' }}>Order book</Typography>
            </Paper>

            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2 }}>
              <Typography sx={{ color: '#555' }}>Orders & positions</Typography>
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 3,
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 2,
              position: { md: 'sticky' },
              top: { md: 100 },
            }}>
              <Typography sx={{ color: '#555' }}>Order form</Typography>
            </Paper>
          </Grid>
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
