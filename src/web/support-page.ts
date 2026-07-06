// Support page
import { WEB_SVG_ICONS } from './svg-icons-web';

export function renderSupportPage(botName: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hỗ Trợ - ${botName}</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Poppins', 'Inter', sans-serif;
  background: #0a0a0f;
  color: #fff;
  line-height: 1.6;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  padding: 2rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 3rem;
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff1744;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.back-link:hover {
  gap: 0.8rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ff1744, #ff4569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #aaa;
  font-size: 1.1rem;
}

.support-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  transition: all 0.4s ease;
  animation: slideUp 0.6s ease backwards;
  position: relative;
  overflow: hidden;
}

.support-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,23,68,0.1), transparent);
  transition: left 0.6s ease;
}

.support-card:hover::before {
  left: 100%;
}

.support-card:nth-child(1) { animation-delay: 0.1s; }
.support-card:nth-child(2) { animation-delay: 0.2s; }
.support-card:nth-child(3) { animation-delay: 0.3s; }
.support-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.support-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255,23,68,0.5);
  box-shadow: 0 15px 40px rgba(255,23,68,0.2);
}

.support-card h2 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.support-card p {
  color: #ccc;
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #ff1744, #ff4569);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: translate(-50%, -50%);
  transition: width 0.5s ease, height 0.5s ease;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 30px rgba(255,23,68,0.6);
}

.btn:active {
  transform: translateY(-1px) scale(1.02);
}

.faq-item {
  background: rgba(255,255,255,0.02);
  border-left: 3px solid #ff1744;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  animation: fadeInScale 0.5s ease backwards;
}

.faq-item:nth-child(1) { animation-delay: 0.5s; }
.faq-item:nth-child(2) { animation-delay: 0.6s; }
.faq-item:nth-child(3) { animation-delay: 0.7s; }
.faq-item:nth-child(4) { animation-delay: 0.8s; }

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.faq-item:hover {
  background: rgba(255,255,255,0.05);
  border-left-width: 5px;
  padding-left: 1.8rem;
  transform: translateX(5px);
}

.faq-item h3 {
  color: #ff1744;
  margin-bottom: 0.5rem;
}

.faq-item p {
  color: #bbb;
}

footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  text-align: center;
  color: #666;
}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="back-link">← Về trang chủ</a>
      <h1>Hỗ Trợ</h1>
      <p class="subtitle">Chúng tôi sẵn sàng giúp đỡ bạn 24/7</p>
    </header>

    <div class="support-card">
      <h2>💬 Discord Server</h2>
      <p>Tham gia Discord server của chúng tôi để được hỗ trợ nhanh chóng từ team và cộng đồng.</p>
      <a href="https://discord.gg/your-server" class="btn">Tham Gia Discord</a>
    </div>

    <div class="support-card">
      <h2>📧 Email Support</h2>
      <p>Gửi email cho chúng tôi và nhận được phản hồi trong vòng 24 giờ.</p>
      <p><strong>Email:</strong> support@${botName.toLowerCase()}.com</p>
    </div>

    <div class="support-card">
      <h2>📚 Tài Liệu</h2>
      <p>Xem tài liệu hướng dẫn chi tiết về cách sử dụng bot.</p>
      <a href="/docs" class="btn">Xem Tài Liệu</a>
    </div>

    <div class="support-card">
      <h2>❓ Câu Hỏi Thường Gặp</h2>
      
      <div class="faq-item">
        <h3>Làm sao để thêm bot vào server?</h3>
        <p>Click vào nút "Bắt Đầu" trên trang chủ và cấp quyền cho bot. Bot sẽ tự động join server của bạn.</p>
      </div>

      <div class="faq-item">
        <h3>Bot có miễn phí không?</h3>
        <p>Có! Bot hoàn toàn miễn phí cho tất cả tính năng cơ bản. Chúng tôi cũng có gói premium với thêm nhiều tính năng nâng cao.</p>
      </div>

      <div class="faq-item">
        <h3>Làm sao để báo lỗi?</h3>
        <p>Tham gia Discord server của chúng tôi và mở ticket trong kênh #support, hoặc gửi email cho chúng tôi.</p>
      </div>

      <div class="faq-item">
        <h3>Bot có hỗ trợ tiếng Việt không?</h3>
        <p>Có! Bot hỗ trợ đầy đủ tiếng Việt và nhiều ngôn ngữ khác.</p>
      </div>
    </div>

    <footer>
      <p>© 2026 ${botName}. Được phát triển với ❤️ tại Việt Nam.</p>
    </footer>
  </div>
</body>
</html>`;
}
