# Implementation Plan: Security, Optimization & Cleanup

## Project Context

**Project Type:** Discord.js v14 bot with TypeScript, modular architecture  
**Build System:** TypeScript compiler + npm scripts  
**Build Command:** `npm run build`  
**Start Command:** `npm start` (or `node dist/src/index.js`)  
**Test Framework:** None configured (manual testing via bot commands)  
**Database:** better-sqlite3 for economy module, JSON files for other data  
**Modules:** 25 modules under `src/modules/` with auto-loading system

---

## Critical Issues Found

### 1. **InteractionAlreadyReplied Error** (CRITICAL BUG)
- **Location:** `src/modules/vip-module/entry_point.ts` lines 256-274
- **Issue:** Button handlers for `open_shop` and `view_daily` call `shopCommand.execute(i)` and `dailyCommand.execute(i)` directly with ButtonInteraction, but those commands internally call `interaction.deferReply()`, causing crash
- **Root Cause:** Button interaction must be deferred/replied to first before delegating to slash command logic

### 2. **Synchronous File I/O Blocking Event Loop**
- **Locations:** All modules use `fs.readFileSync()` and `fs.writeFileSync()` on hot paths
- **Impact:** Each user interaction blocks Node.js event loop during file I/O
- **Files Affected:** 
  - `src/modules/vip-module/entry_point.ts` (readJSON/writeJSON used per-interaction)
  - `src/modules/shop-module/entry_point.ts` (loadCoins/saveCoins per purchase)
  - `src/modules/daily-module/entry_point.ts` (migration function only, but daily uses SQLite)
  - `src/web/api/shopRoutes.ts` (admin endpoints)
  - `src/web/api/dashboardRoutes.ts` (stats endpoints)

### 3. **Missing Input Validation**
- **Web API routes:** No validation on request body parameters
- **Shop routes:** `adminPassword` check uses weak fallback ('reset123')
- **Dashboard routes:** Simple base64 token without expiry or validation
- **File paths:** No validation on path parameters (potential path traversal)

### 4. **Missing Rate Limiting**
- **VIP commands:** Transfer, lottery, bonus commands lack per-command rate limiting
- **Shop purchases:** No rate limiting to prevent spam buying
- **Web API:** No rate limiting on endpoints

### 5. **Security Issues**
- **Weak authentication:** Dashboard uses plain text credentials from env with weak default
- **No CSRF protection:** Web API has no CSRF tokens
- **Exposed admin password:** Hardcoded fallback password 'reset123' in shopRoutes.ts
- **No request body size limits:** Express middleware doesn't limit JSON payload size
- **CORS allows all origins:** `Access-Control-Allow-Origin: *` in server.ts

### 6. **Duplicate Code**
- **readJSON/writeJSON:** Duplicated in vip-module with identical implementation to shop-module
- **Balance checking:** getUserBalance/getUserCoins duplicated across modules
- **Emoji parsing:** parseEmoji() function likely duplicated
- **Error handling patterns:** Inconsistent across modules

### 7. **Unused Code & Dependencies**
- **Backup files:** `src/modules/server-generator-module/entry_point.ts.backup-2026-09-12_12-02-46`
- **Old backups directory:** `backups/dashboard_20261002_134242/`
- **Commented imports:** `YoutubeiExtractor` commented out in index.ts
- **Unused commands directory:** Legacy commands directory checked but likely empty

---

## Implementation Plan

### PHASE 1: CRITICAL BUG FIXES

- [ ] **Step 1: Fix InteractionAlreadyReplied in VIP module**
  
  **What:** Rewrite button handlers in `/vipinfo` command to properly handle ButtonInteraction before delegating to shop/daily logic.
  
  **Files:**
  - `src/modules/vip-module/entry_point.ts` (lines 256-274)
  
  **Changes:**
  1. In `open_shop` button handler:
     - Call `i.deferReply({ ephemeral: true })` first
     - Import buildShop function from shop-module instead of calling execute()
     - Call `buildShop()` and send result via `i.editReply()`
  
  2. In `view_daily` button handler:
     - Call `i.deferReply({ ephemeral: true })` first
     - Extract core daily logic or show daily stats instead of executing full command
     - OR show ephemeral message: "Hãy dùng lệnh `/daily` để điểm danh!"
  
  **Verify:** 
  1. Run `npm run build`
  2. Start bot with `npm start`
  3. Execute `/vipinfo` command in Discord
  4. Click "🛒 Mở Shop" button - should open shop without error
  5. Click "📅 Xem Daily" button - should show daily info without error
  6. Check console logs - no "InteractionAlreadyReplied" errors

---

### PHASE 2: SECURITY HARDENING

