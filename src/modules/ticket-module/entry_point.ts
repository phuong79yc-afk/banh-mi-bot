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

// ==================== COLORS ====================
const COLOR_TEAL = 0x1abc9c;
const COLOR_DARK = 0x2b2d31;
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

/** Payload cho editReply / send (không ping ai) */
const view = (...containers: (ContainerBuilder | TextDisplayBuilder)[]) =>
  ({ components: containers, flags: V2, allowedMentions: NO_PING }) as const;

/** Payload ephemeral cho reply */
const viewEphemeral = (...containers: (ContainerBuilder | TextDisplayBuilder)[]) =>
  ({ components: containers, flags: V2_EPHEMERAL, allowedMentions: NO_PING }) as const;

/** Container chỉ có 1 đoạn text */
const notice = (color: number, content: string) =>
  new ContainerBuilder().addTextDisplayComponents(text(content));

const errorView = (content: string) => view(notice(COLOR_RED, content));
const errorViewEphemeral = (content: string) => viewEphemeral(notice(COLOR_RED, content));

/** Section header: tiêu đề + ảnh bên phải (nếu có) */
function addHeader(container: ContainerBuilder, title: string, subtitle: string, thumbUrl?: string) {
  if (thumbUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(text(title), text(subtitle))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbUrl))
    );
  } else {
    container.addTextDisplayComponents(text(title), text(subtitle));
  }
  return container;
}

const unixNow = () => Math.floor(Date.now() / 1000);

// ==================== MODULE ====================
export default class TicketModule {
  name = 'ticket-module';
  description = 'Full-featured Ticket System';
  version = '2.0.0';
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
  private buildSetupView(lines: string[], finished = false) {
    const container = new ContainerBuilder();

    container
      .addTextDisplayComponents(text('# ⚙️ Thiết lập hệ thống ticket'))
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(text(lines.join('\n')));

    if (finished) {
      container
        .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
        .addTextDisplayComponents(
          text(
            [
              `### ${emojis.success} Khởi tạo cài đặt mặc định hoàn tất`,
              '• Để quản lí hoặc thêm một danh mục hỗ trợ, dùng `/ticket panel manage`',
              '• Để chỉnh sửa các cài đặt có sẵn, dùng `/ticket configuration`',
            ].join('\n')
          )
        );
    }

    return view(container);
  }

