import {
  Client,
  Message,
  User,
  GuildMember,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  // ===== Components V2 =====
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from 'discord.js';
import { emojis } from '../config/emojis';
import { PREFIX_HELP_GROUPS } from '../config/prefixCommands';
import { getModuleLoader } from '../index';

const PREFIX = '!';

// ==================== COLORS ====================
const COLOR_TEAL = 0x1abc9c;
const COLOR_RED = 0xed4245;
const COLOR_GREEN = 0x57f287;
const COLOR_YELLOW = 0xfee75c;
const COLOR_ORANGE = 0xe67e22;
const COLOR_GREY = 0x99aab5;

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);
const unixNow = () => Math.floor(Date.now() / 1000);
const ts = (ms: number, style: 'R' | 'f' = 'R') => `<t:${Math.floor(ms / 1000)}:${style}>`;

/** Payload trả lời: không ping ai, không ping người được reply */
const view = (...components: (ContainerBuilder | TextDisplayBuilder)[]) => ({
  components,
  flags: V2 as any,
  allowedMentions: { parse: [] as never[], repliedUser: false },
});

const notice = (color: number, content: string) =>
  new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(text(content));

const fail = (message: Message, content: string) => message.reply(view(notice(COLOR_RED, `${emojis.error} ${content}`)));

interface CardOptions {
  color?: number; // bỏ trống = không có viền màu
  badge?: string; // nhãn nhỏ ở đầu
  title: string;
  subtitle?: string;
  thumb?: string;
  banner?: string | null;
  /** Mỗi phần tử là một khối text, ngăn cách bằng separator */
  sections?: string[];
  buttons?: ButtonBuilder[];
  footer?: string;
}

function card(o: CardOptions): ContainerBuilder {
  const c = new ContainerBuilder();
  if (o.color !== undefined) c.setAccentColor(o.color);
  if (o.banner) {
    c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(o.banner)));
  }
  if (o.badge) c.addTextDisplayComponents(text(`-# ${o.badge}`));
  const head = [text(`# ${o.title}`)];
  if (o.subtitle) head.push(text(o.subtitle));
  if (o.thumb) {
    c.addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(...head).setThumbnailAccessory(new ThumbnailBuilder().setURL(o.thumb))
    );
  } else {
    c.addTextDisplayComponents(...head);
  }
  (o.sections ?? []).forEach((s, i) => {
    c.addSeparatorComponents(divider(i === 0 ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(text(s));
  });
  if (o.buttons?.length) {
    c.addSeparatorComponents(divider(SeparatorSpacingSize.Large)).addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(...o.buttons)
    );
  }
  if (o.footer) c.addTextDisplayComponents(text(`-# ${o.footer}`));
  return c;
}

const linkButton = (label: string, url: string) =>
  new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(label).setURL(url);

const quote = (s: string) =>
  s
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} ngày`);
  if (h) parts.push(`${h} giờ`);
  if (m) parts.push(`${m} phút`);
  if (sec && !d && !h) parts.push(`${sec} giây`);
  return parts.join(' ') || '0 giây';
}

function latencyIcon(ms: number): string {
  return ms < 150 ? '🟢' : ms < 400 ? '🟡' : '🔴';
}

// ==================== MODERATION HELPERS ====================
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

/** Lấy user từ mention hoặc ID (17-20 chữ số) */
async function resolveUser(client: Client, message: Message, arg?: string): Promise<{ user?: User; error?: string }> {
  const mentioned = message.mentions.users.first();
  if (mentioned) return { user: mentioned };
  if (arg && /^\d{17,20}$/.test(arg)) {
    try {
      return { user: await client.users.fetch(arg) };
    } catch {
      return { error: 'Không tìm thấy user với ID này!' };
    }
  }
  return { error: 'Vui lòng mention user hoặc nhập User ID!' };
}

/** "10s" | "5m" | "1h" | "2d" -> ms (hoặc null nếu sai định dạng) */
function parseDuration(arg?: string): number | null {
  const match = arg?.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2].toLowerCase() as 's' | 'm' | 'h' | 'd'];
  return value * unit;
}

/**
 * Người dùng lệnh có đủ thẩm quyền xử lý đối tượng không?
 * Trả về chuỗi lỗi hoặc null nếu hợp lệ.
 */
function hierarchyProblem(message: Message, target: User, targetMember?: GuildMember | null): string | null {
  if (target.id === message.author.id) return 'Bạn không thể tự xử lý chính mình!';
  if (target.id === message.client.user?.id) return 'Bạn không thể xử lý bot!';
  if (target.id === message.guild?.ownerId) return 'Không thể xử lý chủ server!';
  if (targetMember && message.member) {
    const isOwner = message.guild?.ownerId === message.author.id;
    if (!isOwner && message.member.roles.highest.position <= targetMember.roles.highest.position) {
      return 'Role của người này cao hơn hoặc bằng role của bạn!';
    }
  }
  return null;
}

/** Thẻ kết quả moderation */
function modCard(opts: {
  action: string;
  color: number;
  title: string;
  target?: User;
  lines: string[];
  reason?: string;
}) {
  const sections = [opts.lines.join('\n')];
  if (opts.reason !== undefined) sections.push(`### ${emojis.document ?? '📝'} Lý do\n${quote(opts.reason)}`);
  return card({
    color: opts.color,
    badge: `🛡️ QUẢN LÝ • ${opts.action}`,
    title: opts.title,
    thumb: opts.target?.displayAvatarURL({ size: 256 }),
    sections,
    footer: `🥟 Bánh Cuốn Bot • <t:${unixNow()}:f>`,
  });
}

