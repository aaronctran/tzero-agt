'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AuthForm.module.css'

export default function AuthForm() {
  const theme = useTheme()
  const { authenticate } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await authenticate(email, password)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: '#ffffff',
      borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
    },
    '& .MuiInputLabel-root': {
      color: '#888888',
      fontWeight: 600,
      '&.Mui-focused': { color: '#cccccc' },
    },
    '& .MuiInputBase-input': { color: '#ffffff' },
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography sx={{ color: '#aaa', fontSize: '0.9375rem', mb: 3, lineHeight: 1.6 }}>
        Enter your email and password. If you already have an account you&apos;ll be signed in, otherwise we&apos;ll set up a new one.
      </Typography>

      {error && (
        <Alert severity="error" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleContinue} className={styles.form}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.textField}
          sx={{ mb: 3, ...textFieldSx }}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.textField}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: '#cccccc' }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={textFieldSx}
        />

        <Typography sx={{ color: '#666', fontSize: '0.8125rem', mt: 1.5, mb: 3 }}>
          Password must be at least 6 characters.
        </Typography>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          className={styles.continueButton}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: theme.palette.text.primary }} />
          ) : (
            'Continue'
          )}
        </Button>
      </Box>
    </Box>
  )
}
