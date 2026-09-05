// Snipe Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  Message,
  PartialMessage,
  AttachmentBuilder
} from 'discord.js';
import { snipeManager } from './SnipeManager';
import { createEnhancedEmbed } from '../../utils/embedHelper';

export default class SnipeModule {
  name = 'snipe-module';
  description = 'Snipe - Track deleted and edited messages';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('👀 Snipe module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Snipe module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /snipe
    const snipeCommand = {
      data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Xem tin nhắn đã xóa gần đây')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Số trang (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const page = interaction.options.getInteger('page') || 1;
        const channel = interaction.options.getChannel('channel');
        const channelId = channel?.id || interaction.channelId;

        const messages = snipeManager.getDeleted(channelId, page);
        const total = snipeManager.getDeletedCount(channelId);

        if (messages.length === 0) {
          if (page === 1) {
            return interaction.reply({
              content: `There are no recent deleted messages found in <#${channelId}> within 28 days.`,
              flags: 64
            });
          } else {
            return interaction.reply({
              content: `There is no message in page **${page}**`,
              flags: 64
            });
          }
        }

        const msg = messages[0];
        const timeAgo = Math.floor((Date.now() - (msg.deletedAt || 0)) / 1000);

        const embed = createEnhancedEmbed({
          title: `🗑️ Recent Deleted Message`,
          description: `Recent deleted message for <#${channelId}>`,
          color: 'error',
          fields: [
            { 
              name: 'Author', 
              value: `<@${msg.authorId}> (${msg.authorUsername})`, 
              inline: true 
            },
            { 
              name: 'Deleted', 
              value: `<t:${Math.floor((msg.deletedAt || 0) / 1000)}:R>`, 
              inline: true 
            },
            { 
              name: 'Content', 
              value: msg.content || '*No text content*',
              inline: false
            }
          ],
          footer: `Page ${page}/${Math.min(total, 10)} • Message ID: ${msg.messageId}`,
          timestamp: false,
        });

        if (msg.attachments.length > 0) {
          embed.addFields({
            name: 'Attachments',
            value: msg.attachments.map((url, i) => `[Attachment ${i + 1}](${url})`).join('\n')
          });
        }

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    // /editsnipe
    const editsnipeCommand = {
      data: new SlashCommandBuilder()
        .setName('editsnipe')
        .setDescription('Xem tin nhắn đã chỉnh sửa gần đây')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Số trang (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const page = interaction.options.getInteger('page') || 1;
        const channel = interaction.options.getChannel('channel');
        const channelId = channel?.id || interaction.channelId;

        const messages = snipeManager.getEdited(channelId, page);
        const total = snipeManager.getEditedCount(channelId);

        if (messages.length === 0) {
          if (page === 1) {
            return interaction.reply({
              content: `There are no recent edited messages found in <#${channelId}> within 28 days.`,
              flags: 64
            });
          } else {
            return interaction.reply({
              content: `There is no message in page **${page}**`,
              flags: 64
            });
          }
        }

        const msg = messages[0];

        const embed = createEnhancedEmbed({
          title: `✏️ Recent Edited Message`,
          description: `Recent edited message for <#${channelId}>`,
          color: 'warning',
          fields: [
            { 
              name: 'Author', 
              value: `<@${msg.authorId}> (${msg.authorUsername})`, 
              inline: true 
            },
            { 
              name: 'Edited', 
              value: `<t:${Math.floor((msg.editedAt || 0) / 1000)}:R>`, 
              inline: true 
            },
            { 
              name: 'Before', 
              value: msg.editedFrom || '*No text content*',
              inline: false
            },
            { 
              name: 'After', 
              value: msg.content || '*No text content*',
              inline: false
            }
          ],
          footer: `Page ${page}/${Math.min(total, 10)} • Message ID: ${msg.messageId}`,
          timestamp: false,
        });

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    this.commands.set('snipe', snipeCommand);
    this.commands.set('editsnipe', editsnipeCommand);
  }

  private registerEvents() {
    // Message delete handler
    this.client.on('messageDelete', async (message: Message | PartialMessage) => {
      // Ignore bots, DMs, and partial messages without content
      if (!message.guild || message.author?.bot) return;
      if (!message.content && message.attachments.size === 0) return;

      const attachments = Array.from(message.attachments.values()).map(a => a.url);

      snipeManager.addDeleted(
        message.id,
        message.channel.id,
        message.guild.id,
        message.author?.id || 'Unknown',
        message.author?.username || 'Unknown',
        message.content || '',
        attachments,
        message.createdTimestamp
      );
    });

    // Message edit handler
    this.client.on('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
      // Ignore bots, DMs, and partial messages
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (!oldMessage.content || !newMessage.content) return;
      
      // Ignore if content didn't change
      if (oldMessage.content === newMessage.content) return;

      const attachments = Array.from(newMessage.attachments.values()).map(a => a.url);

      snipeManager.addEdited(
        newMessage.id,
        newMessage.channel.id,
        newMessage.guild.id,
        newMessage.author?.id || 'Unknown',
        newMessage.author?.username || 'Unknown',
        oldMessage.content,
        newMessage.content,
        attachments,
        newMessage.createdTimestamp
      );
    });
  }

  async cleanup() {
    console.log('🧹 Snipe module cleanup');
  }
}
