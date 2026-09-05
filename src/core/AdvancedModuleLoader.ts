import { Client, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Advanced Module Loader - Inspired by SwitLoader
 * Features:
 * - Parallel loading with performance tracking
 * - Dependency resolution & auto-install
 * - Hot-reload without restart
 * - Module lifecycle hooks
 * - Event-driven architecture
 * - Intelligent error handling
 */

export interface ModuleMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[]; // npm packages
  moduleDependencies?: string[]; // other modules
  enabled?: boolean;
  priority?: number; // Load order (lower = first)
  category?: string;
  tags?: string[];
}

export interface LoadedModule {
  metadata: ModuleMetadata;
  instance: any;
  path: string;
  commands: Collection<string, any>;
  events: Collection<string, any>;
  lastLoaded: Date;
  loadTime: number;
  reloadCount: number;
  status: 'loaded' | 'error' | 'disabled';
  error?: Error;
}

export interface LoaderStats {
  totalModules: number;
  loadedModules: number;
  failedModules: number;
  totalCommands: number;
  totalEvents: number;
  totalLoadTime: number;
  averageLoadTime: number;
}

export class AdvancedModuleLoader extends EventEmitter {
  private client: Client;
  private modulesPath: string;
  private commandsPath: string;
  private loadedModules: Map<string, LoadedModule>;
  private dependencyGraph: Map<string, string[]>;
  private stats: LoaderStats;

