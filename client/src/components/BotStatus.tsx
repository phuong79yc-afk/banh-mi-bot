import { useBotStatus } from '../hooks/useBotStatus'
import { useTheme } from '../contexts/ThemeContext'
import { Activity, Users, Server, Wifi, WifiOff } from 'lucide-react'

export default function BotStatus() {
  const { status, loading, error } = useBotStatus(5000) // Refresh every 5s
  const { colors } = useTheme()

  if (loading) {
    return (
      <div 
        className="p-4 rounded-xl border backdrop-blur-sm"
        style={{
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}30`
        }}
      >
        <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
          Đang kiểm tra bot...
        </p>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div 
        className="p-4 rounded-xl border backdrop-blur-sm flex items-center gap-3"
        style={{
          backgroundColor: '#7f1d1d20',
          borderColor: '#ef4444'
        }}
      >
        <WifiOff className="w-5 h-5 text-red-500" />
        <div className="flex-1">
          <p className="font-semibold text-red-500">Bot Offline</p>
          <p className="text-xs text-red-400">Không thể kết nối đến bot</p>
        </div>
      </div>
    )
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div 
      className="p-4 rounded-xl border backdrop-blur-sm"
      style={{
        backgroundColor: status.online ? '#10b98120' : '#7f1d1d20',
        borderColor: status.online ? '#10b981' : '#ef4444'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {status.online ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span 
            className="font-semibold"
            style={{ color: status.online ? '#10b981' : '#ef4444' }}
          >
            {status.online ? 'Bot Online' : 'Bot Offline'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            {status.ping}ms
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
          <Server className="w-4 h-4 mx-auto mb-1" style={{ color: colors.primary }} />
          <p className="text-lg font-bold" style={{ color: colors.text }}>
            {status.guilds}
          </p>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Servers</p>
        </div>

        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
          <Users className="w-4 h-4 mx-auto mb-1" style={{ color: colors.primary }} />
          <p className="text-lg font-bold" style={{ color: colors.text }}>
            {status.users.toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Users</p>
        </div>

        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
          <Activity className="w-4 h-4 mx-auto mb-1" style={{ color: colors.primary }} />
          <p className="text-lg font-bold" style={{ color: colors.text }}>
            {formatUptime(status.uptime)}
          </p>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Uptime</p>
        </div>
      </div>
    </div>
  )
}
