# 🔧 Auto-Fixer Tool

Công cụ tự động phát hiện và vá các lỗi phổ biến trong Discord bot.

## 🎯 Features

Auto-Fixer sẽ tự động sửa:

### 1. Missing `deferReply()` - Timeout Issues
- **Vấn đề**: Commands không defer → timeout sau 3 giây
- **Fix**: Thêm `await interaction.deferReply()` ngay đầu execute function
- **Cũng đổi**: `interaction.reply()` → `interaction.editReply()`

### 2. Old API Usage
- **Vấn đề**: `withResponse: true` (Discord.js v13 API)
- **Fix**: Đổi thành `fetchReply: true` (Discord.js v14+)

### 3. Corrupted JSON Files
- **Vấn đề**: File JSON bị corrupt (ký tự lạ, syntax error)
- **Fix**: Backup file cũ, reset về `{}`

### 4. Type Errors
- **Vấn đề**: `flags: 64` không hợp lệ trong `editReply()`
- **Fix**: Remove `flags: 64` từ editReply calls

## 📋 Usage

### Dry Run (Xem lỗi không fix)
```powershell
.\scripts\auto-fixer.ps1 -DryRun
```

### Auto Fix
```powershell
.\scripts\auto-fixer.ps1
```

### Verbose Mode
```powershell
.\scripts\auto-fixer.ps1 -Verbose
```

## 🚀 Workflow Recommended

```powershell
# 1. Check lỗi
.\scripts\auto-fixer.ps1 -DryRun

# 2. Fix lỗi
.\scripts\auto-fixer.ps1

# 3. Build để verify
npm run build

# 4. Test bot
npm start
```

## 📊 Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 AUTO-FIXER - Discord Bot Error Detector
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Checking for missing deferReply...
  ⚠️  mute.ts - Missing defer
    ✅ Fixed!
  ⚠️  kick.ts - Missing defer
    ✅ Fixed!

📋 Checking for old API usage...
  ⚠️  ping.ts - Old withResponse API
    ✅ Fixed!

📋 Checking JSON files...
  ⚠️  votes.json - Corrupted JSON
    ✅ Fixed! (Backed up to votes.json.backup.20260828)

📋 Checking for type errors...
  ⚠️  role.ts - Invalid flags in editReply
    ✅ Fixed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixed:
  • Missing defer: 2
  • Old API: 1
  • Corrupted JSON: 1
  • Type errors: 1

✅ Total fixes: 5

💡 Run 'npm run build' to verify
```

## 🔍 Detected Issues

Auto-Fixer phát hiện:

### High Priority
- ❌ Missing `deferReply()` → Timeout errors
- ❌ Corrupted JSON → Bot crashes on load
- ❌ Type errors → Build failures

### Medium Priority
- ⚠️ Old API usage → Deprecation warnings
- ⚠️ Missing error handling

### Future Enhancements
- 🔜 Detect memory leaks
- 🔜 Find unused imports
- 🔜 Check permission issues
- 🔜 Validate embed limits

## 💡 Tips

1. **Chạy auto-fixer trước mỗi lần deploy**
2. **Commit code trước khi chạy** (để có thể rollback)
3. **Test sau khi fix** (npm run build && npm start)
4. **Check logs** nếu vẫn có lỗi runtime

## 🆘 Troubleshooting

### Script không chạy?
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\auto-fixer.ps1
```

### Vẫn có lỗi sau khi fix?
```powershell
# Xem chi tiết lỗi
npm run build

# Check logs
npm start
```

### Muốn revert changes?
```powershell
git checkout .
# hoặc restore từ backup files (.backup.*)
```

## 📝 Notes

- Auto-fixer **không** fix logic errors
- **Luôn test** sau khi fix
- **Backup important data** trước khi chạy
- Script an toàn, chỉ fix pattern đã biết

## 🎯 Related

- `npm run build` - Build TypeScript
- `npm start` - Start bot
- `git status` - Check changes

---

Made with ❤️ by Supporter Bot Team
