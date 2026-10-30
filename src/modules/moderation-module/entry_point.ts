// Moderation Module - Entry Point

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  PermissionResolvable,
  GuildMember,
  TextChannel,
  ChannelType,
  ComponentType,
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
  MessageFlags,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import * as fs from 'fs';
import * as path from 'path';

// ==================== COLORS ====================
const COLOR_KICK = 0xe67e22;
const COLOR_RED = 0xed4245;
const COLOR_YELLOW = 0xfee75c;
const COLOR_GREEN = 0x57f287;
const COLOR_GREY = 0x4e5058; // Thẻ đã hoàn tác / hết hạn

const UNDO_WINDOW_MS = 5 * 60 * 1000; // Nút hoàn tác có hiệu lực 5 phút

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const V2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
const NO_PING = { parse: [] as never[] };

const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

const unixNow = () => Math.floor(Date.now() / 1000);

const view = (container: ContainerBuilder) =>
  ({ components: [container], flags: V2, allowedMentions: NO_PING }) as const;

const viewEphemeral = (container: ContainerBuilder) =>
  ({ components: [container], flags: V2_EPHEMERAL, allowedMentions: NO_PING }) as const;

const notice = (color: number, content: string) =>
  new ContainerBuilder().addTextDisplayComponents(text(content));

const errorReply = (content: string) => viewEphemeral(notice(COLOR_RED, `${emojis.error} ${content}`));

/** Biến mỗi dòng của lý do thành quote block */
const quote = (s: string) =>
  s
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');

interface UndoButton {
  customId: string;
  label: string;
  emoji: string;
}

interface ActionCardOptions {
  color: number;
  /** Nhãn nhỏ ở đầu thẻ, ví dụ "KICK" */
  action: string;
  title: string;
  subtitle: string;
  thumbUrl?: string;
  lines: string[];
  reason?: string;
  /** Ghi chú trạng thái (ví dụ đã hoàn tác) */
  note?: string;
  /** Nút hoàn tác (chỉ hiện khi chưa hoàn tác / chưa hết hạn) */
  undo?: UndoButton;
  /** Thời điểm tạo thẻ (giữ nguyên khi dựng lại) */
  at: number;
}

/** Thẻ kết quả cho một hành động moderation */
function actionCard(opts: ActionCardOptions) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(text(`-# 🛡️ MODERATION • ${opts.action}`));

  if (opts.thumbUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(text(`# ${opts.title}`), text(opts.subtitle))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(opts.thumbUrl))
    );
  } else {
    container.addTextDisplayComponents(text(`# ${opts.title}`), text(opts.subtitle));
  }

  container
    .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(text(opts.lines.join('\n')));

  if (opts.reason !== undefined) {
    container
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`### ${emojis.document} Lý do\n${quote(opts.reason)}`));
  }

  if (opts.note) {
    container.addSeparatorComponents(divider()).addTextDisplayComponents(text(opts.note));
  }

  if (opts.undo && !opts.note) {
    container
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(opts.undo.customId)
            .setLabel(opts.undo.label)
            .setEmoji(opts.undo.emoji)
            .setStyle(ButtonStyle.Secondary)
        )
      );
  }

  container.addTextDisplayComponents(text(`-# Banhcuon-bot • <t:${opts.at}:f>`));

  return container;
}

/** Các dòng thông tin về đối tượng bị xử lý */
function targetLines(target: GuildMember): string[] {
  const created = Math.floor(target.user.createdTimestamp / 1000);
  const joined = target.joinedTimestamp ? Math.floor(target.joinedTimestamp / 1000) : null;

  return [
    `${emojis.user} **Đối tượng:** ${target}`,
    `-# ID \`${target.id}\` · Tạo tài khoản <t:${created}:R>${joined ? ` · Vào server <t:${joined}:R>` : ''}`,
  ];
}

