'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  Typography, 
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Fade,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Person,
  AccountCircle,
  History,
  Logout,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Menu as MenuIcon,
} from '@mui/icons-material'

interface NavMenuItem {
  label: string
  href?: string
  isHighlighted?: boolean
  dropdownItems?: {
    icon: React.ReactNode
    title: string
    description: string
    href: string
  }[]
}

export default function Header() {
  const theme = useTheme()
  const router = useRouter()
  const { isAuthenticated, user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [navMenuAnchor, setNavMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({})
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)
  const [mounted, setMounted] = useState(false)
  const profileButtonRef = useRef<HTMLDivElement>(null)
  const menuOpen = Boolean(anchorEl)
  const mobileMenuOpen = Boolean(mobileMenuAnchor)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Navigation menu items - use mounted state to prevent hydration mismatch
  const navMenuItems: NavMenuItem[] = [
    {
      label: 'Marketplace',
      href: '/investing/secondary-trading',
    },
    ...(mounted && isAuthenticated ? [{
      label: 'Portfolio',
      href: '/account/portfolio',
    }] : []),
  ]

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
  }

  const handleMenuItemClick = (path?: string) => {
    handleMenuClose()
    if (path) {
      router.push(path)
    }
  }

  const handleNavMenuEnter = (label: string) => (event: React.MouseEvent<HTMLElement>) => {
    setNavMenuAnchor((prev) => ({ ...prev, [label]: event.currentTarget }))
  }

  const handleNavMenuLeave = (label: string) => () => {
    setNavMenuAnchor((prev) => ({ ...prev, [label]: null }))
  }

  const handleNavItemClick = (href: string) => {
    setNavMenuAnchor({})
    setMobileMenuAnchor(null)
    router.push(href)
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
  }

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        top: 0,
        left: 0,
        right: 0,
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1300,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: { xs: 1.5, md: 2 }, px: { xs: 1, sm: 2 } }}>
        {/* Mobile Hamburger Menu (Left side) */}
        <IconButton
          sx={{
            display: { xs: 'flex', sm: 'none' },
            color: '#ffffff',
            mr: 1,
          }}
          onClick={handleMobileMenuOpen}
        >
          <MenuIcon />
        </IconButton>

        <Link
          href="/"
          style={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              height: { xs: 32, md: 40 },
              position: 'relative',
              maxWidth: { xs: '120px', md: '150px' },
            }}
          >
            <Image
              src="/tzero-logo.png"
              alt="tZERO Logo"
              width={150}
              height={40}
              style={{
                height: 'auto',
                width: '100%',
                maxHeight: '40px',
                objectFit: 'contain',
              }}
              priority
            />
          </Box>
        </Link>
        
        {/* Desktop Navigation Menu Items */}
        <Box sx={{ 
          display: { xs: 'none', sm: 'flex' }, 
          gap: 3, 
          alignItems: 'center', 
          flex: 1, 
          justifyContent: 'center' 
        }}>
          {navMenuItems.map((item) => (
            <Box
              key={item.label}
              sx={{ position: 'relative' }}
              onMouseEnter={item.dropdownItems ? handleNavMenuEnter(item.label) : undefined}
              onMouseLeave={item.dropdownItems ? handleNavMenuLeave(item.label) : undefined}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    component="div"
                    sx={{
                      color: item.isHighlighted ? theme.palette.primary.main : '#ffffff',
                      fontWeight: 600,
                      fontSize: '15px',
                      cursor: 'pointer',
                      position: 'relative',
                      py: 1,
                      px: 0.5,
                      transition: 'color 0.2s ease-in-out',
                      '&:hover': {
                        color: item.isHighlighted ? theme.palette.primary.main : theme.palette.primary.main,
                      },
                      '&::after': item.dropdownItems ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: Boolean(navMenuAnchor[item.label]) ? theme.palette.primary.main : 'transparent',
                        transition: 'background-color 0.3s ease-in-out',
                      } : {},
                    }}
                  >
                    {item.label}
                  </Typography>
                </Link>
              ) : (
                <Typography
                  component="div"
                  sx={{
                    color: item.isHighlighted ? theme.palette.primary.main : '#ffffff',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    position: 'relative',
                    py: 1,
                    px: 0.5,
                    transition: 'color 0.2s ease-in-out',
                    '&:hover': {
                      color: item.isHighlighted ? theme.palette.primary.main : theme.palette.primary.main,
                    },
                    '&::after': item.dropdownItems ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: Boolean(navMenuAnchor[item.label]) ? theme.palette.primary.main : 'transparent',
                      transition: 'background-color 0.3s ease-in-out',
                    } : {},
                  }}
                >
                  {item.label}
                </Typography>
              )}

              {/* Dropdown Menu */}
              {item.dropdownItems && (
                <Menu
                  anchorEl={navMenuAnchor[item.label]}
                  open={Boolean(navMenuAnchor[item.label])}
                  onClose={handleNavMenuLeave(item.label)}
                  TransitionComponent={Fade}
                  TransitionProps={{ timeout: 200 }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  MenuListProps={{
                    onMouseLeave: handleNavMenuLeave(item.label),
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: { xs: 280, sm: 300 },
                      maxWidth: { xs: '90vw', sm: 'none' },
                      
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      overflow: 'hidden',
                      maxHeight: { xs: '80vh', sm: 'none' },
                      '& .MuiMenuItem-root': {
                        py: 1.5,
                        px: 2.5,
                        fontSize: { xs: '14px', sm: '15px' },
                        color: '#ffffff',
                        fontWeight: 400,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#b0b0b0',
                          fontSize: { xs: 18, sm: 20 },
                          mr: 2,
                          transition: 'color 0.2s ease-in-out',
                        },
                        '&:hover .MuiSvgIcon-root': {
                          color: '#ffffff',
                        },
                      },
                    },
                  }}
                >
                  {item.dropdownItems.map((dropdownItem, index) => (
                    <Box
                      key={index}
                      onClick={() => handleNavItemClick(dropdownItem.href)}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        px: 2.5,
                        py: 1.5,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        fontSize: { xs: '14px', sm: '15px' },
                        color: '#ffffff',
                        fontWeight: 400,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#b0b0b0',
                          fontSize: { xs: 18, sm: 20 },
                          transition: 'color 0.2s ease-in-out',
                        },
                        '&:hover .MuiSvgIcon-root': {
                          color: '#ffffff',
                        },
                      }}
                    >
                      <Box 
                        sx={{ 
                          mr: 2, 
                          mt: 0.5, 
                          flexShrink: 0,
                        }}
                      >
                        {dropdownItem.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: '14px', sm: '15px' },
                            color: '#ffffff',
                            mb: 0.5,
                          }}
                        >
                          {dropdownItem.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: '12px', sm: '13px' },
                            color: '#cccccc',
                            lineHeight: 1.4,
                          }}
                        >
                          {dropdownItem.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Menu>
              )}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {mounted && isAuthenticated ? (
            <Box sx={{ position: 'relative' }}>
              <Box
                ref={profileButtonRef}
                onClick={handleProfileClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  padding: { xs: '6px 10px', sm: '8px 12px' },
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Person sx={{ fontSize: { xs: 18, sm: 20 } }} />
                {menuOpen ? (
                  <KeyboardArrowUp 
                    sx={{ 
                      fontSize: { xs: 14, sm: 16 }, 
                      color: theme.palette.primary.main,
                      transition: 'transform 0.2s ease-in-out',
                    }} 
                  />
                ) : (
                  <KeyboardArrowDown 
                    sx={{ 
                      fontSize: { xs: 14, sm: 16 }, 
                      color: '#ffffff',
                      transition: 'transform 0.2s ease-in-out',
                    }} 
                  />
                )}
              </Box>
              
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 200 }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: { xs: 280, sm: 300 },
                    maxWidth: { xs: '90vw', sm: 'none' },
                    
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    overflow: 'hidden',
                    maxHeight: { xs: '80vh', sm: 'none' },
                    '& .MuiMenuItem-root': {
                      py: 1.5,
                      px: 2.5,
                      fontSize: { xs: '14px', sm: '15px' },
                      color: '#ffffff',
                      fontWeight: 400,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#b0b0b0',
                        fontSize: { xs: 18, sm: 20 },
                        mr: 2,
                        transition: 'color 0.2s ease-in-out',
                      },
                      '&:hover .MuiSvgIcon-root': {
                        color: '#ffffff',
                      },
                    },
                  },
                }}
              >
                {/* User Name Section */}
                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 }, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#ffffff',
                        fontSize: { xs: '15px', sm: '16px' },
                        lineHeight: 1.4,
                        mb: 0.5,
                      }}
                    >
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.firstName 
                        ? user.firstName
                        : user?.lastName
                        ? user.lastName
                        : user?.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#cccccc',
                        fontSize: { xs: '12px', sm: '13px' },
                        fontWeight: 400,
                      }}
                    >
                      {user?.email || ''}
                    </Typography>
                  </Box>
                  {!user?.onboardingCompleted && (
                    <Box
                      onClick={() => handleMenuItemClick('/account/setup')}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        px: { xs: 1, sm: 1.5 },
                        py: { xs: 0.75, sm: 1 },
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        },
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontSize: { xs: '13px', sm: '14px' },
                          fontWeight: 500,
                        }}
                      >
                        Setup your investment account to invest -&gt;
                      </Typography>
                    </Box>
                  )}
                  {!user?.emailVerified && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#ff6b6b',
                        fontSize: { xs: '12px', sm: '13px' },
                        fontWeight: 500,
                        textDecoration: 'underline',
                        mt: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#ff5252',
                        },
                      }}
                    >
                      Email verification required
                    </Typography>
                  )}
                </Box>

                <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                  <AccountCircle />
                  Profile
                </MenuItem>
                
                <MenuItem onClick={() => handleMenuItemClick('/account/portfolio')}>
                  <History />
                  Portfolio
                </MenuItem>
                

                <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <MenuItem onClick={handleLogout}>
                  <Logout />
                  Log Out
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Link href="/auth" style={{ textDecoration: 'none' }}>
              <Button 
                variant="contained"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: '#333333',
                  fontSize: { xs: '13px', sm: '15px' },
                  padding: { xs: '8px 16px', sm: '10px 24px' },
                  '&:hover': {
                    backgroundColor: '#00E677',
                  },
                }}
              >
                Login / Sign Up
              </Button>
            </Link>
          )}
        </Box>

        {/* Mobile Navigation Menu (Left side hamburger) */}
        <Menu
            anchorEl={mobileMenuAnchor}
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 200 }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: { xs: 280, sm: 300 },
                maxWidth: '90vw',
                width: { xs: 280, sm: 300 },
                
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                maxHeight: '80vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                '& .MuiMenuItem-root': {
                  py: 1.5,
                  px: 2.5,
                  fontSize: { xs: '14px', sm: '15px' },
                  color: '#ffffff',
                  fontWeight: 400,
                  transition: 'all 0.2s ease-in-out',
                  maxWidth: '100%',
                  whiteSpace: 'normal',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#b0b0b0',
                    fontSize: { xs: 18, sm: 20 },
                    mr: 2,
                    transition: 'color 0.2s ease-in-out',
                    flexShrink: 0,
                  },
                  '&:hover .MuiSvgIcon-root': {
                    color: '#ffffff',
                  },
                },
              },
            }}
          >
            {navMenuItems.map((item, index) => {
              const nextItem = navMenuItems[index + 1]
              return (
                <Box key={item.label}>
                  {item.dropdownItems ? (
                    <>
                      <MenuItem
                        onClick={() => {
                          if (item.href) {
                            handleNavItemClick(item.href)
                          }
                        }}
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          py: 1.5,
                        }}
                      >
                        {item.label}
                      </MenuItem>
                      {item.dropdownItems.map((dropdownItem, index) => (
                        <MenuItem
                          key={index}
                          onClick={() => handleNavItemClick(dropdownItem.href)}
                          sx={{
                            pl: 6,
                            py: 1.5,
                            color: '#ffffff',
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%', minWidth: 0, maxWidth: '100%' }}>
                            <Box sx={{ mt: 0.5, flexShrink: 0 }}>
                              {dropdownItem.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                              <Typography 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: '14px', 
                                  mb: 0.5, 
                                  color: '#ffffff',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'normal',
                                }}
                              >
                                {dropdownItem.title}
                              </Typography>
                              <Typography 
                                sx={{ 
                                  fontSize: '12px', 
                                  color: '#cccccc', 
                                  lineHeight: 1.4,
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'normal',
                                }}
                              >
                                {dropdownItem.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                      <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    </>
                  ) : (
                    <>
                      <MenuItem
                        onClick={() => item.href && handleNavItemClick(item.href)}
                        sx={{
                          color: item.isHighlighted ? theme.palette.primary.main : '#ffffff',
                          fontWeight: 600,
                          py: 1.5,
                        }}
                      >
                        {item.label}
                      </MenuItem>
                    </>
                  )}
                </Box>
              )
            })}
            {/* Portfolio Menu Item in Mobile Menu */}
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem
              onClick={() => handleNavItemClick('/account/portfolio')}
              sx={{
                color: '#ffffff',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              <History sx={{ mr: 2, fontSize: { xs: 18, sm: 20 }, color: '#b0b0b0' }} />
              Portfolio
            </MenuItem>
          </Menu>
      </Toolbar>
    </AppBar>
  )
}
