// Documentation page
import { WEB_SVG_ICONS } from './svg-icons-web';

export function renderDocsPage(botName: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hướng Dẫn - ${botName}</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: #0a0a0f;
  color: #fff;
  line-height: 1.6;
  position: relative;
  overflow-x: hidden;
}

/* ANIMATED BACKGROUND */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255,0,0,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(220,38,38,0.1) 0%, transparent 50%);
  animation: bgPulse 8s ease infinite;
  z-index: -1;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* GRID PATTERN */
body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255,0,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,0,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  z-index: -1;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

/* ANIMATION KEYFRAMES */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255,0,0,0.3); }
  50% { box-shadow: 0 0 40px rgba(255,0,0,0.6); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* HEADER */
header {
  padding: 1.5rem 0;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10,10,15,0.8);
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  font-size: 1.3rem;
  color: #fff;
  text-decoration: none;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff0000, #dc2626);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(255,0,0,0.4);
  animation: glow 3s ease infinite, float 4s ease infinite;
}

.btn-home {
  background: linear-gradient(135deg, #ff0000, #dc2626);
  color: #fff;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-home:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255,0,0,0.5);
}

/* DOCS LAYOUT */
.docs-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
  padding: 3rem 0;
  min-height: calc(100vh - 200px);
}

/* SIDEBAR */
.sidebar {
  position: sticky;
  top: 100px;
  height: fit-content;
  animation: slideInLeft 0.6s ease;
}

.sidebar-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.sidebar-menu {
  list-style: none;
}

.sidebar-item {
  margin-bottom: 0.5rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #aaa;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.sidebar-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(135deg, #ff0000, #dc2626);
  transform: scaleY(0);
  transition: transform 0.3s;
}

.sidebar-link:hover::before {
  transform: scaleY(1);
}

.sidebar-link:hover {
  background: rgba(255,0,0,0.1);
  color: #ff0000;
  transform: translateX(5px);
}

.sidebar-link.active {
  background: linear-gradient(135deg, rgba(255,0,0,0.2), rgba(220,38,38,0.2));
  color: #ff0000;
  border-left: 3px solid #ff0000;
}

/* CONTENT */
.docs-content {
  max-width: 800px;
  animation: fadeInUp 0.8s ease;
}

.docs-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.docs-title {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fff, #ff0000);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  animation: slideInRight 0.8s ease;
}

.docs-subtitle {
  font-size: 1.2rem;
  color: #aaa;
}

.section {
  margin-bottom: 3rem;
  animation: fadeInUp 0.6s ease;
  animation-fill-mode: both;
}

.section:nth-child(1) { animation-delay: 0.1s; }
.section:nth-child(2) { animation-delay: 0.2s; }
.section:nth-child(3) { animation-delay: 0.3s; }
.section:nth-child(4) { animation-delay: 0.4s; }
.section:nth-child(5) { animation-delay: 0.5s; }
.section:nth-child(6) { animation-delay: 0.6s; }

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #fff;
}

.section-content {
  color: #ccc;
  line-height: 1.8;
}

.section-content p {
  margin-bottom: 1rem;
}

/* COMMAND BOX */
.command-box {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,0,0,0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  transition: all 0.4s;
  position: relative;
  overflow: hidden;
}

.command-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,0,0,0.1), transparent);
  transition: left 0.6s;
}

.command-box:hover::before {
  left: 100%;
}

.command-box:hover {
  transform: translateX(10px);
  border-color: rgba(255,0,0,0.5);
  box-shadow: 0 10px 30px rgba(255,0,0,0.2);
}

.command-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ff0000;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.command-code {
  background: rgba(0,0,0,0.5);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  color: #ff0000;
  margin: 0.75rem 0;
  position: relative;
  animation: pulse 2s ease infinite;
}

.command-desc {
  color: #aaa;
  font-size: 0.95rem;
}

/* FEATURE LIST */
.feature-list {
  list-style: none;
  margin: 1.5rem 0;
}

.feature-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: rgba(255,255,255,0.02);
  border-left: 3px solid #ff0000;
  border-radius: 8px;
  transition: all 0.3s;
  animation: slideInLeft 0.5s ease;
  animation-fill-mode: both;
}

