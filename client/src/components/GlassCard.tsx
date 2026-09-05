import type { ReactNode, CSSProperties } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'hover' | 'strong' | 'subtle'
  style?: CSSProperties
  onClick?: () => void
}

export default function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  style,
  onClick 
}: GlassCardProps) {
  const { colors } = useTheme()
  
  const getGlassStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `2px solid ${colors.primary}`,
      boxShadow: 'none',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      willChange: 'auto'
    }

    switch (variant) {
      case 'hover':
        return {
          ...baseStyle,
          transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
          cursor: onClick ? 'pointer' : 'default',
        }
      
      case 'strong':
        return {
          ...baseStyle,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `2px solid ${colors.primary}`,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }
      
      case 'subtle':
        return {
          ...baseStyle,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${colors.primary}`,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }
      
      default:
        return baseStyle
    }
  }

  return (
    <div
      className={`glass-card-themed ${className}`}
      style={{ ...getGlassStyle(), ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
