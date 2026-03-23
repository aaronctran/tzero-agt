import {createTheme} from '@mui/material/styles';

// tZERO Green color
const tZEROGreen = '#00FF88'

export const getTheme = (themeMode: 'light' | 'dark') => createTheme(themeMode === 'dark' ? {
  palette: {
    mode: 'dark',
    primary: {
      main: tZEROGreen,
    },
    error: {
      main: '#FF4444',
      light: '#FF6B6B',
      dark: '#CC0000',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#42A5F5',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    success: {
      main: tZEROGreen,
      light: '#33FF99',
      dark: '#00CC6A',
    },
    // background: {
    //   default: '#000000',
    //   paper: '#000000',
    // },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 700,
      color: '#ffffff',
    },
    h2: {
      fontWeight: 700,
      color: '#ffffff',
    },
    h3: {
      fontWeight: 600,
      color: '#ffffff',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
        contained: {
          backgroundColor: tZEROGreen,
          color: '#333333',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#00E677',
            color: '#333333',
          },
          '&:disabled': {
            backgroundColor: 'rgba(0, 255, 136, 0.5)',
            color: 'rgba(51, 51, 51, 0.5)',
          },
        },
        outlined: {
          borderColor: tZEROGreen,
          color: tZEROGreen,
          '&:hover': {
            borderColor: '#00E677',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
          },
        },
      },
    },
  },
} : {
  palette: {
    mode: "light",
    primary: {
      main: "#0d9488", // teal-600
      light: "#14b8a6", // teal-500
      dark: "#0f766e", // teal-700
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#4f46e5", // indigo-600
      light: "#6366f1", // indigo-500
      dark: "#4338ca", // indigo-700
      contrastText: "#ffffff",
    },
    background: {
      default: "#ebeef1", // slate-50
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // slate-900
      secondary: "#475569", // slate-600
    },
    divider: "#e2e8f0", // slate-200
    error: {
      main: "#dc2626",
    },
    success: {
      main: "#16a34a",
    },
    warning: {
      main: "#ea580c",
    },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontSize: "3rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2.25rem",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.875rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: "1rem",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        sizeLarge: {
          padding: "16px 32px",
          fontSize: "1.125rem",
        },
        sizeSmall: {
          padding: "8px 16px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
})