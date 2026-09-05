# 🔒 Security Features Documentation

GlitchBucket bot bao gồm 3 tính năng security chính để bảo vệ server Discord của bạn.

---

## 📋 Danh sách Commands

| Command | Permission | Description |
|---------|-----------|-------------|
| `/anti-cancer` | Manage Nicknames | Phát hiện và sửa nickname có ký tự lạ |
| `/lock-invites` | Manage Server | Khóa/mở khóa tất cả invite links |
| `/purge-bans` | Owner Only | Xóa tất cả bans trong server |

---

## 🛡️ 1. Anti-Cancer Nickname

**Mục đích:** Tự động phát hiện và sửa các nickname có:
- Ký tự hoisting (để xuất hiện đầu danh sách)
- Ký tự invisible/zero-width
- Quá nhiều ký tự đặc biệt
- Spam emoji (>3 emoji)

### Subcommands:

#### `/anti-cancer scan`
- **Chức năng:** Quét và hiển thị danh sách nickname có vấn đề
- **Output:** Danh sách tối đa 25 thành viên đầu tiên
- **Không thay đổi gì**

#### `/anti-cancer fix`
- **Chức năng:** Tự động sửa tất cả nickname có vấn đề
- **Options:**
  - `replacement` (optional): Tên thay thế (mặc định: "Renamed User")
- **Bỏ qua:** Members có vai trò cao hơn bot
- **Output:** Danh sách thành công/thất bại

#### `/anti-cancer toggle`
- **Chức năng:** Bật/tắt tự động sửa cho thành viên mới
- **Note:** Tính năng này yêu cầu member join event handler (sẽ implement sau)

### Ví dụ sử dụng:

```
/anti-cancer scan
→ Tìm thấy 5 nickname có ký tự lạ

/anti-cancer fix replacement:Clean User
→ Đã sửa 5 nickname thành "Clean User"

/anti-cancer toggle
→ ✅ Đã bật - Nickname mới sẽ tự động được kiểm tra
```

---

## 🔒 2. Lock Invites

**Mục đích:** Ngăn chặn spam/raid bằng cách vô hiệu hóa khả năng tạo invite links.

### Subcommands:

#### `/lock-invites lock`
- **Chức năng:** Vô hiệu hóa tất cả invite links
- **Options:**
  - `delete_existing` (optional): Xóa tất cả invite hiện có
- **Cách hoạt động:**
  - Set `CreateInstantInvite = false` cho @everyone ở tất cả kênh
  - Chỉ administrators mới có thể tạo invite
- **Output:** Số kênh đã khóa và invite đã xóa

#### `/lock-invites unlock`
- **Chức năng:** Cho phép tạo invite links trở lại
- **Cách hoạt động:**
  - Reset `CreateInstantInvite = null` (về mặc định)
- **Output:** Số kênh đã mở khóa

#### `/lock-invites status`
- **Chức năng:** Kiểm tra trạng thái hiện tại
- **Output:** 
  - Trạng thái LOCKED/UNLOCKED
  - Số kênh bị khóa
  - Số invite đang hoạt động

### Ví dụ sử dụng:

```
/lock-invites lock delete_existing:True
→ 🔒 Đã khóa 25 kênh, xóa 12 invite

/lock-invites status
→ 🔒 LOCKED - 25 kênh bị khóa, 0 invite hoạt động

/lock-invites unlock
→ 🔓 Đã mở khóa 25 kênh
```

---

## 🗑️ 3. Purge Bans

**Mục đích:** Xóa tất cả bans trong server (mass unban).

### ⚠️ CẢNH BÁO:
- **CHỈ SERVER OWNER** mới có thể sử dụng
- Command này **KHÔNG THỂ HOÀN TÁC**
- Phải xác nhận bằng `confirm:True`

### Command:

#### `/purge-bans confirm:True`
- **Chức năng:** Xóa tất cả bans hiện có
- **Bắt buộc:** `confirm:True` để thực thi
- **Output:** 
  - Số thành viên đã unban thành công
  - Số thành viên thất bại (nếu có)
  - Danh sách thất bại (tối đa 10)

### Ví dụ sử dụng:

```
/purge-bans confirm:False
→ ⚠️ Bạn phải xác nhận để thực thi lệnh này!

/purge-bans confirm:True
→ 🗑️ Đã xóa 47/50 bans
   ✅ Đã unban: 47 thành viên
   ❌ Thất bại: 3 thành viên
```

---

## 🔐 Permissions Required

| Feature | Bot Permission | User Permission |
|---------|---------------|-----------------|
| Anti-Cancer | Manage Nicknames | Manage Nicknames |
| Lock Invites | Manage Channels | Manage Server |
| Purge Bans | Ban Members | Owner Only |

---

## 🎯 Use Cases

### 1. Anti-Raid Protection
```bash
# Khi server bị raid
/lock-invites lock delete_existing:True  # Khóa invite ngay
/anti-cancer fix                          # Sửa nickname spam
```

### 2. Server Cleanup
```bash
# Dọn dẹp server mới nhận ownership
/purge-bans confirm:True                 # Xóa tất cả bans cũ
/anti-cancer fix replacement:Member      # Chuẩn hóa nickname
```

### 3. Event Protection
```bash
# Trước event lớn
/lock-invites lock                       # Khóa invite tạm thời
/anti-cancer toggle                      # Bật auto-fix

# Sau event
/lock-invites unlock                     # Mở lại invite
```

---

## 🐛 Troubleshooting

### "Không thể sửa nickname"
- Bot cần quyền `Manage Nicknames`
- Vai trò của bot phải cao hơn target member

### "Không thể khóa kênh"
- Bot cần quyền `Manage Channels`
- Kiểm tra permission overrides

### "Truy cập bị từ chối" (Purge Bans)
- Command này **CHỈ** dành cho server owner
- Không có cách nào bypass

---

## 📊 Limitations

1. **Anti-Cancer:**
   - Bỏ qua members có vai trò cao hơn bot
   - Không thể sửa server owner
   - Tối đa hiển thị 25 members trong scan

2. **Lock Invites:**
   - Không ảnh hưởng đến administrators
   - Không khóa được Vanity URL
   - Invite từ partnerships vẫn hoạt động

3. **Purge Bans:**
   - Không có soft delete (thực thi ngay)
   - Không thể undo
   - Có thể bị rate limit với >1000 bans

---

## 🚀 Future Enhancements

- [ ] Auto-ban cancer nicknames sau X warnings
- [ ] Whitelist cho lock-invites
- [ ] Backup bans trước khi purge
- [ ] Scheduled auto-cleanup
- [ ] Integration với audit logs

---

**📝 Last Updated:** 2024-01-XX  
**✨ Version:** 1.0.0  
**👤 Author:** GlitchBucket Team
