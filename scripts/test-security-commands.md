# 🧪 Testing Security Commands

## ✅ Manual Testing Checklist

### 1. `/anti-cancer` Command

#### Test Case 1.1: Scan for cancer nicknames
```
/anti-cancer scan
```
**Expected:**
- ✅ Shows count of members with problematic nicknames
- ✅ Lists up to 25 members
- ✅ No errors

#### Test Case 1.2: Fix cancer nicknames
```
/anti-cancer fix replacement:Clean User
```
**Expected:**
- ✅ Fixes all problematic nicknames
- ✅ Shows success/failed counts
- ✅ Skips members with higher roles than bot
- ✅ Updates nicknames to "Clean User"

#### Test Case 1.3: Toggle auto-fix
```
/anti-cancer toggle
```
**Expected:**
- ✅ Shows current state (ON/OFF)
- ✅ Toggles between enabled/disabled
- ✅ Confirmation message

---

### 2. `/lock-invites` Command

#### Test Case 2.1: Lock invites
```
/lock-invites lock delete_existing:True
```
**Expected:**
- ✅ Disables CreateInstantInvite for @everyone in all channels
- ✅ Deletes existing invites if delete_existing:True
- ✅ Shows count of locked channels
- ✅ Shows count of deleted invites

#### Test Case 2.2: Check status
```
/lock-invites status
```
**Expected:**
- ✅ Shows LOCKED/UNLOCKED status
- ✅ Shows number of locked channels
- ✅ Shows number of active invites

#### Test Case 2.3: Unlock invites
```
/lock-invites unlock
```
**Expected:**
- ✅ Restores CreateInstantInvite permission
- ✅ Shows count of unlocked channels
- ✅ Members can create invites again

---

### 3. `/purge-bans` Command

#### Test Case 3.1: Non-owner attempt
```
/purge-bans confirm:True
```
**As non-owner:**
**Expected:**
- ✅ Shows "Access Denied" message
- ✅ Shows current owner
- ✅ Does NOT execute

#### Test Case 3.2: Owner without confirmation
```
/purge-bans confirm:False
```
**As owner:**
**Expected:**
- ✅ Shows "Must confirm" error
- ✅ Does NOT execute

#### Test Case 3.3: Owner with confirmation
```
/purge-bans confirm:True
```
**As owner:**
**Expected:**
- ✅ Unbans all banned users
- ✅ Shows success/failed counts
- ✅ Shows list of failed unbans (if any)
- ✅ Logs to console

---

## 🔍 Edge Cases

### Anti-Cancer Edge Cases

1. **Empty server (no cancer nicknames)**
   ```
   /anti-cancer scan
   ```
   Expected: "Tìm thấy 0 nickname có ký tự lạ"

2. **Bot role lower than target**
   ```
   /anti-cancer fix
   ```
   Expected: Skips high-role members, shows in "failed" list

3. **Server owner nickname**
   ```
   /anti-cancer fix
   ```
   Expected: Cannot modify owner, shows in failed list

### Lock Invites Edge Cases

1. **Already locked**
   ```
   /lock-invites lock
   ```
   Expected: Works, shows already locked channels

2. **No channels to lock**
   ```
   /lock-invites lock
   ```
   Expected: Shows 0 channels locked

3. **Missing permissions**
   ```
   /lock-invites lock
   ```
   Expected: Error message about missing permissions

### Purge Bans Edge Cases

1. **No bans in server**
   ```
   /purge-bans confirm:True
   ```
   Expected: "Không có bans nào để xóa"

2. **Rate limited (>1000 bans)**
   ```
   /purge-bans confirm:True
   ```
   Expected: May hit Discord rate limits, some unbans fail

3. **Bot missing permissions**
   ```
   /purge-bans confirm:True
   ```
   Expected: Error about missing Ban Members permission

---

## 📊 Performance Tests

### Anti-Cancer Performance
- **Small server (<100 members):** <2 seconds
- **Medium server (100-500 members):** <5 seconds
- **Large server (>500 members):** <10 seconds

### Lock Invites Performance
- **Small server (<50 channels):** <3 seconds
- **Medium server (50-200 channels):** <8 seconds
- **Large server (>200 channels):** <15 seconds

### Purge Bans Performance
- **<50 bans:** <5 seconds
- **50-100 bans:** <10 seconds
- **>100 bans:** May hit rate limits (429)

---

## 🐛 Bug Reports

### Known Issues
- ✅ None currently

### Fixed Issues
- ✅ Type error in help.ts (commands.size)
- ✅ Build error in server.ts (backslash)
- ✅ Missing emoji definitions

---

## ✅ Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Anti-Cancer Scan | ⏳ Pending | Need testing |
| Anti-Cancer Fix | ⏳ Pending | Need testing |
| Anti-Cancer Toggle | ⏳ Pending | Need testing |
| Lock Invites Lock | ⏳ Pending | Need testing |
| Lock Invites Status | ⏳ Pending | Need testing |
| Lock Invites Unlock | ⏳ Pending | Need testing |
| Purge Bans (Non-Owner) | ⏳ Pending | Need testing |
| Purge Bans (Owner) | ⏳ Pending | Need testing |

---

## 🚀 Deployment Status

- ✅ Build successful
- ✅ Deploy successful (18 commands)
- ✅ Commands loaded in Discord
- ⏳ Awaiting live testing

---

## 📝 Testing Notes

**Date:** 2024-01-XX  
**Tester:** GlitchBucket Team  
**Bot Version:** 1.0.0  
**Discord.js:** v14.14.1

**Commands Deployed:**
- `/anti-cancer` ✅
- `/lock-invites` ✅
- `/purge-bans` ✅

**Total Commands:** 18 (15 existing + 3 security)

---

## 🎯 Next Steps

1. ✅ Deploy to Discord
2. ⏳ Test in development server
3. ⏳ Test all edge cases
4. ⏳ Update test results
5. ⏳ Deploy to production

---

**Ready for testing!** 🧪
