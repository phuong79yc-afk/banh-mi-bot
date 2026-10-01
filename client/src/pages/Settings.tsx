import { useState, useEffect } from 'react'
import { Palette, Bell, Shield, X, AlertCircle, CheckCircle, Volume2, VolumeX, Terminal, Power } from 'lucide-react'
import { useTheme, type AccentColor } from '../contexts/ThemeContext'
import GlassCard from '../components/GlassCard'
import PermissionDenied from '../components/PermissionDenied'
import { usePermissions } from '../hooks/usePermissions'
import api, { apiEndpoints } from '../lib/api'
import { soundManager } from '../utils/soundManager'

export default function Settings() {
  const { accentColor, setAccentColor, darkMode, toggleDarkMode, colors } = useTheme()
  const { canChangeSettings, isAdmin } = usePermissions()
  const [mounted, setMounted] = useState(false)
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    serverAlerts: true,
    errorReports: true,
    commandUsage: false,
    maintenance: true,
    emailNotifications: false
  })
  
  const [notificationSound, setNotificationSound] = useState(() => {
    return soundManager.isEnabled()
  })
  
  const [soundTheme, setSoundTheme] = useState(() => {
    return soundManager.getSoundTheme() as 'modern' | 'classic' | 'gaming' | 'minimal'
  })
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // Bot Configuration states
  const [botStatus, setBotStatus] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online')
  const [botActivity, setBotActivity] = useState({ type: 'playing', text: '🎵 Music & Fun' })
  const [defaultPrefix, setDefaultPrefix] = useState('!')
  const [showToken, setShowToken] = useState(false)
  
  // Command toggles
  const [commandStates, setCommandStates] = useState<Record<string, boolean>>({})
  const [loadingCommands, setLoadingCommands] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Load saved settings from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings')
    const savedBotConfig = localStorage.getItem('botConfiguration')
    
    if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications))
    if (savedBotConfig) {
      const config = JSON.parse(savedBotConfig)
      if (config.status) setBotStatus(config.status)
      if (config.activity) setBotActivity(config.activity)
      if (config.prefix) setDefaultPrefix(config.prefix)
    }
    
    // Load command states
    fetchCommandStates()
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchCommandStates = async () => {
    try {
      setLoadingCommands(true)
      const response = await api.get('/bot/commands/states')
      setCommandStates(response.data.commands || {})
    } catch (error) {
      console.error('Failed to fetch command states:', error)
      // Default state: all enabled
      setCommandStates({
        'music': true,
        'moderation': true,
        'utility': true,
        'fun': true,
        'economy': true,
        'customrole': true,
        'donation': true,
        'quickreport': true,
        'ticket': true,
        'giveaway': true,
      })
    } finally {
      setLoadingCommands(false)
    }
  }

  const handleCommandToggle = async (commandName: string) => {
    const newState = !commandStates[commandName]
    
    // Optimistic update
    setCommandStates(prev => ({ ...prev, [commandName]: newState }))
    
    try {
      await api.post('/bot/commands/toggle', {
        command: commandName,
        enabled: newState
      })
      
      if (notificationSound) {
        soundManager.play('success')
      }
      
      showNotification('success', `✅ ${newState ? 'Đã bật' : 'Đã tắt'} lệnh ${commandName}`)
    } catch (error) {
      // Revert on error
      setCommandStates(prev => ({ ...prev, [commandName]: !newState }))
      
      if (notificationSound) {
        soundManager.play('error')
      }
      
      showNotification('error', `❌ Không thể ${newState ? 'bật' : 'tắt'} lệnh ${commandName}`)
    }
  }

  const handleBotStatusChange = async (status: typeof botStatus) => {
    try {
      setBotStatus(status)
      const config = { status, activity: botActivity, prefix: defaultPrefix }
      localStorage.setItem('botConfiguration', JSON.stringify(config))
      
      // Call API to update bot status
      await api.post('/bot/config/status', { status })
      
      // Play success sound
      if (notificationSound) {
        soundManager.play('success')
      }
      
      // Show detailed notification
      const statusNames: Record<string, string> = {
        'online': '🟢 Trực Tuyến',
        'idle': '🟡 Nghỉ',
        'dnd': '🔴 Không Làm Phiền',
        'invisible': '⚫ Ẩn'
      }
      showNotification('success', `✅ Đã đổi trạng thái bot sang ${statusNames[status]}`)
    } catch (error) {
      if (notificationSound) {
        soundManager.play('error')
      }
      showNotification('error', '❌ Không thể cập nhật trạng thái bot')
    }
  }

  const handleActivityChange = async () => {
    try {
      const config = { status: botStatus, activity: botActivity, prefix: defaultPrefix }
      localStorage.setItem('botConfiguration', JSON.stringify(config))
      
      await api.post('/bot/config/activity', botActivity)
      
      // Play success sound
      if (notificationSound) {
        soundManager.play('success')
      }
      
      // Show detailed notification with activity info
      const activityIcons: Record<string, string> = {
        'playing': '🎮',
        'listening': '🎵',
        'watching': '📺',
        'competing': '🏆'
      }
      showNotification('success', `✅ Hoạt động bot: ${activityIcons[botActivity.type]} ${botActivity.text}`)
    } catch (error) {
      if (notificationSound) {
        soundManager.play('error')
      }
      showNotification('error', '❌ Không thể cập nhật hoạt động bot')
    }
  }

  const handlePrefixChange = async () => {
    try {
      const config = { status: botStatus, activity: botActivity, prefix: defaultPrefix }
      localStorage.setItem('botConfiguration', JSON.stringify(config))
      
      await api.post('/bot/config/prefix', { prefix: defaultPrefix })
      
      // Play success sound
      if (notificationSound) {
        soundManager.play('success')
      }
      
      showNotification('success', `✅ Prefix mới: "${defaultPrefix}" (Ví dụ: ${defaultPrefix}play)`)
    } catch (error) {
      if (notificationSound) {
        soundManager.play('error')
      }
      showNotification('error', '❌ Không thể đổi prefix')
    }
  }

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] }
    setNotificationSettings(newSettings)
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings))
    showNotification('success', 'Đã cập nhật tùy chọn thông báo')
    
    // Add bounce animation to toggle
    const element = document.querySelector(`[data-notification="${key}"]`)
    if (element) {
      element.classList.add('toggle-bounce')
      setTimeout(() => element.classList.remove('toggle-bounce'), 600)
    }
  }

  const notificationOptions = [
    { 
      key: 'pushNotifications' as keyof typeof notificationSettings, 
      label: 'Thông Báo Đẩy', 
      description: 'Nhận thông báo trình duyệt về các sự kiện của bot',
      icon: '🔔'
    },
    { 
      key: 'serverAlerts' as keyof typeof notificationSettings, 
      label: 'Cảnh Báo Máy Chủ', 
      description: 'Thông báo khi bot tham gia/rời khỏi máy chủ',
      icon: '🌐'
    },
    { 
      key: 'errorReports' as keyof typeof notificationSettings, 
      label: 'Báo Cáo Lỗi', 
      description: 'Nhận cảnh báo về lỗi và sự cố của bot',
      icon: '⚠️'
    },
    { 
      key: 'commandUsage' as keyof typeof notificationSettings, 
      label: 'Sử Dụng Lệnh', 
      description: 'Thông báo khi các lệnh được sử dụng',
      icon: '⚡'
    },
    { 
      key: 'maintenance' as keyof typeof notificationSettings, 
      label: 'Bảo Trì Hệ Thống', 
      description: 'Cập nhật về bảo trì và thời gian ngừng hoạt động',
      icon: '🔧'
    },
    { 
      key: 'emailNotifications' as keyof typeof notificationSettings, 
      label: 'Thông Báo Email', 
      description: 'Nhận thông báo qua email',
      icon: '📧'
    },
  ]

  const accentColors = [
    { name: 'Caramel', color: 'bg-[#8B5A3C]', value: 'caramel' as AccentColor },
    { name: 'Purple', color: 'bg-purple-500', value: 'purple' as AccentColor },
    { name: 'Blue', color: 'bg-blue-500', value: 'blue' as AccentColor },
    { name: 'Green', color: 'bg-green-500', value: 'green' as AccentColor },
    { name: 'Orange', color: 'bg-orange-500', value: 'orange' as AccentColor },
    { name: 'Pink', color: 'bg-pink-500', value: 'pink' as AccentColor },
    { name: 'Red', color: 'bg-red-500', value: 'red' as AccentColor },
    { name: 'Yellow', color: 'bg-yellow-500', value: 'yellow' as AccentColor },
    { name: 'Teal', color: 'bg-teal-500', value: 'teal' as AccentColor },
    { name: 'Indigo', color: 'bg-indigo-500', value: 'indigo' as AccentColor },
    { name: 'Rose', color: 'bg-rose-500', value: 'rose' as AccentColor },
    { name: 'Cyan', color: 'bg-cyan-500', value: 'cyan' as AccentColor },
    { name: 'Lime', color: 'bg-lime-500', value: 'lime' as AccentColor },
    { name: 'Amber', color: 'bg-amber-500', value: 'amber' as AccentColor },
    { name: 'Violet', color: 'bg-violet-500', value: 'violet' as AccentColor },
    { name: 'Emerald', color: 'bg-emerald-500', value: 'emerald' as AccentColor },
    { name: 'Fuchsia', color: 'bg-fuchsia-500', value: 'fuchsia' as AccentColor },
    { name: 'Sky', color: 'bg-sky-500', value: 'sky' as AccentColor },
    { name: 'Slate', color: 'bg-slate-500', value: 'slate' as AccentColor },
    { name: 'Stone', color: 'bg-stone-500', value: 'stone' as AccentColor },
    { name: 'Crimson', color: 'bg-[#DC143C]', value: 'crimson' as AccentColor },
    { name: 'Coral', color: 'bg-[#FF6B6B]', value: 'coral' as AccentColor },
    { name: 'Lavender', color: 'bg-[#B57EDC]', value: 'lavender' as AccentColor },
    { name: 'Mint', color: 'bg-[#3EB489]', value: 'mint' as AccentColor },
    { name: 'Peach', color: 'bg-[#FFAB91]', value: 'peach' as AccentColor },
    { name: 'Navy', color: 'bg-[#001F3F]', value: 'navy' as AccentColor },
    { name: 'Burgundy', color: 'bg-[#800020]', value: 'burgundy' as AccentColor },
    { name: 'Gold', color: 'bg-[#FFD700]', value: 'gold' as AccentColor },
    { name: 'Chocolate', color: 'bg-[#7B3F00]', value: 'chocolate' as AccentColor },
    { name: 'Olive', color: 'bg-[#6B8E23]', value: 'olive' as AccentColor },
  ]

  const changeAccentColor = (colorValue: AccentColor) => {
    setAccentColor(colorValue)
  }

  // Check permissions
  if (!canChangeSettings) {
    return <PermissionDenied message="Chỉ Admin mới có quyền thay đổi cài đặt hệ thống." />
  }

  return (
    <div 
      className="space-y-6 max-w-4xl relative min-h-screen"
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
          from { opacity: 0; transform: translate3d(0, 20px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale3d(0.95, 0.95, 1); }
          to { opacity: 1; transform: scale3d(1, 1, 1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translate3d(-10px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translate3d(100px, 0, 0) scale3d(0.95, 0.95, 1);
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -5px, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(139, 90, 60, 0.2); }
          50% { box-shadow: 0 0 20px rgba(139, 90, 60, 0.6); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: opacity;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, opacity;
        }
        .animate-slide-in {
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                      box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .hover-lift:hover {
          transform: translate3d(0, -4px, 0);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .hover-glow {
          transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: box-shadow;
        }
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(139, 90, 60, 0.4);
        }
        .toggle-bounce {
          animation: bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        input[type="range"] {
          will-change: transform;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
                      box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, box-shadow;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale3d(1.2, 1.2, 1);
          box-shadow: 0 0 10px rgba(139, 90, 60, 0.5);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale3d(1.1, 1.1, 1);
        }
        .card-shine {
          position: relative;
          overflow: hidden;
        }
        .card-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: left;
        }
        .card-shine:hover::before {
          left: 100%;
        }
        button, a, input, select, textarea {
          will-change: transform;
        }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        .stagger-5 { animation-delay: 0.25s; }
        .stagger-6 { animation-delay: 0.3s; }
        .stagger-7 { animation-delay: 0.35s; }
        
        /* 120fps optimization */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        @media (prefers-reduced-motion: no-preference) {
          :root {
            scroll-behavior: smooth;
          }
        }
        /* Hardware acceleration */
        .animate-fade-in-up,
        .animate-scale-in,
        .animate-slide-in,
        .hover-lift,
        .card-shine,
        button,
        input[type="range"]::-webkit-slider-thumb {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
      {/* Notification */}
      {notification && (
        <div 
          className="fixed top-4 right-4 z-50 rounded-xl p-4 shadow-2xl animate-slide-in flex items-center gap-3 min-w-[320px]"
          style={{
            backgroundColor: notification.type === 'success' 
              ? (darkMode ? '#065f4630' : '#d1fae5')
              : (darkMode ? '#7f1d1d30' : '#fee2e2'),
            border: `2px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            backdropFilter: 'blur(12px)',
            animation: 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s'
          }}
        >
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: notification.type === 'success' ? '#10b98120' : '#ef444420'
            }}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm" style={{ color: colors.text }}>
              {notification.type === 'success' ? 'Thành công' : 'Lỗi'}
            </div>
            <div className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              {notification.message}
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <X className="h-4 w-4" style={{ color: colors.textSecondary }} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={`relative z-10 ${mounted ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`} style={{ color: colors.text }}>
        <h1 className="text-3xl font-bold">Cài Đặt</h1>
        <p className="mt-1" style={{ color: colors.textSecondary }}>
          Tùy chỉnh giao diện và tính năng bot
        </p>
      </div>

      {/* Appearance */}
      <GlassCard 
        variant="default"
        className={`hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-2' : 'opacity-0'}`}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5" style={{ color: colors.primary }} />
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Giao Diện</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: colors.text }}>Chế Độ Tối</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Chuyển đổi giữa giao diện sáng và tối
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300"
              style={{ backgroundColor: darkMode ? colors.primary : `${colors.primary}40` }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300"
                style={{ transform: darkMode ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
              />
            </button>
          </div>

          {/* Accent Color */}
          <div>
            <p className="font-medium mb-3" style={{ color: colors.text }}>Màu Chủ Đạo</p>
            <div className="grid grid-cols-6 gap-3">
              {accentColors.map((color, index) => (
                <button
                  key={color.name}
                  onClick={() => changeAccentColor(color.value)}
                  className={`h-10 w-10 rounded-full ${color.color} hover:scale-110 transition-all duration-200 ring-2 ring-offset-2 shadow-lg hover-glow ${mounted ? 'animate-scale-in' : 'opacity-0'}`}
                  style={{
                    ringOffsetColor: colors.surface,
                    ringColor: accentColor === color.value ? colors.primary : 'transparent',
                    animationDelay: `${0.4 + index * 0.02}s`,
                    transform: 'translateZ(0)'
                  }}
                  title={color.name}
                >
                  {accentColor === color.value && (
                    <svg className="w-5 h-5 text-white mx-auto animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              Đã chọn: <span className="font-semibold capitalize">{accentColor}</span>
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard 
        variant="default"
        className={`hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-3' : 'opacity-0'}`}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" style={{ color: colors.primary }} />
              <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Thông Báo</h2>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <span>
                {Object.values(notificationSettings).filter(Boolean).length} / {Object.keys(notificationSettings).length} đã bật
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {notificationOptions.map((option, index) => (
            <div 
              key={option.key}
              className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:translate-x-2 hover:scale-[1.01] ${mounted ? 'animate-slide-in' : 'opacity-0'}`}
              style={{
                backgroundColor: notificationSettings[option.key] ? `${colors.primary}10` : colors.background,
                border: `2px solid ${notificationSettings[option.key] ? `${colors.primary}40` : colors.border}`,
                animationDelay: `${0.1 + index * 0.04}s`,
                transform: 'translateZ(0)'
              }}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: colors.text }}>{option.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                    {option.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange(option.key)}
                data-notification={option.key}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ml-4"
                style={{ 
                  backgroundColor: notificationSettings[option.key] ? colors.primary : `${colors.primary}40`,
                  transform: 'translateZ(0)'
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                  style={{ 
                    transform: notificationSettings[option.key] ? 'translate3d(1.5rem, 0, 0)' : 'translate3d(0.25rem, 0, 0)',
                    willChange: 'transform'
                  }}
                />
              </button>
            </div>
          ))}

          {/* Notification Sound Toggle */}
          <div 
            className={`p-4 rounded-lg transition-all duration-200 hover:translate-x-2 hover:scale-[1.01] ${mounted ? 'animate-slide-in stagger-7' : 'opacity-0'}`}
            style={{
              backgroundColor: notificationSound ? `${colors.primary}10` : colors.background,
              border: `2px solid ${notificationSound ? `${colors.primary}40` : colors.border}`,
              marginTop: '1rem',
              transform: 'translateZ(0)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                {notificationSound ? (
                  <Volume2 className="h-6 w-6 mt-0.5" style={{ color: colors.primary }} />
                ) : (
                  <VolumeX className="h-6 w-6 mt-0.5" style={{ color: colors.textSecondary }} />
                )}
                <div className="flex-1">
                  <p className="font-medium" style={{ color: colors.text }}>Âm Thanh Thông Báo</p>
                  <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                    Phát âm thanh cảnh báo khi có thông báo mới
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        soundManager.playNotificationSound('default');
                        showNotification('success', 'Đã phát âm thanh test!');
                      }}
                      className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: `${colors.primary}20`,
                        color: colors.primary,
                        border: `1px solid ${colors.primary}`
                      }}
                    >
                      🔔 Test Mặc Định
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playNotificationSound('serverAlerts');
                        showNotification('success', 'Âm thanh cảnh báo máy chủ!');
                      }}
                      className="text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: `${colors.primary}20`,
                        color: colors.primary,
                        border: `1px solid ${colors.primary}`
                      }}
                    >
                      🌐 Cảnh Báo Máy Chủ
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const newState = !notificationSound;
                  setNotificationSound(newState);
                  soundManager.setEnabled(newState);
                  if (newState) {
                    soundManager.playSuccess();
                    showNotification('success', 'Đã bật âm thanh thông báo');
                  } else {
                    showNotification('success', 'Đã tắt âm thanh thông báo');
                  }
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ml-4"
                style={{ 
                  backgroundColor: notificationSound ? colors.primary : `${colors.primary}40`,
                  transform: 'translateZ(0)'
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                  style={{ 
                    transform: notificationSound ? 'translate3d(1.5rem, 0, 0)' : 'translate3d(0.25rem, 0, 0)',
                    willChange: 'transform'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Sound Theme Selector */}
          {notificationSound && (
            <div 
              className="p-4 rounded-lg animate-slide-in"
              style={{
                backgroundColor: `${colors.primary}05`,
                border: `2px solid ${colors.border}`,
                marginTop: '1rem'
              }}
            >
              <p className="font-medium mb-3" style={{ color: colors.text }}>🎨 Chủ Đề Âm Thanh</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'modern', label: 'Hiện Đại', icon: '✨', desc: 'Hòa âm & giai điệu hài hòa' },
                  { value: 'gaming', label: 'Game', icon: '🎮', desc: 'Power-up & thành tích' },
                  { value: 'classic', label: 'Cổ Điển', icon: '🔔', desc: 'Tiếng bíp đơn giản sạch' },
                  { value: 'minimal', label: 'Tối Giản', icon: '⚡', desc: 'Âm thanh nhẹ nhàng' }
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => {
                      setSoundTheme(theme.value as any);
                      soundManager.setSoundTheme(theme.value as any);
                      soundManager.playNotificationSound('default');
                      showNotification('success', `Đã chọn chủ đề ${theme.label}`);
                    }}
                    className="p-3 rounded-lg transition-all duration-200 hover:scale-105 text-left"
                    style={{
                      backgroundColor: soundTheme === theme.value ? `${colors.primary}20` : colors.background,
                      border: `2px solid ${soundTheme === theme.value ? colors.primary : colors.border}`,
                      transform: 'translateZ(0)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{theme.icon}</span>
                      <span className="font-semibold" style={{ color: colors.text }}>
                        {theme.label}
                      </span>
                      {soundTheme === theme.value && (
                        <span className="ml-auto">✓</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {theme.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <button
              onClick={() => {
                const allEnabled = Object.keys(notificationSettings).reduce((acc, key) => ({
                  ...acc,
                  [key]: true
                }), {} as typeof notificationSettings)
                setNotificationSettings(allEnabled)
                localStorage.setItem('notificationSettings', JSON.stringify(allEnabled))
                showNotification('success', 'Đã bật tất cả thông báo')
              }}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: `${colors.primary}20`,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                transform: 'translateZ(0)'
              }}
            >
              Bật Tất Cả
            </button>
            <button
              onClick={() => {
                const allDisabled = Object.keys(notificationSettings).reduce((acc, key) => ({
                  ...acc,
                  [key]: false
                }), {} as typeof notificationSettings)
                setNotificationSettings(allDisabled)
                localStorage.setItem('notificationSettings', JSON.stringify(allDisabled))
                showNotification('success', 'Đã tắt tất cả thông báo')
              }}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: colors.background,
                color: colors.textSecondary,
                border: `2px solid ${colors.border}`,
                transform: 'translateZ(0)'
              }}
            >
              Tắt Tất Cả
            </button>
          </div>

          {/* Info Box */}
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: darkMode ? '#3b82f620' : '#dbeafe',
              border: `2px solid ${darkMode ? '#3b82f640' : '#93c5fd'}`
            }}
          >
            <p className="text-sm" style={{ color: colors.text }}>
              📱 <strong>Quyền Trình Duyệt:</strong> Hãy cho phép thông báo trong cài đặt trình duyệt 
              để nhận thông báo đẩy.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Bot Configuration */}
      <GlassCard 
        variant="default"
        className={`hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-5' : 'opacity-0'}`}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" style={{ color: colors.primary }} />
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Cấu Hình Bot</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Bot Status */}
          <div>
            <p className="font-medium mb-3" style={{ color: colors.text }}>Trạng Thái Bot</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: 'online', label: 'Online', icon: '🟢', color: '#10b981' },
                { value: 'idle', label: 'Idle', icon: '🟡', color: '#f59e0b' },
                { value: 'dnd', label: 'DND', icon: '🔴', color: '#ef4444' },
                { value: 'invisible', label: 'Ẩn', icon: '⚫', color: '#6b7280' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleBotStatusChange(status.value as any)}
                  className="p-3 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: botStatus === status.value ? `${status.color}20` : colors.background,
                    border: `2px solid ${botStatus === status.value ? status.color : colors.border}`,
                  }}
                >
                  <div className="text-2xl mb-1">{status.icon}</div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>
                    {status.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bot Activity */}
          <div>
            <p className="font-medium mb-3" style={{ color: colors.text }}>Hoạt Động Hiển Thị</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={botActivity.type}
                  onChange={(e) => setBotActivity({ ...botActivity, type: e.target.value })}
                  className="px-4 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <option value="playing">🎮 Playing</option>
                  <option value="listening">🎵 Listening</option>
                  <option value="watching">👀 Watching</option>
                  <option value="competing">🏆 Competing</option>
                </select>
                <input
                  type="text"
                  value={botActivity.text}
                  onChange={(e) => setBotActivity({ ...botActivity, text: e.target.value })}
                  placeholder="Văn bản hoạt động..."
                  className="flex-1 px-4 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
              </div>
              <button
                onClick={handleActivityChange}
                className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Cập Nhật Hoạt Động
              </button>
            </div>
          </div>

          {/* Default Prefix */}
          <div>
            <p className="font-medium mb-3" style={{ color: colors.text }}>Prefix Mặc Định</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={defaultPrefix}
                onChange={(e) => setDefaultPrefix(e.target.value)}
                placeholder="!"
                maxLength={3}
                className="w-24 px-4 py-2 rounded-lg outline-none text-center text-2xl font-bold"
                style={{
                  backgroundColor: colors.background,
                  border: `2px solid ${colors.border}`,
                  color: colors.primary,
                }}
              />
              <button
                onClick={handlePrefixChange}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Lưu Prefix
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              Prefix được dùng để gọi lệnh bot (ví dụ: !play, !help)
            </p>
          </div>

          {/* Bot Token (View Only) */}
          <div>
            <p className="font-medium mb-3" style={{ color: colors.text }}>Bot Token</p>
            <div className="flex gap-3">
              <input
                type={showToken ? 'text' : 'password'}
                value="••••••••••••••••••••••••••••••••••••••••"
                readOnly
                className="flex-1 px-4 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: colors.background,
                  border: `2px solid ${colors.border}`,
                  color: colors.textSecondary,
                }}
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                  border: `2px solid ${colors.primary}`
                }}
              >
                {showToken ? '🙈 Ẩn' : '👁️ Hiện'}
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              ⚠️ Không chia sẻ token với bất kỳ ai!
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Command Management */}
      <GlassCard 
        variant="default"
        className={`hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-4' : 'opacity-0'}`}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5" style={{ color: colors.primary }} />
              <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Quản Lý Lệnh</h2>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Power className="h-4 w-4" />
              <span>
                {Object.values(commandStates).filter(Boolean).length} / {Object.keys(commandStates).length} đã bật
              </span>
            </div>
          </div>
          <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
            Bật/tắt các module lệnh của bot
          </p>
        </div>
        <div className="p-6">
          {loadingCommands ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin h-12 w-12 border-4 border-t-transparent rounded-full"
                style={{ borderColor: colors.primary }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'moderation', label: 'Moderation', icon: '🛡️', description: 'Ban, kick, mute, warn' },
                { key: 'utility', label: 'Utility', icon: '🔧', description: 'Info, avatar, serverinfo' },
                { key: 'fun', label: 'Games', icon: '🎮', description: 'Mini games, fun commands' },
                { key: 'customrole', label: 'Custom Role', icon: '🎨', description: 'Tạo role tùy chỉnh' },
                { key: 'donation', label: 'Donation', icon: '💝', description: 'Quản lý donate' },
                { key: 'quickreport', label: 'Quick Report', icon: '📋', description: 'Báo cáo nhanh' },
                { key: 'ticket', label: 'Ticket', icon: '🎫', description: 'Hệ thống ticket' },
                { key: 'giveaway', label: 'Giveaway', icon: '🎁', description: 'Tổ chức giveaway' },
                { key: 'ai', label: 'AI Chat', icon: '🤖', description: 'Chat AI với Groq/Gemini' },
                { key: 'verify', label: 'Verify', icon: '✅', description: 'Xác minh thành viên' },
              ].map((command, index) => (
                <div
                  key={command.key}
                  className={`p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${mounted ? 'animate-slide-in' : 'opacity-0'}`}
                  style={{
                    backgroundColor: commandStates[command.key] ? `${colors.primary}10` : colors.background,
                    border: `2px solid ${commandStates[command.key] ? `${colors.primary}40` : colors.border}`,
                    animationDelay: `${0.1 + index * 0.03}s`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{command.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold" style={{ color: colors.text }}>
                            {command.label}
                          </p>
                          {commandStates[command.key] && (
                            <span 
                              className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                              style={{
                                backgroundColor: `${colors.primary}30`,
                                color: colors.primary
                              }}
                            >
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          {command.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCommandToggle(command.key)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ml-3 flex-shrink-0"
                      style={{ 
                        backgroundColor: commandStates[command.key] ? colors.primary : `${colors.primary}40`,
                      }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-lg"
                        style={{ 
                          transform: commandStates[command.key] ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                        }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={async () => {
                const allKeys = Object.keys(commandStates)
                const newStates: Record<string, boolean> = {}
                allKeys.forEach(key => newStates[key] = true)
                setCommandStates(newStates)
                try {
                  await api.post('/bot/commands/toggle-all', { enabled: true })
                  showNotification('success', '✅ Đã bật tất cả lệnh')
                  if (notificationSound) soundManager.play('success')
                } catch (error) {
                  fetchCommandStates() // Revert
                  showNotification('error', '❌ Không thể bật tất cả lệnh')
                  if (notificationSound) soundManager.play('error')
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              style={{
                backgroundColor: `${colors.primary}20`,
                color: colors.primary,
                border: `2px solid ${colors.primary}`
              }}
            >
              <Power className="h-4 w-4" />
              Bật Tất Cả
            </button>
            <button
              onClick={async () => {
                const allKeys = Object.keys(commandStates)
                const newStates: Record<string, boolean> = {}
                allKeys.forEach(key => newStates[key] = false)
                setCommandStates(newStates)
                try {
                  await api.post('/bot/commands/toggle-all', { enabled: false })
                  showNotification('success', '✅ Đã tắt tất cả lệnh')
                  if (notificationSound) soundManager.play('success')
                } catch (error) {
                  fetchCommandStates() // Revert
                  showNotification('error', '❌ Không thể tắt tất cả lệnh')
                  if (notificationSound) soundManager.play('error')
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '2px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <Power className="h-4 w-4" />
              Tắt Tất Cả
            </button>
          </div>
        </div>
      </GlassCard>

    </div>
  )
}