/** 90 phút -> "1 giờ 30 phút" */
function formatDuration(minutes: number): string {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} ngày`);
  if (h) parts.push(`${h} giờ`);
  if (m) parts.push(`${m} phút`);
  return parts.join(' ') || '0 phút';
}

/**
 * Gắn nút hoàn tác vào thẻ đã gửi.
 * - Chỉ người có quyền `permission` mới bấm được.
 * - Sau khi hoàn tác: thẻ chuyển xám + ghi chú. Hết thời gian: nút bị gỡ.
 */
async function attachUndo(
  interaction: ChatInputCommandInteraction,
  build: (note?: string) => ContainerBuilder,
  opts: {
    customId: string;
    permission: PermissionResolvable;
    perform: () => Promise<void>;
    doneLabel: string; // ví dụ "Đã gỡ ban"
  }
) {
  const message = await interaction.fetchReply();
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: UNDO_WINDOW_MS,
  });

  collector.on('collect', async (i) => {
    if (i.customId !== opts.customId) return;

    if (!i.memberPermissions?.has(opts.permission)) {
      await i.reply(errorReply('Bạn không có quyền thực hiện thao tác này!'));
      return;
    }

    try {
      await opts.perform();
      await i.update(view(build(`↩️ **${opts.doneLabel}** bởi ${i.user} · <t:${unixNow()}:R>`)));
      collector.stop('undone');
    } catch (error) {
      await i.reply(errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể hoàn tác'}`));
    }
  });

  collector.on('end', (_collected, reason) => {
    if (reason === 'undone') return;
    // Hết thời gian: dựng lại thẻ nhưng không còn nút (dùng note rỗng -> giữ màu gốc)
    interaction.editReply(view(build(undefined))).catch(() => {});
  });
}

// ==================== PERMISSION CHECKS ====================
/**
 * Kiểm tra người dùng lệnh có đủ thẩm quyền xử lý `target` không.
 * Trả về chuỗi lỗi, hoặc null nếu hợp lệ.
 */
function checkTarget(interaction: ChatInputCommandInteraction, target: GuildMember | null): string | null {
  if (!target) return 'Không tìm thấy người dùng!';
  if (target.id === interaction.user.id) return 'Bạn không thể tự xử lý chính mình!';
  if (target.id === interaction.client.user?.id) return 'Bạn không thể xử lý bot!';
  if (target.id === interaction.guild?.ownerId) return 'Không thể xử lý chủ server!';

  const invoker = interaction.member as GuildMember;
  const isOwner = interaction.guild?.ownerId === interaction.user.id;

  if (!isOwner && invoker?.roles?.highest && invoker.roles.highest.position <= target.roles.highest.position) {
    return 'Role của người này cao hơn hoặc bằng role của bạn!';
  }

  return null;
}

