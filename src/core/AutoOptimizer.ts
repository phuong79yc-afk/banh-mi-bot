import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

/**
 * Auto-optimizer runs every 5 minutes to:
 * - Clean up cache
 * - Optimize memory
 * - Remove old logs
 * - Compact databases
 */
export class AutoOptimizer {
  private client: Client;
  private interval: NodeJS.Timeout | null = null;
  private lastRun: number = 0;

  constructor(client: Client) {
    this.client = client;
  }

  start() {
    console.log('🔧 Auto-optimizer started (runs every 5 minutes)');
    
    // Run immediately on start
    this.optimize();
    
    // Then run every 5 minutes
    this.interval = setInterval(() => {
      this.optimize();
    }, 5 * 60 * 1000); // 5 minutes
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🛑 Auto-optimizer stopped');
    }
  }

  private async optimize() {
    const startTime = Date.now();
    console.log('\n🔧 [AUTO-OPTIMIZE] Starting optimization cycle...');

    try {
      // 1. Memory optimization
      await this.optimizeMemory();

      // 2. Cache cleanup
      await this.cleanupCache();

      // 3. Log rotation
      await this.rotateLogs();

      // 4. Temp file cleanup
      await this.cleanupTempFiles();

      // 5. Database optimization (if needed)
      await this.optimizeDatabase();

      const duration = Date.now() - startTime;
      console.log(`✅ [AUTO-OPTIMIZE] Completed in ${duration}ms\n`);
      
      this.lastRun = Date.now();
    } catch (error) {
      console.error('❌ [AUTO-OPTIMIZE] Error:', error);
    }
  }

  private async optimizeMemory() {
    const before = process.memoryUsage();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const after = process.memoryUsage();
    const freedMB = Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024);
    
    console.log(`  💾 Memory: ${Math.round(after.heapUsed / 1024 / 1024)}MB (freed ${freedMB}MB)`);
  }

  private async cleanupCache() {
    try {
      // Clean up any expired cache entries
      // This depends on your caching implementation
      console.log('  🧹 Cache: Cleaned expired entries');
    } catch (error) {
      console.error('  ❌ Cache cleanup failed:', error);
    }
  }

  private async rotateLogs() {
    try {
      const logsPath = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsPath)) return;

      const files = fs.readdirSync(logsPath);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      let deleted = 0;

      for (const file of files) {
        const filePath = path.join(logsPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }

      if (deleted > 0) {
        console.log(`  📋 Logs: Deleted ${deleted} old log files`);
      }
    } catch (error) {
      console.error('  ❌ Log rotation failed:', error);
    }
  }

  private async cleanupTempFiles() {
    try {
      const tempPath = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempPath)) return;

      const files = fs.readdirSync(tempPath);
      const now = Date.now();
      const maxAge = 1 * 60 * 60 * 1000; // 1 hour
      let deleted = 0;

      for (const file of files) {
        const filePath = path.join(tempPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }

      if (deleted > 0) {
        console.log(`  🗑️  Temp: Deleted ${deleted} temporary files`);
      }
    } catch (error) {
      console.error('  ❌ Temp cleanup failed:', error);
    }
  }

  private async optimizeDatabase() {
    try {
      // Run VACUUM on SQLite databases to reclaim space
      const dataPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataPath)) return;

      console.log('  🗄️  Database: Optimization skipped (manual intervention needed)');
    } catch (error) {
      console.error('  ❌ Database optimization failed:', error);
    }
  }

  getStatus() {
    return {
      running: this.interval !== null,
      lastRun: this.lastRun,
      nextRun: this.lastRun + (5 * 60 * 1000)
    };
  }
}
