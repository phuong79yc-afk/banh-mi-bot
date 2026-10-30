// Ticket Module - Entry Point
import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  CategoryChannel,
  ButtonInteraction,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  AttachmentBuilder,
  // ===== Components V2 =====
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  FileBuilder,
  MessageFlags,
} from 'discord.js';
import { ticketManager } from './TicketManager';
import { emojis } from '../../config/emojis';

// ==================== STYLE ====================
/** true = hiện thanh viền màu bên trái card; false = card không viền */
const USE_ACCENT = false;

const COLOR_TEAL = 0x1abc9c;
const COLOR_YELLOW = 0xfee75c;
const COLOR_RED = 0xed4245;
const COLOR_BLUE = 0x5865f2;

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const V2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
const NO_PING = { parse: [] as never[] };

const text = (content: string) => new TextDisplayBuilder().setContent(content);

const divider = (size: SeparatorSpacingSize = SeparatorSpacingSize.Small) =>
  new SeparatorBuilder().setDivider(true).setSpacing(size);

/** Tạo Container, chỉ gắn màu viền khi USE_ACCENT = true */
const box = (color?: number) => {
  const container = new ContainerBuilder();
  if (USE_ACCENT && color !== undefined) container.setAccentColor(color);
  return container;
};

/** Payload gửi / editReply (không ping ai) */
const view = (...components: (ContainerBuilder | TextDisplayBuilder)[]) =>
  ({ components, flags: V2, allowedMentions: NO_PING }) as const;

/** Payload ephemeral cho reply */
const viewEphemeral = (...components: (ContainerBuilder | TextDisplayBuilder)[]) =>
  ({ components, flags: V2_EPHEMERAL, allowedMentions: NO_PING }) as const;

/** Container chỉ có một đoạn text */
const notice = (color: number, content: string) => box(color).addTextDisplayComponents(text(content));

const errorView = (content: string) => view(notice(COLOR_RED, content));
const errorViewEphemeral = (content: string) => viewEphemeral(notice(COLOR_RED, content));

/** Tiêu đề: một cụm text (tối đa 3 dòng) + ảnh bên phải (nếu có) */
function addHeader(container: ContainerBuilder, texts: string[], thumbUrl?: string) {
  if (thumbUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(...texts.slice(0, 3).map(text))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbUrl))
    );
  } else {
    container.addTextDisplayComponents(...texts.map(text));
  }
  return container;
}

const unixNow = () => Math.floor(Date.now() / 1000);

const quote = (s: string) =>
  s
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

/** Thanh tiến độ ▰▰▰▱▱▱ */
function bar(ratio: number, size = 10): string {
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * size);
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

/** ms -> "45 phút" | "2 giờ 10 phút" | "1 ngày 3 giờ" */
function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 ? `${hours} giờ ${minutes % 60} phút` : `${hours} giờ`;
  return `${Math.floor(hours / 24)} ngày ${hours % 24} giờ`;
}

type StepState = 'pending' | 'loading' | 'done';
interface SetupStep {
  label: string;
  state: StepState;
  detail?: string;
}

interface SetupSummary {
  category: string;
  transcript: string;
  support: string;
  role: string;
}

