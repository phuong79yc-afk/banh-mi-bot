import {
  ActionRowBuilder,
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
import { emojis } from '../config/emojis';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'server-features.json');

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

export const FEATURES: FeatureOption[] = [
  { label: 'Welcome System', value: 'welcome_system', emoji: emojis.gen_welcome },
  { label: 'Goodbye System', value: 'goodbye_system', emoji: emojis.gen_goodbye },
  { label: 'Auto Role', value: 'auto_role', emoji: emojis.gen_autorole },
  { label: 'Level System', value: 'level_system', emoji: emojis.gen_level },
  { label: 'Giveaway Notifications', value: 'giveaway_notifications', emoji: emojis.gen_giveaway },
];

const DEFAULT_FEATURES: GuildFeatures = {
  welcome_system: true,
  goodbye_system: true,
  auto_role: true,
  level_system: true,
  giveaway_notifications: true,
};

function loadData(): ServerFeaturesData {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
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
  if (!data[guildId]) data[guildId] = { ...DEFAULT_FEATURES };
  data[guildId][feature] = value;
  saveData(data);
}

export function isFeatureEnabled(guildId: string, feature: FeatureKey): boolean {
  return getGuildFeatures(guildId)[feature] ?? DEFAULT_FEATURES[feature];
}

const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);
const unixNow = () => Math.floor(Date.now() / 1000);
const customId = (action: string, userId: string) => `settings:${action}:${userId}`;

export function buildFeatureCard(user: User, guildId: string): any {
  const features = getGuildFeatures(guildId);
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(text(`-# ${emojis.gen_settings} Server Features`));
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        text(`## ${emojis.gen_settings} Server Features`),
        text('-# Configure which features are enabled for this server'),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 }))),
  );
  container.addSeparatorComponents(divider(SeparatorSpacingSize.Large));
  container.addTextDisplayComponents(
    text(`### ${emojis.gen_mark} Current Status`),
    text(FEATURES.map((feature) => {
      const enabled = features[feature.value];
      return `${feature.emoji} ${enabled ? '✅' : '❌'} **${feature.label}** ~ ${enabled ? 'Enabled' : 'Disabled'}`;
    }).join('\n')),
  );
  container.addSeparatorComponents(divider());

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId('toggle', user.id))
    .setPlaceholder('Select a feature to toggle')
    .addOptions(FEATURES.map((feature) => ({
      label: feature.label,
      value: feature.value,
      emoji: feature.emoji,
      description: features[feature.value] ? 'Currently enabled' : 'Currently disabled',
    })));
  container.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu));
  container.addSeparatorComponents(divider());
  container.addTextDisplayComponents(
    text(`-# Changes saved • <t:${unixNow()}:R>`),
    text('-# Bánh Cuốn Bot'),
  );

  return { flags: MessageFlags.IsComponentsV2 as any, components: [container] };
}

export function buildErrorCard(_user: User, title: string, message: string): any {
  const container = new ContainerBuilder().addTextDisplayComponents(
    text(`## ❌ ${title}`),
    text(message),
    text('-# Bánh Cuốn Bot'),
  );
  return {
    flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
    components: [container],
  };
}

export function buildSuccessCard(_user: User, featureName: string, newState: boolean): any {
  const container = new ContainerBuilder().addTextDisplayComponents(
    text('## ✅ Feature Updated'),
    text(`**${featureName}** is now ${newState ? '**enabled** ✅' : '**disabled** ❌'}`),
    text(`-# <t:${unixNow()}:R> • Bánh Cuốn Bot`),
  );
  return {
    flags: (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any,
    components: [container],
  };
}
