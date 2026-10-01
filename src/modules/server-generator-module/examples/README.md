# Server Generator - Example Templates

This folder contains example JSON templates for different Discord server themes.

## Available Templates

### 1. 🌸 Cute/Kawaii (`cute-kawaii-example.json`)
Perfect for: Cute communities, pastel aesthetics, kawaii culture
- Emoji: 🌸 💕 ✨ 🎀 ♡ ✿ 🦄 🍓
- Kaomoji decorations
- Soft, welcoming aesthetic

### 2. ⚔️ Anime/Weeb (`anime-weeb-example.json`)
Perfect for: Anime fans, manga readers, Japanese culture enthusiasts
- Emoji: ⚔️ 🎌 🏮 🍱 🍜
- Japanese-style brackets: ︻デ═一 【═】
- Waifu/husbando channels

### 3. 🖤 Dark/Edgy (`dark-edgy-example.json`)
Perfect for: Dark aesthetic, goth communities, edgy content
- Emoji: 🖤 💀 ⚡ ☠ 🔥
- Block characters: ║█║ ▓▒░
- Dark color palette

### 4. 🔮 Neon/Cyber (`neon-cyber-example.json`)
Perfect for: Tech communities, cyberpunk aesthetic, futuristic themes
- Emoji: 🔮 💎 ⚡ 🌐
- Geometric shapes: ◢◣ ⟪⟫ ▓
- Neon color scheme

### 5. ⚔️ Fantasy/RPG (`fantasy-rpg-example.json`)
Perfect for: RPG games, D&D groups, fantasy communities
- Emoji: ⚔️ 🛡️ 🏰 🔮 🐉
- Medieval theme
- Quest and guild channels

### 6. 🎵 Music/Party (`music-party-example.json`)
Perfect for: Music lovers, DJs, party communities
- Emoji: 🎵 🎶 🎧 🎤 🪩
- Music symbols: ♪ ♫ ◉
- Karaoke and DJ features

## Usage

These templates are used by the AI to understand the expected format and style for each theme. The AI will:
1. Detect theme keywords in user prompts
2. Reference the appropriate template
3. Generate similar structures with creative variations

## Format

```json
{
  "serverName": "Server Name",
  "categories": [
    {
      "name": "CATEGORY NAME",
      "emoji": "📁",
      "channels": [
        {"name": "channel-name", "type": 0, "emoji": "💬"}
      ]
    }
  ],
  "roles": [
    {"name": "Role Name", "emoji": "👑", "color": "#HEX", "permissions": []}
  ]
}
```

## Channel Types
- `0` = Text Channel
- `2` = Voice Channel
- `5` = Announcement Channel
- `13` = Stage Channel

## Notes
- Text channels use lowercase-hyphens
- Voice channels use Title Case with spaces
- Every channel, category, and role has an emoji
- Unicode decorations enhance visual appeal
