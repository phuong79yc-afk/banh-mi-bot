import { Client, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';

export interface ModuleMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[]; // npm packages needed
  enabled?: boolean;
  main_class?: string;
  priority?: number; // Load order (lower = first)
}

export interface LoadedModule {
  metadata: ModuleMetadata;
  instance: any;
  path: string;
  commands: Collection<string, any>;
  lastLoaded: Date;
  loadTime: number; // milliseconds
}

export class ModuleLoader {
  private client: Client;
  private modulesPath: string;
  private loadedModules: Map<string, LoadedModule>;
  private commandsPath: string;

  constructor(client: Client, modulesPath: string = 'modules', commandsPath: string = 'commands') {
    this.client = client;
    // If absolute path is provided, use it directly; otherwise calculate relative path
    if (path.isAbsolute(modulesPath)) {
      this.modulesPath = modulesPath;
    } else {
      const baseDir = __filename.includes('dist') ? 'dist' : 'src';
      this.modulesPath = path.join(process.cwd(), baseDir, modulesPath);
    }
    
    if (path.isAbsolute(commandsPath)) {
      this.commandsPath = commandsPath;
    } else {
      const baseDir = __filename.includes('dist') ? 'dist' : 'src';
      this.commandsPath = path.join(process.cwd(), baseDir, commandsPath);
    }
    
    this.loadedModules = new Map();
  }

