import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionFlagsBits,
  MessageFlags,
  GuildMember,
} from 'discord.js';
import { customRoleManager as mgr, CustomRoleData } from './CustomRoleManager';

// ==================== COMPONENTS V2 HELPERS ====================
const V2_EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
const COLOR = { main: 0x8068ec, ok: 0x57f287, warn: 0xfee75c, err: 0xed4245 };
const HEX = /^#?([0-9a-f]{6})$/i;

const txt = (s: string) => new TextDisplayBuilder().setContent(s);
const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
const card = (color: number, ...lines: string[]) =>
  new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(txt(lines.join('\n')));

const ok = (...l: string[]) => card(COLOR.ok, ...l);
const warn = (...l: string[]) => card(COLOR.warn, ...l);
const fail = (...l: string[]) => card(COLOR.err, '❌ **Lỗi**', ...l);

const toHex = (c: string) => `#${HEX.exec(c)![1].toLowerCase()}`;
const toInt = (c: string) => parseInt(HEX.exec(c)![1], 16);

// ==================== PANEL ====================
function rolePanel(userId: string, data: CustomRoleData | undefined, enabled: boolean) {
  const c = new ContainerBuilder().setAccentColor(data ? toInt(data.color) : COLOR.main);

  if (!data) {
    c.addTextDisplayComponents(
      txt(
        [
          '# 🎨 Custom Role',
          enabled ? 'Bạn chưa có role riêng.' : '⚠️ Tính năng đang **tắt** ở server này.',
          '-# Dùng `/customrole create` để tạo role của bạn.',
        ].join('\n'),
      ),
    );
    return c;
  }

  c.addTextDisplayComponents(
    txt(
      [
        '# 🎨 Custom Role của bạn',
        `<@&${data.roleId}>`,
        `**Tên:** ${data.name}`,
        `**Màu:** \`${toHex(data.color)}\``,
        `**Tạo lúc:** <t:${Math.floor(data.createdAt / 1000)}:R>`,
      ].join('\n'),
    ),
  )
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`crole:delete:${userId}`)
          .setLabel('Xóa role')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger),
      ) as any,
    );

  return c;
}

