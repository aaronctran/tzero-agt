'use client'

import { Box } from '@mui/material'
import CashBalance from './CashBalance'
import styles from './Portfolio.module.css'

export default function Portfolio() {
  return (
    <Box className={styles.portfolioContainer}>
      <CashBalance />
    </Box>
  )
}
