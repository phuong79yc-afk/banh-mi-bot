// Custom Role Manager
import fs from 'fs';
import path from 'path';
import { Guild, Role, ColorResolvable } from 'discord.js';

export interface CustomRoleData {
  guildId: string;
  userId: string;
  roleId: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface CustomRoleConfig {
  guildId: string;
  enabled: boolean;
  requiredRoleId?: string; // Role required to use custom roles
  maxRoles: number;
  allowedColors: string[]; // Empty = all colors allowed
}

class CustomRoleManager {
  private roles: Map<string, CustomRoleData> = new Map();
  private configs: Map<string, CustomRoleConfig> = new Map();
  private dataPath = path.join(process.cwd(), 'data', 'customroles.json');
  private configPath = path.join(process.cwd(), 'data', 'customrole-config.json');

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
        this.roles = new Map(Object.entries(data));
      }

      if (fs.existsSync(this.configPath)) {
        const configs = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.configs = new Map(Object.entries(configs));
      }

      console.log(`✅ Loaded ${this.roles.size} custom roles, ${this.configs.size} configs`);
    } catch (error) {
      console.error('❌ Error loading custom role data:', error);
    }
  }

  private saveData() {
    try {
      const dataDir = path.dirname(this.dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(
        this.dataPath,
        JSON.stringify(Object.fromEntries(this.roles), null, 2)
      );

      fs.writeFileSync(
        this.configPath,
        JSON.stringify(Object.fromEntries(this.configs), null, 2)
      );
    } catch (error) {
      console.error('❌ Error saving custom role data:', error);
    }
  }

  getConfig(guildId: string): CustomRoleConfig {
    return this.configs.get(guildId) || {
      guildId,
      enabled: false,
      maxRoles: 1,
      allowedColors: []
    };
  }

  updateConfig(guildId: string, updates: Partial<CustomRoleConfig>) {
    const config = this.getConfig(guildId);
    this.configs.set(guildId, { ...config, ...updates });
    this.saveData();
  }

  getUserRole(guildId: string, userId: string): CustomRoleData | undefined {
    return Array.from(this.roles.values()).find(
      r => r.guildId === guildId && r.userId === userId
    );
  }

  getAllGuildRoles(guildId: string): CustomRoleData[] {
    return Array.from(this.roles.values()).filter(r => r.guildId === guildId);
  }

  addRole(data: CustomRoleData) {
    const key = `${data.guildId}-${data.userId}`;
    this.roles.set(key, data);
    this.saveData();
  }

  removeRole(guildId: string, userId: string): boolean {
    const key = `${guildId}-${userId}`;
    const deleted = this.roles.delete(key);
    if (deleted) this.saveData();
    return deleted;
  }

  isColorAllowed(guildId: string, color: string): boolean {
    const config = this.getConfig(guildId);
    if (config.allowedColors.length === 0) return true;
    return config.allowedColors.some(c => c.toLowerCase() === color.toLowerCase());
  }

  async migrateRoles(fromGuild: Guild, toGuild: Guild): Promise<{ success: number; failed: number }> {
    const roles = this.getAllGuildRoles(fromGuild.id);
    let success = 0;
    let failed = 0;

    for (const roleData of roles) {
      try {
        // Create role in new guild
        const newRole = await toGuild.roles.create({
          name: roleData.name,
          color: roleData.color as ColorResolvable,
          reason: `Migrated from ${fromGuild.name}`
        });

        // Update data
        roleData.guildId = toGuild.id;
        roleData.roleId = newRole.id;
        this.addRole(roleData);

        success++;
      } catch (error) {
        console.error(`Failed to migrate role ${roleData.name}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

export const customRoleManager = new CustomRoleManager();