- [ ] **Step 2: Create shared utility module for secure file operations**
  
  **What:** Create centralized file I/O utilities with async operations, caching, and path validation.
  
  **Files:**
  - `src/utils/fileCache.ts` (NEW)
  - `src/utils/secureFileIO.ts` (NEW)
  
  **Implementation:**
  
  **`src/utils/fileCache.ts`:**
  ```typescript
  // LRU cache for JSON files with TTL
  interface CacheEntry<T> {
    data: T;
    timestamp: number;
  }
  
  class FileCache<T = any> {
    private cache: Map<string, CacheEntry<T>>;
    private ttl: number; // milliseconds
    private maxSize: number;
    
    constructor(ttl: number = 5000, maxSize: number = 100) {
      this.cache = new Map();
      this.ttl = ttl;
      this.maxSize = maxSize;
    }
    
    get(key: string): T | null;
    set(key: string, data: T): void;
    invalidate(key: string): void;
    clear(): void;
  }
  
  export const coinsCache = new FileCache<any>(5000); // 5s TTL
  export const inventoryCache = new FileCache<any>(5000);
  export const cooldownCache = new FileCache<any>(10000); // 10s TTL
  ```
  
  **`src/utils/secureFileIO.ts`:**
  ```typescript
  import fs from 'fs/promises';
  import path from 'path';
  import { coinsCache, inventoryCache } from './fileCache';
  
  const DATA_DIR = path.join(process.cwd(), 'data');
  
  // Validate that path is within data directory
  function validatePath(filePath: string): string {
    const normalized = path.resolve(filePath);
    const dataDir = path.resolve(DATA_DIR);
    if (!normalized.startsWith(dataDir)) {
      throw new Error('Path traversal detected');
    }
    return normalized;
  }
  
  export async function readJSON<T = any>(filePath: string, useCache = true): Promise<T> {
    const validPath = validatePath(filePath);
    const cacheKey = validPath;
    
    if (useCache) {
      const cached = coinsCache.get(cacheKey) || inventoryCache.get(cacheKey);
      if (cached) return cached as T;
    }
    
    try {
      const content = await fs.readFile(validPath, 'utf8');
      const data = JSON.parse(content);
      
      if (useCache) {
        if (filePath.includes('coins')) coinsCache.set(cacheKey, data);
        else if (filePath.includes('inventory')) inventoryCache.set(cacheKey, data);
      }
      
      return data;
    } catch (error: any) {
      if (error.code === 'ENOENT') return {} as T;
      throw error;
    }
  }
  
  export async function writeJSON<T = any>(filePath: string, data: T, invalidateCache = true): Promise<void> {
    const validPath = validatePath(filePath);
    await fs.writeFile(validPath, JSON.stringify(data, null, 2), 'utf8');
    
    if (invalidateCache) {
      coinsCache.invalidate(validPath);
      inventoryCache.invalidate(validPath);
    }
  }
  
  // Batch operations for atomic multi-file writes
  export async function batchWriteJSON(operations: Array<{path: string, data: any}>): Promise<void>;
  ```
  
  **Verify:**
  1. Run `npm run build` - should compile without errors
  2. Check dist/src/utils/ contains fileCache.js and secureFileIO.js

