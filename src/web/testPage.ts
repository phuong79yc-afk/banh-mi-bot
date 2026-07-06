// Test page with advanced features showcase
export function renderTestPage(botName: string, stats: { servers: number; users: number; commands: number }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${botName} - Test Showcase</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #5865f2;
  --primary-dark: #4752c4;
  --bg-dark: #0a0a0a;
  --bg-card: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.08);
  --text: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.6);
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-dark);
  color: var(--text);
  overflow-x: hidden;
  line-height: 1.6;
}

/* Animated Background */
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

.content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 0;
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 800;
}

.logo-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(88, 101, 242, 0.2);
  border-color: var(--primary);
  transform: translateY(-2px);
}

/* Section */
.section {
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-desc {
  color: var(--text-muted);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* Grid Layout */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Card Styles */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.card:hover {
  border-color: var(--primary);
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(88, 101, 242, 0.3);
  background: rgba(88, 101, 242, 0.05);
}

.card:hover::before {
  opacity: 1;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(88, 101, 242, 0.05));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.card-text {
  color: var(--text-muted);
  line-height: 1.7;
}

/* Stats Cards */
.stat-card {
  text-align: center;
  padding: 2.5rem 2rem;
}

.stat-value {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--primary), #7289da);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  display: block;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

/* Interactive Demo */
.demo-box {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
}

.demo-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0.5rem;
}

.demo-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(88, 101, 242, 0.5);
}

.demo-button:active {
  transform: scale(0.95);
}

.demo-output {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(88, 101, 242, 0.1);
  border: 1px solid var(--primary);
  border-radius: 8px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--text-muted);
}

/* Progress Bars */
.progress-bar {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  height: 12px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #7289da);
  border-radius: 50px;
  transition: width 1s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Charts */
.chart {
  height: 200px;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, var(--primary), var(--primary-dark));
  border-radius: 8px 8px 0 0;
  transition: all 0.5s ease;
  cursor: pointer;
  position: relative;
}

.chart-bar:hover {
  filter: brightness(1.3);
  transform: translateY(-10px);
}

.chart-bar::before {
  content: attr(data-value);
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text);
  font-weight: 700;
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.chart-bar:hover::before {
  opacity: 1;
}

/* Glassmorphism Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Neon Glow Effect */
.neon-text {
  font-size: 2.5rem;
  font-weight: 900;
  text-align: center;
  color: var(--primary);
  text-shadow: 
    0 0 10px var(--primary),
    0 0 20px var(--primary),
    0 0 40px var(--primary),
    0 0 80px var(--primary);
  animation: neonPulse 2s ease-in-out infinite alternate;
}

@keyframes neonPulse {
  0% { 
    text-shadow: 
      0 0 10px var(--primary),
      0 0 20px var(--primary),
      0 0 40px var(--primary);
  }
  100% { 
    text-shadow: 
      0 0 20px var(--primary),
      0 0 40px var(--primary),
      0 0 80px var(--primary),
      0 0 120px var(--primary);
  }
}

/* Command Terminal */
.terminal {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #0f0;
  margin-top: 1rem;
}

.terminal-line {
  margin: 0.5rem 0;
}

.terminal-prompt {
  color: var(--primary);
}

/* Floating Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.floating {
  animation: float 3s ease-in-out infinite;
}

/* Tooltip */
.tooltip {
  position: relative;
  cursor: help;
  border-bottom: 2px dotted var(--primary);
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  margin-bottom: 5px;
}

.tooltip:hover::after {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .grid-2, .grid-3, .grid-4 {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 2rem;
  }
}
  </style>
