# Discord Bot Dashboard

Modern React dashboard for Discord bot với real-time statistics, music player, và interactive widgets.

## ✨ Features

### 🎨 UI/UX
- ✅ **Responsive Design** - Hoạt động mượt mà trên mọi thiết bị
- ✅ **Dark/Light Mode** - Toggle theme với animation mượt
- ✅ **Sidebar Navigation** - Collapsible sidebar với 4 pages
- ✅ **Animata Components** - Hand-crafted UI widgets với animations

### 📊 Dashboard Pages

#### 1. **Dashboard** (/)
- Real-time bot statistics (servers, users, uptime, memory, ping)
- Bot info card với avatar và status
- 6 stat cards với icons và colors
- Financial widgets (expense tracker, income, categories)
- Interactive widgets (Profile, Music, Storage)
- Quick actions và recent activity

#### 2. **Music Player** (/music)
- Now playing với album art
- Track progress bar với seek functionality
- Play/pause/skip controls
- Queue display (up to 10 tracks)
- Voice channel info với listener count
- Auto-refresh every 3 seconds

#### 3. **Statistics** (/stats)
- **Charts với Recharts:**
  - Server & User Growth (Line chart)
  - Command Usage (Bar chart)
  - Music Genres Distribution (Pie chart)
  - Activity by Hour (Bar chart)
- Key metrics cards với trends
- Top active servers list

#### 4. **Settings** (/settings)
- **Appearance:** Dark mode, Accent colors
- **Notifications:** Push notifications, Server alerts, Error reports
- **Music Settings:** Auto-play, Default volume, Audio quality
- **Security:** Password, 2FA, Active sessions
- **Data Management:** Export, Clear cache, Delete data

### 🔌 Backend Integration
- Axios cho API calls
- Vite proxy đến Express (port 3000)
- Auto-refresh với intervals
- Error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm hoặc pnpm
- Express backend running on port 3000

### Installation

```bash
# Cài dependencies
npm install

# Start dev server
npm run dev
```

Dashboard sẽ chạy tại: **http://localhost:5174/**

### Backend Setup

Dashboard cần Express backend chạy trên port 3000. Từ thư mục gốc:

```bash
# Thư mục gốc (không phải /client)
npm run dev
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── animata/
│   │       ├── bento-grid/
│   │       │   └── three.tsx          # Financial dashboard
│   │       └── widget/
│   │           ├── expense-tracker.tsx # Expense chart
│   │           ├── music-widget.tsx    # Music player widget
│   │           ├── profile.tsx         # Profile card
│   │           └── storage-status.tsx  # Storage bar
│   ├── layouts/
│   │   └── MainLayout.tsx             # Sidebar layout
│   ├── lib/
│   │   └── utils.ts                   # Utility functions
│   ├── pages/
│   │   ├── Dashboard.tsx              # Home page
│   │   ├── MusicPlayer.tsx            # Music page
│   │   ├── Statistics.tsx             # Stats with charts
│   │   └── Settings.tsx               # Settings page
│   ├── App.tsx                        # Router setup
│   ├── index.css                      # Tailwind + custom styles
│   └── main.tsx                       # Entry point
├── public/                            # Static assets
├── tailwind.config.js                 # Tailwind configuration
├── vite.config.ts                     # Vite + proxy config
└── package.json
```

## 🛠 Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **Routing:** React Router DOM 6
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **UI Components:** Animata (custom widgets)

## 🎨 Customization

### Thay đổi Accent Color
Trong `Settings > Appearance`, chọn accent color. Hoặc edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: "hsl(your-color)",
    }
  }
}
```

### Thêm Pages Mới

1. Tạo component trong `src/pages/`
2. Add route trong `App.tsx`:
```tsx
<Route path="new-page" element={<NewPage />} />
```
3. Add navigation item trong `MainLayout.tsx`

### Thêm Animata Components

Copy từ [Animata](https://animata.design) vào `src/components/animata/`

## 📡 API Endpoints

Dashboard sử dụng các API endpoints sau:

- `GET /api/bot/stats` - Bot statistics
- `GET /api/music/current` - Current music info
- `GET /api/music/guild/:id` - Guild-specific music
- `POST /api/music/control/:id` - Control playback
- `GET /api/activities` - Recent activities

## 🐛 Troubleshooting

### Port đã được sử dụng
Vite sẽ tự động chọn port khác (5174, 5175, etc.)

### API errors
Đảm bảo Express backend đang chạy trên port 3000:
```bash
cd ..  # Về thư mục gốc
npm run dev
```

### Build errors
Xóa node_modules và reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

Issues và Pull Requests are welcome!

---

Built with ❤️ using React + Vite + Tailwind + Animata
