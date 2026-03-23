'use client'

import { useState } from 'react'
import { 
  Box, 
  Typography, 
  MenuItem, 
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Menu,
  Tooltip
} from '@mui/material'
import { 
  Search,
  Star,
  TrendingUp,
  Business,
  LocalHospital,
  Bolt,
  ShoppingBag,
  Sort
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import styles from './InvestmentFilters.module.css'

interface InvestmentFiltersProps {
  category: string
  sortBy: string
  onCategoryChange: (value: string) => void
  onSortByChange: (value: string) => void
  onSearchChange?: (value: string) => void
  resultCount?: number
  categories?: { value: string; label: string }[]
  sortOptions?: { value: string; label: string }[]
  searchValue?: string
}

interface FilterButton {
  value: string
  label: string
  icon: React.ReactNode
}

export default function InvestmentFilters({
  category,
  sortBy,
  onCategoryChange,
  onSortByChange,
  onSearchChange,
  resultCount,
  searchValue = '',
  categories = [
    { value: '', label: 'All Categories' },
    { value: 'tech', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'energy', label: 'Energy' },
    { value: 'consumer', label: 'Consumer' },
    { value: 'finance', label: 'Finance' },
  ],
  sortOptions = [
    { value: '', label: 'Default' },
    { value: 'closing', label: 'Closing Soon' },
    { value: 'funded', label: 'Most Funded' },
    { value: 'active', label: 'Active' },
  ],
}: InvestmentFiltersProps) {
  const theme = useTheme()
  const [localSearch, setLocalSearch] = useState(searchValue)
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null)

  const filterButtons: FilterButton[] = [
    { value: 'all', label: 'All', icon: <Star /> },
    { value: 'tech', label: 'Technology', icon: <TrendingUp /> },
    { value: 'healthcare', label: 'Healthcare', icon: <LocalHospital /> },
    { value: 'energy', label: 'Energy', icon: <Bolt /> },
    { value: 'consumer', label: 'Consumer', icon: <ShoppingBag /> },
    { value: 'finance', label: 'Finance', icon: <Business /> },
  ]

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const handleFilterClick = (value: string) => {
    if (value === 'all') {
      onCategoryChange('')
    } else {
      onCategoryChange(value)
    }
  }

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget)
  }

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null)
  }

  const handleSortSelect = (value: string) => {
    onSortByChange(value)
    handleSortMenuClose()
  }

  const getSortLabel = () => {
    const selectedOption = sortOptions.find(opt => opt.value === sortBy)
    return selectedOption ? selectedOption.label : 'Sort'
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Search Bar with Sort Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Tooltip title={getSortLabel()}>
          <IconButton
            onClick={handleSortMenuOpen}
            sx={{
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              color: sortBy ? theme.palette.primary.main : '#ffffff',
              width: 48,
              height: 48,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Sort />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={sortMenuAnchor}
          open={Boolean(sortMenuAnchor)}
          onClose={handleSortMenuClose}
          PaperProps={{
            sx: {
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mt: 1,
              minWidth: 180,
              '& .MuiMenuItem-root': {
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 255, 136, 0.2)',
                  color: theme.palette.primary.main,
                },
              },
            },
          }}
        >
          {sortOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={sortBy === option.value}
              onClick={() => handleSortSelect(option.value)}
              sx={{ color: '#ffffff' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
        <TextField
          placeholder="Search assets by name or description..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#888888' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 500,
            width: '100%',
            '& .MuiOutlinedInput-root': {
              
              borderRadius: 3,
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#888888',
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Filter Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        {filterButtons.map((filter) => {
          const isSelected = filter.value === 'all' 
            ? !category 
            : category === filter.value
          
          return (
            <Button
              key={filter.value}
              variant={isSelected ? 'contained' : 'outlined'}
              onClick={() => handleFilterClick(filter.value)}
              startIcon={filter.icon}
              sx={{
                borderRadius: 3,
                px: 2.5,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '14px',
                backgroundColor: isSelected ? theme.palette.primary.main : 'transparent',
                color: isSelected ? '#000000' : '#ffffff',
                borderColor: isSelected ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2,
                borderStyle: 'solid',
                '&:hover': {
                  backgroundColor: isSelected ? '#00E677' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: theme.palette.primary.main,
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 18,
                  color: isSelected ? '#000000' : '#888888',
                },
              }}
            >
              {filter.label}
            </Button>
          )
        })}
      </Box>

      {/* Result Count */}
      {resultCount !== undefined && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: '#888888', fontSize: '14px' }}>
            {resultCount} results
          </Typography>
        </Box>
      )}
    </Box>
  )
}
