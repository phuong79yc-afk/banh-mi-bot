// Landing page inspired by bleed.bot minimalist design
export function renderBleedStyleLanding(botName: string, stats: { servers: number; users: number; commands: number }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${botName} - Discord Bot</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #0a0a0f;
  --text: #e4e4e7;
  --text-muted: #71717a;
  --accent: #8b5cf6;
  --accent-dark: #6d28d9;
  --border: rgba(255, 255, 255, 0.05);
  --card-bg: rgba(255, 255, 255, 0.02);
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Background gradient */
.bg-gradient {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15), transparent),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(109, 40, 217, 0.1), transparent);
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Header */
header {
  padding: 2rem 0;
  border-bottom: 1px solid var(--border);
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
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
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
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--text);
}

.btn {
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-dark);
  transform: translateY(-1px);
}

/* Hero Section */
.hero {
  padding: 8rem 0 6rem;
  text-align: center;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.03em;
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  margin-bottom: 2.5rem;
  font-weight: 400;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
}

.btn-large {
  padding: 0.9rem 2rem;
  font-size: 1rem;
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Stats */
.stats {
  display: flex;
  gap: 3rem;
  justify-content: center;
  padding: 2rem 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  display: block;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

/* Commands Section */
.commands-section {
  padding: 6rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
}

/* Command Cards */
.commands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.command-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s;
}

.command-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
  transform: translateY(-2px);
}

