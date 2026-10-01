import { Shield } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import GlassCard from './GlassCard'

interface PermissionDeniedProps {
  message?: string
}

export default function PermissionDenied({ message }: PermissionDeniedProps) {
  const { colors } = useTheme()
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <GlassCard variant="strong" className="rounded-2xl p-8 max-w-md text-center">
        <div 
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444'
          }}
        >
          <Shield className="h-10 w-10" style={{ color: '#ef4444' }} />
        </div>
        
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Không Có Quyền Truy Cập
        </h2>
        
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          {message || 'Bạn không có quyền thực hiện hành động này. Chỉ Admin mới có quyền này.'}
        </p>
        
        <div 
          className="p-3 rounded-xl text-xs"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: colors.textSecondary
          }}
        >
          💡 Liên hệ Admin để được cấp quyền
        </div>
      </GlassCard>
    </div>
  )
}