</head>
<body>
  <div class="background"></div>
  
  <div class="content">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 50 Q 10 20 50 20 T 90 50 L 90 70 Q 50 85 10 70 Z" fill="#D2A679" stroke="#8B5A2B" stroke-width="2"/>
            <path d="M35 35 L 45 45 M50 30 L 60 40 M65 35 L 75 45" stroke="#8B5A2B" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <div>${botName}</div>
          <div style="font-size: 0.7rem; opacity: 0.6; font-weight: 500;">Test Showcase</div>
        </div>
      </div>
      <a href="/" class="back-btn">← Back to Home</a>
    </div>

    <!-- Stats Section -->
    <div class="section">
      <h2 class="section-title">Real-Time Statistics</h2>
      <p class="section-desc">Live data from your Discord bot</p>
      <div class="grid grid-3">
        <div class="card stat-card">
          <span class="stat-value" id="servers-count">${stats.servers}</span>
          <span class="stat-label">Servers</span>
        </div>
        <div class="card stat-card">
          <span class="stat-value" id="users-count">${stats.users}</span>
          <span class="stat-label">Users</span>
        </div>
        <div class="card stat-card">
          <span class="stat-value" id="commands-count">${stats.commands}</span>
          <span class="stat-label">Commands</span>
        </div>
      </div>
    </div>

    <!-- Interactive Demo -->
    <div class="section">
      <h2 class="section-title">Interactive Demo</h2>
      <p class="section-desc">Try out these interactive features</p>
      <div class="demo-box">
        <button class="demo-button" onclick="showAlert()">Show Alert</button>
        <button class="demo-button" onclick="changeColor()">Change Color</button>
        <button class="demo-button" onclick="animateText()">Animate Text</button>
        <button class="demo-button" onclick="fetchStats()">Fetch Stats</button>
        <div class="demo-output" id="demo-output">Click a button to see the magic! ✨</div>
      </div>
    </div>

    <!-- Progress Bars -->
    <div class="section">
      <h2 class="section-title">Progress Indicators</h2>
      <p class="section-desc">Animated progress bars showing bot capabilities</p>
      <div class="glass-card">
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Moderation</span>
            <span>95%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 95%;"></div>
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Entertainment</span>
            <span>88%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 88%;"></div>
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Utility</span>
            <span>92%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 92%;"></div>
          </div>
        </div>
        
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Security</span>
            <span>98%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 98%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Chart -->
    <div class="section">
      <h2 class="section-title">Activity Chart</h2>
      <p class="section-desc">Weekly command usage statistics</p>
      <div class="card">
        <div class="chart" id="chart">
          <div class="chart-bar" style="height: 60%;" data-value="120"></div>
          <div class="chart-bar" style="height: 80%;" data-value="160"></div>
          <div class="chart-bar" style="height: 45%;" data-value="90"></div>
          <div class="chart-bar" style="height: 95%;" data-value="190"></div>
          <div class="chart-bar" style="height: 70%;" data-value="140"></div>
          <div class="chart-bar" style="height: 85%;" data-value="170"></div>
          <div class="chart-bar" style="height: 50%;" data-value="100"></div>
        </div>
        <div style="display: flex; justify-content: space-around; margin-top: 1rem; color: var(--text-muted); font-size: 0.85rem;">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="section">
      <h2 class="section-title">Feature Highlights</h2>
      <p class="section-desc">Explore our amazing features</p>
      <div class="grid grid-3">
        <div class="card">
          <div class="card-icon floating">🛡️</div>
          <h3 class="card-title">Advanced Security</h3>
          <p class="card-text">Protect your server with anti-raid, anti-nuke, and smart filters.</p>
        </div>
        
        <div class="card">
          <div class="card-icon floating" style="animation-delay: 0.2s;">⚡</div>
          <h3 class="card-title">Lightning Fast</h3>
          <p class="card-text">Optimized performance for instant responses and smooth operation.</p>
        </div>
        
        <div class="card">
          <div class="card-icon floating" style="animation-delay: 0.4s;">🎨</div>
          <h3 class="card-title">Customizable</h3>
          <p class="card-text">Tailor everything to match your server's unique style and needs.</p>
        </div>
        
        <div class="card">
          <div class="card-icon floating" style="animation-delay: 0.6s;">📊</div>
          <h3 class="card-title">Analytics</h3>
          <p class="card-text">Track engagement with detailed stats and insights.</p>
        </div>
        
        <div class="card">
          <div class="card-icon floating" style="animation-delay: 0.8s;">🎮</div>
          <h3 class="card-title">Entertainment</h3>
          <p class="card-text">Keep members engaged with games, music, and fun commands.</p>
        </div>
        
        <div class="card">
          <div class="card-icon floating" style="animation-delay: 1s;">💎</div>
          <h3 class="card-title">Premium Quality</h3>
          <p class="card-text">Enterprise-grade features at an affordable price.</p>
        </div>
      </div>
    </div>

    <!-- Neon Section -->
    <div class="section">
      <h2 class="section-title">Special Effects</h2>
      <p class="section-desc">Eye-catching visual elements</p>
      <div class="glass-card" style="text-align: center;">
        <div class="neon-text">${botName}</div>
        <p style="margin-top: 2rem; color: var(--text-muted);">Powered by cutting-edge technology</p>
      </div>
    </div>

    <!-- Terminal Demo -->
    <div class="section">
      <h2 class="section-title">Command Terminal</h2>
      <p class="section-desc">See what's happening under the hood</p>
      <div class="card">
        <div class="terminal" id="terminal">
          <div class="terminal-line"><span class="terminal-prompt">$</span> bot.status</div>
          <div class="terminal-line">✓ Status: Online</div>
          <div class="terminal-line">✓ Servers: ${stats.servers}</div>
          <div class="terminal-line">✓ Users: ${stats.users}</div>
          <div class="terminal-line">✓ Commands loaded: ${stats.commands}</div>
          <div class="terminal-line"><span class="terminal-prompt">$</span> <span id="cursor">_</span></div>
        </div>
      </div>
    </div>

    <!-- Tooltips Demo -->
    <div class="section">
      <h2 class="section-title">Interactive Elements</h2>
      <p class="section-desc">Hover over the highlighted text to see tooltips</p>
      <div class="glass-card">
        <p style="font-size: 1.1rem; line-height: 2;">
          Our bot uses <span class="tooltip" data-tooltip="Advanced AI for content filtering">AI technology</span> to moderate your server, 
          provides <span class="tooltip" data-tooltip="Real-time analytics dashboard">live statistics</span>, 
          and includes <span class="tooltip" data-tooltip="Auto-role, welcome messages, logging">automation features</span> 
          that make management effortless.
        </p>
      </div>
    </div>

  </div>

  <script>
    // Demo functions
    function showAlert() {
      const output = document.getElementById('demo-output');
      output.textContent = '🎉 Alert triggered successfully!';
      output.style.background = 'rgba(88, 101, 242, 0.2)';
      setTimeout(() => {
        output.style.background = 'rgba(88, 101, 242, 0.1)';
      }, 2000);
    }

    function changeColor() {
      const output = document.getElementById('demo-output');
      const colors = [
        'rgba(88, 101, 242, 0.2)',
        'rgba(255, 99, 71, 0.2)',
        'rgba(50, 205, 50, 0.2)',
        'rgba(255, 215, 0, 0.2)',
        'rgba(147, 51, 234, 0.2)'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      output.style.background = randomColor;
      output.textContent = '🎨 Color changed! Click again for another color.';
    }

    function animateText() {
      const output = document.getElementById('demo-output');
      const texts = [
        '✨ Animation started!',
        '🚀 Launching...',
        '⚡ Processing...',
        '🎯 Target acquired!',
        '✅ Complete!'
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < texts.length) {
          output.textContent = texts[i];
          i++;
        } else {
          clearInterval(interval);
        }
      }, 500);
    }

    async function fetchStats() {
      const output = document.getElementById('demo-output');
      output.textContent = '⏳ Fetching live data...';
      
      try {
        const response = await fetch('/stats');
        const data = await response.json();
        output.textContent = \`📊 Live Stats: \${data.servers} servers, \${data.users} users, Ping: \${data.ping}ms\`;
        
        // Update counters with animation
        animateCounter('servers-count', data.servers);
        animateCounter('users-count', data.users);
        animateCounter('commands-count', data.commands);
      } catch (error) {
        output.textContent = '❌ Failed to fetch stats. Try again!';
      }
    }

    function animateCounter(id, target) {
      const element = document.getElementById(id);
      const current = parseInt(element.textContent);
      const increment = (target - current) / 30;
      let count = current;
      
      const timer = setInterval(() => {
        count += increment;
        if ((increment > 0 && count >= target) || (increment < 0 && count <= target)) {
          element.textContent = target.toLocaleString();
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(count).toLocaleString();
        }
      }, 30);
    }

    // Cursor blinking animation
    let cursorVisible = true;
    setInterval(() => {
      const cursor = document.getElementById('cursor');
      if (cursor) {
        cursor.style.opacity = cursorVisible ? '0' : '1';
        cursorVisible = !cursorVisible;
      }
    }, 500);

    // Auto-update stats every 5 seconds
    setInterval(() => {
      fetch('/stats')
        .then(res => res.json())
        .then(data => {
          document.getElementById('servers-count').textContent = data.servers.toLocaleString();
          document.getElementById('users-count').textContent = data.users.toLocaleString();
          document.getElementById('commands-count').textContent = data.commands.toLocaleString();
        })
        .catch(err => console.error('Failed to update stats:', err));
    }, 5000);

    // Animate chart bars on load
    window.addEventListener('load', () => {
      const bars = document.querySelectorAll('.chart-bar');
      bars.forEach((bar, index) => {
        const height = bar.style.height;
        bar.style.height = '0%';
        setTimeout(() => {
          bar.style.height = height;
        }, index * 100);
      });
    });
  </script>
</body>
</html>`;
}