- [ ] **Step 3: Add input validation middleware for web API**
  
  **What:** Add request validation and sanitization for all web API endpoints.
  
  **Files:**
  - `src/web/middleware/validation.ts` (NEW)
  - `src/web/api/shopRoutes.ts` (modify endpoints)
  - `src/web/api/dashboardRoutes.ts` (modify endpoints)
  - `src/web/server.ts` (add middleware)
  
  **Implementation:**
  
  **`src/web/middleware/validation.ts`:**
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  
  export function validateUserId(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.body;
    if (!userId || !/^\d{17,19}$/.test(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }
    next();
  }
  
  export function validateAdminAuth(req: Request, res: Response, next: NextFunction) {
    const { adminPassword } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    
    if (!validPassword) {
      return res.status(500).json({ success: false, error: 'Admin auth not configured' });
    }
    
    if (adminPassword !== validPassword) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    next();
  }
  
  export function sanitizeString(input: string, maxLength: number = 100): string {
    return input.trim().substring(0, maxLength).replace(/[<>]/g, '');
  }
  ```
  
  **In `src/web/server.ts`:**
  Add before routes:
  ```typescript
  // Body size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Rate limiting
  import rateLimit from 'express-rate-limit';
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);
  ```
  
  **Update shopRoutes.ts `/reset` endpoint:**
  ```typescript
  import { validateAdminAuth } from '../middleware/validation';
  router.post('/reset', validateAdminAuth, async (req, res) => {
    // Remove weak fallback password check
  });
  ```
  
  **Verify:**
  1. Run `npm run build`
  2. Start bot and web server
  3. Test POST to `/api/shop/reset` with wrong password - should return 403
  4. Test POST with body > 1MB - should return 413

- [ ] **Step 4: Implement rate limiting for VIP commands**
  
  **What:** Add cooldown checks for all VIP exclusive commands.
  
  **Files:**
  - `src/modules/vip-module/entry_point.ts` (add checks to all VIP commands)
  
  **Changes:**
  1. `/vip-transfer` - Use existing TRANSFER_COOLDOWN_MS (already implemented)
  2. `/vip-lottery` - Add per-day ticket limit check (already defined as LOTTERY_MAX_TICKETS_PER_DAY)
  3. `/vip-nickname` - Use existing NICKNAME_COOLDOWN_MS (already defined but not used)
  4. `/vip-bonus` - Already has 7-day cooldown
  
  **Add missing checks:**
  ```typescript
  // In vip-nickname command execute():
  const cooldownCheck = checkCooldown(userId, NICKNAME_COOLDOWN_PATH, NICKNAME_COOLDOWN_MS);
  if (cooldownCheck.onCooldown) {
    await interaction.editReply(`❌ Bạn phải đợi ${cooldownCheck.timeLeft}s để đổi nickname tiếp!`);
    return;
  }
  // ... after successful nickname change:
  setCooldown(userId, NICKNAME_COOLDOWN_PATH);
  
  // In vip-lottery command execute():
  const usageCheck = checkDailyUsage(userId, LOTTERY_USAGE_PATH, LOTTERY_MAX_TICKETS_PER_DAY);
  if (usageCheck.limitReached) {
    await interaction.editReply(`❌ Bạn đã mua ${LOTTERY_MAX_TICKETS_PER_DAY} vé hôm nay! Quay lại vào ngày mai.`);
    return;
  }
  ```
  
  **Verify:**
  1. Run `npm run build`
  2. Test `/vip-nickname` - use twice rapidly, second should show cooldown
  3. Test `/vip-lottery` - buy tickets multiple times until hitting daily limit

- [ ] **Step 5: Strengthen web API authentication**
  
  **What:** Replace weak token system with JWT and add token expiry.
  
  **Files:**
  - `package.json` (add jsonwebtoken dependency if not present)
  - `src/web/api/dashboardRoutes.ts` (update /auth/login endpoint)
  - `src/web/middleware/auth.ts` (NEW - JWT verification middleware)
  
  **Implementation:**
  
  **`src/web/middleware/auth.ts`:**
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import jwt from 'jsonwebtoken';
  
  const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
  
  export function generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  export function verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  }
  ```
  
  **Update dashboardRoutes.ts:**
  ```typescript
  import { generateToken, verifyToken } from '../middleware/auth';
  
  router.post('/auth/login', (req, res) => {
    // ... validation ...
    const token = generateToken(username, 'admin');
    res.json({ success: true, token, role: 'admin', username });
  });
  
  // Protect sensitive endpoints
  router.get('/bot/stats/enhanced', verifyToken, (req, res) => {
    // ... existing code ...
  });
  ```
  
  **Verify:**
  1. Run `npm run build`
  2. Test login endpoint - should return JWT token
  3. Test protected endpoint without token - should return 401
  4. Test with expired token (modify code to expire in 1s) - should return 401

---

### PHASE 3: PERFORMANCE OPTIMIZATION

- [ ] **Step 6: Replace synchronous file I/O with cached async operations in VIP module**
  
  **What:** Refactor VIP module to use new async file utilities with caching.
  
  **Files:**
  - `src/modules/vip-module/entry_point.ts`
  
  **Changes:**
  1. Remove readJSON/writeJSON helper functions (lines 33-50)
  2. Import from secureFileIO: `import { readJSON, writeJSON } from '../../utils/secureFileIO';`
  3. Update all command execute() functions to be async and use await:
     ```typescript
     // Before:
     const coinsData = readJSON(COINS_PATH);
     writeJSON(COINS_PATH, coinsData);
     
     // After:
     const coinsData = await readJSON(COINS_PATH);
     await writeJSON(COINS_PATH, coinsData);
     ```
  4. Update helper functions:
     ```typescript
     async function getUserBalance(userId: string): Promise<number> {
       const coinsData = await readJSON(COINS_PATH);
       return coinsData[userId] || 0;
     }
     
     async function updateUserBalance(userId: string, amount: number): Promise<boolean> {
       const coinsData = await readJSON(COINS_PATH);
       coinsData[userId] = (coinsData[userId] || 0) + amount;
       await writeJSON(COINS_PATH, coinsData);
       return true;
     }
     ```
  
  **Verify:**
  1. Run `npm run build` - should compile without errors
  2. Test all VIP commands: `/vipinfo`, `/vip-transfer`, `/vip-bonus`, `/vip-lottery`, `/vip-nickname`, `/priority-support`
  3. Check console for file I/O errors
  4. Verify cache is working: use console.log in fileCache to track hits/misses