.feature-item:nth-child(1) { animation-delay: 0.1s; }
.feature-item:nth-child(2) { animation-delay: 0.2s; }
.feature-item:nth-child(3) { animation-delay: 0.3s; }
.feature-item:nth-child(4) { animation-delay: 0.4s; }
.feature-item:nth-child(5) { animation-delay: 0.5s; }
.feature-item:nth-child(6) { animation-delay: 0.6s; }

.feature-item:hover {
  transform: translateX(10px);
  background: rgba(255,0,0,0.05);
  border-left-width: 5px;
}

.feature-item strong {
  color: #ff0000;
}

/* STEP BOX */
.steps {
  margin: 2rem 0;
}

.step {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  animation: scaleIn 0.5s ease;
  animation-fill-mode: both;
}

.step:nth-child(1) { animation-delay: 0.1s; }
.step:nth-child(2) { animation-delay: 0.2s; }
.step:nth-child(3) { animation-delay: 0.3s; }

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff0000, #dc2626);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  animation: pulse 2s ease infinite, glow 3s ease infinite;
}

.step-content h4 {
  margin-bottom: 0.5rem;
  color: #fff;
}

.step-content p {
  color: #aaa;
}

/* ALERT BOX */
.alert {
  padding: 1.5rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  display: flex;
  gap: 1rem;
  align-items: start;
  animation: scaleIn 0.6s ease;
  transition: all 0.3s;
}

.alert:hover {
  transform: scale(1.02);
}

.alert-warning {
  background: rgba(255,180,0,0.1);
  border: 1px solid rgba(255,180,0,0.3);
}

.alert-info {
  background: rgba(0,150,255,0.1);
  border: 1px solid rgba(0,150,255,0.3);
}

.alert-icon {
  font-size: 1.5rem;
  animation: float 3s ease infinite;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
}

/* CODE INLINE */
code {
  background: rgba(255,0,0,0.1);
  color: #ff0000;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  transition: all 0.3s;
}

code:hover {
  background: rgba(255,0,0,0.2);
  box-shadow: 0 0 10px rgba(255,0,0,0.3);
}

/* FOOTER */
footer {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 2rem 0;
  text-align: center;
  margin-top: 4rem;
  color: #666;
}

@media (max-width: 768px) {
  .docs-layout {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
  }
  
  .docs-title {
    font-size: 2rem;
  }
}
  </style>
