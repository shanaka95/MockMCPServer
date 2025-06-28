import React from 'react'

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { container: 'w-6 h-6' },
    md: { container: 'w-8 h-8' },
    lg: { container: 'w-12 h-12' },
    xl: { container: 'w-16 h-16' }
  }

  const currentSize = sizes[size] || sizes.md

  return (
    <div className={`${currentSize.container} relative ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" floodOpacity="0.1" stdDeviation="1"/>
          </filter>
        </defs>
        
        {/* Lightning Bolt */}
        <path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          fill="url(#logoGradient)"
          filter="url(#dropShadow)"
        />
        
        {/* Subtle highlight */}
        <path
          d="M13 2L12 6L11 10H8L13 2Z"
          fill="rgba(255,255,255,0.2)"
        />
      </svg>
    </div>
  )
}

export default Logo 