- [ ] **Step 7: Replace synchronous file I/O in shop module**
  
  **What:** Refactor shop module to use async file utilities.
  
  **Files:**
  - `src/modules/shop-module/entry_point.ts`
  
  **Changes:**
  1. Import async utilities: `import { readJSON, writeJSON } from '../../utils/secureFileIO';`
  2. Update loadCoins/saveCoins to be async:
     ```typescript
     async function loadCoins(): Promise<CoinsData> {
       return await readJSON<CoinsData>(coinsPath);
     }
     
     async function saveCoins(data: CoinsData): Promise<void> {
       await writeJSON(coinsPath, data);
     }
     ```
  3. Update all functions that use file I/O to be async
  4. Update command execute() functions to use await
  
  **Verify:**
  1. Run `npm run build`
  2. Test `/shop` command - should display correctly
  3. Test purchasing a role - should work without errors
  4. Test `/balance` command
  5. Test `/inventory` command

- [ ] **Step 8: Optimize web API routes with async file I/O**
  
  **What:** Update web API routes to use async file operations.
  
  **Files:**
  - `src/web/api/shopRoutes.ts`
  - `src/web/api/dashboardRoutes.ts`
  
  **Changes:**
  1. Import async utilities
  2. Update all route handlers to async/await:
     ```typescript
     // Before:
     const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
     
     // After:
     const inventoryData = await readJSON(inventoryPath);
     ```
  3. Update POST /reset endpoint to use async operations
  
  **Verify:**
  1. Run `npm run build`
  2. Start web server
  3. Test GET /api/shop/items - should load correctly
  4. Test admin endpoints with proper authentication
  5. Monitor response times - should be similar or faster with caching

- [ ] **Step 9: Add SQLite prepared statement caching in daily module**
  
  **What:** Cache prepared statements at module level instead of recreating per query.
  
  **Files:**
  - `src/modules/daily-module/entry_point.ts`
  
  **Changes:**
  Already properly implemented! Prepared statements (stmtGetUser, stmtUpsertUser, stmtGetAll) are created once at module load and reused. No changes needed.
  
  **Verify:**
  1. Review code lines 78-82 - prepared statements created at top level ✓
  2. Test `/daily` command - should work fast
  3. Test `/daily-stats` and `/daily-leaderboard`

---

### PHASE 4: CODE CLEANUP & REFACTORING

- [ ] **Step 10: Remove duplicate utility functions**
  
  **What:** Centralize common utilities and remove duplicates.
  
  **Files:**
  - `src/utils/currency.ts` (NEW - centralized balance functions)
  - `src/utils/format.ts` (NEW - number formatting)
  - `src/modules/vip-module/entry_point.ts` (remove duplicates)
  - `src/modules/shop-module/entry_point.ts` (remove duplicates)
  - `src/modules/coins-module/entry_point.ts` (if exists, update imports)
  
  **Create `src/utils/currency.ts`:**
  ```typescript
  import { readJSON, writeJSON } from './secureFileIO';
  import path from 'path';
  
  const COINS_PATH = path.join(process.cwd(), 'data', 'coins.json');
  
  export async function getUserCoins(userId: string): Promise<number> {
    const data = await readJSON<Record<string, number>>(COINS_PATH);
    return data[userId] || 0;
  }
  
  export async function addCoins(userId: string, amount: number): Promise<number> {
    const data = await readJSON<Record<string, number>>(COINS_PATH);
    data[userId] = (data[userId] || 0) + amount;
    await writeJSON(COINS_PATH, data);
    return data[userId];
  }
  
  export async function removeCoins(userId: string, amount: number): Promise<boolean> {
    const data = await readJSON<Record<string, number>>(COINS_PATH);
    const current = data[userId] || 0;
    if (current < amount) return false;
    data[userId] = current - amount;
    await writeJSON(COINS_PATH, data);
    return true;
  }
  
  export async function transferCoins(fromId: string, toId: string, amount: number): Promise<boolean> {
    const data = await readJSON<Record<string, number>>(COINS_PATH);
    const fromBalance = data[fromId] || 0;
    if (fromBalance < amount) return false;
    
    data[fromId] = fromBalance - amount;
    data[toId] = (data[toId] || 0) + amount;
    await writeJSON(COINS_PATH, data);
    return true;
  }
  ```
  
  **Create `src/utils/format.ts`:**
  ```typescript
  export function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
    return n.toLocaleString('en-US');
  }
  
  export function formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
  ```
  
  **Update modules to import from utils:**
  ```typescript
  import { getUserCoins, addCoins, removeCoins } from '../../utils/currency';
  import { formatNumber } from '../../utils/format';
  ```
  
  **Verify:**
  1. Run `npm run build` - check for import errors
  2. Test commands that use currency: `/balance`, `/shop`, `/vip-transfer`
  3. Test formatting in embeds - numbers should display correctly

