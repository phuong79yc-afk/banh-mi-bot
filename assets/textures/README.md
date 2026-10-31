# Assets Folder - Custom Images

This folder contains custom images used in bot embeds.

## 📁 Files

Place your custom images here with these exact names:

### Daily Command Images
- **`daily-icon.png`** - Thumbnail icon for `/daily` command (256x256px recommended)
- **`daily-banner.png`** - Banner image for `/daily` command (1200x300px recommended)

### Exchange/Convert Command Image
- **`exchange-icon.png`** - Thumbnail icon for `/convert` command (256x256px recommended)

## 🎨 How It Works

The bot uses a priority system:

1. **First Priority**: URL from `.env` file
   ```bash
   DAILY_THUMBNAIL=https://i.imgur.com/abc123.png
   ```

2. **Second Priority**: Local file from this folder
   ```
   assets/daily-icon.png
   ```

3. **Fallback**: Default (user avatar or no image)

## 📸 Image Guidelines

### Recommended Sizes
- **Thumbnail/Icon**: 256x256px (square)
- **Banner**: 1200x300px (wide)

### Recommended Formats
- **PNG** - Best for icons with transparency
- **GIF** - For animated banners
- **JPEG** - For photos/complex images

### File Size
- Keep under 8MB (Discord limit)
- Optimize images for web (use tinypng.com or similar)

## 🔗 Using External URLs (Recommended)

Instead of local files, you can host images online:

### Option 1: Imgur (Free, Easy)
1. Upload to https://imgur.com
2. Copy direct link (ends with .png, .gif, etc.)
3. Add to `.env`:
   ```bash
   DAILY_THUMBNAIL=https://i.imgur.com/abc123.png
   ```

### Option 2: Discord CDN (Free)
1. Upload image to any Discord channel
2. Right-click → Copy Link
3. Add to `.env`:
   ```bash
   DAILY_BANNER=https://cdn.discordapp.com/attachments/123/456/image.gif
   ```

### Option 3: GitHub (Free, Reliable)
1. Upload to a public GitHub repo
2. Use raw.githubusercontent.com link
3. Add to `.env`

## 📝 Examples

### Example 1: All URLs
```bash
# .env
DAILY_THUMBNAIL=https://i.imgur.com/daily-icon.png
DAILY_BANNER=https://i.imgur.com/daily-banner.gif
EXCHANGE_THUMBNAIL=https://i.imgur.com/exchange.png
```

### Example 2: Mixed (URL + Local)
```bash
# .env
DAILY_THUMBNAIL=https://i.imgur.com/icon.gif
# DAILY_BANNER empty → uses assets/daily-banner.png
EXCHANGE_THUMBNAIL=
```

### Example 3: All Local
```bash
# .env - leave all empty
DAILY_THUMBNAIL=
DAILY_BANNER=
EXCHANGE_THUMBNAIL=
```

Then place files in this folder:
```
assets/
├── daily-icon.png
├── daily-banner.png
└── exchange-icon.png
```

## 🚀 Quick Start

**Want to add custom images right now?**

1. **Find or create your images** (256x256 for icons, 1200x300 for banner)

2. **Choose method:**
   - **Easy**: Upload to Imgur → Add URLs to `.env`
   - **Local**: Place files in this folder with exact names above

3. **Restart bot** to see changes!

## 🎯 Current Status

This folder currently contains:
- ✅ Backgrounds (minecraft-bg.png)
- ✅ Banners (balance-banner.gif, daily-banner.gif, etc.)
- ✅ Fonts (Minecraft.ttf, etc.)
- ✅ Textures (end_stone.png, moss_block.png)

**Missing (optional):**
- ❌ `daily-icon.png` - Add this for custom daily thumbnail
- ❌ `exchange-icon.png` - Add this for custom convert thumbnail

## 💡 Tips

- Use **transparent PNGs** for icons
- Use **animated GIFs** for eye-catching banners
- Compress images to reduce load time
- Test in Discord before committing
- Keep originals as backup

## 🔍 Troubleshooting

**Images not showing?**
- Check file names match exactly (case-sensitive)
- Check file format is supported (PNG, GIF, JPEG)
- Check file size under 8MB
- Check `.env` URLs are valid and accessible
- Restart bot after changes

**Still not working?**
- Check bot logs for: `[Picture] File not found: ...`
- Try with URL first (easier to debug)
- Make sure files are in correct folder

---

Made with ❤️ for Banhcuon-bot
