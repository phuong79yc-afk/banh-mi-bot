export function renderToS(): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Bánh Mì Bot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f1e;
      color: #fff;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 2.5rem; margin-bottom: 20px; color: #ff4569; }
    h2 { font-size: 1.8rem; margin-top: 40px; margin-bottom: 15px; color: #a855f7; }
    p, li { margin-bottom: 15px; color: #94a3b8; }
    ul { margin-left: 30px; }
    .date { color: #64748b; font-size: 0.9rem; margin-bottom: 30px; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin-bottom: 20px; color: #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← Back to Home</a>
    <h1>📜 Terms of Service</h1>
    <p class="date">Effective Date: January 14, 2025 | Last Updated: January 14, 2025</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By inviting and using Bánh Mì Bot ("the Bot"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Bot.</p>

    <h2>2. Description of Service</h2>
    <p>Bánh Mì Bot provides the following services:</p>
    <ul>
      <li><strong>Link Preview Enhancement:</strong> Automatically fixes TikTok, Twitter, Instagram, and Reddit links to display video embeds</li>
      <li><strong>Moderation Tools:</strong> Anti-spam, anti-raid, auto-moderation features</li>
      <li><strong>Music Player:</strong> Play music from YouTube and other sources</li>
      <li><strong>Level System:</strong> Track user activity and engagement</li>
      <li><strong>Utility Commands:</strong> Server management, user info, and more</li>
    </ul>

    <h2>3. User Responsibilities</h2>
    <p>You agree to:</p>
    <ul>
      <li>Use the Bot in compliance with Discord's Terms of Service and Community Guidelines</li>
      <li>Not abuse, exploit, or harm the Bot's functionality</li>
      <li>Not use the Bot for illegal activities or harassment</li>
      <li>Not attempt to reverse engineer, decompile, or extract source code</li>
    </ul>

    <h2>4. Data Collection and Privacy</h2>
    <p>The Bot collects minimal data necessary for functionality:</p>
    <ul>
      <li><strong>Server IDs:</strong> To store server-specific configurations</li>
      <li><strong>User IDs:</strong> For level tracking and moderation actions</li>
      <li><strong>Message Content:</strong> Temporarily processed to detect links (not stored)</li>
      <li><strong>Command Usage:</strong> For analytics and improvement</li>
    </ul>
    <p>See our <a href="/privacy">Privacy Policy</a> for detailed information.</p>

    <h2>5. Content and Intellectual Property</h2>
    <ul>
      <li>Video downloads are sourced from third-party APIs (TikWM)</li>
      <li>Users are responsible for content they share through the Bot</li>
      <li>We do not claim ownership of user-generated content</li>
      <li>We respect intellectual property rights and DMCA</li>
    </ul>

    <h2>6. Service Availability</h2>
    <ul>
      <li>The Bot is provided "as is" without warranties</li>
      <li>We do not guarantee 100% uptime</li>
      <li>Features may be modified or discontinued without notice</li>
      <li>We reserve the right to terminate service for any server</li>
    </ul>

    <h2>7. Limitation of Liability</h2>
    <p>The Bot developers are not liable for:</p>
    <ul>
      <li>Data loss or corruption</li>
      <li>Service interruptions or downtime</li>
      <li>Third-party content accessed through the Bot</li>
      <li>Damages resulting from Bot usage</li>
    </ul>

    <h2>8. Modifications to Terms</h2>
    <p>We reserve the right to modify these terms at any time. Continued use of the Bot constitutes acceptance of updated terms.</p>

    <h2>9. Termination</h2>
    <p>We may terminate or suspend access to the Bot immediately, without prior notice, for:</p>
    <ul>
      <li>Violation of these Terms of Service</li>
      <li>Abuse or misuse of Bot features</li>
      <li>Violation of Discord's Terms of Service</li>
    </ul>

    <h2>10. Contact Information</h2>
    <p>For questions or concerns about these Terms:</p>
    <ul>
      <li><strong>Bot Dashboard:</strong> <a href="http://localhost:3002">http://localhost:3002</a></li>
      <li><strong>Discord:</strong> Message bot for support</li>
    </ul>

    <h2>11. Governing Law</h2>
    <p>These Terms shall be governed by applicable laws, without regard to conflict of law provisions.</p>

    <hr style="margin: 40px 0; border: 1px solid #1a1a2e;">
    <p style="text-align: center; color: #64748b;">By using Bánh Mì Bot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
  </div>
</body>
</html>
  `;
}
