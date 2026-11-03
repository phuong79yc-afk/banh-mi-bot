// Custom Role Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import { customRoleManager } from './CustomRoleManager';
import { customRoleCommand } from './customRoleCommand';

export default class CustomRoleModule {
  name = 'customrole-module';
  description = 'Custom Role System - Let users create their own roles';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private interactionHandler = (interaction: any) => {
    if (!interaction.isButton() || !interaction.customId?.startsWith('crole:')) return;
    void customRoleCommand.onButton(interaction);
  };

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`🎨 Custom Role module initialized`);
    this.registerCommands();
    this.client.on('interactionCreate', this.interactionHandler);
    console.log(`✅ Custom Role module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    this.commands.set('customrole', customRoleCommand);

    // /customrole-admin-enable
    const enableCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-enable')
        .setDescription('Bật tính năng role cá nhân')
        .addIntegerOption(option =>
          option
            .setName('max-roles')
            .setDescription('Số role tối đa mỗi thành viên')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(5)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const maxRoles = interaction.options.getInteger('max-roles') || 1;

        customRoleManager.updateConfig(interaction.guildId!, {
          enabled: true,
          maxRoles
        });

        await interaction.reply({
          content: `${emojis.success} Custom role system enabled! Max roles per user: **${maxRoles}**`,
          flags: 64
        });
      }
    };

    // /customrole-admin-disable
    const disableCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-disable')
        .setDescription('Tắt tính năng tạo role cá nhân')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        customRoleManager.updateConfig(interaction.guildId!, { enabled: false });

        await interaction.reply({
          content: `${emojis.success} Custom role system disabled!`,
          flags: 64
        });
      }
    };

    // /customrole-admin-color-palette
    const colorPaletteCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-color-palette')
        .setDescription('Cài đặt màu role cá nhân')
        .addStringOption(option =>
          option
            .setName('colors')
            .setDescription('Mã màu HEX: cách nhau bằng dấu phẩy; all để mở mọi màu')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const colorsStr = interaction.options.getString('colors');
        
        if (!colorsStr) {
          customRoleManager.updateConfig(interaction.guildId!, { allowedColors: [] });
          return interaction.reply({
            content: `${emojis.success} All colors are now allowed!`,
            flags: 64
          });
        }

        const colors = colorsStr.split(',').map(c => c.trim());
        const hexColor = /^#?[0-9a-f]{6}$/i;
        if (colors.some(color => !hexColor.test(color))) {
          return interaction.reply({
            content: `${emojis.error} Màu không hợp lệ. Dùng hex 6 ký tự, ví dụ \`#ff0000\`.`,
            flags: 64,
          });
        }
        const normalized = colors.map(color => color.startsWith('#') ? color.toLowerCase() : `#${color.toLowerCase()}`);
        customRoleManager.updateConfig(interaction.guildId!, { allowedColors: normalized });

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`${emojis.art} Color Palette Updated`)
          .setDescription(`Allowed colors:\n${normalized.map(c => `• \`${c}\``).join('\n')}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    // /customrole-admin-create
    const adminCreateCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-create')
        .setDescription('Tạo role cá nhân và gán cho một thành viên')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Thành viên sẽ nhận role')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Tên role cần tạo')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('color')
            .setDescription('Mã màu HEX của role, ví dụ #ff0000')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.options.getUser('user', true);
        const name = interaction.options.getString('name', true);
        const color = interaction.options.getString('color', true);

        await interaction.deferReply({ flags: 64 });

        try {
          const role = await interaction.guild!.roles.create({
            name,
                color: color ? parseInt(color.replace('#', ''), 16) : undefined,
            reason: `Custom role created by admin for ${user.tag}`
          });

          const member = await interaction.guild!.members.fetch(user.id);
          await member.roles.add(role);

          customRoleManager.addRole({
            guildId: interaction.guildId!,
            userId: user.id,
            roleId: role.id,
            name,
            color,
            createdAt: Date.now()
          });

          await interaction.editReply({
            content: `${emojis.success} Created custom role **${name}** for ${user}`
          });

        } catch (error) {
          await interaction.editReply({
            content: `${emojis.error} Error: ${error instanceof Error ? error.message : 'Failed to create role'}`
          });
        }
      }
    };

    // /customrole-admin-manage
    const manageCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-manage')
        .setDescription('Quản lý role cá nhân thành viên')
        .addSubcommand(sub =>
          sub
            .setName('list')
            .setDescription('Liệt kê các role cá nhân trong máy chủ')
        )
        .addSubcommand(sub =>
          sub
            .setName('delete')
            .setDescription('Xóa role cá nhân của một thành viên')
            .addUserOption(option =>
              option
                .setName('user')
                .setDescription('Thành viên cần xóa role')
                .setRequired(true)
            )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
          const roles = customRoleManager.getAllGuildRoles(interaction.guildId!);

          if (roles.length === 0) {
            return interaction.reply({
              content: 'No custom roles found in this server.',
              flags: 64
            });
          }

          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`${emojis.art} Custom Roles`)
            .setDescription(
              roles
                .map((r, i) => `${i + 1}. <@${r.userId}> - **${r.name}** (\`${r.color}\`)`)
                .join('\n')
            )
            .setFooter({ text: `Total: ${roles.length} roles` })
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: 64 });

        } else if (subcommand === 'delete') {
          const user = interaction.options.getUser('user', true);
          const roleData = customRoleManager.getUserRole(interaction.guildId!, user.id);

          if (!roleData) {
            return interaction.reply({
              content: `${emojis.error} ${user} doesn't have a custom role.`,
              flags: 64
            });
          }

          await interaction.deferReply({ flags: 64 });

          try {
            const role = await interaction.guild!.roles.fetch(roleData.roleId);
            if (role) await role.delete('Custom role removed by admin');

            customRoleManager.removeRole(interaction.guildId!, user.id);

            await interaction.editReply({
              content: `${emojis.success} Deleted custom role **${roleData.name}** from ${user}`
            });
          } catch (error) {
            await interaction.editReply({
              content: `${emojis.error} Error: ${error instanceof Error ? error.message : 'Failed to delete role'}`
            });
          }
        }
      }
    };

    // /customrole-admin-migrate
    const migrateCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-migrate')
        .setDescription('Chuyển dữ liệu role sang máy chủ khác')
        .addStringOption(option =>
          option
            .setName('target-guild-id')
            .setDescription('ID của máy chủ nhận dữ liệu')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetGuildId = interaction.options.getString('target-guild-id', true);

        await interaction.deferReply({ flags: 64 });

        try {
          const targetGuild = await this.client.guilds.fetch(targetGuildId);
          
          if (!targetGuild) {
            return interaction.editReply({
              content: `${emojis.error} Bot is not in that server!`
            });
          }

          const result = await customRoleManager.migrateRoles(
            interaction.guild!,
            targetGuild
          );

          const embed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle(`${emojis.success} Migration Complete`)
            .addFields(
              { name: `${emojis.success} Success`, value: result.success.toString(), inline: true },
              { name: `${emojis.error} Failed`, value: result.failed.toString(), inline: true }
            )
            .setDescription(`Migrated custom roles from **${interaction.guild!.name}** to **${targetGuild.name}**`)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

        } catch (error) {
          await interaction.editReply({
            content: `${emojis.error} Error: ${error instanceof Error ? error.message : 'Migration failed'}`
          });
        }
      }
    };

    // /customrole-admin-terminate
    const terminateCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole-admin-terminate')
        .setDescription('Xóa role cá nhân và tắt tính năng')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: 64 });

        const roles = customRoleManager.getAllGuildRoles(interaction.guildId!);
        let deleted = 0;

        for (const roleData of roles) {
          try {
            const role = await interaction.guild!.roles.fetch(roleData.roleId);
            if (role) {
              await role.delete('Custom role system terminated');
              deleted++;
            }
            customRoleManager.removeRole(interaction.guildId!, roleData.userId);
          } catch (error) {
            console.error(`Failed to delete role ${roleData.name}:`, error);
          }
        }

        customRoleManager.updateConfig(interaction.guildId!, { enabled: false });

        await interaction.editReply({
          content: `${emojis.success} Terminated custom role system. Deleted **${deleted}** roles.`
        });
      }
    };

    this.commands.set('customrole-admin-enable', enableCommand);
    this.commands.set('customrole-admin-disable', disableCommand);
    this.commands.set('customrole-admin-color-palette', colorPaletteCommand);
    this.commands.set('customrole-admin-create', adminCreateCommand);
    this.commands.set('customrole-admin-manage', manageCommand);
    this.commands.set('customrole-admin-migrate', migrateCommand);
    this.commands.set('customrole-admin-terminate', terminateCommand);
  }

  async cleanup() {
    this.client.removeListener('interactionCreate', this.interactionHandler);
    console.log('🧹 Custom Role module cleanup...');
  }
}
