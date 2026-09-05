# 🔌 Advanced Module System

TypeScript implementation inspired by SwitLoader's architecture.

## ✨ Features

### 🚀 **Parallel Loading**
- Loads modules concurrently (batch size: 3)
- Performance tracking per module
- Total load time optimization

### 📦 **Dependency Management**
- Auto-install npm dependencies
- Module-to-module dependencies
- Smart dependency resolution graph

### 🔄 **Hot Reload**
- Reload modules without bot restart
- Command auto-update
- Event handler replacement

### 📊 **Priority System**
- Control module load order
- Lower priority = loads first
- Dependency-aware ordering

### 🎯 **Lifecycle Hooks**
- `init()` - Module initialization
- `cleanup()` - Resource cleanup on unload
- Event-driven architecture

### 📈 **Statistics & Monitoring**
- Load time per module
- Total commands/events count
- Success/failure tracking

---

## 📁 Module Structure

```
src/modules/
├── economy/
│   ├── metadata.json      # Module configuration
│   ├── entry_point.ts     # Main module class
│   ├── commands/          # Module commands
│   └── utils/             # Module utilities
│
└── music/
    ├── metadata.json
    ├── entry_point.ts
    └── ...
```

---

## 🛠️ Creating a Module

### Method 1: Use CLI (Future)
```bash
npm run create-module music "Music player module"
```

### Method 2: Manual Creation

#### 1. Create `metadata.json`
```json
{
  "name": "music",
  "version": "1.0.0",
  "description": "Music player module",
  "author": "Your Name",
  "dependencies": [
    "discord-player",
    "@discord-player/extractor"
  ],
  "moduleDependencies": [],
  "enabled": true,
  "priority": 10,
  "category": "entertainment",
  "tags": ["music", "player", "youtube"]
}
```

#### 2. Create `entry_point.ts`
```typescript
import { Client, Collection } from 'discord.js';

export class Music {
  private client: Client;
  public commands: Collection<string, any>;
  public events: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.events = new Collection();
    
    this.init();
  }

  private async init() {
    console.log('🎵 Music module initialized');
    
    // Load commands
    this.loadCommands();
    
    // Setup events
    this.setupEvents();
  }

  private loadCommands() {
    // Example: Add play command
    const playCommand = {
      data: {
        name: 'play',
        description: 'Play music'
      },
      async execute(interaction: any) {
        await interaction.reply('🎵 Playing music!');
      }
    };
    
    this.commands.set('play', playCommand);
  }

  private setupEvents() {
    // Example: Track start event
    const onTrackStart = (track: any) => {
      console.log(`🎵 Now playing: ${track.title}`);
    };
    
    this.events.set('trackStart', onTrackStart);
  }

  async cleanup() {
    console.log('🧹 Music module cleanup');
    // Clean up player, connections, etc.
  }
}
```

---

## 🎮 Usage

### Load All Modules
```typescript
import { AdvancedModuleLoader } from './core/AdvancedModuleLoader';

const loader = new AdvancedModuleLoader(client);

// Load all modules
const stats = await loader.loadAllModules();

console.log(`Loaded ${stats.loadedModules} modules in ${stats.totalLoadTime}ms`);
```

### Reload a Module
```typescript
// Hot-reload without restarting bot
await loader.reloadModule('music');
```

### Get Module Info
```typescript
const modules = loader.getLoadedModules();

modules.forEach((module, name) => {
  console.log(`${name}: ${module.commands.size} commands`);
});
```

### Listen to Events
```typescript
loader.on('module:loaded', (name, loadTime) => {
  console.log(`Module ${name} loaded in ${loadTime}ms`);
});

loader.on('module:failed', (name, error) => {
  console.error(`Failed to load ${name}:`, error);
});
```

---

## 📋 metadata.json Reference

