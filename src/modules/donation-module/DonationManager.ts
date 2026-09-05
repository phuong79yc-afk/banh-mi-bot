// Donation Manager - Track donations and role rewards
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';

const DONATIONS_PATH = path.join(process.cwd(), 'data', 'donations.json');
const CONFIG_PATH = path.join(process.cwd(), 'data', 'donation-config.json');

export interface DonationUser {
  userId: string;
  guildId: string;
  username: string;
  totalAmount: number;
  donations: Array<{
    amount: number;
    note: string;
    timestamp: number;
    addedBy: string;
  }>;
}

export interface RoleReward {
  roleId: string;
  threshold: number;
}

export interface DonationConfig {
  guildId: string;
  enabled: boolean;
  receiverRoleIds: string[]; // Roles that can add donations
  roleRewards: RoleReward[]; // Role rewards for donation thresholds
  notificationChannelId: string | null;
  thankYouMessage: string;
}

export interface DonationsData {
  [key: string]: DonationUser; // key: `${guildId}_${userId}`
}

export interface ConfigData {
  [guildId: string]: DonationConfig;
}

class DonationManager {
  private donations: DonationsData = {};
  private configs: ConfigData = {};

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.donations = loadJsonDb(DONATIONS_PATH);
      this.configs = loadJsonDb(CONFIG_PATH);
      const totalDonors = Object.keys(this.donations).length;
      console.log(`✅ Loaded ${totalDonors} donors, ${Object.keys(this.configs).length} configs`);
    } catch (error) {
      console.error('Error loading donation data:', error);
      this.donations = {};
      this.configs = {};
    }
  }

  private saveDonations() {
    try {
      saveJsonDb(DONATIONS_PATH, this.donations);
    } catch (error) {
      console.error('Error saving donations:', error);
    }
  }

  private saveConfigs() {
    try {
      saveJsonDb(CONFIG_PATH, this.configs);
    } catch (error) {
      console.error('Error saving donation configs:', error);
    }
  }

  private getKey(guildId: string, userId: string): string {
    return `${guildId}_${userId}`;
  }

  // Get or create config
  getConfig(guildId: string): DonationConfig {
    if (!this.configs[guildId]) {
      this.configs[guildId] = {
        guildId,
        enabled: false,
        receiverRoleIds: [],
        roleRewards: [],
        notificationChannelId: null,
        thankYouMessage: 'Thank you {user} for donating **${amount}**! 💖'
      };
      this.saveConfigs();
    }
    return this.configs[guildId];
  }

  // Update config
  updateConfig(guildId: string, updates: Partial<DonationConfig>) {
    const config = this.getConfig(guildId);
    Object.assign(config, updates);
    this.saveConfigs();
  }

  // Check if user can receive donations
  canReceive(guildId: string, roleIds: string[]): boolean {
    const config = this.getConfig(guildId);
    if (config.receiverRoleIds.length === 0) return true; // No restriction
    return config.receiverRoleIds.some(roleId => roleIds.includes(roleId));
  }

  // Add donation
  addDonation(
    guildId: string,
    userId: string,
    username: string,
    amount: number,
    note: string,
    addedBy: string
  ): DonationUser {
    const key = this.getKey(guildId, userId);
    
    if (!this.donations[key]) {
      this.donations[key] = {
        userId,
        guildId,
        username,
        totalAmount: 0,
        donations: []
      };
    }

    const donor = this.donations[key];
    donor.totalAmount += amount;
    donor.donations.push({
      amount,
      note,
      timestamp: Date.now(),
      addedBy
    });

    this.saveDonations();
    return donor;
  }

  // Subtract donation (remove)
  subtractDonation(
    guildId: string,
    userId: string,
    amount: number,
    note: string,
    addedBy: string
  ): DonationUser | null {
    const key = this.getKey(guildId, userId);
    const donor = this.donations[key];

    if (!donor) return null;

    donor.totalAmount = Math.max(0, donor.totalAmount - amount);
    donor.donations.push({
      amount: -amount,
      note,
      timestamp: Date.now(),
      addedBy
    });

    this.saveDonations();
    return donor;
  }

  // Get donor
  getDonor(guildId: string, userId: string): DonationUser | null {
    const key = this.getKey(guildId, userId);
    return this.donations[key] || null;
  }

  // Get leaderboard
  getLeaderboard(guildId: string, limit: number = 10): DonationUser[] {
    return Object.values(this.donations)
      .filter(d => d.guildId === guildId)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }

  // Get role rewards for amount
  getRoleRewardsForAmount(guildId: string, amount: number): RoleReward[] {
    const config = this.getConfig(guildId);
    return config.roleRewards
      .filter(r => amount >= r.threshold)
      .sort((a, b) => b.threshold - a.threshold);
  }

  // Add role reward
  addRoleReward(guildId: string, roleId: string, threshold: number) {
    const config = this.getConfig(guildId);
    
    // Remove existing reward for this role
    config.roleRewards = config.roleRewards.filter(r => r.roleId !== roleId);
    
    // Add new reward
    config.roleRewards.push({ roleId, threshold });
    
    // Sort by threshold descending
    config.roleRewards.sort((a, b) => b.threshold - a.threshold);
    
    this.saveConfigs();
  }

  // Remove role reward
  removeRoleReward(guildId: string, roleId: string) {
    const config = this.getConfig(guildId);
    config.roleRewards = config.roleRewards.filter(r => r.roleId !== roleId);
    this.saveConfigs();
  }

  // Get statistics
  getStats(guildId: string): {
    totalDonors: number;
    totalAmount: number;
    avgDonation: number;
  } {
    const guildDonors = Object.values(this.donations).filter(d => d.guildId === guildId);
    const totalAmount = guildDonors.reduce((sum, d) => sum + d.totalAmount, 0);

    return {
      totalDonors: guildDonors.length,
      totalAmount,
      avgDonation: guildDonors.length > 0 ? totalAmount / guildDonors.length : 0
    };
  }

  // Replace placeholders in message
  replacePlaceholders(message: string, userId: string, username: string, amount: number): string {
    return message
      .replace(/\{user\}/g, `<@${userId}>`)
      .replace(/\{username\}/g, username)
      .replace(/\{\$amount\}/g, amount.toString())
      .replace(/\{amount\}/g, amount.toString());
  }
}

export const donationManager = new DonationManager();
