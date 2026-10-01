import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  BarChart3, 
  Settings, 
  Terminal,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  Shield,
  Check,
  XCircle
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import PageTransition from '../components/PageTransition'
import NotificationDropdown from '../components/NotificationDropdown'
import api, { apiEndpoints } from '../lib/api'

export default function MainLayout() {
  const { colors, toggleDarkMode, darkMode } = useTheme()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [botOnline, setBotOnline] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileClosing, setProfileClosing] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Check bot status every 10 seconds
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        // Use /api/status endpoint instead of /api/bot/status
        const response = await api.get('/status')
        setBotOnline(response.data.online === true)
      } catch (error) {
        console.error('Failed to check bot status:', error)
        setBotOnline(false)
      }
    }

    checkBotStatus()
    const interval = setInterval(checkBotStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        if (profileOpen) {
          setProfileClosing(true)
          setTimeout(() => {
            setProfileOpen(false)
            setProfileClosing(false)
          }, 200) // Match animation duration
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  const handleToggleProfile = () => {
    if (profileOpen) {
      setProfileClosing(true)
      setTimeout(() => {
        setProfileOpen(false)
        setProfileClosing(false)
      }, 200) // Match animation duration
    } else {
      setProfileOpen(true)
    }
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', requireAdmin: false },
    { path: '/dashboard/stats', icon: BarChart3, label: 'Statistics', requireAdmin: false },
    { path: '/dashboard/commands', icon: Terminal, label: 'Commands', requireAdmin: true },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings', requireAdmin: true },
  ]

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.requireAdmin) return true
    return user?.role === 'admin'
  })

  // Get user permissions
  const permissions = [
    { name: 'Xem Dashboard', granted: true, icon: Home },
    { name: 'Xem Thống Kê', granted: true, icon: BarChart3 },
    { name: 'Thực Thi Lệnh', granted: user?.role === 'admin', icon: Terminal },
    { name: 'Thay Đổi Cài Đặt', granted: user?.role === 'admin', icon: Settings },
    { name: 'Quản Lý Bot', granted: user?.role === 'admin', icon: Shield },
    { name: 'Truy Cập API', granted: user?.role === 'admin', icon: Shield },
  ]

  return (
    <div 
      className="flex h-screen relative" 
      style={{ 
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out backdrop-blur-2xl",
          sidebarOpen ? "w-64" : "w-0"
        )}
        style={{ 
          backgroundColor: 'transparent',
          borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          boxShadow: 'none'
        }}
      >
        {/* Logo */}
        <div 
          className={cn(
            "flex h-16 items-center px-6 transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )} 
          style={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/banhcuon-icon-1024.gif" 
                alt="Bánh Cuốn Bot Logo" 
                className="h-10 w-10 rounded-xl transition-transform duration-300 hover:scale-110"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(255, 255, 255, 0.3))',
                  objectFit: 'cover'
                }}
              />
              {/* Glow effect */}
              <div 
                className="absolute inset-0 blur-xl opacity-40 -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)'
                }}
              />
            </div>
            <span className="font-bold text-lg" style={{ color: colors.text }}>
              Bánh Cuốn Bot
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-1 p-4 transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 backdrop-blur-xl"
                style={{
                  backgroundColor: isActive ? `${colors.primary}20` : 'transparent',
                  border: isActive ? `1px solid ${colors.primary}40` : '1px solid transparent',
                  color: isActive ? colors.text : colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = `${colors.primary}10`
                    e.currentTarget.style.border = `1px solid ${colors.primary}20`
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.color = colors.text
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.border = '1px solid transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.color = colors.textSecondary
                  }
                }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer - Enhanced Profile Section */}
        <div 
          className={cn(
            "p-4 transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )} 
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          <div className="relative" ref={profileRef}>
          {/* Profile Card - Now clickable */}
          <button
            onClick={handleToggleProfile}
            className="w-full relative rounded-2xl p-4 mb-3 backdrop-blur-xl group"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.borderColor = `${colors.primary}60`
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 8px 16px ${colors.primary}20`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Animated gradient background */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}10, transparent)`,
                pointerEvents: 'none'
              }}
            />
            
            <div className="relative flex items-center gap-3">
              {/* Avatar with glow effect */}
              <div className="relative">
                {localStorage.getItem('discord_avatar') ? (
                  <img
                    src={localStorage.getItem('discord_avatar') || ''}
                    alt={user?.username || 'User'}
                    className="h-12 w-12 rounded-2xl object-cover shadow-lg"
                    style={{ 
                      boxShadow: `0 4px 12px ${colors.primary}40`
                    }}
                  />
                ) : (
                  <div 
                    className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                      boxShadow: `0 4px 12px ${colors.primary}40`
                    }}
                  >
                    <span className="text-lg">
                      {(user?.username || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Online indicator */}
                <div 
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 flex items-center justify-center"
                  style={{ 
                    backgroundColor: '#10b981',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <span 
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: '#10b981' }}
                    />
                    <span 
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: '#10b981' }}
                    />
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold truncate" style={{ color: colors.text }}>
                    {user?.username || (user?.role === 'admin' ? 'Administrator' : 'User')}
                  </p>
                  {/* Role Badge */}
                  <div 
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ 
                      backgroundColor: user?.role === 'admin' ? `${colors.primary}30` : 'rgba(107, 114, 128, 0.3)',
                      color: user?.role === 'admin' ? colors.primary : '#9ca3af',
                      border: `1px solid ${user?.role === 'admin' ? `${colors.primary}60` : 'rgba(107, 114, 128, 0.5)'}`
                    }}
                  >
                    {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                  </div>
                </div>
                <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                  {localStorage.getItem('discord_id') 
                    ? `ID: ${localStorage.getItem('discord_id')?.substring(0, 8)}...` 
                    : (user?.role === 'admin' ? 'admin@dashboard.local' : 'user@dashboard.local')}
                </p>
              </div>
            </div>
          </button>

          {/* Permissions Dropdown */}
          {profileOpen && (
            <div 
              className={cn(
                "fixed bottom-20 left-4 w-56 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl z-[100]",
                profileClosing ? "animate-[slideUp_0.2s_ease-out]" : "animate-[slideDown_0.2s_ease-out]"
              )}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {/* Header */}
              <div 
                className="px-4 py-3 border-b"
                style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: colors.primary }} />
                  <h3 className="text-sm font-bold" style={{ color: colors.text }}>
                    Quyền Truy Cập
                  </h3>
                </div>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Role: {user?.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>

              {/* Permissions List */}
              <div className="p-2 max-h-64 overflow-y-auto">
                {permissions.map((permission, index) => {
                  const Icon = permission.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition-all"
                      style={{
                        backgroundColor: permission.granted 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <Icon 
                        className="h-4 w-4 flex-shrink-0" 
                        style={{ color: colors.textSecondary }} 
                      />
                      <span 
                        className="text-sm flex-1" 
                        style={{ color: colors.text }}
                      >
                        {permission.name}
                      </span>
                      {permission.granted ? (
                        <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#10b981' }} />
                      ) : (
                        <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div 
                className="px-4 py-2 border-t text-center"
                style={{ 
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)'
                }}
              >
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {permissions.filter(p => p.granted).length}/{permissions.length} quyền được cấp
                </p>
              </div>
            </div>
          )}
          </div>
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all backdrop-blur-xl font-semibold text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.borderColor = '#ef4444'
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("flex flex-1 flex-col transition-all duration-300", sidebarOpen ? "ml-64" : "ml-0")}>
        {/* Header */}
        <header 
          className="sticky top-0 z-40 flex h-16 items-center gap-4 px-6 backdrop-blur-2xl border-b"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: 'none'
          }}
        >
          <button
            onClick={handleToggleSidebar}
            className="rounded-2xl p-2 transition-all backdrop-blur-xl hover:scale-110"
            style={{ 
              color: colors.text,
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex-1" />

          {/* Status Indicator */}
          <div 
            className="flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-xl"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <span className="relative flex h-2 w-2">
              {botOnline && (
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: botOnline ? '#10b981' : '#ef4444' }}
                ></span>
              )}
              <span 
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: botOnline ? '#10b981' : '#ef4444' }}
              ></span>
            </span>
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              Bot {botOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Notification Dropdown */}
          <NotificationDropdown />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-2xl p-2 transition-all backdrop-blur-xl hover:scale-110"
            style={{ 
              color: colors.text,
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
