'use client'

import { Box, Typography, Button, TextField } from '@mui/material'
import { Edit, Save, Cancel } from '@mui/icons-material'
import styles from './AccountInformation.module.css'

interface PersonalDetailsColumnProps {
  onboardingData: any
  user: any
  legalFullName: string
  editingPersonalDetails: boolean
  personalDetailsData: any
  onEditClick: () => void
  onSave: () => void
  onCancel: () => void
  onPhoneChange: (field: string, value: string) => void
  saving: boolean
  theme: any
}

export default function PersonalDetailsColumn({
  user,
  legalFullName,
  editingPersonalDetails,
  personalDetailsData,
  onEditClick,
  onSave,
  onCancel,
  onPhoneChange,
  saving,
  theme,
}: PersonalDetailsColumnProps) {
  return (
    <Box className={styles.column}>
      <Box className={styles.columnHeaderWithEdit}>
        <Typography variant="subtitle1" className={styles.columnHeader}>
          Personal Details
        </Typography>
        {!editingPersonalDetails && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={onEditClick}
            className={styles.editButton}
          >
            Edit
          </Button>
        )}
      </Box>
      <Box className={styles.fieldsContainer}>
        <Box className={styles.fieldItem}>
          <Typography className={styles.fieldLabel}>Legal Full Name</Typography>
          <Typography className={styles.fieldValue}>{legalFullName}</Typography>
        </Box>
        <Box className={styles.fieldItem}>
          <Typography className={styles.fieldLabel}>Phone Number</Typography>
          {editingPersonalDetails ? (
            <Box className={styles.phoneEditContainer}>
              <TextField
                size="small"
                value={personalDetailsData.countryCode || '+1'}
                onChange={(e) => onPhoneChange('countryCode', e.target.value)}
                className={styles.countryCodeInput}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  },
                }}
              />
              <TextField
                size="small"
                fullWidth
                value={personalDetailsData.phoneNumber || ''}
                onChange={(e) => onPhoneChange('phoneNumber', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  },
                }}
              />
            </Box>
          ) : (
            <Typography className={styles.fieldValue}>
              {user?.countryCode || '+1'} {user?.phoneNumber || 'N/A'}
            </Typography>
          )}
        </Box>
        {editingPersonalDetails && (
          <Box className={styles.editActions}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Save />}
              onClick={onSave}
              disabled={saving}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: '#333333',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#00E677' },
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Cancel />}
              onClick={onCancel}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