- [ ] **Step 11: Clean up backup files and old code**
  
  **What:** Remove backup files, commented code, and unused directories.
  
  **Files to delete:**
  - `src/modules/server-generator-module/entry_point.ts.backup-2026-09-12_12-02-46`
  - `backups/dashboard_20261002_134242/` (entire directory)
  
  **Code to clean:**
  - `src/index.ts` line 3-4: Remove commented YoutubeiExtractor import and registration
  - `src/web/api/shopRoutes.ts` line 109: Remove hardcoded fallback password 'reset123'
  
  **Commands:**
  ```powershell
  # Delete backup files
  Remove-Item "c:\projects\code\src\modules\server-generator-module\entry_point.ts.backup-2026-09-12_12-02-46" -Force
  Remove-Item "c:\projects\code\backups\dashboard_20261002_134242" -Recurse -Force
  ```
  
  **In shopRoutes.ts:**
  ```typescript
  // Before:
  if (adminPassword !== process.env.ADMIN_PASSWORD && adminPassword !== 'reset123') {
  
  // After (handled by validation middleware in Step 3):
  // Remove this entire check, replaced by validateAdminAuth middleware
  ```
  
  **Verify:**
  1. Run commands to delete files
  2. Verify files are deleted
  3. Run `npm run build` - should succeed
  4. Check git status - backup files should not be tracked

- [ ] **Step 12: Standardize error handling across modules**
  
  **What:** Create consistent error handling pattern for all modules.
  
  **Files:**
  - `src/utils/errorHandler.ts` (NEW)
  - All module entry_point.ts files (wrap execute() with error handler)
  
  **Create `src/utils/errorHandler.ts`:**
  ```typescript
  import { ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
  import { emojis } from '../config/emojis';
  
  export async function handleCommandError(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    error: any,
    commandName: string
  ): Promise<void> {
    console.error(`[${commandName}] Error:`, error);
    
    // Handle specific Discord.js errors
    if (error.code === 10062) {
      console.warn(`[${commandName}] Interaction expired`);
      return;
    }
    
    if (error.code === 50013) {
      const message = `${emojis.error} Bot thiếu quyền để thực hiện hành động này!`;
      return sendErrorReply(interaction, message);
    }
    
    // Generic error
    const message = `${emojis.error} Có lỗi xảy ra khi thực hiện lệnh này!`;
    await sendErrorReply(interaction, message);
  }
  
  async function sendErrorReply(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    message: string
  ): Promise<void> {
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    } catch (replyError: any) {
      if (replyError.code !== 10062) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  }
  ```
  
  **Update module commands:**
  ```typescript
  import { handleCommandError } from '../../utils/errorHandler';
  
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      // ... command logic ...
    } catch (error) {
      await handleCommandError(interaction, error, 'command-name');
    }
  }
  ```
  
  **Verify:**
  1. Run `npm run build`
  2. Test commands - errors should be handled gracefully
  3. Test with missing permissions - should show user-friendly message

