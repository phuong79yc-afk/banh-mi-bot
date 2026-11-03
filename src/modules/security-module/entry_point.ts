// Security Module - Lock Invites & Performance Monitoring (Components V2)

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { memoryOptimizer } from '../../utils/memoryOptimizer';
import os from 'os';

// ==================== CONSTANTS ====================
const COLOR = {
  red: 0xef4444,
  green: 0x10b981,
  blue: 0x3b82f6,
  orange: 0xf97316,
};

const V2 = MessageFlags.IsComponentsV2;
const V2_EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
const MB = 1024 * 1024;
const GB = MB * 1024;

// ==================== HELPERS ====================
const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

const now = () => Math.floor(Date.now() / 1000);
const mb = (bytes: number) => `${(bytes / MB).toFixed(1)} MB`;
const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)} MB`;

/** Thanh phần trăm: ▰▰▰▱▱▱▱▱▱▱ 30% */
function gauge(used: number, total: number, len = 10): string {
  const ratio = total > 0 ? Math.min(1, used / total) : 0;
  const filled = Math.round(ratio * len);
  return `${'▰'.repeat(filled)}${'▱'.repeat(len - filled)} **${Math.round(ratio * 100)}%**`;
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

/** Khung chuẩn: nhãn nhỏ + tiêu đề lớn + mô tả tuỳ chọn */
function panel(color: number, tag: string, title: string, subtitle?: string) {
  const c = new ContainerBuilder().addTextDisplayComponents(text(`-# ${tag}`), text(`# ${title}`));
  if (subtitle) c.addTextDisplayComponents(text(subtitle));
  return c.addSeparatorComponents(divider(SeparatorSpacingSize.Large));
}

const errorCard = (message: string) =>
  new ContainerBuilder().addTextDisplayComponents(text(`${emojis.error} ${message}`));

const reply = (c: ContainerBuilder) => ({ components: [c], flags: V2_EPH as any });

// Trạng thái khóa invite lưu trong bộ nhớ (chỉ để hiển thị nhanh; /status vẫn đọc quyền thật của kênh)
const inviteLockState = new Map<string, boolean>();