/** Gửi DM bằng Container, trả về true nếu gửi được */
async function tryDM(user: User, container: ContainerBuilder): Promise<boolean> {
  try {
    await user.send({ components: [container], flags: V2 });
    return true;
  } catch {
    console.log(`Cannot DM user ${user.tag} - DMs might be disabled`);
    return false;
  }
}

const dmLine = (ok: boolean) => `📨 **DM:** ${ok ? 'đã gửi cho người dùng' : 'không gửi được (đã tắt DM)'}`;

// ==================== MOCK INTERACTION (cho !bc ...) ====================
/**
 * Tạo "interaction giả" để chạy slash command từ prefix.
 * - Lần reply/editReply đầu tiên gửi tin nhắn, các lần editReply sau sẽ SỬA tin nhắn đó
 *   (bản cũ mỗi lần editReply lại gửi thêm một tin nhắn mới).
 * - Tự bỏ cờ Ephemeral vì tin nhắn thường không hỗ trợ.
 */
function createMockInteraction(message: Message, client: Client) {
  let sent: Message | null = null;
  const clean = (data: any) => {
    if (typeof data === 'string' || !data) return data;
    const { flags, ...rest } = data;
    if (typeof flags !== 'number') return data;
    const cleaned = flags & ~MessageFlags.Ephemeral;
    return cleaned ? { ...rest, flags: cleaned } : rest;
  };
  const mock: any = {
    id: message.id,
    user: message.author,
    guild: message.guild,
    guildId: message.guildId,
    member: message.member,
    memberPermissions: message.member?.permissions ?? null,
    channel: message.channel,
    channelId: message.channelId,
    client,
    deferred: false,
    replied: false,
    options: {
      getUser: () => message.mentions.users.first() ?? null,
      getMember: () => message.mentions.members?.first() ?? null,
      getString: () => null,
      getInteger: () => null,
      getBoolean: () => null,
      getChannel: () => null,
    },
    deferReply: async () => {
      mock.deferred = true;
    },
    reply: async (data: any) => {
      mock.replied = true;
      sent = await message.reply(clean(data));
      return sent;
    },
    editReply: async (data: any) => {
      mock.replied = true;
      sent = sent ? await sent.edit(clean(data)) : await message.reply(clean(data));
      return sent;
    },
    followUp: async (data: any) => message.reply(clean(data)),
    fetchReply: async () => sent,
  };
  return mock;
}



// ==================== COMMAND REGISTRY ====================
interface Ctx {
  client: Client;
  message: Message;
  args: string[];
}

type Handler = (ctx: Ctx) => Promise<unknown>;

const handlers = new Map<string, Handler>();
const register = (names: string[], fn: Handler) => names.forEach((n) => handlers.set(n, fn));

