'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Container,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  CircularProgress,
  Divider,
  Paper,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack, Edit, Check } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

interface OnboardingData {
  // Personal Information
  legalFirstName: string
  legalLastName: string
  phoneNumber: string
  countryCode: string
  dateOfBirth: string
  // Physical Address
  physicalCountry: string
  physicalAddress: string
  physicalAptSte: string
  physicalCity: string
  physicalState: string
  physicalZipCode: string
  // Mailing Address
  mailingAddressSame: boolean
  mailingCountry: string
  mailingAddress: string
  mailingAptSte: string
  mailingCity: string
  mailingState: string
  mailingZipCode: string
  // Terms
  agreeToTerms: boolean
  eSignature: string
}

const TOTAL_STEPS = 3

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

// Reusable input styling
const inputSx = (theme: any, hasError?: boolean) => ({
  '& .MuiOutlinedInput-root': {
    color: '#ffffff',
    borderRadius: 2,
    '& fieldset': { borderColor: hasError ? '#d32f2f' : 'rgba(255, 255, 255, 0.2)' },
    '&:hover fieldset': { borderColor: hasError ? '#d32f2f' : 'rgba(255, 255, 255, 0.3)' },
    '&.Mui-focused fieldset': { borderColor: hasError ? '#d32f2f' : theme.palette.primary.main },
  },
  '& .MuiInputLabel-root': {
    color: '#888888',
    fontWeight: 600,
    '&.Mui-focused': { color: hasError ? '#d32f2f' : theme.palette.primary.main },
  },
  '& .MuiInputBase-input': { color: '#ffffff' },
  '& .MuiFormHelperText-root': { color: '#d32f2f' },
})

const selectSx = (theme: any) => ({
  color: '#ffffff',
  '& .MuiSvgIcon-root': { color: '#888888' },
})

const menuPropsSx = (theme: any) => ({
  PaperProps: {
    sx: {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      '& .MuiMenuItem-root': {
        color: '#ffffff',
        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
        '&.Mui-selected': { backgroundColor: 'rgba(0, 255, 136, 0.2)', color: theme.palette.primary.main },
      },
    },
  },
})

