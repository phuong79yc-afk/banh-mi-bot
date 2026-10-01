import { ModuleType } from './ModuleType';

/**
 * Module metadata interface
 */
export interface ModuleMetadata {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  priority?: number;
  type?: ModuleType | ModuleType[]; // Can have multiple types
  author?: string;
  dependencies?: string[];
}

/**
 * Enhanced module metadata with type support
 */
export interface EnhancedModuleMetadata extends ModuleMetadata {
  type: ModuleType | ModuleType[];
  
  // Configuration for different types
  prefixCommands?: string[]; // List of prefix commands
  slashCommands?: string[];  // List of slash commands
  groupCommands?: {          // Group command configuration
    name: string;
    commands: string[];
  }[];
  events?: string[];         // List of events to listen
  loopTasks?: {             // Loop task configuration
    name: string;
    interval: number;       // in milliseconds
  }[];
}
