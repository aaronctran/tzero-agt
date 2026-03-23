'use client'

import { useRouter } from 'next/navigation'
import { Box, Container, Typography, Button, Grid, Card, CardContent, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import RotatingPyramid from './RotatingPyramid'
import SecondaryTradingCard, { SecondaryTradingCardData } from './investments/SecondaryTradingCard'
import SectionHeader from './investments/SectionHeader'
import Footer from './Footer'
import { buildSecondaryTradingMonthlySeries, getSecondaryTradingSymbol } from '@/lib/investmentUtils'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import {
  TrendingUp,
  AccountBalance,
  SwapHoriz,
  ArrowForward,
} from '@mui/icons-material'
import styles from './LandingPage.module.css'

type SecondaryTradingInvestment = {
  id: string
  title: string
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  category: 'tech' | 'healthcare' | 'energy' | 'consumer' | 'finance' | 'blockchain-inside' | 'blockchain-enhanced'
  symbol?: string
  logoUrl?: string
  volume?: string
  basePrice?: number
  dailyHistory?: Array<{ date: string; close?: number; closeMultiplier?: number }>
}

const buildSecondaryCard = (investment: SecondaryTradingInvestment): SecondaryTradingCardData => {
  const monthlyTemplate = secondaryTradingAssets.templates.dailyHistory
  let trendData: number[]

  if (investment.dailyHistory && Array.isArray(investment.dailyHistory) && investment.dailyHistory.length > 0) {
    trendData = investment.dailyHistory
      .slice(-30)
      .map((entry: any) => entry.close || entry.closeMultiplier * (investment.basePrice ?? investment.currentValue))
  } else {
    trendData = buildSecondaryTradingMonthlySeries(
      investment.basePrice ?? investment.currentValue,
      investment.id ?? investment.title,
      monthlyTemplate,
      30
    )
  }

  const categoryMap: Record<string, SecondaryTradingCardData['category']> = {
    'blockchain-inside': 'tech',
    'blockchain-enhanced': 'tech',
    tech: 'tech',
    healthcare: 'healthcare',
    energy: 'energy',
    consumer: 'consumer',
    finance: 'finance',
  }

  return {
    id: investment.id ?? investment.title,
    title: investment.title,
    symbol: getSecondaryTradingSymbol(investment.title, investment.symbol),
    logoUrl: investment.logoUrl,
    previousValue: investment.previousValue,
    currentValue: investment.currentValue,
    performancePercent: investment.performancePercent,
    isPositive: investment.isPositive,
    category: categoryMap[investment.category] ?? 'tech',
    volume: investment.volume ?? '--',
    trendData,
  }
}

export default function LandingPage() {
  const router = useRouter()
  const theme = useTheme()
  const { isAuthenticated } = useAuth()

  const secondaryInvestments = (secondaryTradingAssets.investments as SecondaryTradingInvestment[])
    .slice(0, 6)
    .map(buildSecondaryCard)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Pyramid Animation */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.08,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <RotatingPyramid />
      </Box>

      {/* Hero Section */}
      <Box sx={{ pt: { xs: 12, sm: 16 }, pb: { xs: 8, sm: 12 }, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Container maxWidth="md">
          <Chip
            label="Secondary Marketplace"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(0, 255, 136, 0.15)',
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#ffffff',
              mb: 2,
              fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
              lineHeight: 1.2,
            }}
          >
            Trade Digital Securities
          </Typography>
          <Typography
            sx={{
              color: '#888888',
              fontSize: { xs: '16px', sm: '18px' },
              maxWidth: 600,
              mx: 'auto',
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Browse assets, place buy and sell orders, and manage your portfolio
            on our secondary marketplace.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => router.push('/investing/secondary-trading')}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: '#000000',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: '16px',
                '&:hover': { backgroundColor: '#00E677' },
              }}
            >
              Explore Marketplace
            </Button>
            {!isAuthenticated && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/auth')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)' },
                }}
              >
                Sign Up
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ pb: 8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          {[
            { icon: <SwapHoriz sx={{ fontSize: 32 }} />, title: 'Trade Assets', desc: 'Buy and sell digital securities on the secondary market' },
            { icon: <TrendingUp sx={{ fontSize: 32 }} />, title: 'Track Performance', desc: 'Monitor price trends, volume, and portfolio performance' },
            { icon: <AccountBalance sx={{ fontSize: 32 }} />, title: 'Manage Portfolio', desc: 'View holdings, order history, and cash balance' },
          ].map((feature, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>{feature.title}</Typography>
                  <Typography sx={{ color: '#888888', fontSize: '14px' }}>{feature.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Assets */}
      <Box sx={{ pb: 8, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg">
          <SectionHeader
            title="Featured Assets"
            subtitle="Popular securities available for trading"
          />
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {secondaryInvestments.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
                <SecondaryTradingCard
                  card={card}
                  basePath="/investing/secondary-trading"
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => router.push('/investing/secondary-trading')}
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 600,
                px: 4,
                '&:hover': { backgroundColor: 'rgba(0,255,136,0.1)' },
              }}
            >
              View All Assets
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  )
}
