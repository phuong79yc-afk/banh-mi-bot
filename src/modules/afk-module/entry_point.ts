// AFK Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  Message
} from 'discord.js';
import { afkManager } from './AFKManager';
import { emojis } from '../../config/emojis';
import { createEnhancedEmbed } from '../../utils/embedHelper';

export default class AFKModule {
  name = 'afk-module';
  description = 'AFK System - Set yourself AFK with auto welcome back';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('💤 AFK module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ AFK module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /afk
    const afkCommand = {
      data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Đặt trạng thái AFK')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do AFK')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('silent')
            .setDescription('Thực hiện lệnh này trong chế độ im lặng')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const reason = interaction.options.getString('reason') || 'AFK';
        const silent = interaction.options.getBoolean('silent') || false;

        // Set AFK
        afkManager.setAFK(interaction.guildId!, interaction.user.id, reason);

        const embed = createEnhancedEmbed({
          title: '💤 AFK Status Set',
          description: `You are now AFK: **${reason}**\n\nType any message to remove AFK status`,
          color: 'warning',
        });

        await interaction.reply({ 
          embeds: [embed],
          ephemeral: silent
        });
      }
    };

    // /afk-remove
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('afk-remove')
        .setDescription('Xóa trạng thái AFK'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const afkUser = afkManager.removeAFK(interaction.guildId!, interaction.user.id);

        if (!afkUser) {
          return interaction.reply({
            content: '❌ You are not AFK!',
            flags: 64
          });
        }

        const duration = afkManager.getTimeElapsed(afkUser.timestamp);

        await interaction.reply({
          content: `✅ Welcome back! You were AFK for **${duration}**.`,
          flags: 64
        });
      }
    };

    // /afk-list
    const listCommand = {
      data: new SlashCommandBuilder()
        .setName('afk-list')
        .setDescription('Xem danh sách người dùng AFK trong server'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const allAFK = afkManager.getAllAFK();
        const guildAFK = allAFK.filter(a => a.guildId === interaction.guildId);

        if (guildAFK.length === 0) {
          return interaction.reply({
            content: 'No one is AFK in this server!',
            flags: 64
          });
        }

        const embed = createEnhancedEmbed({
          title: '💤 AFK Users',
          description: guildAFK
            .map((afk, i) => {
              const duration = afkManager.getTimeElapsed(afk.timestamp);
              return `${i + 1}. <@${afk.userId}> - ${afk.reason} (${duration} ago)`;
            })
            .join('\n'),
          color: 'info',
          footer: `Total: ${guildAFK.length} AFK users`,
        });

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    this.commands.set('afk', afkCommand);
    this.commands.set('afk-remove', removeCommand);
    this.commands.set('afk-list', listCommand);
  }

  private registerEvents() {
    // Message handler for AFK
    this.client.on('messageCreate', async (message: Message) => {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      // Check if author is AFK - auto remove
      const authorAFK = afkManager.getAFK(message.guild.id, message.author.id);
      if (authorAFK) {
        const duration = afkManager.getTimeElapsed(authorAFK.timestamp);
        const mentionCount = authorAFK.mentions.length;

        afkManager.removeAFK(message.guild.id, message.author.id);

        try {
          const replyMsg = await (message.channel as any).send({
            content: `:stopwatch: Welcome back, ${message.author}! You were AFK for **${duration}** and received **${mentionCount}** mention${mentionCount !== 1 ? 's' : ''}.`
          });

          // Auto-delete after 5 seconds
          setTimeout(async () => {
            try {
              await replyMsg.delete();
            } catch (error) {
              // Ignore if message already deleted
            }
          }, 5000);
        } catch (error) {
          console.error('Error sending AFK welcome back:', error);
        }

        return;
      }

      // Check for mentions of AFK users
      const mentions = message.mentions.users;
      if (mentions.size === 0) return;

      for (const [userId, user] of mentions) {
        // Skip self-mentions
        if (userId === message.author.id) continue;

        const afkUser = afkManager.getAFK(message.guild.id, userId);
        if (afkUser) {
          // Add mention to AFK user's log
          afkManager.addMention(
            message.guild.id,
            userId,
            message.author.id,
            message.author.username,
            message.channel.id,
            message.url
          );

          const duration = afkManager.getTimeElapsed(afkUser.timestamp);

          try {
            const replyMsg = await message.reply({
              content: `:placard: \`${user.username}\` is currently AFK for <t:${Math.floor(afkUser.timestamp / 1000)}:R>: **${afkUser.reason}**`
            });

            // Auto-delete after 10 seconds
            setTimeout(async () => {
              try {
                await replyMsg.delete();
              } catch (error) {
                // Ignore if message already deleted
              }
            }, 10000);
          } catch (error) {
            console.error('Error sending AFK notification:', error);
          }

          // Only notify once per message
          break;
        }
      }
    });
  }

  async cleanup() {
    console.log('🧹 AFK module cleanup');
  }
}
