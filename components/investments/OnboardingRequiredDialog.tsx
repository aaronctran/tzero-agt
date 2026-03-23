'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  CheckCircle,
  AccountBalance,
  TrendingUp,
  Shield,
  RocketLaunch,
} from '@mui/icons-material'

interface OnboardingRequiredDialogProps {
  open: boolean
  onClose: () => void
}

export default function OnboardingRequiredDialog({ open, onClose }: OnboardingRequiredDialogProps) {
  const theme = useTheme()
  const router = useRouter()

  const handleCompleteOnboarding = () => {
    onClose()
    router.push('/account/setup')
  }

  const benefits = [
    {
      icon: <AccountBalance sx={{ color: theme.palette.primary.main }} />,
      text: 'Unlock access to exclusive investment opportunities',
    },
    {
      icon: <Shield sx={{ color: theme.palette.primary.main }} />,
      text: 'Secure, regulated platform with full compliance',
    },
    {
      icon: <TrendingUp sx={{ color: theme.palette.primary.main }} />,
      text: 'Start investing in minutes after setup',
    },
    {
      icon: <RocketLaunch sx={{ color: theme.palette.primary.main }} />,
      text: 'Join thousands of investors building wealth',
    },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.98) 0%, rgba(16, 18, 24, 0.98) 100%)',
          border: '1px solid rgba(0, 255, 136, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 136, 0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 4,
          px: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#ffffff',
            mb: 1,
            fontSize: { xs: '24px', sm: '28px' },
            letterSpacing: '-0.02em',
          }}
        >
          Complete Your Investment Account
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#cccccc',
            fontSize: '15px',
            lineHeight: 1.5,
          }}
        >
          Set up your investment account to start investing in this opportunity and access our full platform.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 2 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 255, 136, 0.03) 100%)',
            borderRadius: 3,
            p: 3,
            mb: 3,
            border: '1px solid rgba(0, 255, 136, 0.15)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              mb: 2.5,
              fontSize: '18px',
            }}
          >
            Why Complete Onboarding?
          </Typography>
          <List sx={{ py: 0 }}>
            {benefits.map((benefit, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1.25 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {benefit.icon}
                </ListItemIcon>
                <ListItemText
                  primary={benefit.text}
                  primaryTypographyProps={{
                    sx: {
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.5,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              background: 'rgba(0, 255, 136, 0.05)',
              border: '1px solid rgba(0, 255, 136, 0.1)',
            }}
          >
            <CheckCircle sx={{ color: theme.palette.primary.main, fontSize: 20, mt: 0.25, flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{
                color: '#cccccc',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                Quick & Easy
              </Box>
              {' '}— Complete your investment account setup in just a few minutes
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              background: 'rgba(0, 255, 136, 0.05)',
              border: '1px solid rgba(0, 255, 136, 0.1)',
            }}
          >
            <CheckCircle sx={{ color: theme.palette.primary.main, fontSize: 20, mt: 0.25, flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{
                color: '#cccccc',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                One-Time Setup
              </Box>
              {' '}— Verify once, invest anytime across all opportunities
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          pb: 4,
          pt: 2,
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: '#cccccc',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Later
        </Button>
        <Button
          onClick={handleCompleteOnboarding}
          variant="contained"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#333333',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '15px',
            px: 4,
            py: 1.25,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: '#00E677',
            },
          }}
        >
          Complete Setup
        </Button>
      </DialogActions>
    </Dialog>
  )
}