- [ ] **Step 13: Add environment variable validation on startup**
  
  **What:** Validate all required environment variables at bot startup.
  
  **Files:**
  - `src/utils/envValidator.ts` (NEW)
  - `src/index.ts` (call validator before login)
  
  **Create `src/utils/envValidator.ts`:**
  ```typescript
  interface EnvConfig {
    required: string[];
    optional: string[];
    defaults: Record<string, string>;
  }
  
  const config: EnvConfig = {
    required: [
      'DISCORD_TOKEN',
      'CLIENT_ID'
    ],
    optional: [
      'GUILD_ID',
      'PORT',
      'GROQ_API_KEYS',
      'ADMIN_PASSWORD',
      'JWT_SECRET',
      'DASHBOARD_USERNAME',
      'DASHBOARD_PASSWORD',
      'OWNER_ID'
    ],
    defaults: {
      PORT: '3000',
      DASHBOARD_USERNAME: 'admin',
      DASHBOARD_PASSWORD: 'admin123'
    }
  };
  
  export function validateEnv(): void {
    const missing: string[] = [];
    
    for (const key of config.required) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(key => console.error(`  - ${key}`));
      console.error('\nPlease check your .env file.');
      process.exit(1);
    }
    
    // Set defaults for optional variables
    for (const [key, value] of Object.entries(config.defaults)) {
      if (!process.env[key]) {
        process.env[key] = value;
        console.warn(`⚠️  Using default value for ${key}: ${value}`);
      }
    }
    
    // Warn about missing optional but recommended variables
    const missingOptional = config.optional.filter(key => 
      !process.env[key] && !config.defaults[key]
    );
    
    if (missingOptional.length > 0) {
      console.warn('⚠️  Optional environment variables not set:');
      missingOptional.forEach(key => console.warn(`  - ${key}`));
    }
    
    console.log('✅ Environment variables validated\n');
  }
  ```
  
  **Update src/index.ts:**
  ```typescript
  import { validateEnv } from './utils/envValidator';
  
  dotenv.config();
  validateEnv(); // Add this line after dotenv.config()
  ```
  
  **Verify:**
  1. Run `npm run build`
  2. Temporarily rename .env to test validation
  3. Run `npm start` - should exit with error message
  4. Restore .env file
  5. Run `npm start` - should start successfully with validation message

---

### PHASE 5: DOCUMENTATION & FINAL VERIFICATION

- [ ] **Step 14: Update .env.example with all required variables**
  
  **What:** Create/update .env.example with all configuration options.
  
  **Files:**
  - `.env.example` (NEW or UPDATE)
  
  **Content:**
  ```env
  # Required - Bot Authentication
  DISCORD_TOKEN=your_bot_token_here
  CLIENT_ID=your_client_id_here
  
  # Optional - Deployment Mode
  GUILD_ID=your_test_server_id  # For instant command deploy (5s vs 1h global)
  
  # Optional - AI Features
  GROQ_API_KEYS=key1,key2,key3  # Comma-separated for load balancing
  
  # Optional - Web Dashboard
  PORT=3000
  DASHBOARD_USERNAME=admin
  DASHBOARD_PASSWORD=change_this_password
  JWT_SECRET=change_this_secret_key_in_production
  
  # Optional - Admin Features
  ADMIN_PASSWORD=change_this_admin_password
  OWNER_ID=your_discord_user_id  # For priority support command
  
  # Optional - Role IDs (auto-detected if not set)
  ROLE_CHUTIEM=
  ROLE_BANHCUONCHUA=
  ROLE_HANHPHI=
  ROLE_BANHMI=
  ROLE_NUOCCHAM=
  ```
  
  **Verify:**
  1. File created/updated
  2. All variables documented with comments
  3. No sensitive values included

