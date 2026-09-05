// Sticky Messages Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  TextChannel,
  Message,
  AllowedMentionsTypes
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { stickyManager, StickyMode } from './StickyManager';

export default class StickyMessagesModule {
  name = 'sticky-messages-module';
  description = 'Sticky Messages - Pin important messages that auto-repost';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('📌 Sticky Messages module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Sticky Messages module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /sticky message
    const messageCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-message')
        .setDescription('Đặt tin nhắn sticky trong kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh để gán sticky')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);

        // Check if channel already has sticky
        const existing = stickyManager.get(interaction.guildId!, channel.id);
        if (existing) {
          return interaction.reply({
            content: `❌ Channel <#${channel.id}> already has a sticky message! Remove it first with \`/sticky-remove\`.`,
            flags: 64
          });
        }

        // Show modal for message input
        const modal = new ModalBuilder()
          .setCustomId(`sticky_modal_${channel.id}`)
          .setTitle('Set Sticky Message');

        const messageInput = new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Sticky Message Content')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Enter your sticky message here...')
          .setRequired(true)
          .setMaxLength(2000);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    };

    // /sticky remove
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-remove')
        .setDescription('Xóa tin nhắn sticky khỏi kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh để xóa sticky')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);

        const result = stickyManager.remove(interaction.guildId!, channel.id);

        if (!result.success) {
          return interaction.reply({
            content: `❌ ${result.error}`,
            flags: 64
          });
        }

        // Try to delete last sticky message
        const sticky = stickyManager.get(interaction.guildId!, channel.id);
        if (sticky?.lastMessageId) {
          try {
            const textChannel = await this.client.channels.fetch(channel.id) as TextChannel;
            const msg = await textChannel.messages.fetch(sticky.lastMessageId);
            await msg.delete();
          } catch (error) {
            // Ignore if message not found
          }
        }

        await interaction.reply({
          content: `✅ Successfully removed sticky message from <#${channel.id}>!`,
          flags: 64
        });
      }
    };

    // /sticky mode
    const modeCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-mode')
        .setDescription('Đổi chế độ sticky')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('mode')
            .setDescription('Chọn chế độ')
            .setRequired(true)
            .addChoices(
              { name: 'Ngưỡng tin nhắn', value: 'threshold' },
              { name: 'Độ trễ không hoạt động', value: 'inactive' }
            )
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const mode = interaction.options.getString('mode', true) as StickyMode;

        const result = stickyManager.updateMode(interaction.guildId!, channel.id, mode);

        if (!result.success) {
          return interaction.reply({
            content: `❌ ${result.error}`,
            flags: 64
          });
        }

        await interaction.reply({
          content: `✅ Changed sticky mode to **${mode === 'threshold' ? 'Message Threshold' : 'Chat Inactive Delay'}** for <#${channel.id}>!`,
          flags: 64
        });
      }
    };

    // /sticky threshold
    const thresholdCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-threshold')
        .setDescription('Đặt ngưỡng tin nhắn (1-500)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('threshold')
            .setDescription('Số tin nhắn trước khi sticky xuất hiện lại (1-500)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(500)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const threshold = interaction.options.getInteger('threshold', true);

        const result = stickyManager.updateThreshold(interaction.guildId!, channel.id, threshold);

        if (!result.success) {
          return interaction.reply({
            content: `❌ ${result.error}`,
            flags: 64
          });
        }

        await interaction.reply({
          content: `✅ Set message threshold to **${threshold}** for <#${channel.id}>!`,
          flags: 64
        });
      }
    };

    // /sticky delay
    const delayCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-delay')
        .setDescription('Đặt độ trễ không hoạt động (1-15 giây)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('delay')
            .setDescription('Số giây không hoạt động trước khi sticky xuất hiện lại (1-15)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(15)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const delay = interaction.options.getInteger('delay', true);

        const result = stickyManager.updateDelay(interaction.guildId!, channel.id, delay);

        if (!result.success) {
          return interaction.reply({
            content: `❌ ${result.error}`,
            flags: 64
          });
        }

        await interaction.reply({
          content: `✅ Set inactive delay to **${delay} seconds** for <#${channel.id}>!`,
          flags: 64
        });
      }
    };

    // /sticky config
    const configCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-config')
        .setDescription('Xem cấu hình sticky')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Chọn kênh')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const sticky = stickyManager.get(interaction.guildId!, channel.id);

        if (!sticky) {
          return interaction.reply({
            content: `❌ No sticky message found in <#${channel.id}>!`,
            flags: 64
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x667eea)
          .setTitle(`📌 Sticky Message Configuration`)
          .setDescription(`Configuration for <#${channel.id}>`)
          .addFields(
            { name: 'Mode', value: sticky.mode === 'threshold' ? 'Message Threshold' : 'Chat Inactive Delay', inline: true },
            { name: sticky.mode === 'threshold' ? 'Threshold' : 'Delay', value: sticky.mode === 'threshold' ? `${sticky.threshold} messages` : `${sticky.delay} seconds`, inline: true },
            { name: 'Allow Mentions', value: sticky.allowMentions ? 'Yes' : 'No', inline: true },
            { name: 'Message', value: sticky.message.substring(0, 1024) },
            { name: 'Created By', value: `<@${sticky.createdBy}>`, inline: true },
            { name: 'Created At', value: `<t:${Math.floor(sticky.createdAt / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: `ID: ${sticky.id}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    // /sticky list
    const listCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-list')
        .setDescription('Xem danh sách sticky trong server'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const stickies = stickyManager.getAll(interaction.guildId!);

        if (stickies.length === 0) {
          return interaction.reply({
            content: "This guild doesn't have any sticky messages!",
            flags: 64
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x667eea)
          .setTitle('📌 Sticky Messages')
          .setDescription(
            `This guild has **${stickies.length}** sticky message(s).\n\n` +
            stickies
              .map((s, i) => `${i + 1}. <#${s.channelId}> → ${s.mode} (${s.mode === 'threshold' ? `${s.threshold} msgs` : `${s.delay}s delay`})`)
              .join('\n')
          )
          .setFooter({ text: `Max ${3} sticky messages per guild` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    this.commands.set('sticky-message', messageCommand);
    this.commands.set('sticky-remove', removeCommand);
    this.commands.set('sticky-mode', modeCommand);
    this.commands.set('sticky-threshold', thresholdCommand);
    this.commands.set('sticky-delay', delayCommand);
    this.commands.set('sticky-config', configCommand);
    this.commands.set('sticky-list', listCommand);
  }

  private registerEvents() {
    // Modal submit handler
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('sticky_modal_')) return;

      const channelId = interaction.customId.replace('sticky_modal_', '');
      const message = interaction.fields.getTextInputValue('message');

      const result = stickyManager.add(
        interaction.guildId!,
        channelId,
        message,
        interaction.user.id,
        {
          mode: 'threshold',
          threshold: 3,
          delay: 5,
          allowMentions: false
        }
      );

      if (!result.success) {
        return interaction.reply({
          content: `❌ ${result.error}`,
          flags: 64
        });
      }

      // Post initial sticky message
      try {
        const channel = await this.client.channels.fetch(channelId) as TextChannel;
        const sent = await channel.send({
          content: message,
          allowedMentions: { parse: [] }
        });

        stickyManager.updateLastMessageId(interaction.guildId!, channelId, sent.id);

        await interaction.reply({
          content: `✅ Successfully created sticky message in <#${channelId}>!`,
          flags: 64
        });
      } catch (error) {
        console.error('Error posting sticky:', error);
        await interaction.reply({
          content: '❌ Failed to post sticky message!',
          flags: 64
        });
      }
    });

    // Message create handler for sticky repost
    this.client.on('messageCreate', async (message: Message) => {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      const sticky = stickyManager.get(message.guild.id, message.channel.id);
      if (!sticky) return;

      // Skip if message is the sticky itself
      if (message.id === sticky.lastMessageId) return;

      if (sticky.mode === 'threshold') {
        // Threshold mode: count messages
        const count = stickyManager.incrementCount(message.guild.id, message.channel.id);

        if (count >= (sticky.threshold || 3)) {
          await this.repostSticky(message.channel as TextChannel, sticky);
        }
      } else {
        // Inactive mode: reset timer on each message
        stickyManager.clearInactiveTimer(message.guild.id, message.channel.id);
        stickyManager.updateActivity(message.guild.id, message.channel.id);

        // Start new timer
        stickyManager.startInactiveTimer(
          message.guild.id,
          message.channel.id,
          async () => {
            await this.repostSticky(message.channel as TextChannel, sticky);
          }
        );
      }
    });
  }

  private async repostSticky(channel: TextChannel, sticky: any) {
    try {
      // Delete old sticky if exists
      if (sticky.lastMessageId) {
        try {
          const oldMessage = await channel.messages.fetch(sticky.lastMessageId);
          await oldMessage.delete();
        } catch (error) {
          // Ignore if message not found
        }
      }

      // Post new sticky
      const sent = await channel.send({
        content: sticky.message,
        embeds: sticky.embed ? [sticky.embed] : [],
        allowedMentions: sticky.allowMentions ? { parse: ['users', 'roles'] as AllowedMentionsTypes[] } : { parse: [] }
      });

      // Update last message ID and reset count
      stickyManager.updateLastMessageId(sticky.guildId, sticky.channelId, sent.id);
      stickyManager.resetCount(sticky.guildId, sticky.channelId);

    } catch (error) {
      console.error('Error reposting sticky:', error);
    }
  }

  async cleanup() {
    console.log('🧹 Sticky Messages module cleanup');
  }
}