```json
{
  "name": "string",              // Module name (required)
  "version": "string",           // Semantic version (required)
  "description": "string",       // Short description (required)
  "author": "string",            // Author name (optional)
  "dependencies": [              // npm packages (optional)
    "package-name"
  ],
  "moduleDependencies": [        // Other modules (optional)
    "other-module"
  ],
  "enabled": true,               // Enable/disable (default: true)
  "priority": 10,                // Load order (default: 999)
  "category": "string",          // Category (optional)
  "tags": ["tag1", "tag2"]      // Tags (optional)
}
```

### Priority Values
- `1-10`: Core modules (load first)
- `11-50`: Feature modules
- `51-100`: Optional modules
- `101+`: Dev/test modules

---

## 🔄 Module Lifecycle

```
1. Discovery     → Scan modules directory
2. Metadata      → Load metadata.json
3. Dependencies  → Resolve module dependencies
4. Sort          → Order by priority
5. Install       → Auto-install npm packages
6. Load          → Instantiate module class
7. Commands      → Register commands
8. Events        → Attach event handlers
9. Init          → Call init() method
```

### Unload/Reload Lifecycle
```
1. Cleanup       → Call cleanup() method
2. Remove        → Unregister commands/events
3. Cache Clear   → Clear require cache
4. Reload        → Re-execute load steps
```

---

## 📊 Statistics Example

```
╔══════════════════════════════════════════╗
║        Module Loading Summary          ║
╠══════════════════════════════════════════╣
║  Total Modules:       5                 ║
║  Loaded:              4                 ║
║  Failed:              1                 ║
║  Commands:           25                 ║
║  Events:              8                 ║
║  Total Time:        450ms              ║
║  Average Time:      112ms              ║
╚══════════════════════════════════════════╝
```

---

## 🎯 Best Practices

### ✅ Do:
- Use descriptive module names
- Set appropriate priorities
- Implement cleanup() for resources
- Handle errors gracefully
- Document dependencies

### ❌ Don't:
- Modify global state without cleanup
- Create circular dependencies
- Block the event loop in init()
- Forget to unregister events
- Hard-code configuration

---

## 🔧 Advanced Features

### Dependency Graph
Modules can depend on other modules:
```json
{
  "name": "premium-music",
  "moduleDependencies": ["music", "economy"]
}
```

Load order: `economy` → `music` → `premium-music`

### Auto-Install
Missing npm packages are installed automatically:
```json
{
  "dependencies": ["axios", "cheerio"]
}
```

System runs: `npm install axios cheerio`

### Event-Driven
Listen to loader events:
- `module:loading` - Before loading
- `module:loaded` - After successful load
- `module:failed` - On error
- `module:reloaded` - After reload

---

## 🚀 Performance Tips

1. **Use Priority**: Load critical modules first
2. **Batch Loading**: System loads 3 modules at a time
3. **Lazy Init**: Defer heavy operations to init()
4. **Cleanup**: Always implement cleanup()
5. **Cache**: Cache expensive computations

---

## 🐛 Troubleshooting

### Module won't load
```bash
# Check entry point exists
ls src/modules/yourmodule/entry_point.ts

# Check metadata is valid JSON
cat src/modules/yourmodule/metadata.json | jq
```

### Dependencies not installing
```bash
# Manual install
npm install dependency-name

# Check npm logs
npm config get loglevel
```

### Hot reload not working
```bash
# Clear require cache manually
delete require.cache[require.resolve('./path')]

# Or restart bot
npm start
```

---

## 📖 Comparison: SwitLoader vs Our System

| Feature | SwitLoader (Python) | Our System (TypeScript) |
|---------|-------------------|------------------------|
| Parallel Loading | ✅ | ✅ |
| Dependency Resolution | ✅ | ✅ |
| Auto-Install | ✅ | ✅ |
| Hot Reload | ✅ | ✅ |
| Priority System | ✅ | ✅ |
| Statistics | ✅ | ✅ |
| Event-Driven | ✅ | ✅ |
| TypeScript Support | ❌ | ✅ |
| Built-in Commands | ✅ | 🔄 (In progress) |

---

**Advanced Module System - Production Ready! 🚀**
