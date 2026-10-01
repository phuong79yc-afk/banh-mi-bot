import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Search, Shield, Zap, Laugh, DollarSign, Info } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PermissionDenied from '../components/PermissionDenied'
import { usePermissions } from '../hooks/usePermissions'
import api, { apiEndpoints } from '../lib/api'

interface Command {
  name: string
  description: string
  category: string
  usage?: string
  example?: string
}

const categoryIcons = {
  ai: Zap,
  afk: Info,
  moderation: Shield,
  autoresponder: Zap,
  sticky: Info,
  snipe: Info,
  report: Shield,
  donation: DollarSign,
  generator: Zap,
  social: Laugh,
  games: Laugh,
  customrole: Info,
  giveaway: DollarSign,
  minecraft: Laugh,
  ticket: Shield,
  utility: Zap,
  other: Info
}

const categoryColors = {
  ai: { light: '#10b981', dark: '#34d399' },
  afk: { light: '#6366f1', dark: '#818cf8' },
  moderation: { light: '#ef4444', dark: '#f87171' },
  autoresponder: { light: '#3b82f6', dark: '#60a5fa' },
  sticky: { light: '#f59e0b', dark: '#fbbf24' },
  snipe: { light: '#ec4899', dark: '#f472b6' },
  report: { light: '#ef4444', dark: '#f87171' },
  donation: { light: '#10b981', dark: '#34d399' },
  generator: { light: '#8b5cf6', dark: '#a78bfa' },
  social: { light: '#f59e0b', dark: '#fbbf24' },
  games: { light: '#f59e0b', dark: '#fbbf24' },
  customrole: { light: '#6366f1', dark: '#818cf8' },
  giveaway: { light: '#10b981', dark: '#34d399' },
  minecraft: { light: '#10b981', dark: '#34d399' },
  ticket: { light: '#ef4444', dark: '#f87171' },
  utility: { light: '#3b82f6', dark: '#60a5fa' },
  other: { light: '#6366f1', dark: '#818cf8' }
}

