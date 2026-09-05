import { useState, useEffect, memo, useMemo } from 'react'
import { Server, Users, Zap, HardDrive, Clock, Command } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BotStatsWidget from '@/components/BotStatsWidget'
import BotControlWidget from '@/components/bot/BotControlWidget'
import BotStatusWidget from '@/components/bot/BotStatusWidget'
import QueueWidget from '@/components/bot/QueueWidget'
import { useTheme } from '../contexts/ThemeContext'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

interface BotStats {
  botName: string
  avatarUrl: string
  servers: number
  users: number
  commands: number
  uptime: number
  memory: number
  ping: number
  inviteUrl: string
  currentSong?: {
    title: string
    artist: string
    thumbnail: string
  }
  isPlaying: boolean
  volume: number
}

const StatCard = memo(function StatCard({ 
  icon: Icon, 
  label, 
  value
}: { 
  icon: any
  label: string
  value: string | number
}) {
  const { colors } = useTheme()
  
  return (
    <GlassCard variant="hover" className="rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div 
          className="rounded-2xl p-3 backdrop-blur-xl"
          style={{ 
            background: 'transparent',
            border: `2px solid ${colors.primary}`,
            transition: 'transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale3d(1.1, 1.1, 1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale3d(1, 1, 1)'
          }}
        >
          <Icon className="h-6 w-6" style={{ color: colors.primary }} />
        </div>
        <div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>{value}</p>
        </div>
      </div>
    </GlassCard>
  )
})

export default function Dashboard() {
  const { colors } = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState<BotStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Refresh every 10s (giảm từ 5s)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/bot/stats/enhanced')
      setStats(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch bot stats:', error)
      setLoading(false)
    }
  }

  const formatUptime = useMemo(() => (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen space-y-6 relative p-8" 
      style={{ 
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f9f9f9'
      }}
    >
      {/* Soft Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" style={{ zIndex: 0 }} />
      
      {/* Liquid Glass Background Effect - Optimized */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        <LiquidGlass 
          width="100vw" 
          height="100vh" 
          position="fixed"
          top="0"
          left="0"
          transform="none"
          glassFrost={0.06}
          glassSaturation={1.1}
          borderRadius="0"
          className="pointer-events-none"
        />
      </div>
      <style>{`
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translate3d(0, 15px, 0);
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale3d(0.97, 0.97, 1);
          }
          to { 
            opacity: 1; 
            transform: scale3d(1, 1, 1);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: opacity;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        /* Remove will-change after animation */
        .animate-fade-in-up.animation-done,
        .animate-fade-in.animation-done,
        .animate-scale-in.animation-done {
          will-change: auto;
        }
      `}</style>
      
      {/* Content with relative z-index */}
      <div className="relative z-10">
      
      {/* Welcome Section */}
      <div className={`${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Welcome back! 👋</h1>
        <p className="mt-1" style={{ color: colors.textSecondary }}>
          Đây là tổng quan về Discord bot của bạn
        </p>
      </div>

      {/* Bot Info Card */}
      {stats && (
        <GlassCard variant="strong" className="rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <img 
              src={stats.avatarUrl} 
              alt={stats.botName}
              className="h-16 w-16 rounded-2xl ring-4 ring-white/30 transition-transform duration-300 hover:scale-110"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>{stats.botName}</h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Online và sẵn sàng phục vụ {stats.servers.toLocaleString()} servers
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm" style={{ color: colors.textSecondary }}>Ping</div>
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>{stats.ping}ms</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <StatCard
            icon={Server}
            label="Total Servers"
            value={stats.servers.toLocaleString()}
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.users.toLocaleString()}
          />
          <StatCard
            icon={Command}
            label="Commands"
            value={stats.commands}
          />
          <StatCard
            icon={Clock}
            label="Uptime"
            value={formatUptime(stats.uptime)}
          />
          <StatCard
            icon={HardDrive}
            label="Memory Usage"
            value={`${stats.memory}MB`}
          />
          <StatCard
            icon={Zap}
            label="Response Time"
            value={`${stats.ping}ms`}
          />
        </div>
      )}

      {/* Animata Components Showcase */}
      <div className="space-y-4 mb-12">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Dashboard Widgets</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Interactive components with real bot data
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {stats && (
            <BotStatsWidget 
              servers={stats.servers}
              users={stats.users}
              messages={stats.commands * 150}
              uptime={formatUptime(stats.uptime)}
            />
          )}
        </div>
      </div>

      {/* More Widgets */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Interactive Controls</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Control your bot and view live statistics
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {stats && (
            <BotControlWidget 
              currentSong={stats.currentSong}
              isPlaying={stats.isPlaying}
              volume={stats.volume}
            />
          )}
          <BotStatusWidget />
          <QueueWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div 
          className="rounded-2xl p-6 backdrop-blur-xl"
          style={{
            border: `2px solid ${colors.primary}`,
            backgroundColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/dashboard/stats')}
              className="w-full text-left px-4 py-2 rounded-xl transition-all backdrop-blur-xl cursor-pointer"
              style={{ 
                color: colors.text,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: `2px solid ${colors.primary}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primary}20`
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              📊 View Detailed Analytics
            </button>
            <button 
              onClick={() => navigate('/dashboard/music')}
              className="w-full text-left px-4 py-2 rounded-xl transition-all backdrop-blur-xl cursor-pointer"
              style={{ 
                color: colors.text,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: `2px solid ${colors.primary}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primary}20`
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              🎵 Manage Music Queue
            </button>
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className="w-full text-left px-4 py-2 rounded-xl transition-all backdrop-blur-xl cursor-pointer"
              style={{ 
                color: colors.text,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: `2px solid ${colors.primary}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primary}20`
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              ⚙️ Configure Bot Settings
            </button>
          </div>
        </div>

        <div 
          className="rounded-2xl p-6 backdrop-blur-xl"
          style={{
            border: `2px solid ${colors.primary}`,
            backgroundColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Recent Activity</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/stats')}
              className="w-full flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer"
              style={{ 
                backgroundColor: 'transparent',
                border: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
              <div className="flex-1 text-left">
                <p className="text-sm" style={{ color: colors.text }}>Bot started successfully</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>2 minutes ago</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer"
              style={{ 
                backgroundColor: 'transparent',
                border: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primaryLight }}></div>
              <div className="flex-1 text-left">
                <p className="text-sm" style={{ color: colors.text }}>New server joined</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>15 minutes ago</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/commands')}
              className="w-full flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer"
              style={{ 
                backgroundColor: 'transparent',
                border: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
              <div className="flex-1 text-left">
                <p className="text-sm" style={{ color: colors.text }}>Commands deployed</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>1 hour ago</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      </div>
    </div>
  )
}
