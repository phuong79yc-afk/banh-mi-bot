import fs from 'fs';
import path from 'path';

interface EmojiConfig {
  guildId: string;
  emojis: Record<string, string>;
  updatedAt: string;
}

let cachedConfig: EmojiConfig | null = null;

/**
 * Load emoji config from file
 */
export function loadEmojiConfig(): EmojiConfig | null {
  if (cachedConfig) return cachedConfig;

  try {
    const configPath = path.join(process.cwd(), 'emoji-config.json');
    
    if (!fs.existsSync(configPath)) {
      console.warn('⚠️ emoji-config.json not found. Run /setup-emojis to create it.');
      return null;
    }

    const data = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(data);
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load emoji config:', error);
    return null;
  }
}

/**
 * Get animated emoji string for use in embeds
 */
export function getEmoji(name: string, fallback: string = '🎵'): string {
  const config = loadEmojiConfig();
  
  if (!config || !config.emojis[name]) {
    return fallback;
  }

  return `<a:${name}:${config.emojis[name]}>`;
}

/**
 * Get all available emojis
 */
export function getAllEmojis(): Record<string, string> {
  const config = loadEmojiConfig();
  
  if (!config) return {};

  const result: Record<string, string> = {};
  
  for (const [name, id] of Object.entries(config.emojis)) {
    result[name] = `<a:${name}:${id}>`;
  }

  return result;
}

/**
 * Check if emoji config is available
 */
export function hasEmojiConfig(): boolean {
  return loadEmojiConfig() !== null;
}

/**
 * Reload emoji config from file (useful after running /setup-emojis)
 */
export function reloadEmojiConfig(): void {
  cachedConfig = null;
  loadEmojiConfig();
}

/**
 * Music player emojis - Using SVG icon names for canvas rendering
 * These return the icon name to be used with drawSVGIcon()
 */
export const MusicEmojis = {
  playing: () => 'music_playing',
  notes: () => 'music_notes',
  disc: () => 'music_disc',
  headphones: () => 'music_headphones',
  volume: () => 'music_volume',
  loading: () => 'loading_music',
  checkmark: () => 'checkmark_music',
  forward: () => 'forward_music',
  party: () => 'party_music',
  vinyl: () => 'vinyl_spin',
};

/**
 * Music player emojis as Unicode fallback for text-only usage
 */
export const MusicEmojisFallback = {
  playing: () => '🎵',
  notes: () => '🎶',
  disc: () => '💿',
  headphones: () => '🎧',
  volume: () => '🔊',
  loading: () => '⏳',
  checkmark: () => '✅',
  forward: () => '⏭️',
  party: () => '🎉',
  vinyl: () => '📀',
};
