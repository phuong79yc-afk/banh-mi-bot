import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface EconomySettings {
  dailyReward: number;
  startingBalance: number;
  currencySymbol: string;
  enableWork: boolean;
  workMinAmount: number;
  workMaxAmount: number;
  workCooldown: number; // in seconds
}

const ECONOMY_SETTINGS_FILE = join(process.cwd(), 'economy-settings.json');

const DEFAULT_ECONOMY_SETTINGS: EconomySettings = {
  dailyReward: 1000,
  startingBalance: 500,
  currencySymbol: '💎',
  enableWork: true,
  workMinAmount: 50,
  workMaxAmount: 150,
  workCooldown: 3600 // 1 hour
};

let currentEconomySettings: EconomySettings = { ...DEFAULT_ECONOMY_SETTINGS };

export function loadEconomySettings(): EconomySettings {
  try {
    if (existsSync(ECONOMY_SETTINGS_FILE)) {
      const data = readFileSync(ECONOMY_SETTINGS_FILE, 'utf-8');
      currentEconomySettings = { ...DEFAULT_ECONOMY_SETTINGS, ...JSON.parse(data) };
      console.log('✅ Đã load economy settings từ file');
    } else {
      console.log('ℹ️ Sử dụng economy settings mặc định');
      saveEconomySettings(currentEconomySettings);
    }
  } catch (error) {
    console.error('❌ Lỗi khi load economy settings:', error);
    currentEconomySettings = { ...DEFAULT_ECONOMY_SETTINGS };
  }
  return currentEconomySettings;
}

export function saveEconomySettings(settings: EconomySettings): void {
  try {
    currentEconomySettings = { ...settings };
    writeFileSync(ECONOMY_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    console.log('💾 Đã lưu economy settings vào file');
  } catch (error) {
    console.error('❌ Lỗi khi lưu economy settings:', error);
  }
}

export function getEconomySettings(): EconomySettings {
  return { ...currentEconomySettings };
}

export function resetEconomySettings(): EconomySettings {
  currentEconomySettings = { ...DEFAULT_ECONOMY_SETTINGS };
  saveEconomySettings(currentEconomySettings);
  console.log('🔄 Đã reset economy settings về mặc định');
  return currentEconomySettings;
}

// Helper functions
export function getDailyReward(): number {
  return currentEconomySettings.dailyReward;
}

export function getStartingBalance(): number {
  return currentEconomySettings.startingBalance;
}

export function getCurrencySymbol(): string {
  return currentEconomySettings.currencySymbol;
}

export function isWorkEnabled(): boolean {
  return currentEconomySettings.enableWork;
}

export function getWorkRewardRange(): { min: number; max: number } {
  return {
    min: currentEconomySettings.workMinAmount,
    max: currentEconomySettings.workMaxAmount
  };
}

export function getWorkCooldown(): number {
  return currentEconomySettings.workCooldown;
}