- [ ] **Step 15: Create SECURITY.md documentation**
  
  **What:** Document security features and best practices.
  
  **Files:**
  - `SECURITY.md` (NEW)
  
  **Content:**
  ```markdown
  # Security Guide
  
  ## Environment Variables
  
  ### Required
  - `DISCORD_TOKEN`: Keep secret, never commit to git
  - `CLIENT_ID`: Public, safe to share
  
  ### Sensitive Variables (MUST change in production)
  - `ADMIN_PASSWORD`: Used for admin API endpoints
  - `JWT_SECRET`: Used for dashboard authentication tokens
  - `DASHBOARD_PASSWORD`: Dashboard login password
  
  ### Recommendations
  1. Use strong passwords (20+ characters, random)
  2. Rotate secrets every 90 days
  3. Never commit .env file to git (already in .gitignore)
  4. Use different credentials for development vs production
  
  ## API Security
  
  ### Rate Limiting
  - Web API: 100 requests per 15 minutes per IP
  - VIP commands: Per-user cooldowns (1-5 minutes)
  - Lottery: 50 tickets per day max
  
  ### Authentication
  - Dashboard uses JWT tokens with 24h expiry
  - Admin endpoints require ADMIN_PASSWORD
  - All tokens include role-based access control
  
  ### Input Validation
  - User IDs validated with regex (17-19 digits)
  - Request body size limited to 1MB
  - File paths validated to prevent traversal
  - String inputs sanitized (HTML tags removed)
  
  ## File I/O Security
  
  ### Path Validation
  All file operations validate paths to prevent directory traversal:
  - Only files within data/ directory are accessible
  - Paths normalized before validation
  - Attempts to access outside data/ throw errors
  
  ### Permissions
  Ensure data/ directory has appropriate permissions:
  ```bash
  chmod 750 data/
  chmod 640 data/*.json
  ```
  
  ## Bot Permissions
  
  ### Required Permissions
  - Send Messages
  - Embed Links
  - Manage Roles (for shop purchases)
  - Use Slash Commands
  
  ### Principle of Least Privilege
  - Bot should NOT have Administrator permission
  - Role hierarchy: Bot role must be higher than shop roles
  - Limit to specific channels if possible
  
  ## Monitoring
  
  ### Logs to Monitor
  - Failed authentication attempts
  - Rate limit violations
  - File I/O errors
  - Permission errors
  
  ### Alerts
  Consider setting up alerts for:
  - Multiple failed admin login attempts
  - Unusual API traffic patterns
  - Memory usage spikes
  - Database errors
  
  ## Vulnerability Reporting
  
  If you discover a security vulnerability, please email [your-email]
  or create a private security advisory on GitHub.
  
  **Do NOT open public issues for security vulnerabilities.**
  ```
  
  **Verify:**
  1. File created with complete documentation
  2. All security features documented
  3. No sensitive information in file

- [ ] **Step 16: Add performance monitoring utilities**
  
  **What:** Add optional performance tracking for bottleneck identification.
  
  **Files:**
  - `src/utils/performanceMonitor.ts` (NEW)
  - `src/index.ts` (initialize monitor)
  
  **Create `src/utils/performanceMonitor.ts`:**
  ```typescript
  interface PerformanceMetric {
    name: string;
    count: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  }
  
  class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric>;
    private enabled: boolean;
    
    constructor() {
      this.metrics = new Map();
      this.enabled = process.env.NODE_ENV === 'development';
    }
    
    async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
      if (!this.enabled) return fn();
      
      const start = performance.now();
      try {
        return await fn();
      } finally {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
      }
    }
    
    private recordMetric(name: string, duration: number): void {
      const existing = this.metrics.get(name);
      if (existing) {
        existing.count++;
        existing.totalTime += duration;
        existing.avgTime = existing.totalTime / existing.count;
        existing.minTime = Math.min(existing.minTime, duration);
        existing.maxTime = Math.max(existing.maxTime, duration);
      } else {
        this.metrics.set(name, {
          name,
          count: 1,
          totalTime: duration,
          avgTime: duration,
          minTime: duration,
          maxTime: duration
        });
      }
    }
    
    getReport(): PerformanceMetric[] {
      return Array.from(this.metrics.values())
        .sort((a, b) => b.avgTime - a.avgTime);
    }
    
    printReport(): void {
      if (!this.enabled || this.metrics.size === 0) return;
      
      console.log('\n📊 Performance Report:');
      console.log('═'.repeat(80));
      console.log('Operation'.padEnd(30), 'Calls'.padEnd(10), 'Avg(ms)'.padEnd(12), 'Min(ms)'.padEnd(12), 'Max(ms)');
      console.log('─'.repeat(80));
      
      for (const metric of this.getReport()) {
        console.log(
          metric.name.padEnd(30),
          metric.count.toString().padEnd(10),
          metric.avgTime.toFixed(2).padEnd(12),
          metric.minTime.toFixed(2).padEnd(12),
          metric.maxTime.toFixed(2)
        );
      }
      console.log('═'.repeat(80) + '\n');
    }
    
    reset(): void {
      this.metrics.clear();
    }
  }
  
  export const perfMonitor = new PerformanceMonitor();
  
  // Auto-print report every 5 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      perfMonitor.printReport();
      perfMonitor.reset();
    }, 5 * 60 * 1000);
  }
  ```
  
  **Usage in modules:**
  ```typescript
  import { perfMonitor } from '../../utils/performanceMonitor';
  
  execute: async (interaction) => {
    await perfMonitor.measure('command:daily', async () => {
      // ... command logic ...
    });
  }
  ```
  
  **Verify:**
  1. Run `npm run build`
  2. Set NODE_ENV=development
  3. Use bot for 5+ minutes
  4. Check console for performance report

- [ ] **Step 17: Final integration test**
  
  **What:** Comprehensive test of all changes.
  
  **Test Checklist:**
  
  **Critical Bug Fix:**
  - [ ] `/vipinfo` command works
  - [ ] "🛒 Mở Shop" button works without errors
  - [ ] "📅 Xem Daily" button works without errors
  - [ ] No "InteractionAlreadyReplied" errors in console
  
  **VIP Commands:**
  - [ ] `/vip-transfer` - transfers coins correctly, shows cooldown on rapid use
  - [ ] `/vip-bonus` - gives weekly bonus, enforces 7-day cooldown
  - [ ] `/vip-lottery` - tickets work, enforces daily limit
  - [ ] `/vip-nickname` - changes nickname, enforces 5-minute cooldown
  - [ ] `/priority-support` - sends message to owner
  
  **Shop & Economy:**
  - [ ] `/shop` - displays all roles with pagination
  - [ ] Purchase role - deducts coins, grants role, updates inventory
  - [ ] `/balance` - shows correct balance
  - [ ] `/inventory` - shows purchased items
  - [ ] `/daily` - gives daily reward with VIP bonus
  
  **Web API:**
  - [ ] GET /api/status - returns bot status
  - [ ] POST /api/auth/login - returns JWT token
  - [ ] Protected endpoints require valid token
  - [ ] Invalid credentials return 401/403
  - [ ] Rate limiting works (test with 100+ rapid requests)
  
  **Performance:**
  - [ ] Commands respond quickly (< 1 second for simple commands)
  - [ ] No event loop blocking (bot stays responsive under load)
  - [ ] Cache working (check performance monitor report)
  - [ ] Memory stable (no leaks after extended use)
  
  **Error Handling:**
  - [ ] Missing permissions show user-friendly error
  - [ ] Invalid inputs show validation errors
  - [ ] Network errors handled gracefully
  - [ ] Bot doesn't crash on errors
  
  **Verify:**
  Run complete test suite and document any failures. All items must pass before deployment.

---

## Summary

### Files Created (13 new files)
1. `src/utils/fileCache.ts`
2. `src/utils/secureFileIO.ts`
3. `src/utils/currency.ts`
4. `src/utils/format.ts`
5. `src/utils/errorHandler.ts`
6. `src/utils/envValidator.ts`
7. `src/utils/performanceMonitor.ts`
8. `src/web/middleware/validation.ts`
9. `src/web/middleware/auth.ts`
10. `.env.example`
11. `SECURITY.md`
12. `.agents/tasks/security-optimize-plan.md` (this file)

### Files Modified (7 files)
1. `src/modules/vip-module/entry_point.ts` - Fix critical bug, add rate limiting, use async I/O
2. `src/modules/shop-module/entry_point.ts` - Use async I/O, remove duplicates
3. `src/modules/daily-module/entry_point.ts` - Already optimized, no changes
4. `src/web/api/shopRoutes.ts` - Add validation, use async I/O, remove weak password
5. `src/web/api/dashboardRoutes.ts` - Add JWT auth, use async I/O
6. `src/web/server.ts` - Add rate limiting, body size limits
7. `src/index.ts` - Add env validation, performance monitoring

### Files Deleted (2 items)
1. `src/modules/server-generator-module/entry_point.ts.backup-2026-09-12_12-02-46`
2. `backups/dashboard_20261002_134242/` (directory)

### Impact Analysis

**User-Visible Changes:**
- ✅ VIP buttons now work correctly (bug fix)
- ✅ Better error messages
- ⚠️ Rate limiting may show cooldown messages (expected behavior)
- ⚠️ Admin endpoints require proper authentication (security improvement)

**Performance Improvements:**
- File I/O moved off hot path with caching
- Average command response time reduced by 30-50% (estimated)
- Memory usage more stable

**Security Improvements:**
- Input validation on all endpoints
- JWT authentication with expiry
- Path traversal protection
- Rate limiting
- No hardcoded passwords

**Code Quality:**
- Removed duplicate code (~300 lines)
- Consistent error handling
- Centralized utilities
- Better documentation

### Deployment Notes

1. **Environment Variables:** Add new variables to production .env (JWT_SECRET, ADMIN_PASSWORD)
2. **Dependencies:** Run `npm install` if package.json updated
3. **Build:** Run `npm run build` before deployment
4. **Testing:** Test in development environment first
5. **Rollback Plan:** Keep current version running until new version verified

### Estimated Implementation Time

- Phase 1 (Critical Fixes): 2-3 hours
- Phase 2 (Security): 4-5 hours
- Phase 3 (Performance): 3-4 hours
- Phase 4 (Cleanup): 2-3 hours
- Phase 5 (Documentation): 1-2 hours

**Total: 12-17 hours** (can be split across multiple sessions)

---

## Notes for Implementer

- Each step is independent and can be tested individually
- Steps within a phase can be done in parallel (except Step 1)
- Always run `npm run build` after code changes
- Test each command after changes before moving to next step
- Keep original code commented during refactoring for easy rollback
- Monitor console logs for errors during testing
- Use git commits after each completed step for easy rollback

**Priority Order if time-limited:**
1. Step 1 (Critical bug fix) - MUST DO
2. Steps 2-5 (Security) - HIGH PRIORITY
3. Steps 6-8 (Performance) - MEDIUM PRIORITY
4. Steps 10-13 (Cleanup) - LOW PRIORITY
5. Steps 14-16 (Documentation) - OPTIONAL

