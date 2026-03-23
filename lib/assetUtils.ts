// Get category-based background gradient
export const getCategoryGradient = (category: string) => {
  switch (category) {
    case 'tech':
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 150, 255, 0.1) 50%, rgba(0, 0, 0, 0.95) 100%)'
    case 'healthcare':
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(255, 100, 150, 0.1) 50%, rgba(0, 0, 0, 0.95) 100%)'
    case 'energy':
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(255, 200, 0, 0.1) 50%, rgba(0, 0, 0, 0.95) 100%)'
    case 'consumer':
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(150, 100, 255, 0.1) 50%, rgba(0, 0, 0, 0.95) 100%)'
    case 'finance':
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 200, 255, 0.1) 50%, rgba(0, 0, 0, 0.95) 100%)'
    default:
      return 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 0, 0, 0.95) 100%)'
  }
}

// Get category-based accent color
export const getCategoryAccent = (category: string) => {
  switch (category) {
    case 'tech':
      return 'rgba(0, 150, 255, 0.3)'
    case 'healthcare':
      return 'rgba(255, 100, 150, 0.3)'
    case 'energy':
      return 'rgba(255, 200, 0, 0.3)'
    case 'consumer':
      return 'rgba(150, 100, 255, 0.3)'
    case 'finance':
      return 'rgba(0, 200, 255, 0.3)'
    default:
      return 'rgba(0, 255, 136, 0.3)'
  }
}
