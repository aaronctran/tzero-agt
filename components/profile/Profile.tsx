'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Grid,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Edit, Save, Cancel } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import AccountInformation from './AccountInformation'

interface ProfileProps {
  onboardingData: any
  setOnboardingData: (data: any) => void
}

export default function Profile({ onboardingData, setOnboardingData }: ProfileProps) {
  const theme = useTheme()
  const router = useRouter()
  const { user } = useAuth()

  const [editingAddress, setEditingAddress] = useState(false)
  const [editingPersonalDetails, setEditingPersonalDetails] = useState(false)
  const [addressData, setAddressData] = useState<any>({})
  const [personalDetailsData, setPersonalDetailsData] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: '#ffffff',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& .MuiInputLabel-root': { color: '#888888' },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
  }

  if (!onboardingData) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#cccccc', mb: 2 }}>
          No onboarding data found. Please complete your account setup.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/account/setup')}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#333333',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#00E677' },
          }}
        >
          Complete Setup
        </Button>
      </Paper>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Account Information */}
      <AccountInformation
        onboardingData={onboardingData}
        user={user}
        editingPersonalDetails={editingPersonalDetails}
        personalDetailsData={personalDetailsData}
        onEditClick={() => {
          setPersonalDetailsData({
            phoneNumber: user?.phoneNumber || '',
            countryCode: user?.countryCode || '+1',
          })
          setEditingPersonalDetails(true)
        }}
        onSave={async () => {
          setSaving(true)
          try {
            await api.patch('/profile/update-phone', {
              phoneNumber: personalDetailsData.phoneNumber,
              countryCode: personalDetailsData.countryCode,
            })
            const userResponse = await api.get('/auth/user')
            if (userResponse.data.user) {
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
              localStorage.setItem('user', JSON.stringify({
                ...currentUser,
                phoneNumber: personalDetailsData.phoneNumber,
                countryCode: personalDetailsData.countryCode,
              }))
            }
            const onboardingResponse = await api.get('/profile/onboarding-data')
            if (onboardingResponse.data.onboardingData) {
              setOnboardingData(onboardingResponse.data.onboardingData)
            }
            setEditingPersonalDetails(false)
          } catch (error) {
            console.error('Error updating personal details:', error)
          } finally {
            setSaving(false)
          }
        }}
        onCancel={() => {
          setEditingPersonalDetails(false)
          setPersonalDetailsData({})
        }}
        onPhoneChange={(field, value) => {
          setPersonalDetailsData({ ...personalDetailsData, [field]: value })
        }}
        saving={saving}
        theme={theme}
      />

      {/* Address Information */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            Address Information
          </Typography>
          {!editingAddress && (
            <IconButton
              size="small"
              onClick={() => {
                setAddressData({
                  physicalAddress: onboardingData.physicalAddress || '',
                  physicalAptSte: onboardingData.physicalAptSte || '',
                  physicalCity: onboardingData.physicalCity || '',
                  physicalState: onboardingData.physicalState || '',
                  physicalZipCode: onboardingData.physicalZipCode || '',
                  physicalCountry: onboardingData.physicalCountry || '',
                  mailingAddressSame: onboardingData.mailingAddressSame || false,
                  mailingAddress: onboardingData.mailingAddress || '',
                  mailingAptSte: onboardingData.mailingAptSte || '',
                  mailingCity: onboardingData.mailingCity || '',
                  mailingState: onboardingData.mailingState || '',
                  mailingZipCode: onboardingData.mailingZipCode || '',
                  mailingCountry: onboardingData.mailingCountry || '',
                })
                setEditingAddress(true)
              }}
              sx={{ color: theme.palette.primary.main }}
            >
              <Edit />
            </IconButton>
          )}
        </Box>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {editingAddress ? (
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>Physical Address</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Address', key: 'physicalAddress' },
                { label: 'Apt/Ste', key: 'physicalAptSte' },
                { label: 'City', key: 'physicalCity' },
                { label: 'State', key: 'physicalState' },
                { label: 'Zip Code', key: 'physicalZipCode' },
                { label: 'Country', key: 'physicalCountry' },
              ].map(({ label, key }) => (
                <Grid item xs={12} sm={4} key={key}>
                  <TextField
                    fullWidth
                    size="small"
                    label={label}
                    value={addressData[key] || ''}
                    onChange={(e) => setAddressData({ ...addressData, [key]: e.target.value })}
                    sx={textFieldSx}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={addressData.mailingAddressSame || false}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setAddressData({
                        ...addressData,
                        mailingAddressSame: checked,
                        ...(checked ? {
                          mailingAddress: addressData.physicalAddress || '',
                          mailingAptSte: addressData.physicalAptSte || '',
                          mailingCity: addressData.physicalCity || '',
                          mailingState: addressData.physicalState || '',
                          mailingZipCode: addressData.physicalZipCode || '',
                          mailingCountry: addressData.physicalCountry || '',
                        } : {}),
                      })
                    }}
                    sx={{
                      color: theme.palette.primary.main,
                      '&.Mui-checked': { color: theme.palette.primary.main },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                    Mailing Address is the same
                  </Typography>
                }
              />
            </Box>

            {!addressData.mailingAddressSame && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>Mailing Address</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Address', key: 'mailingAddress' },
                    { label: 'Apt/Ste', key: 'mailingAptSte' },
                    { label: 'City', key: 'mailingCity' },
                    { label: 'State', key: 'mailingState' },
                    { label: 'Zip Code', key: 'mailingZipCode' },
                    { label: 'Country', key: 'mailingCountry' },
                  ].map(({ label, key }) => (
                    <Grid item xs={12} sm={4} key={key}>
                      <TextField
                        fullWidth
                        size="small"
                        label={label}
                        value={addressData[key] || ''}
                        onChange={(e) => setAddressData({ ...addressData, [key]: e.target.value })}
                        sx={textFieldSx}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {addressData.mailingAddressSame && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: '#888888', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  Mailing address will be the same as your physical address.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={async () => {
                  setSaving(true)
                  try {
                    const submitData = { ...addressData }
                    if (submitData.mailingAddressSame) {
                      submitData.mailingAddress = submitData.physicalAddress
                      submitData.mailingAptSte = submitData.physicalAptSte
                      submitData.mailingCity = submitData.physicalCity
                      submitData.mailingState = submitData.physicalState
                      submitData.mailingZipCode = submitData.physicalZipCode
                      submitData.mailingCountry = submitData.physicalCountry
                    }
                    await api.patch('/profile/update-address', submitData)
                    const response = await api.get('/profile/onboarding-data')
                    if (response.data.onboardingData) {
                      setOnboardingData(response.data.onboardingData)
                    }
                    setEditingAddress(false)
                  } catch (error) {
                    console.error('Error updating address:', error)
                  } finally {
                    setSaving(false)
                  }
                }}
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
                startIcon={<Cancel />}
                onClick={() => {
                  setEditingAddress(false)
                  setAddressData({})
                }}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: '#888888', fontSize: '0.875rem', mb: 1 }}>Physical Address</Typography>
              <Typography sx={{ color: '#ffffff', fontWeight: 500 }}>
                {onboardingData.physicalAddress || 'N/A'}
                {onboardingData.physicalAptSte && `, ${onboardingData.physicalAptSte}`}
                <br />
                {onboardingData.physicalCity || ''}, {onboardingData.physicalState || ''} {onboardingData.physicalZipCode || ''}
                <br />
                {onboardingData.physicalCountry || 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: '#888888', fontSize: '0.875rem', mb: 1 }}>Mailing Address</Typography>
              <Typography sx={{ color: '#ffffff', fontWeight: 500 }}>
                {onboardingData.mailingAddressSame ? (
                  <span style={{ fontStyle: 'italic', color: '#888888' }}>Same as Physical Address</span>
                ) : (
                  <>
                    {onboardingData.mailingAddress || 'N/A'}
                    {onboardingData.mailingAptSte && `, ${onboardingData.mailingAptSte}`}
                    <br />
                    {onboardingData.mailingCity || ''}, {onboardingData.mailingState || ''} {onboardingData.mailingZipCode || ''}
                    <br />
                    {onboardingData.mailingCountry || 'N/A'}
                  </>
                )}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}