// ---------- !ping ----------
register(['ping'], async ({ client, message }) => {
  const start = Date.now();
  const msg = await message.reply(view(notice(COLOR_TEAL, '🏓 Đang đo độ trễ...')));
  const latency = Date.now() - start;
  const api = Math.round(client.ws.ping);
  await msg.edit(
    view(
      card({
        color: COLOR_TEAL,
        title: '🏓 Pong!',
        sections: [
          `${latencyIcon(latency)} **Bot Latency:** \`${latency}ms\`\n${latencyIcon(api)} **API Latency:** \`${api}ms\``,
        ],
        footer: '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !avatar ----------
register(['avatar', 'av'], async ({ message }) => {
  const user = message.mentions.users.first() || message.author;
  const member = message.guild?.members.cache.get(user.id);
  const animated = !!user.avatar?.startsWith('a_');
  const url = (extension: 'png' | 'jpg' | 'webp' | 'gif') => user.displayAvatarURL({ size: 4096, extension });
  const buttons = [linkButton('PNG', url('png')), linkButton('JPG', url('jpg')), linkButton('WEBP', url('webp'))];
  if (animated) buttons.push(linkButton('GIF', url('gif')));
  const serverAvatar = member?.avatarURL({ size: 4096 });
  const container = new ContainerBuilder().setAccentColor(COLOR_TEAL);
  container
    .addTextDisplayComponents(text(`# 🖼️ Avatar của ${user.username}`))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(user.displayAvatarURL({ size: 1024 })))
    );
  if (serverAvatar) {
    container.addTextDisplayComponents(text('-# Avatar riêng trong server:'));
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(member!.displayAvatarURL({ size: 1024 })))
    );
    buttons.push(linkButton('Avatar server', serverAvatar));
  }
  container
    .addSeparatorComponents(divider())
    .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(0, 5)));
  await message.reply(view(container));
});

