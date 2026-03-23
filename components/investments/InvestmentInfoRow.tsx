'use client'

import { Box, Typography, IconButton } from '@mui/material'
import { KeyboardArrowRight } from '@mui/icons-material'
import styles from './InvestmentInfoRow.module.css'

interface InvestmentInfoRowProps {
  title: string
  value: string
  onClick?: () => void
  isError?: boolean
}

export default function InvestmentInfoRow({
  title,
  value,
  onClick,
  isError = false,
}: InvestmentInfoRowProps) {
  return (
    <Box
      className={`${styles.row} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <Box className={styles.content}>
        <Typography variant="body1" className={styles.title}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          className={`${styles.value} ${isError ? styles.error : ''}`}
        >
          {value}
        </Typography>
      </Box>
      {onClick && (
        <IconButton className={styles.arrowButton} size="small">
          <KeyboardArrowRight />
        </IconButton>
      )}
    </Box>
  )
}