  /**
   * Load all modules from modules directory with parallel loading (SwitLoader-inspired)
   */
  async loadAllModules(): Promise<void> {
    const startTime = Date.now();
    console.log('🔄 Loading modules from:', this.modulesPath);

    // Create modules directory if it doesn't exist
    if (!fs.existsSync(this.modulesPath)) {
      fs.mkdirSync(this.modulesPath, { recursive: true });
      console.log('📁 Created modules directory');
      return;
    }

    const moduleDirs = fs.readdirSync(this.modulesPath).filter(file => {
      const fullPath = path.join(this.modulesPath, file);
      return fs.statSync(fullPath).isDirectory();
    });

    console.log(`📦 Found ${moduleDirs.length} module(s)`);

    if (moduleDirs.length === 0) {
      console.log('✅ No modules to load');
      return;
    }

    // Load metadata for all modules first to check priorities
    const moduleInfos = await Promise.all(
      moduleDirs.map(async (dir) => {
        const metadataPath = path.join(this.modulesPath, dir, 'metadata.json');
        let metadata: ModuleMetadata;
        
        if (fs.existsSync(metadataPath)) {
          const content = fs.readFileSync(metadataPath, 'utf-8');
          metadata = JSON.parse(content);
        } else {
          metadata = {
            name: dir,
            version: '1.0.0',
            description: 'No description',
            enabled: true,
            priority: 999
          };
        }
        
        return { dir, metadata };
      })
    );

    // Sort by priority (lower = load first)
    moduleInfos.sort((a, b) => (a.metadata.priority || 999) - (b.metadata.priority || 999));

    // ⚡ Parallel loading with Promise.allSettled (inspired by SwitLoader)
    const loadPromises = moduleInfos.map(({ dir }) => this.loadModule(dir));
    const results = await Promise.allSettled(loadPromises);

    // Report results
    let successCount = 0;
    let failCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      } else if (result.status === 'rejected') {
        failCount++;
        console.error(`❌ Failed to load "${moduleInfos[index].dir}":`, result.reason?.message || result.reason);
      }
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Loaded ${successCount} module(s) successfully in ${elapsed}ms`);
    if (failCount > 0) {
      console.log(`⚠️  ${failCount} module(s) failed to load`);
    }
  }

  /**
   * Load a specific module with performance tracking (SwitLoader-inspired)
   */
  async loadModule(moduleName: string): Promise<LoadedModule | null> {
    const moduleStartTime = Date.now();
    const modulePath = path.join(this.modulesPath, moduleName);
    const metadataPath = path.join(modulePath, 'metadata.json');
    
    // Support both .js (compiled) and .ts (dev mode with ts-node)
    const entryPointJs = path.join(modulePath, 'entry_point.js');
    const entryPointTs = path.join(modulePath, 'entry_point.ts');
    const entryPointPath = fs.existsSync(entryPointJs) ? entryPointJs : entryPointTs;

    // Check if module directory exists
    if (!fs.existsSync(modulePath)) {
      throw new Error(`Module directory not found: ${modulePath}`);
    }

    // Load metadata
    let metadata: ModuleMetadata;
    if (fs.existsSync(metadataPath)) {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } else {
      // Default metadata if not found
      metadata = {
        name: moduleName,
        version: '1.0.0',
        description: 'No description provided',
        enabled: true
      };
    }

    // Check if module is enabled
    if (metadata.enabled === false) {
      console.log(`⏭️  Skipping disabled module: ${moduleName}`);
      return null;
    }

    // 🔄 Auto-install dependencies (SwitLoader feature)
    if (metadata.dependencies && metadata.dependencies.length > 0) {
      await this.installDependencies(metadata.dependencies, moduleName);
    }

    // Check if entry point exists
    if (!fs.existsSync(entryPointPath)) {
      throw new Error(`Entry point not found: ${entryPointJs} or ${entryPointTs}`);
    }

    // Clear cache to allow hot reload
    delete require.cache[require.resolve(entryPointPath)];

    // Load the module
    const moduleExports = require(entryPointPath);
    
    // Get config if exists
    const config = moduleExports.CONFIG || {};
    
    // Determine main class name (priority: metadata.main_class > config.main_class > capitalize)
    const mainClassName = metadata.main_class || config.main_class || this.capitalize(moduleName);
    
    // Get the main class (support both named export and default export)
    const MainClass = moduleExports[mainClassName] || moduleExports.default;
    
    if (!MainClass) {
      throw new Error(`Main class "${mainClassName}" not found in ${entryPointPath}`);
    }

    // Instantiate the module
    const instance = new MainClass(this.client);

    // Initialize module (call async initialize if exists)
    if (instance.initialize && typeof instance.initialize === 'function') {
      await instance.initialize();
    }

    // Collect commands from the module
    const commands = new Collection<string, any>();
    
    // Check if module has commands property
    if (instance.commands) {
      for (const [name, command] of instance.commands) {
        commands.set(name, command);
        this.client.commands.set(name, command);
      }
    }

    const loadTime = Date.now() - moduleStartTime;

    // Store loaded module
    const loadedModule: LoadedModule = {
      metadata,
      instance,
      path: modulePath,
      commands,
      lastLoaded: new Date(),
      loadTime
    };

    this.loadedModules.set(moduleName, loadedModule);

    console.log(`✅ Loaded module: ${metadata.name} v${metadata.version} (${loadTime}ms)`);
    
    return loadedModule;
  }

  /**
   * Auto-install npm dependencies for a module (SwitLoader feature)
   */
  private async installDependencies(dependencies: string[], moduleName: string): Promise<void> {
    const { execSync } = require('child_process');
    
    console.log(`📦 Checking dependencies for module: ${moduleName}`);
    
    const missingDeps: string[] = [];
    
    for (const dep of dependencies) {
      try {
        require.resolve(dep);
      } catch {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length === 0) {
      return;
    }
    
    console.log(`⬇️  Installing ${missingDeps.length} missing dependencies: ${missingDeps.join(', ')}`);
    
    try {
      execSync(`npm install ${missingDeps.join(' ')}`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      console.log(`✅ Dependencies installed successfully`);
    } catch (error) {
      console.error(`❌ Failed to install dependencies:`, error);
      throw new Error(`Failed to install dependencies for module "${moduleName}"`);
    }
  }

  /**
   * Unload a specific module
   */
  async unloadModule(moduleName: string): Promise<boolean> {
    const loadedModule = this.loadedModules.get(moduleName);
    
    if (!loadedModule) {
      console.log(`⚠️  Module "${moduleName}" is not loaded`);
      return false;
    }

    // Remove commands from client
    for (const [commandName] of loadedModule.commands) {
      this.client.commands.delete(commandName);
    }

    // Call cleanup if exists
    if (loadedModule.instance.cleanup && typeof loadedModule.instance.cleanup === 'function') {
      try {
        await loadedModule.instance.cleanup();
      } catch (error) {
        console.error(`❌ Error during module cleanup:`, error);
      }
    }

    // Remove from loaded modules
    this.loadedModules.delete(moduleName);

    console.log(`🗑️  Unloaded module: ${moduleName}`);
    
    return true;
  }

  /**
   * Reload a specific module
   */
  async reloadModule(moduleName: string): Promise<LoadedModule | null> {
    console.log(`🔄 Reloading module: ${moduleName}`);
    
    await this.unloadModule(moduleName);
    return await this.loadModule(moduleName);
  }

  /**
   * Reload all modules
   */
  async reloadAllModules(): Promise<void> {
    console.log('🔄 Reloading all modules...');
    
    const moduleNames = Array.from(this.loadedModules.keys());
    
    for (const moduleName of moduleNames) {
      try {
        await this.reloadModule(moduleName);
      } catch (error: any) {
        console.error(`❌ Failed to reload module "${moduleName}":`, error.message);
      }
    }

    console.log('✅ All modules reloaded');
  }

  /**
   * Load legacy commands from commands directory
   */
  async loadLegacyCommands(): Promise<void> {
    console.log('🔄 Loading legacy commands from:', this.commandsPath);

    if (!fs.existsSync(this.commandsPath)) {
      console.log('📁 No legacy commands directory found');
      return;
    }

    const commandFiles = fs.readdirSync(this.commandsPath).filter(file => 
      file.endsWith('.js') || file.endsWith('.ts')
    );

    let loadedCount = 0;

    for (const file of commandFiles) {
      const filePath = path.join(this.commandsPath, file);
      
      // Clear cache
      delete require.cache[require.resolve(filePath)];
      
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        this.client.commands.set(command.data.name, command);
        loadedCount++;
        console.log(`✅ Loaded legacy command: ${command.data.name}`);
      }
    }

    console.log(`✅ Loaded ${loadedCount} legacy command(s)`);
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules(): Map<string, LoadedModule> {
    return this.loadedModules;
  }

  /**
   * Get module info
   */
  getModuleInfo(moduleName: string): LoadedModule | undefined {
    return this.loadedModules.get(moduleName);
  }

  /**
   * List all available modules in modules directory
   */
  listAvailableModules(): string[] {
    if (!fs.existsSync(this.modulesPath)) {
      return [];
    }

    return fs.readdirSync(this.modulesPath).filter(file => {
      const fullPath = path.join(this.modulesPath, file);
      return fs.statSync(fullPath).isDirectory();
    });
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create a new module template
   */
  createModuleTemplate(moduleName: string, description: string = 'No description'): void {
    const modulePath = path.join(this.modulesPath, moduleName);
    
    if (fs.existsSync(modulePath)) {
      throw new Error(`Module "${moduleName}" already exists`);
    }

    // Create module directory
    fs.mkdirSync(modulePath, { recursive: true });

    // Create metadata.json
    const metadata: ModuleMetadata = {
      name: moduleName,
      version: '1.0.0',
      description,
      author: 'Unknown',
      enabled: true
    };

    fs.writeFileSync(
      path.join(modulePath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Create entry_point.ts
    const className = this.capitalize(moduleName);
    const entryPointTemplate = `import { Client, Collection } from 'discord.js';

/**
 * ${className} Module
 * ${description}
 */
export class ${className} {
  private client: Client;
  public commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    
    // Initialize your module here
    this.init();
  }

  private async init() {
    console.log('🚀 ${className} module initialized');
    
    // Load your commands, events, etc. here
  }

  /**
   * Cleanup function called when module is unloaded
   */
  async cleanup() {
    console.log('🧹 ${className} module cleanup');
    // Clean up resources here
  }
}
`;

    fs.writeFileSync(
      path.join(modulePath, 'entry_point.ts'),
      entryPointTemplate
    );

    console.log(`✅ Created module template: ${moduleName}`);
    console.log(`📁 Location: ${modulePath}`);
  }
}
