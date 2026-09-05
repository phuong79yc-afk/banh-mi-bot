import fs from 'fs';
import path from 'path';
import { Client } from 'discord.js';

/**
 * File Watcher for auto-reloading commands on file change
 * No need to manually /reload - just save and it updates!
 */
export class FileWatcher {
  private client: Client;
  private commandsPath: string;
  private watchers: fs.FSWatcher[] = [];
  private cooldowns: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 1000; // 1 second cooldown to prevent spam

  constructor(client: Client) {
    this.client = client;
    const baseDir = __filename.includes('dist') ? 'dist' : 'src';
    this.commandsPath = path.join(process.cwd(), baseDir, 'commands');
  }

  /**
   * Start watching for file changes
   */
  start() {
    if (!fs.existsSync(this.commandsPath)) {
      console.log('⚠️  Commands directory not found for watching');
      return;
    }

    console.log('👀 File watcher started - Commands will auto-reload on change');
    console.log(`📁 Watching: ${this.commandsPath}`);

    // Watch the commands directory
    const watcher = fs.watch(this.commandsPath, { recursive: false }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.js')) return;
      
      // Check cooldown
      const now = Date.now();
      const lastReload = this.cooldowns.get(filename) || 0;
      
      if (now - lastReload < this.COOLDOWN_MS) {
        return; // Too soon, skip
      }
      
      this.cooldowns.set(filename, now);
      
      // Reload command
      this.reloadCommand(filename);
    });

    this.watchers.push(watcher);
  }

  /**
   * Stop watching
   */
  stop() {
    this.watchers.forEach(w => w.close());
    this.watchers = [];
    console.log('🛑 File watcher stopped');
  }

  /**
   * Reload a specific command
   */
  private async reloadCommand(filename: string) {
    const commandName = filename.replace('.js', '');
    const filePath = path.join(this.commandsPath, filename);

    try {
      // Check if file still exists (could be deleted)
      if (!fs.existsSync(filePath)) {
        console.log(`🗑️  Command deleted: ${commandName}`);
        this.client.commands.delete(commandName);
        return;
      }

      // Clear cache
      delete require.cache[require.resolve(filePath)];

      // Reload
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        this.client.commands.set(command.data.name, command);
        console.log(`🔄 Auto-reloaded: ${commandName} (${new Date().toLocaleTimeString('vi-VN')})`);
      } else {
        console.log(`⚠️  ${commandName}: Missing 'data' or 'execute' export`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to reload ${commandName}:`, error.message);
    }
  }
}
