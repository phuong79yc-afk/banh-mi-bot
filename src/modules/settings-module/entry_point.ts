/**
 * Settings Module - Server feature toggle management
 * UI: Components V2 Card with StringSelectMenu
 */

import {
  ActionRowBuilder,
  Client,
  Collection,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  User,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

/* ───────────────────────────── Config ───────────────────────────── */
const DATA_PATH = path.join(process.cwd(), 'data', 'server-features.json');
const COLOR_PRIMARY = 0x5865f2; // Discord blue
const COLOR_SUCCESS = 0x57f287;
const COLOR_ERROR = 0xed4245;

/* ───────────────────────────── Types ───────────────────────────── */
interface GuildFeatures {
  welcome_system: boolean;
  goodbye_system: boolean;
  auto_role: boolean;
  level_system: boolean;
  giveaway_notifications: boolean;
}

interface ServerFeaturesData {
  [guildId: string]: GuildFeatures;
}

export type FeatureKey = keyof GuildFeatures;

interface FeatureOption {
  label: string;
  value: FeatureKey;
  emoji: string;
}

/* ───────────────────────────── Feature Definitions ───────────────────────────── */
export const FEATURES: FeatureOption[] = [
  { label: 'Welcome System', value: 'welcome_system', emoji: '👋' },
  { label: 'Goodbye System', value: 'goodbye_system', emoji: '👋' },
  { label: 'Auto Role', value: 'auto_role', emoji: '🎭' },
  { label: 'Level System', value: 'level_system', emoji: '📊' },
  { label: 'Giveaway Notifications', value: 'giveaway_notifications', emoji: '🎁' },
];

const DEFAULT_FEATURES: GuildFeatures = {
  welcome_system: true,
  goodbye_system: true,
  auto_role: true,
  level_system: true,
  giveaway_notifications: true,
};

/* ───────────────────────────── Data Management ───────────────────────────── */
function loadData(): ServerFeaturesData {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading server-features.json:', error);
    return {};
  }
}

function saveData(data: ServerFeaturesData): void {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving server-features.json:', error);
    throw error;
  }
}

export function getGuildFeatures(guildId: string): GuildFeatures {
  const data = loadData();
  if (!data[guildId]) {
    data[guildId] = { ...DEFAULT_FEATURES };
    saveData(data);
  }
  return data[guildId];
}

export function setGuildFeature(guildId: string, feature: FeatureKey, value: boolean): void {
  const data = loadData();
  if (!data[guildId]) {
    data[guildId] = { ...DEFAULT_FEATURES };
  }
  data[guildId][feature] = value;
  saveData(data);
}

/** Public helper for other modules to check feature status */
export function isFeatureEnabled(guildId: string, feature: FeatureKey): boolean {
  const features = getGuildFeatures(guildId);
  return features[feature] ?? DEFAULT_FEATURES[feature];
}

/* ───────────────────────────── UI Helpers ───────────────────────────── */
const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

function customId(action: string, userId: string) {
  return `settings:${action}:${userId}`;
}

/* ───────────────────────────── UI Cards ───────────────────────────── */
export function buildFeatureCard(user: User, guildId: string): any {
  const features = getGuildFeatures(guildId);
  
  const container = new ContainerBuilder();

  // Header
  container.addTextDisplayComponents(text(`-# ⚙️ Server Features`));
  
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        text(`## ⚙️ Server Features`),
        text(`-# Configure which features are enabled for this server`)
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 })))
  );

  container.addSeparatorComponents(divider(SeparatorSpacingSize.Large));

  // Feature status list
  const featureLines = FEATURES.map((f) => {
    const enabled = features[f.value];
    const icon = enabled ? '✅' : '❌';
    return `${icon} **${f.label}** ~ ${enabled ? 'Enabled' : 'Disabled'}`;
  });

  container.addTextDisplayComponents(
    text('### 📋 Current Status'),
    text(featureLines.join('\n'))
  );

  container.addSeparatorComponents(divider());

  // Select menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId('toggle', user.id))
    .setPlaceholder('Select a feature to toggle')
    .addOptions(
      FEATURES.map((f) => ({
        label: f.label,
        value: f.value,
        emoji: f.emoji,
        description: features[f.value] ? 'Currently enabled' : 'Currently disabled',
      }))
    );

  container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
  );

  container.addSeparatorComponents(divider());

  container.addTextDisplayComponents(
    text(`-# Changes saved • <t:${unixNow()}:R>`),
    text(`-# Bánh Cuốn Bot`)
  );

  return {
    flags: MessageFlags.IsComponentsV2 as any,
    components: [container],
  };
}

export function buildErrorCard(user: User, title: string, message: string): any {
  const container = new ContainerBuilder().addTextDisplayComponents(
      text(`## ❌ ${title}`),
      text(message),
      text(`-# Bánh Cuốn Bot`)
    );

  return {
    flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
    components: [container],
  };
}

export function buildSuccessCard(user: User, featureName: string, newState: boolean): any {
  const container = new ContainerBuilder().addTextDisplayComponents(
      text(`## ✅ Feature Updated`),
      text(`**${featureName}** is now ${newState ? '**enabled** ✅' : '**disabled** ❌'}`),
      text(`-# <t:${unixNow()}:R> • Bánh Cuốn Bot`)
    );

  return {
    flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
    components: [container],
  };
}

/* ───────────────────────────── Module ───────────────────────────── */
export default class SettingsModule {
  name = 'settings-module';
  description = 'Server settings management';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('✅ Settings feature service initialized');
  }

  async shutdown() {
    console.log(`Shutting down ${this.name}`);
  }

}

