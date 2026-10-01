// Quick Report Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  PermissionFlagsBits,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  MessageContextMenuCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  GuildMember,
  ChannelType
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import { reportManager } from './QuickReportManager';

export default class QuickReportModule {
  name = 'quickreport-module';
  description = 'Quick Report - Context menu message reporting';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`${emojis.copy} Quick Report module initialized`);
    this.registerCommands();
    this.registerEvents();
    console.log(`${emojis.success} Quick Report module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // Context Menu: Report Message
    const reportContextMenu = {
      data: new ContextMenuCommandBuilder()
        .setName('Report Message')
        .setType(ApplicationCommandType.Message),
      execute: async (interaction: MessageContextMenuCommandInteraction) => {
        const config = reportManager.getConfig(interaction.guildId!);

        if (!config.enabled) {
          return interaction.reply({
            content: '${emojis.error} Quick Report is not enabled in this server!',
            flags: 64
          });
        }

        if (!config.reportChannelId) {
          return interaction.reply({
            content: '${emojis.error} No report channel configured! Contact an administrator.',
            flags: 64
          });
        }

        const message = interaction.targetMessage;

        // Check if channel is allowed
        const channel = message.channel;
        const categoryId = channel.type === ChannelType.GuildText ? channel.parentId : null;
        
        if (!reportManager.isChannelAllowed(interaction.guildId!, message.channelId, categoryId)) {
          return interaction.reply({
            content: '${emojis.error} Reports are not allowed in this channel!',
            flags: 64
          });
        }

        // Cannot report own message
        if (message.author.id === interaction.user.id) {
          return interaction.reply({
            content: '${emojis.error} You cannot report your own message!',
            flags: 64
          });
        }

        // Cannot report bot messages
        if (message.author.bot) {
          return interaction.reply({
            content: '${emojis.error} You cannot report bot messages!',
            flags: 64
          });
        }

        // Show modal for reason
        const modal = new ModalBuilder()
          .setCustomId(`report_modal_${message.id}`)
          .setTitle('Report Message');

        const reasonInput = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Reason for reporting')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Enter your reason for reporting this message...')
          .setRequired(true)
          .setMaxLength(500);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    };

    // /quickreport-enable
    const enableCommand = {
      data: new SlashCommandBuilder()
        .setName('quickreport-enable')
        .setDescription('Bật hệ thống báo cáo nhanh')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Kênh để gửi báo cáo')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);

        reportManager.updateConfig(interaction.guildId!, {
          enabled: true,
          reportChannelId: channel.id
        });

        await interaction.reply({
          content: `${emojis.success} Quick Report enabled! Reports will be sent to <#${channel.id}>`,
          flags: 64
        });
      }
    };

    // /quickreport-disable
    const disableCommand = {
      data: new SlashCommandBuilder()
        .setName('quickreport-disable')
        .setDescription('Tắt hệ thống báo cáo nhanh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        reportManager.updateConfig(interaction.guildId!, { enabled: false });

        await interaction.reply({
          content: '${emojis.success} Quick Report disabled!',
          flags: 64
        });
      }
    };

    // /quickreport-config
    const configCommand = {
      data: new SlashCommandBuilder()
        .setName('quickreport-config')
        .setDescription('Cấu hình báo cáo nhanh')
        .addSubcommand(sub =>
          sub
            .setName('add-manager')
            .setDescription('Thêm role quản lý')
            .addRoleOption(option =>
              option.setName('role').setDescription('Role quản lý').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('remove-manager')
            .setDescription('Xóa role quản lý')
            .addRoleOption(option =>
              option.setName('role').setDescription('Role quản lý').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('blacklist-channel')
            .setDescription('Chặn kênh khỏi báo cáo')
            .addChannelOption(option =>
              option.setName('channel').setDescription('Kênh').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('whitelist-channel')
            .setDescription('Cho phép kênh báo cáo')
            .addChannelOption(option =>
              option.setName('channel').setDescription('Kênh').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('view').setDescription('Xem cấu hình hiện tại')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const config = reportManager.getConfig(interaction.guildId!);

        if (subcommand === 'add-manager') {
          const role = interaction.options.getRole('role', true);
          if (!config.managerRoleIds.includes(role.id)) {
            config.managerRoleIds.push(role.id);
            reportManager.updateConfig(interaction.guildId!, config);
          }
          return interaction.reply({
            content: `${emojis.success} Added ${role} as a manager role!`,
            flags: 64
          });
        }

        if (subcommand === 'remove-manager') {
          const role = interaction.options.getRole('role', true);
          config.managerRoleIds = config.managerRoleIds.filter(id => id !== role.id);
          reportManager.updateConfig(interaction.guildId!, config);
          return interaction.reply({
            content: `${emojis.success} Removed ${role} from manager roles!`,
            flags: 64
          });
        }

        if (subcommand === 'blacklist-channel') {
          const channel = interaction.options.getChannel('channel', true);
          if (!config.blacklistedChannelIds.includes(channel.id)) {
            config.blacklistedChannelIds.push(channel.id);
            reportManager.updateConfig(interaction.guildId!, config);
          }
          return interaction.reply({
            content: `${emojis.success} Blacklisted <#${channel.id}> from reports!`,
            flags: 64
          });
        }

        if (subcommand === 'whitelist-channel') {
          const channel = interaction.options.getChannel('channel', true);
          if (!config.whitelistedChannelIds.includes(channel.id)) {
            config.whitelistedChannelIds.push(channel.id);
            reportManager.updateConfig(interaction.guildId!, config);
          }
          return interaction.reply({
            content: `${emojis.success} Whitelisted <#${channel.id}> for reports!`,
            flags: 64
          });
        }

        if (subcommand === 'view') {
          const embed = new EmbedBuilder()
            .setColor(0x3b82f6)
            .setTitle('${emojis.copy} Quick Report Configuration')
            .addFields(
              {
                name: 'Status',
                value: config.enabled ? '${emojis.success} Enabled' : '${emojis.error} Disabled',
                inline: true
              },
              {
                name: 'Report Channel',
                value: config.reportChannelId ? `<#${config.reportChannelId}>` : 'Not set',
                inline: true
              },
              {
                name: 'Manager Roles',
                value: config.managerRoleIds.length > 0
                  ? config.managerRoleIds.map(id => `<@&${id}>`).join(', ')
                  : 'None',
                inline: false
              },
              {
                name: 'Blacklisted Channels',
                value: config.blacklistedChannelIds.length > 0
                  ? config.blacklistedChannelIds.map(id => `<#${id}>`).join(', ')
                  : 'None',
                inline: false
              },
              {
                name: 'Whitelisted Channels',
                value: config.whitelistedChannelIds.length > 0
                  ? config.whitelistedChannelIds.map(id => `<#${id}>`).join(', ')
                  : 'None',
                inline: false
              }
            );

          return interaction.reply({ embeds: [embed], flags: 64 });
        }
      }
    };

    // /quickreport-update
    const updateCommand = {
      data: new SlashCommandBuilder()
        .setName('quickreport-update')
        .setDescription('Cập nhật trạng thái báo cáo')
        .addStringOption(option =>
          option
            .setName('report-id')
            .setDescription('UUID báo cáo')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('Trạng thái mới')
            .setRequired(true)
            .addChoices(
              { name: 'Đang chờ', value: 'pending' },
              { name: 'Đã giải quyết', value: 'resolved' },
              { name: 'Đã đóng', value: 'closed' }
            )
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const reportId = interaction.options.getString('report-id', true);
        const status = interaction.options.getString('status', true) as 'pending' | 'resolved' | 'closed';

        const member = interaction.member as GuildMember;
        const roleIds = member.roles.cache.map(r => r.id);

        if (!reportManager.isManager(interaction.guildId!, roleIds) && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            content: '${emojis.error} You do not have permission to update reports!',
            flags: 64
          });
        }

        const report = reportManager.updateReport(reportId, status, interaction.user.id);

        if (!report) {
          return interaction.reply({
            content: '${emojis.error} Report not found!',
            flags: 64
          });
        }

        await interaction.reply({
          content: `${emojis.success} Report \`${reportId}\` updated to **${status}**!`,
          flags: 64
        });
      }
    };

    // /quickreport-recent
    const recentCommand = {
      data: new SlashCommandBuilder()
        .setName('quickreport-recent')
        .setDescription('Xem báo cáo gần đây')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Số báo cáo hiển thị')
            .setMinValue(1)
            .setMaxValue(25)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const limit = interaction.options.getInteger('limit') || 10;
        const reports = reportManager.getRecentReports(interaction.guildId!, limit);

        if (reports.length === 0) {
          return interaction.reply({
            content: 'No reports found!',
            flags: 64
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle('${emojis.copy} Recent Reports')
          .setDescription(
            reports
              .map((r, i) => {
                const status = r.status === 'pending' ? '${emojis.loading}' : r.status === 'resolved' ? '${emojis.success}' : '${emojis.lock}';
                return `${i + 1}. ${status} \`${r.id}\` - <@${r.messageAuthorId}> (<t:${Math.floor(r.createdAt / 1000)}:R>)`;
              })
              .join('\n')
          )
          .setFooter({ text: `Total: ${reports.length} reports` });

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    // /quickreport-check
    const checkCommand = {
      data: new SlashCommandBuilder()
        .setName('quickreport-check')
        .setDescription('Kiểm tra báo cáo cụ thể')
        .addStringOption(option =>
          option
            .setName('report-id')
            .setDescription('UUID báo cáo')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const reportId = interaction.options.getString('report-id', true);
        const report = reportManager.getReport(reportId);

        if (!report) {
          return interaction.reply({
            content: '${emojis.error} Report not found!',
            flags: 64
          });
        }

        const statusEmoji = report.status === 'pending' ? '${emojis.loading}' : report.status === 'resolved' ? '${emojis.success}' : '${emojis.lock}';

        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle(`${emojis.copy} Report ${statusEmoji} ${report.status.toUpperCase()}`)
          .addFields(
            { name: 'Report ID', value: `\`${report.id}\``, inline: false },
            { name: 'Reported User', value: `<@${report.messageAuthorId}>`, inline: true },
            { name: 'Reporter', value: `<@${report.reporterId}>`, inline: true },
            { name: 'Channel', value: `<#${report.messageChannelId}>`, inline: true },
            { name: 'Reason', value: report.reason, inline: false },
            { name: 'Message Content', value: report.messageContent || '*No content*', inline: false },
            { name: 'Message URL', value: `[Jump to Message](${report.messageUrl})`, inline: false }
          )
          .setFooter({ text: `Created at` })
          .setTimestamp(report.createdAt);

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    this.commands.set('Report Message', reportContextMenu);
    this.commands.set('quickreport-enable', enableCommand);
    this.commands.set('quickreport-disable', disableCommand);
    this.commands.set('quickreport-config', configCommand);
    this.commands.set('quickreport-update', updateCommand);
    this.commands.set('quickreport-recent', recentCommand);
    this.commands.set('quickreport-check', checkCommand);
  }

  private registerEvents() {
    // Modal submit handler
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('report_modal_')) return;

      const messageId = interaction.customId.replace('report_modal_', '');
      const reason = interaction.fields.getTextInputValue('reason');

      try {
        const message = await interaction.channel?.messages.fetch(messageId);
        if (!message) {
          return interaction.reply({
            content: '${emojis.error} Message not found!',
            flags: 64
          });
        }

        const config = reportManager.getConfig(interaction.guildId!);

        // Create report
        const report = reportManager.createReport(
          interaction.guildId!,
          message.id,
          message.content,
          message.author.id,
          message.author.username,
          message.channelId,
          message.url,
          message.createdTimestamp,
          interaction.user.id,
          interaction.user.username,
          reason,
          message.embeds.map(e => e.toJSON())
        );

        // Send to report channel
        const reportChannel = await interaction.guild?.channels.fetch(config.reportChannelId!);
        if (reportChannel?.isTextBased()) {
          const reportEmbed = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle('🚨 New Report')
            .addFields(
              { name: 'Report ID', value: `\`${report.id}\``, inline: false },
              { name: 'Reported User', value: `<@${report.messageAuthorId}>`, inline: true },
              { name: 'Reporter', value: `<@${report.reporterId}>`, inline: true },
              { name: 'Channel', value: `<#${report.messageChannelId}>`, inline: true },
              { name: 'Reason', value: report.reason, inline: false },
              { name: 'Message Content', value: report.messageContent || '*No content*', inline: false },
              { name: 'Message URL', value: `[Jump to Message](${report.messageUrl})`, inline: false }
            )
            .setFooter({ text: `Use /quickreport-update report-id:${report.id} to update status` })
            .setTimestamp();

          await reportChannel.send({ embeds: [reportEmbed] });
        }

        await interaction.reply({
          content: `${emojis.success} Report submitted! ID: \`${report.id}\``,
          flags: 64
        });
      } catch (error) {
        console.error('Error handling report:', error);
        await interaction.reply({
          content: '${emojis.error} Failed to submit report!',
          flags: 64
        });
      }
    });

    // Auto-delete reports when user leaves/kicked/banned
    this.client.on('guildMemberRemove', async (member) => {
      const deleted = reportManager.deleteReportsByUser(member.guild.id, member.id);
      if (deleted > 0) {
        console.log(`${emojis.delete} Auto-deleted ${deleted} reports for user ${member.id}`);
      }
    });

    this.client.on('guildBanAdd', async (ban) => {
      const deleted = reportManager.deleteReportsByUser(ban.guild.id, ban.user.id);
      if (deleted > 0) {
        console.log(`${emojis.delete} Auto-deleted ${deleted} reports for banned user ${ban.user.id}`);
      }
    });
  }

  async cleanup() {
    console.log('🧹 Quick Report module cleanup');
  }
}
