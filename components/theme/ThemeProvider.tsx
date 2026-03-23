'use client'

import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ReactNode } from 'react'
import { getTheme } from '@/components/theme/theme'

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = getTheme('dark')

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}

export { ThemeProvider }
