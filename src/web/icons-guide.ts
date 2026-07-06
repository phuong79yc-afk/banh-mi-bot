// import { WEB_SVG_ICONS } from './svg-icons-web.js';

// Temporary placeholder
const WEB_SVG_ICONS: Record<string, string> = {
  star: '<svg>...</svg>',
  fire: '<svg>...</svg>',
  shield: '<svg>...</svg>'
};

export function renderIconsGuide(): string {
  const iconNames = Object.keys(WEB_SVG_ICONS) as (keyof typeof WEB_SVG_ICONS)[];

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hướng Dẫn SVG Icons - Bánh Mì Bot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
      color: #fff;
      line-height: 1.6;
      overflow-x: hidden;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 60px;
      animation: fadeInDown 0.8s ease;
    }

    .header h1 {
      font-size: 3.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #a855f7 0%, #f97316 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
      animation: gradientShift 3s ease infinite;
    }

    .header p {
      font-size: 1.2rem;
      color: #94a3b8;
      max-width: 800px;
      margin: 0 auto 30px;
    }

    .stats-bar {
      display: flex;
      gap: 30px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 30px;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 15px 30px;
      transition: all 0.3s ease;
    }

    .stat-item:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-3px);
    }

    .stat-item .number {
      font-size: 2rem;
      font-weight: 700;
      color: #ff4569;
    }

    .stat-item .label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 40px;
      flex-wrap: wrap;
      animation: fadeIn 1s ease 0.3s backwards;
    }

    .tab-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 12px 30px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      font-family: 'Poppins', sans-serif;
    }

    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #ff1744 0%, #ff4569 100%);
      border-color: #ff1744;
      box-shadow: 0 8px 30px rgba(255, 23, 68, 0.3);
    }

    /* Icons Grid */
    .icons-section {
      animation: fadeIn 1s ease 0.5s backwards;
    }

    .section-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 30px;
      text-align: center;
      color: #fff;
    }

    .icons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 25px;
      margin-bottom: 60px;
    }

    .icon-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .icon-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 23, 68, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .icon-card:hover {
      transform: translateY(-8px) scale(1.05);
      border-color: #ff1744;
      box-shadow: 0 15px 50px rgba(255, 23, 68, 0.3);
    }

    .icon-card:hover::before {
      opacity: 1;
    }

    .icon-display {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ff4569;
      transition: all 0.4s ease;
      position: relative;
      z-index: 1;
    }

    .icon-card:hover .icon-display {
      transform: rotateY(360deg) scale(1.2);
      color: #a855f7;
    }

    .icon-display svg {
      width: 100%;
      height: 100%;
    }

    .icon-name {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 10px;
      color: #fff;
      position: relative;
      z-index: 1;
    }

    .icon-code {
      font-size: 0.75rem;
      color: #64748b;
      font-family: 'Courier New', monospace;
      background: rgba(0, 0, 0, 0.3);
      padding: 5px 10px;
      border-radius: 5px;
      position: relative;
      z-index: 1;
      word-break: break-all;
    }

    /* Code Examples */
    .code-section {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 40px;
      animation: fadeIn 1s ease 0.7s backwards;
    }

    .code-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #ff4569;
    }

    .code-block {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 20px;
      position: relative;
      overflow-x: auto;
    }

    .code-block pre {
      color: #e2e8f0;
      font-family: 'Courier New', monospace;
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .copy-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(255, 23, 68, 0.8);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.3s ease;
      font-family: 'Poppins', sans-serif;
    }

    .copy-btn:hover {
      background: #ff1744;
      transform: scale(1.05);
    }

    .copy-btn.copied {
      background: #10b981;
    }

    /* Color Examples */
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .color-demo {
      text-align: center;
    }

    .color-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 15px;
      transition: all 0.3s ease;
    }

    .color-icon:hover {
      transform: scale(1.1) rotate(5deg);
    }

    .color-label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes gradientShift {
      0%, 100% {
        background: linear-gradient(135deg, #a855f7 0%, #f97316 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      50% {
        background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header h1 {
        font-size: 2.5rem;
      }

      .icons-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      }

      .icon-card {
        padding: 20px;
      }

      .code-section {
        padding: 25px;
      }
    }

    /* Toast notification */
    .toast {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #10b981;
      color: #fff;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateY(100px);
      transition: all 0.3s ease;
      z-index: 1000;
      font-weight: 600;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📦 Thư Viện SVG Icons</h1>
      <p>Toàn bộ icons được sử dụng trong Bánh Mì Bot. Copy code và sử dụng ngay!</p>
      
      <div class="stats-bar">
        <div class="stat-item">
          <div class="number">${iconNames.length}</div>
          <div class="label">Icons</div>
        </div>
        <div class="stat-item">
          <div class="number">100%</div>
          <div class="label">Vector SVG</div>
        </div>
        <div class="stat-item">
          <div class="number">Free</div>
          <div class="label">Miễn phí</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="showTab('all')">Tất cả Icons</button>
      <button class="tab-btn" onclick="showTab('code')">Code Examples</button>
      <button class="tab-btn" onclick="showTab('colors')">Màu sắc</button>
    </div>

    <!-- All Icons Tab -->
    <div id="tab-all" class="tab-content">
      <div class="icons-section">
        <h2 class="section-title">Tất cả Icons (${iconNames.length})</h2>
        <div class="icons-grid">
          ${iconNames.map(name => `
            <div class="icon-card" onclick="copyIconCode('${name}')">
              <div class="icon-display">
                ${WEB_SVG_ICONS[name]}
              </div>
              <div class="icon-name">${name}</div>
              <div class="icon-code">${name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Code Examples Tab -->
    <div id="tab-code" class="tab-content" style="display: none;">
      <div class="code-section">
        <h3 class="code-title">1. Import Icons</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>import { WEB_SVG_ICONS } from './svg-icons-web.js';</pre>
        </div>
      </div>

      <div class="code-section">
        <h3 class="code-title">2. Sử dụng trong HTML</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>&lt;div class="icon-wrapper"&gt;
  \${WEB_SVG_ICONS.shield}
&lt;/div&gt;</pre>
        </div>
      </div>

      <div class="code-section">
        <h3 class="code-title">3. Tùy chỉnh màu sắc với CSS</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>.icon-wrapper {
  color: #ff1744; /* Đỏ */
  width: 32px;
  height: 32px;
}

.icon-wrapper:hover {
  color: #a855f7; /* Tím */
  transform: scale(1.2);
}</pre>
        </div>
      </div>

      <div class="code-section">
        <h3 class="code-title">4. Animations</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>/* Xoay icon */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-wrapper:hover svg {
  animation: rotate 0.6s ease;
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.icon-wrapper:hover {
  animation: bounce 0.5s ease;
}</pre>
        </div>
      </div>

      <div class="code-section">
        <h3 class="code-title">5. Gradient Fill</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>&lt;svg&gt;
  &lt;defs&gt;
    &lt;linearGradient id="gradient1"&gt;
      &lt;stop offset="0%" stop-color="#ff1744"/&gt;
      &lt;stop offset="100%" stop-color="#a855f7"/&gt;
    &lt;/linearGradient&gt;
  &lt;/defs&gt;
  &lt;path fill="url(#gradient1)" .../&gt;
&lt;/svg&gt;</pre>
        </div>
      </div>
    </div>

    <!-- Colors Tab -->
    <div id="tab-colors" class="tab-content" style="display: none;">
      <div class="code-section">
        <h3 class="code-title">Bảng màu chính</h3>
        <div class="color-grid">
          <div class="color-demo">
            <div class="color-icon" style="background: #ff1744; color: #fff;">
              ${WEB_SVG_ICONS.fire}
            </div>
            <div class="color-label">#ff1744</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: #ff4569; color: #fff;">
              ${WEB_SVG_ICONS.star}
            </div>
            <div class="color-label">#ff4569</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: #a855f7; color: #fff;">
              ${WEB_SVG_ICONS.crown}
            </div>
            <div class="color-label">#a855f7</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: #f97316; color: #fff;">
              ${WEB_SVG_ICONS.lightning}
            </div>
            <div class="color-label">#f97316</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: #10b981; color: #fff;">
              ${WEB_SVG_ICONS.check}
            </div>
            <div class="color-label">#10b981</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: #3b82f6; color: #fff;">
              ${WEB_SVG_ICONS.sparkles}
            </div>
            <div class="color-label">#3b82f6</div>
          </div>
        </div>
      </div>

      <div class="code-section">
        <h3 class="code-title">Gradient Examples</h3>
        <div class="color-grid">
          <div class="color-demo">
            <div class="color-icon" style="background: linear-gradient(135deg, #ff1744 0%, #ff4569 100%); color: #fff;">
              ${WEB_SVG_ICONS.gem}
            </div>
            <div class="color-label">Red Gradient</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: linear-gradient(135deg, #a855f7 0%, #f97316 100%); color: #fff;">
              ${WEB_SVG_ICONS.trophy}
            </div>
            <div class="color-label">Purple-Orange</div>
          </div>
          <div class="color-demo">
            <div class="color-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%); color: #fff;">
              ${WEB_SVG_ICONS.rocket}
            </div>
            <div class="color-label">Blue-Purple</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast"></div>

  <script>
    // Tab switching
    function showTab(tabName) {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
      });

      // Remove active class from all buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Show selected tab
      document.getElementById('tab-' + tabName).style.display = 'block';

      // Add active class to clicked button
      event.target.classList.add('active');
    }

    // Copy icon name
    function copyIconCode(iconName) {
      const text = 'WEB_SVG_ICONS.' + iconName;
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copied: ' + text);
      });
    }

    // Copy code block
    function copyCode(btn) {
      const codeBlock = btn.nextElementSibling;
      const text = codeBlock.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        showToast('✅ Code đã được copy!');
        
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    }

    // Show toast notification
    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');

      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }

    // Add click animation to icons
    document.querySelectorAll('.icon-card').forEach(card => {
      card.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 200);
      });
    });
  </script>
</body>
</html>
  `;
}
