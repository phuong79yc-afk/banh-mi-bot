# 📁 Project Structure

## Root Directory

```
discord-bot/
├── 📁 src/                    # TypeScript source code
├── 📁 client/                 # React dashboard (Vite)
├── 📁 scripts/                # Build & deployment scripts
├── 📁 data/                   # Database & persistent storage
├── 📁 dist/                   # Compiled JavaScript (gitignored)
├── 📁 logs/                   # Application logs
├── 📁 public/                 # Static assets
├── 📁 docs/                   # Additional documentation
├── 📁 .kiro/                  # Kiro AI configuration
│   ├── hooks/                 # Auto-deploy hooks
│   └── steering/              # AI instructions
├── 📄 .env                    # Environment variables (gitignored)
├── 📄 .env.example            # Example environment template
├── 📄 package.json            # Dependencies & scripts
├── 📄 tsconfig.json           # TypeScript configuration
├── 📄 ecosystem.config.js     # PM2 configuration
└── 📄 README.md               # Main documentation
```

## Source Code (`src/`)

```
src/
├── 📁 commands/               # Discord slash commands (15 total)
│   ├── ai.ts                  # AI chat command
│   ├── ai-usage.ts            # AI usage statistics
│   ├── avatar.ts              # User avatar viewer
│   ├── ban.ts                 # Ban member
│   ├── help.ts                # Command help
│   ├── info.ts                # Bot information
│   ├── kick.ts                # Kick member
│   ├── pause.ts               # Pause music
│   ├── ping.ts                # Bot latency
│   ├── play.ts                # Music player
│   ├── purge.ts               # Bulk delete messages
│   ├── queue.ts               # Music queue
│   ├── skip.ts                # Skip track
│   ├── stop.ts                # Stop music
│   └── timeout.ts             # Timeout member
│
├── 📁 events/                 # Discord.js event handlers
│   ├── ready.ts               # Bot ready event
│   ├── interactionCreate.ts   # Command interactions
│   └── messageCreate.ts       # Message events
│
├── 📁 utils/                  # Utility functions
│   ├── customEmoji.ts         # Custom emoji definitions (70+ emojis)
│   ├── aiKeyRotator.ts        # AI API key rotation
│   ├── aiUsageTracker.ts      # Track AI API usage
│   ├── embedBuilder.ts        # Discord embed utilities
│   ├── embedFixer.ts          # Fix embed rendering issues
│   └── premiumChecker.ts      # Premium user validation
│
├── 📁 web/                    # Express web server
│   ├── server.ts              # Main Express app
│   └── api/
│       └── dashboardRoutes.ts # Dashboard API endpoints
│
├── 📁 core/                   # Core bot functionality
│   ├── ModuleLoader.ts        # Dynamic module loading
│   └── CommandHandler.ts      # Command execution
│
└── 📄 index.ts                # Bot entry point
```

## Client Dashboard (`client/`)

```
client/
├── 📁 src/
│   ├── 📁 pages/              # React pages
│   │   ├── Landing.tsx        # Landing page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   └── MusicPlayer.tsx    # Music controls
│   │
│   ├── 📁 components/         # Reusable components
│   │   ├── GlassCard.tsx      # Glass morphism cards
│   │   ├── LiquidGlass.tsx    # Animated background
│   │   └── PageTransition.tsx # Page transitions
│   │
│   ├── 📁 layouts/
│   │   └── MainLayout.tsx     # Main app layout
│   │
│   ├── 📁 contexts/
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── ThemeContext.tsx   # Theme management
│   │
│   └── App.tsx                # Root component
│
├── 📁 public/                 # Static assets
│   ├── icons.svg              # Icon sprites
│   └── *.mp4                  # Demo videos
│
├── index.html                 # HTML entry point
├── package.json               # Client dependencies
├── vite.config.ts             # Vite configuration
└── tailwind.config.js         # TailwindCSS config
```

## Scripts (`scripts/`)

```
scripts/
├── auto-build-and-deploy.js   # Auto build, deploy & restart
├── auto-deploy-and-restart.bat # Windows batch wrapper
└── auto-start-bot.bat         # Auto-start on Windows boot
```

## Data Storage (`data/`)

```
data/
├── database.db                # SQLite database
├── lyrics.json                # Custom lyrics storage
└── users.json                 # User data cache
```

## Key Files

### Configuration
- **`.env`** - Environment variables (tokens, API keys)
- **`tsconfig.json`** - TypeScript compiler options
- **`ecosystem.config.js`** - PM2 process manager config

### Build Output
- **`dist/`** - Compiled JavaScript from TypeScript
- **`client/dist/`** - Built React app for production

### Documentation
- **`README.md`** - Main project documentation
- **`AUTO-START-GUIDE.md`** - Windows auto-start setup
- **`DEV-WORKFLOW.md`** - Development workflow guide
- **`STRUCTURE.md`** - This file (project structure)

## File Counts

- **Commands**: 15 TypeScript files
- **Total TypeScript**: ~50 files
- **React Components**: ~20 files
- **Total LOC**: ~8,000+ lines

## Clean & Optimized

✅ Removed 66+ unused script files  
✅ Deleted 8 emoji source directories  
✅ Cleaned up 15+ documentation files  
✅ Organized scripts into `scripts/` folder  
✅ Removed empty module directories  

**Result**: Clean, maintainable codebase ready for production! 🚀
