# Scripts Directory

Thư mục này chứa các utility scripts được tổ chức theo chức năng.

## 📁 Structure

### `dev-tools/`
Build, start, restart, auto-fix và watcher cho bot.

### `deploy-tools/`
Deploy và xóa slash commands.

### `command-tools/`
Quét command từ source/build và xuất báo cáo.

### `data-tools/`
Tiện ích kiểm tra/reset dữ liệu; một số script có thể thay đổi dữ liệu người dùng.

### `diagnostics/`
Kiểm tra server, module và role Discord.

### `emoji-tools/`
Upload, kiểm tra và quản lý custom emoji.

### `database-tools/`
Cài đặt và tiện ích cơ sở dữ liệu.

### `test-tools/`
Script kiểm thử thủ công.

### `git-tools/`
Shortcut commit/push.

### `maintenance-tools/`
Script sửa chữa một lần.

## 🚀 Usage

Chạy scripts từ root project:

```bash
# Deploy commands
node scripts/deploy-tools/deploy-all-commands.js

# Generate command report
node scripts/command-tools/list-all-commands.js

# Reset daily data for one user (check the target before running)
node scripts/data-tools/reset-daily.js USER_ID

# Upload emojis
node scripts/emoji-tools/upload-emojis.js

# Start dev watcher
.\scripts\dev-tools\auto-watch-push.ps1
```

## ⚠️ Note

Các tiện ích backup và restore được giữ ở thư mục gốc `scripts/` để các lệnh npm tương ứng tiếp tục hoạt động.