  // ---------- UI: panel tạo ticket ----------
  private buildPanelMessage() {
    const container = new ContainerBuilder().addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            text('# 🎫 Tạo ticket'),
            text('Để được hỗ trợ, vui lòng bấm nút **Tạo ticket** bên cạnh.')
          )
          .setButtonAccessory(
            new ButtonBuilder().setCustomId('ticket_create').setLabel('Tạo ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary)
          )
      )
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text('-# Máy chủ của TrầnTuấn.'));

    return { components: [container], flags: V2 } as const;
  }

  // ---------- UI: tin nhắn chào trong kênh ticket ----------
  private buildWelcomeMessage(opts: {
    userId: string;
    username: string;
    avatarUrl: string;
    staffRoleId: string;
    ticketNumber: string;
    issue: string;
  }) {
    const container = new ContainerBuilder();

    addHeader(
      container,
      '# 🎫 Khu vực hỗ trợ',
      'Chờ một chút và đội ngũ hỗ trợ sẽ đến hỗ trợ bạn nhé!\n-# Hãy đảm bảo bạn đã đọc kĩ luật khi tạo ticket.',
      opts.avatarUrl
    );

    container
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(
        text(
          [
            `🔢 **Ticket số:** \`${opts.ticketNumber}\``,
            `👤 **Người mở:** <@${opts.userId}> (${opts.username})`,
            `🕒 **Thời gian mở:** <t:${unixNow()}:f>`,
          ].join('\n')
        )
      )
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`### ${emojis.copy} Vấn đề của bạn\n${opts.issue}`))
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Nhận ticket').setEmoji('🎫').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Đóng ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_close_reason').setLabel('Đóng với lí do').setEmoji('📝').setStyle(ButtonStyle.Secondary)
        )
      )
      .addTextDisplayComponents(text(`-# Máy chủ của ${opts.username}.`));

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

    // Thông báo đóng ticket
    const deleteAt = unixNow() + 10;
    const closeContainer = new ContainerBuilder();

    closeContainer
      .addTextDisplayComponents(
        text('# 🔒 Ticket đã đóng'),
        text(`Ticket này đã được đóng bởi <@${i.user.id}>`)
      )
      .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(
        text(
          [
            `🆔 **ID Ticket:** \`${ticket.ticketId}\``,
            `👮 **Đóng bởi:** <@${i.user.id}>`,
            ...(reason ? [`📝 **Lý do:** ${reason}`] : []),
          ].join('\n')
        )
      )
      .addSeparatorComponents(divider())
      .addTextDisplayComponents(text(`-# ⏳ Kênh sẽ bị xóa <t:${deleteAt}:R>`));

    await i.editReply(view(closeContainer));

    // Gửi transcript vào kênh log
    const config = ticketManager.getConfig(i.guildId!);
    if (config?.logChannelId) {
      try {
        const logChannel = (await i.guild?.channels.fetch(config.logChannelId)) as TextChannel;
        const fileName = `${ticket.ticketId}-transcript.txt`;
        const file = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: fileName });

        const logContainer = new ContainerBuilder();

        logContainer
          .addTextDisplayComponents(
            text(`# ${emojis.copy} Transcript Ticket`),
            text(`-# ${ticket.ticketId}`)
          )
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(
            text(
              [
                `👤 **Tạo bởi:** <@${ticket.userId}>`,
                `👮 **Đóng bởi:** <@${i.user.id}>`,
                `⏱️ **Thời gian:** ${Math.floor((Date.now() - ticket.createdAt) / 1000 / 60)} phút`,
                `👥 **Người tham gia:** ${ticket.participants.length}`,
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

        const pending = `${emojis.loading} Đang chuẩn bị...`;
        const lines = [
          `\`[1/4]\` ${emojis.loading} Khởi tạo config...`,
          `\`[2/4]\` ${pending}`,
          `\`[3/4]\` ${pending}`,
          `\`[4/4]\` ${pending}`,
        ];

        await interaction.editReply(this.buildSetupView(lines));

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

        lines[0] = `\`[1/4]\` ${emojis.success} Khởi tạo config hoàn tất. Đã tạo kênh lưu lịch sử ticket (<#${transcriptChannel.id}>).`;
        lines[1] = `\`[2/4]\` ${emojis.loading} Tạo kênh hỗ trợ...`;
        await interaction.editReply(this.buildSetupView(lines));

        // STEP 2: Support channel
        await new Promise((resolve) => setTimeout(resolve, 500));

        const supportChannel = await guild.channels.create({
          name: '🎫| ticket',
          type: ChannelType.GuildText,
          parent: category,
        });

        lines[1] = `\`[2/4]\` ${emojis.success} Tạo kênh hỗ trợ hoàn tất. (<#${supportChannel.id}>).`;
        lines[2] = `\`[3/4]\` ${emojis.loading} Tạo ticket mặc định...`;
        await interaction.editReply(this.buildSetupView(lines));

        // STEP 3: Ticket panel
        await new Promise((resolve) => setTimeout(resolve, 500));

        const panelMessage = await supportChannel.send(this.buildPanelMessage());

        lines[2] = `\`[3/4]\` ${emojis.success} Tạo ticket mặc định tại kênh <#${supportChannel.id}> hoàn tất.`;
        lines[3] = `\`[4/4]\` ${emojis.loading} Tạo role hỗ trợ...`;
        await interaction.editReply(this.buildSetupView(lines));

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

        lines[3] = `\`[4/4]\` ${emojis.success} Tạo role hỗ trợ <@&${supportRole.id}> & gán quyền hoàn tất.`;
        await interaction.editReply(this.buildSetupView(lines, true));

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

        await interaction.reply(view(notice(COLOR_TEAL, `${emojis.success} Đã thêm <@${user.id}> vào ticket`)));
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

        await interaction.reply(view(notice(COLOR_TEAL, `${emojis.success} Đã xóa <@${user.id}> khỏi ticket`)));
      },
    };

    // ==================== /ticket-stats ====================
    const statsCommand = {
      data: new SlashCommandBuilder().setName('ticket-stats').setDescription('Xem thống kê ticket'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const stats = ticketManager.getStats(interaction.guildId!);

        const container = new ContainerBuilder();

        addHeader(
          container,
          `# ${emojis.chart} Thống kê Ticket`,
          `-# ${interaction.guild?.name ?? ''}`,
          interaction.guild?.iconURL({ size: 256 }) ?? undefined
        );

        container
          .addSeparatorComponents(divider(SeparatorSpacingSize.Large))
          .addTextDisplayComponents(
            text(
              [
                `📨 **Tổng ticket:** \`${stats.total}\``,
                `🟢 **Đang mở:** \`${stats.open}\``,
                `🔴 **Đã đóng:** \`${stats.closed}\``
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
        } else if (interaction.customId === 'ticket_close_reason') {
          await this.handleTicketCloseWithReason(interaction);
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
      const ticket = ticketManager.createTicket(interaction.guildId!, channel.id, interaction.user.id);

      // Tin nhắn chào trong kênh ticket
      await channel.send(
        this.buildWelcomeMessage({
          userId: interaction.user.id,
          username: interaction.user.username,
          avatarUrl: interaction.user.displayAvatarURL({ size: 256 }),
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