  constructor(client: Client, basePath: string = '') {
    super();
    this.client = client;
    
    // Use dist folder when running compiled code, src folder when running ts-node
    const baseDir = basePath || (__filename.includes('dist') ? 'dist' : 'src');
    this.modulesPath = path.join(process.cwd(), baseDir, 'modules');
    this.commandsPath = path.join(process.cwd(), baseDir, 'commands');
    
    this.loadedModules = new Map();
    this.dependencyGraph = new Map();
    this.stats = {
      totalModules: 0,
      loadedModules: 0,
      failedModules: 0,
      totalCommands: 0,
      totalEvents: 0,
      totalLoadTime: 0,
      averageLoadTime: 0
    };

    this.setupEventHandlers();
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers() {
    this.on('module:loading', (name) => {
      console.log(`🔄 Loading module: ${name}`);
    });

    this.on('module:loaded', (name, loadTime) => {
      console.log(`✅ Loaded module: ${name} (${loadTime}ms)`);
    });

    this.on('module:failed', (name, error) => {
      console.error(`❌ Failed to load module: ${name}`, error.message);
    });

    this.on('module:reloaded', (name) => {
      console.log(`🔄 Reloaded module: ${name}`);
    });
  }

  /**
   * ⚡ Parallel module loading with dependency resolution
   */
  async loadAllModules(): Promise<LoaderStats> {
    const startTime = Date.now();
    console.log('📦 [AdvancedLoader] Starting module loading pipeline...\n');

    // Ensure directories exist
    this.ensureDirectories();

    // Discover modules
    const moduleDirs = this.discoverModules();
    this.stats.totalModules = moduleDirs.length;

    if (moduleDirs.length === 0) {
      console.log('✅ No modules found\n');
      return this.stats;
    }

    console.log(`📊 Found ${moduleDirs.length} module(s)\n`);

    // Load metadata and build dependency graph
    const moduleInfos = await this.loadModuleMetadata(moduleDirs);
    
    // Sort by priority
    const sortedModules = this.sortByPriority(moduleInfos);

    // Resolve dependencies
    const loadOrder = this.resolveDependencies(sortedModules);
    console.log(`📋 Load order: ${loadOrder.join(' → ')}\n`);

    // ⚡ Parallel loading (respecting dependencies)
    await this.loadModulesParallel(loadOrder);

    // Calculate stats
    this.stats.totalLoadTime = Date.now() - startTime;
    this.stats.averageLoadTime = this.stats.loadedModules > 0 
      ? Math.round(this.stats.totalLoadTime / this.stats.loadedModules) 
      : 0;

    // Print summary
    this.printLoadingSummary();

    return this.stats;
  }

  /**
   * Discover all modules in modules directory
   */
  private discoverModules(): string[] {
    if (!fs.existsSync(this.modulesPath)) {
      return [];
    }

    return fs.readdirSync(this.modulesPath).filter(file => {
      const fullPath = path.join(this.modulesPath, file);
      return fs.statSync(fullPath).isDirectory();
    });
  }

  /**
   * Load metadata for all modules
   */
  private async loadModuleMetadata(moduleDirs: string[]): Promise<Map<string, ModuleMetadata>> {
    const metadata = new Map<string, ModuleMetadata>();

    for (const dir of moduleDirs) {
      const metadataPath = path.join(this.modulesPath, dir, 'metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        const content = fs.readFileSync(metadataPath, 'utf-8');
        metadata.set(dir, JSON.parse(content));
      } else {
        metadata.set(dir, {
          name: dir,
          version: '1.0.0',
          description: 'No description',
          enabled: true,
          priority: 999
        });
      }
    }

    return metadata;
  }

  /**
   * Sort modules by priority
   */
  private sortByPriority(moduleInfos: Map<string, ModuleMetadata>): Map<string, ModuleMetadata> {
    return new Map(
      Array.from(moduleInfos.entries())
        .sort((a, b) => (a[1].priority || 999) - (b[1].priority || 999))
    );
  }

  /**
   * Resolve module dependencies and determine load order
   */
  private resolveDependencies(moduleInfos: Map<string, ModuleMetadata>): string[] {
    const visited = new Set<string>();
    const loadOrder: string[] = [];

    const visit = (moduleName: string) => {
      if (visited.has(moduleName)) return;
      
      const metadata = moduleInfos.get(moduleName);
      if (!metadata || metadata.enabled === false) return;

      visited.add(moduleName);

      // Visit dependencies first
      if (metadata.moduleDependencies) {
        for (const dep of metadata.moduleDependencies) {
          if (moduleInfos.has(dep)) {
            visit(dep);
          }
        }
      }

      loadOrder.push(moduleName);
    };

    // Visit all modules
    for (const moduleName of moduleInfos.keys()) {
      visit(moduleName);
    }

    return loadOrder;
  }

  /**
   * Load modules in parallel (batch loading)
   */
  private async loadModulesParallel(loadOrder: string[]): Promise<void> {
    const batchSize = 3; // Load 3 modules at a time
    
    for (let i = 0; i < loadOrder.length; i += batchSize) {
      const batch = loadOrder.slice(i, i + batchSize);
      const promises = batch.map(name => this.loadModule(name));
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value) {
            this.stats.loadedModules++;
            this.stats.totalCommands += result.value.commands.size;
            this.stats.totalEvents += result.value.events.size;
          }
        } else {
          this.stats.failedModules++;
        }
      });
    }
  }

  /**
   * Load a single module
   */
  async loadModule(moduleName: string): Promise<LoadedModule | null> {
    const startTime = Date.now();
    this.emit('module:loading', moduleName);

    try {
      const modulePath = path.join(this.modulesPath, moduleName);
      const entryPoint = path.join(modulePath, 'entry_point.ts');

      // Check if exists
      if (!fs.existsSync(entryPoint)) {
        throw new Error(`Entry point not found: ${entryPoint}`);
      }

      // Load metadata
      const metadata = await this.getModuleMetadata(moduleName);

      // Check if enabled
      if (metadata.enabled === false) {
        console.log(`⏭️  Skipping disabled module: ${moduleName}`);
        return null;
      }

      // Install dependencies
      if (metadata.dependencies && metadata.dependencies.length > 0) {
        await this.installDependencies(metadata.dependencies, moduleName);
      }

      // Clear cache for hot reload
      delete require.cache[require.resolve(entryPoint)];

      // Load module
      const moduleExports = require(entryPoint);
      const MainClass = moduleExports[this.capitalize(moduleName)] || moduleExports.default;

      if (!MainClass) {
        throw new Error(`Main class not found in ${entryPoint}`);
      }

      // Instantiate
      const instance = new MainClass(this.client);

      // Collect commands
      const commands = new Collection<string, any>();
      if (instance.commands) {
        for (const [name, command] of instance.commands) {
          commands.set(name, command);
          this.client.commands.set(name, command);
        }
      }

      // Collect events
      const events = new Collection<string, any>();
      if (instance.events) {
        for (const [name, handler] of instance.events) {
          events.set(name, handler);
          this.client.on(name, handler);
        }
      }

      const loadTime = Date.now() - startTime;

      const loadedModule: LoadedModule = {
        metadata,
        instance,
        path: modulePath,
        commands,
        events,
        lastLoaded: new Date(),
        loadTime,
        reloadCount: 0,
        status: 'loaded'
      };

      this.loadedModules.set(moduleName, loadedModule);
      this.emit('module:loaded', moduleName, loadTime);

      return loadedModule;

    } catch (error: any) {
      this.emit('module:failed', moduleName, error);
      
      const failedModule: LoadedModule = {
        metadata: { name: moduleName, version: '0.0.0', description: 'Failed to load' },
        instance: null,
        path: path.join(this.modulesPath, moduleName),
        commands: new Collection(),
        events: new Collection(),
        lastLoaded: new Date(),
        loadTime: Date.now() - startTime,
        reloadCount: 0,
        status: 'error',
        error
      };

      this.loadedModules.set(moduleName, failedModule);
      return null;
    }
  }

  /**
   * Hot-reload a module without restarting bot
   */
  async reloadModule(moduleName: string): Promise<boolean> {
    const existing = this.loadedModules.get(moduleName);
    
    if (existing) {
      // Cleanup
      if (existing.instance?.cleanup) {
        await existing.instance.cleanup();
      }
      
      // Remove commands
      for (const cmdName of existing.commands.keys()) {
        this.client.commands.delete(cmdName);
      }
      
      // Remove events
      for (const [eventName, handler] of existing.events) {
        this.client.off(eventName, handler);
      }
    }

    // Reload
    const reloaded = await this.loadModule(moduleName);
    
    if (reloaded) {
      reloaded.reloadCount = (existing?.reloadCount || 0) + 1;
      this.emit('module:reloaded', moduleName);
      return true;
    }

    return false;
  }

  /**
   * Get module metadata
   */
  private async getModuleMetadata(moduleName: string): Promise<ModuleMetadata> {
    const metadataPath = path.join(this.modulesPath, moduleName, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(content);
    }

    return {
      name: moduleName,
      version: '1.0.0',
      description: 'No description',
      enabled: true
    };
  }

  /**
   * Auto-install npm dependencies
   */
  private async installDependencies(deps: string[], moduleName: string): Promise<void> {
    const { execSync } = require('child_process');
    
    const missing: string[] = [];
    for (const dep of deps) {
      try {
        require.resolve(dep);
      } catch {
        missing.push(dep);
      }
    }

    if (missing.length === 0) return;

    console.log(`📦 Installing ${missing.length} dependencies for ${moduleName}...`);
    
    try {
      execSync(`npm install ${missing.join(' ')}`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${missing.join(', ')}`);
    }
  }

  /**
   * Print loading summary
   */
  private printLoadingSummary() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║        Module Loading Summary          ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Total Modules:    ${this.stats.totalModules.toString().padStart(4)}                 ║`);
    console.log(`║  Loaded:           ${this.stats.loadedModules.toString().padStart(4)}                 ║`);
    console.log(`║  Failed:           ${this.stats.failedModules.toString().padStart(4)}                 ║`);
    console.log(`║  Commands:         ${this.stats.totalCommands.toString().padStart(4)}                 ║`);
    console.log(`║  Events:           ${this.stats.totalEvents.toString().padStart(4)}                 ║`);
    console.log(`║  Total Time:       ${this.stats.totalLoadTime.toString().padStart(4)}ms              ║`);
    console.log(`║  Average Time:     ${this.stats.averageLoadTime.toString().padStart(4)}ms              ║`);
    console.log('╚══════════════════════════════════════════╝\n');
  }

  /**
   * Get loader statistics
   */
  getStats(): LoaderStats {
    return { ...this.stats };
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules(): Map<string, LoadedModule> {
    return this.loadedModules;
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories() {
    if (!fs.existsSync(this.modulesPath)) {
      fs.mkdirSync(this.modulesPath, { recursive: true });
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create module template
   */
  createModule(name: string, description: string = 'No description'): string {
    const modulePath = path.join(this.modulesPath, name);
    
    if (fs.existsSync(modulePath)) {
      throw new Error(`Module "${name}" already exists`);
    }

    fs.mkdirSync(modulePath, { recursive: true });

    // metadata.json
    const metadata: ModuleMetadata = {
      name,
      version: '1.0.0',
      description,
      enabled: true,
      priority: 100,
      category: 'general',
      tags: []
    };

    fs.writeFileSync(
      path.join(modulePath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // entry_point.ts
    const className = this.capitalize(name);
    const template = `import { Client, Collection } from 'discord.js';

export class ${className} {
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
    console.log('✨ ${className} module initialized');
    // Add your initialization code here
  }

  async cleanup() {
    console.log('🧹 ${className} module cleanup');
    // Clean up resources
  }
}
`;

    fs.writeFileSync(path.join(modulePath, 'entry_point.ts'), template);

    console.log(`✅ Created module: ${name}`);
    console.log(`📁 Path: ${modulePath}`);

    return modulePath;
  }
}
