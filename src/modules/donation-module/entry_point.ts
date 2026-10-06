// Donation Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import { donationManager } from './DonationManager';

export default class DonationModule {
  name = 'donation-module';
  description = 'Donation Tracking - Track donations with role rewards';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`🪙 Donation module initialized`);
    this.registerCommands();
    console.log(`✅ Donation module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /donation-enable
    const enableCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-enable')
        .setDescription('✅ Bật theo dõi donation')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        donationManager.updateConfig(interaction.guildId!, { enabled: true });

        await interaction.editReply({
          content: `${emojis.success} Donation tracking enabled!`
        });
      }
    };

    // /donation-disable
    const disableCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-disable')
        .setDescription('❌ Tắt theo dõi donation')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        donationManager.updateConfig(interaction.guildId!, { enabled: false });

        await interaction.editReply({
          content: `${emojis.success} Donation tracking disabled!`
        });
      }
    };

    // /donation-add
    const addCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-add')
        .setDescription('🎁 Thêm donation')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('👤 Người đã donate')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('💵 Số tiền donation')
            .setRequired(true)
            .setMinValue(0.01)
        )
        .addStringOption(option =>
          option
            .setName('note')
            .setDescription('Ghi chú')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const config = donationManager.getConfig(interaction.guildId!);

        if (!config.enabled) {
          return interaction.editReply({
            content: `${emojis.error} Donation tracking is not enabled!`
          });
        }

        const member = interaction.member as GuildMember;
        const roleIds = member.roles.cache.map(r => r.id);

        if (!donationManager.canReceive(interaction.guildId!, roleIds) && 
            !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.editReply({
            content: `${emojis.error} You do not have permission to add donations!`
          });
        }

        const user = interaction.options.getUser('user', true);
        const amount = interaction.options.getNumber('amount', true);
        const note = interaction.options.getString('note') || 'No note';

        const donor = donationManager.addDonation(
          interaction.guildId!,
          user.id,
          user.username,
          amount,
          note,
          interaction.user.id
        );

        // Check for role rewards
        const rewards = donationManager.getRoleRewardsForAmount(interaction.guildId!, donor.totalAmount);
        const targetMember = await interaction.guild?.members.fetch(user.id);

        if (targetMember && rewards.length > 0) {
          for (const reward of rewards) {
            if (!targetMember.roles.cache.has(reward.roleId)) {
              try {
                await targetMember.roles.add(reward.roleId);
              } catch (error) {
                console.error(`Error adding role ${reward.roleId}:`, error);
              }
            }
          }
        }

        const embed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle('${emojis.coin} Donation Added')
          .addFields(
            { name: 'Donor', value: `<@${user.id}>`, inline: true },
            { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
            { name: 'Total Donated', value: `$${donor.totalAmount.toFixed(2)}`, inline: true },
            { name: 'Note', value: note, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Send thank you message
        if (config.notificationChannelId) {
          try {
            const channel = await interaction.guild?.channels.fetch(config.notificationChannelId);
            if (channel?.isTextBased()) {
              const message = donationManager.replacePlaceholders(
                config.thankYouMessage,
                user.id,
                user.username,
                amount
              );
              await channel.send(message);
            }
          } catch (error) {
            console.error('Error sending thank you message:', error);
          }
        }
      }
    };

    // /donation-subtract
    const subtractCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-subtract')
        .setDescription('Trừ/xóa số tiền donation')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để trừ')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Số tiền để trừ')
            .setRequired(true)
            .setMinValue(0.01)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do trừ')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const user = interaction.options.getUser('user', true);
        const amount = interaction.options.getNumber('amount', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const donor = donationManager.subtractDonation(
          interaction.guildId!,
          user.id,
          amount,
          reason,
          interaction.user.id
        );

        if (!donor) {
          return interaction.editReply({
            content: `${emojis.error} User has no donation record!`
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('💸 Donation Subtracted')
          .addFields(
            { name: 'User', value: `<@${user.id}>`, inline: true },
            { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
            { name: 'New Total', value: `$${donor.totalAmount.toFixed(2)}`, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /donation-leaderboard
    const leaderboardCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-leaderboard')
        .setDescription('Xem bảng xếp hạng donation')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Số người hiển thị')
            .setMinValue(1)
            .setMaxValue(25)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const limit = interaction.options.getInteger('limit') || 10;
        const leaderboard = donationManager.getLeaderboard(interaction.guildId!, limit);

        if (leaderboard.length === 0) {
          return interaction.editReply({
            content: 'No donations recorded yet!'
          });
        }

        const stats = donationManager.getStats(interaction.guildId!);

        const embed = new EmbedBuilder()
          .setColor(0xfbbf24)
          .setTitle('${emojis.trophy} Donation Leaderboard')
          .setDescription(
            leaderboard
              .map((donor, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                return `${medal} <@${donor.userId}> - **$${donor.totalAmount.toFixed(2)}** (${donor.donations.length} donation${donor.donations.length > 1 ? 's' : ''})`;
              })
              .join('\n')
          )
          .addFields(
            { 
              name: '${emojis.chart} Statistics', 
              value: `Total Donors: **${stats.totalDonors}**\nTotal Donated: **$${stats.totalAmount.toFixed(2)}**\nAverage: **$${stats.avgDonation.toFixed(2)}**`,
              inline: false
            }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /donation-stats
    const statsCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-stats')
        .setDescription('Xem thống kê donation')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để kiểm tra (mặc định là bạn)')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const user = interaction.options.getUser('user') || interaction.user;
        const donor = donationManager.getDonor(interaction.guildId!, user.id);

        if (!donor) {
          return interaction.editReply({
            content: user.id === interaction.user.id 
              ? 'You have no donation record yet!' 
              : `${user} has no donation record yet!`
          });
        }

        const recentDonations = donor.donations.slice(-5).reverse();

        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle(`${emojis.coin} Donation Stats - ${donor.username}`)
          .addFields(
            { name: 'Total Donated', value: `$${donor.totalAmount.toFixed(2)}`, inline: true },
            { name: 'Total Donations', value: donor.donations.length.toString(), inline: true },
            { 
              name: 'Recent Donations', 
              value: recentDonations.length > 0
                ? recentDonations.map(d => 
                    `${d.amount >= 0 ? '+' : ''}$${d.amount.toFixed(2)} - ${d.note} (<t:${Math.floor(d.timestamp / 1000)}:R>)`
                  ).join('\n')
                : 'None',
              inline: false
            }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /donation-config
    const configCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-config')
        .setDescription('Configure donation tracking')
        .addSubcommand(sub =>
          sub
            .setName('add-receiver')
            .setDescription('Add a role that can add donations')
            .addRoleOption(option =>
              option.setName('role').setDescription('Receiver role').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('remove-receiver')
            .setDescription('Remove a receiver role')
            .addRoleOption(option =>
              option.setName('role').setDescription('Receiver role').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('add-reward')
            .setDescription('Add a role reward for donation threshold')
            .addRoleOption(option =>
              option.setName('role').setDescription('Reward role').setRequired(true)
            )
            .addNumberOption(option =>
              option.setName('threshold').setDescription('Amount threshold').setRequired(true).setMinValue(0.01)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('remove-reward')
            .setDescription('Remove a role reward')
            .addRoleOption(option =>
              option.setName('role').setDescription('Reward role').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('set-channel')
            .setDescription('Set notification channel')
            .addChannelOption(option =>
              option.setName('channel').setDescription('Notification channel').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName('set-message')
            .setDescription('Set thank you message')
            .addStringOption(option =>
              option.setName('message').setDescription('Use {user}, {username}, {amount}').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('view').setDescription('View current configuration')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const subcommand = interaction.options.getSubcommand();
        const config = donationManager.getConfig(interaction.guildId!);

        if (subcommand === 'add-receiver') {
          const role = interaction.options.getRole('role', true);
          if (!config.receiverRoleIds.includes(role.id)) {
            config.receiverRoleIds.push(role.id);
            donationManager.updateConfig(interaction.guildId!, config);
          }
          return interaction.editReply({
            content: `${emojis.success} Added ${role} as a receiver role!`
          });
        }

        if (subcommand === 'remove-receiver') {
          const role = interaction.options.getRole('role', true);
          config.receiverRoleIds = config.receiverRoleIds.filter(id => id !== role.id);
          donationManager.updateConfig(interaction.guildId!, config);
          return interaction.editReply({
            content: `${emojis.success} Removed ${role} from receiver roles!`
          });
        }

        if (subcommand === 'add-reward') {
          const role = interaction.options.getRole('role', true);
          const threshold = interaction.options.getNumber('threshold', true);
          donationManager.addRoleReward(interaction.guildId!, role.id, threshold);
          return interaction.editReply({
            content: `${emojis.success} Added ${role} as a reward for $${threshold.toFixed(2)}!`
          });
        }

        if (subcommand === 'remove-reward') {
          const role = interaction.options.getRole('role', true);
          donationManager.removeRoleReward(interaction.guildId!, role.id);
          return interaction.editReply({
            content: `${emojis.success} Removed ${role} from role rewards!`
          });
        }

        if (subcommand === 'set-channel') {
          const channel = interaction.options.getChannel('channel', true);
          donationManager.updateConfig(interaction.guildId!, { notificationChannelId: channel.id });
          return interaction.editReply({
            content: `${emojis.success} Set notification channel to <#${channel.id}>!`
          });
        }

        if (subcommand === 'set-message') {
          const message = interaction.options.getString('message', true);
          donationManager.updateConfig(interaction.guildId!, { thankYouMessage: message });
          return interaction.editReply({
            content: `${emojis.success} Updated thank you message!`
          });
        }

        if (subcommand === 'view') {
          const embed = new EmbedBuilder()
            .setColor(0x3b82f6)
            .setTitle('${emojis.coin} Donation Configuration')
            .addFields(
              {
                name: 'Status',
                value: config.enabled ? '${emojis.success} Enabled' : '${emojis.error} Disabled',
                inline: true
              },
              {
                name: 'Notification Channel',
                value: config.notificationChannelId ? `<#${config.notificationChannelId}>` : 'Not set',
                inline: true
              },
              {
                name: 'Receiver Roles',
                value: config.receiverRoleIds.length > 0
                  ? config.receiverRoleIds.map(id => `<@&${id}>`).join(', ')
                  : 'All roles (no restriction)',
                inline: false
              },
              {
                name: 'Role Rewards',
                value: config.roleRewards.length > 0
                  ? config.roleRewards.map(r => `<@&${r.roleId}> - $${r.threshold.toFixed(2)}`).join('\n')
                  : 'None',
                inline: false
              },
              {
                name: 'Thank You Message',
                value: `\`${config.thankYouMessage}\``,
                inline: false
              }
            );

          return interaction.editReply({ embeds: [embed] });
        }
      }
    };

    this.commands.set('donation-enable', enableCommand);
    this.commands.set('donation-disable', disableCommand);
    this.commands.set('donation-add', addCommand);
    this.commands.set('donation-subtract', subtractCommand);
    this.commands.set('donation-leaderboard', leaderboardCommand);
    this.commands.set('donation-stats', statsCommand);
    this.commands.set('donation-config', configCommand);
  }

  async cleanup() {
    console.log('🧹 Donation module cleanup');
  }
}
