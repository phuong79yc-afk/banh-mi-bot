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
  ChannelType,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { getModuleLoader } from '../../index';
import { setGuildFeature } from '../../utils/serverFeatures';
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
      .setDescription('Quản lý bot và máy chủ')
      .addSubcommand((sub) => sub.setName('status').setDescription('Xem trạng thái bot'))
      .addSubcommand((sub) => sub.setName('health').setDescription('Kiểm tra sức khỏe bot'))
      .addSubcommand((sub) => sub.setName('modules').setDescription('Xem module đang chạy'))
      .addSubcommand((sub) => sub
        .setName('module')
        .setDescription('Quản lý module')
        .addStringOption((opt) => opt.setName('action').setDescription('Chọn thao tác cần thực hiện').setRequired(true).addChoices(
          { name: 'Tải lại', value: 'reload' },
          { name: 'Tắt', value: 'unload' },
          { name: 'Mở lại', value: 'load' },
        ))
        .addStringOption((opt) => opt.setName('name').setDescription('Tên module cần thao tác').setRequired(true)))
      .addSubcommand((sub) => sub.setName('commands').setDescription('Xem các lệnh đã đăng ký'))
      .addSubcommand((sub) => sub
        .setName('welcome')
        .setDescription('Cài đặt lời chào thành viên mới')
        .addBooleanOption((opt) => opt.setName('enabled').setDescription('Bật hoặc tắt lời chào thành viên mới').setRequired(false))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Chọn kênh văn bản để gửi lời chào').setRequired(false))
        .addBooleanOption((opt) => opt.setName('auto-create').setDescription('Tạo kênh mới nếu chưa chọn kênh').setRequired(false))
        .addStringOption((opt) => opt.setName('channel-name').setDescription('Tên kênh sẽ tạo nếu chưa tồn tại').setRequired(false))
        .addStringOption((opt) => opt.setName('message').setDescription('Nội dung chào; hỗ trợ {user}, {server}, {memberCount}').setRequired(false))
        .addRoleOption((opt) => opt.setName('autorole').setDescription('Role muốn gán cho thành viên mới').setRequired(false)))
      .addSubcommand((sub) => sub
        .setName('goodbye')
        .setDescription('Cài đặt lời nhắn khi thành viên rời đi')
        .addBooleanOption((opt) => opt.setName('enabled').setDescription('Bật hoặc tắt lời nhắn khi thành viên rời đi').setRequired(false))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Chọn kênh văn bản để gửi lời nhắn').setRequired(false))
        .addBooleanOption((opt) => opt.setName('auto-create').setDescription('Tạo kênh mới nếu chưa chọn kênh').setRequired(false))
        .addStringOption((opt) => opt.setName('channel-name').setDescription('Tên kênh sẽ tạo nếu chưa tồn tại').setRequired(false))
        .addStringOption((opt) => opt.setName('message').setDescription('Lời nhắn rời đi; hỗ trợ {user}, {server}, {memberCount}').setRequired(false)))
      .addSubcommand((sub) => sub
        .setName('setting')
        .setDescription('Lưu cài đặt máy chủ')
        .addStringOption((opt) => opt.setName('key').setDescription('Tên khóa cài đặt cần lưu').setRequired(true))
        .addStringOption((opt) => opt.setName('value').setDescription('Giá trị mới của cài đặt').setRequired(true)))
      .addSubcommand((sub) => sub.setName('audit').setDescription('Xem nhật ký quản trị'))
      .addSubcommand((sub) => sub.setName('backup').setDescription('Sao lưu dữ liệu ngay'))
      .addSubcommand((sub) => sub.setName('backups').setDescription('Xem bản sao lưu'))
      .addSubcommand((sub) => sub
        .setName('schedule')
        .setDescription('Lên lịch tác vụ tự động')
        .addStringOption((opt) => opt.setName('action').setDescription('Chọn loại tác vụ định kỳ').setRequired(true).addChoices(
          { name: 'Bật backup định kỳ', value: 'backup' },
          { name: 'Bật health check', value: 'health-check' },
        ))
        .addIntegerOption((opt) => opt.setName('minutes').setDescription('Khoảng lặp tính bằng phút (1–10080)').setRequired(true).setMinValue(1).setMaxValue(10080)));

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

    if (subcommand === 'welcome' || subcommand === 'goodbye') {
      const isWelcome = subcommand === 'welcome';
      const enabled = interaction.options.getBoolean('enabled');
      const selectedChannel = interaction.options.getChannel('channel');
      const autoCreate = interaction.options.getBoolean('auto-create') ?? true;
      const customName = interaction.options.getString('channel-name')?.trim();
      const message = interaction.options.getString('message')?.trim();
      const autorole = isWelcome ? interaction.options.getRole('autorole') : null;

      let channelId = selectedChannel && selectedChannel.type === ChannelType.GuildText
        ? selectedChannel.id
        : undefined;

      if (!channelId && autoCreate) {
        const requestedName = customName?.replace(/[^a-zA-Z0-9-_. ]/g, '').trim().slice(0, 80)
          || (isWelcome ? 'welcome' : 'goodbye');
        const existing = interaction.guild.channels.cache.find((channel) =>
          channel.isTextBased()
          && !channel.isDMBased()
          && channel.type === ChannelType.GuildText
          && channel.name.toLowerCase().replace(/[^a-z0-9]/g, '') === requestedName.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (existing) {
          channelId = existing.id;
        } else {
          if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({
              components: [card('Không đủ quyền', 'Bot cần quyền **Manage Channels** để tự tạo kênh.')],
              flags: V2_EPHEMERAL,
            });
            return;
          }
          const created = await interaction.guild.channels.create({
            name: requestedName,
            type: ChannelType.GuildText,
            reason: `${isWelcome ? 'Welcome' : 'Goodbye'} channel configured by ${interaction.user.tag}`,
          });
          channelId = created.id;
        }
      }

      if (!channelId) {
        await interaction.reply({
          components: [card('Thiếu kênh', `Bật \`auto-create\` hoặc chọn một kênh cho hệ thống **${subcommand}**.`)],
          flags: V2_EPHEMERAL,
        });
        return;
      }

      const fileName = isWelcome ? 'welcome-config.json' : 'goodbye-config.json';
      const filePath = path.join(process.cwd(), 'data', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      let data: Record<string, any> = {};
      try {
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        data = {};
      }

      const old = data[interaction.guildId!] ?? {};
      const newConfig = {
        ...old,
        ...(isWelcome ? { guildId: interaction.guildId! } : {}),
        channelId,
        enabled: enabled ?? old.enabled ?? true,
        embedEnabled: old.embedEnabled ?? true,
        message: message ?? old.message ?? (isWelcome ? 'Welcome {user}!' : '{user} has left the server. Goodbye!'),
        ...(autorole ? { autoRole: autorole.id } : {}),
      };
      data[interaction.guildId!] = newConfig;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      setGuildFeature(interaction.guildId!, isWelcome ? 'welcome_system' : 'goodbye_system', newConfig.enabled);

      addAuditEntry({
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        action: isWelcome ? 'welcome.config.updated' : 'goodbye.config.updated',
        details: { channelId, enabled: newConfig.enabled, autoCreated: autoCreate, autoroleId: autorole?.id },
        source: 'discord',
      });

      await interaction.reply({
        components: [card(
          `${isWelcome ? 'Welcome' : 'Goodbye'} đã cấu hình`,
          [
            `**Kênh:** <#${channelId}>`,
            `**Trạng thái:** ${newConfig.enabled ? '🟢 Đang bật' : '🔴 Đã tắt'}`,
            autorole ? `**Auto role:** <@&${autorole.id}>` : null,
            message ? `**Tin nhắn:** ${message}` : null,
          ].filter(Boolean).join('\n'),
        )],
        flags: V2_EPHEMERAL,
      });
      return;
    }

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

export default ManagementModule;
