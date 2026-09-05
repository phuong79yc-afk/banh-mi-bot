import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { HelpCircle, MessageCircle, Mail, ArrowLeft, ExternalLink, Book, Bug, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../components/GlassCard'
import LiquidGlass from '../components/LiquidGlass'

export default function Support() {
  const navigate = useNavigate()
  const { colors } = useTheme()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Làm sao để thêm bot vào server Discord?',
      answer: 'Click vào nút "Invite Bot" trong dashboard, hoặc truy cập trang Commands và nhấn "Invite to Server". Bạn cần có quyền "Manage Server" để mời bot.'
    },
    {
      question: 'Bot không phản hồi commands?',
      answer: 'Kiểm tra: (1) Bot đã online chưa (xem status trong dashboard), (2) Bot có đủ permissions trong server, (3) Commands đã được deploy chưa (npm run deploy), (4) Sử dụng slash commands "/" đúng cách.'
    },
    {
      question: 'Music player không hoạt động?',
      answer: 'Đảm bảo: (1) Bot ở trong voice channel, (2) Bot có quyền "Connect" và "Speak", (3) URL YouTube hợp lệ, (4) Discord Player extractors đã được load (check console logs).'
    },
    {
      question: 'Làm sao để custom prefix?',
      answer: 'Bot sử dụng slash commands (/) theo chuẩn Discord. Không cần custom prefix. Gõ "/" trong chat để xem tất cả commands.'
    },
    {
      question: 'Làm sao để tắt một số commands?',
      answer: 'Sử dụng Discord Server Settings > Integrations > Bot > Permissions để tắt/bật commands theo role hoặc channel.'
    },
    {
      question: 'Dashboard không load được?',
      answer: 'Kiểm tra: (1) Backend đang chạy (npm run dev), (2) Port 3000 không bị block, (3) File .env có đầy đủ credentials, (4) Clear browser cache và reload.'
    },
    {
      question: 'Lyrics không hiển thị?',
      answer: 'Google Gemini AI cần GOOGLE_API_KEY trong file .env. Nếu không có, lyrics sẽ fallback về database hoặc API khác. Xem file LYRICS_AI_SETUP.md để setup.'
    },
    {
      question: 'Có thể self-host không?',
      answer: 'Có! Bot hoàn toàn open-source. Clone repository, setup .env file với Discord Token, chạy npm install và npm run dev. Xem Documentation để biết chi tiết.'
    }
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Discord Server',
      description: 'Tham gia community server để được hỗ trợ nhanh chóng',
      action: 'Join Server',
      link: '#',
      color: colors.primary
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Gửi email cho chúng tôi để được hỗ trợ chi tiết',
      action: 'support@botdashboard.com',
      link: 'mailto:support@botdashboard.com',
      color: colors.secondary
    },
    {
      icon: Bug,
      title: 'Report Bug',
      description: 'Báo cáo lỗi trên GitHub Issues',
      action: 'GitHub Issues',
      link: '#',
      color: colors.accent
    }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}
      />

      {/* Liquid Glass Background */}
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

      {/* Header */}
      <div 
        className="border-b-2 backdrop-blur-xl relative z-10"
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <HelpCircle className="h-12 w-12" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>
            Hỗ Trợ & Trợ Giúp
          </h1>
          <p className="text-xl" style={{ color: colors.textSecondary }}>
            Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với chúng tôi
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div 
            className="p-6 cursor-pointer rounded-xl border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300"
            onClick={() => navigate('/docs')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <Book className="h-8 w-8 mb-3" style={{ color: colors.primary }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
              Documentation
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Hướng dẫn chi tiết về cài đặt, tính năng và sử dụng
            </p>
          </div>

          <div 
            className="p-6 cursor-pointer rounded-xl border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300"
            onClick={() => navigate('/dashboard/commands')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <Lightbulb className="h-8 w-8 mb-3" style={{ color: colors.secondary }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
              Commands List
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Xem tất cả 42+ commands và cách sử dụng
            </p>
          </div>

          <div 
            className="p-6 cursor-pointer rounded-xl border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary,
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          >
            <Bug className="h-8 w-8 mb-3" style={{ color: colors.accent }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
              Report Issues
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Báo cáo lỗi hoặc đề xuất tính năng mới
            </p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: colors.text }}>
            Liên Hệ Với Chúng Tôi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="p-8 text-center rounded-xl border-2 backdrop-blur-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => window.open(method.link, '_blank')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderColor: colors.primary,
                  transform: 'translateZ(0)',
                  willChange: 'transform'
                }}
              >
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: method.color + '20' }}
                >
                  <method.icon className="h-8 w-8" style={{ color: method.color }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                  {method.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                  {method.description}
                </p>
                <div 
                  className="inline-flex items-center gap-2 font-medium text-sm"
                  style={{ color: method.color }}
                >
                  {method.action}
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: colors.text }}>
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
          <div 
            className="max-w-3xl mx-auto overflow-hidden rounded-xl border-2 backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: colors.primary
            }}
          >
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border-b last:border-b-0"
                style={{ borderColor: `${colors.primary}40` }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-6 hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: openFaq === index ? colors.primary + '10' : 'transparent' }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold pr-4" style={{ color: colors.text }}>
                      {faq.question}
                    </h3>
                    <div 
                      className="flex-shrink-0 transform transition-transform duration-300"
                      style={{ 
                        transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: colors.primary
                      }}
                    >
                      ▼
                    </div>
                  </div>
                </button>
                {openFaq === index && (
                  <div 
                    className="px-6 pb-6 animate-fadeIn"
                    style={{ color: colors.textSecondary }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div 
          className="mt-16 p-12 text-center rounded-xl border-2 backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(to bottom right, ${colors.primary}20, ${colors.secondary}20)`,
            borderColor: colors.primary,
            backgroundColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <h3 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
            Vẫn Cần Trợ Giúp?
          </h3>
          <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
            Đội ngũ support của chúng tôi luôn sẵn sàng giúp đỡ bạn
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              className="px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
              style={{ 
                backgroundColor: colors.primary,
                color: 'white'
              }}
            >
              Join Discord Server
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="px-6 py-3 rounded-lg font-semibold border-2 hover:scale-105 transition-transform"
              style={{ 
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: 'transparent'
              }}
            >
              Read Documentation
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
