import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  GuildMember,
} from 'discord.js';
import { getModuleLoader } from '../../index';
import {
  addAuditEntry,
  createBackup,
  getServerHealth,
  listBackups,
  loadManagementState,
  setGuildSetting,
  setScheduledTask,
} from '../../utils/managementService';

const V2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

function card(title: string, content: string) {
  return new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${title}`),
      new TextDisplayBuilder().setContent(content),
    );
}

function canManage(member: GuildMember | null) {
  if (!member) return false;
  return member.permissions.has([
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.ManageMessages,
  ]);
}

export class ManagementModule {
  private client: Client;
  public commands = new Collection<string, any>();

  constructor(client: Client) {
    this.client = client;
    this.registerCommands();
  }

  private registerCommands() {
    const data = new SlashCommandBuilder()
      .setName('manage')
      .setDescription('Quản lý bot, module, guild và dữ liệu vận hành')
      .addSubcommand((sub) => sub.setName('status').setDescription('Xem trạng thái bot và server'))
      .addSubcommand((sub) => sub.setName('health').setDescription('Xem sức khỏe, RAM và uptime'))
      .addSubcommand((sub) => sub.setName('modules').setDescription('Danh sách module đang hoạt động'))
      .addSubcommand((sub) => sub
        .setName('module')
        .setDescription('Tải, tải lại hoặc tắt module')
        .addStringOption((opt) => opt.setName('action').setDescription('Hành động').setRequired(true).addChoices(
          { name: 'Tải lại', value: 'reload' },
          { name: 'Tắt', value: 'unload' },
          { name: 'Mở lại', value: 'load' },
        ))
        .addStringOption((opt) => opt.setName('name').setDescription('Tên module').setRequired(true)))
      .addSubcommand((sub) => sub.setName('commands').setDescription('Kiểm tra và liệt kê slash command'))
      .addSubcommand((sub) => sub
        .setName('setting')
        .setDescription('Cài đặt cấu hình riêng cho guild')
        .addStringOption((opt) => opt.setName('key').setDescription('Tên cấu hình').setRequired(true))
        .addStringOption((opt) => opt.setName('value').setDescription('Giá trị cấu hình').setRequired(true)))
      .addSubcommand((sub) => sub.setName('audit').setDescription('Xem nhật ký quản trị gần nhất'))
      .addSubcommand((sub) => sub.setName('backup').setDescription('Tạo backup dữ liệu bot'))
      .addSubcommand((sub) => sub.setName('backups').setDescription('Liệt kê các backup'))
      .addSubcommand((sub) => sub
        .setName('schedule')
        .setDescription('Tạo tác vụ định kỳ')
        .addStringOption((opt) => opt.setName('action').setDescription('Hành động').setRequired(true).addChoices(
          { name: 'Bật backup định kỳ', value: 'backup' },
          { name: 'Bật health check', value: 'health-check' },
        ))
        .addIntegerOption((opt) => opt.setName('minutes').setDescription('Chu kỳ phút, tối thiểu 1').setRequired(true).setMinValue(1).setMaxValue(10080)));

    this.commands.set('manage', {
      data,
      execute: (interaction: ChatInputCommandInteraction) => this.execute(interaction),
    });
  }

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', flags: MessageFlags.Ephemeral });
      return;
    }
    const member = interaction.member instanceof GuildMember ? interaction.member : await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!canManage(member)) {
      await interaction.reply({ content: '❌ Bạn cần quyền quản lý server hoặc quyền quản trị/moderator.', flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (!subcommand) return;

    if (subcommand === 'status' || subcommand === 'health') {
      const health = getServerHealth(this.client);
      await interaction.reply({
        components: [card('Sức khỏe bot', [
          `**Trạng thái:** ${health.online ? '🟢 Online' : '🔴 Offline'}`,
          `**Ping:** ${health.ping}ms`,
          `**Uptime:** ${Math.floor(health.uptimeSeconds / 3600)} giờ`,
          `**Server:** ${health.guilds}`,
          `**User:** ${health.users}`,
          `**RAM:** ${health.memoryMb} MB`,
        ].join('\n'))],
        flags: V2_EPHEMERAL,
      });
      return;
    }

    if (subcommand === 'modules') {
      const loader = getModuleLoader();
      const modules = loader?.getLoadedModules();
      const names = modules ? Array.from(modules.keys()).sort() : [];
      await interaction.reply({
        components: [card('Module đang hoạt động', names.length ? names.map((name) => `• \`${name}\``).join('\n') : 'Chưa có module nào được tải.')],
        flags: V2_EPHEMERAL,
      });
      return;
    }

    if (subcommand === 'module') {
      const loader = getModuleLoader();
      const action = interaction.options.getString('action', true);
      const name = interaction.options.getString('name', true);
      let result = false;
      if (action === 'reload') result = !!await loader?.reloadModule(name);
      if (action === 'unload') result = !!await loader?.unloadModule(name);
      if (action === 'load') result = !!await loader?.loadModule(name);
      addAuditEntry({
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        action: `module.${action}`,
        details: { module: name, success: result },
        source: 'discord',
      });
      await interaction.reply({
        components: [card('Quản lý module', result ? `✅ Đã ${action} module \`${name}\`.` : `❌ Không thể ${action} module \`${name}\`.`)],
        flags: V2_EPHEMERAL,
      });
      return;
    }

    if (subcommand === 'commands') {
      const commands = Array.from(this.client.commands.keys()).sort();
      await interaction.reply({
        components: [card('Slash command', `Tổng: **${commands.length}** lệnh\n\n${commands.slice(0, 80).map((name) => `\`/${name}\``).join(', ')}`)],
        flags: V2_EPHEMERAL,
      });
      return;
    }

    if (subcommand === 'setting') {
      const key = interaction.options.getString('key', true).slice(0, 64);
      const value = interaction.options.getString('value', true).slice(0, 500);
      setGuildSetting(interaction.guildId!, key, value);
      addAuditEntry({
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        action: 'guild.setting.updated',
        details: { key, value },
        source: 'discord',
      });
      await interaction.reply({
        components: [card('Cấu hình guild', `✅ Đã lưu \`${key}\`.`)],
        flags: V2_EPHEMERAL,
      });
      return;
    }

    if (subcommand === 'audit') {
      const entries = loadManagementState().audit.filter((entry) => !entry.guildId || entry.guildId === interaction.guildId).slice(0, 10);
      const content = entries.length
        ? entries.map((entry) => `• <t:${Math.floor(Date.parse(entry.createdAt) / 1000)}:R> \`${entry.action}\``).join('\n')
        : 'Chưa có nhật ký.';
      await interaction.reply({ components: [card('Nhật ký quản trị', content)], flags: V2_EPHEMERAL });
      return;
    }

    if (subcommand === 'backup') {
      const folder = createBackup(`guild-${interaction.guildId}`);
      addAuditEntry({
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        action: 'backup.created',
        details: { backup: folder },
        source: 'discord',
      });
      await interaction.reply({
        components: [card('Backup dữ liệu', `✅ Đã tạo backup:\n\`${folder.replace(/\\/g, '/')}\``)],
        flags: V2_EPHEMERAL,
      });
      return;
    }

    if (subcommand === 'backups') {
      const backups = listBackups().slice(0, 10);
      const content = backups.length ? backups.map((backup) => `• \`${backup.name}\``).join('\n') : 'Chưa có backup.';
      await interaction.reply({ components: [card('Danh sách backup', content)], flags: V2_EPHEMERAL });
      return;
    }

    if (subcommand === 'schedule') {
      const action = interaction.options.getString('action', true);
      const minutes = interaction.options.getInteger('minutes', true);
      const taskId = `${interaction.guildId}-${action}`;
      setScheduledTask(taskId, minutes, action, true, async () => {
        if (action === 'backup') createBackup(taskId);
      });
      addAuditEntry({
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        action: 'schedule.updated',
        details: { taskId, action, minutes },
        source: 'discord',
      });
      await interaction.reply({
        components: [card('Tác vụ định kỳ', `✅ Đã bật \`${action}\` mỗi **${minutes} phút**.`)],
        flags: V2_EPHEMERAL,
      });
    }
  }
}
