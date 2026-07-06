import express from 'express';
import path from 'path';
import { Client } from 'discord.js';

export function startWebServer(client: Client, port: number = 3000) {
  const app = express();

  // Static files
  app.use(express.static(path.join(__dirname, '../../public')));
  
  // View engine
  app.set('view engine', 'html');
  app.engine('html', require('ejs').renderFile);
  app.set('views', path.join(__dirname, '../../views'));

  // Routes
  app.get('/', (req, res) => {
    const totalServers = client.guilds.cache.size;
    const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bánh Mì Bot - Discord Bot Việt Nam</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <img src="${client.user?.displayAvatarURL() || ''}" alt="Logo" class="logo">
        <span>Bánh Mì</span>
      </div>
      <div class="nav-links">
        <a href="#features">Tính năng</a>
        <a href="#stats">Thống kê</a>
        <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands" class="btn-primary">Thêm Bot Ngay</a>
      </div>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <div class="badge">⭐ #1 Utilities Bot Việt Nam</div>
        <h1 class="hero-title">Quản Lý Server<br>Thông Minh & Hiệu Quả</h1>
        <p class="hero-description">
          Bánh Mì là Discord Bot đa năng, cung cấp các công cụ độc quyền<br>
          về quản lý và tự động hóa, giúp bạn vận hành Server chuyên nghiệp<br>
          và hiệu quả hơn bao giờ hết.
        </p>
        <div class="hero-buttons">
          <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands" class="btn-large btn-primary">Thêm Bot Ngay</a>
          <a href="#features" class="btn-large btn-secondary">Documentation</a>
        </div>
      </div>
      <div class="hero-image">
        <div class="logo-wrapper">
          <div class="logo-glow"></div>
          <img src="${client.user?.displayAvatarURL({ size: 512 }) || ''}" alt="Bánh Mì Bot" class="bot-avatar">
        </div>
      </div>
    </div>
  </section>

  <section id="stats" class="stats">
    <div class="container">
      <div class="stat-card">
        <div class="stat-number">${totalServers.toLocaleString()}</div>
        <div class="stat-label">Servers</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${totalMembers.toLocaleString()}</div>
        <div class="stat-label">Members</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">99.9%</div>
        <div class="stat-label">Service-level Agreement</div>
      </div>
    </div>
  </section>

  <section id="features" class="features">
    <div class="container">
      <h2 class="section-title">Tính Năng Nổi Bật</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🛡️</div>
          <h3>Bảo Mật Tuyệt Đối</h3>
          <p>Hệ thống moderation mạnh mẽ với auto-mod, anti-spam, anti-raid để bảo vệ server 24/7.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Hiệu Suất Cao</h3>
          <p>Tối ưu hóa tốc độ xử lý với 99.9% uptime, đảm bảo bot luôn sẵn sàng phục vụ.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>Tùy Biến Linh Hoạt</h3>
          <p>Cấu hình commands, roles, permissions dễ dàng theo nhu cầu server của bạn.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Thống Kê Chi Tiết</h3>
          <p>Dashboard trực quan hiển thị hoạt động server, members, và các metrics quan trọng.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Dễ Sử Dụng</h3>
          <p>Giao diện slash commands trực quan, setup chỉ trong vài phút không cần code.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🇻🇳</div>
          <h3>Tiếng Việt 100%</h3>
          <p>Được phát triển bởi người Việt, cho người Việt với support tiếng Việt hoàn chỉnh.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="container">
      <h2>Sẵn sàng nâng cấp Server của bạn?</h2>
      <p>Tham gia cùng ${totalServers.toLocaleString()} servers đang sử dụng Bánh Mì Bot</p>
      <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands" class="btn-large btn-primary">Thêm Bot Miễn Phí</a>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="${client.user?.displayAvatarURL() || ''}" alt="Logo" class="logo">
          <span>Bánh Mì Bot</span>
        </div>
        <div class="footer-text">
          © 2026 Bánh Mì Bot. Made with ❤️ in Vietnam
        </div>
      </div>
    </div>
  </footer>
</body>
</html>
    `);
  });

  // API endpoint
  app.get('/api/stats', (req, res) => {
    res.json({
      servers: client.guilds.cache.size,
      members: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      ping: Math.round(client.ws.ping),
      uptime: client.uptime
    });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Web server running on http://localhost:${port}`);
  });
}
