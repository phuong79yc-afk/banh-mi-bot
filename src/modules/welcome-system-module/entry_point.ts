/**
 * Welcome System Module - Welcome/Goodbye event handlers with Components V2 UI
 * Handles guildMemberAdd and guildMemberRemove events
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  Role,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextChannel,
  TextDisplayBuilder,
  ThumbnailBuilder,
  User,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { isFeatureEnabled } from '../settings-module/entry_point';
import fs from 'fs';
import path from 'path';

/* ───────────────────────────── Config ───────────────────────────── */
const WELCOME_CONFIG_PATH = path.join(process.cwd(), 'data', 'welcome-config.json');
const GOODBYE_CONFIG_PATH = path.join(process.cwd(), 'data', 'goodbye-config.json');
const DESIGNS_PATH = path.join(process.cwd(), 'data', 'welcome-designs.json');

const COLORS = {
  welcome: 0x57f287, // green
  goodbye: 0xfee75c, // orange
  primary: 0x5865f2, // Discord blue
  error: 0xed4245,
} as const;

/* ───────────────────────────── Types ───────────────────────────── */
interface WelcomeConfig {
  guildId: string;
  channelId: string;
  message: string;
  embedEnabled: boolean;
  enabled: boolean;
  autoRole?: string;
  embedColor?: string;
  embedThumbnail?: string;
  embedFields?: Array<{ name: string; value: string; inline?: boolean }>;
  embedFooter?: string;
}

interface GoodbyeConfig {
  channelId: string;
  message: string;
  embedEnabled: boolean;
  enabled: boolean;
  embedColor?: string;
  embedThumbnail?: string;
  embedFields?: Array<{ name: string; value: string; inline?: boolean }>;
  embedFooter?: string;
}

interface WelcomeDesign {
  type: 'welcome' | 'goodbye';
  title: string;
  description: string;
  color: string;
  thumbnail?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
}

interface WelcomeConfigData {
  [guildId: string]: WelcomeConfig;
}

interface GoodbyeConfigData {
  [guildId: string]: GoodbyeConfig;
}

interface DesignsData {
  [guildId: string]: {
    welcome?: WelcomeDesign;
    goodbye?: WelcomeDesign;
  };
}

