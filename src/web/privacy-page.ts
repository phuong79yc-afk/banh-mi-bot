// Privacy Policy page
export function renderPrivacyPage(botName: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chính Sách Bảo Mật - ${botName}</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: #0a0a0f;
  color: #fff;
  line-height: 1.8;
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
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #ff1744, #ff4569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.update-date {
  color: #888;
  font-size: 0.9rem;
}

.content {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 2.5rem;
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h2 {
  color: #ff1744;
  font-size: 1.8rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

h3 {
  color: #ff4569;
  font-size: 1.3rem;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
}

p {
  color: #ccc;
  margin-bottom: 1rem;
}

ul {
  margin-left: 2rem;
  margin-bottom: 1rem;
}

li {
  color: #bbb;
  margin-bottom: 0.5rem;
}

strong {
  color: #fff;
}

.highlight-box {
  background: rgba(255,23,68,0.1);
  border-left: 4px solid #ff1744;
  padding: 1rem;
  margin: 1.5rem 0;
  border-radius: 4px;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255,23,68,0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255,23,68,0);
  }
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
      <h1>Chính Sách Bảo Mật</h1>
      <p class="update-date">Cập nhật lần cuối: 3 tháng 7, 2026</p>
    </header>

    <div class="content">
      <div class="highlight-box">
        <p><strong>TL;DR:</strong> Chúng tôi chỉ thu thập dữ liệu cần thiết để bot hoạt động. Chúng tôi không bán dữ liệu của bạn cho bên thứ ba. Bạn có quyền xóa dữ liệu bất cứ lúc nào.</p>
      </div>

      <p>Tại <strong>${botName}</strong>, chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.</p>

      <h2>1. Thông Tin Chúng Tôi Thu Thập</h2>
      
      <h3>1.1 Thông Tin Tự Động</h3>
      <p>Khi bạn sử dụng ${botName}, chúng tôi tự động thu thập:</p>
      <ul>
        <li><strong>User ID Discord:</strong> Để nhận diện và lưu trữ dữ liệu của bạn</li>
        <li><strong>Server ID:</strong> Để lưu cấu hình riêng cho từng server</li>
        <li><strong>Tin nhắn commands:</strong> Chỉ những tin nhắn có prefix/slash command</li>
        <li><strong>Hoạt động (XP/Level):</strong> Để hệ thống level hoạt động</li>
      </ul>

      <h3>1.2 Thông Tin Bạn Cung Cấp</h3>
      <ul>
        <li>Dữ liệu bạn nhập khi sử dụng các lệnh (ví dụ: custom prefix, welcome message)</li>
        <li>Thông tin economy (coins, items) nếu bạn tham gia hệ thống economy</li>
        <li>Nội dung ticket support nếu bạn tạo ticket</li>
      </ul>

      <h3>1.3 Chúng Tôi KHÔNG Thu Thập</h3>
      <ul>
        <li>❌ Nội dung tin nhắn thông thường (không phải command)</li>
        <li>❌ Tin nhắn riêng tư (DM) trừ khi bạn chủ động gửi command</li>
        <li>❌ Dữ liệu nhạy cảm (mật khẩu, thông tin thanh toán, v.v.)</li>
        <li>❌ Dữ liệu từ voice channels</li>
      </ul>

      <h2>2. Cách Chúng Tôi Sử Dụng Dữ Liệu</h2>
      <p>Dữ liệu được sử dụng để:</p>
      <ul>
        <li>Cung cấp và cải thiện các tính năng của bot</li>
        <li>Lưu trữ cấu hình và preferences của server</li>
        <li>Xử lý các lệnh và request của bạn</li>
        <li>Hiển thị thống kê và leaderboard</li>
        <li>Ngăn chặn spam và lạm dụng</li>
        <li>Cung cấp support kỹ thuật</li>
      </ul>

      <h2>3. Chia Sẻ Dữ Liệu</h2>
      <p>Chúng tôi <strong>KHÔNG bao giờ</strong> bán dữ liệu của bạn. Dữ liệu chỉ được chia sẻ trong các trường hợp:</p>
      <ul>
        <li><strong>Với Discord:</strong> Theo Discord API Terms, một số dữ liệu được truyền qua API</li>
        <li><strong>Yêu cầu pháp lý:</strong> Nếu được yêu cầu bởi cơ quan chức năng</li>
        <li><strong>Với sự đồng ý của bạn:</strong> Nếu bạn cho phép rõ ràng</li>
      </ul>

      <h2>4. Bảo Mật Dữ Liệu</h2>
      <p>Chúng tôi sử dụng các biện pháp bảo mật chuẩn công nghiệp:</p>
      <ul>
        <li>Mã hóa dữ liệu khi truyền tải (HTTPS/TLS)</li>
        <li>Database được bảo vệ với authentication</li>
        <li>Giới hạn quyền truy cập của team</li>
        <li>Backup định kỳ để tránh mất dữ liệu</li>
        <li>Monitoring 24/7 để phát hiện bất thường</li>
      </ul>

      <h2>5. Lưu Trữ Dữ Liệu</h2>
      <p>Dữ liệu được lưu trữ:</p>
      <ul>
        <li><strong>User data:</strong> Cho đến khi bạn yêu cầu xóa hoặc inactive >1 năm</li>
        <li><strong>Server data:</strong> Cho đến khi bot bị kick/ban khỏi server</li>
        <li><strong>Logs:</strong> Tối đa 30 ngày, sau đó tự động xóa</li>
      </ul>

      <h2>6. Quyền Của Bạn</h2>
      <p>Bạn có quyền:</p>
      <ul>
        <li><strong>Truy cập:</strong> Xem dữ liệu của bạn (dùng lệnh <code>/mydata</code>)</li>
        <li><strong>Sửa đổi:</strong> Cập nhật hoặc sửa dữ liệu của bạn</li>
        <li><strong>Xóa:</strong> Yêu cầu xóa toàn bộ dữ liệu (dùng lệnh <code>/deletedata</code>)</li>
        <li><strong>Export:</strong> Tải xuống dữ liệu của bạn dưới dạng JSON</li>
        <li><strong>Opt-out:</strong> Từ chối các tính năng thu thập dữ liệu (như XP tracking)</li>
      </ul>

      <h2>7. Cookies và Tracking</h2>
      <p>Website của chúng tôi sử dụng:</p>
      <ul>
        <li><strong>Session cookies:</strong> Để duy trì đăng nhập (nếu có)</li>
        <li><strong>Không sử dụng:</strong> Google Analytics, Facebook Pixel, hay tracking cookies bên thứ ba</li>
      </ul>

      <h2>8. Dữ Liệu Trẻ Em</h2>
      <p>${botName} tuân thủ Discord Terms of Service. Discord yêu cầu người dùng phải từ 13 tuổi trở lên (hoặc 16 tuổi ở EU). Chúng tôi không cố ý thu thập dữ liệu từ trẻ em dưới độ tuổi quy định.</p>

      <h2>9. Thay Đổi Chính Sách</h2>
      <p>Chúng tôi có thể cập nhật chính sách này. Những thay đổi quan trọng sẽ được thông báo qua:</p>
      <ul>
        <li>Announcement trên Discord server</li>
        <li>Thông báo trên website</li>
        <li>DM nếu thay đổi ảnh hưởng trực tiếp đến bạn</li>
      </ul>

      <h2>10. Liên Hệ</h2>
      <p>Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình:</p>
      <ul>
        <li><strong>Email:</strong> privacy@${botName.toLowerCase()}.com</li>
        <li><strong>Discord:</strong> <a href="https://discord.gg/your-server" style="color: #ff1744;">discord.gg/your-server</a></li>
        <li><strong>Commands:</strong> <code>/mydata</code>, <code>/deletedata</code>, <code>/privacy</code></li>
      </ul>

      <div class="highlight-box">
        <p><strong>📌 Ghi chú quan trọng:</strong> Việc xóa dữ liệu sẽ xóa toàn bộ progress của bạn (level, coins, items). Hành động này không thể hoàn tác. Cân nhắc kỹ trước khi thực hiện.</p>
      </div>
    </div>

    <footer>
      <p>© 2026 ${botName}. Chúng tôi tôn trọng quyền riêng tư của bạn.</p>
    </footer>
  </div>
</body>
</html>`;
}
