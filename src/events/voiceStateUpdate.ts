import { VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface JoinToCreateConfig {
  guildId: string;
  createChannelId: string;
  categoryId?: string;
}

interface TempVoiceConfig {
  guildId: string;
  ownerId: string;
  channelId: string;
  channelName: string;
  createdAt: string;
  settings: {
    userLimit: number;
    isLocked: boolean;
    trustedUsers: string[];
    blockedUsers: string[];
  };
}

/**
 * Get join-to-create config file path
 */
function getJoinToCreateConfigPath(): string {
  return path.join(process.cwd(), 'join-to-create-config.json');
}

/**
 * Load join-to-create config
 */
function loadJoinToCreateConfig(): Record<string, JoinToCreateConfig> {
  try {
    const configPath = getJoinToCreateConfigPath();
    if (!fs.existsSync(configPath)) {
      return {};
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load join-to-create config:', error);
    return {};
  }
}

/**
 * Get temp voice config file path
 */
function getTempVoiceConfigPath(): string {
  return path.join(process.cwd(), 'temp-voice-channels.json');
}

/**
 * Load temp voice configs
 */
function loadTempVoiceConfigs(): Record<string, TempVoiceConfig> {
  try {
    const configPath = getTempVoiceConfigPath();
    if (!fs.existsSync(configPath)) {
      return {};
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load temp voice configs:', error);
    return {};
  }
}

/**
 * Save temp voice config
 */
function saveTempVoiceConfig(channelId: string, config: TempVoiceConfig): void {
  try {
    const configPath = getTempVoiceConfigPath();
    const configs = loadTempVoiceConfigs();
    configs[channelId] = config;
    fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
  } catch (error) {
    console.error('Failed to save temp voice config:', error);
  }
}

/**
 * Delete temp voice config
 */
function deleteTempVoiceConfig(channelId: string): void {
  try {
    const configPath = getTempVoiceConfigPath();
    const configs = loadTempVoiceConfigs();
    delete configs[channelId];
    fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
  } catch (error) {
    console.error('Failed to delete temp voice config:', error);
  }
}

export const name = 'voiceStateUpdate';

export async function execute(oldState: VoiceState, newState: VoiceState) {
  try {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild;
    const joinToCreateConfigs = loadJoinToCreateConfig();
    const guildConfig = joinToCreateConfigs[guild.id];

    // Check if user joined a "Join to Create" channel
    if (newState.channelId && guildConfig && newState.channelId === guildConfig.createChannelId) {
      console.log(`🎙️ ${member.user.tag} joined Join-to-Create channel, creating temp voice...`);

      // Create new temp voice channel
      const channelName = `${member.displayName}'s Voice`;
      
      const tempChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: guildConfig.categoryId || newState.channel?.parentId,
        userLimit: 0,
        reason: `Temp voice created for ${member.user.tag}`,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ViewChannel]
          },
          {
            id: member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers]
          }
        ]
      });

      // Save temp voice config
      const config: TempVoiceConfig = {
        guildId: guild.id,
        ownerId: member.id,
        channelId: tempChannel.id,
        channelName: tempChannel.name,
        createdAt: new Date().toISOString(),
        settings: {
          userLimit: 0,
          isLocked: false,
          trustedUsers: [],
          blockedUsers: []
        }
      };
      saveTempVoiceConfig(tempChannel.id, config);

      // Move user to new channel
      await member.voice.setChannel(tempChannel);

      console.log(`✅ Created temp voice: ${tempChannel.name} (${tempChannel.id})`);
    }

    // Check if user left a temp voice channel
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const configs = loadTempVoiceConfigs();
      const channelConfig = configs[oldState.channelId];

      if (channelConfig) {
        const channel = oldState.channel;
        
        // If channel is empty, delete it
        if (channel && channel.members.size === 0) {
          console.log(`🗑️ Temp voice empty, deleting: ${channel.name} (${channel.id})`);
          
          try {
            await channel.delete('Temp voice channel empty');
            deleteTempVoiceConfig(oldState.channelId);
            console.log(`✅ Deleted empty temp voice: ${channel.name}`);
          } catch (error) {
            console.error('Failed to delete temp voice:', error);
          }
        }
      }
    }

  } catch (error) {
    console.error('Voice state update error:', error);
  }
}
