'use client'

import { Box, Typography, Paper, Divider } from '@mui/material'
import OverviewColumn from './OverviewColumn'
import PersonalDetailsColumn from './PersonalDetailsColumn'
import styles from './AccountInformation.module.css'

interface AccountInformationProps {
  onboardingData: any
  user: any
  editingPersonalDetails: boolean
  personalDetailsData: any
  onEditClick: () => void
  onSave: () => void
  onCancel: () => void
  onPhoneChange: (field: string, value: string) => void
  saving: boolean
  theme: any
}

export default function AccountInformation({
  onboardingData,
  user,
  editingPersonalDetails,
  personalDetailsData,
  onEditClick,
  onSave,
  onCancel,
  onPhoneChange,
  saving,
  theme,
}: AccountInformationProps) {
  const legalFullName = [
    onboardingData.legalFirstName || '',
    onboardingData.legalMiddleName && onboardingData.legalMiddleName !== 'N/A' ? onboardingData.legalMiddleName : '',
    onboardingData.legalLastName || '',
  ]
    .filter(Boolean)
    .join(' ') || 'N/A'

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      className={styles.accountInfoCard}
    >
      <Typography variant="h6" className={styles.title}>
        Account Information
      </Typography>
      <Divider className={styles.divider} />
      <Box className={styles.columnsContainer}>
        <OverviewColumn onboardingData={onboardingData} />
        <PersonalDetailsColumn
          onboardingData={onboardingData}
          user={user}
          legalFullName={legalFullName}
          editingPersonalDetails={editingPersonalDetails}
          personalDetailsData={personalDetailsData}
          onEditClick={onEditClick}
          onSave={onSave}
          onCancel={onCancel}
          onPhoneChange={onPhoneChange}
          saving={saving}
          theme={theme}
        />
      </Box>
    </Paper>
  )
}
