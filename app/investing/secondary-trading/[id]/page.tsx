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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Skeleton,
  Tooltip,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { Edit, Cancel, Refresh } from '@mui/icons-material'
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
  const [assetTrades, setAssetTrades] = useState<any[]>([])

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [quantity, setQuantity] = useState<number>(1)
  const [limitPrice, setLimitPrice] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [editQty, setEditQty] = useState<number | ''>('')
  const [editPrice, setEditPrice] = useState<number | ''>('')
  const [cancellingOrderIds, setCancellingOrderIds] = useState<Record<string, boolean>>({})
  const [cancelConfirmOrderId, setCancelConfirmOrderId] = useState<string | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Snackbar feedback
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' })
  const showSnack = (message: string, severity: 'success' | 'error' | 'info' = 'success') => setSnack({ open: true, message, severity })

  // Inline form validation errors
  const [formErrors, setFormErrors] = useState<{ quantity?: string; limitPrice?: string }>({})

  const validateForm = (): boolean => {
    const errors: { quantity?: string; limitPrice?: string } = {}
    const qty = Number(quantity)
    if (!qty || qty <= 0) errors.quantity = 'Quantity must be greater than 0'
    else if (!Number.isInteger(qty)) errors.quantity = 'Quantity must be a whole number'
    if (orderType === 'limit') {
      if (limitPrice === '' || limitPrice === undefined) errors.limitPrice = 'Limit price is required'
      else if (Number(limitPrice) <= 0) errors.limitPrice = 'Price must be greater than 0'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

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
      // deterministic pseudo-random generator (stable between server and client)
      const seedBase = String(asset.id || asset.title || symbol)
      const seededRandom = (seedStr: string, n: number) => {
        // simple FNV-1a hash variant then xorshift to produce a stable 0..1 value
        let h = 2166136261 >>> 0
        for (let j = 0; j < seedStr.length; j++) h = Math.imul(h ^ seedStr.charCodeAt(j), 16777619)
        h = (h + n) >>> 0
        // xorshift
        h ^= h << 13
        h ^= h >>> 7
        h ^= h << 17
        return (h >>> 0) / 4294967295
      }

      for (let i = 1; i <= 5; i++) {
        const rndA = seededRandom(seedBase, i * 2)
        const rndB = seededRandom(seedBase, i * 2 + 1)
        asks.push({ price: +(mid + i * (mid * 0.01)).toFixed(2), size: Math.round(rndA * 50) + 1 })
        bids.push({ price: +(mid - i * (mid * 0.01)).toFixed(2), size: Math.round(rndB * 50) + 1 })
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
    if (!isAuthenticated) { setLoadingOrders(false); return }

    let mounted = true

    ;(async () => {
      try {
        const [ordersRes, positionsRes, tradesRes] = await Promise.all([
          fetch('/api/trading/orders'),
          fetch('/api/trading/positions'),
          fetch('/api/trading/trades'),
        ])

        if (!mounted) return

        if (ordersRes.ok) {
          const json = await ordersRes.json()
          const allOrders = Array.isArray(json) ? json : json.orders ?? []
          const filtered = allOrders.filter((o: any) => {
            const symbolMatch = (o.symbol && String(o.symbol) === String(symbol)) || o.assetId === asset.id
            const isOpen = !['Completed', 'Cancelled'].includes(o.status)
            return symbolMatch && isOpen
          })
          setOrders(filtered)
        }
        if (positionsRes.ok) {
          const json = await positionsRes.json()
          const allPositions = Array.isArray(json) ? json : json.positions ?? []
          const filteredPos = allPositions.filter((p: any) => String(p.symbol) === String(symbol))
          setPositions(filteredPos)
        }
        if (tradesRes.ok) {
          const json = await tradesRes.json()
          const allTrades = (json.trades ?? []) as any[]
          setAssetTrades(allTrades.filter((t: any) => String(t.symbol) === String(symbol)))
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingOrders(false)
      }
    })()

    return () => { mounted = false }
  }, [isAuthenticated, symbol, asset.id])

  async function submitOrder() {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    if (!validateForm()) return

    const qty = Number(quantity)
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        showSnack(errData.error || 'Order failed. Please try again.', 'error')
        return
      }

      const created = await res.json()
      setOrders((prev) => [{ id: created?.id ?? `local-${Date.now()}`, assetId: asset.id, side, orderType, quantity: qty, price: payload.price, status: created?.status ?? 'open', createdAt: new Date().toISOString() }, ...prev])
      showSnack(`${side === 'buy' ? 'Buy' : 'Sell'} order placed for ${qty} ${symbol}`, 'success')
      if (orderType === 'market') setLimitPrice('')
    } catch (e) {
      showSnack('Network error. Please check your connection.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(orderId: string) {
    setCancellingOrderIds((s) => ({ ...s, [orderId]: true }))
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelling' } : o)))
    try {
      const res = await fetch(`/api/trading/orders/${orderId}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error('Cancel failed')
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      showSnack('Order cancelled', 'info')
    } catch (e) {
      showSnack('Failed to cancel order. Please try again.', 'error')
      await refreshOrders()
    } finally {
      setCancellingOrderIds((s) => { const copy = { ...s }; delete copy[orderId]; return copy })
    }
  }

  async function handleEdit(order: any) {
    setEditingOrder(order)
    setEditQty(order.quantity)
    setEditPrice(order.price)
  }

  async function submitEdit() {
    if (!editingOrder) return
    const orderId = editingOrder.id
    const payload: any = {}
    if (editQty !== '') payload.quantity = Number(editQty)
    if (editPrice !== '') payload.price = Number(editPrice)

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, quantity: payload.quantity ?? o.quantity, price: payload.price ?? o.price } : o)))

    try {
      const execRes = await fetch(`/api/trading/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!execRes.ok) {
        await refreshOrders()
        await refreshPositions()
        showSnack('Failed to update order. Refreshed from server.', 'error')
        setEditingOrder(null)
        return
      }

      const execJson = await execRes.json()

      // /complete always force-completes the order — remove it from open orders
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      showSnack('Order executed successfully', 'success')

      await Promise.all([refreshOrders(), refreshPositions(), refreshTrades()])
      setEditingOrder(null)
    } catch (e) {
      showSnack('Network error updating order.', 'error')
      await refreshOrders()
      await refreshPositions()
      setEditingOrder(null)
    }
  }

  async function refreshOrders() {
    try {
      const res = await fetch('/api/trading/orders')
      if (!res.ok) return
      const data = await res.json()
      const allOrders = Array.isArray(data) ? data : data.orders ?? []
      const filtered = allOrders.filter((o: any) => {
        const symbolMatch = (o.symbol && String(o.symbol) === String(symbol)) || o.assetId === asset.id
        const isOpen = !['Completed', 'Cancelled'].includes(o.status)
        return symbolMatch && isOpen
      })
      setOrders(filtered)
    } catch (e) {
      console.error('Error refreshing orders', e)
    }
  }

  async function refreshPositions() {
    try {
      const resp = await fetch('/api/trading/positions')
      if (!resp.ok) return
      const data = await resp.json()
      const allPositions = Array.isArray(data) ? data : data.positions ?? []
      const filteredPos = allPositions.filter((p: any) => String(p.symbol) === String(symbol))
      setPositions(filteredPos)
    } catch (err) {
      console.error('Error refreshing positions', err)
    }
  }

  async function refreshTrades() {
    try {
      const resp = await fetch('/api/trading/trades')
      if (!resp.ok) return
      const data = await resp.json()
      const allTrades = (data.trades ?? []) as any[]
      setAssetTrades(allTrades.filter((t: any) => String(t.symbol) === String(symbol)))
    } catch (err) {
      console.error('Error refreshing trades', err)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      <Header />

      <Container maxWidth="xl" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 6 }}>

        {/* Back nav */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/investing/secondary-trading')}
          sx={{ color: '#666', mb: 3, textTransform: 'none', fontSize: '13px', '&:hover': { color: '#fff' } }}
        >
          Secondary Marketplace
        </Button>

        {/* ── ASSET HEADER ─────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px',
              backgroundColor: getSeededColor(symbol),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.5px' }}>
                {symbol.slice(0, 2)}
              </Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {asset.title}
                </Typography>
                <Box sx={{ px: 1, py: 0.25, borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography sx={{ color: '#aaa', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {symbol}
                  </Typography>
                </Box>
                <Box sx={{ px: 1, py: 0.25, borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <Typography sx={{ color: '#666', fontSize: '11px', textTransform: 'capitalize' }}>
                    {asset.category}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '26px', color: '#fff', lineHeight: 1 }}>
                  {formatCurrency(asset.currentValue)}
                </Typography>
                <Typography sx={{
                  color: asset.isPositive ? '#22c55e' : '#ef4444',
                  fontWeight: 600, fontSize: '14px',
                }}>
                  {asset.isPositive ? '▲' : '▼'} {Math.abs(asset.performancePercent).toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Quick stats strip */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'Open', value: formatCurrency(asset.openPrice) },
              { label: 'High', value: formatCurrency(asset.high) },
              { label: 'Low', value: formatCurrency(asset.low) },
              { label: 'Bid', value: formatCurrency(asset.bid) },
              { label: 'Ask', value: formatCurrency(asset.ask) },
              { label: 'Volume', value: asset.volume ?? asset.avgVolume ?? '—' },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>{label}</Typography>
                <Typography sx={{ color: '#ddd', fontSize: '13px', fontWeight: 600 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── MAIN GRID ─────────────────────────────────────────────── */}
        <Grid container spacing={2.5}>

          {/* LEFT: chart + about + order book */}
          <Grid item xs={12} lg={8}>

            {/* Price chart */}
            <Paper sx={{ p: 3, backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, mb: 2.5 }}>
              <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px', mb: 2.5 }}>Price Chart</Typography>
              {sparklinePath ? (
                (() => {
                  const history = asset.dailyHistory || []
                  const values: number[] = history.map((d: any) => Number(d.close ?? d.c ?? d[4] ?? 0))
                  if (!values.length) return null

                  const w = 860
                  const h = 200
                  const leftMargin = 56
                  const topMargin = 8
                  const rightMargin = 16
                  const bottomMargin = 36
                  const svgW = leftMargin + w + rightMargin
                  const svgH = topMargin + h + bottomMargin

                  const max = Math.max(...values)
                  const min = Math.min(...values)
                  const range = max - min || 1

                  const points: { x: number; y: number }[] = values.map((v: number, i: number) => ({
                    x: leftMargin + (i / (values.length - 1)) * w,
                    y: topMargin + (h - ((v - min) / range) * h),
                  }))

                  const pathD = `M${points.map((p) => `${p.x},${p.y}`).join(' L')}`
                  // area fill path
                  const areaD = `${pathD} L${points[points.length - 1].x},${topMargin + h} L${points[0].x},${topMargin + h} Z`

                  const yTickCount = 4
                  const yTicks = Array.from({ length: yTickCount + 1 }).map((_, ti) => {
                    const frac = ti / yTickCount
                    return { value: max - frac * range, y: topMargin + frac * h }
                  })

                  const xIndices = [0, Math.floor((values.length - 1) / 3), Math.floor((values.length - 1) * 2 / 3), values.length - 1]
                  const formatX = (d: any, idx: number) => {
                    const maybeDate = d?.date ?? d?.t ?? d?.time ?? d?.x
                    if (maybeDate) {
                      try {
                        const t = typeof maybeDate === 'number' && String(maybeDate).length <= 10 ? maybeDate * 1000 : maybeDate
                        return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      } catch { return String(maybeDate) }
                    }
                    return `Day ${idx + 1}`
                  }

                  const gradientId = `chart-grad-${symbol}`
                  const isUp = asset.isPositive
                  const lineColor = isUp ? '#22c55e' : '#ef4444'
                  const gradColor = isUp ? '#22c55e' : '#ef4444'

                  return (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', maxWidth: '100%' }}>
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradColor} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={gradColor} stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* grid lines */}
                        {yTicks.map((yt, i) => (
                          <line key={i} x1={leftMargin} x2={svgW - rightMargin} y1={yt.y} y2={yt.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                        ))}

                        {/* area fill */}
                        <path d={areaD} fill={`url(#${gradientId})`} />

                        {/* line */}
                        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

                        {/* y labels */}
                        {yTicks.map((yt, i) => (
                          <text key={i} x={leftMargin - 8} y={yt.y + 4} fontSize={10} fill="#555" textAnchor="end">{formatCurrency(yt.value)}</text>
                        ))}

                        {/* x labels */}
                        {xIndices.map((xi, i) => {
                          const p = points[xi]
                          if (!p) return null
                          const isFirst = i === 0
                          const isLast = i === xIndices.length - 1
                          const anchor: 'start' | 'middle' | 'end' = isFirst ? 'start' : isLast ? 'end' : 'middle'
                          const xPos = isFirst ? Math.max(p.x, leftMargin + 2) : isLast ? Math.min(p.x, svgW - rightMargin - 2) : p.x
                          return (
                            <text key={xi} x={xPos} y={topMargin + h + 20} fontSize={10} fill="#555" textAnchor={anchor}>
                              {formatX(history[xi], xi)}
                            </text>
                          )
                        })}

                        {/* axes */}
                        <line x1={leftMargin} y1={topMargin} x2={leftMargin} y2={topMargin + h} stroke="rgba(255,255,255,0.08)" />
                        <line x1={leftMargin} y1={topMargin + h} x2={svgW - rightMargin} y2={topMargin + h} stroke="rgba(255,255,255,0.08)" />
                      </svg>
                    </Box>
                  )
                })()
              ) : (
                <Typography sx={{ color: '#444', fontSize: '13px' }}>No price history available</Typography>
              )}
            </Paper>

            {/* About */}
            {asset.companyDescription && (
              <Paper sx={{ p: 3, backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, mb: 2.5 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px', mb: 1.5 }}>About {asset.title}</Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
                <Typography sx={{ color: '#888', fontSize: '13px', lineHeight: 1.8 }}>
                  {asset.companyDescription}
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, mt: 2.5, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Market Cap', value: asset.marketCap },
                    { label: 'Revenue', value: asset.revenue },
                    { label: 'Revenue Growth', value: asset.revenueGrowth ? `${asset.revenueGrowth}%` : null },
                    { label: 'Net Income', value: asset.netIncome },
                    { label: 'P/E Ratio', value: asset.peRatio },
                    { label: 'Dividend Yield', value: asset.dividendYield ? `${asset.dividendYield}%` : null },
                    { label: 'Employees', value: asset.employees },
                    { label: 'Founded', value: asset.founded },
                    { label: '52-wk Range', value: asset.priceRange },
                  ].filter(({ value }) => value != null).map(({ label, value }) => (
                    <Box key={label}>
                      <Typography sx={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>{label}</Typography>
                      <Typography sx={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>{String(value)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Order book */}
            <Paper sx={{ p: 3, backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2 }}>
              <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px', mb: 2 }}>Order Book</Typography>
              <Grid container spacing={0}>
                {/* Header row */}
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ask Price</Typography>
                    <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</Typography>
                  </Box>
                  {orderBook.asks.map((a: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                      <Typography sx={{ color: '#ef4444', fontSize: '13px', fontFamily: 'monospace' }}>{formatCurrency(a.price)}</Typography>
                      <Typography sx={{ color: '#666', fontSize: '13px', fontFamily: 'monospace' }}>{a.size}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={6} sx={{ borderLeft: '1px solid rgba(255,255,255,0.06)', pl: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bid Price</Typography>
                    <Typography sx={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</Typography>
                  </Box>
                  {orderBook.bids.map((b: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                      <Typography sx={{ color: '#22c55e', fontSize: '13px', fontFamily: 'monospace' }}>{formatCurrency(b.price)}</Typography>
                      <Typography sx={{ color: '#666', fontSize: '13px', fontFamily: 'monospace' }}>{b.size}</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* RIGHT: order form + orders & positions */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 100 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              {/* Order form */}
              <Paper sx={{ p: 3, backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px', mb: 2.5 }}>Place Order</Typography>

                {/* Buy / Sell toggle */}
                <Box sx={{ display: 'flex', mb: 2.5, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {(['buy', 'sell'] as const).map((s) => (
                    <Box
                      key={s}
                      onClick={() => setSide(s)}
                      sx={{
                        flex: 1, py: 1, textAlign: 'center', cursor: 'pointer',
                        backgroundColor: side === s ? (s === 'buy' ? '#166534' : '#7f1d1d') : 'transparent',
                        transition: 'background-color 0.15s',
                        '&:hover': { backgroundColor: side !== s ? 'rgba(255,255,255,0.04)' : undefined },
                      }}
                    >
                      <Typography sx={{ color: side === s ? '#fff' : '#555', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{s}</Typography>
                    </Box>
                  ))}
                </Box>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel sx={{ fontSize: '13px' }}>Order Type</InputLabel>
                  <Select value={orderType} label="Order Type" onChange={(e) => setOrderType(e.target.value as any)} sx={{ fontSize: '13px' }}>
                    <MenuItem value="market">Market</MenuItem>
                    <MenuItem value="limit">Limit</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  type="number" size="small" label="Quantity" fullWidth
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value))
                    if (formErrors.quantity) setFormErrors((p) => ({ ...p, quantity: undefined }))
                  }}
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ mb: formErrors.quantity ? 1 : 2, '& input': { fontSize: '13px' } }}
                />

                {orderType === 'limit' && (
                  <TextField
                    type="number" size="small" label="Limit Price" fullWidth
                    value={limitPrice}
                    onChange={(e) => {
                      setLimitPrice(e.target.value === '' ? '' : Number(e.target.value))
                      if (formErrors.limitPrice) setFormErrors((p) => ({ ...p, limitPrice: undefined }))
                    }}
                    error={!!formErrors.limitPrice}
                    helperText={formErrors.limitPrice}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    sx={{ mb: formErrors.limitPrice ? 1 : 2, '& input': { fontSize: '13px' } }}
                  />
                )}

                {/* Estimated notional */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5, px: 0.5 }}>
                  <Typography sx={{ color: '#555', fontSize: '12px' }}>Est. Notional</Typography>
                  <Typography sx={{ color: '#aaa', fontSize: '12px', fontWeight: 600 }}>
                    {formatCurrency((orderType === 'limit' && limitPrice) ? Number(limitPrice) * Number(quantity) : Number(asset.currentValue) * Number(quantity))}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={submitOrder}
                  disabled={submitting}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: '14px', py: 1.25, borderRadius: '8px',
                    backgroundColor: side === 'buy' ? '#16a34a' : '#dc2626',
                    '&:hover': { backgroundColor: side === 'buy' ? '#15803d' : '#b91c1c' },
                  }}
                >
                  {submitting ? 'Submitting…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${symbol}`}
                </Button>
              </Paper>

              {/* Orders & Positions */}
              <Paper sx={{ p: 3, backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Orders & Positions</Typography>
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={() => { refreshOrders(); refreshPositions(); refreshTrades() }} sx={{ color: '#555', p: 0.5, '&:hover': { color: '#fff' } }}>
                      <Refresh sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography sx={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>Open Orders</Typography>
                {loadingOrders ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {[1, 2].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />)}
                  </Box>
                ) : orders.length ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {orders.map((o) => (
                      <Box key={o.id} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 1.5, py: 1, borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <Box>
                          <Typography sx={{
                            color: o.side === 'buy' ? '#22c55e' : '#ef4444',
                            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                          }}>
                            {o.side} {o.quantity}
                          </Typography>
                          <Typography sx={{ color: '#555', fontSize: '11px' }}>
                            {o.price ? `@ ${formatCurrency(o.price)}` : 'Market'} · {o.status ?? 'open'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {o.status !== 'Cancelling' ? (
                            <>
                              <Tooltip title="Edit order">
                                <IconButton size="small" onClick={() => handleEdit(o)} sx={{ p: 0.5, '&:hover svg': { color: '#fff' } }}>
                                  <Edit sx={{ fontSize: 14, color: '#555' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel order">
                                <IconButton size="small" onClick={() => setCancelConfirmOrderId(o.id)} sx={{ p: 0.5, '&:hover svg': { color: '#ef4444' } }}>
                                  <Cancel sx={{ fontSize: 14, color: '#555' }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Typography sx={{ color: '#f59e0b', fontSize: '10px' }}>Cancelling…</Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: '#333', fontSize: '12px', mb: 2 }}>No open orders</Typography>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 2 }} />

                <Typography sx={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>Positions</Typography>
                {loadingOrders ? (
                  <Skeleton variant="rounded" height={52} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
                ) : positions.length ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {positions.map((p: any, i: number) => (
                      <Box key={p.id ?? i} sx={{
                        display: 'flex', justifyContent: 'space-between',
                        px: 1.5, py: 1, borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <Box>
                          <Typography sx={{ color: '#ccc', fontSize: '12px', fontWeight: 600 }}>{Number(p.shares)} shares</Typography>
                          <Typography sx={{ color: '#555', fontSize: '11px' }}>Avg {formatCurrency(Number(p.avg_cost) || 0)}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ color: '#00ff88', fontSize: '12px', fontWeight: 600 }}>
                            {formatCurrency(Number(p.shares) * Number(p.avg_cost))}
                          </Typography>
                          <Typography sx={{ color: '#555', fontSize: '11px' }}>value</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: '#333', fontSize: '12px' }}>No positions</Typography>
                )}

                {/* Trade history for this asset */}
                {!loadingOrders && assetTrades.length > 0 && (
                  <>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 2 }} />
                    <Typography sx={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>Trade History</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {assetTrades.map((t: any, i: number) => (
                        <Box key={t.id ?? i} sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          px: 1.5, py: 1, borderRadius: '8px',
                          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <Box>
                            <Typography sx={{
                              color: t.side === 'buy' ? '#22c55e' : '#ef4444',
                              fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                            }}>
                              {t.side} {t.quantity}
                            </Typography>
                            <Typography sx={{ color: '#555', fontSize: '11px' }}>
                              @ {formatCurrency(Number(t.price))}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ color: '#ccc', fontSize: '12px', fontWeight: 600 }}>
                              {formatCurrency(Number(t.price) * Number(t.quantity))}
                            </Typography>
                            <Typography sx={{ color: '#444', fontSize: '10px' }}>
                              {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Paper>

            </Box>
          </Grid>
        </Grid>

        {/* Cancel Order Confirmation Dialog */}
        <Dialog
          open={!!cancelConfirmOrderId}
          onClose={() => setCancelConfirmOrderId(null)}
          PaperProps={{ sx: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, minWidth: 320 } }}
        >
          <DialogTitle sx={{ color: '#fff', fontSize: '15px', fontWeight: 600, pb: 1 }}>Cancel Order</DialogTitle>
          <DialogContent sx={{ pt: 0.5 }}>
            <Typography sx={{ color: '#ccc', fontSize: '13px' }}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCancelConfirmOrderId(null)} sx={{ color: '#aaa', textTransform: 'none', '&:hover': { color: '#fff' } }}>
              Keep Order
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const id = cancelConfirmOrderId!
                setCancelConfirmOrderId(null)
                handleCancel(id)
              }}
              sx={{ textTransform: 'none', backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}
            >
              Yes, Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog
          open={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          PaperProps={{ sx: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, minWidth: 320 } }}
        >
          <DialogTitle sx={{ color: '#fff', fontSize: '15px', fontWeight: 600, pb: 1 }}>Edit Order</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              type="number" label="Quantity" fullWidth size="small"
              value={editQty} onChange={(e) => setEditQty(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 1, step: 1 }}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              type="number" label="Limit Price" fullWidth size="small"
              value={editPrice} onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditingOrder(null)} sx={{ color: '#555', textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={submitEdit} sx={{ textTransform: 'none', backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }}>
              Save &amp; Execute
            </Button>
          </DialogActions>
        </Dialog>

        {/* Global feedback snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snack.severity}
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            sx={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', '& .MuiAlert-icon': { alignItems: 'center' } }}
          >
            {snack.message}
          </Alert>
        </Snackbar>

      </Container>
    </Box>
  )
}
