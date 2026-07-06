// Vie Client inspired landing page - ULTRA MODERN
import { WEB_SVG_ICONS } from './svg-icons-web';

export function renderVieLanding(botName: string, stats: { servers: number; users: number; commands: number }): string {
  const clientId = process.env.CLIENT_ID || '1498700400327528498';
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
  
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${botName} - Bot Discord Thống Trị Servers</title>
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
  overflow-x: hidden;
  transition: background 0.5s ease, color 0.5s ease;
}

/* ANIMATED BACKGROUND */
.bg-animated {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: 
    radial-gradient(circle at 20% 50%, rgba(88,101,242,0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(145,70,255,0.15) 0%, transparent 50%);
  animation: bgPulse 10s ease infinite;
}

/* VIDEO BACKGROUND */
.video-bg {
  position: fixed;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}

.video-overlay {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(10,10,15,0.7) 0%, rgba(10,10,15,0.9) 100%);
  pointer-events: none;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* GRID PATTERN */
.grid-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* HEADER */
header {
  padding: 0.9rem 0;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(0,0,0,0.8);
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  text-decoration: none;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ff1744, #ff4569);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255,23,68,0.3);
  font-size: 1.3rem;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}

.nav-link {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link svg {
  width: 0;
  height: 0;
  display: none;
}

.nav-link:hover {
  color: #fff;
}

/* NAV ACTIONS */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* LANGUAGE SWITCHER */
.language-switcher {
  display: flex;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 0;
  gap: 0;
  position: relative;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: rgba(255,255,255,0.7);
  font-weight: 400;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.lang-btn .flag {
  display: none;
}

.lang-btn .lang-text {
  text-transform: uppercase;
  transition: transform 0.3s ease;
}

.lang-btn:hover {
  color: #fff;
  transform: translateY(-1px);
}

.lang-btn:hover .lang-text {
  transform: scale(1.05);
}

.lang-btn.active {
  color: #fff;
  background: rgba(255,23,68,0.2);
}

.lang-btn.active .lang-text {
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.language-switcher::after {
  content: '▼';
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.6rem;
  color: rgba(255,255,255,0.5);
  pointer-events: none;
  transition: transform 0.3s ease;
}

.language-switcher:hover::after {
  transform: translateY(-50%) rotate(180deg);
}

/* THEME TOGGLE */
.theme-toggle {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255,255,255,0.7);
  position: relative;
  overflow: hidden;
}

.theme-toggle::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,23,68,0.2), rgba(255,69,105,0.2));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
  transform: translateY(-2px) rotate(15deg);
  box-shadow: 0 4px 12px rgba(255,23,68,0.3);
}

.theme-toggle:hover::before {
  opacity: 1;
}

.theme-toggle:active {
  transform: translateY(0) rotate(0deg);
}

.sun-icon, .moon-icon {
  transition: all 0.4s ease;
  position: relative;
  z-index: 1;
  transform: scale(1);
}

.theme-toggle:hover .sun-icon {
  animation: rotate 2s linear infinite;
}