// ==================== MODULE ====================
export default class TicketModule {
  name = 'ticket-module';
  description = 'Full-featured Ticket System';
  version = '3.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('⏳ Ticket module initializing...');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Ticket module registered ${this.commands.size} commands`);
  }

  // ---------- UI: tiến trình setup ----------
  private buildSetupView(steps: SetupStep[], summary?: SetupSummary) {
    const done = steps.filter((step) => step.state === 'done').length;
    const container = box(summary ? COLOR_TEAL : COLOR_BLUE);

    container.addTextDisplayComponents(
      text('-# ⚙️ SETUP'),
      text(summary ? `# ${emojis.success} Thiết lập hoàn tất` : '# Đang thiết lập hệ thống ticket'),
      text(`\`${bar(done / steps.length, steps.length * 3)}\` **${done}/${steps.length}**`)
    );

    const icon = (state: StepState) => (state === 'done' ? emojis.success : state === 'loading' ? emojis.loading : '▫️');
    const stepLines = steps.map((step) => {
      const label = step.state === 'pending' ? `-# ${step.label}` : step.label;
      return `${icon(step.state)} ${label}${step.detail ? ` · ${step.detail}` : ''}`;
    });

    container.addSeparatorComponents(divider(SeparatorSpacingSize.Large)).addTextDisplayComponents(text(stepLines.join('\n')));

    if (summary) {
      container
        .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
        .addTextDisplayComponents(
          text(
            [
              '### Đã tạo',
              `📁 **Danh mục:** <#${summary.category}>`,
              `📜 **Transcript:** <#${summary.transcript}>`,
              `🎫 **Kênh hỗ trợ:** <#${summary.support}>`,
              `🛡️ **Role hỗ trợ:** <@&${summary.role}>`,
            ].join('\n')
          )
        )
        .addSeparatorComponents(divider())
        .addTextDisplayComponents(
          text(
            [
              '### Tiếp theo',
              '• Thành viên bấm **Tạo ticket** trong kênh hỗ trợ để mở ticket',
              `• Quản lý trong kênh bằng \`/ticket-add\`, \`/ticket-remove\`, \`/ticket-close\``,
            ].join('\n')
          )
        );
    }

    return view(container);
  }

  // ---------- UI: panel tạo ticket ----------
  private buildPanelMessage(guildName?: string) {
    const container = box(COLOR_TEAL)
      .addTextDisplayComponents(
        text('# 🎫 Trung tâm hỗ trợ'),
        text('Bấm **Tạo ticket** và mô tả vấn đề để nhận hỗ trợ riêng.')
      )
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('ticket_create').setLabel('Tạo ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary)
        )
      )
      .addTextDisplayComponents(text('-# Một người chỉ mở được một ticket cùng lúc'));

    return { components: [container], flags: V2 } as const;
  }

  // ---------- UI: tin nhắn chào trong kênh ticket ----------
  private buildWelcomeMessage(opts: {
    userId: string;
    username: string;
    avatarUrl: string;
    guildName: string;
    staffRoleId: string;
    ticketNumber: string;
    issue: string;
  }) {
    const container = new ContainerBuilder();

    addHeader(
      container,
      [
        `-# 🎫 TICKET #${opts.ticketNumber}`,
        '# Khu vực hỗ trợ',
        `<@${opts.userId}> đã mở ticket · <t:${unixNow()}:R>`,
      ],
      opts.avatarUrl
    );

    container
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(text(`### ${emojis.copy} Vấn đề của bạn\n${quote(opts.issue)}`))
      .addSeparatorComponents(divider())
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Nhận ticket').setEmoji('🎫').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Đóng').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        )
      );

    // Dòng mention nằm ngoài Container (Components V2 không cho dùng `content`)
    const ping = text(
      `Cảm ơn <@${opts.userId}> đã mở ticket! <@&${opts.staffRoleId}> sẽ hỗ trợ bạn sớm nhất có thể ${emojis.art}${emojis.sparkles}`
    );

    return {
      components: [ping, container],
      flags: V2,
      allowedMentions: { users: [opts.userId], roles: [opts.staffRoleId] },
    } as const;
  }

  // ---------- Logic đóng ticket (dùng chung cho command / nút / modal) ----------
  // Yêu cầu: interaction đã được deferReply()
  private async closeTicket(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
    reason?: string
  ) {
    const i = interaction as ChatInputCommandInteraction;
    const channelId = i.channelId!;
    const ticket = ticketManager.getTicket(channelId);

    if (!ticket) {
      await i.editReply(errorView(`${emojis.error} Không tìm thấy ticket!`));
      return;
    }

    // Tạo transcript
    const channel = i.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map((m) => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`)
      .join('\n');

    // Đóng ticket trong database
    ticketManager.closeTicket(channelId, i.user.id);

    const openedFor = formatDuration(Date.now() - ticket.createdAt);
    const ticketNo = ticket.ticketId.split('-')[1] ?? ticket.ticketId;

    // Thông báo đóng ticket
    const closeContainer = box(COLOR_RED).addTextDisplayComponents(
      text(`-# 🔒 TICKET #${ticketNo}`),
      text('# Ticket đã đóng'),
      text(
        [
          `👮 **Đóng bởi:** <@${i.user.id}>`,
          `⏱️ **Đã mở:** ${openedFor} · 👥 ${ticket.participants.length} người tham gia`,
          ...(reason ? [`📝 **Lý do:** ${reason}`] : []),
        ].join('\n')
      )
    );
    closeContainer
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# ⏳ Kênh sẽ bị xóa <t:${unixNow() + 10}:R>`));

    await i.editReply(view(closeContainer));

    // Gửi transcript vào kênh log
    const config = ticketManager.getConfig(i.guildId!);
    if (config?.logChannelId) {
      try {
        const logChannel = (await i.guild?.channels.fetch(config.logChannelId)) as TextChannel;
        const fileName = `${ticket.ticketId}-transcript.txt`;
        const file = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: fileName });

        const logContainer = box(COLOR_BLUE)
          .addTextDisplayComponents(
            text('-# 📜 TRANSCRIPT'),
            text(`# ${ticket.ticketId}`),
            text(
              [
                `👤 **Tạo bởi:** <@${ticket.userId}>  ·  👮 **Đóng bởi:** <@${i.user.id}>`,
                `⏱️ **Đã mở:** ${openedFor}  ·  👥 **${ticket.participants.length}** người tham gia`,
                ...(reason ? [`📝 **Lý do đóng:** ${reason}`] : []),
              ].join('\n')
            )
          )
          .addSeparatorComponents(divider())
          .addFileComponents(new FileBuilder().setURL(`attachment://${fileName}`));

        await logChannel.send({ ...view(logContainer), files: [file] });
      } catch (error) {
        console.error('Failed to send transcript:', error);
      }
    }

    // Xóa kênh sau 10 giây
    setTimeout(async () => {
      try {
        await channel.delete();
        ticketManager.deleteTicket(channelId);
      } catch (error) {
        console.error('Failed to delete ticket channel:', error);
      }
    }, 10000);
  }

  private registerCommands() {
    // ==================== /ticket-setup ====================
    const setupCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Thiết lập hệ thống ticket lần đầu')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption((option) =>
          option.setName('force').setDescription('Buộc setup lại từ đầu (xóa config cũ)').setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        // DEFER IMMEDIATELY to prevent timeout
        await interaction.deferReply(); // Public message

        const force = interaction.options.getBoolean('force') ?? false;
        const guild = interaction.guild!;

        // Check if already configured
        const existingConfig = ticketManager.getConfig(guild.id);
        if (existingConfig && !force) {
          return interaction.editReply(
            view(
              notice(
                COLOR_YELLOW,
                `${emojis.warning} Server này đã thiết lập hệ thống ticket.\nNếu bạn muốn thiết lập lại, dùng tùy chọn \`force: True\`.`
              )
            )
          );
        }

        const steps: SetupStep[] = [
          { label: 'Tạo danh mục & kênh lưu transcript', state: 'loading' },
          { label: 'Tạo kênh hỗ trợ', state: 'pending' },
          { label: 'Đăng panel tạo ticket', state: 'pending' },
          { label: 'Tạo role hỗ trợ & gán quyền', state: 'pending' },
        ];
        const render = () => interaction.editReply(this.buildSetupView(steps));
        await render();

        // STEP 1: Category + transcript channel
        await new Promise((resolve) => setTimeout(resolve, 500));

        const category = await guild.channels.create({
          name: '🎫| Hỗ Trợ',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{ id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }],
        });

        // Gộp thành một overwrite cho @everyone (bản cũ có 2 overwrite trùng id)
        const transcriptChannel = await guild.channels.create({
          name: '🎫| transcripts',
          type: ChannelType.GuildText,
          parent: category,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
          ],
        });

        steps[0] = { ...steps[0], state: 'done', detail: `<#${transcriptChannel.id}>` };
        steps[1].state = 'loading';
        await render();

        // STEP 2: Support channel
        await new Promise((resolve) => setTimeout(resolve, 500));

        const supportChannel = await guild.channels.create({
          name: '🎫| ticket',
          type: ChannelType.GuildText,
          parent: category,
        });

        steps[1] = { ...steps[1], state: 'done', detail: `<#${supportChannel.id}>` };
        steps[2].state = 'loading';
        await render();

        // STEP 3: Ticket panel
        await new Promise((resolve) => setTimeout(resolve, 500));

        const panelMessage = await supportChannel.send(this.buildPanelMessage(guild.name));

        steps[2] = { ...steps[2], state: 'done', detail: `<#${supportChannel.id}>` };
        steps[3].state = 'loading';
        await render();

        // STEP 4: Support role + permissions
        await new Promise((resolve) => setTimeout(resolve, 500));

        const supportRole = await guild.roles.create({
          name: 'Hỗ trợ Ticket',
          color: COLOR_TEAL,
          permissions: [],
          mentionable: true,
        });

        await transcriptChannel.permissionOverwrites.create(supportRole, {
          ViewChannel: true,
          SendMessages: false,
          ReadMessageHistory: true,
        });

        // Save config
        ticketManager.updateConfig(guild.id, {
          categoryId: category.id,
          staffRoleId: supportRole.id,
          ticketMessageChannelId: supportChannel.id,
          ticketMessageId: panelMessage.id,
          logChannelId: transcriptChannel.id,
        });

        // Reset ticket counter if force setup
        if (force) {
          ticketManager.resetCounter(guild.id);
        }

        steps[3] = { ...steps[3], state: 'done', detail: `<@&${supportRole.id}>` };
        await interaction.editReply(
          this.buildSetupView(steps, {
            category: category.id,
            transcript: transcriptChannel.id,
            support: supportChannel.id,
            role: supportRole.id,
          })
        );

        // Cleanup old resources (background, 3s delay)
        if (force && existingConfig) {
          setTimeout(async () => {
            try {
              console.log(`${emojis.delete} Starting cleanup of ALL old ticket resources...`);

              // Xóa mọi role "Hỗ trợ Ticket" cũ
              const allRoles = await guild.roles.fetch();
              const ticketRoles = allRoles.filter((r) => r.name === 'Hỗ trợ Ticket' && r.id !== supportRole.id);

              for (const [, role] of ticketRoles) {
                await role.delete('Ticket setup: cleanup old resources').catch(() => {});
                console.log(`${emojis.success} Deleted role: ${role.name} (${role.id})`);
              }

              // Xóa category cũ cùng các kênh bên trong
              const allChannels = await guild.channels.fetch();
              const ticketCategories = allChannels.filter(
                (ch) =>
                  ch?.type === ChannelType.GuildCategory &&
                  (ch?.name === '🎫 TICKETS' || ch?.name === '🎫| Hỗ Trợ') &&
                  ch?.id !== category.id
              );

              for (const [, cat] of ticketCategories) {
                const channelsInCat = allChannels.filter((ch) => ch?.parentId === cat!.id);
                for (const [, ch] of channelsInCat) {
                  await ch?.delete('Ticket setup: cleanup old resources').catch(() => {});
                  console.log(`${emojis.success} Deleted channel: ${ch?.name}`);
                }
                await cat?.delete('Ticket setup: cleanup old resources').catch(() => {});
                console.log(`${emojis.success} Deleted category: ${cat!.name} (${cat!.id})`);
              }

              // Xóa kênh transcripts / ticket cũ còn sót
              const oldChannels = allChannels.filter(
                (ch) =>
                  (ch?.name === 'transcripts' || ch?.name === '🎫| transcripts') && ch?.id !== transcriptChannel.id
              );

              const oldSupports = allChannels.filter(
                (ch) => (ch?.name === 'ticket-support' || ch?.name === '🎫| ticket') && ch?.id !== supportChannel.id
              );

              for (const [, ch] of [...oldChannels, ...oldSupports]) {
                await ch?.delete('Ticket setup: cleanup old resources').catch(() => {});
                console.log(`${emojis.success} Deleted channel: ${ch?.name} (${ch?.id})`);
              }

              console.log(`${emojis.success} Cleaned up ALL old ticket resources`);
            } catch (error) {
              console.error(`${emojis.error} Error cleaning up old resources:`, error);
            }
          }, 3000);
        }
      },
    };

    // ==================== /ticket-close ====================
    const closeCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('Đóng ticket hiện tại')
        .addStringOption((option) => option.setName('reason').setDescription('Lý do đóng ticket').setRequired(false)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const ticket = ticketManager.getTicket(interaction.channelId);
        if (!ticket) {
          return interaction.reply(errorViewEphemeral(`${emojis.error} Đây không phải là kênh ticket!`));
        }

        const reason = interaction.options.getString('reason') || 'Không có lý do';
        await interaction.deferReply();
        await this.closeTicket(interaction, reason);
      },
    };

    // ==================== /ticket-add ====================
    const addCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-add')
        .setDescription('Thêm user vào ticket')
        .addUserOption((option) =>
          option.setName('user').setDescription('User để thêm vào ticket').setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const ticket = ticketManager.getTicket(interaction.channelId);
        if (!ticket) {
          return interaction.reply(errorViewEphemeral(`${emojis.error} Đây không phải là kênh ticket!`));
        }

        const user = interaction.options.getUser('user', true);
        const channel = interaction.channel as TextChannel;

        await channel.permissionOverwrites.create(user, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        ticketManager.addParticipant(interaction.channelId, user.id);

        await interaction.reply(
          view(notice(COLOR_TEAL, `➕ <@${user.id}> đã được thêm vào ticket bởi <@${interaction.user.id}>`))
        );
      },
    };

    // ==================== /ticket-remove ====================
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-remove')
        .setDescription('Xóa user khỏi ticket')
        .addUserOption((option) =>
          option.setName('user').setDescription('User để xóa khỏi ticket').setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const ticket = ticketManager.getTicket(interaction.channelId);
        if (!ticket) {
          return interaction.reply(errorViewEphemeral(`${emojis.error} Đây không phải là kênh ticket!`));
        }

        const user = interaction.options.getUser('user', true);
        if (user.id === ticket.userId) {
          return interaction.reply(errorViewEphemeral(`${emojis.error} Không thể xóa người tạo ticket!`));
        }

        const channel = interaction.channel as TextChannel;
        await channel.permissionOverwrites.delete(user);

        ticketManager.removeParticipant(interaction.channelId, user.id);

        await interaction.reply(
          view(notice(COLOR_TEAL, `➖ <@${user.id}> đã bị xóa khỏi ticket bởi <@${interaction.user.id}>`))
        );
      },
    };

    // ==================== /ticket-stats ====================
    const statsCommand = {
      data: new SlashCommandBuilder().setName('ticket-stats').setDescription('Xem thống kê ticket'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const stats = ticketManager.getStats(interaction.guildId!);

        const openRatio = stats.total ? stats.open / stats.total : 0;
        const closedRatio = stats.total ? stats.closed / stats.total : 0;
        const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;

        const container = box(COLOR_TEAL);

        addHeader(
          container,
          [
            `-# ${emojis.chart} THỐNG KÊ`,
            `# ${stats.total} ticket`,
            `-# ${interaction.guild?.name ?? ''}`,
          ],
          interaction.guild?.iconURL({ size: 256 }) ?? undefined
        );

        container
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(
            text(
              [
                `🟢 **Đang mở** · \`${stats.open}\`  ${pct(openRatio)}`,
                `\`${bar(openRatio, 14)}\``,
                '',
                `🔴 **Đã đóng** · \`${stats.closed}\`  ${pct(closedRatio)}`,
                `\`${bar(closedRatio, 14)}\``
              ].join('\n')
            )
          );

        await interaction.reply(viewEphemeral(container));
      },
    };

    this.commands.set('ticket-setup', setupCommand);
    this.commands.set('ticket-close', closeCommand);
    this.commands.set('ticket-add', addCommand);
    this.commands.set('ticket-remove', removeCommand);
    this.commands.set('ticket-stats', statsCommand);
  }

  private registerEvents() {
    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId === 'ticket_create') {
          await this.handleTicketCreate(interaction);
        } else if (interaction.customId === 'ticket_claim') {
          await this.handleTicketClaim(interaction);
        } else if (interaction.customId === 'ticket_close_button') {
          await this.handleTicketCloseButton(interaction);
        }
      } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'ticket_close_modal') {
          await this.handleTicketCloseModal(interaction);
        } else if (interaction.customId === 'ticket_create_modal') {
          await this.handleTicketCreateModal(interaction);
        }
      }
    });
  }

  private async handleTicketCreate(interaction: ButtonInteraction) {
    // Hiện modal để nhập mô tả vấn đề
    const modal = new ModalBuilder().setCustomId('ticket_create_modal').setTitle('Tạo Ticket Hỗ Trợ');

    const issueInput = new TextInputBuilder()
      .setCustomId('issue_description')
      .setLabel('Vấn đề của bạn')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Mô tả vấn đề bạn gặp phải...')
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(issueInput));

    await interaction.showModal(modal);
  }

  private async handleTicketCreateModal(interaction: ModalSubmitInteraction) {
    // DEFER IMMEDIATELY to prevent timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const issueDescription = interaction.fields.getTextInputValue('issue_description');

    const config = ticketManager.getConfig(interaction.guildId!);
    if (!config || !config.enabled) {
      return interaction.editReply(errorView(`${emojis.error} Hệ thống ticket chưa được cấu hình!`));
    }

    // Mỗi người chỉ có 1 ticket đang mở
    const existing = ticketManager.getTicketByUser(interaction.guildId!, interaction.user.id);
    if (existing) {
      return interaction.editReply(
        errorView(`${emojis.error} Bạn đã có một ticket đang mở: <#${existing.channelId}>`)
      );
    }

    try {
      const guild = interaction.guild!;
      await guild.members.fetch(interaction.user.id); // Ensure user is cached
      await guild.roles.fetch(config.staffRoleId!); // Ensure staff role is cached

      const category = (await guild.channels.fetch(config.categoryId!)) as CategoryChannel;
      const ticketId = ticketManager.peekNextTicketId(interaction.guildId!);

      const channel = await guild.channels.create({
        name: `${ticketId}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          {
            id: config.staffRoleId!,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages,
            ],
          },
        ],
      });

      // Lưu ticket
      const ticket = ticketManager.createTicket(
        interaction.guildId!,
        channel.id,
        interaction.user.id,
        issueDescription
      );

      // Tin nhắn chào trong kênh ticket
      await channel.send(
        this.buildWelcomeMessage({
          userId: interaction.user.id,
          username: interaction.user.username,
          avatarUrl: interaction.user.displayAvatarURL({ size: 256 }),
          guildName: guild.name,
          staffRoleId: config.staffRoleId!,
          ticketNumber: ticket.ticketId.split('-')[1],
          issue: issueDescription,
        })
      );

      // Trả lời người dùng
      await interaction.editReply(
        view(notice(COLOR_TEAL, `${emojis.success} Ticket của bạn đã được tạo: <#${channel.id}>`))
      );
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.editReply(errorView('❌ **Không thể tạo ticket.** Vui lòng liên hệ quản trị viên.'));
    }
  }

  private async handleTicketCloseButton(interaction: ButtonInteraction) {
    const ticket = ticketManager.getTicket(interaction.channelId);
    const config = ticketManager.getConfig(interaction.guildId!);
    const member = interaction.guild
      ? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
      : null;
    const isOwner = ticket?.userId === interaction.user.id;
    const hasStaffRole = !!config?.staffRoleId && !!member?.roles.cache.has(config.staffRoleId);
    const hasManageMessages = !!member?.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!ticket || (!isOwner && !hasStaffRole && !hasManageMessages)) {
      return interaction.reply(errorViewEphemeral(`${emojis.error} Bạn không có quyền đóng ticket này.`));
    }

    await interaction.deferReply();
    await this.closeTicket(interaction);
  }

  private async handleTicketCloseWithReason(interaction: ButtonInteraction) {
    const modal = new ModalBuilder().setCustomId('ticket_close_modal').setTitle('Đóng Ticket');

    const reasonInput = new TextInputBuilder()
      .setCustomId('close_reason')
      .setLabel('Lý do đóng ticket')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Nhập lý do đóng ticket...')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));

    await interaction.showModal(modal);
  }

  private async handleTicketCloseModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply();

    const reason = interaction.fields.getTextInputValue('close_reason');
    await this.closeTicket(interaction, reason);
  }

  private async handleTicketClaim(interaction: ButtonInteraction) {
    const config = ticketManager.getConfig(interaction.guildId!);
    const member = interaction.guild
      ? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
      : null;
    const hasStaffRole = !!config?.staffRoleId && !!member?.roles.cache.has(config.staffRoleId);
    const hasManageMessages = !!member?.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!hasStaffRole && !hasManageMessages) {
      return interaction.reply(errorViewEphemeral(`${emojis.error} Chỉ nhân viên hỗ trợ mới có thể nhận ticket.`));
    }

    await interaction.deferReply();

    const ticket = ticketManager.getTicket(interaction.channelId);
    if (!ticket) {
      return interaction.editReply(errorView(`${emojis.error} Không tìm thấy ticket!`));
    }

    await interaction.editReply(
      view(
        notice(
          COLOR_TEAL,
          `${emojis.success} <@${interaction.user.id}> đã nhận ticket này và sẽ **hỗ trợ** bạn!\n-# <t:${unixNow()}:R>`
        )
      )
    );
  }

  async cleanup() {
    console.log('🧹 Ticket module cleanup');
  }
}
