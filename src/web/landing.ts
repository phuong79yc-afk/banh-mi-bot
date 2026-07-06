// Landing page matching bleed.bot design
export function renderLandingPage(botName: string, stats: { servers: number; users: number; commands: number }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${botName} - Discord's Premier All-in-One App</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  overflow-x: hidden;
  line-height: 1.5;
  position: relative;
}

/* Floating particles animation */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
}

.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, rgba(88, 101, 242, 0.8), transparent);
  border-radius: 50%;
  animation: float 15s infinite ease-in-out;
}

/* Animated Grid Background */
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88, 101, 242, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(114, 137, 218, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 50% at 100% 100%, rgba(114, 137, 218, 0.15) 0%, transparent 50%);
}

.grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size: 80px 80px;
  z-index: 0;
  animation: gridMove 30s linear infinite;
  opacity: 0.4;
}

@keyframes gridMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(80px); }
}

/* Spotlight effect */
.spotlight {
  position: fixed;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(88, 101, 242, 0.15), transparent 70%);
  pointer-events: none;
  z-index: 1;
  transition: all 0.3s ease;
}

.content {
  position: relative;
  z-index: 1;
}

/* Header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1.5rem 3rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
  letter-spacing: -0.02em;
}

.logo-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}

.nav-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #fff;
}

/* Hero Section */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8rem 2rem 4rem;
}

.hero-content {
  max-width: 900px;
}

.hero-title {
  font-size: 5rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 80px rgba(88, 101, 242, 0.3);
  animation: titleGlow 3s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  0% { filter: drop-shadow(0 0 20px rgba(88, 101, 242, 0.3)); }
  100% { filter: drop-shadow(0 0 40px rgba(88, 101, 242, 0.5)); }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 3rem;
  line-height: 1.7;
  font-weight: 400;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-primary {
  background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%);
  color: white;
  box-shadow: 
    0 4px 20px rgba(88, 101, 242, 0.4),
    0 0 40px rgba(88, 101, 242, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4752c4 0%, #3c44a8 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 6px 30px rgba(88, 101, 242, 0.6),
    0 0 60px rgba(88, 101, 242, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(88, 101, 242, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(88, 101, 242, 0.2);
}

.btn-secondary:hover::before {
  opacity: 1;
}

/* Stats Section */
.stats {
  padding: 6rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
}

.stats-title {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  margin-bottom: 4rem;
}

.stats-number {
  color: #fff;
  font-weight: 700;
}

.servers-carousel {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.server-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(88, 101, 242, 0.05));
  border: 1px solid rgba(88, 101, 242, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(88, 101, 242, 0.2);
}

.server-icon:hover {
  transform: translateY(-8px) scale(1.05);
  border-color: rgba(88, 101, 242, 0.5);
  box-shadow: 
    0 12px 32px rgba(88, 101, 242, 0.4),
    0 0 60px rgba(88, 101, 242, 0.2);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.25), rgba(88, 101, 242, 0.1));
}

.server-icon svg {
  opacity: 0.6;
}

/* Features Section */
.features {
  padding: 8rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.features-header {
  text-align: center;
  margin-bottom: 5rem;
}

.features-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(88, 101, 242, 0.05));
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 
    0 8px 32px rgba(88, 101, 242, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.features-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
}

.features-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 3rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(88, 101, 242, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}

.feature-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.3), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s;
}

.feature-card:hover {
  border-color: rgba(88, 101, 242, 0.4);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 60px rgba(88, 101, 242, 0.25),
    0 0 80px rgba(88, 101, 242, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.08) 0%, rgba(88, 101, 242, 0.02) 100%);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:hover::after {
  opacity: 1;
}

.feature-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.feature-description {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.7;
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

.feature-tags {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.feature-tag {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.feature-tag::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(88, 101, 242, 0.05));
  opacity: 0;
  transition: opacity 0.3s;
}

.feature-tag:hover {
  background: rgba(88, 101, 242, 0.15);
  border-color: rgba(88, 101, 242, 0.4);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
}

.feature-tag:hover::before {
  opacity: 1;
}

/* Footer */
.footer {
  padding: 4rem 2rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.5);
}

.footer-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.95rem;
}

/* Scroll Reveal Animations */
.reveal {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}

.reveal-delay-1 {
  transition-delay: 0.1s;
}

.reveal-delay-2 {
  transition-delay: 0.2s;
}

