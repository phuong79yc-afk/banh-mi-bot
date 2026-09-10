/**
 * Honeypot Anti-Spam System
 * Automatically detect and ban spam bots
 */

import { Client, Guild, TextChannel, PermissionFlagsBits, ChannelType, AuditLogEvent } from 'discord.js';
import { CUSTOM_EMOJI } from './customEmoji';
import { detectScam, createScamAlert, getScamDescription } from './scamDetector';

interface HoneypotConfig {
  channelName: string;
  action: 'ban' | 'kick' | 'timeout';
  logChannelId?: string;
  deleteMessageDays: number;
  dmUser: boolean;
  experiments: {
    forwardMessage: boolean;
    reinvite: boolean;
    noWarning: boolean;
    noDM: boolean;
    randomName: boolean;
    timeoutFirst: boolean;
  };
}

const DEFAULT_CONFIG: HoneypotConfig = {
  channelName: 'honeypot',
  action: 'kick',
  deleteMessageDays: 1,
  dmUser: true,
  experiments: {
    forwardMessage: true,
    reinvite: false,
    noWarning: false,
    noDM: false,
    randomName: false,
    timeoutFirst: false
  }
};

export class HoneypotManager {
  private configs = new Map<string, HoneypotConfig>();
  private honeypotChannels = new Map<string, string>(); // guildId -> channelId
  
  constructor(private client: Client) {}
  
  /**
   * Initialize honeypot for a guild
   */
  async initializeGuild(guild: Guild, config?: Partial<HoneypotConfig>) {
    const guildConfig = { ...DEFAULT_CONFIG, ...config };
    this.configs.set(guild.id, guildConfig);
    
    // Find or create honeypot channel
    let honeypotChannel = guild.channels.cache.find(
      ch => ch.name === guildConfig.channelName && ch.type === ChannelType.GuildText
    ) as TextChannel;
    
    if (!honeypotChannel) {
      honeypotChannel = await this.createHoneypotChannel(guild, guildConfig);
    }
    
    this.honeypotChannels.set(guild.id, honeypotChannel.id);
    
    console.log(`🍯 Honeypot initialized for ${guild.name}: #${honeypotChannel.name}`);
    return honeypotChannel;
  }
  
