import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface BotSettings {
  prefix: string;
  language: 'vi' | 'en' | 'ja';
  timezone: string;
  ownerId: string;
  autoReply: boolean;
  dmCommands: boolean;
  typing: boolean;
  embedReplies: boolean;
  errorNotif: boolean;
  startNotif: boolean;
}

const SETTINGS_FILE = join(process.cwd(), 'bot-settings.json');

const DEFAULT_SETTINGS: BotSettings = {
  prefix: '/',
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
  ownerId: '',
  autoReply: true,
  dmCommands: false,
  typing: true,
  embedReplies: true,
  errorNotif: true,
  startNotif: true
};

let currentSettings: BotSettings = { ...DEFAULT_SETTINGS };

export function loadSettings(): BotSettings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = readFileSync(SETTINGS_FILE, 'utf-8');
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      console.log('✅ Đã load settings từ file');
    } else {
      console.log('ℹ️ Sử dụng settings mặc định');
      saveSettings(currentSettings);
    }
  } catch (error) {
    console.error('❌ Lỗi khi load settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  return currentSettings;
}

export function saveSettings(settings: BotSettings): void {
  try {
    currentSettings = { ...settings };
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    console.log('💾 Đã lưu settings vào file');
  } catch (error) {
    console.error('❌ Lỗi khi lưu settings:', error);
  }
}

export function getSettings(): BotSettings {
  return { ...currentSettings };
}

export function resetSettings(): BotSettings {
  currentSettings = { ...DEFAULT_SETTINGS };
  saveSettings(currentSettings);
  console.log('🔄 Đã reset settings về mặc định');
  return currentSettings;
}

export function updateSetting<K extends keyof BotSettings>(key: K, value: BotSettings[K]): void {
  currentSettings[key] = value;
  saveSettings(currentSettings);
}

// Helper functions for specific settings
export function shouldAutoReply(): boolean {
  return currentSettings.autoReply;
}

export function allowDMCommands(): boolean {
  return currentSettings.dmCommands;
}

export function shouldShowTyping(): boolean {
  return currentSettings.typing;
}

export function useEmbedReplies(): boolean {
  return currentSettings.embedReplies;
}

export function shouldSendErrorNotif(): boolean {
  return currentSettings.errorNotif;
}

export function shouldSendStartupNotif(): boolean {
  return currentSettings.startNotif;
}

export function getOwnerId(): string {
  return currentSettings.ownerId;
}

export function getPrefix(): string {
  return currentSettings.prefix;
}

export function getLanguage(): string {
  return currentSettings.language;
}

export function getTimezone(): string {
  return currentSettings.timezone;
}