/* ───────────────────────────── Data Management ───────────────────────────── */
function loadWelcomeConfig(): WelcomeConfigData {
  try {
    if (!fs.existsSync(WELCOME_CONFIG_PATH)) {
      fs.writeFileSync(WELCOME_CONFIG_PATH, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(WELCOME_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading welcome-config.json:', error);
    return {};
  }
}

function saveWelcomeConfig(data: WelcomeConfigData): void {
  try {
    fs.writeFileSync(WELCOME_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving welcome-config.json:', error);
  }
}

function loadGoodbyeConfig(): GoodbyeConfigData {
  try {
    if (!fs.existsSync(GOODBYE_CONFIG_PATH)) {
      fs.writeFileSync(GOODBYE_CONFIG_PATH, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(GOODBYE_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading goodbye-config.json:', error);
    return {};
  }
}

function saveGoodbyeConfig(data: GoodbyeConfigData): void {
  try {
    fs.writeFileSync(GOODBYE_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving goodbye-config.json:', error);
  }
}

function loadDesigns(): DesignsData {
  try {
    if (!fs.existsSync(DESIGNS_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(DESIGNS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading welcome-designs.json:', error);
    return {};
  }
}

/* ───────────────────────────── UI Helpers ───────────────────────────── */
const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

function replacePlaceholders(str: string, member: GuildMember): string {
  return str
    .replace(/\{user\}/g, `<@${member.id}>`)
    .replace(/\{username\}/g, member.user.username)
    .replace(/\{server\}/g, member.guild.name)
    .replace(/\{memberCount\}/g, member.guild.memberCount.toString());
}

/* ───────────────────────────── Event Handlers ───────────────────────────── */
// ───────── Event Handlers (exported for event system) ─────────

export async function handleMemberAdd(member: GuildMember): Promise<void> {
  // Skip bots
  if (member.user.bot) return;

  const guildId = member.guild.id;

  // Check if welcome_system feature is enabled
  if (!isFeatureEnabled(guildId, 'welcome_system')) {
    return;
  }

  const configs = loadWelcomeConfig();
  const config = configs[guildId];

  // No config = no welcome
  if (!config || !config.enabled) {
    return;
  }

  // Get channel
  const channel = member.guild.channels.cache.get(config.channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.warn(
      `[Welcome] Channel ${config.channelId} not found or not text channel in guild ${member.guild.name}`
    );
    return;
  }

  const textChannel = channel as TextChannel;

  // Check bot permissions
  const botMember = member.guild.members.me;
  if (!botMember) return;

  const perms = textChannel.permissionsFor(botMember);
  if (!perms || !perms.has(PermissionFlagsBits.SendMessages)) {
    console.warn(
      `[Welcome] Bot lacks SendMessages permission in channel ${textChannel.name} (${member.guild.name})`
    );
    return;
  }

  if (config.embedEnabled && !perms.has(PermissionFlagsBits.EmbedLinks)) {
    console.warn(
      `[Welcome] Bot lacks EmbedLinks permission in channel ${textChannel.name} (${member.guild.name})`
    );
    return;
  }

  // Check for custom design
  const designs = loadDesigns();
  const guildDesigns = designs[guildId];
  const customDesign = guildDesigns?.welcome;

  try {
    if (config.embedEnabled) {
      // Build Components V2 Card with accent color (Discord-style border)
      const design = customDesign || {
        title: config.embedFooter || 'Welcome!',
        description: replacePlaceholders(config.message, member),
        color: config.embedColor || '#57f287',
        fields: config.embedFields || [],
        footer: config.embedFooter,
      };

      // Parse color hex to number
      const accentColor = parseInt((design.color || '#57f287').replace('#', ''), 16);

      // Components V2 with accent color border
      const container = new ContainerBuilder()
        .setAccentColor(accentColor); // ← VIỀN MÀU như Discord embed cũ!

      // Header section with thumbnail
      const thumbnailUrl = 
        ('thumbnail' in design ? design.thumbnail : undefined) || 
        config.embedThumbnail || 
        member.user.displayAvatarURL({ size: 256 });

      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            text(`-# ${emojis.users} Welcome to ${member.guild.name}`),
            text(`## ${design.title}`)
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl))
      );

      // Description
      const description = replacePlaceholders(design.description, member);
      container.addTextDisplayComponents(text(description));

      // Fields
      if (design.fields && design.fields.length > 0) {
        container.addSeparatorComponents(divider());
        for (const field of design.fields) {
          const fieldValue = replacePlaceholders(field.value, member);
          container.addTextDisplayComponents(text(`**${field.name}**\n${fieldValue}`));
        }
      }

      // Member info
      container.addSeparatorComponents(divider());
      container.addTextDisplayComponents(
        text(
          `> ${emojis.user} Member: ${member.user.tag}\n` +
            `> ${emojis.users} Member Count: **${member.guild.memberCount}**\n` +
            `> ${emojis.calendar} Joined: <t:${unixNow()}:R>`
        )
      );

      // Footer
      container.addSeparatorComponents(divider());
      const footerText = design.footer || '-# Welcome System';
      container.addTextDisplayComponents(text(footerText));

      await textChannel.send({
        content: `${emojis.sparkles} ${member.toString()}`,
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      // Simple message mode
      const message = replacePlaceholders(config.message, member);
      await textChannel.send(`${emojis.sparkles} ${member.toString()} ${message}`);
    }
  } catch (error) {
    console.error(`[Welcome] Error sending welcome message in guild ${member.guild.name}:`, error);
  }

  // Handle auto-role
  if (config.autoRole && isFeatureEnabled(guildId, 'auto_role')) {
    try {
      const role = member.guild.roles.cache.get(config.autoRole);
      if (!role) {
        console.warn(
          `[Welcome] Auto-role ${config.autoRole} not found in guild ${member.guild.name}`
        );
        return;
      }

      // Check bot can assign this role
      const botMember = member.guild.members.me;
      if (!botMember) return;

      const botTopRole = botMember.roles.highest;
      if (role.position >= botTopRole.position) {
        console.warn(
          `[Welcome] Cannot assign role ${role.name} - bot's highest role is lower in hierarchy (${member.guild.name})`
        );
        return;
      }

      await member.roles.add(role);
      console.log(`[Welcome] Assigned role ${role.name} to ${member.user.tag} in ${member.guild.name}`);
    } catch (error) {
      console.error(`[Welcome] Error assigning auto-role in guild ${member.guild.name}:`, error);
    }
  }
}

export async function handleMemberRemove(member: GuildMember): Promise<void> {
  // Skip bots
  if (member.user.bot) return;

  const guildId = member.guild.id;

  // Check if goodbye_system feature is enabled
  if (!isFeatureEnabled(guildId, 'goodbye_system')) {
    return;
  }

  const configs = loadGoodbyeConfig();
  const config = configs[guildId];

  // No config = no goodbye
  if (!config || !config.enabled) {
    return;
  }

  // Get channel
  const channel = member.guild.channels.cache.get(config.channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.warn(
      `[Goodbye] Channel ${config.channelId} not found or not text channel in guild ${member.guild.name}`
    );
    return;
  }

  const textChannel = channel as TextChannel;

  // Check bot permissions
  const botMember = member.guild.members.me;
  if (!botMember) return;

  const perms = textChannel.permissionsFor(botMember);
  if (!perms || !perms.has(PermissionFlagsBits.SendMessages)) {
    console.warn(
      `[Goodbye] Bot lacks SendMessages permission in channel ${textChannel.name} (${member.guild.name})`
    );
    return;
  }

  if (config.embedEnabled && !perms.has(PermissionFlagsBits.EmbedLinks)) {
    console.warn(
      `[Goodbye] Bot lacks EmbedLinks permission in channel ${textChannel.name} (${member.guild.name})`
    );
    return;
  }

  // Check for custom design
  const designs = loadDesigns();
  const guildDesigns = designs[guildId];
  const customDesign = guildDesigns?.goodbye;

  // Calculate tenure
  const joinedTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : 0;
  const leftTimestamp = unixNow();

  try {
    if (config.embedEnabled) {
      // Build Components V2 Card with accent color (Discord-style border)
      const design = customDesign || {
        title: 'Goodbye!',
        description: replacePlaceholders(config.message, member),
        color: config.embedColor || '#fee75c',
        fields: config.embedFields || [],
        footer: config.embedFooter,
      };

      // Parse color hex to number
      const accentColor = parseInt((design.color || '#fee75c').replace('#', ''), 16);

      // Components V2 with accent color border
      const container = new ContainerBuilder()
        .setAccentColor(accentColor); // ← VIỀN MÀU như Discord embed cũ!

      // Header section with thumbnail
      const thumbnailUrl = 
        ('thumbnail' in design ? design.thumbnail : undefined) || 
        config.embedThumbnail || 
        member.user.displayAvatarURL({ size: 256 });

      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            text(`-# 👋 Goodbye from ${member.guild.name}`),
            text(`## ${design.title}`)
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl))
      );

      // Description
      const description = replacePlaceholders(design.description, member);
      container.addTextDisplayComponents(text(description));

      // Fields
      if (design.fields && design.fields.length > 0) {
        container.addSeparatorComponents(divider());
        for (const field of design.fields) {
          const fieldValue = replacePlaceholders(field.value, member);
          container.addTextDisplayComponents(text(`**${field.name}**\n${fieldValue}`));
        }
      }

      // Member info
      container.addSeparatorComponents(divider());
      const tenureInfo = joinedTimestamp 
        ? `> ${emojis.calendar} Joined: <t:${joinedTimestamp}:R>\n> ${emojis.clock} Left: <t:${leftTimestamp}:R>`
        : `> ${emojis.clock} Left: <t:${leftTimestamp}:R>`;
      
      container.addTextDisplayComponents(
        text(
          `> ${emojis.user} Member: ${member.user.tag}\n` +
            `> ${emojis.users} Members Remaining: **${member.guild.memberCount}**\n` +
            tenureInfo
        )
      );

      // Footer
      container.addSeparatorComponents(divider());
      const footerText = design.footer || '-# Goodbye System';
      container.addTextDisplayComponents(text(footerText));

      await textChannel.send({
        content: `👋 **${member.user.tag}** has left the server`,
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else {
      // Simple message mode
      const message = replacePlaceholders(config.message, member);
      await textChannel.send(`👋 **${member.user.tag}** ${message}`);
    }
  } catch (error) {
    console.error(`[Goodbye] Error sending goodbye message in guild ${member.guild.name}:`, error);
  }
}

/* ───────────────────────────── Commands ───────────────────────────── */
function buildWelcomeSetupCard(user: User, config: WelcomeConfig | null, guildName: string): any {
  const container = new ContainerBuilder();

  // Header
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        text(`-# ${emojis.gear} Welcome Setup`),
        text(`## ${emojis.users} Welcome System Configuration`),
        text(`-# Configure welcome messages for new members in ${guildName}`)
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 })))
  );

  container.addSeparatorComponents(divider());

  // Current config
  if (config && config.enabled) {
    const channel = config.channelId ? `<#${config.channelId}>` : 'Not set';
    const embedStatus = config.embedEnabled ? `${emojis.success} Enabled` : `❌ Disabled`;
    const autoRoleText = config.autoRole ? `<@&${config.autoRole}>` : 'None';

    container.addTextDisplayComponents(
      text(
        `**Current Configuration:**\n` +
          `> ${emojis.users} Channel: ${channel}\n` +
          `> ${emojis.message} Message: ${config.message}\n` +
          `> ${emojis.sparkles} Embed Mode: ${embedStatus}\n` +
          `> ${emojis.shield} Auto Role: ${autoRoleText}\n` +
          `> ${emojis.success} Status: Enabled`
      )
    );
  } else {
    container.addTextDisplayComponents(
      text(`${emojis.warning} Welcome system is not configured or disabled for this server.`)
    );
  }

  container.addSeparatorComponents(divider());
  container.addTextDisplayComponents(
    text(
      `-# Use the command options to configure:\n` +
        `-# • \`channel\` - Set the welcome channel\n` +
        `-# • \`message\` - Set the welcome message\n` +
        `-# • \`embed\` - Enable/disable embed mode\n` +
        `-# • \`autorole\` - Set auto-assign role\n` +
        `-# • \`enabled\` - Enable/disable welcome system`
    )
  );

  container.addSeparatorComponents(divider());
  container.addTextDisplayComponents(text(`-# Welcome System • <t:${unixNow()}:R>`));

  return container;
}

function buildGoodbyeSetupCard(user: User, config: GoodbyeConfig | null, guildName: string): any {
  const container = new ContainerBuilder();

  // Header
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        text(`-# ${emojis.gear} Goodbye Setup`),
        text(`## 👋 Goodbye System Configuration`),
        text(`-# Configure goodbye messages for members who leave ${guildName}`)
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 })))
  );

  container.addSeparatorComponents(divider());

  // Current config
  if (config && config.enabled) {
    const channel = config.channelId ? `<#${config.channelId}>` : 'Not set';
    const embedStatus = config.embedEnabled ? `${emojis.success} Enabled` : `❌ Disabled`;

    container.addTextDisplayComponents(
      text(
        `**Current Configuration:**\n` +
          `> ${emojis.users} Channel: ${channel}\n` +
          `> ${emojis.message} Message: ${config.message}\n` +
          `> ${emojis.sparkles} Embed Mode: ${embedStatus}\n` +
          `> ${emojis.success} Status: Enabled`
      )
    );
  } else {
    container.addTextDisplayComponents(
      text(`${emojis.warning} Goodbye system is not configured or disabled for this server.`)
    );
  }

  container.addSeparatorComponents(divider());
  container.addTextDisplayComponents(
    text(
      `-# Use the command options to configure:\n` +
        `-# • \`channel\` - Set the goodbye channel\n` +
        `-# • \`message\` - Set the goodbye message\n` +
        `-# • \`embed\` - Enable/disable embed mode\n` +
        `-# • \`enabled\` - Enable/disable goodbye system`
    )
  );

  container.addSeparatorComponents(divider());
  container.addTextDisplayComponents(text(`-# Goodbye System • <t:${unixNow()}:R>`));

  return container;
}

