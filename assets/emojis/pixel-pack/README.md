# Discord Pixel Emoji Pack

The 107 PNG icons from `discord_pixel_emoji_all.zip` are stored in three folders:

- `pack1_economy_games` (36 icons)
- `pack2_system_ai_moderation` (40 icons)
- `pack3_manage_minecraft_misc` (31 icons)

All images were checked as valid transparent 128x128 PNGs. The original pack instructions are in [PACK-README.txt](./PACK-README.txt).

The bot's current Discord server has 98 of these icons uploaded. Nine supplementary Minecraft icons were left out to fit the server's emoji limit. Uploaded IDs are tracked in `emoji-ids.json`.

`src/config/commandEmojis.ts` assigns pixel icons to slash commands, context-menu commands, and supported prefix commands. The pixel emoji middleware adds each command's icon to its replies and converts supported Unicode emoji throughout bot responses. The separate generated 50-icon set is maintained by `scripts/emoji-tools/generate-banhcuon-pixel-emoji-pack.mjs`.
