import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Music, 
  Music2,
  BarChart3, 
  Settings, 
  Terminal,
  Menu,
  X,
  Moon,
  Sun,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import PageTransition from '../components/PageTransition'
import LiquidGlass from '../components/LiquidGlass'
import axios from 'axios'

export default function MainLayout() {
  const { colors, toggleDarkMode, darkMode } = useTheme()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [botOnline, setBotOnline] = useState(true)
  const location = useLocation()

  // Check bot status every 10 seconds
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const response = await axios.get('/api/bot/status')
        setBotOnline(response.data.status === 'online')
      } catch (error) {
        console.error('Failed to check bot status:', error)
        setBotOnline(false)
      }
    }

    checkBotStatus()
    const interval = setInterval(checkBotStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/dashboard/music', icon: Music, label: 'Music Player' },
    { path: '/dashboard/library', icon: Music2, label: 'Library' },
    { path: '/dashboard/stats', icon: BarChart3, label: 'Statistics' },
    { path: '/dashboard/commands', icon: Terminal, label: 'Commands' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
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
      
      {/* Liquid Glass Background Effect */}
      <LiquidGlass 
        width="100%" 
        height="100%" 
        position="fixed"
        top="0"
        left="0"
        transform="none"
        glassFrost={darkMode ? 0.01 : 0.005}
        glassSaturation={1.02}
        borderRadius="0"
        className="pointer-events-none"
      />
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
          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-2xl" 
              style={{ 
                background: 'linear-gradient(135deg, #6b7280, #374151)',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
            />
            <span className="font-bold text-lg" style={{ color: colors.text }}>
              Bot Dashboard
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-1 p-4 transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          {navItems.map((item) => {
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

        {/* Footer */}
        <div 
          className={cn(
            "p-4 transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )} 
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          <div 
            className="flex items-center gap-2 rounded-2xl p-3 mb-2 backdrop-blur-xl" 
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div 
              className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-white" 
              style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              {user?.username.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.text }}>
                {user?.username || 'Admin'}
              </p>
              <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                {user?.email || 'admin@bot.local'}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl transition-all backdrop-blur-xl hover:scale-105"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: colors.text
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}10`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
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
