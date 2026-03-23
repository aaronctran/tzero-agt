'use client'

import { Box, Typography, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Image from 'next/image'
import { TrendingUp, Business, LocalHospital, Bolt, ShoppingBag } from '@mui/icons-material'
import { getCategoryLabel } from '@/lib/investmentUtils'
import { getCategoryGradient, getCategoryAccent } from '@/lib/assetUtils'

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'tech':
      return <TrendingUp sx={{ fontSize: 18 }} />
    case 'healthcare':
      return <LocalHospital sx={{ fontSize: 18 }} />
    case 'energy':
      return <Bolt sx={{ fontSize: 18 }} />
    case 'consumer':
      return <ShoppingBag sx={{ fontSize: 18 }} />
    case 'finance':
      return <Business sx={{ fontSize: 18 }} />
    default:
      return <Business sx={{ fontSize: 18 }} />
  }
}

interface AssetBannerProps {
  title: string
  category: string
  image?: string
}

export default function AssetBanner({ title, category, image }: AssetBannerProps) {
  const theme = useTheme()
  const categoryGradient = getCategoryGradient(category)
  const categoryAccent = getCategoryAccent(category)

  return (
    <Box
      sx={{
        height: { xs: '200px', sm: '280px', md: '360px' },
        width: '100%',
        position: 'relative',
        background: categoryGradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 30% 30%, ${categoryAccent} 0%, transparent 60%),
            radial-gradient(circle at 70% 70%, ${categoryAccent} 0%, transparent 60%)
          `,
          opacity: 0.6,
        },
      }}
    >
      {image && image !== '/api/placeholder/400/300' ? (
        <Image
          src={image}
          alt={title}
          fill
          style={{
            objectFit: 'cover',
            opacity: 0.3,
          }}
          unoptimized
        />
      ) : null}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          px: 3,
          maxWidth: '800px',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            color: '#ffffff',
            fontSize: { xs: '32px', sm: '48px', md: '64px' },
            mb: 2,
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.8)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        <Chip
          icon={getCategoryIcon(category)}
          label={getCategoryLabel(category)}
          sx={{
            backgroundColor: 'rgba(0, 255, 136, 0.25)',
            color: theme.palette.primary.main,
            fontSize: '13px',
            height: 32,
            fontWeight: 700,
            border: `1px solid ${theme.palette.primary.main}50`,
            backdropFilter: 'blur(10px)',
          }}
        />
      </Box>
    </Box>
  )
}
