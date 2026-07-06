// Terms of Service page
export function renderTermsPage(botName: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Điều Khoản Sử Dụng - ${botName}</title>
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
  animation: fadeInLeft 0.6s ease;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
      <h1>Điều Khoản Sử Dụng</h1>
      <p class="update-date">Cập nhật lần cuối: 3 tháng 7, 2026</p>
    </header>

    <div class="content">
      <p>Chào mừng bạn đến với <strong>${botName}</strong>. Bằng cách sử dụng bot của chúng tôi, bạn đồng ý với các điều khoản sau đây.</p>

      <h2>1. Chấp Nhận Điều Khoản</h2>
      <p>Khi bạn thêm ${botName} vào Discord server của mình, bạn đã đồng ý tuân thủ các điều khoản sử dụng này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.</p>

      <h2>2. Mô Tả Dịch Vụ</h2>
      <p>${botName} là một Discord bot cung cấp các tính năng:</p>
      <ul>
        <li>Quản lý và kiểm duyệt server</li>
        <li>Hệ thống level và XP</li>
        <li>Phát nhạc từ nhiều nguồn</li>
        <li>Economy game và mini-games</li>
        <li>Và nhiều tính năng khác</li>
      </ul>

      <h2>3. Quyền và Trách Nhiệm Của Người Dùng</h2>
      <h3>3.1 Quyền Của Bạn</h3>
      <ul>
        <li>Sử dụng miễn phí các tính năng cơ bản của bot</li>
        <li>Tùy chỉnh cấu hình bot cho server của bạn</li>
        <li>Yêu cầu hỗ trợ kỹ thuật từ team</li>
        <li>Xóa bot khỏi server bất cứ lúc nào</li>
      </ul>

      <h3>3.2 Trách Nhiệm Của Bạn</h3>
      <ul>
        <li>Không sử dụng bot cho mục đích bất hợp pháp</li>
        <li>Không cố gắng hack, phá hoại hoặc làm gián đoạn dịch vụ</li>
        <li>Không spam hoặc lạm dụng các lệnh của bot</li>
        <li>Tuân thủ Discord Terms of Service và Community Guidelines</li>
        <li>Chịu trách nhiệm về nội dung và hành vi trong server của bạn</li>
      </ul>

      <h2>4. Giới Hạn Trách Nhiệm</h2>
      <p>${botName} được cung cấp "AS IS" (nguyên trạng). Chúng tôi không đảm bảo bot sẽ hoạt động 100% không gián đoạn hoặc không có lỗi. Chúng tôi không chịu trách nhiệm về:</p>
      <ul>
        <li>Mất mát dữ liệu do lỗi kỹ thuật</li>
        <li>Thiệt hại gián tiếp phát sinh từ việc sử dụng bot</li>
        <li>Nội dung do người dùng tạo ra trong server</li>
        <li>Hành động của thành viên trong server của bạn</li>
      </ul>

      <h2>5. Thay Đổi Dịch Vụ</h2>
      <p>Chúng tôi có quyền:</p>
      <ul>
        <li>Thay đổi, cập nhật hoặc ngừng cung cấp tính năng bất kỳ</li>
        <li>Tạm ngừng dịch vụ để bảo trì</li>
        <li>Từ chối cung cấp dịch vụ cho bất kỳ ai vi phạm điều khoản</li>
      </ul>

      <h2>6. Chấm Dứt</h2>
      <p>Chúng tôi có quyền chấm dứt hoặc tạm ngừng quyền truy cập của bạn vào bot nếu bạn vi phạm điều khoản này. Bạn cũng có thể ngừng sử dụng bot bất cứ lúc nào bằng cách xóa bot khỏi server.</p>

      <h2>7. Thay Đổi Điều Khoản</h2>
      <p>Chúng tôi có thể cập nhật điều khoản này theo thời gian. Những thay đổi quan trọng sẽ được thông báo trước ít nhất 7 ngày. Việc bạn tiếp tục sử dụng bot sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận điều khoản mới.</p>

      <h2>8. Liên Hệ</h2>
      <p>Nếu bạn có bất kỳ câu hỏi nào về Điều Khoản Sử Dụng, vui lòng liên hệ:</p>
      <ul>
        <li>Email: support@${botName.toLowerCase()}.com</li>
        <li>Discord: <a href="https://discord.gg/your-server" style="color: #ff1744;">discord.gg/your-server</a></li>
      </ul>
    </div>

    <footer>
      <p>© 2026 ${botName}. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>`;
}
