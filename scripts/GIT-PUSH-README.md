# 🚀 Auto Git Push Scripts

Các script tự động commit và push lên GitHub.

## 📦 Scripts Available

### 1. **Quick Push** (Recommended)
```bash
npm run push
```
- ✅ Tự động detect thay đổi
- ✅ Tự động tạo commit message thông minh
- ✅ Auto push lên GitHub
- ⚡ Nhanh nhất!

**Examples:**
```bash
npm run push                    # Auto message
npm run push "Custom message"   # With custom message
```

### 2. **Auto Git Push** (With Message)
```bash
npm run push:msg "Your commit message"
```
- ✅ Custom commit message
- ✅ Show detailed info
- ✅ Color output

**Examples:**
```bash
npm run push:msg "feat: Add new feature"
npm run push:msg "fix: Bug fix"
npm run push:msg "chore: Update dependencies"
```

### 3. **Direct PowerShell**
```powershell
.\scripts\quick-push.ps1
.\scripts\quick-push.ps1 "Custom message"
.\scripts\auto-git-push.ps1 "Detailed message"
```

## 🎯 Commit Message Types

Script tự động detect:

| Type | When |
|------|------|
| `feat:` | Module updates |
| `chore:` | Config/scripts |
| `docs:` | Documentation |
| `fix:` | Bug fixes |

## 🔧 Advanced: Auto-Push Hook

Enable tự động push sau mỗi commit:

```bash
# Edit .git/hooks/post-commit
# Uncomment: git push origin main
```

⚠️ **Warning:** Sẽ auto push mọi commit!

## 📊 Examples

### Scenario 1: Quick daily update
```bash
npm run push
# Output: ✅ Pushed! "chore: Update 5 files"
```

### Scenario 2: Feature commit
```bash
npm run push:msg "feat: Add animated emoji system"
# Output: ✅ Successfully pushed to GitHub!
```

### Scenario 3: Multiple changes
```bash
npm run push
# Detects:
# - 3 module files → "feat: Update modules"
# - 2 config files → "chore: Update config"
```

## 🎨 Features

- ✅ Auto-detect changes
- ✅ Smart commit messages
- ✅ Color output
- ✅ Error handling
- ✅ Show latest commit
- ✅ Git status preview

## 🚨 Safety

Scripts will:
- ❌ Not commit if no changes
- ❌ Not force push
- ✅ Show what will be committed
- ✅ Exit on errors

## 💡 Tips

**Daily workflow:**
```bash
# Make changes...
npm run push                     # Quick commit + push

# Or with message
npm run push:msg "feat: New feature"
```

**Check before push:**
```bash
git status                       # See changes
npm run push                     # Commit + push
```

## 🔗 Integration

Scripts work với:
- ✅ `/information` command (shows latest commits)
- ✅ GitHub repository links
- ✅ Commit history display

## 📝 Notes

- Pushes to `origin main` by default
- Stages all changes (`git add -A`)
- Respects `.gitignore`
