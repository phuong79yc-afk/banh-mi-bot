import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { Play, ArrowLeft, BarChart3, Music, Terminal, Settings, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import LiquidGlass from '../components/LiquidGlass'

export default function Demo() {
  const navigate = useNavigate()
  const { colors } = useTheme()
  const [mainVideo, setMainVideo] = useState('/analytics-demo.mp4')

  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Theo dõi bot activity với charts và metrics chi tiết',
      screenshot: '/analytics-demo.mp4'
    },
    {
      icon: Music,
      title: 'Music Player',
      description: 'Phát nhạc từ YouTube với lyrics AI và queue management',
      screenshot: '/music-demo.mp4'
    },
    {
      icon: Music,
      title: 'Music Library',
      description: '200+ bài nhạc Việt & quốc tế với search như Spotify',
      screenshot: '/library-demo.mp4'
    },
    {
      icon: Terminal,
      title: '42+ Commands',
      description: 'Slash commands cho music, moderation, fun, và economy',
      screenshot: '/commands-preview.mp4'
    },
    {
      icon: Settings,
      title: 'Customizable Theme',
      description: '20 màu accent với dark/light mode',
      screenshot: '/theme-demo.mp4'
    }
  ]

  return (
    <div 
      className="min-h-screen w-full"
      style={{ 
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" style={{ zIndex: 0 }} />
      
      {/* Liquid Glass Background - Optimized */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <LiquidGlass 
          width="100%" 
          height="100%" 
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
      {/* Header */}
      <div 
        className="border-b-2 backdrop-blur-xl relative z-50"
        style={{ 
          borderColor: colors.primary,
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay Lại Trang Chủ
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/docs')}
              className="px-4 py-2 rounded font-medium text-sm border-2"
              style={{ 
                borderColor: colors.border,
                color: colors.text
              }}
            >
              Tài Liệu
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded font-medium text-sm"
              style={{ 
                backgroundColor: colors.primary,
                color: 'white'
              }}
            >
              Đăng Nhập
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10" style={{ minHeight: '200vh' }}>
        {/* Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <Play className="h-12 w-12" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>
            Demo Dashboard
          </h1>
          <p className="text-xl mb-8" style={{ color: colors.textSecondary }}>
            Xem trước các tính năng của Discord Bot Dashboard
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
            style={{ 
              backgroundColor: colors.primary,
              color: 'white'
            }}
          >
            Truy Cập Dashboard
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Main Video */}
        <div 
          className="rounded-2xl overflow-hidden mb-20 border-2 backdrop-blur-xl"
          style={{ 
            borderColor: colors.primary,
            backgroundColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <video 
            key={mainVideo}
            autoPlay 
            loop 
            muted 
            playsInline
            controls
            className="w-full"
          >
            <source src={mainVideo} type="video/mp4" />
          </video>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: colors.text }}>
            Tính Năng Chính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div 
                key={index}
                onClick={() => {
                  setMainVideo(feature.screenshot)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-xl p-6 border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                style={{ 
                  backgroundColor: mainVideo === feature.screenshot 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(255, 255, 255, 0.12)',
                  borderColor: colors.primary,
                  transform: 'translateZ(0)',
                  willChange: 'transform'
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: colors.primary }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div 
                  className="rounded-lg overflow-hidden border-2 relative group"
                  style={{ borderColor: colors.primary }}
                >
                  <video 
                    muted
                    playsInline
                    className="w-full"
                  >
                    <source src={feature.screenshot} type="video/mp4" />
                  </video>
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center"
                  >
                    <div 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold text-sm px-4 py-2 rounded-lg"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Click để xem
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div 
          className="rounded-2xl p-12 text-center border-2 backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(to bottom right, ${colors.primary}15, ${colors.secondary}15)`,
            borderColor: colors.primary,
            backgroundColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <h2 className="text-3xl font-bold mb-8" style={{ color: colors.text }}>
            Con Số Ấn Tượng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div>
              <div className="text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                42+
              </div>
              <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Bot Commands
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2" style={{ color: colors.secondary }}>
                200+
              </div>
              <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Songs Library
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2" style={{ color: colors.accent }}>
                5
              </div>
              <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Playlists
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                20
              </div>
              <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Theme Colors
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2" style={{ color: colors.secondary }}>
                99.9%
              </div>
              <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Uptime
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
            Sẵn Sàng Bắt Đầu?
          </h3>
          <p className="text-lg mb-8" style={{ color: colors.textSecondary }}>
            Đăng nhập để truy cập đầy đủ dashboard và quản lý bot của bạn
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-transform"
              style={{ 
                backgroundColor: colors.primary,
                color: 'white'
              }}
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="px-8 py-4 rounded-lg font-semibold text-lg border-2 hover:scale-105 transition-transform"
              style={{ 
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: 'transparent'
              }}
            >
              Xem Tài Liệu
            </button>
            <button
              onClick={() => navigate('/support')}
              className="px-8 py-4 rounded-lg font-semibold text-lg border-2 hover:scale-105 transition-transform"
              style={{ 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: 'transparent'
              }}
            >
              Cần Hỗ Trợ?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
