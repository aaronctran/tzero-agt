'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, Box, Typography, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TrendingUp, TrendingDown, Login, ArrowForward } from '@mui/icons-material'
import TrendGraph from './TrendGraph'
import { formatCurrency, getSecondaryTradingSymbol, getSeededColor, slugify } from '@/lib/investmentUtils'
import styles from './SecondaryTradingCard.module.css'
import clsx from 'clsx'

export interface SecondaryTradingCardData {
  id: string
  title: string
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  trendData: number[]
  symbol?: string
  logoUrl?: string
  volume?: string
  lastPrice?: string
  category: 'tech' | 'healthcare' | 'energy' | 'consumer' | 'finance'
}

interface SecondaryTradingCardProps {
  card: SecondaryTradingCardData
  basePath?: string
  isAuthenticated?: boolean
}

export default function SecondaryTradingCard({ card, basePath = '/investing/secondary-trading', isAuthenticated = false }: SecondaryTradingCardProps) {
  const theme = useTheme()
  const router = useRouter()
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const symbol = getSecondaryTradingSymbol(card.title, card.symbol)
  const logoText = symbol.slice(0, 2)
  const logoColor = getSeededColor(symbol)

  const handleCardClick = () => {
    // Don't handle click if dialog is open
    if (loginDialogOpen) {
      return
    }
    if (!isAuthenticated) {
      setLoginDialogOpen(true)
      return
    }
    const slug = slugify(card.title)
    router.push(`${basePath}/${encodeURIComponent(slug)}`)
  }

  const handleSignIn = () => {
    setLoginDialogOpen(false)
    router.push('/auth')
  }

  return (
    <Card
      onClick={handleCardClick}
      className={clsx(styles.card, card.isPositive ? styles.cardPositive : styles.cardNegative)}
    >
      <CardContent className={styles.cardContent}>
        {/* Header with Title and Performance */}
        <Box className={styles.header}>
          <Box className={styles.titleBlock}>
            <Box
              className={styles.logo}
              sx={{
                background: `linear-gradient(135deg, ${logoColor}, rgba(0,0,0,0.35))`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {card.logoUrl ? (
                <Image
                  src={card.logoUrl}
                  alt={`${card.title} logo`}
                  fill
                  className={styles.logoImage}
                  style={{
                    objectFit: 'contain',
                  }}
                  unoptimized
                />
              ) : (
                logoText
              )}
            </Box>
            <Box>
              <Typography variant="h6" className={styles.title}>
                {card.title}
              </Typography>
              <Typography variant="caption" className={styles.symbol}>
                {symbol}
              </Typography>
            </Box>
          </Box>
          <Box className={clsx(styles.performanceBadge, card.isPositive ? styles.performanceBadgePositive : styles.performanceBadgeNegative)}>
            {card.isPositive ? (
              <TrendingUp sx={{ fontSize: 18, color: theme.palette.primary.main }} />
            ) : (
              <TrendingDown sx={{ fontSize: 18, color: theme.palette.primary.main }} />
            )}
            <Typography
              variant="body2"
              className={clsx(styles.performanceValue, card.isPositive ? styles.performanceValuePositive : styles.performanceValueNegative)}
            >
              {card.isPositive ? '+' : ''}{card.performancePercent.toFixed(2)}%
            </Typography>
          </Box>
        </Box>

        {/* Current Value with Trend Graph */}
        <Box className={styles.currentValueSection}>
          <Box className={styles.currentValueLeft}>
            <Typography variant="caption" className={styles.currentValueLabel}>
              Current Value
            </Typography>
            <Typography 
              variant="h5" 
              className={styles.currentValue}
              sx={!isAuthenticated ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
            >
              {formatCurrency(card.currentValue)}
            </Typography>
            <Typography
              variant="caption"
              className={clsx(styles.valueChange, card.isPositive ? styles.valueChangePositive : styles.valueChangeNegative)}
              sx={!isAuthenticated ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
            >
              {card.isPositive ? '+' : ''}{formatCurrency(card.currentValue - card.previousValue)}
            </Typography>
          </Box>
          <Box className={styles.trendGraphContainer}>
            <TrendGraph data={card.trendData} isPositive={card.isPositive} width={140} height={70} />
          </Box>
        </Box>

        <Divider className={styles.divider} />

        {/* Previous Value and Additional Info */}
        <Box className={styles.additionalInfoContainer}>
          <Box className={styles.additionalInfoItem}>
            <Typography variant="caption" className={styles.additionalInfoLabel}>
              Previous Value
            </Typography>
            <Typography 
              variant="body2" 
              className={styles.additionalInfoValue}
              sx={!isAuthenticated ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
            >
              {formatCurrency(card.previousValue)}
            </Typography>
          </Box>
          {card.volume && card.lastPrice && (
            <>
              <Box className={styles.additionalInfoItem}>
                <Typography variant="caption" className={styles.additionalInfoLabel}>
                  Volume
                </Typography>
                <Typography 
                  variant="body2" 
                  className={styles.additionalInfoValue}
                  sx={!isAuthenticated ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
                >
                  {card.volume}
                </Typography>
              </Box>
              <Box className={styles.additionalInfoItem}>
                <Typography variant="caption" className={styles.additionalInfoLabel}>
                  Last Price
                </Typography>
                <Typography 
                  variant="body2" 
                  className={clsx(styles.additionalInfoValue, styles.lastPriceValue)}
                  sx={!isAuthenticated ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
                >
                  {card.lastPrice}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </CardContent>

      {/* Sign In Dialog */}
      <Dialog
        open={loginDialogOpen}
        onClose={(e, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            setLoginDialogOpen(false)
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1b1b1b',
            borderRadius: 3,
            border: '1px solid rgba(0, 255, 136, 0.2)',
            backgroundImage: 'linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(0, 20, 40, 0.95) 100%)',
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            pt: 4,
            pb: 2,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}
          >
            <Login sx={{ fontSize: 32, color: '#000000' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Start Trading Today
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9375rem',
            }}
          >
            Join the future of digital asset trading
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.7,
              fontSize: '1rem',
            }}
          >
            Sign in to explore detailed market data, place orders, and unlock the full potential of the secondary market.
          </Typography>
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 255, 136, 0.08)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              &quot;Your portfolio&apos;s next move starts with a single click&quot;
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLoginDialogOpen(false)
            }}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Continue Browsing
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation()
              handleSignIn()
            }}
            endIcon={<ArrowForward />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#1a1a1a',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                backgroundColor: '#00E677',
              },
            }}
          >
            Sign In / Sign Up
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