export default function AccountSetupPage() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateOfBirthError, setDateOfBirthError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [editingFromReview, setEditingFromReview] = useState(false)

  const setFieldError = (field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }))
  }

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    legalFirstName: user?.firstName || '',
    legalLastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    countryCode: user?.countryCode || '+1',
    dateOfBirth: '',
    physicalCountry: 'United States',
    physicalAddress: '',
    physicalAptSte: '',
    physicalCity: '',
    physicalState: '',
    physicalZipCode: '',
    mailingAddressSame: true,
    mailingCountry: 'United States',
    mailingAddress: '',
    mailingAptSte: '',
    mailingCity: '',
    mailingState: '',
    mailingZipCode: '',
    agreeToTerms: false,
    eSignature: '',
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (user && isAuthenticated && user.phoneNumber) {
      setOnboardingData(prev => {
        if (!prev.phoneNumber && user.phoneNumber) {
          return { ...prev, phoneNumber: user.phoneNumber, countryCode: user.countryCode || '+1' }
        }
        return prev
      })
    }
    // eslint-disable-next-line
  }, [user?.phoneNumber, user?.countryCode, isAuthenticated])

  const handleInputChange = (field: keyof OnboardingData, value: string | boolean) => {
    setOnboardingData(prev => {
      const updated = { ...prev, [field]: value }

      if (field === 'dateOfBirth' && typeof value === 'string') {
        if (!value) {
          setDateOfBirthError('')
          clearFieldError('dateOfBirth')
        } else {
          const selectedDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const minDate = new Date(today)
          minDate.setFullYear(today.getFullYear() - 120)

          if (selectedDate > today) {
            const msg = 'Date of Birth cannot be in the future'
            setDateOfBirthError(msg)
            setFieldError('dateOfBirth', msg)
          } else if (selectedDate < minDate) {
            const msg = 'Date of Birth cannot be more than 120 years ago'
            setDateOfBirthError(msg)
            setFieldError('dateOfBirth', msg)
          } else {
            setDateOfBirthError('')
            clearFieldError('dateOfBirth')
          }
        }
      }

      if (field === 'mailingAddressSame' && value === true) {
        updated.mailingCountry = prev.physicalCountry
        updated.mailingAddress = prev.physicalAddress
        updated.mailingAptSte = prev.physicalAptSte
        updated.mailingCity = prev.physicalCity
        updated.mailingState = prev.physicalState
        updated.mailingZipCode = prev.physicalZipCode
      }

      if (prev.mailingAddressSame && ['physicalCountry', 'physicalAddress', 'physicalAptSte', 'physicalCity', 'physicalState', 'physicalZipCode'].includes(field as string)) {
        if (field === 'physicalCountry') updated.mailingCountry = value as string
        if (field === 'physicalAddress') updated.mailingAddress = value as string
        if (field === 'physicalAptSte') updated.mailingAptSte = value as string
        if (field === 'physicalCity') updated.mailingCity = value as string
        if (field === 'physicalState') updated.mailingState = value as string
        if (field === 'physicalZipCode') updated.mailingZipCode = value as string
      }

      return updated
    })
    setError('')
    if (field in fieldErrors) {
      clearFieldError(field as string)
    }
  }

  const validateStep = (step: number): boolean => {
    let isValid = true

    if (step === 1) {
      if (!onboardingData.legalFirstName) { setFieldError('legalFirstName', 'First Name is required'); isValid = false }
      if (!onboardingData.legalLastName) { setFieldError('legalLastName', 'Last Name is required'); isValid = false }
      if (!onboardingData.dateOfBirth) { setFieldError('dateOfBirth', 'Date of Birth is required'); isValid = false }
      else if (dateOfBirthError) { setFieldError('dateOfBirth', dateOfBirthError); isValid = false }
      if (!onboardingData.phoneNumber) { setFieldError('phoneNumber', 'Phone Number is required'); isValid = false }
      if (!onboardingData.physicalCountry) { setFieldError('physicalCountry', 'Country is required'); isValid = false }
      if (!onboardingData.physicalAddress) { setFieldError('physicalAddress', 'Address is required'); isValid = false }
      if (!onboardingData.physicalCity) { setFieldError('physicalCity', 'City is required'); isValid = false }
      if (!onboardingData.physicalState) { setFieldError('physicalState', 'State is required'); isValid = false }
      if (!onboardingData.physicalZipCode) { setFieldError('physicalZipCode', 'Zip Code is required'); isValid = false }
      if (!onboardingData.mailingAddressSame) {
        if (!onboardingData.mailingCountry) { setFieldError('mailingCountry', 'Country is required'); isValid = false }
        if (!onboardingData.mailingAddress) { setFieldError('mailingAddress', 'Address is required'); isValid = false }
        if (!onboardingData.mailingCity) { setFieldError('mailingCity', 'City is required'); isValid = false }
        if (!onboardingData.mailingState) { setFieldError('mailingState', 'State is required'); isValid = false }
        if (!onboardingData.mailingZipCode) { setFieldError('mailingZipCode', 'Zip Code is required'); isValid = false }
      }
    } else if (step === 3) {
      if (!onboardingData.agreeToTerms) { setFieldError('agreeToTerms', 'You must agree to the terms'); isValid = false }
      if (!onboardingData.eSignature || onboardingData.eSignature.trim() === '') { setFieldError('eSignature', 'E-signature is required'); isValid = false }
      const fullName = `${onboardingData.legalFirstName} ${onboardingData.legalLastName}`.trim()
      if (onboardingData.eSignature.trim().toLowerCase() !== fullName.toLowerCase()) {
        setFieldError('eSignature', 'E-signature must match your full legal name')
        isValid = false
      }
    }

    return isValid
  }

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        if (editingFromReview) {
          setCurrentStep(2)
          setEditingFromReview(false)
        } else {
          setCurrentStep(currentStep + 1)
        }
        setError('')
      } else if (currentStep === TOTAL_STEPS) {
        await handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleEditStep = (step: number) => {
    if (currentStep === 2 || currentStep === TOTAL_STEPS) {
      setEditingFromReview(true)
    }
    setCurrentStep(step)
    setError('')
  }

  const handleSubmit = async () => {
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      if (!validateStep(step)) {
        setError(`Please complete all required fields in step ${step}`)
        return
      }
    }

    setLoading(true)
    setError('')

    const submitData = {
      ...onboardingData,
      accountType: 'Individual',
      citizenship: 'United States',
      taxationCountry: 'United States',
      mailingAddressSame: onboardingData.mailingAddressSame,
    }

    if (submitData.mailingAddressSame) {
      submitData.mailingCountry = submitData.physicalCountry
      submitData.mailingAddress = submitData.physicalAddress
      submitData.mailingAptSte = submitData.physicalAptSte
      submitData.mailingCity = submitData.physicalCity
      submitData.mailingState = submitData.physicalState
      submitData.mailingZipCode = submitData.physicalZipCode
    }

    try {
      const response = await api.post('/account/complete-onboarding', submitData)
      if (response.data.user) {
        await refreshUser()
      }
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  // Address fields renderer
  const renderAddressFields = (prefix: 'physical' | 'mailing') => {
    const countryField = `${prefix}Country` as keyof OnboardingData
    const addressField = `${prefix}Address` as keyof OnboardingData
    const aptField = `${prefix}AptSte` as keyof OnboardingData
    const cityField = `${prefix}City` as keyof OnboardingData
    const stateField = `${prefix}State` as keyof OnboardingData
    const zipField = `${prefix}ZipCode` as keyof OnboardingData

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FormControl fullWidth required sx={inputSx(theme, !!fieldErrors[countryField])}>
          <InputLabel>Country</InputLabel>
          <Select
            value={onboardingData[countryField] as string}
            onChange={(e) => handleInputChange(countryField, e.target.value)}
            label="Country"
            sx={selectSx(theme)}
            MenuProps={menuPropsSx(theme)}
          >
            <MenuItem value="United States">United States</MenuItem>
            <MenuItem value="Canada">Canada</MenuItem>
            <MenuItem value="United Kingdom">United Kingdom</MenuItem>
            <MenuItem value="Australia">Australia</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Address"
          value={onboardingData[addressField] as string}
          onChange={(e) => handleInputChange(addressField, e.target.value)}
          required
          error={!!fieldErrors[addressField]}
          helperText={fieldErrors[addressField]}
          sx={inputSx(theme, !!fieldErrors[addressField])}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Apt. / Ste."
            placeholder="Optional"
            value={onboardingData[aptField] as string}
            onChange={(e) => handleInputChange(aptField, e.target.value)}
            sx={inputSx(theme)}
          />
          <TextField
            fullWidth
            label="City"
            value={onboardingData[cityField] as string}
            onChange={(e) => handleInputChange(cityField, e.target.value)}
            required
            error={!!fieldErrors[cityField]}
            helperText={fieldErrors[cityField]}
            sx={inputSx(theme, !!fieldErrors[cityField])}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth required sx={inputSx(theme, !!fieldErrors[stateField])}>
            <InputLabel>State</InputLabel>
            <Select
              value={onboardingData[stateField] as string}
              onChange={(e) => handleInputChange(stateField, e.target.value)}
              label="State"
              sx={selectSx(theme)}
              MenuProps={menuPropsSx(theme)}
            >
              {US_STATES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Zip Code"
            value={onboardingData[zipField] as string}
            onChange={(e) => handleInputChange(zipField, e.target.value)}
            required
            error={!!fieldErrors[zipField]}
            helperText={fieldErrors[zipField]}
            sx={inputSx(theme, !!fieldErrors[zipField])}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => router.push('/')}
                sx={{ color: '#ffffff', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <ArrowBack />
              </IconButton>
              <Box sx={{ height: 35, position: 'relative' }}>
                <Image
                  src="/tzero-logo.png"
                  alt="tZERO Logo"
                  width={140}
                  height={35}
                  style={{ height: 'auto', width: 'auto', maxHeight: '35px', objectFit: 'contain' }}
                  priority
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              }}
              onClick={() => router.push('/')}
            >
              Save & Exit
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, py: 4 }}>
        <Container maxWidth="md">
          {/* Step Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 1, fontSize: { xs: '24px', sm: '32px' } }}>
              {currentStep === 1 && "Let's set up your account"}
              {currentStep === 2 && 'Review your information'}
              {currentStep === 3 && 'Complete your application'}
            </Typography>
            <Typography sx={{ color: '#888888', fontSize: '16px' }}>
              {currentStep === 1 && 'Please provide your personal information and address.'}
              {currentStep === 2 && 'Please review your information below. Click Edit to make changes.'}
              {currentStep === 3 && 'Please agree to the terms and sign to finish.'}
            </Typography>
          </Box>

          {error && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', border: '1px solid rgba(211, 47, 47, 0.3)', borderRadius: 2, textAlign: 'center' }}>
              <Typography sx={{ color: '#d32f2f', fontSize: '14px' }}>{error}</Typography>
            </Box>
          )}

          {/* Step 1: Personal Information + Address */}
          {currentStep === 1 && (
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Personal Info */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 0 }}>
                  Personal Information
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={onboardingData.legalFirstName}
                    onChange={(e) => handleInputChange('legalFirstName', e.target.value)}
                    required
                    error={!!fieldErrors.legalFirstName}
                    helperText={fieldErrors.legalFirstName}
                    sx={inputSx(theme, !!fieldErrors.legalFirstName)}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={onboardingData.legalLastName}
                    onChange={(e) => handleInputChange('legalLastName', e.target.value)}
                    required
                    error={!!fieldErrors.legalLastName}
                    helperText={fieldErrors.legalLastName}
                    sx={inputSx(theme, !!fieldErrors.legalLastName)}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    label="Date of Birth"
                    type="date"
                    value={onboardingData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                    error={!!(fieldErrors.dateOfBirth || dateOfBirthError)}
                    helperText={fieldErrors.dateOfBirth || dateOfBirthError}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      max: new Date().toISOString().split('T')[0],
                      min: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split('T')[0] })(),
                    }}
                    sx={{ ...inputSx(theme, !!(fieldErrors.dateOfBirth || dateOfBirthError)), flex: '0 0 200px' }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                    <FormControl sx={{ ...inputSx(theme), minWidth: 120 }}>
                      <InputLabel>Code</InputLabel>
                      <Select
                        value={onboardingData.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                        label="Code"
                        sx={selectSx(theme)}
                        MenuProps={menuPropsSx(theme)}
                      >
                        <MenuItem value="+1">+1 (US/CA)</MenuItem>
                        <MenuItem value="+44">+44 (UK)</MenuItem>
                        <MenuItem value="+61">+61 (AU)</MenuItem>
                        <MenuItem value="+33">+33 (FR)</MenuItem>
                        <MenuItem value="+49">+49 (DE)</MenuItem>
                        <MenuItem value="+81">+81 (JP)</MenuItem>
                        <MenuItem value="+86">+86 (CN)</MenuItem>
                        <MenuItem value="+91">+91 (IN)</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={onboardingData.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s\-()]/g, '')
                        handleInputChange('phoneNumber', value)
                      }}
                      required
                      placeholder="(555) 123-4567"
                      error={!!fieldErrors.phoneNumber}
                      helperText={fieldErrors.phoneNumber}
                      sx={inputSx(theme, !!fieldErrors.phoneNumber)}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* Physical Address */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 0 }}>
                  Physical Address
                </Typography>
                {renderAddressFields('physical')}

                <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* Mailing Address */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 0 }}>
                  Mailing Address
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={onboardingData.mailingAddressSame}
                      onChange={(e) => handleInputChange('mailingAddressSame', e.target.checked)}
                      sx={{ color: theme.palette.primary.main, '&.Mui-checked': { color: theme.palette.primary.main } }}
                    />
                  }
                  label={<Typography sx={{ color: '#ffffff', fontSize: '14px' }}>Same as physical address</Typography>}
                />

                {onboardingData.mailingAddressSame && (
                  <Box sx={{ p: 2, backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: 2, border: `1px solid ${theme.palette.primary.main}40` }}>
                    <Typography sx={{ color: theme.palette.primary.main, fontSize: '14px', fontWeight: 500 }}>
                      Mailing address will be the same as your physical address.
                    </Typography>
                  </Box>
                )}

                {!onboardingData.mailingAddressSame && renderAddressFields('mailing')}
              </Box>
            </Box>
          )}

          {/* Step 2: Review */}
          {currentStep === 2 && (
            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Personal Info Review */}
                <Paper
                  elevation={0}
                  sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      Personal Information
                    </Typography>
                    <Button
                      startIcon={<Edit />}
                      onClick={() => handleEditStep(1)}
                      sx={{
                        color: theme.palette.primary.main,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: 'rgba(0, 255, 136, 0.1)' },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>First Name</Typography>
                        <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>{onboardingData.legalFirstName}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>Last Name</Typography>
                        <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>{onboardingData.legalLastName}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>Date of Birth</Typography>
                        <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                          {onboardingData.dateOfBirth ? new Date(onboardingData.dateOfBirth).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>Phone Number</Typography>
                        <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                          {onboardingData.countryCode} {onboardingData.phoneNumber}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>Account Type</Typography>
                      <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>Individual</Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Address Review */}
                <Paper
                  elevation={0}
                  sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      Address Information
                    </Typography>
                    <Button
                      startIcon={<Edit />}
                      onClick={() => handleEditStep(1)}
                      sx={{
                        color: theme.palette.primary.main,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: 'rgba(0, 255, 136, 0.1)' },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>Physical Address</Typography>
                      <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                        {onboardingData.physicalAddress}
                        {onboardingData.physicalAptSte && `, ${onboardingData.physicalAptSte}`}
                        <br />
                        {onboardingData.physicalCity}, {onboardingData.physicalState} {onboardingData.physicalZipCode}
                        <br />
                        {onboardingData.physicalCountry}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '12px', color: '#888888', mb: 0.5 }}>Mailing Address</Typography>
                      <Typography sx={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                        {onboardingData.mailingAddressSame ? (
                          <>
                            {onboardingData.physicalAddress}
                            {onboardingData.physicalAptSte && `, ${onboardingData.physicalAptSte}`}
                            <br />
                            {onboardingData.physicalCity}, {onboardingData.physicalState} {onboardingData.physicalZipCode}
                            <br />
                            {onboardingData.physicalCountry}
                          </>
                        ) : (
                          <>
                            {onboardingData.mailingAddress}
                            {onboardingData.mailingAptSte && `, ${onboardingData.mailingAptSte}`}
                            <br />
                            {onboardingData.mailingCity}, {onboardingData.mailingState} {onboardingData.mailingZipCode}
                            <br />
                            {onboardingData.mailingCountry}
                          </>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

          {/* Step 3: Submit */}
          {currentStep === 3 && (
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Agreement */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    border: `1px solid ${fieldErrors.agreeToTerms ? '#d32f2f' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 2, fontSize: '18px' }}>
                    Terms & Agreement
                  </Typography>
                  <Typography sx={{ color: '#888888', fontSize: '14px', lineHeight: 1.7, mb: 3 }}>
                    By completing this application, you agree to open a brokerage account. Your information will be used to verify your identity
                    and comply with applicable regulations.
                  </Typography>

                  <Box sx={{
                    p: 2.5,
                    borderRadius: 1.5,
                    backgroundColor: 'rgba(0, 255, 136, 0.05)',
                    border: `1px solid ${onboardingData.agreeToTerms ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.1)'}`,
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={onboardingData.agreeToTerms}
                          onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                          sx={{
                            color: fieldErrors.agreeToTerms ? '#d32f2f' : theme.palette.primary.main,
                            '&.Mui-checked': { color: theme.palette.primary.main },
                            '& .MuiSvgIcon-root': { fontSize: 28 },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: '#ffffff', fontSize: '15px', fontWeight: 500, ml: 1 }}>
                          I acknowledge and agree to the terms, policies, and disclosures for account creation.
                        </Typography>
                      }
                      sx={{ m: 0, alignItems: 'flex-start' }}
                    />
                    {fieldErrors.agreeToTerms && (
                      <Typography sx={{ color: '#d32f2f', fontSize: '0.875rem', mt: 1.5, ml: 5.5 }}>
                        {fieldErrors.agreeToTerms}
                      </Typography>
                    )}
                  </Box>
                </Paper>

                {/* E-Signature */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    border: `1px solid ${fieldErrors.eSignature ? '#d32f2f' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1.5, fontSize: '18px' }}>
                    Electronic Signature
                  </Typography>
                  <Box sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: 1.5,
                    backgroundColor: 'rgba(0, 255, 136, 0.05)',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                  }}>
                    <Typography sx={{ color: '#888888', fontSize: '13px', mb: 0.5, fontWeight: 500 }}>
                      Your Legal Name:
                    </Typography>
                    <Typography sx={{ color: '#ffffff', fontSize: '16px', fontWeight: 600 }}>
                      {`${onboardingData.legalFirstName} ${onboardingData.legalLastName}`}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="Enter Full Name to Sign"
                    placeholder="Type your full name exactly as shown above"
                    value={onboardingData.eSignature}
                    onChange={(e) => {
                      handleInputChange('eSignature', e.target.value)
                      const fullName = `${onboardingData.legalFirstName} ${onboardingData.legalLastName}`.trim()
                      if (e.target.value.trim().toLowerCase() === fullName.toLowerCase()) {
                        clearFieldError('eSignature')
                      }
                    }}
                    error={!!fieldErrors.eSignature}
                    helperText={fieldErrors.eSignature}
                    sx={inputSx(theme, !!fieldErrors.eSignature)}
                  />
                  <Typography sx={{ color: '#888888', fontSize: '13px', mt: 2, lineHeight: 1.6 }}>
                    By electronically signing above, you agree that your electronic signature has the same legal meaning,
                    validity, and effect as your handwritten signature.
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      {/* Footer with Progress Bar and Navigation */}
      <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', mt: 'auto' }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 3 }}>
            <Box sx={{ flex: 1, mr: 3 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.primary.main, borderRadius: 4 },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {currentStep > 1 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  Back
                </Button>
              )}
              {currentStep < TOTAL_STEPS ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: '#333333',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    '&:hover': { backgroundColor: '#00E677' },
                  }}
                >
                  {currentStep === 2 ? 'Continue' : 'Next'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} sx={{ color: '#333333' }} /> : <Check />}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: '#333333',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    '&:hover': { backgroundColor: '#00E677' },
                  }}
                >
                  Submit Application
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
