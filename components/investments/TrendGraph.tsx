'use client'

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface TrendGraphProps {
  data: number[]
  isPositive: boolean
  width?: number
  height?: number
}

export default function TrendGraph({ data, isPositive, width = 60, height = 30 }: TrendGraphProps) {
  const theme = useTheme()
  const safeData = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0]
  const minVal = Math.min(...safeData)
  const maxVal = Math.max(...safeData)
  const range = maxVal - minVal
  const normalizedData = safeData.map((val) => (range === 0 ? 50 : ((val - minVal) / range) * 100))

  const pathPoints = normalizedData.map((value, index) => {
    const x = (index / (normalizedData.length - 1)) * width
    const y = height - (value / 100) * height
    return `${x},${y}`
  })
  const pathData = pathPoints.join(' ')

  const color = isPositive ? theme.palette.primary.main : theme.palette.primary.main

  return (
    <Box sx={{ width, height }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pathData}
        />
      </svg>
    </Box>
  )
}
