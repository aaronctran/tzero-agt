'use client'

import { Box, Typography, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/navigation'
import styles from './SectionHeader.module.css'
import clsx from 'clsx'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  seeAllHref?: string
  seeAllLabel?: string
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  seeAllHref, 
  seeAllLabel = 'See All' 
}: SectionHeaderProps) {
  const router = useRouter()
  const theme = useTheme()

  return (
    <Box className={styles.container}>
      <Box className={styles.titleSection}>
        <Typography
          variant="h3"
          className={clsx(styles.title, subtitle && styles.titleWithSubtitle)}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" className={styles.subtitle}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {seeAllHref && (
        <Button
          variant="outlined"
          onClick={() => router.push(seeAllHref)}
          className={styles.seeAllButton}
          sx={{
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
            },
          }}
        >
          {seeAllLabel}
        </Button>
      )}
    </Box>
  )
}