// ---------- !userinfo ----------
register(['userinfo', 'ui'], async ({ message }) => {
  const user = message.mentions.users.first() || message.author;
  const member = await message.guild?.members.fetch(user.id).catch(() => null);
  if (!member) return fail(message, 'Không tìm thấy user trong server này!');
  const roles = member.roles.cache
    .filter((role) => role.id !== message.guild?.id)
    .sort((a, b) => b.position - a.position);
  const topRoles = roles.map((r) => r.toString()).slice(0, 10);
  const extra = roles.size > 10 ? ` +${roles.size - 10} role khác` : '';
  await message.reply(
    view(
      card({
        color: member.displayColor || COLOR_TEAL,
        badge: '👤 THÔNG TIN USER',
        title: user.username,
        subtitle: `${member.displayName}${user.bot ? ' · 🤖 Bot' : ''}\n-# ID: \`${user.id}\``,
        thumb: user.displayAvatarURL({ size: 256 }),
        sections: [
          [
            `📅 **Tham gia Discord:** ${ts(user.createdTimestamp)}`,
            `🚀 **Tham gia server:** ${member.joinedAt ? ts(member.joinedTimestamp!) : 'Không xác định'}`,
            member.premiumSince ? `💎 **Boost từ:** ${ts(member.premiumSinceTimestamp!)}` : null,
            roles.size ? `🏅 **Role cao nhất:** ${member.roles.highest}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          `### 🎭 Roles (${roles.size})\n${topRoles.length ? topRoles.join(' ') + extra : 'Không có role'}`,
        ],
        footer: '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !serverinfo ----------
register(['serverinfo', 'si'], async ({ message }) => {
  const guild = message.guild;
  if (!guild) return;
  const owner = await guild.fetchOwner();
  const channels = guild.channels.cache;
  const textCount = channels.filter(
    (c) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement
  ).size;
  const voiceCount = channels.filter(
    (c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
  ).size;
  const verification = ['Không', 'Thấp', 'Trung bình', 'Cao', 'Rất cao'][guild.verificationLevel] ?? 'Không rõ';
  await message.reply(
    view(
      card({
        color: COLOR_TEAL,
        badge: '🏠 THÔNG TIN SERVER',
        title: guild.name,
        subtitle: `${guild.description ?? ''}\n-# ID: \`${guild.id}\``.trim(),
        thumb: guild.iconURL({ size: 256 }) ?? undefined,
        banner: guild.bannerURL({ size: 1024 }),
        sections: [
          [
            `👑 **Chủ server:** ${owner.user.tag}`,
            `📅 **Ngày tạo:** ${ts(guild.createdTimestamp)}`,
            `🛡️ **Mức xác minh:** ${verification}`,
          ].join('\n'),
          [
            `👥 **Thành viên:** ${guild.memberCount.toLocaleString()}`,
            `💬 **Kênh:** ${textCount} text · ${voiceCount} voice`,
            `🎭 **Roles:** ${guild.roles.cache.size}  ·  😀 **Emojis:** ${guild.emojis.cache.size}`,
            `💎 **Boost:** Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`,
          ].join('\n'),
        ],
        footer: '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !uptime ----------
register(['uptime'], async ({ message }) => {
  const ms = process.uptime() * 1000;
  await message.reply(
    view(
      card({
        color: COLOR_GREEN,
        title: '⏱️ Thời gian hoạt động',
        sections: [`## ${formatDuration(ms)}\n-# Bot đã online từ ${ts(Date.now() - ms)}`],
        footer: '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !invite ----------
register(['invite'], async ({ client, message }) => {
  const invite = `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`;
  await message.reply(
    view(
      card({
        color: COLOR_TEAL,
        title: '📨 Mời Bot',
        subtitle: `Cảm ơn bạn đã quan tâm đến **${client.user?.username}**! 🥟`,
        sections: [
          [
            '### Quyền cần thiết',
            '• Administrator (hoặc các quyền sau)',
            '• Manage Server',
            '• Manage Channels & Roles',
            '• Send Messages & Embeds',
            '• Moderate Members',
            '',
            '-# Bot cần quyền Administrator để hoạt động tốt nhất',
          ].join('\n'),
        ],
        buttons: [linkButton('🎉 Mời bot vào server', invite)],
        footer: '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !embed (demo các kiểu hiển thị) ----------
register(['embed'], async ({ message, args }) => {
  const type = args[0]?.toLowerCase() || 'help';
  const demo = (title: string, description: string, color?: number) => {
    const e = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .addFields(
        { name: 'Field 1', value: 'Giá trị 1', inline: true },
        { name: 'Field 2', value: 'Giá trị 2', inline: true }
      )
      .setFooter({ text: 'Footer text' })
      .setTimestamp();
    if (color !== undefined) e.setColor(color);
    return e;
  };
  const music = (color?: number) => {
    const e = new EmbedBuilder()
      .setTitle('Alone - Marshmello')
      .setDescription('04:34\n\nRequested by flytri')
      .setThumbnail('https://i.scdn.co/image/ab67616d0000b273a1c77682c126bd92dbb8d912')
      .setTimestamp();
    if (color !== undefined) e.setColor(color);
    return e;
  };
  switch (type) {
    case '1':
      return message.reply({ embeds: [demo(`${emojis.art} Embed Type 1: Có viền màu`, 'Embed bình thường với viền xanh ngọc', 0x1abc9c)] });
    case '2':
      return message.reply({ embeds: [demo('⚪ Embed Type 2: Không màu', 'Embed không set color (viền xám nhạt mặc định)')] });
    case '3':
      return message.reply({ embeds: [demo('🌑 Embed Type 3: Màu tối', 'Viền màu gần nền Discord', 0x2b2d31)] });
    case '4':
      return message.reply(
        `**📝 Type 4: Message thường (không embed)**\n\nĐây là message thường không có viền\n**Field 1:** Giá trị 1\n**Field 2:** Giá trị 2\n\n_Footer text_`
      );
    case '5':
      return message.reply({ embeds: [demo('⚫ Embed Type 5: Màu đen', 'Viền màu đen (#000000)', 0x000000)] });
    case '6':
      return message.reply({ embeds: [music(0x2f3136)] });
    case '7':
      return message.reply({ embeds: [music()] });
    case '8':
      return message.reply(
        view(
          card({
            color: COLOR_TEAL,
            title: '✨ Type 8: Components V2 (có viền màu)',
            sections: ['**Field 1:** Giá trị 1\n**Field 2:** Giá trị 2'],
            footer: 'Footer text',
          })
        )
      );
    case '9':
      // Container không setAccentColor -> không có thanh viền màu bên trái
      return message.reply(
        view(
          card({
            title: '🫥 Type 9: Components V2 (không viền)',
            sections: ['**Field 1:** Giá trị 1\n**Field 2:** Giá trị 2'],
            footer: 'Footer text',
          })
        )
      );
    default:
      return message.reply(
        view(
          card({
            color: COLOR_TEAL,
            title: `${emojis.art} Test các kiểu hiển thị`,
            sections: [
              [
                `\`!embed 1\` – Embed xanh ngọc (0x1ABC9C)`,
                `\`!embed 2\` – Embed không màu (xám nhạt mặc định)`,
                `\`!embed 3\` – Embed màu tối gần nền Discord (0x2B2D31)`,
                `\`!embed 4\` – Message thường (không viền)`,
                `\`!embed 5\` – Embed màu đen (0x000000)`,
                `\`!embed 6\` – Embed màu nền Discord (0x2F3136) ✨`,
                `\`!embed 7\` – Embed không set color ✨`,
                `\`!embed 8\` – Components V2 có viền màu`,
                `\`!embed 9\` – Components V2 **không viền** ✨`,
              ].join('\n'),
            ],
          })
        )
      );
  }
});

// ---------- !mute ----------
register(['mute'], async ({ client, message, args }) => {
  if (!message.guild || !message.member) return;
  if (!message.member.permissions.has('ModerateMembers')) return fail(message, 'Bạn không có quyền mute members!');
  const usage = 'Cách dùng: `!mute @user <time> [reason]` hoặc `!mute <user ID> <time> [reason]`';
  const { user, error } = await resolveUser(client, message, args[0]);
  if (!user) return fail(message, `${error}\n${usage}`);
  const targetMember = await message.guild.members.fetch(user.id).catch(() => null);
  if (!targetMember) return fail(message, 'Không tìm thấy user trong server!');
  const problem = hierarchyProblem(message, user, targetMember);
  if (problem) return fail(message, problem);
  if (!targetMember.moderatable) return fail(message, 'Không thể mute user này!');
  // Thời gian: mặc định 10 phút. Nếu args[1] không phải định dạng thời gian thì coi là một phần của lý do.
  const parsed = parseDuration(args[1]);
  const duration = parsed ?? 10 * 60 * 1000;
  if (duration > MAX_TIMEOUT_MS) return fail(message, 'Thời gian mute tối đa là **28 ngày**!');
  const reason = args.slice(parsed !== null ? 2 : 1).join(' ') || 'Không có lý do';
  try {
    await targetMember.timeout(duration, `${reason} | Bởi ${message.author.tag}`);
    const dmOk = await tryDM(
      user,
      card({
        color: COLOR_ORANGE,
        title: `${emojis.mute} Bạn đã bị mute`,
        subtitle: `Bạn đã bị mute trong **${message.guild.name}**`,
        sections: [
          `⏱️ **Thời gian:** ${formatDuration(duration)}\n👮 **Moderator:** ${message.author.tag}`,
          `### 📝 Lý do\n${quote(reason)}`,
        ],
      })
    );
    await message.reply(
      view(
        modCard({
          action: 'MUTE',
          color: COLOR_YELLOW,
          title: `${emojis.mute} User đã bị mute`,
          target: user,
          lines: [
            `${emojis.user} **User:** ${user} (${user.tag})`,
            `⏱️ **Thời gian:** ${formatDuration(duration)}`,
            `⏳ **Hết hạn:** <t:${unixNow() + Math.floor(duration / 1000)}:R>`,
            `👮 **Moderator:** ${message.author}`,
            dmLine(dmOk),
          ],
          reason,
        })
      )
    );
  } catch (error) {
    console.error('Error muting user:', error);
    await fail(message, 'Không thể mute user này!');
  }
});

// ---------- !unmute ----------
register(['unmute'], async ({ client, message, args }) => {
  if (!message.guild || !message.member) return;
  if (!message.member.permissions.has('ModerateMembers')) return fail(message, 'Bạn không có quyền unmute members!');
  const usage = 'Cách dùng: `!unmute @user [reason]` hoặc `!unmute <user ID> [reason]`';
  const { user, error } = await resolveUser(client, message, args[0]);
  if (!user) return fail(message, `${error}\n${usage}`);
  const targetMember = await message.guild.members.fetch(user.id).catch(() => null);
  if (!targetMember) return fail(message, 'Không tìm thấy user trong server!');
  if (!targetMember.isCommunicationDisabled()) return fail(message, 'User này không bị mute!');
  const reason = args.slice(1).join(' ') || 'Không có lý do';
  try {
    await targetMember.timeout(null, `${reason} | Bởi ${message.author.tag}`);
    const dmOk = await tryDM(
      user,
      card({
        color: COLOR_GREEN,
        title: `${emojis.unmute} Bạn đã được unmute`,
        subtitle: `Bạn đã được unmute trong **${message.guild.name}**`,
        sections: [`👮 **Moderator:** ${message.author.tag}`, `### 📝 Lý do\n${quote(reason)}`],
      })
    );
    await message.reply(
      view(
        modCard({
          action: 'UNMUTE',
          color: COLOR_GREEN,
          title: `${emojis.unmute} User đã được unmute`,
          target: user,
          lines: [`${emojis.user} **User:** ${user} (${user.tag})`, `👮 **Moderator:** ${message.author}`, dmLine(dmOk)],
          reason,
        })
      )
    );
  } catch (error) {
    console.error('Error unmuting user:', error);
    await fail(message, 'Không thể unmute user này!');
  }
});

// ---------- !ban ----------
register(['ban'], async ({ client, message, args }) => {
  if (!message.guild || !message.member) return;
  if (!message.member.permissions.has('BanMembers')) return fail(message, 'Bạn không có quyền ban members!');
  const usage = 'Cách dùng: `!ban @user [reason]` hoặc `!ban <user ID> [reason]`';
  const { user, error } = await resolveUser(client, message, args[0]);
  if (!user) return fail(message, `${error}\n${usage}`);
  const targetMember = await message.guild.members.fetch(user.id).catch(() => null);
  const problem = hierarchyProblem(message, user, targetMember);
  if (problem) return fail(message, problem);
  if (targetMember && !targetMember.bannable) return fail(message, 'Không thể ban user này!');
  const reason = args.slice(1).join(' ') || 'Không có lý do';
  try {
    // DM trước khi ban (sau khi ban sẽ không còn chung server)
    const dmOk = await tryDM(
      user,
      card({
        color: COLOR_RED,
        title: '🔨 Bạn đã bị ban',
        subtitle: `Bạn đã bị ban khỏi **${message.guild.name}**`,
        sections: [
          `👮 **Moderator:** ${message.author.tag}`,
          `### 📝 Lý do\n${quote(reason)}`,
          '-# Nếu bạn nghĩ đây là nhầm lẫn, vui lòng liên hệ ban quản trị.',
        ],
      })
    );
    await message.guild.members.ban(user.id, {
      reason: `${reason} | Bởi ${message.author.tag}`,
      deleteMessageSeconds: 24 * 60 * 60,
    });
    await message.reply(
      view(
        modCard({
          action: 'BAN',
          color: COLOR_RED,
          title: '🔨 User đã bị ban',
          target: user,
          lines: [
            `${emojis.user} **User:** ${user} (${user.tag})`,
            `🗑️ **Xóa tin nhắn:** 1 ngày gần nhất`,
            `👮 **Moderator:** ${message.author}`,
            dmLine(dmOk),
          ],
          reason,
        })
      )
    );
  } catch (error) {
    console.error('Error banning user:', error);
    await fail(message, 'Không thể ban user này!');
  }
});

// ---------- !unban ----------
register(['unban'], async ({ client, message, args }) => {
  if (!message.guild || !message.member) return;
  if (!message.member.permissions.has('BanMembers')) return fail(message, 'Bạn không có quyền unban members!');
  const userId = args[0];
  if (!userId) return fail(message, 'Vui lòng nhập User ID cần unban!\nCách dùng: `!unban <user ID> [lý do]`');
  if (!/^\d{17,20}$/.test(userId)) return fail(message, 'User ID không hợp lệ! (phải là 17-20 chữ số)');
  const reason = args.slice(1).join(' ') || 'Không có lý do';
  try {
    // Kiểm tra trực tiếp theo ID thay vì tải toàn bộ danh sách ban
    const ban = await message.guild.bans.fetch(userId).catch(() => null);
    if (!ban) return fail(message, 'User này không bị ban trong server!');
    await message.guild.members.unban(userId, `${reason} | Bởi ${message.author.tag}`);
    const dmOk = await tryDM(
      ban.user,
      card({
        color: COLOR_GREEN,
        title: `${emojis.success} Bạn đã được unban`,
        subtitle: `Bạn đã được unban khỏi **${message.guild.name}**`,
        sections: [
          `👮 **Moderator:** ${message.author.tag}`,
          `### 📝 Lý do\n${quote(reason)}`,
          '-# Bạn có thể tham gia lại server nếu muốn.',
        ],
      })
    );
    await message.reply(
      view(
        modCard({
          action: 'UNBAN',
          color: COLOR_GREEN,
          title: `${emojis.success} User đã được unban`,
          target: ban.user,
          lines: [`${emojis.user} **User:** ${ban.user.tag} (\`${userId}\`)`, `👮 **Moderator:** ${message.author}`, dmLine(dmOk)],
          reason,
        })
      )
    );
  } catch (error) {
    console.error('Error unbanning user:', error);
    await fail(message, 'Không thể unban user này!');
  }
});

// ---------- !lock / !unlock ----------
function registerLock(name: 'lock' | 'unlock') {
  const locking = name === 'lock';
  register([name], async ({ message, args }) => {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has('ManageChannels')) return fail(message, 'Bạn không có quyền quản lý channels!');
    const channel = message.channel;
    if (!channel.isTextBased() || channel.isDMBased() || channel.isThread()) {
      return fail(message, `Không thể ${name} channel này!`);
    }
    const reason = args.join(' ') || 'Không có lý do';
    try {
      await (channel as any).permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: locking ? false : null,
      });
      await message.reply(
        view(
          modCard({
            action: locking ? 'LOCK' : 'UNLOCK',
            color: locking ? COLOR_RED : COLOR_GREEN,
            title: locking ? '🔒 Channel đã bị lock' : '🔓 Channel đã được unlock',
            lines: [`📍 **Channel:** ${channel}`, `👮 **Moderator:** ${message.author}`],
            reason,
          })
        )
      );
    } catch (error) {
      console.error(`Error ${name}ing channel:`, error);
      await fail(message, `Không thể ${name} channel này!`);
    }
  });
}
registerLock('lock');
registerLock('unlock');

// ---------- !afk (đã gỡ module) ----------
register(['afk'], async ({ message }) => fail(message, 'AFK module đã bị gỡ bỏ!'));

// ---------- !help ----------
register(['help'], async ({ message }) => {
  const P = PREFIX;
  await message.reply(
    view(
      card({
        color: COLOR_TEAL,
        badge: '📖 TRỢ GIÚP',
        title: 'Lệnh Prefix',
        subtitle: `Prefix: \`${P}\` · Dùng \`/help\` để xem tất cả lệnh slash`,
        sections: PREFIX_HELP_GROUPS.map((group) =>
          [
            `### ${group.emoji} ${group.title} (\`${group.prefix}\`)`,
            ...group.commands.map((command) => `${command.emoji} \`${command.usage}\` — ${command.description}`),
          ].join('\n'),
        ),
        footer: '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !profile ----------
const SHOP_ROLE_NAMES = [
  'Bánh Cuốn Lover',
  'VIP Member',
  'Supporter',
  'Gamer',
  'Music Lover',
  'Night Owl',
  'Early Bird',
  'Artist',
  'Foodie',
];

register(['profile'], async ({ client, message }) => {
  const user = message.mentions.users.first() || message.author;
  const member = await message.guild?.members.fetch(user.id).catch(() => null);
  if (!member) return fail(message, 'Không tìm thấy user trong server này!');
  const premiumRole = member.roles.cache.find((role) => SHOP_ROLE_NAMES.includes(role.name));
  const isPremium = !!premiumRole;
  const fetched = await user.fetch();
  const banner = fetched.bannerURL({ size: 1024, extension: 'png' });
  const avatarURL = user.displayAvatarURL({ size: 4096, extension: 'png' });
  const roles = member.roles.cache
    .filter((role) => role.id !== message.guild?.id)
    .sort((a, b) => b.position - a.position);
  const topRoles = roles.map((r) => r.toString()).slice(0, 5);
  const color = isPremium ? premiumRole!.color || fetched.accentColor || 0xff69b4 : COLOR_GREY;
  const sections: string[] = [
    [
      `${emojis.user} **Username:** \`${user.tag}\``,
      `${emojis.id} **ID:** \`${user.id}\``,
      `${emojis.calendar} **Tạo tài khoản:** ${ts(user.createdTimestamp)}`,
      `${emojis.rocket} **Vào server:** ${member.joinedAt ? ts(member.joinedTimestamp!) : 'Không rõ'}`,
    ].join('\n'),
    `### ${emojis.gift} Roles (${roles.size})\n${topRoles.length ? topRoles.join(' ') : 'Chưa có role'}`,
  ];
  if (isPremium) {
    const hex = `#${(premiumRole!.color || 0xff69b4).toString(16).padStart(6, '0').toUpperCase()}`;
    const days = Math.floor((Date.now() - (member.joinedTimestamp ?? Date.now())) / 86_400_000);
    sections.push(
      [
        `### ${emojis.crown} Premium`,
        `${emojis.sparkles} **${premiumRole!.name}** · ${emojis.art} \`${hex}\``,
        `${emojis.clock} Đã đồng hành **${days}** ngày`,
      ].join('\n'),
      [
        `### ${emojis.gift} Đặc quyền đang hoạt động`,
        `${emojis.success} Màu profile riêng biệt`,
        `${emojis.success} Huy hiệu Premium độc quyền`,
        `${emojis.success} Giao diện profile nâng cao`,
        `${emojis.success} Hỗ trợ ưu tiên từ admin`,
      ].join('\n')
    );
  } else if (user.id === message.author.id) {
    sections.push(
      [
        `### ${emojis.gift} Nâng cấp Premium!`,
        'Mua role từ `/shop` để mở khóa:',
        '💎 **Huy hiệu Premium** – hiển thị độc quyền trên profile',
        '🎨 **Màu profile riêng** – theo role bạn chọn',
        '✨ **Giao diện nâng cao** – profile card đẹp hơn',
        '📊 **Thống kê hoạt động** – theo dõi chi tiết',
        '⭐ **Hỗ trợ ưu tiên** – được admin hỗ trợ đầu tiên',
      ].join('\n')
    );
  }
  const buttons = [linkButton('💾 Tải avatar', avatarURL)];
  if (banner) buttons.push(linkButton('🖼️ Tải banner', banner));
  await message.reply(
    view(
      card({
        color,
        badge: isPremium ? '💎 PREMIUM PROFILE' : '🪪 PROFILE CARD',
        banner,
        title: isPremium ? `${user.username} 💎` : user.username,
        subtitle: member.displayName !== user.username ? `-# ${member.displayName}` : undefined,
        thumb: user.displayAvatarURL({ size: 256 }),
        sections,
        buttons,
        footer: isPremium
          ? '💎 Premium Member · Cảm ơn bạn đã ủng hộ bot! 🥟'
          : user.id === message.author.id
            ? '💎 Dùng /shop để mở khóa tính năng Premium! 🥟'
            : '🥟 Bánh Cuốn Bot',
      })
    )
  );
});

// ---------- !ai <message> ----------
register(['ai'], async ({ client, message, args }) => {
  console.log(`[PREFIX !ai] Called by ${message.author.tag} with args:`, args);
  
  if (!args.length) {
    return fail(message, 'Vui lòng nhập câu hỏi!\n**Cách dùng:** `!ai <câu hỏi>`\n**Ví dụ:** `!ai Giải thích lỗ đen là gì?`');
  }

  const question = args.join(' ');
  
  console.log(`[!ai] User: ${message.author.tag}, Question: ${question}`);
  
  // Get AI module
  const moduleLoader = getModuleLoader();
  if (!moduleLoader) return fail(message, 'Module loader chưa sẵn sàng!');
  
  const aiModuleInfo = moduleLoader.getModuleInfo('ai-module');
  if (!aiModuleInfo || !aiModuleInfo.instance) {
    return fail(message, 'AI module chưa được load!');
  }
  
  const aiCommand = aiModuleInfo.instance.commands.get('ai');
  if (!aiCommand) {
    return fail(message, 'AI command không tồn tại!');
  }
  
  console.log('[!ai] Executing AI command...');
  
  // Create mock interaction with proper options
  const mockInteraction = createMockInteraction(message, client);
  
  // Override options methods to return proper values
  mockInteraction.options.getString = (name: string, required?: boolean) => {
    if (name === 'message') return question;
    if (name === 'model') return 'groq:openai/gpt-oss-20b'; // Default model
    if (name === 'style') return 'default'; // Default style
    return null;
  };
  
  mockInteraction.options.getBoolean = (name: string, required?: boolean) => {
    // clear_memory = false by default
    return false;
  };
  
  try {
    await aiCommand.execute(mockInteraction);
    console.log('[!ai] Command executed successfully');
  } catch (error) {
    console.error('[!ai] Error:', error);
    throw error;
  }
});



// ==================== SETUP ====================
export function setupPrefixCommands(client: Client) {
  client.on('messageCreate', async (message: Message) => {
    // Bỏ qua bot và tin nhắn không có prefix
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const handler = handlers.get(commandName);
    if (!handler) return;

    try {
      await handler({ client, message, args });
    } catch (error) {
      console.error(`❌ Error executing prefix command ${commandName}:`, error);
      await message.reply(view(notice(COLOR_RED, `${emojis.error} Có lỗi xảy ra khi thực hiện lệnh này!`))).catch(() => {});
    }
  });

  console.log(`✅ Prefix command handler initialized with prefix: ${PREFIX}`);
}
