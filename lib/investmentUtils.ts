// Utility functions for investment-related operations

import { LocalHospital, Bolt, ShoppingBag, AttachMoney, Business, SvgIconComponent } from '@mui/icons-material'
import React from 'react'

export interface CategoryConfig {
  icon: React.ReactNode
  label: string
}

export const getCategoryIcon = (category: string): React.ElementType => {
  switch (category) {
    case 'tech':
      return Business
    case 'healthcare':
      return LocalHospital
    case 'energy':
      return Bolt
    case 'consumer':
      return ShoppingBag
    case 'finance':
      return AttachMoney
    default:
      return Business
  }
}

export const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'tech':
      return 'Technology'
    case 'healthcare':
      return 'Healthcare'
    case 'energy':
      return 'Energy'
    case 'consumer':
      return 'Consumer'
    case 'finance':
      return 'Finance'
    default:
      return 'All'
  }
}

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}

export const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Generate trend data for charts
export const generateTrendData = (isPositive: boolean, count: number = 20): number[] => {
  const data: number[] = []
  const base = 50
  for (let i = 0; i < count; i++) {
    const variation = (Math.random() - 0.5) * 20
    const trend = isPositive ? (i / count) * 30 : -(i / count) * 10
    data.push(Math.max(20, Math.min(80, base + variation + trend)))
  }
  return data
}

type DailyHistoryTemplate = {
  date: string
  closeMultiplier: number
  volume: number
}

const getSeedFromString = (value: string): number => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const createSeededRandom = (seed: number) => {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export const getSecondaryTradingSymbol = (title: string, explicitSymbol?: string): string => {
  if (explicitSymbol && explicitSymbol.trim().length) {
    return explicitSymbol.toUpperCase()
  }
  const normalized = (title ?? '').replace(/[^A-Za-z]/g, '').toUpperCase()
  return normalized.slice(0, 4) || 'TZERO'
}

export const getSeededColor = (value: string): string => {
  const seed = getSeedFromString(value)
  const hue = seed % 360
  return `hsl(${hue}, 68%, 45%)`
}

export const buildSecondaryTradingDailyHistory = (
  basePrice: number,
  seedKey: string,
  template: DailyHistoryTemplate[]
) => {
  const seed = getSeedFromString(seedKey)
  const random = createSeededRandom(seed)
  const safeBase = basePrice || 1
  const round = (value: number) => Math.round(value * 10000) / 10000

  return template.map((entry) => {
    const closeJitter = (random() - 0.5) * 0.04
    const close = round(safeBase * entry.closeMultiplier * (1 + closeJitter))
    const open = round(close * (1 + (random() - 0.5) * 0.01))
    const high = round(Math.max(open, close) * (1.01 + random() * 0.02))
    const low = round(Math.min(open, close) * (0.99 - random() * 0.02))
    const volume = Math.round(entry.volume * (0.9 + random() * 0.3))

    return {
      date: entry.date,
      open,
      high,
      low,
      close,
      volume,
    }
  })
}

export const buildSecondaryTradingMonthlySeries = (
  basePrice: number,
  seedKey: string,
  template: DailyHistoryTemplate[],
  lookback: number = 30
) => {
  return buildSecondaryTradingDailyHistory(basePrice, seedKey, template)
    .slice(-lookback)
    .map((entry) => entry.close)
}
