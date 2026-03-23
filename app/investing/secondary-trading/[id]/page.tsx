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
import { useState, useEffect, useMemo } from 'react'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
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

  // Local state: orders/positions and order form
  const [orders, setOrders] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [quantity, setQuantity] = useState<number>(1)
  const [limitPrice, setLimitPrice] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  // Generate a simple order book if templates exist, otherwise create around currentValue
  const orderBook = useMemo(() => {
    const asks: any[] = []
    const bids: any[] = []
    const mid = Number(asset.currentValue || asset.basePrice || 0)

    if (asset.templates?.orderBook) {
      const tpl = asset.templates.orderBook
      const mult = asset.priceMultiplier ?? 1
      ;(tpl.asks || []).forEach((p: number, idx: number) => asks.push({ price: p * mult * (asset.basePrice || 1), size: Math.max(1, Math.round((idx + 1) * 10)) }))
      ;(tpl.bids || []).forEach((p: number, idx: number) => bids.push({ price: p * mult * (asset.basePrice || 1), size: Math.max(1, Math.round((idx + 1) * 8)) }))
    } else {
      // synthetic book: 5 levels
      for (let i = 1; i <= 5; i++) {
        asks.push({ price: +(mid + i * (mid * 0.01)).toFixed(2), size: Math.round(Math.random() * 50) + 1 })
        bids.push({ price: +(mid - i * (mid * 0.01)).toFixed(2), size: Math.round(Math.random() * 50) + 1 })
      }
    }

    // sort asks asc, bids desc
    asks.sort((a, b) => a.price - b.price)
    bids.sort((a, b) => b.price - a.price)

    return { asks, bids }
  }, [asset])

  // Simple sparkline path generator from dailyHistory (expects [{close}])
  const sparklinePath = useMemo(() => {
    const history = asset.dailyHistory || []
    const values = history.map((d: any) => Number(d.close ?? d.c ?? d[4] ?? 0))
    if (!values.length) return null

    const w = 300
    const h = 60
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    const points = values.map((v: number, i: number) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })

    return { path: `M${points.join(' L')}`, w, h, max, min }
  }, [asset])

  // Fetch user's orders/positions (best-effort, API may not exist yet)
  useEffect(() => {
    if (!isAuthenticated) return

    let mounted = true

    ;(async () => {
      try {
        const [ordersRes, positionsRes] = await Promise.all([
          fetch('/api/trading/orders'),
          fetch('/api/trading/positions'),
        ])

        if (!mounted) return

        if (ordersRes.ok) {
          const json = await ordersRes.json()
          setOrders(Array.isArray(json) ? json : json.orders ?? [])
        }
        if (positionsRes.ok) {
          const json = await positionsRes.json()
          setPositions(Array.isArray(json) ? json : json.positions ?? [])
        }
      } catch (e) {
        // ignore
      }
    })()

    return () => {
      mounted = false
    }
  }, [isAuthenticated])

  async function submitOrder() {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0) return
    if (orderType === 'limit' && (limitPrice === '' || Number(limitPrice) <= 0)) return

    const payload = {
      assetId: asset.id,
      side,
      orderType,
      quantity: qty,
      price: orderType === 'limit' ? Number(limitPrice) : null,
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/trading/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const created = res.ok ? await res.json() : null

      // optimistic update: add to local orders
      setOrders((prev) => [{ id: created?.id ?? `local-${Date.now()}`, assetId: asset.id, side, orderType, quantity: qty, price: payload.price, status: res.ok ? created?.status ?? 'open' : 'pending', createdAt: new Date().toISOString() }, ...prev])

      // reset limit price for market orders
      if (orderType === 'market') setLimitPrice('')
    } catch (e) {
      // ignore for now
    } finally {
      setSubmitting(false)
    }
  }

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
              <Typography sx={{ color: '#fff', mb: 2 }}>Price chart</Typography>
              {sparklinePath ? (
                (() => {
                  const history = asset.dailyHistory || []
                  const values: number[] = history.map((d: any) => Number(d.close ?? d.c ?? d[4] ?? 0))
                  if (!values.length) return null

                  const w = 600
                  const h = 200
                  const leftMargin = 48
                  const topMargin = 8
                  const rightMargin = 24
                  const bottomMargin = 40
                  const svgW = leftMargin + w + rightMargin
                  const svgH = topMargin + h + bottomMargin

                  const max = Math.max(...values)
                  const min = Math.min(...values)
                  const range = max - min || 1

                  // scaled points (translated by leftMargin + topMargin for y)
                  const points: { x: number; y: number; v: number; i: number }[] = values.map((v: number, i: number) => {
                    const x = leftMargin + (i / (values.length - 1)) * w
                    const y = topMargin + (h - ((v - min) / range) * h)
                    return { x, y, v, i }
                  })

                  const pathD: string = `M${points.map((p) => `${p.x},${p.y}`).join(' L')}`

                  // y ticks (including top=max and bottom=min)
                  const yTickCount = 3
                  const yTicks: { value: number; y: number }[] = Array.from({ length: yTickCount + 1 }).map((_, ti) => {
                    const frac = ti / yTickCount // 0..1 top->bottom
                    const value = max - frac * range
                    const y = topMargin + frac * h
                    return { value, y }
                  })

                  // x ticks: start, middle, end
                  const xIndices = [0, Math.floor((values.length - 1) / 2), values.length - 1]
                  const formatX = (d: any, idx: number) => {
                    if (!d) return '' + (idx + 1)
                    const maybeDate = d.date ?? d.t ?? d.time ?? d.x
                    if (maybeDate) {
                      try {
                        const t = typeof maybeDate === 'number' && maybeDate.toString().length <= 10 ? maybeDate * 1000 : maybeDate
                        const dt = new Date(t)
                        return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      } catch {
                        return String(maybeDate)
                      }
                    }
                    return '' + (idx + 1)
                  }

                  const lastXiIndex = xIndices.length - 1

                  // axis title positions
                  const yTitleX = Math.max(12, leftMargin / 2)
                  const yTitleY = topMargin + h / 2
                  const xTitleX = leftMargin + w / 2
                  const xTitleY = svgH - 8

                  return (
                    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMinYMin meet">
                      {/* background grid */}
                      <rect x={0} y={0} width={svgW} height={svgH} fill="transparent" />

                      {/* y grid lines and labels */}
                      {yTicks.map((yt, i) => (
                        <g key={`yt-${i}`}>
                          <line x1={leftMargin} x2={svgW - rightMargin} y1={yt.y} y2={yt.y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                          <text x={leftMargin - 8} y={yt.y + 4} fontSize={11} fill="#ccc" textAnchor="end">{formatCurrency(yt.value)}</text>
                        </g>
                      ))}

                      {/* sparkline path */}
                      <path d={pathD} fill="none" stroke={theme.palette.primary.main} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

                      {/* x ticks and labels */}
                      {xIndices.map((xi, i) => {
                        const p = points[xi]
                        if (!p) return null
                        const label = formatX(history[xi], xi)
                        const isFirst = i === 0
                        const isLast = i === lastXiIndex
                        const xPos = isFirst ? Math.max(p.x, leftMargin + 4) : isLast ? Math.min(p.x, svgW - rightMargin - 4) : p.x
                        const anchor: 'start' | 'middle' | 'end' = isFirst ? 'start' : isLast ? 'end' : 'middle'

                        return (
                          <g key={`xt-${i}`}>
                            <line x1={p.x} x2={p.x} y1={topMargin + h} y2={topMargin + h + 6} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                            <text x={xPos} y={topMargin + h + 18} fontSize={11} fill="#ccc" textAnchor={anchor}>{label}</text>
                          </g>
                        )
                      })}

                      {/* axes lines */}
                      <line x1={leftMargin} y1={topMargin} x2={leftMargin} y2={topMargin + h} stroke="rgba(255,255,255,0.06)" />
                      <line x1={leftMargin} y1={topMargin + h} x2={svgW - rightMargin} y2={topMargin + h} stroke="rgba(255,255,255,0.06)" />
                    </svg>
                  )
                })()
              ) : (
                <Typography sx={{ color: '#555' }}>No price history available</Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#fff', mb: 2 }}>Order book</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#aaa', mb: 1 }}>Asks</Typography>
                  <List dense>
                    {orderBook.asks.map((a: any, i: number) => (
                      <ListItem key={`ask-${i}`} sx={{ py: 0 }}>
                        <ListItemText primary={`${formatCurrency(a.price)}`} secondary={`Size: ${a.size}`} primaryTypographyProps={{ color: '#ff6b6b' }} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#aaa', mb: 1 }}>Bids</Typography>
                  <List dense>
                    {orderBook.bids.map((b: any, i: number) => (
                      <ListItem key={`bid-${i}`} sx={{ py: 0 }}>
                        <ListItemText primary={`${formatCurrency(b.price)}`} secondary={`Size: ${b.size}`} primaryTypographyProps={{ color: '#8cffb2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2 }}>
              <Typography sx={{ color: '#fff', mb: 2 }}>Orders & Positions</Typography>

              <Typography sx={{ color: '#ccc', mb: 1 }}>Open Orders</Typography>
              {orders.length ? (
                <List dense>
                  {orders.map((o) => (
                    <ListItem key={o.id} sx={{ py: 0 }}>
                      <ListItemText primary={`${o.side.toUpperCase()} ${o.quantity} @ ${o.price ? formatCurrency(o.price) : 'MKT'}`} secondary={`Status: ${o.status ?? 'open'}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: '#555', fontSize: '13px' }}>No open orders</Typography>
              )}

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

              <Typography sx={{ color: '#ccc', mb: 1 }}>Positions</Typography>
              {positions.length ? (
                <List dense>
                  {positions.map((p) => (
                    <ListItem key={p.id || p.assetId} sx={{ py: 0 }}>
                      <ListItemText primary={`${p.quantity} shares`} secondary={`Avg Price: ${formatCurrency(p.avgPrice ?? p.averagePrice ?? p.price)}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: '#555', fontSize: '13px' }}>No positions</Typography>
              )}
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
              <Typography sx={{ color: '#fff', mb: 2 }}>Order form</Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Side</InputLabel>
                <Select value={side} label="Side" onChange={(e) => setSide(e.target.value as any)}>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Type</InputLabel>
                <Select value={orderType} label="Type" onChange={(e) => setOrderType(e.target.value as any)}>
                  <MenuItem value="market">Market</MenuItem>
                  <MenuItem value="limit">Limit</MenuItem>
                </Select>
              </FormControl>

              <TextField type="number" size="small" label="Quantity" fullWidth value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} sx={{ mb: 2 }} />

              {orderType === 'limit' && (
                <TextField type="number" size="small" label="Limit price" fullWidth value={limitPrice} onChange={(e) => setLimitPrice(e.target.value === '' ? '' : Number(e.target.value))} sx={{ mb: 2 }} />
              )}

              <Button variant="contained" color={side === 'buy' ? 'success' : 'error'} fullWidth onClick={submitOrder} disabled={submitting} sx={{ textTransform: 'none' }}>
                {submitting ? 'Submitting...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${quantity}`}
              </Button>

              <Typography sx={{ color: '#999', fontSize: '12px', mt: 2 }}>
                Estimated notional: {formatCurrency((orderType === 'limit' && limitPrice) ? Number(limitPrice) * Number(quantity) : Number(asset.currentValue) * Number(quantity))}
              </Typography>
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
