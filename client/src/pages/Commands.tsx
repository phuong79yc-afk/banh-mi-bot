import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Search, Music, Shield, Zap, Laugh, DollarSign, Info } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

interface Command {
  name: string
  description: string
  category: string
  usage?: string
  example?: string
}

const categoryIcons = {
  music: Music,
  moderation: Shield,
  utility: Zap,
  fun: Laugh,
  economy: DollarSign,
  info: Info
}

const categoryColors = {
  music: { light: '#8b5cf6', dark: '#a78bfa' },
  moderation: { light: '#ef4444', dark: '#f87171' },
  utility: { light: '#3b82f6', dark: '#60a5fa' },
  fun: { light: '#f59e0b', dark: '#fbbf24' },
  economy: { light: '#10b981', dark: '#34d399' },
  info: { light: '#6366f1', dark: '#818cf8' }
}

export default function Commands() {
  const { colors, darkMode } = useTheme()
  const [commands, setCommands] = useState<Command[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchCommands()
  }, [])

  const fetchCommands = async () => {
    try {
      const response = await axios.get('/api/commands')
      setCommands(response.data.commands || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch commands:', error)
      // Fallback to static data if API fails
      setCommands(getStaticCommands())
      setLoading(false)
    }
  }

  const getStaticCommands = (): Command[] => {
    return [
      // Music Commands
      { name: 'play', description: 'Play a song from YouTube or search query', category: 'music', usage: '/play <song name or URL>', example: '/play never gonna give you up' },
      { name: 'pause', description: 'Pause the current song', category: 'music', usage: '/pause' },
      { name: 'resume', description: 'Resume playback', category: 'music', usage: '/resume' },
      { name: 'skip', description: 'Skip to the next song', category: 'music', usage: '/skip' },
      { name: 'stop', description: 'Stop playing and clear queue', category: 'music', usage: '/stop' },
      { name: 'queue', description: 'Show the current music queue', category: 'music', usage: '/queue' },
      { name: 'nowplaying', description: 'Show currently playing song', category: 'music', usage: '/nowplaying' },
      { name: 'volume', description: 'Set playback volume (0-100)', category: 'music', usage: '/volume <number>', example: '/volume 50' },
      { name: 'loop', description: 'Toggle loop mode', category: 'music', usage: '/loop' },
      { name: 'shuffle', description: 'Shuffle the queue', category: 'music', usage: '/shuffle' },
      { name: 'lyrics', description: 'Get lyrics for current song', category: 'music', usage: '/lyrics' },
      
      // Moderation Commands
      { name: 'kick', description: 'Kick a member from the server', category: 'moderation', usage: '/kick <user> [reason]', example: '/kick @user Spamming' },
      { name: 'ban', description: 'Ban a member from the server', category: 'moderation', usage: '/ban <user> [reason]', example: '/ban @user Breaking rules' },
      { name: 'unban', description: 'Unban a user from the server', category: 'moderation', usage: '/unban <user ID>', example: '/unban 123456789' },
      { name: 'mute', description: 'Mute a member', category: 'moderation', usage: '/mute <user> [duration] [reason]', example: '/mute @user 10m Spamming' },
      { name: 'unmute', description: 'Unmute a member', category: 'moderation', usage: '/unmute <user>' },
      { name: 'warn', description: 'Warn a member', category: 'moderation', usage: '/warn <user> [reason]', example: '/warn @user Please follow rules' },
      { name: 'warnings', description: 'View warnings for a user', category: 'moderation', usage: '/warnings <user>' },
      { name: 'clear', description: 'Clear messages in channel', category: 'moderation', usage: '/clear <amount>', example: '/clear 10' },
      { name: 'lock', description: 'Lock a channel', category: 'moderation', usage: '/lock [channel]' },
      { name: 'unlock', description: 'Unlock a channel', category: 'moderation', usage: '/unlock [channel]' },
      { name: 'slowmode', description: 'Set slowmode delay', category: 'moderation', usage: '/slowmode <seconds>', example: '/slowmode 5' },
      { name: 'timeout', description: 'Timeout a member', category: 'moderation', usage: '/timeout <user> <duration>', example: '/timeout @user 1h' },
      { name: 'nuke', description: 'Delete and recreate channel', category: 'moderation', usage: '/nuke' },
      
      // Utility Commands
      { name: 'help', description: 'Show all available commands', category: 'utility', usage: '/help [command]' },
      { name: 'ping', description: 'Check bot latency', category: 'utility', usage: '/ping' },
      { name: 'serverinfo', description: 'Show server information', category: 'utility', usage: '/serverinfo' },
      { name: 'userinfo', description: 'Show user information', category: 'utility', usage: '/userinfo [user]' },
      { name: 'avatar', description: 'Get user avatar', category: 'utility', usage: '/avatar [user]' },
      { name: 'stats', description: 'Show bot statistics', category: 'utility', usage: '/stats' },
      { name: 'uptime', description: 'Show bot uptime', category: 'utility', usage: '/uptime' },
      { name: 'invite', description: 'Get bot invite link', category: 'utility', usage: '/invite' },
      { name: 'support', description: 'Get support server link', category: 'utility', usage: '/support' },
      
      // Fun Commands
      { name: '8ball', description: 'Ask the magic 8ball', category: 'fun', usage: '/8ball <question>', example: '/8ball Will I win?' },
      { name: 'joke', description: 'Get a random joke', category: 'fun', usage: '/joke' },
      { name: 'meme', description: 'Get a random meme', category: 'fun', usage: '/meme' },
      { name: 'coinflip', description: 'Flip a coin', category: 'fun', usage: '/coinflip' },
      { name: 'roll', description: 'Roll a dice', category: 'fun', usage: '/roll [sides]', example: '/roll 6' },
      
      // Economy Commands
      { name: 'balance', description: 'Check your balance', category: 'economy', usage: '/balance [user]' },
      { name: 'daily', description: 'Claim daily reward', category: 'economy', usage: '/daily' },
      { name: 'shop', description: 'View the shop', category: 'economy', usage: '/shop' },
      { name: 'giveaway', description: 'Start a giveaway', category: 'economy', usage: '/giveaway <duration> <winners> <prize>', example: '/giveaway 1h 1 Nitro' },
    ]
  }

  const categories = [
    { id: 'all', name: 'All Commands', icon: Info },
    { id: 'music', name: 'Music', icon: Music },
    { id: 'moderation', name: 'Moderation', icon: Shield },
    { id: 'utility', name: 'Utility', icon: Zap },
    { id: 'fun', name: 'Fun', icon: Laugh },
    { id: 'economy', name: 'Economy', icon: DollarSign },
  ]

  const filteredCommands = commands.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

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
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Bot Commands</h1>
        <p className="mt-1" style={{ color: colors.textSecondary }}>
          Tất cả {commands.length} commands có sẵn
        </p>
      </div>

      {/* Search Bar */}
      <GlassCard 
        variant="default"
        className={`p-4 relative z-10 ${mounted ? 'animate-scale-in' : 'opacity-0'}`}
        style={{ animationDelay: '0.2s' }}
      >
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
            style={{ color: colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
            style={{
              border: `2px solid ${colors.border}`,
              backgroundColor: darkMode ? `${colors.primary}10` : 'white',
              color: colors.text
            }}
          />
        </div>
      </GlassCard>

      {/* Category Filters */}
      <div 
        className={`flex flex-wrap gap-3 relative z-10 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
        style={{ animationDelay: '0.3s' }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                border: `2px solid ${isActive ? colors.primary : colors.border}`,
                backgroundColor: isActive ? colors.primary : colors.surface,
                color: isActive ? (darkMode ? colors.text : 'white') : colors.text
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{cat.name}</span>
            </button>
          )
        })}
      </div>

      {/* Commands List */}
      <div className="space-y-6 relative z-10">
        {Object.entries(groupedCommands).map(([category, cmds], index) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || Info
          const catColor = categoryColors[category as keyof typeof categoryColors]
          
          return (
            <div 
              key={category}
              className={`${mounted ? 'animate-scale-in' : 'opacity-0'}`}
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${catColor?.[darkMode ? 'dark' : 'light']}20` }}
                >
                  <Icon 
                    className="h-5 w-5" 
                    style={{ color: catColor?.[darkMode ? 'dark' : 'light'] }}
                  />
                </div>
                <h2 className="text-xl font-semibold capitalize" style={{ color: colors.text }}>
                  {category} Commands
                </h2>
                <span 
                  className="text-sm font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >
                  {cmds.length}
                </span>
              </div>

              {/* Commands Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cmds.map((cmd) => (
                  <GlassCard
                    key={cmd.name}
                    variant="hover"
                    className="p-4"
                  >
                    {/* Command Name */}
                    <div className="flex items-center justify-between mb-2">
                      <code 
                        className="text-lg font-bold px-3 py-1 rounded"
                        style={{
                          backgroundColor: `${colors.primary}15`,
                          color: colors.primary
                        }}
                      >
                        /{cmd.name}
                      </code>
                    </div>

                    {/* Description */}
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                      {cmd.description}
                    </p>

                    {/* Usage */}
                    {cmd.usage && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
                          Usage:
                        </p>
                        <code 
                          className="text-xs px-2 py-1 rounded block"
                          style={{
                            backgroundColor: darkMode ? `${colors.primary}10` : '#f3f4f6',
                            color: colors.text
                          }}
                        >
                          {cmd.usage}
                        </code>
                      </div>
                    )}

                    {/* Example */}
                    {cmd.example && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
                          Example:
                        </p>
                        <code 
                          className="text-xs px-2 py-1 rounded block"
                          style={{
                            backgroundColor: darkMode ? `${colors.secondary}15` : '#fef3c7',
                            color: colors.secondary
                          }}
                        >
                          {cmd.example}
                        </code>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* No Results */}
      {filteredCommands.length === 0 && (
        <div className="text-center py-12 relative z-10">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-30" style={{ color: colors.textSecondary }} />
          <p className="text-lg" style={{ color: colors.text }}>No commands found</p>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  )
}
