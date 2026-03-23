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

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
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

  // Client-side state for search, filter, sort
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('featured')

  // derive unique categories
  const categories = useMemo(() => {
    const set = new Set(allAssets.map((a) => a.category))
    return ['all', ...Array.from(set)]
  }, [allAssets])

  // helper to display nicer labels for category values
  function formatCategoryLabel(c: string) {
    if (c === 'all') return 'All Categories'
    return c
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
  }

  // Filter & sort assets
  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase()

    let items = allAssets.filter((asset) => {
      if (category !== 'all' && asset.category !== category) return false
      if (!q) return true
      const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol).toLowerCase()
      const title = asset.title.toLowerCase()
      const desc = (asset.companyDescription || '').toLowerCase()
      return title.includes(q) || symbol.includes(q) || desc.includes(q)
    })

    switch (sortBy) {
      case 'price-asc':
        items = items.sort((a, b) => a.currentValue - b.currentValue)
        break
      case 'price-desc':
        items = items.sort((a, b) => b.currentValue - a.currentValue)
        break
      case 'percent-asc':
        items = items.sort((a, b) => a.performancePercent - b.performancePercent)
        break
      case 'percent-desc':
        items = items.sort((a, b) => b.performancePercent - a.performancePercent)
        break
      default:
        // featured (keep original order)
        break
    }

    return items
  }, [allAssets, query, category, sortBy])

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
        <Paper sx={{ p: 2, mb: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by name, symbol or description"
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ flex: 1, background: 'rgba(255,255,255,0.02)' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  query ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuery('')}>
                        <ClearIcon sx={{ color: '#999' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: '#ccc' }}>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(String(e.target.value))}
                sx={{ color: '#fff' }}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {formatCategoryLabel(c)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel sx={{ color: '#ccc' }}>Sort</InputLabel>
              <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(String(e.target.value))}>
                <MenuItem value="featured">Featured</MenuItem>
                <MenuItem value="price-desc">Price: High → Low</MenuItem>
                <MenuItem value="price-asc">Price: Low → High</MenuItem>
                <MenuItem value="percent-desc">Performance: High → Low</MenuItem>
                <MenuItem value="percent-asc">Performance: Low → High</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ ml: 'auto' }}>
              <Stack direction="row" spacing={1}>
                <Chip label={`Results: ${filteredAssets.length}`} size="small" />
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Asset Cards */}
        <Grid container spacing={2}>
          {filteredAssets.map((asset) => {
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
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        backgroundColor: getSeededColor(symbol),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                          {symbol.slice(0, 2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                          {asset.title}
                        </Typography>
                        <Typography sx={{ color: '#888', fontSize: '12px' }}>{symbol}</Typography>
                      </Box>
                    </Box>

                    <Typography sx={{ color: '#aaa', fontSize: '13px', mb: 2 }} noWrap>
                      {asset.companyDescription}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 2 }}>
                    <Box>
                      <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }}>
                        {formatCurrency(asset.currentValue)}
                      </Typography>
                      <Typography sx={{ color: '#999', fontSize: '12px' }}>{`Volume: ${asset.volume}`}</Typography>
                    </Box>

                    <Typography sx={{
                      color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}>
                      {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>

        {/* Small hint box - remove when complete */}
        <Paper sx={{
          mt: 4,
          p: 2.5,
          border: '1px dashed rgba(255, 200, 0, 0.25)',
          borderRadius: 2,
          backgroundColor: 'rgba(255, 200, 0, 0.02)',
        }}>
          <Typography sx={{ color: '#998a00', fontSize: '13px', lineHeight: 1.7 }}>
            The layout above is interactive: search, filter by category, sort results and click an asset to open its detail page.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
