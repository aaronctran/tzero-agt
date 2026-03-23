'use client'

import { Box, Container, Typography, Grid, Link, Button, IconButton, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Image from 'next/image'
import { Twitter, LinkedIn } from '@mui/icons-material'

export default function Footer() {
  const theme = useTheme()

  return (
    <Box
      component="footer"
      sx={{
        mt: { xs: 10, md: 14 },
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 6 },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Logo and Company Info */}
          <Grid item xs={12} md={3}>
            <Box sx={{ mb: 3 }}>
              <Image
                src="/tzero-logo.png"
                alt="tZERO Logo"
                width={120}
                height={32}
                style={{ height: 'auto', width: 'auto', maxHeight: '32px' }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              <strong>Company Locations:</strong>
              <br />
              525 Washington Blvd
              <br />
              Suite 300
              <br />
              Jersey City, NJ 07310
              <br />
              <br />
              10 West Broadway, Suite 700
              <br />
              Salt Lake City, UT 84101
            </Typography>
            <Button
              variant="outlined"
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                mt: 2,
                '&:hover': {
                  borderColor: theme.palette.primary.light,
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                },
              }}
            >
              Talk to Our Team
            </Button>
          </Grid>

          {/* Solutions */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                mb: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Solutions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Tokenize
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Trade
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Connect
              </Link>
            </Box>
          </Grid>

          {/* Company */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                mb: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Company
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Careers
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Contact Us
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Support
              </Link>
            </Box>
          </Grid>

          {/* Content Hub */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                mb: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Content Hub
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                News
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Media
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Insights
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Podcasts
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Learn
              </Link>
            </Box>
          </Grid>

          {/* Legal Hub */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                mb: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Legal Hub
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Privacy, Customer Agreements and Disclosures
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Trademarks
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Recent Stockholder Notices
              </Link>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Tokenization FAQ
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Copyright and Social Media */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.875rem',
            }}
          >
            Copyright © {new Date().getFullYear()} tZERO Technologies. All Rights Reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              href="https://twitter.com/tzero"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                },
              }}
            >
              <Twitter />
            </IconButton>
            <IconButton
              href="https://www.linkedin.com/company/tzero"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                },
              }}
            >
              <LinkedIn />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