  /**
   * Create honeypot channel
   */
  private async createHoneypotChannel(guild: Guild, config: HoneypotConfig): Promise<TextChannel> {
    const channelName = config.experiments.randomName 
      ? `honeypot-${Math.random().toString(36).substring(7)}`
      : config.channelName;
    
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: '🍯 Automated spam detection channel - DO NOT POST HERE',
      position: 0, // Top of channel list
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: this.client.user!.id, // Bot
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.KickMembers
          ]
        }
      ]
    });
    
    // Send warning message
    if (!config.experiments.noWarning) {
      await channel.send({
        embeds: [{
          color: 0xf59e0b, // Orange/Yellow
          title: `⚠️ ${CUSTOM_EMOJI.ALARM} WARNING: HONEYPOT CHANNEL`,
          description:
            `${CUSTOM_EMOJI.BANNED_USER} **DO NOT POST IN THIS CHANNEL!** ${CUSTOM_EMOJI.BANNED_USER}\n\n` +
            `${CUSTOM_EMOJI.HONEYPOT} This is an **automated spam detection** channel.\n` +
            `${CUSTOM_EMOJI.ROBOT} Posting here will result in **immediate removal** from the server.\n\n` +
            `${CUSTOM_EMOJI.BEE} This channel is monitored 24/7 by anti-spam systems.\n` +
            `${CUSTOM_EMOJI.SHIELD} Server moderators are protected.`,
          footer: { 
            text: '⚠️ You have been warned! This is not a joke.',
            icon_url: 'https://cdn.discordapp.com/emojis/1541453099833753673.png'
          },
          timestamp: new Date().toISOString()
        }]
      });
    }
    
    return channel;
  }
  
  /**
   * Handle message in honeypot channel
   */
  async handleHoneypotMessage(message: any) {
    if (message.author.bot) return; // Ignore bots
    
    const guild = message.guild;
    if (!guild) return;
    
    const config = this.configs.get(guild.id);
    if (!config) return;
    
    const honeypotChannelId = this.honeypotChannels.get(guild.id);
    if (message.channel.id !== honeypotChannelId) return;
    
    console.log(`🚨 Honeypot triggered by ${message.author.tag} in ${guild.name}`);
    
    try {
      const member = message.member;
      if (!member) return;
      
      // Check if user has admin permissions (don't ban admins who test)
      if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply({
          embeds: [{
            color: 0xf59e0b,
            title: `${CUSTOM_EMOJI.CROWN} Admin Protection`,
            description:
              `${CUSTOM_EMOJI.INFO} You triggered the honeypot, but you have admin permissions!\n\n` +
              `${CUSTOM_EMOJI.SHIELD} **You are safe** - Admins cannot be removed by the honeypot.\n` +
              `${CUSTOM_EMOJI.BEE} Regular users posting here will be ${config.action}ed automatically.`,
            footer: { text: 'Test successful - Honeypot is working!' }
          }]
        });
        return;
      }
      
      // Forward message to log channel
      if (config.experiments.forwardMessage && config.logChannelId) {
        const logChannel = guild.channels.cache.get(config.logChannelId) as TextChannel;
        if (logChannel) {
          const actionEmoji = config.action === 'ban' ? CUSTOM_EMOJI.MOD_BAN : 
                             config.action === 'kick' ? CUSTOM_EMOJI.MOD_KICK : 
                             CUSTOM_EMOJI.MOD_TIMEOUT;
          
          await logChannel.send({
            embeds: [{
              color: 0xef4444, // Red
              author: {
                name: `${CUSTOM_EMOJI.HONEYPOT} HONEYPOT TRIGGERED`,
                icon_url: 'https://cdn.discordapp.com/emojis/1541453099833753673.png'
              },
              thumbnail: { url: message.author.displayAvatarURL({ size: 256 }) },
              fields: [
                {
                  name: `${CUSTOM_EMOJI.ROBOT} Detected User`,
                  value: `${message.author}\n\`${message.author.tag}\`\nID: \`${message.author.id}\``,
                  inline: true
                },
                {
                  name: `${CUSTOM_EMOJI.TRAP} Honeypot Channel`,
                  value: `<#${message.channel.id}>`,
                  inline: true
                },
                {
                  name: '\u200b',
                  value: '\u200b',
                  inline: false
                },
                {
                  name: `${actionEmoji} Action Taken`,
                  value: `\`\`\`${config.action.toUpperCase()}\`\`\``,
                  inline: true
                },
                {
                  name: `${CUSTOM_EMOJI.CLOCK} Timestamp`,
                  value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                  inline: true
                },
                {
                  name: '\u200b',
                  value: '\u200b',
                  inline: false
                },
                {
                  name: `📝 Message Content`,
                  value: message.content.length > 0 
                    ? `\`\`\`${message.content.substring(0, 500)}\`\`\`` 
                    : '*(No text content)*',
                  inline: false
                }
              ],
              footer: { 
                text: `${CUSTOM_EMOJI.STATUS_SUCCESS} User has been removed • Honeypot System`,
                icon_url: guild.iconURL() || undefined
              },
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
      
      // DM user (if enabled)
      if (config.dmUser && !config.experiments.noDM) {
        try {
          const inviteLink = config.experiments.reinvite 
            ? `\n\n${CUSTOM_EMOJI.ENVELOPE} **Rejoin Link:** ${await this.createInvite(guild)}\n*(Valid for 24 hours, 1 use)*`
            : '';
          
          const actionText = config.action === 'kick' ? 'removed from' : 
                            config.action === 'ban' ? 'permanently banned from' : 
                            'timed out in';
          
          await message.author.send({
            embeds: [{
              color: 0xef4444, // Red
              title: `${CUSTOM_EMOJI.HONEYPOT} Honeypot Detection System`,
              description:
                `${CUSTOM_EMOJI.ALARM} **You have been ${actionText} ${guild.name}**\n\n` +
                `${CUSTOM_EMOJI.TRAP} **Reason:** Posted in honeypot spam detection channel\n` +
                `${CUSTOM_EMOJI.ROBOT} This is an automated anti-spam system.\n\n` +
                `**What happened?**\n` +
                `• You posted a message in <#${message.channel.id}>\n` +
                `• This channel is a spam trap monitored by bots\n` +
                `• Real users should never post there\n\n` +
                `${CUSTOM_EMOJI.SHIELD} **If this was a mistake:**\n` +
                `Contact the server moderators to appeal.${inviteLink}`,
              thumbnail: { url: guild.iconURL() || undefined },
              footer: { 
                text: `${guild.name} • Honeypot Anti-Spam`,
                icon_url: guild.iconURL() || undefined
              },
              timestamp: new Date().toISOString()
            }]
          });
        } catch (error) {
          console.log('Could not DM user');
        }
      }
      
      // Delete message
      await message.delete().catch(() => {});
      
      // Timeout first (if enabled)
      if (config.experiments.timeoutFirst) {
        await member.timeout(60 * 60 * 1000, '🍯 Honeypot triggered'); // 1 hour
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Take action
      switch (config.action) {
        case 'ban':
          await member.ban({ 
            deleteMessageDays: config.deleteMessageDays,
            reason: '🍯 Honeypot: Posted in spam detection channel'
          });
          break;
          
        case 'kick':
          // Soft ban (ban + unban to delete messages)
          await member.ban({ 
            deleteMessageDays: config.deleteMessageDays,
            reason: '🍯 Honeypot: Posted in spam detection channel'
          });
          await guild.members.unban(message.author.id, 'Soft ban complete');
          break;
          
        case 'timeout':
          await member.timeout(
            24 * 60 * 60 * 1000, // 24 hours
            '🍯 Honeypot: Posted in spam detection channel'
          );
          break;
      }
      
      console.log(`✅ ${config.action} executed on ${message.author.tag}`);
      
    } catch (error: any) {
      console.error('Honeypot error:', error);
    }
  }
  
  /**
   * Create invite link for reinvite feature
   */
  private async createInvite(guild: Guild): Promise<string> {
    try {
      const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText
      ) as TextChannel;
      
      if (channel) {
        const invite = await channel.createInvite({
          maxAge: 86400, // 24 hours
          maxUses: 1,
          reason: 'Honeypot reinvite'
        });
        return invite.url;
      }
    } catch (error) {
      console.error('Failed to create invite:', error);
    }
    return 'N/A';
  }
  
  /**
   * Update config
   */
  updateConfig(guildId: string, config: Partial<HoneypotConfig>) {
    const current = this.configs.get(guildId) || DEFAULT_CONFIG;
    this.configs.set(guildId, { ...current, ...config });
  }
  
  /**
   * Get config
   */
  getConfig(guildId: string): HoneypotConfig | undefined {
    return this.configs.get(guildId);
  }
  
  /**
   * Daily maintenance (random names, recreate channels, etc)
   */
  async dailyMaintenance() {
    console.log('🍯 Running honeypot daily maintenance...');
    
    for (const [guildId, config] of this.configs) {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) continue;
      
      try {
        // Random channel name
        if (config.experiments.randomName) {
          const channelId = this.honeypotChannels.get(guildId);
          const channel = guild.channels.cache.get(channelId!) as TextChannel;
          
          if (channel) {
            const newName = `honeypot-${Math.random().toString(36).substring(7)}`;
            await channel.setName(newName);
            console.log(`🔄 Renamed honeypot in ${guild.name}: ${newName}`);
          }
        }
      } catch (error) {
        console.error(`Error in daily maintenance for ${guild.name}:`, error);
      }
    }
  }
}

// Singleton instance
export const honeypotManager = new HoneypotManager(null as any);
