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
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
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
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      <Header />

      <Container maxWidth="xl" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 6 }}>

        {/* ── PAGE HEADER ───────────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '22px', color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
            Secondary Marketplace
          </Typography>
          <Typography sx={{ color: '#555', fontSize: '13px' }}>
            Browse and trade digital securities on the secondary market.
          </Typography>
        </Box>

        {/* ── SEARCH & FILTERS ──────────────────────────────────────── */}
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 3,
          p: 2, backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2,
        }}>
          <TextField
            placeholder="Search by name, symbol or description…"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              flex: '1 1 260px',
              '& .MuiOutlinedInput-root': {
                fontSize: '13px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#444', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')} sx={{ p: 0.25 }}>
                    <ClearIcon sx={{ color: '#444', fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: '13px' }}>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(String(e.target.value))}
              sx={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              {categories.map((c) => (
                <MenuItem key={c} value={c} sx={{ fontSize: '13px' }}>
                  {formatCategoryLabel(c)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: '13px' }}>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(String(e.target.value))}
              sx={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <MenuItem value="featured" sx={{ fontSize: '13px' }}>Featured</MenuItem>
              <MenuItem value="price-desc" sx={{ fontSize: '13px' }}>Price: High → Low</MenuItem>
              <MenuItem value="price-asc" sx={{ fontSize: '13px' }}>Price: Low → High</MenuItem>
              <MenuItem value="percent-desc" sx={{ fontSize: '13px' }}>Performance: High → Low</MenuItem>
              <MenuItem value="percent-asc" sx={{ fontSize: '13px' }}>Performance: Low → High</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: '#444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {filteredAssets.length} result{filteredAssets.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        {/* ── ASSET TABLE ───────────────────────────────────────────── */}
        {filteredAssets.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography sx={{ color: '#333', fontSize: '14px' }}>No assets match your search.</Typography>
          </Box>
        ) : (
          <Paper sx={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>

            {/* Table header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              px: 2.5, py: 1.25,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['Asset', 'Price', 'Change', 'Volume', ''].map((h) => (
                <Typography key={h} sx={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Rows */}
            {filteredAssets.map((asset, idx) => {
              const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
              const isLast = idx === filteredAssets.length - 1
              const dailyHistory = (asset as any).dailyHistory
              const lastVol = dailyHistory?.length
                ? dailyHistory[dailyHistory.length - 1].volume
                : null
              const displayVolume = lastVol ?? (asset as any).avgVolume ?? asset.volume ?? '—'

              return (
                <Box
                  key={asset.id}
                  onClick={() => router.push(`/investing/secondary-trading/${asset.id}`)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    alignItems: 'center',
                    px: 2.5, py: 1.75,
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
                  }}
                >
                  {/* Asset identity */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                      backgroundColor: getSeededColor(symbol),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                        {symbol.slice(0, 2)}
                      </Typography>
                    </Box>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {asset.title}
                        </Typography>
                        <Box sx={{ px: 0.75, py: 0.1, borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                          <Typography sx={{ color: '#666', fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em' }}>
                            {symbol}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{
                        color: '#444', fontSize: '11px', mt: 0.25,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {formatCategoryLabel(asset.category)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Price */}
                  <Typography sx={{ color: '#ddd', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
                    {formatCurrency(asset.currentValue)}
                  </Typography>

                  {/* Change */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{
                      color: asset.isPositive ? '#22c55e' : '#ef4444',
                      fontSize: '13px', fontWeight: 600,
                    }}>
                      {asset.isPositive ? '▲' : '▼'} {Math.abs(asset.performancePercent).toFixed(2)}%
                    </Typography>
                  </Box>

                  {/* Volume */}
                  <Typography sx={{ color: '#555', fontSize: '12px', fontFamily: 'monospace' }}>
                    {typeof displayVolume === 'number' ? displayVolume.toLocaleString() : displayVolume}
                  </Typography>

                  {/* CTA */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{
                      px: 1.5, py: 0.5, borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' },
                    }}>
                      <Typography sx={{ color: '#aaa', fontSize: '11px', fontWeight: 600 }}>Trade →</Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Paper>
        )}

      </Container>
    </Box>
  )
}
