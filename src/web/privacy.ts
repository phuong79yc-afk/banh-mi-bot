export function renderPrivacy(): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Bánh Mì Bot</title>
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
    h3 { font-size: 1.4rem; margin-top: 25px; margin-bottom: 10px; color: #3b82f6; }
    p, li { margin-bottom: 15px; color: #94a3b8; }
    ul { margin-left: 30px; }
    .date { color: #64748b; font-size: 0.9rem; margin-bottom: 30px; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin-bottom: 20px; color: #3b82f6; }
    .highlight { background: rgba(255, 69, 105, 0.1); padding: 15px; border-left: 3px solid #ff4569; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← Back to Home</a>
    <h1>🔒 Privacy Policy</h1>
    <p class="date">Effective Date: January 14, 2025 | Last Updated: January 14, 2025</p>

    <h2>1. Introduction</h2>
    <p>This Privacy Policy describes how Bánh Mì Bot ("we", "our", "the Bot") collects, uses, and protects your information when you use our Discord bot.</p>

    <h2>2. Information We Collect</h2>

    <h3>2.1 Automatically Collected Information</h3>
    <ul>
      <li><strong>Server ID:</strong> To identify which Discord server the Bot is operating in</li>
      <li><strong>Channel IDs:</strong> To manage channel-specific configurations</li>
      <li><strong>User IDs:</strong> For level tracking, moderation logs, and command usage</li>
      <li><strong>Message Metadata:</strong> Timestamps, reaction counts (no message content stored)</li>
    </ul>

    <h3>2.2 Temporary Data Processing</h3>
    <div class="highlight">
      <p><strong>Important:</strong> Message content is temporarily scanned to detect TikTok/social media links.</p>
      <ul>
        <li>❌ Not stored permanently</li>
        <li>❌ Deleted immediately after processing</li>
        <li>✅ Only used for link detection</li>
      </ul>
    </div>

    <h3>2.3 Configuration Data</h3>
    <ul>
      <li><strong>Server Settings:</strong> Link preview preferences, moderation settings</li>
      <li><strong>Role IDs:</strong> For level rewards and permission management</li>
      <li><strong>Channel Lists:</strong> Allowed/blocked channels for features</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <p>We use collected information to:</p>
    <ul>
      <li><strong>Provide Bot Functionality:</strong> Enable link fixing, moderation, music playback</li>
      <li><strong>Improve Services:</strong> Analyze usage patterns to enhance features</li>
      <li><strong>Maintain Security:</strong> Detect and prevent abuse or violations</li>
      <li><strong>Store Configurations:</strong> Remember server-specific settings</li>
    </ul>

    <h2>4. Data Storage and Security</h2>

    <h3>4.1 Storage Location</h3>
    <ul>
      <li>Data is stored locally in JSON files on our server</li>
      <li>No third-party database services used</li>
      <li>Files are backed up regularly</li>
    </ul>

    <h3>4.2 Security Measures</h3>
    <ul>
      <li>Access restricted to Bot administrators only</li>
      <li>Server secured with industry-standard practices</li>
      <li>Regular security audits and updates</li>
    </ul>

    <h3>4.3 Data Retention</h3>
    <ul>
      <li><strong>Server Configs:</strong> Retained while Bot is in your server</li>
      <li><strong>Level Data:</strong> Retained indefinitely unless requested for deletion</li>
      <li><strong>Temporary Data:</strong> Deleted within seconds of processing</li>
    </ul>

    <h2>5. Third-Party Services</h2>

    <h3>5.1 TikWM API (https://tikwm.com)</h3>
    <ul>
      <li>Used to download TikTok videos without watermark</li>
      <li>Your TikTok links are sent to their API</li>
      <li>Subject to their Privacy Policy</li>
    </ul>

    <h3>5.2 Discord API</h3>
    <ul>
      <li>All Bot operations use Discord's official API</li>
      <li>Subject to Discord's Privacy Policy and Terms of Service</li>
    </ul>

    <h2>6. Your Data Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access:</strong> Request a copy of your data</li>
      <li><strong>Deletion:</strong> Request deletion of your data</li>
      <li><strong>Correction:</strong> Request correction of inaccurate data</li>
      <li><strong>Opt-Out:</strong> Remove the Bot from your server to stop data collection</li>
    </ul>

    <h2>7. Data Sharing</h2>
    <div class="highlight">
      <p><strong>We DO NOT:</strong></p>
      <ul>
        <li>❌ Sell your data to third parties</li>
        <li>❌ Share your data with advertisers</li>
        <li>❌ Use your data for marketing purposes</li>
        <li>❌ Share personal information publicly</li>
      </ul>
    </div>

    <h2>8. Children's Privacy</h2>
    <p>The Bot is not intended for users under 13 years old, per Discord's Terms of Service. We do not knowingly collect data from children.</p>

    <h2>9. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. Changes will be posted with a new "Last Updated" date. Continued use constitutes acceptance of changes.</p>

    <h2>10. Contact Us</h2>
    <p>For privacy-related questions or requests:</p>
    <ul>
      <li><strong>Bot Dashboard:</strong> <a href="http://localhost:3002">http://localhost:3002</a></li>
      <li><strong>Discord:</strong> Message bot for support</li>
    </ul>

    <hr style="margin: 40px 0; border: 1px solid #1a1a2e;">
    <p style="text-align: center; color: #64748b;">Last Updated: January 14, 2025</p>
  </div>
</body>
</html>
  `;
}