.command-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.command-icon {
  width: 48px;
  height: 48px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.command-title {
  font-size: 1.2rem;
  font-weight: 700;
}

.command-desc {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* Command Examples */
.command-example {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.cmd-prefix {
  color: var(--accent);
  font-weight: 700;
}

.cmd-name {
  color: #60a5fa;
  font-weight: 600;
}

.cmd-param {
  color: #34d399;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 4rem;
}

.feature-item {
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.3s;
}

.feature-item:hover {
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.feature-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* Footer */
footer {
  padding: 3rem 0;
  text-align: center;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .nav-links {
    display: none;
  }
  
  .stats {
    flex-direction: column;
    gap: 2rem;
  }
  
  .commands-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }
}
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  
  <!-- Header -->
  <header>
    <div class="container">
      <nav>
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
          <a href="#commands" class="nav-link">Commands</a>
          <a href="#features" class="nav-link">Features</a>
          <a href="/stats" class="nav-link">Stats</a>
          <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID || ''}&permissions=8&scope=bot%20applications.commands" class="btn btn-primary">Add to Discord</a>
        </div>
      </nav>
    </div>
  </header>

  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <h1 class="hero-title">${botName}</h1>
      <p class="hero-subtitle">Meet the leading bot for management and engagement.</p>
      <div class="hero-buttons">
        <a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID || ''}&permissions=8&scope=bot%20applications.commands" class="btn btn-primary btn-large">
          Invite to Discord
        </a>
        <a href="#commands" class="btn btn-secondary btn-large">View Commands</a>
      </div>
      
      <!-- Stats -->
      <div class="stats">
        <div class="stat">
          <span class="stat-value">${stats.servers.toLocaleString()}</span>
          <span class="stat-label">Servers</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.users.toLocaleString()}</span>
          <span class="stat-label">Users</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.commands.toLocaleString()}+</span>
          <span class="stat-label">Commands</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Commands Section -->
  <section class="commands-section" id="commands">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Powerful Commands</h2>
        <p class="section-subtitle">Everything you need to manage and grow your community</p>
      </div>
      
      <div class="commands-grid">
        <!-- Moderation -->
        <div class="command-card">
          <div class="command-header">
            <div class="command-icon">🛡️</div>
            <h3 class="command-title">Moderation</h3>
          </div>
          <p class="command-desc">Powerful moderation tools to keep your server safe and clean.</p>
          <div class="command-example">
            <span class="cmd-prefix">/</span><span class="cmd-name">ban</span> <span class="cmd-param">[user] [reason]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">kick</span> <span class="cmd-param">[user] [reason]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">mute</span> <span class="cmd-param">[user] [duration]</span>
          </div>
        </div>

        <!-- Utility -->
        <div class="command-card">
          <div class="command-header">
            <div class="command-icon">⚙️</div>
            <h3 class="command-title">Utility</h3>
          </div>
          <p class="command-desc">Helpful utilities for server management and user convenience.</p>
          <div class="command-example">
            <span class="cmd-prefix">/</span><span class="cmd-name">userinfo</span> <span class="cmd-param">[user]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">serverinfo</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">avatar</span> <span class="cmd-param">[user]</span>
          </div>
        </div>

        <!-- Fun -->
        <div class="command-card">
          <div class="command-header">
            <div class="command-icon">🎮</div>
            <h3 class="command-title">Entertainment</h3>
          </div>
          <p class="command-desc">Engage your community with fun and interactive commands.</p>
          <div class="command-example">
            <span class="cmd-prefix">/</span><span class="cmd-name">meme</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">8ball</span> <span class="cmd-param">[question]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">trivia</span>
          </div>
        </div>

        <!-- Leveling -->
        <div class="command-card">
          <div class="command-header">
            <div class="command-icon">📊</div>
            <h3 class="command-title">Leveling</h3>
          </div>
          <p class="command-desc">Track member activity and reward engagement with levels.</p>
          <div class="command-example">
            <span class="cmd-prefix">/</span><span class="cmd-name">rank</span> <span class="cmd-param">[user]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">leaderboard</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">setxp</span> <span class="cmd-param">[user] [amount]</span>
          </div>
        </div>

        <!-- Auto-Mod -->
        <div class="command-card">
          <div class="command-header">
            <div class="command-icon">🤖</div>
            <h3 class="command-title">Auto-Moderation</h3>
          </div>
          <p class="command-desc">Automated protection against spam, raids, and malicious content.</p>
          <div class="command-example">
            <span class="cmd-prefix">/</span><span class="cmd-name">antiraid</span> <span class="cmd-param">[enable/disable]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">antispam</span> <span class="cmd-param">[settings]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">wordfilter</span> <span class="cmd-param">[add/remove]</span>
          </div>
        </div>

        <!-- Custom -->
        <div class="command-card">
          <div class="command-header">
            <div class="command-icon">✨</div>
            <h3 class="command-title">Customization</h3>
          </div>
          <p class="command-desc">Customize the bot to fit your server's unique needs.</p>
          <div class="command-example">
            <span class="cmd-prefix">/</span><span class="cmd-name">prefix</span> <span class="cmd-param">[new prefix]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">setwelcome</span> <span class="cmd-param">[message]</span><br>
            <span class="cmd-prefix">/</span><span class="cmd-name">autorole</span> <span class="cmd-param">[role]</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="commands-section" id="features">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Why Choose ${botName}?</h2>
        <p class="section-subtitle">Built for performance, designed for simplicity</p>
      </div>
      
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <h3 class="feature-name">Lightning Fast</h3>
          <p class="feature-desc">Optimized for speed with instant command responses</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <h3 class="feature-name">Secure</h3>
          <p class="feature-desc">Advanced security features to protect your community</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🎨</div>
          <h3 class="feature-name">Customizable</h3>
          <p class="feature-desc">Tailor every aspect to match your server's style</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <h3 class="feature-name">Analytics</h3>
          <p class="feature-desc">Detailed insights into your server's activity</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">💎</div>
          <h3 class="feature-name">Premium Quality</h3>
          <p class="feature-desc">Enterprise features at an affordable price</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🌐</div>
          <h3 class="feature-name">24/7 Uptime</h3>
          <p class="feature-desc">Always online, always ready to serve</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>© 2024 ${botName}. All rights reserved.</p>
    </div>
  </footer>

  <script>
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

    // Fade-in animation on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.command-card, .feature-item').forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'all 0.5s ease ' + (index * 0.05) + 's';
      observer.observe(el);
    });
  </script>
</body>
</html>`;
}