async function handleWelcomeSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: `${emojis.error} This command can only be used in a server.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const guildId = interaction.guildId!;
  const guildName = interaction.guild?.name || 'this server';

  const channelOption = interaction.options.getChannel('channel');
  const messageOption = interaction.options.getString('message');
  const embedOption = interaction.options.getBoolean('embed');
  const autoRoleOption = interaction.options.getRole('autorole');
  const enabledOption = interaction.options.getBoolean('enabled');

  const configs = loadWelcomeConfig();
  let config = configs[guildId];

  // If no options provided, show current config
  if (!channelOption && !messageOption && embedOption === null && !autoRoleOption && enabledOption === null) {
    const card = buildWelcomeSetupCard(interaction.user, config, guildName);
    await interaction.reply({
      components: [card],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  // Initialize config if doesn't exist
  if (!config) {
    config = {
      guildId,
      channelId: '',
      message: 'Welcome to the server, {user}!',
      embedEnabled: true,
      enabled: true,
    };
    configs[guildId] = config;
  }

  // Update config
  if (channelOption) {
    // Validate channel is text channel
    if (channelOption.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: `${emojis.error} Please select a text channel.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    config.channelId = channelOption.id;
  }

  if (messageOption) {
    config.message = messageOption;
  }

  if (embedOption !== null) {
    config.embedEnabled = embedOption;
  }

  if (autoRoleOption) {
    // Validate role exists
    const role = autoRoleOption as Role;
    config.autoRole = role.id;
  }

  if (enabledOption !== null) {
    config.enabled = enabledOption;
  }

  // Save config
  saveWelcomeConfig(configs);

  // Show updated config
  const card = buildWelcomeSetupCard(interaction.user, config, guildName);
  await interaction.reply({
    content: `${emojis.success} Welcome configuration updated!`,
    components: [card],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

async function handleGoodbyeSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: `${emojis.error} This command can only be used in a server.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const guildId = interaction.guildId!;
  const guildName = interaction.guild?.name || 'this server';

  const channelOption = interaction.options.getChannel('channel');
  const messageOption = interaction.options.getString('message');
  const embedOption = interaction.options.getBoolean('embed');
  const enabledOption = interaction.options.getBoolean('enabled');

  const configs = loadGoodbyeConfig();
  let config = configs[guildId];

  // If no options provided, show current config
  if (!channelOption && !messageOption && embedOption === null && enabledOption === null) {
    const card = buildGoodbyeSetupCard(interaction.user, config, guildName);
    await interaction.reply({
      components: [card],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  // Initialize config if doesn't exist
  if (!config) {
    config = {
      channelId: '',
      message: '{user} has left the server. Goodbye!',
      embedEnabled: true,
      enabled: true,
    };
    configs[guildId] = config;
  }

  // Update config
  if (channelOption) {
    // Validate channel is text channel
    if (channelOption.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: `${emojis.error} Please select a text channel.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    config.channelId = channelOption.id;
  }

  if (messageOption) {
    config.message = messageOption;
  }

  if (embedOption !== null) {
    config.embedEnabled = embedOption;
  }

  if (enabledOption !== null) {
    config.enabled = enabledOption;
  }

  // Save config
  saveGoodbyeConfig(configs);

  // Show updated config
  const card = buildGoodbyeSetupCard(interaction.user, config, guildName);
  await interaction.reply({
    content: `${emojis.success} Goodbye configuration updated!`,
    components: [card],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

/* ───────────────────────────── Module Export ───────────────────────────── */
export default class WelcomeSystemModule {
  name = 'welcome-system-module';
  commands = new Collection<string, any>();

  constructor() {
    // Register /welcome-setup command
    const welcomeSetup = new SlashCommandBuilder()
      .setName('welcome-setup')
      .setDescription('Configure welcome messages for new members')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('The channel to send welcome messages')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('message')
          .setDescription('Welcome message (use {user}, {username}, {server}, {memberCount})')
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt.setName('embed').setDescription('Enable embed mode for welcome messages').setRequired(false)
      )
      .addRoleOption((opt) =>
        opt.setName('autorole').setDescription('Role to auto-assign to new members').setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt.setName('enabled').setDescription('Enable/disable welcome system').setRequired(false)
      );

    this.commands.set('welcome-setup', {
      data: welcomeSetup,
      execute: handleWelcomeSetup,
    });

    // Register /goodbye-setup command
    const goodbyeSetup = new SlashCommandBuilder()
      .setName('goodbye-setup')
      .setDescription('Configure goodbye messages for members who leave')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('The channel to send goodbye messages')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('message')
          .setDescription('Goodbye message (use {user}, {username}, {server}, {memberCount})')
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt.setName('embed').setDescription('Enable embed mode for goodbye messages').setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt.setName('enabled').setDescription('Enable/disable goodbye system').setRequired(false)
      );

    this.commands.set('goodbye-setup', {
      data: goodbyeSetup,
      execute: handleGoodbyeSetup,
    });
  }

  async initialize(client: Client): Promise<void> {
    // Event handlers will be registered separately via event system
    // For now, module only provides setup commands
    console.log(`✅ Welcome System module initialized (commands only, events TBD)`);
  }
}

