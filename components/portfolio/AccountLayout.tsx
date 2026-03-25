'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Box, Typography } from '@mui/material'
import {
  AccessTime,
  AccountBalance,
} from '@mui/icons-material'
import styles from './AccountLayout.module.css'

interface AccountLayoutProps {
  children: ReactNode
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedNav, setSelectedNav] = useState<'portfolio' | 'banking'>('portfolio')

  // Update selected nav based on current path
  useEffect(() => {
    if (pathname === '/account/banking' || pathname?.startsWith('/account/banking/')) {
      setSelectedNav('banking')
    } else {
      setSelectedNav('portfolio')
    }
  }, [pathname])

  const navItems = [
    { id: 'portfolio' as const, label: 'PORTFOLIO', icon: <AccessTime />, href: '/account/portfolio' },
    { id: 'banking' as const, label: 'TRANSFERS', icon: <AccountBalance />, href: '/account/banking' },
  ]

  const handleNavClick = (item: typeof navItems[0]) => {
    setSelectedNav(item.id)
    router.push(item.href)
  }

  return (
    <Box className={styles.container}>
      {/* Left Sidebar */}
      <Box className={styles.sidebar}>
        {navItems.map((item) => (
          <Box
            key={item.id}
            className={`${styles.navItem} ${selectedNav === item.id ? styles.navItemActive : ''}`}
            onClick={() => handleNavClick(item)}
          >
            {item.icon}
            <Typography variant="body2" className={styles.navLabel}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Content */}
      <Box className={styles.mainContent}>
        <Box className={styles.mainContentInner}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
