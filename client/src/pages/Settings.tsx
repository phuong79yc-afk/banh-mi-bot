import { useState, useEffect } from 'react'
import { Palette, Bell, Shield, Database, Globe, Users, Music, Coins, Search, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useTheme, type AccentColor } from '../contexts/ThemeContext'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

interface User {
  userId: string
  username: string
  balance: number
  level: number
  xp: number
  lastDaily: string
}

interface LyricEntry {
  id: string
  query: string
  lyrics: string
  createdAt: string
}

export default function Settings() {
  const { accentColor, setAccentColor, darkMode, toggleDarkMode, colors } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    serverAlerts: true,
    errorReports: true,
    commandUsage: false,
    musicUpdates: true,
    maintenance: true,
    emailNotifications: false
  })
  
  // Music settings
  const [defaultVolume, setDefaultVolume] = useState(50)
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('high')
  const [musicPreferences, setMusicPreferences] = useState({
    autoplay: true,
    saveQueue: true,
    crossfade: false,
    equalizer: 'off' as 'off' | 'bass' | 'treble' | 'vocal'
  })
  
  // Data Management states
  const [dataTab, setDataTab] = useState<'users' | 'lyrics'>('users')
  const [dataExpanded, setDataExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // Security states
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showActiveSessions, setShowActiveSessions] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  
  // Users data
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<User>>({})

  // Lyrics data
  const [lyrics, setLyrics] = useState<LyricEntry[]>([])
  const [showAddLyric, setShowAddLyric] = useState(false)
  const [newLyric, setNewLyric] = useState({ query: '', lyrics: '' })

  useEffect(() => {
    setMounted(true)
    
    // Load saved music preferences from localStorage
    const savedVolume = localStorage.getItem('musicVolume')
    const savedQuality = localStorage.getItem('audioQuality')
    const savedPreferences = localStorage.getItem('musicPreferences')
    const savedNotifications = localStorage.getItem('notificationSettings')
    
    if (savedVolume) setDefaultVolume(Number(savedVolume))
    if (savedQuality) setAudioQuality(savedQuality as 'high' | 'medium' | 'low')
    if (savedPreferences) setMusicPreferences(JSON.parse(savedPreferences))
    if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications))
  }, [])

  useEffect(() => {
    if (dataExpanded) {
      fetchData()
    }
  }, [dataTab, dataExpanded])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (dataTab === 'users') {
        const response = await axios.get('/api/data/users')
        setUsers(response.data)
      } else if (dataTab === 'lyrics') {
        const response = await axios.get('/api/data/lyrics')
        setLyrics(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showNotification('error', 'Failed to load data')
    }
    setLoading(false)
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user.userId)
    setEditForm(user)
  }

  const handleSaveUser = async () => {
    try {
      await axios.put(`/api/data/users/${editingUser}`, editForm)
      showNotification('success', 'User updated successfully')
      setEditingUser(null)
      fetchData()
    } catch (error) {
      showNotification('error', 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await axios.delete(`/api/data/users/${userId}`)
      showNotification('success', 'User deleted successfully')
      fetchData()
    } catch (error) {
      showNotification('error', 'Failed to delete user')
    }
  }

  const handleAddLyric = async () => {
    if (!newLyric.query || !newLyric.lyrics) {
      showNotification('error', 'Please fill all fields')
      return
    }
    try {
      await axios.post('/api/data/lyrics', newLyric)
      showNotification('success', 'Lyric added successfully')
      setShowAddLyric(false)
      setNewLyric({ query: '', lyrics: '' })
      fetchData()
    } catch (error) {
      showNotification('error', 'Failed to add lyric')
    }
  }

  const handleDeleteLyric = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lyric?')) return
    try {
      await axios.delete(`/api/data/lyrics/${id}`)
      showNotification('success', 'Lyric deleted successfully')
      fetchData()
    } catch (error) {
      showNotification('error', 'Failed to delete lyric')
    }
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userId.includes(searchQuery)
  )

  const filteredLyrics = lyrics.filter(lyric =>
    lyric.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      showNotification('error', 'Please fill all fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      showNotification('error', 'New passwords do not match')
      return
    }
    if (passwordForm.new.length < 6) {
      showNotification('error', 'Password must be at least 6 characters')
      return
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    showNotification('success', 'Password changed successfully')
    setShowChangePassword(false)
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  const handleEnable2FA = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setTwoFactorEnabled(!twoFactorEnabled)
    showNotification('success', twoFactorEnabled ? '2FA disabled' : '2FA enabled successfully')
    setShow2FA(false)
  }

  const activeSessions = [
    { id: '1', device: 'Windows - Chrome', location: 'Hanoi, Vietnam', ip: '192.168.1.1', lastActive: '2 minutes ago', current: true },
    { id: '2', device: 'iPhone 15 - Safari', location: 'Ho Chi Minh, Vietnam', ip: '192.168.1.5', lastActive: '1 hour ago', current: false },
    { id: '3', device: 'MacBook - Firefox', location: 'Da Nang, Vietnam', ip: '192.168.1.10', lastActive: '3 hours ago', current: false },
  ]

  const handleRevokeSession = (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return
    showNotification('success', 'Session revoked successfully')
  }

  const handleVolumeChange = (value: number) => {
    setDefaultVolume(value)
    localStorage.setItem('musicVolume', value.toString())
    showNotification('success', `Default volume set to ${value}%`)
  }

  const handleQualityChange = (quality: 'high' | 'medium' | 'low') => {
    setAudioQuality(quality)
    localStorage.setItem('audioQuality', quality)
    showNotification('success', `Audio quality set to ${quality}`)
  }

  const handleMusicPreferenceChange = (key: keyof typeof musicPreferences, value: any) => {
    const newPreferences = { ...musicPreferences, [key]: value }
    setMusicPreferences(newPreferences)
    localStorage.setItem('musicPreferences', JSON.stringify(newPreferences))
    showNotification('success', 'Music preferences updated')
  }

  const qualityOptions = [
    { value: 'high', label: 'High (320kbps)', description: 'Best quality, more data' },
    { value: 'medium', label: 'Medium (192kbps)', description: 'Balanced quality' },
    { value: 'low', label: 'Low (128kbps)', description: 'Lower quality, less data' },
  ]

  const equalizerOptions = [
    { value: 'off', label: 'Off', icon: '─' },
    { value: 'bass', label: 'Bass Boost', icon: '🔊' },
    { value: 'treble', label: 'Treble Boost', icon: '🎵' },
    { value: 'vocal', label: 'Vocal Enhance', icon: '🎤' },
  ]

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] }
    setNotificationSettings(newSettings)
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings))
    showNotification('success', 'Notification preferences updated')
    
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
      label: 'Push Notifications', 
      description: 'Receive browser notifications for bot events',
      icon: '🔔'
    },
    { 
      key: 'serverAlerts' as keyof typeof notificationSettings, 
      label: 'Server Alerts', 
      description: 'Get notified when bot joins/leaves servers',
      icon: '🌐'
    },
    { 
      key: 'errorReports' as keyof typeof notificationSettings, 
      label: 'Error Reports', 
      description: 'Receive alerts for bot errors and crashes',
      icon: '⚠️'
    },
    { 
      key: 'commandUsage' as keyof typeof notificationSettings, 
      label: 'Command Usage', 
      description: 'Notifications when commands are used',
      icon: '⚡'
    },
    { 
      key: 'musicUpdates' as keyof typeof notificationSettings, 
      label: 'Music Updates', 
      description: 'Now playing and queue notifications',
      icon: '🎵'
    },
    { 
      key: 'maintenance' as keyof typeof notificationSettings, 
      label: 'Maintenance Alerts', 
      description: 'Updates about bot maintenance and downtime',
      icon: '🔧'
    },
    { 
      key: 'emailNotifications' as keyof typeof notificationSettings, 
      label: 'Email Notifications', 
      description: 'Receive notifications via email',
      icon: '📧'
    },
  ]

  const accentColors = [
    { name: 'Caramel', color: 'bg-[#8B5A3C]', value: 'caramel' as AccentColor },
    { name: 'Slate', color: 'bg-slate-500', value: 'slate' as AccentColor },
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
  ]

  const changeAccentColor = (colorValue: AccentColor) => {
    setAccentColor(colorValue)
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
          from { opacity: 0; transform: translate3d(0, 20px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale3d(0.95, 0.95, 1); }
          to { opacity: 1; transform: scale3d(1, 1, 1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translate3d(-10px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
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
          className="fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg animate-slide-in flex items-center gap-3"
          style={{
            backgroundColor: notification.type === 'success' 
              ? (darkMode ? '#065f4620' : '#d1fae5')
              : (darkMode ? '#7f1d1d20' : '#fef2f2'),
            border: `2px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`
          }}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span style={{ color: colors.text }}>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={`relative z-10 ${mounted ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`} style={{ color: colors.text }}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1" style={{ color: colors.textSecondary }}>
          Tùy chỉnh dashboard và bot preferences
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
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Appearance</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: colors.text }}>Dark Mode</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Toggle between light and dark theme
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
            <p className="font-medium mb-3" style={{ color: colors.text }}>Accent Color</p>
            <div className="grid grid-cols-5 gap-3">
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
              Selected: <span className="font-semibold capitalize">{accentColor}</span>
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
              <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Notifications</h2>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <span>
                {Object.values(notificationSettings).filter(Boolean).length} / {Object.keys(notificationSettings).length} enabled
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
                showNotification('success', 'All notifications enabled')
              }}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: `${colors.primary}20`,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                transform: 'translateZ(0)'
              }}
            >
              Enable All
            </button>
            <button
              onClick={() => {
                const allDisabled = Object.keys(notificationSettings).reduce((acc, key) => ({
                  ...acc,
                  [key]: false
                }), {} as typeof notificationSettings)
                setNotificationSettings(allDisabled)
                localStorage.setItem('notificationSettings', JSON.stringify(allDisabled))
                showNotification('success', 'All notifications disabled')
              }}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: colors.background,
                color: colors.textSecondary,
                border: `2px solid ${colors.border}`,
                transform: 'translateZ(0)'
              }}
            >
              Disable All
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
              📱 <strong>Browser Permissions:</strong> Make sure to allow notifications in your browser settings 
              to receive push notifications.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Music Settings */}
      <GlassCard 
        variant="default"
        className={`hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-4' : 'opacity-0'}`}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5" style={{ color: colors.primary }} />
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Music Settings</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Auto-play Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: colors.text }}>Auto-play</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Automatically play recommended songs when queue ends
              </p>
            </div>
            <button
              onClick={() => handleMusicPreferenceChange('autoplay', !musicPreferences.autoplay)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300"
              style={{ backgroundColor: musicPreferences.autoplay ? colors.primary : `${colors.primary}40` }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300"
                style={{ transform: musicPreferences.autoplay ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
              />
            </button>
          </div>

          {/* Save Queue Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: colors.text }}>Save Queue</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Remember queue between sessions
              </p>
            </div>
            <button
              onClick={() => handleMusicPreferenceChange('saveQueue', !musicPreferences.saveQueue)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300"
              style={{ backgroundColor: musicPreferences.saveQueue ? colors.primary : `${colors.primary}40` }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300"
                style={{ transform: musicPreferences.saveQueue ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
              />
            </button>
          </div>

          {/* Crossfade Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: colors.text }}>Crossfade</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Smooth transition between tracks (5 seconds)
              </p>
            </div>
            <button
              onClick={() => handleMusicPreferenceChange('crossfade', !musicPreferences.crossfade)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300"
              style={{ backgroundColor: musicPreferences.crossfade ? colors.primary : `${colors.primary}40` }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300"
                style={{ transform: musicPreferences.crossfade ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
              />
            </button>
          </div>

          {/* Default Volume Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block font-medium" style={{ color: colors.text }}>
                Default Volume
              </label>
              <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ 
                backgroundColor: `${colors.primary}20`,
                color: colors.primary 
              }}>
                {defaultVolume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={defaultVolume}
              onChange={(e) => setDefaultVolume(Number(e.target.value))}
              onMouseUp={(e) => handleVolumeChange(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => handleVolumeChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ 
                accentColor: colors.primary,
                background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${defaultVolume}%, ${colors.border} ${defaultVolume}%, ${colors.border} 100%)`
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: colors.textSecondary }}>
              <span>🔇 Mute</span>
              <span>🔊 Max</span>
            </div>
          </div>

          {/* Audio Quality Selector */}
          <div>
            <label className="block font-medium mb-3" style={{ color: colors.text }}>
              Audio Quality
            </label>
            <div className="space-y-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQualityChange(option.value as 'high' | 'medium' | 'low')}
                  className="w-full p-4 rounded-lg transition-all duration-300 text-left hover:scale-[1.02]"
                  style={{
                    border: `2px solid ${audioQuality === option.value ? colors.primary : colors.border}`,
                    backgroundColor: audioQuality === option.value ? `${colors.primary}15` : colors.background,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: colors.text }}>{option.label}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{option.description}</p>
                    </div>
                    {audioQuality === option.value && (
                      <div 
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Equalizer Presets */}
          <div>
            <label className="block font-medium mb-3" style={{ color: colors.text }}>
              Equalizer Preset
            </label>
            <div className="grid grid-cols-2 gap-3">
              {equalizerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleMusicPreferenceChange('equalizer', option.value)}
                  className="p-4 rounded-lg transition-all duration-300 hover:scale-105"
                  style={{
                    border: `2px solid ${musicPreferences.equalizer === option.value ? colors.primary : colors.border}`,
                    backgroundColor: musicPreferences.equalizer === option.value ? `${colors.primary}15` : colors.background,
                  }}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <p className="text-sm font-medium" style={{ 
                    color: musicPreferences.equalizer === option.value ? colors.primary : colors.text 
                  }}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.primary}10`,
              border: `2px solid ${colors.primary}30`
            }}
          >
            <p className="text-sm" style={{ color: colors.text }}>
              💡 <strong>Tip:</strong> These settings will be applied to all music playback. 
              Changes are saved automatically and synced across your devices.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Security */}
      <GlassCard 
        variant="default"
        className={`hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-5' : 'opacity-0'}`}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" style={{ color: colors.primary }} />
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Security</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <button 
            onClick={() => setShowChangePassword(true)}
            className="w-full px-4 py-3 rounded-lg transition-all text-left hover:opacity-80 flex items-center justify-between"
            style={{ 
              border: `2px solid ${colors.border}`,
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
          >
            <span>Change Password</span>
            <span className="text-sm" style={{ color: colors.textSecondary }}>▶</span>
          </button>
          <button 
            onClick={() => setShow2FA(true)}
            className="w-full px-4 py-3 rounded-lg transition-all text-left hover:opacity-80 flex items-center justify-between"
            style={{ 
              border: `2px solid ${colors.border}`,
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
          >
            <div>
              <div>Two-Factor Authentication</div>
              <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {twoFactorEnabled ? '✓ Enabled' : 'Not enabled'}
              </div>
            </div>
            <span className="text-sm" style={{ color: colors.textSecondary }}>▶</span>
          </button>
          <button 
            onClick={() => setShowActiveSessions(true)}
            className="w-full px-4 py-3 rounded-lg transition-all text-left hover:opacity-80 flex items-center justify-between"
            style={{ 
              border: `2px solid ${colors.border}`,
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
          >
            <div>
              <div>View Active Sessions</div>
              <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {activeSessions.length} active devices
              </div>
            </div>
            <span className="text-sm" style={{ color: colors.textSecondary }}>▶</span>
          </button>
        </div>
      </GlassCard>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowChangePassword(false)}
        >
          <div 
            className="rounded-xl p-6 max-w-md w-full animate-scale-in"
            style={{
              backgroundColor: colors.surface,
              border: `2px solid ${colors.border}`,
              animationDuration: '0.4s'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: colors.text }}>Change Password</h3>
              <button 
                onClick={() => setShowChangePassword(false)}
                className="p-2 rounded-lg hover:bg-opacity-50"
                style={{ color: colors.textSecondary }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
                  style={{ backgroundColor: colors.border, color: colors.textSecondary }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {show2FA && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShow2FA(false)}
        >
          <div 
            className="rounded-xl p-6 max-w-md w-full animate-scale-in"
            style={{
              backgroundColor: colors.surface,
              border: `2px solid ${colors.border}`,
              animationDuration: '0.4s'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: colors.text }}>Two-Factor Authentication</h3>
              <button 
                onClick={() => setShow2FA(false)}
                className="p-2 rounded-lg hover:bg-opacity-50"
                style={{ color: colors.textSecondary }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: twoFactorEnabled ? '#10b98120' : `${colors.primary}10`,
                  border: `2px solid ${twoFactorEnabled ? '#10b981' : colors.border}`
                }}
              >
                <p className="text-sm" style={{ color: colors.text }}>
                  {twoFactorEnabled 
                    ? '✓ Two-factor authentication is currently enabled. Your account is protected with an extra layer of security.'
                    : 'Enable two-factor authentication to add an extra layer of security to your account. You will need to enter a code from your authenticator app when logging in.'}
                </p>
              </div>

              {!twoFactorEnabled && (
                <div className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
                  <p className="font-medium" style={{ color: colors.text }}>How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Download an authenticator app (Google Authenticator, Authy)</li>
                    <li>Scan the QR code with your app</li>
                    <li>Enter the 6-digit code to verify</li>
                  </ol>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEnable2FA}
                  className="flex-1 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: twoFactorEnabled ? '#ef4444' : colors.primary, 
                    color: 'white' 
                  }}
                >
                  {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
                <button
                  onClick={() => setShow2FA(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
                  style={{ backgroundColor: colors.border, color: colors.textSecondary }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showActiveSessions && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowActiveSessions(false)}
        >
          <div 
            className="rounded-xl p-6 max-w-2xl w-full animate-scale-in"
            style={{
              backgroundColor: colors.surface,
              border: `2px solid ${colors.border}`,
              animationDuration: '0.4s'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: colors.text }}>Active Sessions</h3>
              <button 
                onClick={() => setShowActiveSessions(false)}
                className="p-2 rounded-lg hover:bg-opacity-50"
                style={{ color: colors.textSecondary }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeSessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`rounded-lg p-4 hover:scale-[1.01] transition-all duration-200 ${mounted ? 'animate-slide-in' : 'opacity-0'}`}
                  style={{
                    backgroundColor: session.current ? `${colors.primary}15` : colors.background,
                    border: `2px solid ${session.current ? colors.primary : colors.border}`,
                    animationDelay: `${index * 0.08}s`,
                    transform: 'translateZ(0)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold" style={{ color: colors.text }}>
                          {session.device}
                        </h4>
                        {session.current && (
                          <span 
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ 
                              backgroundColor: colors.primary,
                              color: 'white'
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                        <p>📍 {session.location}</p>
                        <p>🌐 {session.ip}</p>
                        <p>🕒 Last active: {session.lastActive}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105"
                        style={{ 
                          backgroundColor: '#ef444420', 
                          color: '#ef4444',
                          border: '2px solid #ef4444'
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
              <button
                onClick={() => setShowActiveSessions(false)}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div 
        className={`rounded-xl hover-lift card-shine relative z-10 ${mounted ? 'animate-scale-in stagger-6' : 'opacity-0'}`}
        style={{ 
          border: `2px solid ${colors.border}`,
          backgroundColor: colors.surface
        }}
      >
        <div 
          className="p-6 cursor-pointer"
          style={{ borderBottom: dataExpanded ? `1px solid ${colors.border}` : 'none' }}
          onClick={() => setDataExpanded(!dataExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5" style={{ color: colors.primary }} />
              <h2 className="text-xl font-semibold" style={{ color: colors.text }}>Data Management</h2>
            </div>
            <span 
              className="text-sm font-medium transition-all duration-300"
              style={{ 
                color: colors.primary,
                transform: dataExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block'
              }}
            >
              {dataExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
        
        {dataExpanded && (
          <div className="p-6 space-y-4">
            {/* Tabs */}
            <div 
              className="flex gap-2 p-2 rounded-xl"
              style={{ 
                backgroundColor: colors.background,
                border: `2px solid ${colors.border}`
              }}
            >
              <button
                onClick={() => setDataTab('users')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300"
                style={{
                  backgroundColor: dataTab === 'users' ? colors.primary : 'transparent',
                  color: dataTab === 'users' ? 'white' : colors.textSecondary,
                }}
              >
                <Users className="h-5 w-5" />
                Users
              </button>
              <button
                onClick={() => setDataTab('lyrics')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300"
                style={{
                  backgroundColor: dataTab === 'lyrics' ? colors.primary : 'transparent',
                  color: dataTab === 'lyrics' ? 'white' : colors.textSecondary,
                }}
              >
                <Music className="h-5 w-5" />
                Lyrics
              </button>
            </div>

            {/* Search & Actions */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
                  style={{ color: colors.textSecondary }}
                />
                <input
                  type="text"
                  placeholder={`Search ${dataTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-all duration-300"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
              </div>
              
              {dataTab === 'lyrics' && (
                <button
                  onClick={() => setShowAddLyric(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  <Plus className="h-5 w-5" />
                  Add
                </button>
              )}
            </div>

            {/* Users Table */}
            {dataTab === 'users' && (
              <div 
                className="rounded-xl overflow-hidden"
                style={{ 
                  backgroundColor: colors.background,
                  border: `2px solid ${colors.border}`
                }}
              >
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                        <th className="text-left p-3 font-semibold text-sm" style={{ color: colors.text }}>Username</th>
                        <th className="text-left p-3 font-semibold text-sm" style={{ color: colors.text }}>Balance</th>
                        <th className="text-left p-3 font-semibold text-sm" style={{ color: colors.text }}>Level</th>
                        <th className="text-right p-3 font-semibold text-sm" style={{ color: colors.text }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center p-8">
                            <div 
                              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                              style={{ borderColor: colors.primary }}
                            />
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center p-8" style={{ color: colors.textSecondary }}>
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <tr 
                            key={user.userId}
                            style={{ 
                              borderBottom: index < filteredUsers.length - 1 ? `1px solid ${colors.border}` : 'none'
                            }}
                          >
                            {editingUser === user.userId ? (
                              <>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={editForm.username || ''}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="px-2 py-1 rounded border text-sm w-full"
                                    style={{ 
                                      backgroundColor: colors.surface,
                                      borderColor: colors.border,
                                      color: colors.text
                                    }}
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    value={editForm.balance || 0}
                                    onChange={(e) => setEditForm({ ...editForm, balance: Number(e.target.value) })}
                                    className="px-2 py-1 rounded border text-sm w-20"
                                    style={{ 
                                      backgroundColor: colors.surface,
                                      borderColor: colors.border,
                                      color: colors.text
                                    }}
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    value={editForm.level || 0}
                                    onChange={(e) => setEditForm({ ...editForm, level: Number(e.target.value) })}
                                    className="px-2 py-1 rounded border text-sm w-16"
                                    style={{ 
                                      backgroundColor: colors.surface,
                                      borderColor: colors.border,
                                      color: colors.text
                                    }}
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={handleSaveUser}
                                      className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                      style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                      style={{ backgroundColor: colors.border, color: colors.textSecondary }}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-medium text-sm" style={{ color: colors.text }}>{user.username}</td>
                                <td className="p-3">
                                  <span className="font-semibold text-sm" style={{ color: colors.primary }}>
                                    {user.balance.toLocaleString()} 🪙
                                  </span>
                                </td>
                                <td className="p-3 text-sm" style={{ color: colors.text }}>Lv. {user.level}</td>
                                <td className="p-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                      style={{ backgroundColor: colors.primary + '20', color: colors.primary }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.userId)}
                                      className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                      style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lyrics List */}
            {dataTab === 'lyrics' && (
              <>
                {showAddLyric && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setShowAddLyric(false)}
                  >
                    <div 
                      className="rounded-xl p-6 max-w-2xl w-full animate-scale-in"
                      style={{
                        backgroundColor: colors.surface,
                        border: `2px solid ${colors.border}`,
                        animationDuration: '0.4s'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Add New Lyric</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            Song Query
                          </label>
                          <input
                            type="text"
                            value={newLyric.query}
                            onChange={(e) => setNewLyric({ ...newLyric, query: e.target.value })}
                            placeholder="e.g., never gonna give you up"
                            className="w-full px-4 py-2 rounded-lg outline-none"
                            style={{
                              backgroundColor: colors.background,
                              border: `2px solid ${colors.border}`,
                              color: colors.text
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            Lyrics
                          </label>
                          <textarea
                            value={newLyric.lyrics}
                            onChange={(e) => setNewLyric({ ...newLyric, lyrics: e.target.value })}
                            placeholder="Enter lyrics here..."
                            rows={10}
                            className="w-full px-4 py-2 rounded-lg outline-none resize-none"
                            style={{
                              backgroundColor: colors.background,
                              border: `2px solid ${colors.border}`,
                              color: colors.text
                            }}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleAddLyric}
                            className="flex-1 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                            style={{ backgroundColor: colors.primary, color: 'white' }}
                          >
                            Add Lyric
                          </button>
                          <button
                            onClick={() => setShowAddLyric(false)}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
                            style={{ backgroundColor: colors.border, color: colors.textSecondary }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div 
                  className="rounded-xl overflow-hidden max-h-96 overflow-y-auto"
                  style={{ 
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`
                  }}
                >
                  <div className="grid gap-3 p-3">
                    {loading ? (
                      <div className="text-center p-8">
                        <div 
                          className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                          style={{ borderColor: colors.primary }}
                        />
                      </div>
                    ) : filteredLyrics.length === 0 ? (
                      <div className="text-center p-8" style={{ color: colors.textSecondary }}>
                        No lyrics found
                      </div>
                    ) : (
                      filteredLyrics.map((lyric) => (
                        <div
                          key={lyric.id}
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: colors.surface,
                            border: `2px solid ${colors.border}`
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Music className="h-4 w-4" style={{ color: colors.primary }} />
                                <h4 className="font-semibold text-sm" style={{ color: colors.text }}>{lyric.query}</h4>
                              </div>
                              <p 
                                className="text-xs whitespace-pre-line line-clamp-2" 
                                style={{ color: colors.textSecondary }}
                              >
                                {lyric.lyrics}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteLyric(lyric.id)}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                              style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Economy Stats (only for users tab) */}
            {dataTab === 'users' && !loading && users.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div 
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`
                  }}
                >
                  <Coins className="h-6 w-6 mx-auto mb-2" style={{ color: colors.primary }} />
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Total Economy</p>
                  <p className="text-lg font-bold mt-1" style={{ color: colors.text }}>
                    {users.reduce((sum, u) => sum + u.balance, 0).toLocaleString()} 🪙
                  </p>
                </div>
                
                <div 
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`
                  }}
                >
                  <Users className="h-6 w-6 mx-auto mb-2" style={{ color: colors.secondary }} />
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Richest User</p>
                  <p className="text-sm font-bold mt-1 truncate" style={{ color: colors.text }}>
                    {users.reduce((max, u) => u.balance > max.balance ? u : max).username}
                  </p>
                </div>
                
                <div 
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`
                  }}
                >
                  <Database className="h-6 w-6 mx-auto mb-2" style={{ color: colors.accent }} />
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Avg Balance</p>
                  <p className="text-lg font-bold mt-1" style={{ color: colors.text }}>
                    {Math.round(users.reduce((sum, u) => sum + u.balance, 0) / users.length).toLocaleString()} 🪙
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


