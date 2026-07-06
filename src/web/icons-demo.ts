// Demo page showing all available SVG icons
import { WEB_SVG_ICONS } from './svg-icons-web';

export function renderIconsDemo(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SVG Icons Demo</title>
  <style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #0d0d0d;
  color: #ffffff;
  padding: 3rem 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  text-align: center;
  color: #9ca3af;
  margin-bottom: 3rem;
  font-size: 1.1rem;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.icon-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  cursor: pointer;
}

.icon-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
}

.icon-display {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5865f2;
}

.icon-display svg {
  width: 100%;
  height: 100%;
}

.icon-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
}

.icon-code {
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.examples {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-top: 3rem;
}

.example-item {
  margin-bottom: 2rem;
}

.example-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #5865f2;
}

.example-preview {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.btn-demo {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-demo:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.feature-card-demo {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feature-icon-demo {
  width: 48px;
  height: 48px;
  background: rgba(88, 101, 242, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5865f2;
  flex-shrink: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.icon-spin {
  animation: spin 2s linear infinite;
}

.icon-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.icon-glow {
  filter: drop-shadow(0 0 10px currentColor);
}

@media (max-width: 768px) {
  .icons-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  h1 {
    font-size: 2rem;
  }
}
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 SVG Icons Gallery</h1>
    <p class="subtitle">25 beautiful SVG icons for your Discord bot landing page</p>

    <!-- All Icons Grid -->
    <div class="section">
      <h2 class="section-title">📦 All Available Icons</h2>
      <div class="icons-grid">
        ${Object.keys(WEB_SVG_ICONS).map(iconName => `
          <div class="icon-card">
            <div class="icon-display">
              ${WEB_SVG_ICONS[iconName as keyof typeof WEB_SVG_ICONS]}
            </div>
            <div class="icon-name">${iconName}</div>
            <div class="icon-code">\${WEB_SVG_ICONS.${iconName}}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Usage Examples -->
    <div class="examples">
      <h2 class="section-title">💡 Usage Examples</h2>

      <div class="example-item">
        <div class="example-title">1. Button với Icon</div>
        <div class="example-preview">
          <button class="btn-demo">
            ${WEB_SVG_ICONS.lightning}
            Invite to Discord
          </button>
          <button class="btn-demo">
            ${WEB_SVG_ICONS.gem}
            Premium Features
          </button>
          <button class="btn-demo">
            ${WEB_SVG_ICONS.rocket}
            Get Started
          </button>
        </div>
      </div>

      <div class="example-item">
        <div class="example-title">2. Feature Card</div>
        <div class="example-preview">
          <div class="feature-card-demo">
            <div class="feature-icon-demo">
              ${WEB_SVG_ICONS.shield}
            </div>
            <div>
              <h3 style="margin-bottom: 0.5rem;">Premium Security</h3>
              <p style="color: #9ca3af; margin: 0;">Protect your server with advanced security features</p>
            </div>
          </div>
        </div>
      </div>

      <div class="example-item">
        <div class="example-title">3. Icons với Animation</div>
        <div class="example-preview" style="display: flex; gap: 2rem; justify-content: center;">
          <div style="text-align: center;">
            <div style="font-size: 48px; color: #5865f2;" class="icon-spin">
              ${WEB_SVG_ICONS.settings}
            </div>
            <p style="margin-top: 0.5rem; color: #9ca3af;">Spinning</p>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 48px; color: #ffd700;" class="icon-pulse">
              ${WEB_SVG_ICONS.star}
            </div>
            <p style="margin-top: 0.5rem; color: #9ca3af;">Pulsing</p>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 48px; color: #ff6347;" class="icon-glow">
              ${WEB_SVG_ICONS.fire}
            </div>
            <p style="margin-top: 0.5rem; color: #9ca3af;">Glowing</p>
          </div>
        </div>
      </div>

      <div class="example-item">
        <div class="example-title">4. Colored Icons</div>
        <div class="example-preview" style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
          <div style="font-size: 48px; color: #5865f2;">${WEB_SVG_ICONS.discord}</div>
          <div style="font-size: 48px; color: #57f287;">${WEB_SVG_ICONS.check}</div>
          <div style="font-size: 48px; color: #fee75c;">${WEB_SVG_ICONS.crown}</div>
          <div style="font-size: 48px; color: #ed4245;">${WEB_SVG_ICONS.fire}</div>
          <div style="font-size: 48px; color: #9146ff;">${WEB_SVG_ICONS.sparkles}</div>
          <div style="font-size: 48px; color: #00ced1;">${WEB_SVG_ICONS.gem}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: #9ca3af;">
        Xem hướng dẫn chi tiết tại <strong style="color: #5865f2;">WEB-SVG-ICONS-GUIDE.md</strong>
      </p>
      <p style="color: #9ca3af; margin-top: 1rem;">
        <a href="/" style="color: #5865f2; text-decoration: none;">← Quay lại trang chủ</a>
      </p>
    </div>
  </div>

  <script>
    // Click to copy icon code
    document.querySelectorAll('.icon-card').forEach(card => {
      card.addEventListener('click', () => {
        const code = card.querySelector('.icon-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
          card.style.background = 'rgba(87, 242, 135, 0.2)';
          card.style.borderColor = '#57f287';
          setTimeout(() => {
            card.style.background = '';
            card.style.borderColor = '';
          }, 1000);
        });
      });
    });
  </script>
</body>
</html>`;
}