.reveal-delay-3 {
  transition-delay: 0.3s;
}

.reveal-left {
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-left.active {
  opacity: 1;
  transform: translateX(0);
}

.reveal-right {
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-right.active {
  opacity: 1;
  transform: translateX(0);
}

.reveal-scale {
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-scale.active {
  opacity: 1;
  transform: scale(1);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }
  
  .features-title {
    font-size: 2.5rem;
  }
  
  .nav-links {
    display: none;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    padding: 1rem 1.5rem;
  }
}
  </style>
</head>
<body>
  <div class="background"></div>
  <div class="grid-overlay"></div>
  <div class="spotlight" id="spotlight"></div>
  
  <div class="content">
    <!-- Header -->
    <header class="header">
      <nav class="nav">
        <a href="/" class="logo">
          <div class="logo-icon">
            <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 50 Q 10 20 50 20 T 90 50 L 90 70 Q 50 85 10 70 Z" fill="#D2A679" stroke="#8B5A2B" stroke-width="2"/>
              <path d="M35 35 L 45 45 M50 30 L 60 40 M65 35 L 75 45" stroke="#8B5A2B" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <span>${botName}</span>
        </a>
        <div class="nav-links">
          <a href="#features" class="nav-link">Features</a>
          <a href="#commands" class="nav-link">Commands</a>
          <a href="/stats" class="nav-link">Status</a>
          <a href="/auth/discord" class="btn btn-primary">Dashboard</a>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">${botName}</h1>
        <p class="hero-subtitle">Meet the leading bot for management and engagement.</p>
        <div class="hero-buttons">
          <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID || ''}&permissions=8&scope=bot%20applications.commands" class="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
            </svg>
            Invite to Discord
          </a>
          <a href="#features" class="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Purchase
          </a>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats reveal">
      <p class="stats-title">Powering <span class="stats-number">${stats.servers.toLocaleString()}</span> servers across <span class="stats-number">${stats.users.toLocaleString()}</span> communities</p>
      <div class="servers-carousel">
        <div class="server-icon reveal-scale reveal-delay-1">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" opacity="0.6"/>
          </svg>
        </div>
        <div class="server-icon reveal-scale reveal-delay-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" opacity="0.6"/>
          </svg>
        </div>
        <div class="server-icon reveal-scale reveal-delay-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" opacity="0.6"/>
          </svg>
        </div>
        <div class="server-icon reveal-scale reveal-delay-1">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" opacity="0.6"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features reveal" id="features">
      <div class="features-header">
        <div class="features-icon reveal-scale">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5865f2" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h2 class="features-title">Premium Moderation<br/>and Security</h2>
        <p class="features-subtitle">We provide you with the best tools, to keep your community clean and secure.</p>
      </div>
      
      <div class="features-grid">
        <!-- Filters -->
        <div class="feature-card">
          <h3 class="feature-title">Filters</h3>
          <p class="feature-description">Keep any chat clean with our many automated filtering options.</p>
          <div class="feature-tags">
            <span class="feature-tag">Links</span>
            <span class="feature-tag">Mass Mentions</span>
            <span class="feature-tag">Spoilers</span>
            <span class="feature-tag">Invites</span>
          </div>
        </div>

        <!-- Fake Permissions -->
        <div class="feature-card">
          <h3 class="feature-title">Fake Permissions</h3>
          <p class="feature-description">Remove all dangerous Discord permissions that can be used for malicious reasons through API.</p>
          <div class="feature-tags">
            <span class="feature-tag">Security</span>
            <span class="feature-tag">API Protection</span>
          </div>
        </div>

        <!-- Anti-Raid -->
        <div class="feature-card">
          <h3 class="feature-title">Anti-Raid</h3>
          <p class="feature-description">Protect against targeted bot raids on your server, with our mass join, avatar and account age anti-raid filters.</p>
          <div class="feature-tags">
            <span class="feature-tag">Mass Join</span>
            <span class="feature-tag">Avatar Filter</span>
            <span class="feature-tag">Account Age</span>
          </div>
        </div>

        <!-- Anti-Nuke -->
        <div class="feature-card">
          <h3 class="feature-title">Anti-Nuke</h3>
          <p class="feature-description">Easily prevent your server from malicious attacks and griefing, with a customizable threshold set by you.</p>
          <div class="feature-tags">
            <span class="feature-tag">Channel Protection</span>
            <span class="feature-tag">Role Protection</span>
            <span class="feature-tag">Ban Protection</span>
          </div>
        </div>

        <!-- Leveling System -->
        <div class="feature-card">
          <h3 class="feature-title">Leveling System</h3>
          <p class="feature-description">Engage your community with a fully customizable leveling system with XP multipliers, role rewards, and leaderboards.</p>
          <div class="feature-tags">
            <span class="feature-tag">Leaderboard</span>
            <span class="feature-tag">Role Rewards</span>
            <span class="feature-tag">XP Boost</span>
          </div>
        </div>

        <!-- Utility Commands -->
        <div class="feature-card">
          <h3 class="feature-title">100+ Commands</h3>
          <p class="feature-description">Access to over ${stats.commands}+ premium commands for moderation, fun, utility, and more.</p>
          <div class="feature-tags">
            <span class="feature-tag">Fun</span>
            <span class="feature-tag">Utility</span>
            <span class="feature-tag">Moderation</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Integration Section -->
    <section class="features reveal">
      <div class="features-header">
        <div class="features-icon reveal-scale">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5865f2" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </div>
        <h2 class="features-title">Integrations with your<br/>favorite Platforms</h2>
        <p class="features-subtitle">Effortlessly track, view, search, play, notify updates and more from many platforms.</p>
      </div>
      
      <div class="features-grid">
        <!-- Weather -->
        <div class="feature-card">
          <h3 class="feature-title">Weather</h3>
          <p class="feature-description">Get real-time weather information for any location worldwide with detailed forecasts.</p>
          <div class="feature-tags">
            <span class="feature-tag">Current Weather</span>
            <span class="feature-tag">Forecasts</span>
          </div>
        </div>

        <!-- Social Media -->
        <div class="feature-card">
          <h3 class="feature-title">Social Media</h3>
          <p class="feature-description">Track and notify about new posts from your favorite social media platforms.</p>
          <div class="feature-tags">
            <span class="feature-tag">Notifications</span>
            <span class="feature-tag">Auto-Post</span>
          </div>
        </div>

        <!-- Auto-Moderation -->
        <div class="feature-card">
          <h3 class="feature-title">Auto-Moderation</h3>
          <p class="feature-description">Automated moderation tools to keep your server safe with customizable rules and actions.</p>
          <div class="feature-tags">
            <span class="feature-tag">Word Filter</span>
            <span class="feature-tag">Spam Protection</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Voice Features -->
    <section class="features reveal">
      <div class="features-header">
        <div class="features-icon reveal-scale">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5865f2" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        </div>
        <h2 class="features-title">Personal channels<br/>with Voicemaster</h2>
        <p class="features-subtitle">Temporary personalized voice channels for your community.</p>
      </div>
      
      <div class="features-grid">
        <div class="feature-card">
          <h3 class="feature-title">Voicemaster Interface</h3>
          <p class="feature-description">Powerful control for your personal voice channel, with an intuitive, built-in chat interface.</p>
          <div class="feature-tags">
            <span class="feature-tag">Lock/Unlock</span>
            <span class="feature-tag">Hide/Show</span>
            <span class="feature-tag">Mute Controls</span>
            <span class="feature-tag">Rename</span>
            <span class="feature-tag">User Limit</span>
            <span class="feature-tag">Add/Remove Users</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p class="footer-text">© 2024 ${botName}. All rights reserved. • Built with ❤️ for Discord communities</p>
    </footer>
  </div>

  <script>
    // Scroll Reveal Animation
    function reveal() {
      const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      
      reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    }

    // Run on load and scroll
    window.addEventListener('scroll', reveal);
    window.addEventListener('load', reveal);
    reveal(); // Initial check

    // Spotlight effect following cursor
    const spotlight = document.getElementById('spotlight');
    document.addEventListener('mousemove', (e) => {
      if (spotlight) {
        spotlight.style.left = (e.clientX - 300) + 'px';
        spotlight.style.top = (e.clientY - 300) + 'px';
      }
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Fade-in animations for feature cards
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'all 0.6s ease ' + (index * 0.1) + 's';
      observer.observe(card);
    });

    // Parallax effect
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const parallaxElements = document.querySelectorAll('.background, .grid-overlay');
          parallaxElements.forEach(el => {
            el.style.transform = 'translateY(' + (scrolled * 0.5) + 'px)';
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  </script>
</body>
</html>`;
}
