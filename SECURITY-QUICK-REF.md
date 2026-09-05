# 🔒 Security Commands - Quick Reference

**Version:** 1.1.0 | **Commands:** 3 | **Status:** ✅ Deployed

---

## 📋 Command List

| Command | Permission | Description |
|---------|-----------|-------------|
| `/anti-cancer` | Manage Nicknames | Fix problematic nicknames |
| `/lock-invites` | Manage Server | Lock/unlock invite creation |
| `/purge-bans` | Owner Only | Remove all bans |

---

## 🛡️ Anti-Cancer Nickname

### Quick Commands
```bash
/anti-cancer scan                          # 👀 View problem nicknames
/anti-cancer fix replacement:Clean User    # ✏️ Fix all nicknames
/anti-cancer toggle                        # 🔄 Auto-fix ON/OFF
```

### What It Detects
- `!` `_` hoisting chars
- Invisible characters
- 50%+ special chars
- 3+ emojis

---

## 🔒 Lock Invites

### Quick Commands
```bash
/lock-invites lock delete_existing:True    # 🔒 Lock + delete invites
/lock-invites unlock                       # 🔓 Unlock invites
/lock-invites status                       # ℹ️ Check status
```

### How It Works
- Sets `CreateInstantInvite = false` for @everyone
- Only admins can create invites when locked
- Use during raids or events

---

## 🗑️ Purge Bans

### Quick Command
```bash
/purge-bans confirm:True                   # 🗑️ Remove ALL bans
```

### ⚠️ Warning
- **OWNER ONLY**
- **CANNOT UNDO**
- Must set `confirm:True`

---

## 🚨 Emergency Response

### During Active Raid
```bash
1. /lock-invites lock delete_existing:True
2. /anti-cancer scan
3. /anti-cancer fix replacement:Renamed
4. Ban raid accounts manually
```

### After Raid Cleanup
```bash
1. /lock-invites unlock
2. /anti-cancer toggle  (enable auto-fix)
3. Review audit logs
```

### New Server Ownership
```bash
1. /purge-bans confirm:True
2. /anti-cancer fix replacement:Member
3. /lock-invites status
```

---

## 📊 Cheat Sheet

| Scenario | Command | Notes |
|----------|---------|-------|
| Check for spam nicknames | `/anti-cancer scan` | Non-destructive |
| Fix spam nicknames | `/anti-cancer fix` | Batch operation |
| Prevent raid invites | `/lock-invites lock` | Instant effect |
| Check invite status | `/lock-invites status` | Safe to use |
| Re-enable invites | `/lock-invites unlock` | Restores normal |
| Clear all bans | `/purge-bans confirm:True` | Owner only |

---

## 🔐 Permissions Required

| Command | Bot Needs | User Needs |
|---------|-----------|------------|
| Anti-Cancer | Manage Nicknames | Manage Nicknames |
| Lock Invites | Manage Channels | Manage Server |
| Purge Bans | Ban Members | Server Owner |

---

## 💡 Pro Tips

1. **Always scan before fix:** `/anti-cancer scan` first
2. **Test lock in dev:** Try `/lock-invites lock` in test server
3. **Backup ban list:** Screenshot before `/purge-bans`
4. **Check status often:** Use `/lock-invites status`
5. **Role hierarchy matters:** Bot cannot modify higher roles

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| "Cannot modify nickname" | Check bot role position |
| "Missing permissions" | Add Manage Channels |
| "Access Denied" (purge-bans) | Must be server owner |
| Lock not working | Verify @everyone permissions |
| Slow invite lock | Normal for 100+ channels |

---

## 📖 Full Documentation

- **Complete Guide:** `docs/SECURITY-FEATURES.md`
- **Testing Guide:** `scripts/test-security-commands.md`
- **Update Notes:** `SECURITY-UPDATE.md`
- **Project Status:** `PROJECT-STATUS.md`

---

**Quick Access:** Save this file for instant command reference!

**Questions?** Check `/help` → Security category in Discord
