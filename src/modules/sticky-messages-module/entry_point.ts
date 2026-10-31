// Sticky Messages Module - Entry Point

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChannelType,
  TextChannel,
  Message,
  AllowedMentionsTypes,
  // ===== Components V2 =====
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import { emojis, getEmoji } from '../../config/emojis';
import { stickyManager, StickyMode, StickyMessage } from './StickyManager';

// ==================== CONSTANTS ====================
const MAX_PER_GUILD = 3;
const PANEL_TIMEOUT_MS = 5 * 60 * 1000;

/** true = tin nhắn sticky được đăng dạng Container (có nhãn 📌); false = tin nhắn thường */
const STICKY_USE_CONTAINER = true;

const COLOR_PRIMARY = 0x667eea;
const COLOR_GREEN = 0x57f287;
const COLOR_RED = 0xed4245;
const COLOR_GREY = 0x4e5058;

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const V2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
const NO_PING = { parse: [] as never[] };

const text = (content: string) => new TextDisplayBuilder().setContent(content);
const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

const view = (container: ContainerBuilder) =>
  ({ components: [container], flags: V2, allowedMentions: NO_PING }) as const;

const viewEphemeral = (container: ContainerBuilder) =>
  ({ components: [container], flags: V2_EPHEMERAL, allowedMentions: NO_PING }) as const;

const notice = (color: number, content: string) =>
  new ContainerBuilder().addTextDisplayComponents(text(content));

const errorReply = (content: string) => viewEphemeral(notice(COLOR_RED, `${emojis.error} ${content}`));

/** Thẻ thành công: tiêu đề + các dòng chi tiết */
function successCard(title: string, lines: string[], hint?: string) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(text(`-# ${emojis.pin} STICKY`), text(`# ${emojis.success} ${title}`));
  if (lines.length) c.addSeparatorComponents(divider(SeparatorSpacingSize.Large)).addTextDisplayComponents(text(lines.join('\n')));
  if (hint) c.addSeparatorComponents(divider()).addTextDisplayComponents(text(`-# ${hint}`));
  return c;
}

// ==================== FORMAT HELPERS ====================
const modeLabel = (m: StickyMode) => (m === 'threshold' ? `${emojis.message} Ngưỡng tin nhắn` : `${emojis.clock} Độ trễ không hoạt động`);

const modeSetting = (s: StickyMessage) =>
  s.mode === 'threshold' ? `**${s.threshold ?? 3}** tin nhắn` : `**${s.delay ?? 5}** giây`;

const quote = (s: string, max = 800) => {
  const body = s.length > max ? `${s.slice(0, max)}…` : s;
  return body
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');
};