.theme-toggle:hover .moon-icon {
  animation: swing 1s ease-in-out infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes swing {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

/* LOGIN BUTTON */
.btn-login {
  background: linear-gradient(135deg, #ff1744, #ff4569);
  color: #fff;
  padding: 0.55rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0;
  box-shadow: 0 2px 8px rgba(255,23,68,0.3);
  border: none;
  position: relative;
  overflow: hidden;
}

.btn-login::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.btn-login:hover::before {
  width: 300px;
  height: 300px;
}

.btn-login svg {
  display: none;
}

.btn-login span {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,23,68,0.5);
}

.btn-login:hover span {
  transform: scale(1.05);
}

.btn-login:active {
  transform: translateY(0);
}

.btn-header {
  background: linear-gradient(135deg, #ff0000, #dc2626);
  color: #fff;
  padding: 0.75rem 1.8rem;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 30px rgba(255,0,0,0.4);
}

.btn-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(255,0,0,0.6);
}

/* HERO SECTION */
.hero {
  min-height: 90vh;
  display: flex;
  align-items: center;
  padding: 4rem 0;
  position: relative;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content {
  animation: fadeInLeft 1s ease;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 2rem;
  letter-spacing: -0.02em;
}

.title-normal {
  color: #ddd;
  font-weight: 600;
}

.title-gradient {
  background: linear-gradient(90deg, #a855f7, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 5s ease infinite;
  background-size: 200% 200%;
  font-weight: 800;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-description {
  font-size: 1.1rem;
  color: #aaa;
  line-height: 1.8;
  margin-bottom: 2.5rem;
  max-width: 650px;
  font-weight: 400;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.btn svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
}

.btn:hover svg {
  transform: scale(1.1);
}

.btn-primary {
  background: linear-gradient(135deg, #ff1744, #ff4569);
  color: #fff;
  box-shadow: 0 4px 14px rgba(255,23,68,0.35);
  font-weight: 600;
  border: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,23,68,0.45);
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
  font-weight: 500;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.25);
}

/* HERO 3D */
.hero-3d {
  position: relative;
  animation: fadeInRight 1s ease;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.discord-logo-3d {
  width: 100%;
  max-width: 500px;
  height: 500px;
  background: transparent;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.discord-logo-3d::before {
  display: none;
}

.logo-image {
  position: relative;
  z-index: 1;
  width: 300px;
  height: 300px;
  background: transparent;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 6s ease-in-out infinite;
}

.bot-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5));
  image-rendering: pixelated;
}

.fallback-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fallback-icon svg {
  width: 150px;
  height: 150px;
  fill: white;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* STATS CARDS */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin: 4rem 0;
}

.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.4s;
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255,23,68,0.3);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  background: rgba(255,255,255,0.05);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #888;
  font-size: 1rem;
  font-weight: 400;
}

/* FEATURES */
.features {
  padding: 6rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-badge {
  display: inline-block;
  background: linear-gradient(135deg, rgba(255,0,0,0.2), rgba(220,38,38,0.2));
  border: 1px solid rgba(255,0,0,0.3);
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ff0000;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 3.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fff, #ff0000);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #999;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.feature-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 2.5rem;
  transition: all 0.4s;
  position: relative;
  overflow: hidden;
}

.feature-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #ff0000, #dc2626);
  transform: scaleX(0);
  transition: transform 0.4s;
}

.feature-card:hover {
  transform: translateY(-10px);
  border-color: rgba(255,0,0,0.5);
  box-shadow: 0 20px 50px rgba(255,0,0,0.2);
}

.feature-card:hover::after {
  transform: scaleX(1);
}

.feature-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #ff0000, #dc2626);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 30px rgba(255,0,0,0.3);
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.feature-description {
  color: #999;
  line-height: 1.7;
}

/* CTA SECTION */
.cta {
  background: linear-gradient(135deg, rgba(255,0,0,0.1), rgba(220,38,38,0.1));
  border: 1px solid rgba(255,0,0,0.2);
  border-radius: 30px;
  padding: 5rem 4rem;
  text-align: center;
  margin: 6rem 0;
  position: relative;
  overflow: hidden;
}

.cta::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,0,0,0.1) 0%, transparent 70%);
  animation: ctaPulse 8s ease infinite;
}

@keyframes ctaPulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(180deg); }
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.3rem;
  color: #aaa;
  margin-bottom: 2.5rem;
}