export default function Commands() {
  const { colors, darkMode } = useTheme()
  const { canExecuteCommands } = usePermissions()
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
      const response = await api.get(apiEndpoints.commands)
      const commands = response.data.commands || []
      
      // If API returns empty, use static data
      if (commands.length === 0) {
        console.log('API returned empty, using static data')
        setCommands(getStaticCommands())
      } else {
        setCommands(commands)
      }
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
      // AFK Module (3)
      { name: 'afk', description: 'Đặt trạng thái AFK', category: 'afk', usage: '/afk [lý do]' },
      { name: 'afk-remove', description: 'Xóa trạng thái AFK', category: 'afk', usage: '/afk-remove' },
      { name: 'afk-list', description: 'Xem danh sách người AFK', category: 'afk', usage: '/afk-list' },
      
      // AI Module (3)
      { name: 'ai', description: 'Chat với AI', category: 'ai', usage: '/ai <message>' },
      { name: 'ai-memory', description: 'Quản lý bộ nhớ AI', category: 'ai', usage: '/ai-memory' },
      { name: 'ai-models', description: 'Xem danh sách AI models', category: 'ai', usage: '/ai-models' },
      
      // Autoresponder Module (6)
      { name: 'autoresponder-add', description: 'Thêm auto response', category: 'autoresponder', usage: '/autoresponder-add' },
      { name: 'autoresponder-remove', description: 'Xóa auto response', category: 'autoresponder', usage: '/autoresponder-remove' },
      { name: 'autoresponder-list', description: 'Xem danh sách auto responses', category: 'autoresponder', usage: '/autoresponder-list' },
      { name: 'autoresponder-view', description: 'Xem chi tiết auto response', category: 'autoresponder', usage: '/autoresponder-view' },
      { name: 'autoresponder-matchmode', description: 'Đổi chế độ match', category: 'autoresponder', usage: '/autoresponder-matchmode' },
      { name: 'autoresponder-placeholders', description: 'Xem placeholders', category: 'autoresponder', usage: '/autoresponder-placeholders' },
      
      // Custom Role Module (7)
      { name: 'customrole-admin-enable', description: 'Bật custom role', category: 'customrole', usage: '/customrole-admin-enable' },
      { name: 'customrole-admin-disable', description: 'Tắt custom role', category: 'customrole', usage: '/customrole-admin-disable' },
      { name: 'customrole-admin-color-palette', description: 'Thiết lập bảng màu', category: 'customrole', usage: '/customrole-admin-color-palette' },
      { name: 'customrole-admin-create', description: 'Tạo custom role', category: 'customrole', usage: '/customrole-admin-create' },
      { name: 'customrole-admin-manage', description: 'Quản lý custom roles', category: 'customrole', usage: '/customrole-admin-manage' },
      { name: 'customrole-admin-migrate', description: 'Di chuyển custom roles', category: 'customrole', usage: '/customrole-admin-migrate' },
      { name: 'customrole-admin-terminate', description: 'Xóa custom role system', category: 'customrole', usage: '/customrole-admin-terminate' },
      
      // Donation Module (7)
      { name: 'donation-enable', description: 'Bật donation tracking', category: 'donation', usage: '/donation-enable' },
      { name: 'donation-disable', description: 'Tắt donation tracking', category: 'donation', usage: '/donation-disable' },
      { name: 'donation-add', description: 'Thêm donation', category: 'donation', usage: '/donation-add' },
      { name: 'donation-subtract', description: 'Trừ donation', category: 'donation', usage: '/donation-subtract' },
      { name: 'donation-leaderboard', description: 'Xem bảng xếp hạng', category: 'donation', usage: '/donation-leaderboard' },
      { name: 'donation-stats', description: 'Xem thống kê donation', category: 'donation', usage: '/donation-stats' },
      { name: 'donation-config', description: 'Cấu hình donation', category: 'donation', usage: '/donation-config' },
      
      // Games Module (1)
      { name: 'gtn-start', description: 'Chơi Guess The Number', category: 'games', usage: '/gtn-start' },
      
      // Giveaway Module (1)
      { name: 'giveaway-migrate', description: 'Di chuyển giveaway data', category: 'giveaway', usage: '/giveaway-migrate' },
      
      // Minecraft Module (2)
      { name: 'minecraft-server', description: 'Xem thông tin Minecraft server', category: 'minecraft', usage: '/minecraft-server <address>' },
      { name: 'minecraft-custom-server-banner', description: 'Tạo banner Minecraft server', category: 'minecraft', usage: '/minecraft-custom-server-banner' },
      
      // Moderation Module (6)
      { name: 'moderation-kick', description: 'Kick thành viên', category: 'moderation', usage: '/moderation-kick <user> [reason]' },
      { name: 'moderation-ban', description: 'Ban thành viên', category: 'moderation', usage: '/moderation-ban <user> [reason]' },
      { name: 'moderation-timeout', description: 'Timeout thành viên', category: 'moderation', usage: '/moderation-timeout <user> <duration>' },
      { name: 'moderation-clear', description: 'Xóa tin nhắn', category: 'moderation', usage: '/moderation-clear <amount>' },
      { name: 'moderation-lock', description: 'Khóa kênh', category: 'moderation', usage: '/moderation-lock' },
      { name: 'moderation-unlock', description: 'Mở khóa kênh', category: 'moderation', usage: '/moderation-unlock' },
      
      // Quick Report Module (7)
      { name: 'Report Message', description: 'Report tin nhắn (Context Menu)', category: 'report', usage: 'Right-click message' },
      { name: 'quickreport-enable', description: 'Bật quick report', category: 'report', usage: '/quickreport-enable' },
      { name: 'quickreport-disable', description: 'Tắt quick report', category: 'report', usage: '/quickreport-disable' },
      { name: 'quickreport-config', description: 'Cấu hình report', category: 'report', usage: '/quickreport-config' },
      { name: 'quickreport-update', description: 'Cập nhật report config', category: 'report', usage: '/quickreport-update' },
      { name: 'quickreport-recent', description: 'Xem reports gần đây', category: 'report', usage: '/quickreport-recent' },
      { name: 'quickreport-check', description: 'Kiểm tra report', category: 'report', usage: '/quickreport-check' },
      
      // Server Generator Module (1)
      { name: 'generator', description: 'Tạo server structure với AI', category: 'generator', usage: '/generator' },
      
      // Snipe Module (2)
      { name: 'snipe', description: 'Xem tin nhắn vừa bị xóa', category: 'snipe', usage: '/snipe' },
      { name: 'editsnipe', description: 'Xem tin nhắn vừa bị edit', category: 'snipe', usage: '/editsnipe' },
      
      // Social Module (7)
      { name: 'kiss', description: 'Hôn ai đó', category: 'social', usage: '/kiss <user>' },
      { name: 'hug', description: 'Ôm ai đó', category: 'social', usage: '/hug <user>' },
      { name: 'slap', description: 'Tát ai đó', category: 'social', usage: '/slap <user>' },
      { name: 'bite', description: 'Cắn ai đó', category: 'social', usage: '/bite <user>' },
      { name: 'pat', description: 'Vỗ đầu ai đó', category: 'social', usage: '/pat <user>' },
      { name: 'punch', description: 'Đấm ai đó', category: 'social', usage: '/punch <user>' },
      { name: 'handhold', description: 'Nắm tay ai đó', category: 'social', usage: '/handhold <user>' },
      
      // Sticky Messages Module (7)
      { name: 'sticky-message', description: 'Tạo sticky message', category: 'sticky', usage: '/sticky-message' },
      { name: 'sticky-remove', description: 'Xóa sticky message', category: 'sticky', usage: '/sticky-remove' },
      { name: 'sticky-mode', description: 'Đổi chế độ sticky', category: 'sticky', usage: '/sticky-mode' },
      { name: 'sticky-threshold', description: 'Đặt threshold', category: 'sticky', usage: '/sticky-threshold' },
      { name: 'sticky-delay', description: 'Đặt delay', category: 'sticky', usage: '/sticky-delay' },
      { name: 'sticky-config', description: 'Xem cấu hình sticky', category: 'sticky', usage: '/sticky-config' },
      { name: 'sticky-list', description: 'Xem danh sách sticky messages', category: 'sticky', usage: '/sticky-list' },
      
      // Ticket Module (5)
      { name: 'ticket-setup', description: 'Thiết lập ticket system', category: 'ticket', usage: '/ticket-setup' },
      { name: 'ticket-close', description: 'Đóng ticket', category: 'ticket', usage: '/ticket-close' },
      { name: 'ticket-add', description: 'Thêm người vào ticket', category: 'ticket', usage: '/ticket-add <user>' },
      { name: 'ticket-remove', description: 'Xóa người khỏi ticket', category: 'ticket', usage: '/ticket-remove <user>' },
      { name: 'ticket-stats', description: 'Xem thống kê ticket', category: 'ticket', usage: '/ticket-stats' },
      
      // Utility Module (9)
      { name: 'poll', description: 'Tạo poll', category: 'utility', usage: '/poll' },
      { name: 'calc', description: 'Máy tính', category: 'utility', usage: '/calc <expression>' },
      { name: 'random', description: 'Số ngẫu nhiên', category: 'utility', usage: '/random <min> <max>' },
      { name: 'choose', description: 'Chọn ngẫu nhiên', category: 'utility', usage: '/choose <options>' },
      { name: 'help', description: 'Xem danh sách lệnh', category: 'utility', usage: '/help' },
      { name: 'information', description: 'Thông tin bot', category: 'utility', usage: '/information' },
      { name: 'rule', description: 'Xem rules', category: 'utility', usage: '/rule' },
      { name: 'rule-setup', description: 'Thiết lập rules channel', category: 'utility', usage: '/rule-setup' },
      { name: 'test-emoji', description: 'Test animated emoji', category: 'utility', usage: '/test-emoji' },
    ]
  }

  const categories = [
    { id: 'all', name: 'All Commands', icon: Info },
    { id: 'ai', name: 'AI', icon: Zap },
    { id: 'afk', name: 'AFK', icon: Info },
    { id: 'autoresponder', name: 'Auto Responder', icon: Zap },
    { id: 'customrole', name: 'Custom Roles', icon: Info },
    { id: 'donation', name: 'Donations', icon: DollarSign },
    { id: 'games', name: 'Games', icon: Laugh },
    { id: 'giveaway', name: 'Giveaway', icon: DollarSign },
    { id: 'minecraft', name: 'Minecraft', icon: Laugh },
    { id: 'moderation', name: 'Moderation', icon: Shield },
    { id: 'report', name: 'Reports', icon: Shield },
    { id: 'generator', name: 'Generator', icon: Zap },
    { id: 'snipe', name: 'Snipe', icon: Info },
    { id: 'social', name: 'Social', icon: Laugh },
    { id: 'sticky', name: 'Sticky Messages', icon: Info },
    { id: 'ticket', name: 'Tickets', icon: Shield },
    { id: 'utility', name: 'Utility', icon: Zap },
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

  // Check permissions
  if (!canExecuteCommands) {
    return <PermissionDenied message="Chỉ Admin mới có quyền xem và thực thi commands." />
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
