import { useEffect, useState } from 'react'
import { Activity, Cpu, Wifi } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import api, { apiEndpoints } from '../../lib/api'

interface BotStatus {
  status: 'online' | 'offline' | 'idle'
  memory: number
  cpu: number
  ping: number
}

export default function BotStatusWidget() {
  const { colors } = useTheme()
  const [status, setStatus] = useState<BotStatus>({
    status: 'online',
    memory: 0,
    cpu: 0,
    ping: 0
  })

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Giảm từ 5s → 10s
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      // Get full stats from enhanced endpoint
      const response = await api.get(apiEndpoints.botStats)
      setStatus({
        status: response.data.servers > 0 ? 'online' : 'offline',
        memory: response.data.memory || 0,
        cpu: Math.min(Math.round((response.data.memory / 512) * 100), 100), // Estimate CPU from memory
        ping: response.data.ping || 0
      })
    } catch (error) {
      console.error('Failed to fetch bot status:', error)
      setStatus(prev => ({ ...prev, status: 'offline' }))
    }
  }

  const statusColor = {
    online: '#10b981',
    idle: '#f59e0b',
    offline: '#ef4444'
  }[status.status]

  return (
    <div 
      className="w-80 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-xl"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'transparent'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
          Bot Status
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span 
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: statusColor }}
            ></span>
            <span 
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: statusColor }}
            ></span>
          </span>
          <span className="text-sm font-medium capitalize" style={{ color: colors.text }}>
            {status.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                Memory
              </span>
            </div>
            <span className="text-sm font-semibold" style={{ color: colors.text }}>
              {status.memory} MB
            </span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((status.memory / 512) * 100, 100)}%`,
                backgroundColor: colors.primary
              }}
            />
          </div>
        </div>

        {/* CPU */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                CPU Usage
              </span>
            </div>
            <span className="text-sm font-semibold" style={{ color: colors.text }}>
              {status.cpu}%
            </span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${status.cpu}%`,
                backgroundColor: colors.primary
              }}
            />
          </div>
        </div>

        {/* Ping */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              Ping
            </span>
          </div>
          <span className="text-lg font-bold" style={{ color: colors.text }}>
            {status.ping}ms
          </span>
        </div>
      </div>
    </div>
  )
}