function bar(progress: number, target: number, size = 10): string {
  const ratio = Math.max(0, Math.min(1, progress / target));
  const filled = Math.round(ratio * size);
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

const textChannelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

// ==================== MODULE ====================
export default class StickyMessagesModule {
  name = 'sticky-messages-module';
  description = 'Sticky Messages - Pin important messages that auto-repost';
  version = '2.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  /** Khóa theo kênh để không đăng lại nhiều lần cùng lúc */
  private reposting = new Set<string>();

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`${emojis.pin} Sticky Messages module initialized`);
    this.registerCommands();
    this.registerEvents();
    console.log(`${emojis.success} Sticky Messages module registered ${this.commands.size} commands`);
  }

  // ---------- Dựng tin nhắn sticky đăng trong kênh ----------
  private buildStickyPost(sticky: StickyMessage) {
    const allowedMentions = sticky.allowMentions
      ? { parse: ['users', 'roles'] as AllowedMentionsTypes[] }
      : { parse: [] as never[] };

    // Sticky cũ có embed: giữ nguyên kiểu tin nhắn thường (V2 không dùng chung được với embed)
    if (sticky.embed || !STICKY_USE_CONTAINER) {
      return {
        content: sticky.message,
        embeds: sticky.embed ? [sticky.embed] : [],
        allowedMentions,
      };
    }

    const container = new ContainerBuilder().addTextDisplayComponents(text(`-# ${emojis.pin} Tin nhắn ghim`), text(sticky.message));

    return { components: [container], flags: V2 as any, allowedMentions };
  }

  // ---------- Xóa sticky (kèm tin nhắn cuối cùng trong kênh) ----------
  private async removeStickyAndMessage(guildId: string, channelId: string) {
    // Lấy sticky TRƯỚC khi xóa (bản cũ xóa trước nên không còn lastMessageId để xóa tin nhắn)
    const sticky = stickyManager.get(guildId, channelId);
    const lastMessageId = sticky?.lastMessageId;

    const result = stickyManager.remove(guildId, channelId);
    if (!result.success) return result;

    if (lastMessageId) {
      try {
        const channel = (await this.client.channels.fetch(channelId)) as TextChannel;
        const msg = await channel.messages.fetch(lastMessageId);
        await msg.delete();
      } catch {
        // Tin nhắn đã bị xóa hoặc không còn quyền -> bỏ qua
      }
    }

    return result;
  }

  // ---------- Bảng cấu hình ----------
  private renderConfig(guildId: string, channelId: string, canManage: boolean, note?: string) {
    const sticky = stickyManager.get(guildId, channelId);

    if (!sticky) {
      return view(notice(COLOR_GREY, `${emojis.pin} Sticky trong <#${channelId}> đã được gỡ.`));
    }

    const container = new ContainerBuilder();

    container
      .addTextDisplayComponents(
        text(`-# ${emojis.pin} STICKY`),
        text(`# ${emojis.pin} Cấu hình Sticky`),
        text(`Kênh: <#${channelId}>`)
      )
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large));

    const settings = [
      `**Chế độ:** ${modeLabel(sticky.mode)}`,
      sticky.mode === 'threshold'
        ? `**Ngưỡng:** ${modeSetting(sticky)}`
        : `**Độ trễ:** ${modeSetting(sticky)}`,
      `**Cho phép mention:** ${sticky.allowMentions ? `${emojis.success} Có` : `${emojis.error} Không`}`,
    ];

    container.addTextDisplayComponents(text(settings.join('\n')));

    if (sticky.mode === 'threshold') {
      const target = sticky.threshold ?? 3;
      container.addTextDisplayComponents(
        text(`\`${bar(sticky.messageCount, target)}\` **${Math.min(sticky.messageCount, target)}/${target}** tin nhắn tới lần đăng lại kế tiếp`)
      );
    }

    container
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`### ${emojis.message} Nội dung\n${quote(sticky.message)}`))
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(
        text(`${emojis.user} Tạo bởi <@${sticky.createdBy}> · <t:${Math.floor(sticky.createdAt / 1000)}:R>\n-# ID: ${sticky.id}`)
      );

    if (note) {
      container.addSeparatorComponents(divider()).addTextDisplayComponents(text(note));
    }

    if (canManage && !note) {
      container.addSeparatorComponents(divider(SeparatorSpacingSize.Large)).addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('stk_mode')
            .setLabel(sticky.mode === 'threshold' ? 'Chuyển sang độ trễ' : 'Chuyển sang ngưỡng')
            .setEmoji(getEmoji('refresh'))
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('stk_mention')
            .setLabel(sticky.allowMentions ? 'Tắt mention' : 'Bật mention')
            .setEmoji(getEmoji('bell'))
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('stk_repost').setLabel('Đăng lại ngay').setEmoji(getEmoji('arrow_forward')).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('stk_remove').setLabel('Gỡ sticky').setEmoji(getEmoji('delete')).setStyle(ButtonStyle.Danger)
        )
      );
    }

    container.addTextDisplayComponents(text('-# Banhcuon-bot'));

    return view(container);
  }

  private registerCommands() {
    // ==================== /sticky-message ====================
    const messageCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-message')
        .setDescription('Tạo tin nhắn ghim tự động trong một kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Kênh văn bản sẽ đăng tin nhắn ghim').addChannelTypes(...textChannelTypes).setRequired(true)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const existing = stickyManager.get(interaction.guildId!, channel.id);

        if (existing) {
          return interaction.reply(
            errorReply(`Kênh <#${channel.id}> đã có sticky! Hãy gỡ bằng \`/sticky-remove\` trước.`)
          );
        }

        const modal = new ModalBuilder().setCustomId(`sticky_modal_${channel.id}`).setTitle('Đặt Sticky Message');

        const messageInput = new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Nội dung sticky')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Nhập nội dung sticky tại đây...')
          .setRequired(true)
          .setMaxLength(2000);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput));

        await interaction.showModal(modal);
      },
    };

    // ==================== /sticky-remove ====================
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-remove')
        .setDescription('Xóa tin nhắn ghim tự động khỏi một kênh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Kênh có tin nhắn ghim cần xóa').addChannelTypes(...textChannelTypes).setRequired(true)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const result = await this.removeStickyAndMessage(interaction.guildId!, channel.id);

        if (!result.success) {
          return interaction.reply(errorReply(result.error ?? 'Không tìm thấy sticky trong kênh này!'));
        }

        await interaction.reply(
          viewEphemeral(successCard('Đã gỡ sticky', [`${emojis.pin} **Kênh:** <#${channel.id}>`], `${emojis.delete} Tin nhắn sticky cuối cùng đã được xóa.`))
        );
      },
    };

    // ==================== /sticky-mode ====================
    const modeCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-mode')
        .setDescription('Thay đổi cách tin nhắn ghim được đăng lại')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Kênh cần thay đổi chế độ ghim').addChannelTypes(...textChannelTypes).setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName('mode')
            .setDescription('Chọn cách đăng lại tin nhắn ghim')
            .setRequired(true)
            .addChoices(
              { name: 'Ngưỡng tin nhắn', value: 'threshold' },
              { name: 'Độ trễ không hoạt động', value: 'inactive' }
            )
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const mode = interaction.options.getString('mode', true) as StickyMode;

        const result = stickyManager.updateMode(interaction.guildId!, channel.id, mode);
        if (!result.success) return interaction.reply(errorReply(result.error ?? 'Lỗi không xác định'));

        // Đổi sang threshold thì hủy timer inactive đang chạy
        if (mode === 'threshold') stickyManager.clearInactiveTimer(interaction.guildId!, channel.id);

        await interaction.reply(
          viewEphemeral(successCard('Đã đổi chế độ', [`${emojis.pin} **Kênh:** <#${channel.id}>`], `**Chế độ mới:** ${modeLabel(mode)}`))
        );
      },
    };

    // ==================== /sticky-threshold ====================
    const thresholdCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-threshold')
        .setDescription('Cài số tin nhắn mới trước khi đăng lại tin ghim')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Kênh cần chỉnh ngưỡng tin nhắn').addChannelTypes(...textChannelTypes).setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName('threshold')
            .setDescription('Số tin nhắn mới trước khi đăng lại (0 để tắt)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(500)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const threshold = interaction.options.getInteger('threshold', true);

        const result = stickyManager.updateThreshold(interaction.guildId!, channel.id, threshold);
        if (!result.success) return interaction.reply(errorReply(result.error ?? 'Lỗi không xác định'));

        await interaction.reply(
          viewEphemeral(
            successCard('Đã đặt ngưỡng tin nhắn', [`${emojis.pin} **Kênh:** <#${channel.id}>`, `${emojis.message} **Ngưỡng:** ${threshold} tin nhắn`], 'Ngưỡng chỉ có tác dụng ở chế độ "Ngưỡng tin nhắn".')
          )
        );
      },
    };

    // ==================== /sticky-delay ====================
    const delayCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-delay')
        .setDescription('Cài thời gian chờ trước khi đăng lại tin ghim')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Kênh cần chỉnh thời gian chờ').addChannelTypes(...textChannelTypes).setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName('delay')
            .setDescription('Số giây chờ sau tin nhắn cuối (1–15)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(15)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const delay = interaction.options.getInteger('delay', true);

        const result = stickyManager.updateDelay(interaction.guildId!, channel.id, delay);
        if (!result.success) return interaction.reply(errorReply(result.error ?? 'Lỗi không xác định'));

        await interaction.reply(
          viewEphemeral(
            successCard('Đã đặt độ trễ', [`${emojis.pin} **Kênh:** <#${channel.id}>`, `${emojis.clock} **Độ trễ:** ${delay} giây`], 'Độ trễ chỉ có tác dụng ở chế độ "Độ trễ không hoạt động".')
          )
        );
      },
    };

    // ==================== /sticky-config ====================
    const configCommand = {
      data: new SlashCommandBuilder()
        .setName('sticky-config')
        .setDescription('Xem cấu hình tin nhắn ghim của một kênh')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Kênh cần xem cấu hình tin ghim').addChannelTypes(...textChannelTypes).setRequired(true)
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const channel = interaction.options.getChannel('channel', true);
        const guildId = interaction.guildId!;

        if (!stickyManager.get(guildId, channel.id)) {
          return interaction.reply(errorReply(`Không tìm thấy sticky trong <#${channel.id}>!`));
        }

        // Chỉ người có quyền quản lý kênh mới thấy các nút chỉnh sửa
        const canManage = !!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

        await interaction.reply({ ...this.renderConfig(guildId, channel.id, canManage), flags: V2_EPHEMERAL });

        if (!canManage) return;

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: PANEL_TIMEOUT_MS,
        });

        collector.on('collect', async (i) => {
          if (!i.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
            await i.reply(errorReply('Bạn cần quyền Manage Channels!'));
            return;
          }

          const sticky = stickyManager.get(guildId, channel.id);
          if (!sticky) {
            await i.update(this.renderConfig(guildId, channel.id, false));
            collector.stop('gone');
            return;
          }

          try {
            if (i.customId === 'stk_mode') {
              const next: StickyMode = sticky.mode === 'threshold' ? 'inactive' : 'threshold';
              stickyManager.updateMode(guildId, channel.id, next);
              if (next === 'threshold') stickyManager.clearInactiveTimer(guildId, channel.id);
              await i.update(this.renderConfig(guildId, channel.id, true));
            } else if (i.customId === 'stk_mention') {
              stickyManager.updateAllowMentions(guildId, channel.id, !sticky.allowMentions);
              await i.update(this.renderConfig(guildId, channel.id, true));
            } else if (i.customId === 'stk_repost') {
              const target = (await this.client.channels.fetch(channel.id)) as TextChannel;
              await this.repostSticky(target, sticky);
              await i.update(this.renderConfig(guildId, channel.id, true));
            } else if (i.customId === 'stk_remove') {
              await this.removeStickyAndMessage(guildId, channel.id);
              await i.update(
                this.renderConfig(guildId, channel.id, false, `${emojis.delete} Đã gỡ bởi ${i.user} · <t:${Math.floor(Date.now() / 1000)}:R>`)
              );
              collector.stop('removed');
            }
          } catch (error) {
            console.error('[Sticky] Panel error:', error);
            await i.reply(errorReply('Có lỗi xảy ra khi thực hiện thao tác!')).catch(() => {});
          }
        });

        collector.on('end', (_c, reason) => {
          if (reason === 'removed' || reason === 'gone') return;
          // Hết thời gian: dựng lại bảng nhưng không còn nút
          interaction.editReply(this.renderConfig(guildId, channel.id, false)).catch(() => {});
        });
      },
    };

    // ==================== /sticky-list ====================
    const listCommand = {
      data: new SlashCommandBuilder().setName('sticky-list').setDescription('Liệt kê các tin nhắn ghim tự động trong máy chủ'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const stickies = stickyManager.getAll(interaction.guildId!);

        if (stickies.length === 0) {
          return interaction.reply(viewEphemeral(notice(COLOR_GREY, `${emojis.pin} Server này chưa có sticky nào!`)));
        }

        const container = new ContainerBuilder();

        container
          .addTextDisplayComponents(
            text(`-# ${emojis.pin} STICKY`),
            text(`# ${emojis.pin} Danh sách Sticky`),
            text(`Server có **${stickies.length}/${MAX_PER_GUILD}** sticky.`)
          )
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large));

        stickies.forEach((s, i) => {
          container.addTextDisplayComponents(
            text(
              [
                `### ${i + 1}. <#${s.channelId}>`,
                `${modeLabel(s.mode)} · ${modeSetting(s)}${s.allowMentions ? ` · ${emojis.bell} mention` : ''}`,
                quote(s.message.length > 120 ? `${s.message.slice(0, 120)}…` : s.message, 120),
              ].join('\n')
            )
          );

          if (i < stickies.length - 1) container.addSeparatorComponents(divider());
        });

        container.addTextDisplayComponents(text('-# Dùng /sticky-config để xem chi tiết và chỉnh sửa'));

        await interaction.reply(viewEphemeral(container));
      },
    };

    this.commands.set('sticky-message', messageCommand);
    this.commands.set('sticky-remove', removeCommand);
    this.commands.set('sticky-mode', modeCommand);
    this.commands.set('sticky-threshold', thresholdCommand);
    this.commands.set('sticky-delay', delayCommand);
    this.commands.set('sticky-config', configCommand);
    this.commands.set('sticky-list', listCommand);
  }

  private registerEvents() {
    // ---------- Modal submit ----------
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('sticky_modal_')) return;

      const channelId = interaction.customId.replace('sticky_modal_', '');
      const message = interaction.fields.getTextInputValue('message');

      const result = stickyManager.add(interaction.guildId!, channelId, message, interaction.user.id, {
        mode: 'threshold',
        threshold: 3,
        delay: 5,
        allowMentions: false,
      });

      if (!result.success) {
        return interaction.reply(errorReply(result.error ?? 'Không thể tạo sticky!'));
      }

      // Đăng sticky đầu tiên
      try {
        const channel = (await this.client.channels.fetch(channelId)) as TextChannel;
        const sent = await channel.send(this.buildStickyPost(result.sticky!));
        stickyManager.updateLastMessageId(interaction.guildId!, channelId, sent.id);

        await interaction.reply(
          viewEphemeral(
            successCard(
              'Đã tạo sticky',
              [
                `${emojis.pin} **Kênh:** <#${channelId}>`,
                `**Chế độ:** ${modeLabel('threshold')} · **3** tin nhắn`,
                `**Giới hạn:** ${stickyManager.getAll(interaction.guildId!).length}/${MAX_PER_GUILD} sticky`,
              ],
              'Dùng /sticky-config để tinh chỉnh chế độ, ngưỡng và mention.'
            )
          )
        );
      } catch (error) {
        console.error('Error posting sticky:', error);
        // Đăng thất bại thì gỡ luôn bản ghi để không bị "kẹt" kênh
        stickyManager.remove(interaction.guildId!, channelId);
        await interaction.reply(errorReply('Không thể đăng sticky! Hãy kiểm tra quyền gửi tin nhắn của bot trong kênh.'));
      }
    });

    // ---------- Đăng lại sticky khi có tin nhắn mới ----------
    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot || !message.guild) return;

      const guildId = message.guild.id;
      const channelId = message.channel.id;
      const sticky = stickyManager.get(guildId, channelId);

      if (!sticky) return;

      if (sticky.mode === 'threshold') {
        const count = stickyManager.incrementCount(guildId, channelId);
        if (count >= (sticky.threshold || 3)) {
          await this.repostSticky(message.channel as TextChannel, sticky);
        }
      } else {
        stickyManager.clearInactiveTimer(guildId, channelId);
        stickyManager.updateActivity(guildId, channelId);

        stickyManager.startInactiveTimer(guildId, channelId, async () => {
          // Lấy bản mới nhất lúc timer chạy (sticky có thể đã bị đổi/xóa)
          const fresh = stickyManager.get(guildId, channelId);
          if (!fresh || fresh.mode !== 'inactive') return;

          await this.repostSticky(message.channel as TextChannel, fresh);
        });
      }
    });
  }

  private async repostSticky(channel: TextChannel, sticky: StickyMessage) {
    const lockKey = channel.id;
    if (this.reposting.has(lockKey)) return; // đang đăng lại, bỏ qua để tránh trùng

    this.reposting.add(lockKey);

    try {
      // Xóa sticky cũ
      if (sticky.lastMessageId) {
        try {
          const oldMessage = await channel.messages.fetch(sticky.lastMessageId);
          await oldMessage.delete();
        } catch {
          // Không tìm thấy -> bỏ qua
        }
      }

      const sent = await channel.send(this.buildStickyPost(sticky));
      stickyManager.updateLastMessageId(sticky.guildId, sticky.channelId, sent.id);
      stickyManager.resetCount(sticky.guildId, sticky.channelId);
    } catch (error) {
      console.error('Error reposting sticky:', error);
    } finally {
      this.reposting.delete(lockKey);
    }
  }

  async cleanup() {
    console.log(`${emojis.delete} Sticky Messages module cleanup`);
  }
}
