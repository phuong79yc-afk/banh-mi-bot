import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Music, Command, Activity, AlertCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

interface StatsData {
  totalCommands: number
  songsPlayed: number
  activeUsers: number
  serverGrowth: number
  commandUsage: Array<{ name: string; count: number }>
  serverGrowth: Array<{ month: string; servers: number; users: number }>
  topServers: Array<{ name: string; members: number; commands: number }>
  activityByHour: Array<{ hour: string; commands: number }>
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
  const { colors } = useTheme()
  
  return (
    <GlassCard variant="hover" className="rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div 
          className="rounded-lg p-2 transition-transform duration-300 hover:rotate-12"
          style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <span className="text-xs font-medium flex items-center gap-1" style={{ color: colors.secondary }}>
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm" style={{ color: colors.textSecondary }}>{label}</p>
        <p className="text-3xl font-bold mt-1" style={{ color: colors.text }}>{value}</p>
      </div>
    </GlassCard>
  )
}

export default function Statistics() {
  const { colors, darkMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats/analytics')
      setStats(response.data)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to fetch stats:', err)
      setError(err.response?.data?.message || 'Failed to load statistics')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-4"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="rounded-xl p-8 text-center max-w-md"
          style={{ 
            backgroundColor: darkMode ? '#7f1d1d20' : '#fef2f2',
            border: `2px solid #ef4444`
          }}
        >
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-500 mb-2">Failed to Load Statistics</h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-6 py-2 rounded-lg font-medium"
            style={{ backgroundColor: colors.primary, color: 'white' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const musicGenresData = [
    { name: 'Pop', value: 35, color: colors.primary },
    { name: 'Rock', value: 25, color: colors.secondary },
    { name: 'Hip Hop', value: 20, color: colors.accent },
    { name: 'EDM', value: 12, color: '#f59e0b' },
    { name: 'Other', value: 8, color: colors.textSecondary },
  ]

  return (
    <div 
      className="space-y-6 relative min-h-screen"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
      
      {/* Liquid Glass Background */}
      <LiquidGlass 
        width="100vw" 
        height="100vh" 
        position="fixed"
        top="0"
        left="0"
        glassFrost={0.06}
        glassSaturation={1.1}
        borderRadius="0"
        className="pointer-events-none"
      />
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
      `}</style>
      
      {/* Header */}
      <div className={`relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Statistics & Analytics</h1>
        <p className="mt-1" style={{ color: colors.textSecondary }}>
          Phân tích chi tiết về hoạt động và hiệu suất của bot
        </p>
      </div>

      {/* Key Metrics */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
        <StatCard
          icon={Command}
          label="Total Commands"
          value={stats?.totalCommands?.toLocaleString() || '0'}
          trend={stats?.commandsTrend || '+0%'}
          color="bg-gradient-to-br from-[#C67D4D] to-[#A0653E]"
        />
        <StatCard
          icon={Music}
          label="Songs Played"
          value={stats?.songsPlayed?.toLocaleString() || '0'}
          trend={stats?.songsTrend || '+0%'}
          color="bg-gradient-to-br from-[#8B5A3C] to-[#6B4423]"
        />
        <StatCard
          icon={Activity}
          label="Active Users"
          value={stats?.activeUsers?.toLocaleString() || '0'}
          trend={stats?.usersTrend || '+0%'}
          color="bg-gradient-to-br from-[#F5B342] to-[#E89F3C]"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Servers"
          value={stats?.totalServers?.toLocaleString() || '0'}
          trend={stats?.serversTrend || '+0%'}
          color="bg-gradient-to-br from-[#D4A574] to-[#B8925A]"
        />
      </div>

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 ${mounted ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
        {/* Server & User Growth */}
        <GlassCard className="rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Server & User Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.serverGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis 
                dataKey="month" 
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.surface,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="servers" 
                stroke={colors.primary} 
                strokeWidth={2}
                name="Servers"
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke={colors.secondary} 
                strokeWidth={2}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Command Usage */}
        <GlassCard className="rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Most Used Commands
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.commandUsage || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis 
                dataKey="name" 
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.surface,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text
                }}
              />
              <Bar dataKey="count" fill={colors.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Music Genres */}
        <GlassCard className="rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Music Genres Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={musicGenresData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {musicGenresData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.surface,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Activity by Hour */}
        <GlassCard className="rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Activity by Hour
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.activityByHour || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis 
                dataKey="hour" 
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.surface,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text
                }}
              />
              <Bar dataKey="commands" fill={colors.secondary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Top Servers */}
      <GlassCard 
        className={`rounded-xl relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} 
        style={{ animationDelay: '0.5s' }}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
            Top Active Servers
          </h3>
        </div>
        <div style={{ borderTop: `1px solid ${colors.border}` }}>
          {(stats?.topServers || []).map((server: any, index: number) => (
            <div 
              key={index} 
              className="p-4 hover:translate-x-2 transition-all duration-300 flex items-center gap-4"
              style={{ 
                borderBottom: index < (stats?.topServers?.length || 0) - 1 ? `1px solid ${colors.border}` : 'none',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? colors.primary + '20' : colors.primary + '10'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="text-lg font-bold w-8" style={{ color: colors.textSecondary }}>
                #{index + 1}
              </div>
              <div 
                className="h-10 w-10 rounded-full"
                style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}
              />
              <div className="flex-1">
                <p className="font-medium" style={{ color: colors.text }}>{server.name}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {server.members.toLocaleString()} members
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: colors.text }}>
                  {server.commands.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>commands</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
