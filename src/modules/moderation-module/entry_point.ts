// Moderation Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
  TextChannel,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';

export default class ModerationModule {
  name = 'moderation-module';
  description = 'Moderation Commands';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`${emojis.shield} Moderation module initialized`);
    this.registerCommands();
    console.log(`${emojis.success} Moderation module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /moderation-kick
    const kickCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-kick')
        .setDescription('Kick người dùng khỏi server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để kick')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do kick')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getMember('user') as GuildMember;
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        if (!target) {
          return interaction.reply({
            content: `${emojis.error} Không tìm thấy người dùng!`,
            flags: 64
          });
        }

        if (!target.kickable) {
          return interaction.reply({
            content: `${emojis.error} Không thể kick người dùng này!`,
            flags: 64
          });
        }

        try {
          await target.kick(reason);

          const embed = createEnhancedEmbed({
            title: `${emojis.remove} Đã Kick`,
            description: `**${target.user.tag}** đã bị kick khỏi server`,
            color: 0x1ABC9C,
            fields: [
              { name: `${emojis.user} Người dùng`, value: `${target}`, inline: true },
              { name: `${emojis.shield} Bởi`, value: `${interaction.user}`, inline: true },
              { name: `${emojis.document} Lý do`, value: reason, inline: false }
            ]
          });

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({
            content: `${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể kick'}`,
            flags: 64
          });
        }
      }
    };

    // /moderation-ban
    const banCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-ban')
        .setDescription('Ban người dùng khỏi server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để ban')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do ban')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('delete-days')
            .setDescription('Xóa tin nhắn (số ngày)')
            .setMinValue(0)
            .setMaxValue(7)
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getMember('user') as GuildMember;
        const reason = interaction.options.getString('reason') || 'Không có lý do';
        const deleteDays = interaction.options.getInteger('delete-days') || 0;

        if (!target) {
          return interaction.reply({
            content: `${emojis.error} Không tìm thấy người dùng!`,
            flags: 64
          });
        }

        if (!target.bannable) {
          return interaction.reply({
            content: `${emojis.error} Không thể ban người dùng này!`,
            flags: 64
          });
        }

        try {
          await target.ban({ 
            reason,
            deleteMessageSeconds: deleteDays * 24 * 60 * 60
          });

          const embed = createEnhancedEmbed({
            title: `${emojis.warning} Đã Ban`,
            description: `**${target.user.tag}** đã bị ban khỏi server`,
            color: 0xED4245,
            fields: [
              { name: `${emojis.user} Người dùng`, value: `${target}`, inline: true },
              { name: `${emojis.shield} Bởi`, value: `${interaction.user}`, inline: true },
              { name: `${emojis.document} Lý do`, value: reason, inline: false }
            ]
          });

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({
            content: `${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể ban'}`,
            flags: 64
          });
        }
      }
    };

    // /moderation-timeout
    const timeoutCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-timeout')
        .setDescription('Timeout người dùng')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để timeout')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('duration')
            .setDescription('Thời gian (phút)')
            .setMinValue(1)
            .setMaxValue(40320)
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do timeout')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getMember('user') as GuildMember;
        const duration = interaction.options.getInteger('duration', true);
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        if (!target) {
          return interaction.reply({
            content: `${emojis.error} Không tìm thấy người dùng!`,
            flags: 64
          });
        }

        if (!target.moderatable) {
          return interaction.reply({
            content: `${emojis.error} Không thể timeout người dùng này!`,
            flags: 64
          });
        }

        try {
          await target.timeout(duration * 60 * 1000, reason);

          const embed = createEnhancedEmbed({
            title: `${emojis.clock} Đã Timeout`,
            description: `**${target.user.tag}** đã bị timeout`,
            color: 0xFEE75C,
            fields: [
              { name: `${emojis.user} Người dùng`, value: `${target}`, inline: true },
              { name: `${emojis.clock} Thời gian`, value: `${duration} phút`, inline: true },
              { name: `${emojis.document} Lý do`, value: reason, inline: false }
            ]
          });

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({
            content: `${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể timeout'}`,
            flags: 64
          });
        }
      }
    };

    // /moderation-clear
    const clearCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-clear')
        .setDescription('Xóa tin nhắn trong kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Số tin nhắn để xóa (1-100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const amount = interaction.options.getInteger('amount', true);

        try {
          const channel = interaction.channel as TextChannel;
          const deleted = await channel.bulkDelete(amount, true);

          await interaction.reply({
            content: `${emojis.success} Đã xóa **${deleted.size}** tin nhắn!`,
            flags: 64
          });
        } catch (error) {
          await interaction.reply({
            content: `${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể xóa tin nhắn'}`,
            flags: 64
          });
        }
      }
    };

    // /moderation-lock
    const lockCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-lock')
        .setDescription('Khóa kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Kênh để khóa (mặc định kênh hiện tại)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do khóa')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        try {
          await targetChannel.permissionOverwrites.edit(interaction.guild!.id, {
            SendMessages: false
          });

          const embed = createEnhancedEmbed({
            title: `${emojis.lock} Kênh Đã Khóa`,
            description: `${targetChannel} đã bị **khóa**`,
            color: 0xED4245,
            fields: [
              { name: `${emojis.shield} Bởi`, value: `${interaction.user}`, inline: true },
              { name: `${emojis.document} Lý do`, value: reason, inline: true }
            ]
          });

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({
            content: `${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể khóa kênh'}`,
            flags: 64
          });
        }
      }
    };

    // /moderation-unlock
    const unlockCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-unlock')
        .setDescription('Mở khóa kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Kênh để mở khóa (mặc định kênh hiện tại)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;

        try {
          await targetChannel.permissionOverwrites.edit(interaction.guild!.id, {
            SendMessages: null
          });

          const embed = createEnhancedEmbed({
            title: `${emojis.unlock} Kênh Đã Mở Khóa`,
            description: `${targetChannel} đã được mở khóa`,
            color: 0x57F287,
            fields: [
              { name: `${emojis.shield} Bởi`, value: `${interaction.user}`, inline: true }
            ]
          });

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({
            content: `${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể mở khóa kênh'}`,
            flags: 64
          });
        }
      }
    };

    this.commands.set('moderation-kick', kickCommand);
    this.commands.set('moderation-ban', banCommand);
    this.commands.set('moderation-timeout', timeoutCommand);
    this.commands.set('moderation-clear', clearCommand);
    this.commands.set('moderation-lock', lockCommand);
    this.commands.set('moderation-unlock', unlockCommand);
  }

  async cleanup() {
    console.log('🧹 Moderation module cleanup');
  }
}
