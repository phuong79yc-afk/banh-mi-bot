import { Message, Guild, User } from 'discord.js';

export function generateHTMLTranscript(
  messages: Message[],
  channelName: string,
  channelId: string,
  closedBy: User,
  reason: string,
  guild: Guild | null,
  ticketOwner: User | null
): string {
  const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  let html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Transcript - ${channelName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background: #0f0c29;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            background-attachment: fixed;
            padding: 40px 20px;
            min-height: 100vh;
            position: relative;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(240, 147, 251, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(88, 101, 242, 0.3) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            box-shadow: 
                0 8px 32px 0 rgba(31, 38, 135, 0.37),
                inset 0 0 0 1px rgba(255, 255, 255, 0.18);
            overflow: hidden;
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            z-index: 1;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .header {
            background: linear-gradient(135deg, rgba(88, 101, 242, 0.8) 0%, rgba(120, 119, 198, 0.8) 100%);
            backdrop-filter: blur(10px);
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(255, 255, 255, 0.05) 2px,
                    rgba(255, 255, 255, 0.05) 4px
                ),
                repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(255, 255, 255, 0.05) 2px,
                    rgba(255, 255, 255, 0.05) 4px
                );
            animation: gridMove 20s linear infinite;
        }
        
        @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .server-icon {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            margin-bottom: 20px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        .header h1 {
            font-size: 38px;
            font-weight: 800;
            color: white;
            margin-bottom: 10px;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .subtitle {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
        }
        
        .info-section {
            padding: 40px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            padding: 24px;
            border-radius: 20px;
            box-shadow: 
                0 8px 32px 0 rgba(31, 38, 135, 0.2),
                inset 0 0 0 1px rgba(255, 255, 255, 0.1);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 
                0 20px 40px 0 rgba(88, 101, 242, 0.4),
                inset 0 0 0 1px rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.12);
        }
        
        .info-card .label {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
        }
        
        .info-card .value {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            word-break: break-word;
        }
        
        .messages-section {
            padding: 40px;
            background: rgba(255, 255, 255, 0.03);
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .section-header h2 {
            font-size: 22px;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 0 20px rgba(88, 101, 242, 0.5);
        }
        
        .message-count {
            background: linear-gradient(135deg, rgba(88, 101, 242, 0.8), rgba(120, 119, 198, 0.8));
            backdrop-filter: blur(10px);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
        }
        
        .message {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
            padding: 24px;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            animation: slideIn 0.5s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message:hover {
            transform: translateX(10px) translateY(-4px);
            box-shadow: 0 12px 40px rgba(88, 101, 242, 0.3);
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(88, 101, 242, 0.5);
        }
        
        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 3px solid white;
        }
        
        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .message-content {
            flex: 1;
            min-width: 0;
        }
        
        .message-header {
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 8px;
        }
        
        .author {
            font-weight: 700;
            font-size: 15px;
            color: #fff;
            text-shadow: 0 0 10px rgba(88, 101, 242, 0.5);
        }
        
        .timestamp {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 500;
        }
        
        .message-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            word-wrap: break-word;
        }
        
        .message-text em {
            color: rgba(255, 255, 255, 0.5);
            font-style: italic;
        }
        
        .attachments {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .attachment {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 14px;
            transition: all 0.3s ease;
        }
        
        .attachment:hover {
            border-color: rgba(88, 101, 242, 0.6);
            transform: translateX(8px);
            box-shadow: 0 8px 20px rgba(88, 101, 242, 0.3);
            background: rgba(255, 255, 255, 0.12);
        }
        
        .attachment-icon {
            font-size: 28px;
        }
        
        .attachment-info {
            flex: 1;
            min-width: 0;
        }
        
        .attachment-name {
            color: #a5b4fc;
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .attachment-name:hover {
            text-decoration: underline;
            color: #c7d2fe;
        }
        
        .attachment-size {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 2px;
        }
        
        .embed-badge {
            margin-top: 12px;
            display: inline-block;
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.8), rgba(245, 158, 11, 0.8));
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #fff;
            box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
        }
        
        .stats-section {
            background: linear-gradient(135deg, rgba(88, 101, 242, 0.6) 0%, rgba(120, 119, 198, 0.6) 100%);
            backdrop-filter: blur(10px);
            padding: 50px 40px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            padding: 32px;
            border-radius: 24px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
        }
        
        .stat-card:hover {
            transform: translateY(-12px) scale(1.05);
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 40px rgba(88, 101, 242, 0.4);
            border-color: rgba(255, 255, 255, 0.4);
        }
        
        .stat-value {
            font-size: 48px;
            font-weight: 900;
            color: white;
            margin-bottom: 12px;
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
        }
        
        .stat-label {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .footer {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            padding: 32px 40px;
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .footer-text {
            font-size: 13px;
            line-height: 1.8;
        }
        
        .scroll-top {
            position: fixed;
            bottom: 32px;
            right: 32px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            opacity: 0;
            pointer-events: none;
            font-size: 24px;
            z-index: 1000;
        }
        
        .scroll-top.visible {
            opacity: 1;
            pointer-events: all;
        }
        
        .scroll-top:hover {
            transform: translateY(-8px) scale(1.1);
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
        }
        
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            
            .container {
                border-radius: 16px;
            }
            
            .header {
                padding: 40px 24px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .info-section,
            .messages-section,
            .stats-section,
            .footer {
                padding: 24px;
            }
            
            .info-grid,
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .message {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                ${guild?.iconURL() ? `<img src="${guild.iconURL()}" alt="Server Icon" class="server-icon">` : ''}
                <h1>🎫 Ticket Transcript</h1>
                <div class="subtitle">${guild?.name || 'Discord Server'}</div>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-grid">
                <div class="info-card">
                    <div class="label">🎫 Ticket Name</div>
                    <div class="value">${channelName}</div>
                </div>
                <div class="info-card">
                    <div class="label">🆔 Ticket ID</div>
                    <div class="value">${channelId}</div>
                </div>
                <div class="info-card">
                    <div class="label">👤 Created By</div>
                    <div class="value">${ticketOwner?.tag || 'Unknown'}</div>
                </div>
                <div class="info-card">
                    <div class="label">🔒 Closed By</div>
                    <div class="value">${closedBy.tag}</div>
                </div>
                <div class="info-card">
                    <div class="label">📝 Reason</div>
                    <div class="value">${reason}</div>
                </div>
                <div class="info-card">
                    <div class="label">⏰ Closed At</div>
                    <div class="value">${new Date().toLocaleString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                </div>
            </div>
        </div>
        
        <div class="messages-section">
            <div class="section-header">
                <h2>💬 Messages</h2>
                <span class="message-count">${sortedMessages.length}</span>
            </div>`;

  // Add messages
  for (const message of sortedMessages) {
    const timestamp = message.createdAt.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const author = message.author.tag;
    const avatarUrl = message.author.displayAvatarURL({ size: 128 });
    const content = message.content || '<em>Không có nội dung văn bản</em>';
    
    // Escape HTML in content
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
    
    html += `
            <div class="message">
                <div class="avatar">
                    <img src="${avatarUrl}" alt="${author}">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="author">${author}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="message-text">${escapedContent}</div>`;
    
    // Add attachments
    if (message.attachments.size > 0) {
      html += `
                    <div class="attachments">`;
      message.attachments.forEach(att => {
        const fileIcon = getFileIcon(att.name);
        html += `
                        <div class="attachment">
                            <span class="attachment-icon">${fileIcon}</span>
                            <div class="attachment-info">
                                <a href="${att.url}" class="attachment-name" target="_blank">${att.name}</a>
                                <div class="attachment-size">${formatFileSize(att.size)}</div>
                            </div>
                        </div>`;
      });
      html += `
                    </div>`;
    }
    
    // Add embeds indicator
    if (message.embeds.length > 0) {
      html += `
                    <span class="embed-badge">💬 ${message.embeds.length} Embed(s)</span>`;
    }
    
    html += `
                </div>
            </div>`;
  }

  const attachmentCount = sortedMessages.reduce((sum, m) => sum + m.attachments.size, 0);
  const participantCount = new Set(sortedMessages.map(m => m.author.id)).size;
  const totalAttachmentSize = sortedMessages.reduce((sum, m) => 
    sum + Array.from(m.attachments.values()).reduce((s, a) => s + a.size, 0), 0
  );

  html += `
        </div>
        
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${sortedMessages.length}</div>
                    <div class="stat-label">💬 Messages</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${attachmentCount}</div>
                    <div class="stat-label">📎 Attachments</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${participantCount}</div>
                    <div class="stat-label">👥 Participants</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatFileSize(totalAttachmentSize)}</div>
                    <div class="stat-label">💾 Total Size</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                🤖 Generated by Discord Bot<br>
                📅 ${new Date().toLocaleString('vi-VN', { 
                  dateStyle: 'full', 
                  timeStyle: 'medium' 
                })}
            </div>
        </div>
    </div>
    
    <div class="scroll-top" id="scrollTop">⬆️</div>
    
    <script>
        const scrollTopBtn = document.getElementById('scrollTop');
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    </script>
</body>
</html>`;

  return html;
}

// Helper function to get file icon emoji
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: { [key: string]: string } = {
    'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊',
    'ppt': '📊', 'pptx': '📊', 'zip': '📦', 'rar': '📦', '7z': '📦',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
    'mp4': '🎥', 'avi': '🎥', 'mov': '🎥', 'mp3': '🎵', 'wav': '🎵',
    'txt': '📄', 'js': '💻', 'ts': '💻', 'html': '💻', 'css': '💻', 'json': '💻',
  };
  return iconMap[ext || ''] || '📎';
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
