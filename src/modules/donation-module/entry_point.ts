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
    console.log('💰 Donation module initialized');
    this.registerCommands();
    console.log(`✅ Donation module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /donation-enable
    const enableCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-enable')
        .setDescription('Bật theo dõi donation')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        donationManager.updateConfig(interaction.guildId!, { enabled: true });

        await interaction.reply({
          content: '✅ Donation tracking enabled!',
          flags: 64
        });
      }
    };

    // /donation-disable
    const disableCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-disable')
        .setDescription('Tắt theo dõi donation')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        donationManager.updateConfig(interaction.guildId!, { enabled: false });

        await interaction.reply({
          content: '✅ Donation tracking disabled!',
          flags: 64
        });
      }
    };

    // /donation-add
    const addCommand = {
      data: new SlashCommandBuilder()
        .setName('donation-add')
        .setDescription('Thêm donation')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người đã donate')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Số tiền donation')
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
        const config = donationManager.getConfig(interaction.guildId!);

        if (!config.enabled) {
          return interaction.reply({
            content: '❌ Donation tracking is not enabled!',
            flags: 64
          });
        }

        const member = interaction.member as GuildMember;
        const roleIds = member.roles.cache.map(r => r.id);

        if (!donationManager.canReceive(interaction.guildId!, roleIds) && 
            !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            content: '❌ You do not have permission to add donations!',
            flags: 64
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
          .setTitle('💰 Donation Added')
          .addFields(
            { name: 'Donor', value: `<@${user.id}>`, inline: true },
            { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
            { name: 'Total Donated', value: `$${donor.totalAmount.toFixed(2)}`, inline: true },
            { name: 'Note', value: note, inline: false }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

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
          return interaction.reply({
            content: '❌ User has no donation record!',
            flags: 64
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

        await interaction.reply({ embeds: [embed], flags: 64 });
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
        const limit = interaction.options.getInteger('limit') || 10;
        const leaderboard = donationManager.getLeaderboard(interaction.guildId!, limit);

        if (leaderboard.length === 0) {
          return interaction.reply({
            content: 'No donations recorded yet!',
            flags: 64
          });
        }

        const stats = donationManager.getStats(interaction.guildId!);

        const embed = new EmbedBuilder()
          .setColor(0xfbbf24)
          .setTitle('🏆 Donation Leaderboard')
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
              name: '📊 Statistics', 
              value: `Total Donors: **${stats.totalDonors}**\nTotal Donated: **$${stats.totalAmount.toFixed(2)}**\nAverage: **$${stats.avgDonation.toFixed(2)}**`,
              inline: false
            }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
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
        const user = interaction.options.getUser('user') || interaction.user;
        const donor = donationManager.getDonor(interaction.guildId!, user.id);

        if (!donor) {
          return interaction.reply({
            content: user.id === interaction.user.id 
              ? 'You have no donation record yet!' 
              : `${user} has no donation record yet!`,
            flags: 64
          });
        }

        const recentDonations = donor.donations.slice(-5).reverse();

        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle(`💰 Donation Stats - ${donor.username}`)
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

        await interaction.reply({ embeds: [embed], flags: 64 });
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
        const subcommand = interaction.options.getSubcommand();
        const config = donationManager.getConfig(interaction.guildId!);

        if (subcommand === 'add-receiver') {
          const role = interaction.options.getRole('role', true);
          if (!config.receiverRoleIds.includes(role.id)) {
            config.receiverRoleIds.push(role.id);
            donationManager.updateConfig(interaction.guildId!, config);
          }
          return interaction.reply({
            content: `✅ Added ${role} as a receiver role!`,
            flags: 64
          });
        }

        if (subcommand === 'remove-receiver') {
          const role = interaction.options.getRole('role', true);
          config.receiverRoleIds = config.receiverRoleIds.filter(id => id !== role.id);
          donationManager.updateConfig(interaction.guildId!, config);
          return interaction.reply({
            content: `✅ Removed ${role} from receiver roles!`,
            flags: 64
          });
        }

        if (subcommand === 'add-reward') {
          const role = interaction.options.getRole('role', true);
          const threshold = interaction.options.getNumber('threshold', true);
          donationManager.addRoleReward(interaction.guildId!, role.id, threshold);
          return interaction.reply({
            content: `✅ Added ${role} as a reward for $${threshold.toFixed(2)}!`,
            flags: 64
          });
        }

        if (subcommand === 'remove-reward') {
          const role = interaction.options.getRole('role', true);
          donationManager.removeRoleReward(interaction.guildId!, role.id);
          return interaction.reply({
            content: `✅ Removed ${role} from role rewards!`,
            flags: 64
          });
        }

        if (subcommand === 'set-channel') {
          const channel = interaction.options.getChannel('channel', true);
          donationManager.updateConfig(interaction.guildId!, { notificationChannelId: channel.id });
          return interaction.reply({
            content: `✅ Set notification channel to <#${channel.id}>!`,
            flags: 64
          });
        }

        if (subcommand === 'set-message') {
          const message = interaction.options.getString('message', true);
          donationManager.updateConfig(interaction.guildId!, { thankYouMessage: message });
          return interaction.reply({
            content: `✅ Updated thank you message!`,
            flags: 64
          });
        }

        if (subcommand === 'view') {
          const embed = new EmbedBuilder()
            .setColor(0x3b82f6)
            .setTitle('💰 Donation Configuration')
            .addFields(
              {
                name: 'Status',
                value: config.enabled ? '✅ Enabled' : '❌ Disabled',
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

          return interaction.reply({ embeds: [embed], flags: 64 });
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
