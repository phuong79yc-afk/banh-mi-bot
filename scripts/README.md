# Scripts Directory

Thư mục này chứa các utility scripts được tổ chức theo chức năng.

## 📁 Structure

### `deploy-tools/` (10 files)
Scripts liên quan đến deploy commands lên Discord:
- Deploy commands (global/guild)
- Delete commands
- Command management

### `emoji-tools/` (26 files)
Scripts quản lý custom emojis:
- Upload emojis
- Check emoji usage
- Replace Unicode with custom emojis
- Economy emojis

### `dev-tools/` (19 files)
Scripts hỗ trợ development:
- Auto-restart bot
- File watchers
- Auto rebuild
- Health checks

### `archived/` (30 files)
Scripts cũ không còn sử dụng thường xuyên:
- Test scripts
- One-time fix scripts
- Deprecated utilities

## 🚀 Usage

Chạy scripts từ root project:

```bash
# Deploy commands
node scripts/deploy-tools/deploy-commands.js

# Upload emojis
node scripts/emoji-tools/upload-emojis.js

# Start dev watcher
.\scripts\dev-tools\auto-watch-push.ps1
```

## ⚠️ Note

Hầu hết các scripts trong `archived/` đã được tích hợp vào bot hoặc không còn cần thiết. Chỉ giữ lại để tham khảo.
