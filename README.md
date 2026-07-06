# Bánh Mì Discord Bot

Bot Discord đơn giản được xây dựng với discord.js v14 và TypeScript.

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` với nội dung:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_test_guild_id (optional, for dev)
```

## Chạy bot

### Development (với nodemon)
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Deploy commands

```bash
npm run deploy
```

## Lệnh hiện có

- `/ping` - Kiểm tra độ trễ
- `/help` - Xem danh sách lệnh
- `/info` - Thông tin về bot

## Cấu trúc thư mục

```
src/
├── index.ts              # Main bot file
├── deploy-commands.ts    # Deploy slash commands
└── commands/             # Slash commands
    ├── ping.ts
    ├── help.ts
    └── info.ts
```