/* FOOTER */
footer {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 3rem 0;
  text-align: center;
  margin-top: 6rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.footer-link {
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #ff0000;
}

.footer-text {
  color: #666;
  font-size: 0.95rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .discord-logo-3d {
    max-width: 100%;
    height: 300px;
  }
  
  .logo-display {
    font-size: 8rem;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-links {
    display: none;
  }
}
  </style>
</head>
<body>

  <!-- VIDEO BACKGROUND -->
  <video class="video-bg" autoplay muted loop playsinline>
    <source src="/videos/minecraft-falling-snow.1920x1080.mp4" type="video/mp4">
  </video>
  <div class="video-overlay"></div>

  <!-- ANIMATED BG -->
  <div class="bg-animated"></div>
  <div class="grid-bg"></div>

  <!-- HEADER -->
  <header>
    <div class="container">
      <nav>
        <a href="/" class="logo">
          <div class="logo-icon">
            <img src="/images/gemini-svg.png" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <span>${botName}</span>
        </a>
        
        <div class="nav-links">
          <a href="#features" class="nav-link">
            ${WEB_SVG_ICONS.sparkles}
            <span>Tính Năng</span>
          </a>
          <a href="/docs" class="nav-link">
            ${WEB_SVG_ICONS.star}
            <span>Hướng Dẫn</span>
          </a>
        </div>
        
        <div class="nav-actions">
          <!-- Language Switcher -->
          <div class="language-switcher">
            <button class="lang-btn active" data-lang="vi">
              <span class="flag">🇻🇳</span>
              <span class="lang-text">VN</span>
            </button>
            <button class="lang-btn" data-lang="en">
              <span class="flag">🇺🇸</span>
              <span class="lang-text">EN</span>
            </button>
          </div>
          
          <!-- Theme Toggle -->
          <button class="theme-toggle" id="themeToggle">
            <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none;">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          
          <!-- Login Button -->
          <a href="/auth/discord" class="btn-login">
            ${WEB_SVG_ICONS.discord}
            <span>Đăng Nhập</span>
          </a>
        </div>
      </nav>
    </div>
  </header>

  <!-- HERO -->
  <section class="hero">
    <div class="container">
      <div class="hero-grid">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="title-normal">Bot Discord Mạnh Nhất </span>
            <span class="title-gradient">${botName}</span>
          </h1>
          
          <p class="hero-description" data-vi="Bot Discord đa năng với tính năng quản lý, kiểm duyệt, nhạc, economy và nhiều hơn nữa. Tham gia cùng hàng ngàn server đang sử dụng bot hiện đại nhất." data-en="Multi-purpose Discord bot with moderation, music, economy and more. Join thousands of servers using the most modern bot.">
            Bot Discord đa năng với tính năng quản lý, kiểm duyệt, nhạc, economy và nhiều hơn nữa. 
            Tham gia cùng hàng ngàn server đang sử dụng bot hiện đại nhất.
          </p>
          
          <div class="hero-buttons">
            <a href="${inviteUrl}" class="btn btn-primary">
              <span data-vi="Bắt Đầu" data-en="Get Started">Bắt Đầu</span>
              ${WEB_SVG_ICONS.arrowRight}
            </a>
          </div>
        </div>
        
        <div class="hero-3d">
          <div class="discord-logo-3d">
            <div class="logo-image">
              <img src="/images/220px-Ghast_JE3_BE3.webp" alt="Bot Icon" class="bot-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div class="fallback-icon" style="display:none;">
                ${WEB_SVG_ICONS.discord}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS -->
  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${(stats.users / 1000).toFixed(0)}K+</div>
        <div class="stat-label">Người Dùng</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">99.9%</div>
        <div class="stat-label">Hoạt Động</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">Hàng Tuần</div>
        <div class="stat-label">Cập Nhật</div>
      </div>
    </div>
  </div>

  <!-- FEATURES -->
  <section id="features" class="features">
    <div class="container">
      <div class="section-header">
        <span class="section-badge">✨ Tính Năng Nổi Bật</span>
        <h2 class="section-title">Mọi Thứ Bạn Cần</h2>
        <p class="section-subtitle">
          Công cụ hoàn chỉnh để quản lý và phát triển Discord server
        </p>
      </div>
      
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">
            ${WEB_SVG_ICONS.shield}
          </div>
          <h3 class="feature-title">Bảo Mật Tuyệt Đối</h3>
          <p class="feature-description">
            Anti-raid, anti-spam, auto-moderation AI. 
            Bảo vệ server 24/7 khỏi mọi mối đe dọa.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            ${WEB_SVG_ICONS.music}
          </div>
          <h3 class="feature-title">Âm Nhạc Pro</h3>
          <p class="feature-description">
            Phát nhạc từ YouTube, Spotify, SoundCloud. 
            Chất lượng 320kbps, không lag giật.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            ${WEB_SVG_ICONS.trophy}
          </div>
          <h3 class="feature-title">Hệ Thống Level</h3>
          <p class="feature-description">
            Level tự động, XP rewards, rank card đẹp mắt. 
            Tăng engagement cho community.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            ${WEB_SVG_ICONS.gem}
          </div>
          <h3 class="feature-title">Economy Game</h3>
          <p class="feature-description">
            Tiền tệ ảo, shop items, casino, mini-games. 
            Tạo nền kinh tế cho server.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            ${WEB_SVG_ICONS.users}
          </div>
          <h3 class="feature-title">Quản Lý Thành Viên</h3>
          <p class="feature-description">
            Welcome system, auto-roles, verification, 
            ticket support chuyên nghiệp.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            ${WEB_SVG_ICONS.sparkles}
          </div>
          <h3 class="feature-title">Tùy Biến Toàn Diện</h3>
          <p class="feature-description">
            Custom commands, tự động hóa workflows. 
            Không cần code, setup trong 2 phút.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <div class="container">
    <div class="cta">
      <div class="cta-content">
        <h2 class="cta-title">Sẵn Sàng Bắt Đầu?</h2>
        <p class="cta-description">
          Tham gia cùng ${stats.servers.toLocaleString()}+ servers đang sử dụng ${botName}. 
          Miễn phí mãi mãi cho các tính năng cơ bản.
        </p>
        <a href="${inviteUrl}" class="btn btn-primary">
          ${WEB_SVG_ICONS.lightning}
          <span>Thêm Bot Miễn Phí</span>
        </a>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer>
    <div class="container">
      <div class="footer-links">
        <a href="/docs" class="footer-link">Tài liệu</a>
        <a href="/support" class="footer-link">Hỗ trợ</a>
        <a href="/terms" class="footer-link">Điều khoản</a>
        <a href="/privacy" class="footer-link">Bảo mật</a>
      </div>
      <p class="footer-text">
        © 2026 ${botName}. Được phát triển với ${WEB_SVG_ICONS.fire} tại Việt Nam.
      </p>
    </div>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var langBtns = document.querySelectorAll('.lang-btn');
      
      langBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          langBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          
          var lang = btn.dataset.lang;
          
          // Update all elements with data-vi and data-en
          document.querySelectorAll('[data-vi]').forEach(function(el) {
            el.textContent = el.dataset[lang];
          });
          
          if (lang === 'en') {
            document.querySelector('.title-normal').textContent = 'Most Powerful Discord Bot ';
            document.querySelector('.btn-login span').textContent = 'Login';
            
            // Nav links
            var navLinks = document.querySelectorAll('.nav-link span');
            if (navLinks[0]) navLinks[0].textContent = 'Features';
            if (navLinks[1]) navLinks[1].textContent = 'Guide';
            
            // Stats
            var statLabels = document.querySelectorAll('.stat-label');
            if (statLabels[0]) statLabels[0].textContent = 'Users';
            if (statLabels[1]) statLabels[1].textContent = 'Uptime';
            if (statLabels[2]) statLabels[2].textContent = 'Updates';
            
            // Features section
            var sectionBadge = document.querySelector('.section-badge');
            if (sectionBadge) sectionBadge.textContent = '✨ Key Features';
            
            var sectionTitle = document.querySelector('.section-title');
            if (sectionTitle) sectionTitle.textContent = 'Everything You Need';
            
            var sectionSubtitle = document.querySelector('.section-subtitle');
            if (sectionSubtitle) sectionSubtitle.textContent = 'Complete tools to manage and grow your Discord server';
            
            var featureTitles = document.querySelectorAll('.feature-title');
            var featureDescs = document.querySelectorAll('.feature-description');
            
            if (featureTitles[0]) featureTitles[0].textContent = 'Absolute Security';
            if (featureDescs[0]) featureDescs[0].textContent = 'Anti-raid, anti-spam, AI auto-moderation. Protect your server 24/7 from all threats.';
            
            if (featureTitles[1]) featureTitles[1].textContent = 'Pro Music';
            if (featureDescs[1]) featureDescs[1].textContent = 'Play music from YouTube, Spotify, SoundCloud. 320kbps quality, no lag.';
            
            if (featureTitles[2]) featureTitles[2].textContent = 'Level System';
            if (featureDescs[2]) featureDescs[2].textContent = 'Auto leveling, XP rewards, beautiful rank cards. Boost community engagement.';
            
            if (featureTitles[3]) featureTitles[3].textContent = 'Economy Game';
            if (featureDescs[3]) featureDescs[3].textContent = 'Virtual currency, shop items, casino, mini-games. Create server economy.';
            
            if (featureTitles[4]) featureTitles[4].textContent = 'Member Management';
            if (featureDescs[4]) featureDescs[4].textContent = 'Welcome system, auto-roles, verification, professional ticket support.';
            
            if (featureTitles[5]) featureTitles[5].textContent = 'Full Customization';
            if (featureDescs[5]) featureDescs[5].textContent = 'Custom commands, workflow automation. No coding needed, setup in 2 minutes.';
            
            // CTA
            var ctaTitle = document.querySelector('.cta-title');
            if (ctaTitle) ctaTitle.textContent = 'Ready to Start?';
            
            var ctaDesc = document.querySelector('.cta-description');
            if (ctaDesc) ctaDesc.textContent = 'Join ${stats.servers.toLocaleString()}+ servers using ${botName}. Free forever for basic features.';
            
            var ctaBtn = document.querySelector('.cta .btn span');
            if (ctaBtn) ctaBtn.textContent = 'Add Bot for Free';
            
            // Footer
            var footerLinks = document.querySelectorAll('.footer-link');
            if (footerLinks[0]) footerLinks[0].textContent = 'Documentation';
            if (footerLinks[1]) footerLinks[1].textContent = 'Support';
            if (footerLinks[2]) footerLinks[2].textContent = 'Terms';
            if (footerLinks[3]) footerLinks[3].textContent = 'Privacy';
            
            var footerText = document.querySelector('.footer-text');
            if (footerText) footerText.textContent = '© 2026 ${botName}. Made with ❤️ in Vietnam.';
            
          } else {
            // Vietnamese
            document.querySelector('.title-normal').textContent = 'Bot Discord Mạnh Nhất ';
            document.querySelector('.btn-login span').textContent = 'Đăng Nhập';
            
            // Nav links
            var navLinks = document.querySelectorAll('.nav-link span');
            if (navLinks[0]) navLinks[0].textContent = 'Tính Năng';
            if (navLinks[1]) navLinks[1].textContent = 'Hướng Dẫn';
            
            // Stats
            var statLabels = document.querySelectorAll('.stat-label');
            if (statLabels[0]) statLabels[0].textContent = 'Người Dùng';
            if (statLabels[1]) statLabels[1].textContent = 'Hoạt Động';
            if (statLabels[2]) statLabels[2].textContent = 'Cập Nhật';
            
            // Features section
            var sectionBadge = document.querySelector('.section-badge');
            if (sectionBadge) sectionBadge.textContent = '✨ Tính Năng Nổi Bật';
            
            var sectionTitle = document.querySelector('.section-title');
            if (sectionTitle) sectionTitle.textContent = 'Mọi Thứ Bạn Cần';
            
            var sectionSubtitle = document.querySelector('.section-subtitle');
            if (sectionSubtitle) sectionSubtitle.textContent = 'Công cụ hoàn chỉnh để quản lý và phát triển Discord server';
            
            var featureTitles = document.querySelectorAll('.feature-title');
            var featureDescs = document.querySelectorAll('.feature-description');
            
            if (featureTitles[0]) featureTitles[0].textContent = 'Bảo Mật Tuyệt Đối';
            if (featureDescs[0]) featureDescs[0].textContent = 'Anti-raid, anti-spam, auto-moderation AI. Bảo vệ server 24/7 khỏi mọi mối đe dọa.';
            
            if (featureTitles[1]) featureTitles[1].textContent = 'Âm Nhạc Pro';
            if (featureDescs[1]) featureDescs[1].textContent = 'Phát nhạc từ YouTube, Spotify, SoundCloud. Chất lượng 320kbps, không lag giật.';
            
            if (featureTitles[2]) featureTitles[2].textContent = 'Hệ Thống Level';
            if (featureDescs[2]) featureDescs[2].textContent = 'Level tự động, XP rewards, rank card đẹp mắt. Tăng engagement cho community.';
            
            if (featureTitles[3]) featureTitles[3].textContent = 'Economy Game';
            if (featureDescs[3]) featureDescs[3].textContent = 'Tiền tệ ảo, shop items, casino, mini-games. Tạo nền kinh tế cho server.';
            
            if (featureTitles[4]) featureTitles[4].textContent = 'Quản Lý Thành Viên';
            if (featureDescs[4]) featureDescs[4].textContent = 'Welcome system, auto-roles, verification, ticket support chuyên nghiệp.';
            
            if (featureTitles[5]) featureTitles[5].textContent = 'Tùy Biến Toàn Diện';
            if (featureDescs[5]) featureDescs[5].textContent = 'Custom commands, tự động hóa workflows. Không cần code, setup trong 2 phút.';
            
            // CTA
            var ctaTitle = document.querySelector('.cta-title');
            if (ctaTitle) ctaTitle.textContent = 'Sẵn Sàng Bắt Đầu?';
            
            var ctaDesc = document.querySelector('.cta-description');
            if (ctaDesc) ctaDesc.textContent = 'Tham gia cùng ${stats.servers.toLocaleString()}+ servers đang sử dụng ${botName}. Miễn phí mãi mãi cho các tính năng cơ bản.';
            
            var ctaBtn = document.querySelector('.cta .btn span');
            if (ctaBtn) ctaBtn.textContent = 'Thêm Bot Miễn Phí';
            
            // Footer
            var footerLinks = document.querySelectorAll('.footer-link');
            if (footerLinks[0]) footerLinks[0].textContent = 'Tài liệu';
            if (footerLinks[1]) footerLinks[1].textContent = 'Hỗ trợ';
            if (footerLinks[2]) footerLinks[2].textContent = 'Điều khoản';
            if (footerLinks[3]) footerLinks[3].textContent = 'Bảo mật';
            
            var footerText = document.querySelector('.footer-text');
            if (footerText) footerText.textContent = '© 2026 ${botName}. Được phát triển với ❤️ tại Việt Nam.';
          }
        });
      });
      
      // Theme toggle
      var themeBtn = document.getElementById('themeToggle');
      var sun = themeBtn.querySelector('.sun-icon');
      var moon = themeBtn.querySelector('.moon-icon');
      var body = document.body;
      var videoOverlay = document.querySelector('.video-overlay');
      
      themeBtn.addEventListener('click', function() {
        // Add bounce animation
        themeBtn.style.animation = 'bounce 0.5s ease';
        setTimeout(function() {
          themeBtn.style.animation = '';
        }, 500);
        
        if (sun.style.display === 'none') {
          // Switch to light mode
          sun.style.display = 'block';
          moon.style.display = 'none';
          
          // Animate icon change
          sun.style.transform = 'scale(0)';
          setTimeout(function() {
            sun.style.transform = 'scale(1)';
          }, 50);
          
          // Change theme
          body.style.background = '#f5f5f5';
          body.style.color = '#222';
          if (videoOverlay) {
            videoOverlay.style.background = 'linear-gradient(180deg, rgba(245,245,245,0.8) 0%, rgba(245,245,245,0.95) 100%)';
          }
        } else {
          // Switch to dark mode
          sun.style.display = 'none';
          moon.style.display = 'block';
          
          // Animate icon change
          moon.style.transform = 'scale(0)';
          setTimeout(function() {
            moon.style.transform = 'scale(1)';
          }, 50);
          
          // Change theme
          body.style.background = '#0a0a0f';
          body.style.color = '#fff';
          if (videoOverlay) {
            videoOverlay.style.background = 'linear-gradient(180deg, rgba(10,10,15,0.7) 0%, rgba(10,10,15,0.9) 100%)';
          }
        }
      });
    });
  <\/script>
</body>
</html>`;
}