// ==================== MODULE ====================
export default class SecurityModule {
  name = 'security-module';
  description = 'Security & Performance - Lock invites, monitor performance';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    this.registerCommands();
    console.log(`${emojis.shield} Security module initialized with ${this.commands.size} commands`);
  }

  // ==================== COMMANDS ====================
  private registerCommands() {
    // ---------- /lock-invites ----------
    this.commands.set('lock-invites', {
      data: new SlashCommandBuilder()
        .setName('lock-invites')
        .setDescription('Quản lý liên kết mời')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(s =>
          s
            .setName('lock')
            .setDescription('Ngăn thành viên tạo liên kết mời mới')
            .addBooleanOption(o => o.setName('delete_existing').setDescription('Xóa các liên kết mời hiện có')),
        )
        .addSubcommand(s => s.setName('unlock').setDescription('Cho phép tạo liên kết mời trở lại'))
        .addSubcommand(s => s.setName('status').setDescription('Xem trạng thái khóa liên kết mời')),

      execute: async (i: ChatInputCommandInteraction) => {
        try {
          await i.deferReply({ flags: V2_EPH });
        } catch (error: any) {
          if (error.code === 10062) return; // interaction đã hết hạn
          throw error;
        }

        if (!i.guild) return i.editReply(reply(errorCard('Lệnh này chỉ dùng trong máy chủ!')));

        try {
          const sub = i.options.getSubcommand();
          if (sub === 'lock') await this.handleLock(i);
          else if (sub === 'unlock') await this.handleUnlock(i);
          else await this.handleStatus(i);
        } catch (error: any) {
          console.error('[Security] lock-invites error:', error);
          await i.editReply(reply(errorCard(`Có lỗi xảy ra: ${error.message}`))).catch(() => {});
        }
      },
    });

    // ---------- /performance ----------
    this.commands.set('performance', {
      data: new SlashCommandBuilder()
        .setName('performance')
        .setDescription('Xem hiệu năng bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('stats').setDescription('Xem số liệu hiệu năng hiện tại'))
        .addSubcommand(s => s.setName('cleanup').setDescription('Giải phóng bộ nhớ đang sử dụng'))
        .addSubcommand(s => s.setName('report').setDescription('Xem báo cáo chi tiết về hiệu năng')),

      execute: async (i: ChatInputCommandInteraction) => {
        try {
          await i.deferReply({ flags: V2_EPH });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        try {
          const sub = i.options.getSubcommand();
          if (sub === 'stats') await this.showStats(i);
          else if (sub === 'cleanup') await this.performCleanup(i);
          else await this.showReport(i);
        } catch (error: any) {
          console.error('[Security] performance error:', error);
          await i.editReply(reply(errorCard(`Có lỗi xảy ra: ${error.message}`))).catch(() => {});
        }
      },
    });
  }

  // ==================== LOCK INVITES ====================
  /** Các kênh có thể chỉnh quyền (bỏ category) */
  private async editableChannels(i: ChatInputCommandInteraction) {
    const channels = await i.guild!.channels.fetch();
    return [...channels.values()].filter(
      (c): c is NonNullable<typeof c> & { permissionOverwrites: any } =>
        !!c && c.type !== ChannelType.GuildCategory && 'permissionOverwrites' in c,
    );
  }

  private async setInvitePermission(i: ChatInputCommandInteraction, value: false | null) {
    const everyone = i.guild!.roles.everyone;
    const channels = await this.editableChannels(i);

    let done = 0;
    let failed = 0;

    for (const channel of channels) {
      try {
        await channel.permissionOverwrites.edit(everyone, { CreateInstantInvite: value });
        done++;
      } catch (err) {
        failed++;
        console.error(`[Security] Failed to update invites in ${channel.name}:`, err);
      }
    }

    return { done, failed, total: channels.length };
  }

  private async handleLock(i: ChatInputCommandInteraction) {
    const deleteExisting = i.options.getBoolean('delete_existing') ?? false;
    const { done, failed, total } = await this.setInvitePermission(i, false);

    let deleted = 0;
    let deleteFailed = 0;

    if (deleteExisting) {
      try {
        const invites = await i.guild!.invites.fetch();
        for (const invite of invites.values()) {
          try {
            await invite.delete('Invite lock - cleaning existing invites');
            deleted++;
          } catch {
            deleteFailed++;
          }
        }
      } catch (err) {
        console.error('[Security] Failed to fetch invites:', err);
      }
    }

    inviteLockState.set(i.guild!.id, true);

    const stats = [
      `${emojis.lock} **Kênh đã khóa:** ${done}/${total}`,
      deleteExisting ? `${emojis.delete} **Invite đã xóa:** ${deleted}` : `${emojis.link} **Invite hiện có:** giữ nguyên`,
    ];

    if (failed) stats.push(`${emojis.warning} **Kênh lỗi:** ${failed} (thiếu quyền Manage Channels?)`);
    if (deleteFailed) stats.push(`${emojis.warning} **Invite xóa lỗi:** ${deleteFailed}`);

    const c = panel(COLOR.red, `${emojis.shield} SECURITY`, `${emojis.lock} Invites Đã Khóa`, 'Tất cả invite links mới đã bị vô hiệu hóa.')
      .addTextDisplayComponents(text(stats.join('\n')))
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`${emojis.warning} Chỉ administrators mới có thể tạo invite.`))
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# Bởi ${i.user} · <t:${now()}:R>`));

    await i.editReply(reply(c));
  }

  private async handleUnlock(i: ChatInputCommandInteraction) {
    const { done, failed, total } = await this.setInvitePermission(i, null);
    inviteLockState.set(i.guild!.id, false);

    const stats = [`${emojis.success} **Kênh đã mở khóa:** ${done}/${total}`];
    if (failed) stats.push(`${emojis.warning} **Kênh lỗi:** ${failed}`);

    const c = panel(COLOR.green, `${emojis.shield} SECURITY`, `${emojis.unlock} Invites Đã Mở Khóa`, 'Thành viên có thể tạo invite links trở lại.')
      .addTextDisplayComponents(text(stats.join('\n')))
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# Bởi ${i.user} · <t:${now()}:R>`));

    await i.editReply(reply(c));
  }

  private async handleStatus(i: ChatInputCommandInteraction) {
    const everyoneId = i.guild!.roles.everyone.id;
    const channels = await this.editableChannels(i);
    const locked = channels.filter(c => c.permissionOverwrites.cache.get(everyoneId)?.deny.has(PermissionFlagsBits.CreateInstantInvite)).length;

    // Trạng thái thật dựa trên quyền kênh (không mất sau khi bot restart)
    const isLocked = channels.length > 0 && locked === channels.length;
    const partial = locked > 0 && !isLocked;

    inviteLockState.set(i.guild!.id, isLocked);

    let inviteLine = `${emojis.link} **Invite hoạt động:** không đọc được (thiếu quyền Manage Server)`;
    try {
      inviteLine = `${emojis.link} **Invite hoạt động:** ${(await i.guild!.invites.fetch()).size}`;
    } catch {}

    const headline = isLocked
      ? `${emojis.lock} **LOCKED** — invites bị vô hiệu hóa`
      : partial
        ? `${emojis.warning} **PARTIAL** — một số kênh vẫn cho tạo invite`
        : `${emojis.success} **UNLOCKED** — invites hoạt động bình thường`;

    const c = panel(isLocked ? COLOR.red : partial ? COLOR.orange : COLOR.green, `${emojis.shield} SECURITY`, `${emojis.info} Trạng Thái Invite Lock`, headline)
      .addTextDisplayComponents(
        text(`${emojis.chart} **Kênh bị khóa:** ${locked}/${channels.length}\n${gauge(locked, channels.length)}`),
        text(inviteLine),
      )
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# Cập nhật <t:${now()}:R>`));

    await i.editReply(reply(c));
  }

  // ==================== PERFORMANCE ====================
  private buildStats(withButtons: boolean) {
    const mem = process.memoryUsage();
    const sysTotal = os.totalmem();
    const sysUsed = sysTotal - os.freemem();
    const { history } = memoryOptimizer.getStats();

    const heapRatio = mem.heapUsed / mem.heapTotal;

    const c = panel(heapRatio > 0.85 ? COLOR.orange : COLOR.blue, `${emojis.chart} PERFORMANCE`, `${emojis.chart} Bot Performance`, `${emojis.clock} **Uptime:** ${formatUptime(process.uptime())}`)
      .addTextDisplayComponents(
        text(`${emojis.database} **Heap** · ${mb(mem.heapUsed)} / ${mb(mem.heapTotal)}\n${gauge(mem.heapUsed, mem.heapTotal)}`),
        text(`${emojis.server} **System** · ${(sysUsed / GB).toFixed(2)} / ${(sysTotal / GB).toFixed(2)} GB\n${gauge(sysUsed, sysTotal)}`),
      )
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`${emojis.cache} **RSS:** ${mb(mem.rss)}   ${emojis.link} **External:** ${mb(mem.external)}`));

    if (history.length > 0) {
      const last = history[history.length - 1];
      c.addTextDisplayComponents(text(`${emojis.delete} **Cleanup gần nhất:** ${signed(last.freed)}`));
    }

    c.addSeparatorComponents(divider()).addTextDisplayComponents(text(`-# Cập nhật <t:${now()}:R>`));

    if (withButtons) {
      c.addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('perf:refresh').setLabel('Làm mới').setEmoji(emojis.refresh).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('perf:cleanup').setLabel('Dọn dẹp').setEmoji(emojis.delete).setStyle(ButtonStyle.Primary),
        ),
      );
    }

    return c;
  }

  private async showStats(i: ChatInputCommandInteraction) {
    const message = await i.editReply(reply(this.buildStats(true)));

    // Auto-refresh mỗi 5 giây
    const refreshInterval = setInterval(async () => {
      try {
        await i.editReply(reply(this.buildStats(true)));
      } catch (error: any) {
        if (error.code === 10008 || error.code === 10062) {
          clearInterval(refreshInterval);
        }
      }
    }, 5000);

    const collector = message.createMessageComponentCollector({ time: 120_000 });

    collector.on('collect', async b => {
      if (b.user.id !== i.user.id) {
        return b.reply(reply(errorCard('Đây không phải bảng của bạn!')));
      }

      if (b.customId === 'perf:cleanup') memoryOptimizer.cleanup();

      await b.update({ components: [this.buildStats(true)], flags: V2 as any });
    });

    collector.on('end', () => {
      clearInterval(refreshInterval);
      i.editReply({ components: [this.buildStats(false)], flags: V2_EPH as any }).catch(() => {});
    });
  }

  private async performCleanup(i: ChatInputCommandInteraction) {
    const before = process.memoryUsage().heapUsed;
    memoryOptimizer.cleanup();
    const after = process.memoryUsage().heapUsed;
    const freed = (before - after) / MB;

    const c = panel(freed > 0 ? COLOR.green : COLOR.orange, `${emojis.delete} CLEANUP`, `${emojis.sparkles} Memory Cleanup`, freed > 0 ? 'Đã giải phóng bộ nhớ.' : 'Không có gì đáng kể để dọn.')
      .addTextDisplayComponents(
        text(`${emojis.chart} **Trước:** ${mb(before)}\n${emojis.chart} **Sau:** ${mb(after)}\n${emojis.sparkles} **Giải phóng:** ${signed(freed)}`),
      )
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# <t:${now()}:R>`));

    await i.editReply(reply(c));
  }

  private async showReport(i: ChatInputCommandInteraction) {
    const { current: mem, history } = memoryOptimizer.getStats();

    const lines = [
      `Heap Used   ${mb(mem.heapUsed).padStart(10)}`,
      `Heap Total  ${mb(mem.heapTotal).padStart(10)}`,
      `RSS         ${mb(mem.rss).padStart(10)}`,
      `External    ${mb(mem.external).padStart(10)}`,
    ];

    if (history.length > 0) {
      const total = history.reduce((sum, s) => sum + s.freed, 0);
      lines.push(
        '',
        `Cleanup runs   ${String(history.length).padStart(7)}`,
        `Total freed    ${signed(total).padStart(10)}`,
        `Average freed  ${signed(total / history.length).padStart(10)}`,
      );
    }

    const c = panel(COLOR.blue, `${emojis.document} REPORT`, `${emojis.document} Detailed Memory Report`)
      .addTextDisplayComponents(text('```\n' + lines.join('\n') + '\n```'))
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# <t:${now()}:R>`));

    await i.editReply(reply(c));
  }

  // ==================== PUBLIC ====================
  isInviteLocked(guildId: string): boolean {
    return inviteLockState.get(guildId) ?? false;
  }

  async cleanup() {
    inviteLockState.clear();
    console.log(`${emojis.delete} Security module cleanup`);
  }
}
