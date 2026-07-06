// Landing page with modern SVG icons
import { WEB_SVG_ICONS } from './svg-icons-web';

export function renderExactBleedLanding(botName: string, stats: { servers: number; users: number; commands: number }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${botName} - Discord's Premier All-in-One App</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #0d0d0d;
  --text: #ffffff;
  --text-muted: #9ca3af;
  --accent: #5865f2;
  --card-bg: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.1);
}

html, body {
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

/* Animated stars background */
.stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 3rem;
}

/* Header */
header {
  padding: 2rem 0;
  position: relative;
  z-index: 10;
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
  text-decoration: none;
  color: var(--text);
  font-weight: 600;
  font-size: 1rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.nav-center {
  display: flex;
  gap: 2.5rem;
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--text);
}

.nav-right {
  position: relative;
}

.btn-dashboard {
  background: var(--accent);
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  position: relative;
}

.btn-dashboard:hover {
  background: #4752c4;
  transform: translateY(-1px);
}

.coming-soon-badge {
  position: absolute;
  top: -12px;
  right: -20px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transform: rotate(8deg);
  box-shadow: 0 2px 10px rgba(255, 107, 107, 0.4);
}

/* Hero Section */
.hero {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  padding: 4rem 0;
  position: relative;
}

.hero-content {
  max-width: 500px;
  margin-right: auto;
}

.hero-title {
  font-size: 3.25rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.verified-badge {
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.3rem;
  margin-right: 0.3rem;
  filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.6));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.hero-subtitle {
  font-size: 1.15rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 2.5rem;
  max-width: 550px;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.btn {
  padding: 0.75rem 1.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Floating Tags */
.floating-tags {
  position: absolute;
  right: 8%;
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  height: 380px;
}

.tag {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  backdrop-filter: blur(10px);
  animation: float 3s ease-in-out infinite;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: absolute;
  white-space: nowrap;
}

.tag:nth-child(1) {
  top: 8%;
  left: 0;
  animation-delay: 0s;
}

.tag:nth-child(2) {
  top: 45%;
  right: 0;
  animation-delay: 1s;
}

.tag:nth-child(3) {
  bottom: 8%;
  left: 15%;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}

.tag-icon {
  font-size: 1.2rem;
}

/* Footer Stats */
footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(13, 13, 13, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.footer-stats {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.footer-stats strong {
  color: var(--text);
  font-weight: 700;
}

/* Responsive */
@media (max-width: 1024px) {
  .floating-tags {
    display: none;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.5rem;
  }
  
  .nav-center {
    display: none;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-buttons {
    flex-direction: column;
  }
  
  .btn {
    text-align: center;
    justify-content: center;
  }
}
  </style>
</head>
<body>

  <!-- Animated Stars Background -->
  <div class="stars" id="stars"></div>

  <!-- Header -->
  <header>
    <div class="container">
      <nav>
        <a href="/" class="logo">
          <div class="logo-icon">
            ${WEB_SVG_ICONS.shield}
          </div>
        </a>
        
        <div class="nav-center">
          <a href="#commands" class="nav-link">Commands</a>
          <a href="/stats" class="nav-link">Status</a>
          <a href="#docs" class="nav-link">Docs</a>
          <a href="#faq" class="nav-link">FAQ</a>
        </div>
        
        <div class="nav-right">
          <a href="#dashboard" class="btn-dashboard">
            ${WEB_SVG_ICONS.discord}
            Dashboard
            <span class="coming-soon-badge">COMING SOON</span>
          </a>
        </div>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1 class="hero-title">
          ${botName.toLowerCase()} 
          <svg class="verified-badge" width="32" height="32" viewBox="0 0 16 15.2" fill="none">
            <path d="M8 0L9.76 5.47H15.6L10.92 8.85L12.68 14.32L8 10.94L3.32 14.32L5.08 8.85L0.4 5.47H6.24L8 0Z" fill="#5865f2"/>
            <path d="M6.5 8.5L7.5 9.5L10 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          is Discord's premier all-in-one app
        </h1>
        <p class="hero-subtitle">Meet the leading bot for management and engagement. Built to elevate your community's experience, streamline server management, and provide you access to premium resources for every necessity.</p>
        
        <div class="hero-buttons">
          <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID || ''}&permissions=8&scope=bot%20applications.commands" class="btn btn-primary">
            ${WEB_SVG_ICONS.lightning}
            Invite to Discord
          </a>
          <a href="#purchase" class="btn btn-secondary">
            Purchase
            ${WEB_SVG_ICONS.arrowRight}
          </a>
        </div>
      </div>
      
      <!-- Floating Tags -->
      <div class="floating-tags">
        <div class="tag">
          ${WEB_SVG_ICONS.trophy}
          <span>vanity rewards</span>
        </div>
        <div class="tag">
          ${WEB_SVG_ICONS.instagram}
          <span>social media</span>
        </div>
        <div class="tag">
          ${WEB_SVG_ICONS.users}
          <span>role features</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer Stats -->
  <footer>
    <div class="container">
      <p class="footer-stats">
        Powering <strong>${stats.servers.toLocaleString()}</strong> servers across <strong>${stats.users.toLocaleString()}</strong> communities
      </p>
    </div>
  </footer>

  <script>
    // Generate animated stars
    const starsContainer = document.getElementById('stars');
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (Math.random() * 2 + 2) + 's';
      starsContainer.appendChild(star);
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>`;
}