// ==================== COMMAND ====================
export const customRoleCommand = {
  data: new SlashCommandBuilder()
    .setName('customrole')
    .setDescription('Quản lý role riêng của bạn')
    .setDMPermission(false)
    .addSubcommand(s => s.setName('panel').setDescription('Xem role của bạn'))
    .addSubcommand(s =>
      s
        .setName('create')
        .setDescription('Tạo role riêng')
        .addStringOption(o => o.setName('name').setDescription('Tên role').setMaxLength(32).setRequired(true))
        .addStringOption(o => o.setName('color').setDescription('Màu hex, vd #ff66aa').setRequired(true)),
    )
    .addSubcommand(s =>
      s
        .setName('edit')
        .setDescription('Đổi tên hoặc màu role')
        .addStringOption(o => o.setName('name').setDescription('Tên mới').setMaxLength(32))
        .addStringOption(o => o.setName('color').setDescription('Màu hex mới')),
    )
    .addSubcommand(s => s.setName('delete').setDescription('Xóa role của bạn'))
    .addSubcommand(s => s.setName('config').setDescription('Xem cấu hình (admin)'))
    .addSubcommand(s =>
      s
        .setName('setup')
        .setDescription('Cấu hình tính năng (admin)')
        .addBooleanOption(o => o.setName('enabled').setDescription('Bật / tắt'))
        .addRoleOption(o => o.setName('required').setDescription('Role cần có để dùng'))
        .addStringOption(o => o.setName('colors').setDescription('Màu cho phép, cách nhau bằng dấu phẩy. Gõ "all" để mở hết')),
    ),

  async execute(i: ChatInputCommandInteraction) {
    const guild = i.guild!;
    const sub = i.options.getSubcommand();
    const reply = (c: ContainerBuilder) => i.reply({ components: [c], flags: V2_EPH });
    const cfg = mgr.getConfig(guild.id);
    const member = i.member as GuildMember;

    // ----- Admin -----
    if (sub === 'config' || sub === 'setup') {
      if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return reply(fail('Bạn cần quyền **Manage Server**.'));
      }

      if (sub === 'setup') {
        const enabled = i.options.getBoolean('enabled');
        const required = i.options.getRole('required');
        const colors = i.options.getString('colors');
        const updates: Parameters<typeof mgr.updateConfig>[1] = {};

        if (enabled !== null) updates.enabled = enabled;
        if (required) updates.requiredRoleId = required.id;
        if (colors) {
          const list = colors.toLowerCase() === 'all' ? [] : colors.split(',').map(s => s.trim());
          if (list.some(c => !HEX.test(c))) return reply(fail('Màu phải là hex 6 ký tự, vd `#ff66aa`.'));
          updates.allowedColors = list.map(toHex);
        }

        mgr.updateConfig(guild.id, updates);
      }

      const now = mgr.getConfig(guild.id);
      const c = new ContainerBuilder()
        .setAccentColor(COLOR.main)
        .addTextDisplayComponents(txt('# ⚙️ Cấu hình Custom Role'))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(
          txt(
            [
              `**Trạng thái:** ${now.enabled ? '🟢 Bật' : '🔴 Tắt'}`,
              `**Role yêu cầu:** ${now.requiredRoleId ? `<@&${now.requiredRoleId}>` : 'Không'}`,
              `**Màu cho phép:** ${now.allowedColors.length ? now.allowedColors.map(c => `\`${c}\``).join(' ') : 'Tất cả'}`,
              `**Đã tạo:** ${mgr.getAllGuildRoles(guild.id).length} role`,
            ].join('\n'),
          ),
        );

      return reply(c);
    }

    // ----- Panel -----
    if (sub === 'panel') return reply(rolePanel(i.user.id, mgr.getUserRole(guild.id, i.user.id), cfg.enabled));

    // ----- Điều kiện chung -----
    if (!cfg.enabled) return reply(warn('⚠️ Tính năng Custom Role đang **tắt** ở server này.'));

    if (cfg.requiredRoleId && !member.roles.cache.has(cfg.requiredRoleId)) {
      return reply(fail(`Bạn cần có role <@&${cfg.requiredRoleId}> để dùng tính năng này.`));
    }

    const existing = mgr.getUserRole(guild.id, i.user.id);
    const liveRole = existing ? await guild.roles.fetch(existing.roleId).catch(() => null) : null;
    if (existing && !liveRole) mgr.removeRole(guild.id, i.user.id); // role đã bị xóa thủ công

    const have = liveRole ? existing : undefined;

    // ----- Delete -----
    if (sub === 'delete') {
      if (!have || !liveRole) return reply(warn('Bạn chưa có custom role.'));

      await liveRole.delete(`Custom role removed by ${i.user.tag}`).catch(() => {});
      mgr.removeRole(guild.id, i.user.id);

      return reply(ok('🗑️ **Đã xóa custom role của bạn.**'));
    }

    // ----- Create / Edit -----
    const name = i.options.getString('name');
    const colorIn = i.options.getString('color');

    if (colorIn) {
      if (!HEX.test(colorIn)) return reply(fail('Màu phải là hex 6 ký tự, vd `#ff66aa`.'));
      if (!mgr.isColorAllowed(guild.id, colorIn)) {
        return reply(fail(`Màu này không được phép. Màu hợp lệ: ${cfg.allowedColors.map(c => `\`${c}\``).join(' ')}`));
      }
    }

    await i.deferReply({ flags: V2_EPH });
    const send = (c: ContainerBuilder) => i.editReply({ components: [c] });

    try {
      if (sub === 'create') {
        if (have) return send(warn('Bạn đã có custom role. Dùng `/customrole edit` để chỉnh sửa.'));

        const color = toHex(colorIn!);
        const role = await guild.roles.create({
          name: name!,
          color: toInt(color),
          reason: `Custom role for ${i.user.tag}`,
        });

        await member.roles.add(role);

        const data: CustomRoleData = {
          guildId: guild.id,
          userId: i.user.id,
          roleId: role.id,
          name: role.name,
          color,
          createdAt: Date.now(),
        };

        mgr.addRole(data);
        return send(rolePanel(i.user.id, data, true));
      }

      // edit
      if (!have || !liveRole) return send(warn('Bạn chưa có custom role. Dùng `/customrole create`.'));
      if (!name && !colorIn) return send(warn('Hãy nhập ít nhất tên hoặc màu mới.'));

      const color = colorIn ? toHex(colorIn) : have.color;
      await liveRole.edit({ name: name ?? have.name, color: toInt(color) });

      const data = { ...have, name: name ?? have.name, color };
      mgr.addRole(data);

      return send(rolePanel(i.user.id, data, true));
    } catch (e) {
      console.error('[CustomRole]', e);
      return send(fail('Bot không đủ quyền hoặc role của bot đang thấp hơn. Kiểm tra quyền **Manage Roles**.'));
    }
  },

  /** Gắn vào interactionCreate cho các nút `crole:*` */
  async onButton(i: ButtonInteraction) {
    const [, action, uid] = i.customId.split(':');

    if (i.user.id !== uid) {
      return i.reply({ components: [fail('Đây không phải nút của bạn!')], flags: V2_EPH });
    }

    if (action === 'delete' && i.guild) {
      const data = mgr.getUserRole(i.guild.id, uid);
      if (!data) return i.update({ components: [rolePanel(uid, undefined, true)] });

      const role = await i.guild.roles.fetch(data.roleId).catch(() => null);
      await role?.delete(`Custom role removed by ${i.user.tag}`).catch(() => {});
      mgr.removeRole(i.guild.id, uid);

      return i.update({ components: [ok('🗑️ **Đã xóa custom role của bạn.**')] });
    }
  },
};
