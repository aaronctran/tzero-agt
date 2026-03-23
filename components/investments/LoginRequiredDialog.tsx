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
  TrendingUp,
  Security,
  Speed,
} from '@mui/icons-material'

interface LoginRequiredDialogProps {
  open: boolean
  onClose: () => void
}

export default function LoginRequiredDialog({ open, onClose }: LoginRequiredDialogProps) {
  const theme = useTheme()
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    router.push('/auth')
  }

  const benefits = [
    {
      icon: <TrendingUp sx={{ color: theme.palette.primary.main }} />,
      text: 'Access exclusive investment opportunities',
    },
    {
      icon: <Security sx={{ color: theme.palette.primary.main }} />,
      text: 'Secure, regulated trading platform',
    },
    {
      icon: <Speed sx={{ color: theme.palette.primary.main }} />,
      text: 'Fast, seamless investment process',
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
          Join tZERO to Start Investing
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#cccccc',
            fontSize: '15px',
            lineHeight: 1.5,
          }}
        >
          Create your account to access this investment opportunity and unlock the future of digital securities trading.
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
              mb: 2,
              fontSize: '18px',
            }}
          >
            Why Choose tZERO?
          </Typography>
          <List sx={{ py: 0 }}>
            {benefits.map((benefit, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1 }}>
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
            alignItems: 'center',
            gap: 1.5,
            p: 2,
            borderRadius: 2,
            background: 'rgba(0, 255, 136, 0.05)',
            border: '1px solid rgba(0, 255, 136, 0.1)',
          }}
        >
          <CheckCircle sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Typography
            variant="body2"
            sx={{
              color: '#cccccc',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Quick setup
            </Box>
            {' '}— Get started in minutes and start investing today
          </Typography>
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
          Maybe Later
        </Button>
        <Button
          onClick={handleLogin}
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
          Sign Up / Log In
        </Button>
      </DialogActions>
    </Dialog>
  )
}
