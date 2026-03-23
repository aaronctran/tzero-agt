'use client'

import { Box, Typography } from '@mui/material'
import styles from './AccountInformation.module.css'

interface OverviewColumnProps {
  onboardingData: any
}

export default function OverviewColumn({ onboardingData }: OverviewColumnProps) {
  return (
    <Box className={styles.column}>
      <Typography variant="subtitle1" className={styles.columnHeader}>
        Overview
      </Typography>
      <Box className={styles.fieldsContainer}>
        <Box className={styles.fieldItem}>
          <Typography className={styles.fieldLabel}>Account Type</Typography>
          <Typography className={styles.fieldValue}>{onboardingData.accountType || 'Individual'}</Typography>
        </Box>
        <Box className={styles.fieldItem}>
          <Typography className={styles.fieldLabel}>Citizenship</Typography>
          <Typography className={styles.fieldValue}>{onboardingData.citizenship || 'N/A'}</Typography>
        </Box>
      </Box>
    </Box>
  )
}
