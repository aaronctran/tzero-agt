'use client'

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import styles from './InvestmentLookupIllustration.module.css'

export default function InvestmentLookupIllustration() {
  const theme = useTheme()

  return (
    <Box className={styles.container}>
      <svg
        viewBox="0 0 200 200"
        className={styles.illustration}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow effect */}
        <defs>
          <radialGradient id="glowGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow circle behind magnifying glass */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="url(#glowGradient)"
          opacity="0.6"
        />

        {/* Magnifying Glass with Dollar Sign - centered */}
        <g transform="translate(100, 100)">
          {/* Outer ring of magnifying glass lens (thicker) */}
          <circle
            cx="0"
            cy="0"
            r="55"
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          
          {/* Inner ring of magnifying glass lens */}
          <circle
            cx="0"
            cy="0"
            r="48"
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Dollar Sign centered inside the lens */}
          <g transform="translate(0, 0)">
            {/* Dollar Sign - Main vertical line through center */}
            <line
              x1="0"
              y1="-32"
              x2="0"
              y2="32"
              stroke={theme.palette.primary.main}
              strokeWidth="10"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            
            {/* Dollar Sign - Top S curve (properly shaped S that intersects vertical line) */}
            <path
              d="M 0,-32 
                 C -14,-26 -14,-10 0,-4 
                 C 14,-10 14,-26 0,-32"
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {/* Dollar Sign - Bottom S curve (properly shaped S that intersects vertical line) */}
            <path
              d="M 0,4 
                 C -14,10 -14,26 0,32 
                 C 14,26 14,10 0,4"
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          </g>

          {/* Handle of magnifying glass - extending from bottom-right */}
          {/* Handle base (rounded, solid shape extending from outer ring) */}
          <path
            d="M 38,38 L 55,55 L 50,60 L 33,43 Z"
            fill={theme.palette.primary.main}
            stroke={theme.palette.primary.main}
            strokeWidth="5"
            strokeLinejoin="round"
            filter="url(#glow)"
            opacity="0.95"
          />
          
          {/* Handle extension (rounded) */}
          <path
            d="M 55,55 Q 60,60 65,65 L 60,70 Q 55,65 50,60 Z"
            fill={theme.palette.primary.main}
            stroke={theme.palette.primary.main}
            strokeWidth="4"
            strokeLinejoin="round"
            filter="url(#glow)"
            opacity="0.95"
          />
        </g>
      </svg>
    </Box>
  )
}