</head>
<body>

  <!-- HEADER -->
  <header>
    <div class="container">
      <nav>
        <a href="/" class="logo">
          <div class="logo-icon">
            ${WEB_SVG_ICONS.shield}
          </div>
          <span>${botName}</span>
        </a>
        
        <a href="/" class="btn-home">Trang Chủ</a>
      </nav>
    </div>
  </header>

  <!-- DOCS CONTENT -->
  <div class="container">
    <div class="docs-layout">

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <h3 class="sidebar-title">Danh Mục</h3>
        <ul class="sidebar-menu">
          <li class="sidebar-item">
            <a href="#getting-started" class="sidebar-link active">
              ${WEB_SVG_ICONS.rocket}
              Bắt Đầu
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#commands" class="sidebar-link">
              ${WEB_SVG_ICONS.lightning}
              Các Lệnh
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#moderation" class="sidebar-link">
              ${WEB_SVG_ICONS.shield}
              Quản Trị
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#music" class="sidebar-link">
              ${WEB_SVG_ICONS.music}
              Âm Nhạc
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#economy" class="sidebar-link">
              ${WEB_SVG_ICONS.gem}
              Economy
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#leveling" class="sidebar-link">
              ${WEB_SVG_ICONS.trophy}
              Level System
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#social" class="sidebar-link">
              ${WEB_SVG_ICONS.discord}
              Social Media
            </a>
          </li>
          <li class="sidebar-item">
            <a href="#faq" class="sidebar-link">
              ${WEB_SVG_ICONS.sparkles}
              FAQ
            </a>
          </li>
        </ul>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="docs-content">
        
        <div class="docs-header">
          <h1 class="docs-title">Hướng Dẫn Sử Dụng ${botName}</h1>
          <p class="docs-subtitle">Tài liệu đầy đủ về cách sử dụng bot Discord mạnh nhất</p>
        </div>

        <!-- GETTING STARTED -->
        <section id="getting-started" class="section">
          <h2 class="section-title">🚀 Bắt Đầu</h2>
          <div class="section-content">
            <p>Chào mừng bạn đến với ${botName}! Dưới đây là hướng dẫn nhanh để bắt đầu sử dụng bot.</p>
            
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Mời Bot Vào Server</h4>
                  <p>Nhấn vào nút "Thêm Bot" trên trang chủ và chọn server bạn muốn thêm bot vào.</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Cấp Quyền Cho Bot</h4>
                  <p>Bot cần quyền Administrator để hoạt động tốt nhất. Bạn có thể tùy chỉnh quyền sau.</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Sử Dụng Lệnh</h4>
                  <p>Gõ <code>/help</code> để xem danh sách lệnh hoặc <code>/setup</code> để thiết lập bot.</p>
                </div>
              </div>
            </div>

            <div class="alert alert-info">
              <div class="alert-icon">💡</div>
              <div class="alert-content">
                <div class="alert-title">Mẹo Pro</div>
                <p>Bot sử dụng Slash Commands (/) thay vì prefix truyền thống. Chỉ cần gõ <code>/</code> và Discord sẽ gợi ý các lệnh!</p>
              </div>
            </div>
          </div>
        </section>

        <!-- COMMANDS -->
        <section id="commands" class="section">
          <h2 class="section-title">⚡ Các Lệnh Chính</h2>
          <div class="section-content">
            <p>Dưới đây là các lệnh phổ biến nhất của bot:</p>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.star}
                Help - Trợ Giúp
              </div>
              <div class="command-code">/help [tên lệnh]</div>
              <div class="command-desc">Hiển thị danh sách lệnh hoặc thông tin chi tiết về 1 lệnh cụ thể.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.users}
                Userinfo - Thông Tin User
              </div>
              <div class="command-code">/userinfo [@user]</div>
              <div class="command-desc">Xem thông tin chi tiết về 1 thành viên trong server.</div>
            </div>

            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.lightning}
                Ping - Kiểm Tra Độ Trễ
              </div>
              <div class="command-code">/ping</div>
              <div class="command-desc">Kiểm tra độ trễ của bot và API Discord.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.settings}
                Setup - Thiết Lập Bot
              </div>
              <div class="command-code">/setup</div>
              <div class="command-desc">Hướng dẫn thiết lập bot cho server, cấu hình channels, roles, permissions.</div>
            </div>

            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.database}
                Serverinfo - Thông Tin Server
              </div>
              <div class="command-code">/serverinfo</div>
              <div class="command-desc">Xem thông tin chi tiết về server: số members, roles, channels, boost level.</div>
            </div>
          </div>
        </section>

        <!-- MODERATION -->
        <section id="moderation" class="section">
          <h2 class="section-title">🛡️ Quản Trị Server</h2>
          <div class="section-content">
            <p>Các công cụ quản trị mạnh mẽ để duy trì trật tự trong server:</p>
            
            <ul class="feature-list">
              <li class="feature-item">
                ${WEB_SVG_ICONS.ban}
                <strong>Ban/Kick:</strong> Xóa thành viên vi phạm khỏi server
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.lock}
                <strong>Mute/Timeout:</strong> Tắt tiếng thành viên trong thời gian nhất định
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.shield}
                <strong>Anti-Raid:</strong> Bảo vệ tự động khỏi raid và spam attacks
              </li>

              <li class="feature-item">
                ${WEB_SVG_ICONS.fire}
                <strong>Auto-Moderation:</strong> Tự động xóa spam, link, từ cấm
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.check}
                <strong>Warning System:</strong> Hệ thống cảnh cáo với tự động ban
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.database}
                <strong>Modlog:</strong> Lưu lại toàn bộ hành động quản trị
              </li>
            </ul>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.shield}
                Ban - Cấm Thành Viên
              </div>
              <div class="command-code">/ban @user [lý do]</div>
              <div class="command-desc">Cấm vĩnh viễn 1 thành viên khỏi server.</div>
            </div>
            
            <div class="alert alert-warning">
              <div class="alert-icon">⚠️</div>
              <div class="alert-content">
                <div class="alert-title">Lưu Ý Quan Trọng</div>
                <p>Các lệnh quản trị yêu cầu quyền tương ứng. Đảm bảo bot có quyền cao hơn thành viên bị tác động!</p>
              </div>
            </div>
          </div>
        </section>

        <!-- MUSIC -->
        <section id="music" class="section">
          <h2 class="section-title">🎵 Phát Nhạc</h2>
          <div class="section-content">
            <p>Hệ thống âm nhạc chất lượng cao với nhiều tính năng:</p>

            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.music}
                Play - Phát Nhạc
              </div>
              <div class="command-code">/play [tên bài hát hoặc link]</div>
              <div class="command-desc">Phát nhạc từ YouTube, Spotify, SoundCloud. Tự động tìm kiếm nếu không có link.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.microphone}
                Queue - Hàng Chờ
              </div>
              <div class="command-code">/queue</div>
              <div class="command-desc">Xem danh sách các bài hát đang chờ phát.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.arrowRight}
                Skip - Bỏ Qua
              </div>
              <div class="command-code">/skip</div>
              <div class="command-desc">Bỏ qua bài hát hiện tại và phát bài tiếp theo trong queue.</div>
            </div>
            
            <ul class="feature-list">
              <li class="feature-item">
                ${WEB_SVG_ICONS.spotify}
                <strong>Multiple Sources:</strong> YouTube, Spotify, SoundCloud
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.crown}
                <strong>Audio Quality:</strong> 320kbps bitrate cao nhất
              </li>

              <li class="feature-item">
                ${WEB_SVG_ICONS.sparkles}
                <strong>Loop/Shuffle:</strong> Lặp lại bài hoặc phát ngẫu nhiên
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.settings}
                <strong>Filters:</strong> Bassboost, nightcore, 8D, và nhiều hơn
              </li>
            </ul>
          </div>
        </section>

        <!-- ECONOMY -->
        <section id="economy" class="section">
          <h2 class="section-title">💎 Hệ Thống Economy</h2>
          <div class="section-content">
            <p>Tạo nền kinh tế cho server với tiền ảo và mini-games:</p>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.gem}
                Balance - Xem Số Dư
              </div>
              <div class="command-code">/balance [@user]</div>
              <div class="command-desc">Kiểm tra số tiền của bạn hoặc người khác.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.star}
                Daily - Nhận Thưởng Hàng Ngày
              </div>
              <div class="command-code">/daily</div>
              <div class="command-desc">Nhận tiền thưởng mỗi 24h. Streak bonus khi nhận liên tục!</div>
            </div>

            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.fire}
                Gamble - Casino
              </div>
              <div class="command-code">/gamble [số tiền]</div>
              <div class="command-desc">Chơi casino với cơ hội x2 tiền hoặc mất hết.</div>
            </div>
            
            <ul class="feature-list">
              <li class="feature-item">
                ${WEB_SVG_ICONS.crown}
                <strong>Shop System:</strong> Mua items, roles, custom emojis
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.link}
                <strong>Transfer:</strong> Chuyển tiền cho thành viên khác
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.lightning}
                <strong>Work/Crime:</strong> Kiếm tiền bằng các hoạt động
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.trophy}
                <strong>Leaderboard:</strong> Xếp hạng người giàu nhất server
              </li>
            </ul>
          </div>
        </section>

        <!-- LEVELING SYSTEM -->
        <section id="leveling" class="section">
          <h2 class="section-title">🏆 Level System</h2>
          <div class="section-content">
            <p>Hệ thống level tự động dựa trên hoạt động trong server:</p>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.trophy}
                Rank - Xem Rank Card
              </div>
              <div class="command-code">/rank [@user]</div>
              <div class="command-desc">Xem rank card với XP, level, và vị trí trên bảng xếp hạng.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.star}
                Leaderboard - Bảng Xếp Hạng
              </div>
              <div class="command-code">/leaderboard</div>
              <div class="command-desc">Xem top 10 members có level cao nhất trong server.</div>
            </div>

            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.sparkles}
                Level Roles - Role Thưởng
              </div>
              <div class="command-code">/levelroles setup</div>
              <div class="command-desc">Thiết lập roles tự động khi đạt level nhất định.</div>
            </div>
            
            <ul class="feature-list">
              <li class="feature-item">
                ${WEB_SVG_ICONS.lightning}
                <strong>Auto XP:</strong> Nhận XP mỗi khi chat (1 message = 15-25 XP)
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.crown}
                <strong>Custom Cards:</strong> Tùy chỉnh màu sắc, background rank card
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.fire}
                <strong>Boost Multiplier:</strong> Server boost nhận thêm XP
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.check}
                <strong>Level Announcements:</strong> Thông báo khi lên level
              </li>
            </ul>
          </div>
        </section>

        <!-- SOCIAL MEDIA -->
        <section id="social" class="section">
          <h2 class="section-title">📱 Social Media Integration</h2>
          <div class="section-content">
            <p>Kết nối với các nền tảng mạng xã hội phổ biến:</p>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.instagram}
                Instagram - Theo Dõi Posts
              </div>
              <div class="command-code">/instagram setup [username]</div>
              <div class="command-desc">Tự động post thông báo khi có ảnh mới trên Instagram.</div>
            </div>
            
            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.discord}
                Discord Status - Theo Dõi User
              </div>
              <div class="command-code">/status [@user]</div>
              <div class="command-desc">Xem trạng thái và hoạt động hiện tại của user.</div>
            </div>

            <div class="command-box">
              <div class="command-title">
                ${WEB_SVG_ICONS.link}
                Webhooks - Tích Hợp
              </div>
              <div class="command-code">/webhook create</div>
              <div class="command-desc">Tạo webhooks để nhận thông báo từ các dịch vụ bên ngoài.</div>
            </div>
            
            <ul class="feature-list">
              <li class="feature-item">
                ${WEB_SVG_ICONS.spotify}
                <strong>Spotify Rich Presence:</strong> Hiển thị bài hát đang nghe
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.users}
                <strong>Social Profiles:</strong> Liên kết các tài khoản mạng xã hội
              </li>
              <li class="feature-item">
                ${WEB_SVG_ICONS.rocket}
                <strong>Auto Posting:</strong> Đăng nội dung lên nhiều channels
              </li>
            </ul>
          </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section">
          <h2 class="section-title">❓ Câu Hỏi Thường Gặp</h2>
          <div class="section-content">
            
            <div class="command-box">
              <div class="command-title">Bot không phản hồi lệnh?</div>
              <div class="command-desc">
                Kiểm tra xem bot có quyền "Use Application Commands" và "Send Messages" trong channel đó không. 
                Thử kick và mời lại bot nếu vẫn lỗi.
              </div>
            </div>

            <div class="command-box">
              <div class="command-title">Làm sao thay đổi prefix?</div>
              <div class="command-desc">
                Bot sử dụng Slash Commands (/) mặc định và không thể thay đổi. 
                Đây là tiêu chuẩn mới của Discord.
              </div>
            </div>
            
            <div class="command-box">
              <div class="command-title">Bot có miễn phí không?</div>
              <div class="command-desc">
                Có! Tất cả tính năng cơ bản đều miễn phí. Premium chỉ mở khóa thêm features như custom bot, priority support.
              </div>
            </div>
            
            <div class="command-box">
              <div class="command-title">Làm sao liên hệ support?</div>
              <div class="command-desc">
                Join server Discord chính thức của chúng tôi hoặc gõ <code>/support</code> để được hỗ trợ.
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <div class="alert alert-info" style="margin-top: 3rem;">
          <div class="alert-icon">${WEB_SVG_ICONS.rocket}</div>
          <div class="alert-content">
            <div class="alert-title">Cần Thêm Trợ Giúp?</div>
            <p>Tham gia Discord server của chúng tôi để được support trực tiếp từ team và cộng đồng!</p>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- FOOTER -->
  <footer>
    <div class="container">
      <p>© 2026 ${botName}. Được phát triển với ❤️ tại Việt Nam.</p>
    </div>
  </footer>

</body>
</html>`;
}