// ==================== MODULE ====================
export default class ModerationModule {
  name = 'moderation-module';
  description = 'Moderation Commands';
  version = '3.0.0';
  enabled = true;

  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🛡️ Moderation module initialized');
    this.registerCommands();
    console.log(`✅ Moderation module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // ==================== /moderation-kick ====================
    const kickCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-kick')
        .setDescription('Mời một thành viên rời khỏi máy chủ')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((o) => o.setName('user').setDescription('Thành viên cần mời khỏi máy chủ').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Lý do thực hiện thao tác (không bắt buộc)').setRequired(false)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getMember('user') as GuildMember | null;
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        const problem = checkTarget(interaction, target);
        if (problem) return interaction.reply(errorReply(problem));

        if (!target!.kickable) return interaction.reply(errorReply('Không thể kick người dùng này!'));

        // Lấy thông tin trước khi kick
        const info = targetLines(target!);
        const avatar = target!.user.displayAvatarURL({ size: 256 });
        const tag = target!.user.tag;
        const at = unixNow();

        try {
          await target!.kick(`${reason} | Bởi ${interaction.user.tag}`);

          // Kick không thể hoàn tác nên không có nút
          await interaction.reply(
            view(
              actionCard({
                color: COLOR_KICK,
                action: 'KICK',
                title: `${emojis.remove} Đã Kick`,
                subtitle: `**${tag}** đã bị mời ra khỏi server`,
                thumbUrl: avatar,
                lines: [...info, `${emojis.shield} **Thực hiện bởi:** ${interaction.user}`],
                reason,
                at,
              })
            )
          );
        } catch (error) {
          await interaction.reply(errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể kick'}`));
        }
      },
    };

    // ==================== /moderation-ban ====================
    const banCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-ban')
        .setDescription('Cấm một thành viên khỏi máy chủ')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption((o) => o.setName('user').setDescription('Thành viên cần cấm khỏi máy chủ').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Lý do thực hiện thao tác (không bắt buộc)').setRequired(false))
        .addIntegerOption((o) =>
          o
            .setName('delete-days')
            .setDescription('Số ngày tin nhắn cần xóa (0–7 ngày)')
            .setMinValue(0)
            .setMaxValue(7)
            .setRequired(false)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getMember('user') as GuildMember | null;
        const reason = interaction.options.getString('reason') || 'Không có lý do';
        const deleteDays = interaction.options.getInteger('delete-days') || 0;

        const problem = checkTarget(interaction, target);
        if (problem) return interaction.reply(errorReply(problem));

        if (!target!.bannable) return interaction.reply(errorReply('Không thể ban người dùng này!'));

        const info = targetLines(target!);
        const avatar = target!.user.displayAvatarURL({ size: 256 });
        const tag = target!.user.tag;
        const targetId = target!.id;
        const at = unixNow();
        const undoId = `mod_unban:${interaction.id}`;

        let ended = false;

        const build = (note?: string) =>
          actionCard({
            color: COLOR_RED,
            action: 'BAN',
            title: `${emojis.warning} Đã Ban`,
            subtitle: `**${tag}** đã bị ban khỏi server`,
            thumbUrl: avatar,
            lines: [
              ...info,
              `${emojis.shield} **Thực hiện bởi:** ${interaction.user}`,
              `🗑️ **Xóa tin nhắn:** ${deleteDays > 0 ? `${deleteDays} ngày gần nhất` : 'Không'}`,
            ],
            reason,
            note,
            undo: !note && !ended ? { customId: undoId, label: 'Gỡ ban', emoji: '🔓' } : undefined,
            at,
          });

        try {
          await target!.ban({
            reason: `${reason} | Bởi ${interaction.user.tag}`,
            deleteMessageSeconds: deleteDays * 24 * 60 * 60,
          });

          await interaction.reply(view(build()));

          await attachUndo(
            interaction,
            (note) => {
              // Khi collector kết thúc do hết giờ, build() được gọi lại không kèm note
              if (!note) ended = true;
              return build(note);
            },
            {
              customId: undoId,
              permission: PermissionFlagsBits.BanMembers,
              perform: async () => {
                await interaction.guild!.members.unban(targetId, `Gỡ ban qua nút | Bởi ${interaction.user.tag}`);
              },
              doneLabel: 'Đã gỡ ban',
            }
          );
        } catch (error) {
          await interaction.reply(errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể ban'}`));
        }
      },
    };

    // ==================== /moderation-timeout ====================
    const timeoutCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-timeout')
        .setDescription('Tạm thời hạn chế một thành viên gửi tin nhắn')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption((o) => o.setName('user').setDescription('Thành viên cần hạn chế gửi tin nhắn').setRequired(true))
        .addIntegerOption((o) =>
          o.setName('duration').setDescription('Thời lượng tính bằng phút (1–40320)').setMinValue(1).setMaxValue(40320).setRequired(true)
        )
        .addStringOption((o) => o.setName('reason').setDescription('Lý do thực hiện thao tác (không bắt buộc)').setRequired(false)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getMember('user') as GuildMember | null;
        const duration = interaction.options.getInteger('duration', true);
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        const problem = checkTarget(interaction, target);
        if (problem) return interaction.reply(errorReply(problem));

        if (!target!.moderatable) return interaction.reply(errorReply('Không thể timeout người dùng này!'));

        const info = targetLines(target!);
        const avatar = target!.user.displayAvatarURL({ size: 256 });
        const tag = target!.user.tag;
        const at = unixNow();
        const endsAt = at + duration * 60;
        const undoId = `mod_untimeout:${interaction.id}`;

        let ended = false;

        const build = (note?: string) =>
          actionCard({
            color: COLOR_YELLOW,
            action: 'TIMEOUT',
            title: `${emojis.clock} Đã Timeout`,
            subtitle: `**${tag}** đã bị timeout`,
            thumbUrl: avatar,
            lines: [
              ...info,
              `${emojis.shield} **Thực hiện bởi:** ${interaction.user}`,
              `${emojis.clock} **Thời gian:** ${formatDuration(duration)}`,
              `⏳ **Hết hạn:** <t:${endsAt}:R>`,
            ],
            reason,
            note,
            undo: !note && !ended ? { customId: undoId, label: 'Gỡ timeout', emoji: '🔊' } : undefined,
            at,
          });

        try {
          await target!.timeout(duration * 60 * 1000, `${reason} | Bởi ${interaction.user.tag}`);

          await interaction.reply(view(build()));

          await attachUndo(
            interaction,
            (note) => {
              if (!note) ended = true;
              return build(note);
            },
            {
              customId: undoId,
              permission: PermissionFlagsBits.ModerateMembers,
              perform: async () => {
                await target!.timeout(null, `Gỡ timeout qua nút | Bởi ${interaction.user.tag}`);
              },
              doneLabel: 'Đã gỡ timeout',
            }
          );
        } catch (error) {
          await interaction.reply(
            errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể timeout'}`)
          );
        }
      },
    };

    // ==================== /moderation-clear ====================
    const clearCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-clear')
        .setDescription('Xóa nhiều tin nhắn gần đây trong một kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption((o) =>
          o.setName('amount').setDescription('Số tin nhắn cần xóa (1–100)').setMinValue(1).setMaxValue(100).setRequired(true)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const amount = interaction.options.getInteger('amount', true);

        try {
          const channel = interaction.channel as TextChannel;
          if (!channel) {
            return interaction.reply(errorReply('Không thể xóa tin nhắn trong kênh này!'));
          }

          const deleted = await channel.bulkDelete(amount, true);

          const ratio = amount > 0 ? Math.round((deleted.size / amount) * 10) : 0;

          const container = new ContainerBuilder();

          container
            .addTextDisplayComponents(text('-# 🛡️ MODERATION • CLEAR'), text(`# 🧹 Đã dọn dẹp`))
            .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
            .addTextDisplayComponents(
              text(
                [
                  `📍 **Kênh:** ${channel}`,
                  `🗑️ **Đã xóa:** \`${deleted.size}/${amount}\` tin nhắn`,
                  `\`${'▰'.repeat(ratio)}${'▱'.repeat(10 - ratio)}\``,
                ].join('\n')
              )
            );

          if (deleted.size < amount) {
            container
              .addSeparatorComponents(divider())
              .addTextDisplayComponents(
                text(`-# Một số tin nhắn không xóa được (cũ hơn 14 ngày hoặc đã bị xóa trước đó).`)
              );
          }

          return interaction.reply(viewEphemeral(container));
        } catch (error) {
          if (!interaction.replied && !interaction.deferred) {
            return interaction.reply(
              errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể xóa tin nhắn'}`)
            );
          }
          console.error('[moderation-clear] Error:', error);
        }
      },
    };

    // ==================== /moderation-lock ====================
    const lockCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-lock')
        .setDescription('Ngăn thành viên gửi tin nhắn trong một kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Kênh cần khóa (mặc định là kênh hiện tại)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addStringOption((o) => o.setName('reason').setDescription('Lý do thực hiện thao tác (không bắt buộc)').setRequired(false)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        const at = unixNow();
        const undoId = `mod_unlock:${interaction.id}`;

        let ended = false;

        const build = (note?: string) =>
          actionCard({
            color: COLOR_RED,
            action: 'LOCK',
            title: `${emojis.lock} Kênh Đã Khóa`,
            subtitle: `${targetChannel} đã bị **khóa**\n-# Thành viên thường không thể gửi tin nhắn`,
            lines: [`${emojis.shield} **Thực hiện bởi:** ${interaction.user}`],
            reason,
            note,
            undo: !note && !ended ? { customId: undoId, label: 'Mở khóa', emoji: '🔓' } : undefined,
            at,
          });

        try {
          await targetChannel.permissionOverwrites.edit(interaction.guild!.id, { SendMessages: false });

          await interaction.reply(view(build()));

          await attachUndo(
            interaction,
            (note) => {
              if (!note) ended = true;
              return build(note);
            },
            {
              customId: undoId,
              permission: PermissionFlagsBits.ManageChannels,
              perform: async () => {
                await targetChannel.permissionOverwrites.edit(interaction.guild!.id, { SendMessages: null });
              },
              doneLabel: 'Đã mở khóa',
            }
          );
        } catch (error) {
          await interaction.reply(
            errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể khóa kênh'}`)
          );
        }
      },
    };

    // ==================== /moderation-unlock ====================
    const unlockCommand = {
      data: new SlashCommandBuilder()
        .setName('moderation-unlock')
        .setDescription('Cho phép thành viên gửi tin nhắn trở lại trong kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Kênh cần mở khóa (mặc định là kênh hiện tại)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;

        try {
          await targetChannel.permissionOverwrites.edit(interaction.guild!.id, { SendMessages: null });

          await interaction.reply(
            view(
              actionCard({
                color: COLOR_GREEN,
                action: 'UNLOCK',
                title: `${emojis.unlock} Kênh Đã Mở Khóa`,
                subtitle: `${targetChannel} đã được **mở khóa**\n-# Thành viên có thể gửi tin nhắn trở lại`,
                lines: [`${emojis.shield} **Thực hiện bởi:** ${interaction.user}`],
                at: unixNow(),
              })
            )
          );
        } catch (error) {
          await interaction.reply(
            errorReply(`Lỗi: ${error instanceof Error ? error.message : 'Không thể mở khóa kênh'}`)
          );
        }
      },
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
