# Custom Emoji Usage trong Discord Bot

## 📊 Status: 8/50 Emoji Active

Tất cả **16 modules** đang sử dụng `embedHelper` sẽ tự động hiển thị custom emoji cho success/error messages.

---

## ✅ Commands Sử Dụng Custom Emoji (Tự động qua embedHelper)

### 1. **AFK Module** (`/afk`)
- `/afk` - Set AFK status
- `/afk-remove` - Remove AFK
- `/afk-list` - List AFK users
- **Emoji:** `success` ✅, `error` ❌

### 2. **AI Module** (`/ai`)
- `/ai` - Chat with AI
- `/ai-memory` - View/clear conversation history
- `/ai-models` - List available AI models
- **Emoji:** `success` ✅, `error` ❌

### 3. **Autoresponder Module** (`/autoresponder-*`)
- `/autoresponder-add` - Create auto-reply
- `/autoresponder-remove` - Delete auto-reply
- `/autoresponder-list` - List all autoresponders
- `/autoresponder-view` - View specific autoresponder
- `/autoresponder-matchmode` - Configure match mode
- **Emoji:** `success` ✅, `error` ❌

### 4. **Custom Role Module** (`/customrole-admin-*`)
- `/customrole-admin-enable` - Enable custom roles
- `/customrole-admin-disable` - Disable custom roles
- `/customrole-admin-create` - Create custom role for user
- `/customrole-admin-manage` - Manage custom roles
- **Emoji:** `success` ✅, `error` ❌

### 5. **Donation Module** (`/donation-*`)
- `/donation-enable` - Enable donation tracking
- `/donation-disable` - Disable donation tracking
- `/donation-add` - Add donation
- `/donation-subtract` - Remove donation
- `/donation-leaderboard` - Top donors
- `/donation-stats` - User donation stats
- `/donation-config` - Configure donation system
- **Emoji:** `success` ✅, `error` ❌

### 6. **Games Module** (`/gtn-start`)
- `/gtn-start` - Start Guess The Number game
- **Emoji:** `success` ✅, `error` ❌

### 7. **Moderation Module** (`/moderation-*`)
- `/moderation-kick` - Kick user
- `/moderation-ban` - Ban user
- `/moderation-timeout` - Timeout user
- `/moderation-clear` - Clear messages
- `/moderation-lock` - Lock channel
- `/moderation-unlock` - Unlock channel
- `/moderation-delete-voice-channels` - Mass delete channels
- **Emoji:** `success` ✅, `error` ❌

### 8. **Quick Report Module** (Context Menu: `Report Message`)
- Context Menu: `Report Message`
- `/quickreport-enable` - Enable quick reports
- `/quickreport-disable` - Disable quick reports
- `/quickreport-config` - Configure report system
- `/quickreport-update` - Update report status
- `/quickreport-recent` - View recent reports
- `/quickreport-check` - Check specific report
- **Emoji:** `success` ✅, `error` ❌

### 9. **Server Generator Module** (`/generator`) 🎯
- `/generator` - AI Server Design Generator
- **Emoji:** `success` ✅, `error` ❌, `warning` ⚠️, `art` 🎨, `settings` ⚙️, `delete` 🗑️, `refresh` 🔄, `export` 📤

### 10. **Settings Module** (`/settings`)
- `/settings` - Bot configuration
- **Emoji:** `success` ✅, `error` ❌

### 11. **Snipe Module** (`/snipe`, `/editsnipe`)
- `/snipe` - View deleted messages
- `/editsnipe` - View edited messages
- **Emoji:** `success` ✅, `error` ❌

### 12. **Social Module** (`/hug`, `/kiss`, etc.)
- Social interaction commands (hug, kiss, slap, bite, pat, punch, handhold)
- **Emoji:** `success` ✅, `error` ❌

### 13. **Sticky Messages Module** (`/sticky-*`)
- `/sticky-message` - Create sticky message
- `/sticky-remove` - Remove sticky message
- `/sticky-mode` - Configure sticky mode
- `/sticky-threshold` - Set message threshold
- `/sticky-delay` - Set repost delay
- `/sticky-config` - View configuration
- `/sticky-list` - List all sticky messages
- **Emoji:** `success` ✅, `error` ❌

### 14. **Ticket Module** (`/ticket-*`)
- `/ticket-setup` - Setup ticket system
- `/ticket-close` - Close ticket
- `/ticket-add` - Add user to ticket
- `/ticket-remove` - Remove user from ticket
- `/ticket-stats` - View ticket statistics
- **Emoji:** `success` ✅, `error` ❌

### 15. **Utility Module** (`/poll`, `/calc`, etc.)
- `/poll` - Create poll
- `/calc` - Calculator
- `/random` - Random number
- `/choose` - Choose from options
- `/help` - Help command
- `/information` - Bot information
- **Emoji:** `success` ✅, `error` ❌

### 16. **Prefix Commands**
- Legacy prefix commands (still work)
- **Emoji:** `success` ✅, `error` ❌

---

## 🎨 Emoji Details

| Emoji | Name | ID | Usage |
|-------|------|-----|-------|
| <:success:ID> | success | 1546857884330098768 | All success messages across all modules |
| <:error:ID> | error | 1546858101381140533 | All error messages across all modules |
| <:warning:ID> | warning | 1546858070758396006 | Generator warnings |
| <:delete:ID> | delete | 1546858039556972545 | Generator delete menu |
| <:art:ID> | art | 1546858007944630352 | Generator embeds |
| <:settings:ID> | settings | 1546857981482635397 | Generator settings menu |
| <:refresh:ID> | refresh | 1546864957075882015 | Generator regen menu |
| <:export:ID> | export | 1546865815700246639 | Generator export menu |

---

## 🧪 Test Commands

Để test custom emoji, thử các commands sau:

### Quick Tests (Success ✅):
```
/afk reason:test
/donation-leaderboard
/snipe
/help
/information
```

### Quick Tests (Error ❌):
```
/snipe (trong channel không có deleted messages)
/ticket-close (ngoài ticket channel)
```

### Full Feature Test (All 8 Emoji):
```
/generator
→ Submit modal → Start → Mở select menu
```

---

## 📝 Note

- **embedHelper users (16 modules)**: Tự động sử dụng custom emoji
- **Hardcoded emoji (57 files)**: Console logs, không ảnh hưởng user experience

Custom emoji chỉ hiển thị trong embeds và messages gửi đến users, không thay thế console logs.
