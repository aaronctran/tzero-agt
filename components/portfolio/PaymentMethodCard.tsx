'use client'

import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
} from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import styles from './PaymentMethodCard.module.css'

interface PaymentMethodCardProps {
  id: string
  name: string
  icon: React.ReactNode
  available: number
  displayInfo?: string
  isDefault: boolean
  onSetDefault?: () => void
  isUpdating?: boolean
}

export default function PaymentMethodCard({
  name,
  icon,
  available,
  displayInfo,
  isDefault,
  onSetDefault,
  isUpdating,
}: PaymentMethodCardProps) {
  return (
    <Paper className={`${styles.card} ${isDefault ? styles.defaultCard : ''}`}>
      <Box className={styles.content}>
        <Box className={styles.iconContainer}>
          {icon}
        </Box>
        <Box className={styles.info}>
          <Box className={styles.header}>
            <Typography variant="h6" className={styles.name}>
              {name}
            </Typography>
            {isDefault && (
              <Chip
                label="Default"
                size="small"
                className={styles.defaultChip}
                icon={<CheckCircle sx={{ fontSize: 14 }} />}
              />
            )}
          </Box>
          {displayInfo && (
            <Typography variant="body2" className={styles.displayInfo}>
              {displayInfo}
            </Typography>
          )}
          <Typography variant="body2" className={styles.balance}>
            ${available.toFixed(2)} Available
          </Typography>
        </Box>
        {!isDefault && onSetDefault && (
          <Box className={styles.actions}>
            <Button
              variant="text"
              size="small"
              className={styles.setDefaultButton}
              onClick={onSetDefault}
              disabled={isUpdating}
              sx={{
                color: '#00ff88',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                },
              }}
            >
              {isUpdating ? 'Setting...' : 'Set as Default'}
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  )
}
