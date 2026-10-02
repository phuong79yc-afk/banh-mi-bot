// Ticket Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  CategoryChannel,
  ButtonInteraction,
  Message,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from 'discord.js';
import { ticketManager } from './TicketManager';
import { emojis } from '../../config/emojis';
import { createEnhancedEmbed } from '../../utils/embedHelper';

export default class TicketModule {
  name = 'ticket-module';
  description = 'Full-featured Ticket System';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`⏳ Ticket module initializing...`);
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Ticket module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /ticket-setup
    const setupCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Thiết lập hệ thống ticket lần đầu')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
          option
            .setName('force')
            .setDescription('Buộc setup lại từ đầu (xóa config cũ)')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        // DEFER IMMEDIATELY to prevent timeout
        await interaction.deferReply(); // Public message
        
        const force = interaction.options.getBoolean('force') ?? false;

        // Check if already configured
        const existingConfig = ticketManager.getConfig(interaction.guild!.id);
        if (existingConfig && !force) {
          return interaction.editReply({
            content: `Server này đã thiết lập hệ thống ticket. Nếu bạn muốn thiết lập lại, sử dụng tùy chọn \`force=True\`.`
          });
        }

        // Create progress embed (4 steps)
        const progressEmbed = createEnhancedEmbed({
          title: 'Thiết lập hệ thống ticket',
          description: 
            `\`[1/4]\` ${emojis.loading} Khởi tạo config...\n` +
            `\`[2/4]\` ${emojis.loading} Đang chuẩn bị...\n` +
            `\`[3/4]\` ${emojis.loading} Đang chuẩn bị...\n` +
            `\`[4/4]\` ${emojis.loading} Đang chuẩn bị...`,
          color: 0x1ABC9C, // Light purple
          timestamp: false,
        });
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 1: Create category + transcript channel
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const category = await interaction.guild?.channels.create({
          name: '🎫| Hỗ Trợ',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          }]
        });

        const transcriptChannel = await interaction.guild?.channels.create({
          name: '🎫| transcripts',
          type: ChannelType.GuildText,
          parent: category,
          permissionOverwrites: [
            { id: interaction.guild!.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.guild!.roles.everyone.id, deny: [PermissionsBitField.Flags.SendMessages] }
          ]
        });

        progressEmbed.setDescription(
          `\`[1/4]\` ${emojis.success} Khởi tạo config hoàn tất. Đã tạo kênh lưu lịch sử ticket (<#${transcriptChannel!.id}>).\n` +
          `\`[2/4]\` ${emojis.loading} Tạo kênh hỗ trợ...\n` +
          `\`[3/4]\` ${emojis.loading} Đang chuẩn bị...\n` +
          `\`[4/4]\` ${emojis.loading} Đang chuẩn bị...`
        );
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 2: Create support channel
        await new Promise(resolve => setTimeout(resolve, 500));

        const supportChannel = await interaction.guild?.channels.create({
          name: '🎫| ticket',
          type: ChannelType.GuildText,
          parent: category
        });

        progressEmbed.setDescription(
          `\`[1/4]\` ${emojis.success} Khởi tạo config hoàn tất. Đã tạo kênh lưu lịch sử ticket (<#${transcriptChannel!.id}>).\n` +
          `\`[2/4]\` ${emojis.success} Tạo kênh hỗ trợ hoàn tất. (<#${supportChannel!.id}>).\n` +
          `\`[3/4]\` ${emojis.loading} Tạo ticket mặc định...\n` +
          `\`[4/4]\` ${emojis.loading} Đang chuẩn bị...`
        );
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 3: Create ticket panel
        await new Promise(resolve => setTimeout(resolve, 500));

        const panelEmbed = createEnhancedEmbed({
          title: 'Tạo ticket',
          description: 
            'Để được hỗ trợ, vui lòng bấm `:🎫:Tạo ticket`ở phía dưới.\n\n' +
            'Máy chủ của TrầnTuấn.',
          color: 0x1ABC9C, // Discord blurple
          footer: '',
          timestamp: false,
        });

        const button = new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('🎫 Tạo ticket')
          .setStyle(ButtonStyle.Primary); // Green button

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        const panelMessage = await supportChannel!.send({ embeds: [panelEmbed], components: [row] });

        progressEmbed.setDescription(
          `\`[1/4]\` ${emojis.success} Khởi tạo config hoàn tất. Đã tạo kênh lưu lịch sử ticket (<#${transcriptChannel!.id}>).\n` +
          `\`[2/4]\` ${emojis.success} Tạo kênh hỗ trợ hoàn tất. (<#${supportChannel!.id}>).\n` +
          `\`[3/4]\` ${emojis.success} Tạo ticket mặc định tại kênh <#${supportChannel!.id}> hoàn tất.\n` +
          `\`[4/4]\` ${emojis.loading} Tạo role hỗ trợ...`
        );
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 4: Create support role + permissions
        await new Promise(resolve => setTimeout(resolve, 500));

        const supportRole = await interaction.guild?.roles.create({
          name: 'Hỗ trợ Ticket',
          color: 0x1ABC9C,
          permissions: [],
          mentionable: true
        });

        await transcriptChannel!.permissionOverwrites.create(supportRole!, {
          ViewChannel: true,
          SendMessages: false,
          ReadMessageHistory: true
        });

        // Save config
        ticketManager.updateConfig(interaction.guild!.id, {
          categoryId: category!.id,
          staffRoleId: supportRole!.id,
          ticketMessageChannelId: supportChannel!.id,
          ticketMessageId: panelMessage!.id,
          logChannelId: transcriptChannel!.id
        });

        // Reset ticket counter if force setup
        if (force) {
          ticketManager.resetCounter(interaction.guild!.id);
        }

        // Final success embed
        const successEmbed = createEnhancedEmbed({
          title: 'Thiết lập hệ thống ticket',
          description: 
            `\`[1/4]\` ${emojis.success} Khởi tạo config hoàn tất. Đã tạo kênh lưu lịch sử ticket (<#${transcriptChannel!.id}>).\n` +
            `\`[2/4]\` ${emojis.success} Tạo kênh hỗ trợ hoàn tất. (<#${supportChannel!.id}>).\n` +
            `\`[3/4]\` ${emojis.success} Tạo ticket mặc định tại kênh <#${supportChannel!.id}> hoàn tất.\n` +
            `\`[4/4]\` ${emojis.success} Tạo role hỗ trợ <@&${supportRole!.id}> & gán quyền hoàn tất.\n\n` +
            `**Khởi tạo cài đặt mặc định hoàn tất.**\n` +
            `• Để quản lí hoặc thêm một danh mục hỗ trợ, sử dụng \`/ticket panel manage\`\n` +
            `• Để chỉnh sửa các cài đặt có sẵn, sử dụng \`/ticket configuration\``,
          color:   0x2B2D31, // Discord blurple
          timestamp: false,
        });
        await interaction.editReply({ embeds: [successEmbed] });

        // Cleanup old resources (background, 3s delay)
        if (force && existingConfig) {
          setTimeout(async () => {
            try {
              console.log(`${emojis.delete} Starting cleanup of ALL old ticket resources...`);

              // Delete ALL roles named "Hỗ trợ Ticket" (except the new one)
              const allRoles = await interaction.guild?.roles.fetch();
              const ticketRoles = allRoles?.filter(r => r.name === 'Hỗ trợ Ticket' && r.id !== supportRole!.id);
              if (ticketRoles && ticketRoles.size > 0) {
                console.log(`${emojis.delete} Found ${ticketRoles.size} old "Hỗ trợ Ticket" roles to delete`);
                for (const [, role] of ticketRoles) {
                  await role.delete('Ticket setup: cleanup old resources').catch(() => {});
                  console.log(`  ${emojis.success} Deleted role: ${role.name} (${role.id})`);
                }
              }

              // Delete ALL categories named "🎫 TICKETS" or "🎫| Hỗ Trợ" (except the new one)
              const allChannels = await interaction.guild?.channels.fetch();
              const ticketCategories = allChannels?.filter(ch => 
                ch?.type === ChannelType.GuildCategory && 
                (ch?.name === '🎫 TICKETS' || ch?.name === '🎫| Hỗ Trợ') &&
                ch?.id !== category!.id
              );
              if (ticketCategories && ticketCategories.size > 0) {
                console.log(`${emojis.delete} Found ${ticketCategories.size} old "🎫 TICKETS" categories to delete`);
                for (const [, cat] of ticketCategories) {
                  // Delete all channels inside this category first
                  const channelsInCat = allChannels?.filter(ch => ch?.parentId === cat!.id);
                  if (channelsInCat && channelsInCat.size > 0) {
                    console.log(`  ${emojis.delete} Deleting ${channelsInCat.size} channels in category ${cat!.name}`);
                    for (const [, ch] of channelsInCat) {
                      await ch?.delete('Ticket setup: cleanup old resources').catch(() => {});
                      console.log(`    ${emojis.success} Deleted channel: ${ch?.name}`);
                    }
                  }
                  await cat?.delete('Ticket setup: cleanup old resources').catch(() => {});
                  console.log(`  ${emojis.success} Deleted category: ${cat!.name} (${cat!.id})`);
                }
              }

              // Delete ALL channels named "transcripts" or "ticket-support" (except the new ones)
              const oldTranscripts = allChannels?.filter(ch => 
                (ch?.name === 'transcripts' || ch?.name === '🎫| transcripts') && 
                ch?.id !== transcriptChannel!.id
              );
              if (oldTranscripts && oldTranscripts.size > 0) {
                console.log(`${emojis.delete} Found ${oldTranscripts.size} old "transcripts" channels to delete`);
                for (const [, ch] of oldTranscripts) {
                  await ch?.delete('Ticket setup: cleanup old resources').catch(() => {});
                  console.log(`  ${emojis.success} Deleted channel: ${ch?.name} (${ch?.id})`);
                }
              }

              const oldSupports = allChannels?.filter(ch => 
                (ch?.name === 'ticket-support' || ch?.name === '🎫| ticket') && 
                ch?.id !== supportChannel!.id
              );
              if (oldSupports && oldSupports.size > 0) {
                console.log(`${emojis.delete} Found ${oldSupports.size} old "ticket-support" channels to delete`);
                for (const [, ch] of oldSupports) {
                  await ch?.delete('Ticket setup: cleanup old resources').catch(() => {});
                  console.log(`  ${emojis.success} Deleted channel: ${ch?.name} (${ch?.id})`);
                }
              }

              console.log(`${emojis.success} Cleaned up ALL old ticket resources`);
            } catch (error) {
              console.error('${emojis.error} Error cleaning up old resources:', error);
            }
          }, 3000); // Wait 3 seconds after interaction completes
        }
      }
    };

    // /ticket-close
    const closeCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('${emojis.lock} Đóng ticket hiện tại')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Lý do đóng ticket')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const ticket = ticketManager.getTicket(interaction.channelId);
        
        if (!ticket) {
          return interaction.reply({
            content: '${emojis.error} Đây không phải là kênh ticket!',
            flags: 64 // ephemeral
          });
        }

        const reason = interaction.options.getString('reason') || 'Không có lý do';

        await interaction.deferReply();

        // Generate transcript
        const channel = interaction.channel as TextChannel;
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages
          .reverse()
          .map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`)
          .join('\n');

        // Close ticket in database
        ticketManager.closeTicket(interaction.channelId, interaction.user.id);

        // Send closing embed
        const closeEmbed = createEnhancedEmbed({
          title: '${emojis.lock} Ticket đã đóng',
          description: `Ticket này đã được đóng bởi <@${interaction.user.id}>`,
          color: 0x1ABC9C, // Light purple
          fields: [
            { name: 'ID Ticket', value: ticket.ticketId, inline: true },
            { name: 'Đóng bởi', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Lý do', value: reason, inline: false }
          ],
          footer: 'Kênh sẽ bị xóa sau 10 giây...'
        });

        await interaction.editReply({ embeds: [closeEmbed] });

        // Send transcript to log channel
        const config = ticketManager.getConfig(interaction.guildId!);
        if (config?.logChannelId) {
          try {
            const logChannel = await interaction.guild?.channels.fetch(config.logChannelId) as TextChannel;
            
            const logEmbed = createEnhancedEmbed({
              title: `${emojis.copy} Transcript Ticket - ${ticket.ticketId}`,
              description: `**Tạo bởi:** <@${ticket.userId}>\n**Đóng bởi:** <@${interaction.user.id}>`,
          color: 0x1ABC9C, // Light purple
              fields: [
                { name: 'Thời gian', value: `${Math.floor((Date.now() - ticket.createdAt) / 1000 / 60)} phút`, inline: true },
                { name: 'Người tham gia', value: `${ticket.participants.length}`, inline: true }
              ]
            });

            // Create transcript file
            const buffer = Buffer.from(transcript, 'utf-8');
            
            await logChannel.send({
              embeds: [logEmbed],
              files: [{
                attachment: buffer,
                name: `${ticket.ticketId}-transcript.txt`
              }]
            });
          } catch (error) {
            console.error('Failed to send transcript:', error);
          }
        }

        // Delete channel after 10 seconds
        setTimeout(async () => {
          try {
            await channel.delete();
            ticketManager.deleteTicket(interaction.channelId);
          } catch (error) {
            console.error('Failed to delete ticket channel:', error);
          }
        }, 10000);
      }
    };

    // /ticket-add
    const addCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-add')
        .setDescription(' Thêm người dùng vào ticket')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để thêm vào ticket')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const ticket = ticketManager.getTicket(interaction.channelId);
        
        if (!ticket) {
          return interaction.reply({
            content: '${emojis.error} Đây không phải là kênh ticket!',
            flags: 64 // ephemeral
          });
        }

        const user = interaction.options.getUser('user', true);
        const channel = interaction.channel as TextChannel;

        // Add permissions
        await channel.permissionOverwrites.create(user, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });

        // Add to database
        ticketManager.addParticipant(interaction.channelId, user.id);

        await interaction.reply({
          content: `${emojis.success} Đã thêm <@${user.id}> vào ticket`
        });
      }
    };

    // /ticket-remove
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-remove')
        .setDescription(' Xóa người dùng khỏi ticket')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Người dùng để xóa khỏi ticket')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const ticket = ticketManager.getTicket(interaction.channelId);
        
        if (!ticket) {
          return interaction.reply({
            content: '${emojis.error} Đây không phải là kênh ticket!',
            flags: 64 // ephemeral
          });
        }

        const user = interaction.options.getUser('user', true);
        
        if (user.id === ticket.userId) {
          return interaction.reply({
            content: '${emojis.error} Không thể xóa người tạo ticket!',
            flags: 64 // ephemeral
          });
        }

        const channel = interaction.channel as TextChannel;

        // Remove permissions
        await channel.permissionOverwrites.delete(user);

        // Remove from database
        ticketManager.removeParticipant(interaction.channelId, user.id);

        await interaction.reply({
          content: `${emojis.success} Đã xóa <@${user.id}> khỏi ticket`
        });
      }
    };

    // /ticket-stats
    const statsCommand = {
      data: new SlashCommandBuilder()
        .setName('ticket-stats')
        .setDescription('${emojis.chart} Xem thống kê ticket'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const stats = ticketManager.getStats(interaction.guildId!);
        
        await interaction.reply({ 
          content: `${emojis.chart} **Thống kê Ticket**\n📨 Tổng Ticket: ${stats.total}\n🟢 Đang mở: ${stats.open}\n🔴 Đã đóng: ${stats.closed}`,
          flags: 64 
        });
      }
    };

    this.commands.set('ticket-setup', setupCommand);
    this.commands.set('ticket-close', closeCommand);
    this.commands.set('ticket-add', addCommand);
    this.commands.set('ticket-remove', removeCommand);
    this.commands.set('ticket-stats', statsCommand);
  }

  private registerEvents() {
    // Handle button interactions
    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId === 'ticket_create') {
          await this.handleTicketCreate(interaction as ButtonInteraction);
        } else if (interaction.customId === 'ticket_claim') {
          await this.handleTicketClaim(interaction as ButtonInteraction);
        } else if (interaction.customId === 'ticket_close_button') {
          await this.handleTicketCloseButton(interaction as ButtonInteraction);
        } else if (interaction.customId === 'ticket_close_reason') {
          await this.handleTicketCloseWithReason(interaction as ButtonInteraction);
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
    // Show modal to get issue description
    const modal = new ModalBuilder()
      .setCustomId('ticket_create_modal')
      .setTitle('Tạo Ticket Hỗ Trợ');

    const issueInput = new TextInputBuilder()
      .setCustomId('issue_description')
      .setLabel('Vấn đề của bạn')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Mô tả vấn đề bạn gặp phải...')
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(1000);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(issueInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  private async handleTicketCreateModal(interaction: ModalSubmitInteraction) {
    // DEFER IMMEDIATELY to prevent timeout
    await interaction.deferReply({ flags: 64 }); // 64 = ephemeral

    const issueDescription = interaction.fields.getTextInputValue('issue_description');

    const config = ticketManager.getConfig(interaction.guildId!);
    
    if (!config || !config.enabled) {
      return interaction.editReply({
        content: '${emojis.error} Hệ thống ticket chưa được cấu hình!'
      });
    }

    // Check if user already has an open ticket
    const existing = ticketManager.getTicketByUser(interaction.guildId!, interaction.user.id);
    if (existing) {
      return interaction.editReply({
        content: `${emojis.error} Bạn đã có một ticket đang mở: <#${existing.channelId}>`
      });
    }

    try {
      // Ensure guild is fully loaded
      const guild = interaction.guild!;
      await guild.members.fetch(interaction.user.id); // Ensure user is cached
      await guild.roles.fetch(config.staffRoleId!); // Ensure staff role is cached
      
      // Create ticket channel
      const category = await guild.channels.fetch(config.categoryId!) as CategoryChannel;
      const ticketId = `ticket-${(ticketManager.getStats(interaction.guildId!).total + 1).toString().padStart(4, '0')}`;
      
      const channel = await guild.channels.create({
        name: `${ticketId}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          },
          {
            id: config.staffRoleId!,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages
            ]
          }
        ]
      });

      // Save ticket to database
      const ticket = ticketManager.createTicket(
        interaction.guildId!,
        channel!.id,
        interaction.user.id
      );

      // Send welcome message in ticket channel
      const welcomeEmbed = createEnhancedEmbed({
        title: '🎫 Khu vực hỗ trợ',
        description: 
          `Chờ một chút và đội ngũ hỗ trợ sẽ đến hỗ trợ bạn nhé! Và hãy đảm bảo rằng bạn đã đọc kĩ luật khi tạo ticket.\n\n` +
          `**Ticket số** | **Người mở ticket** | **Thời gian mở**\n` +
          `${ticket.ticketId.split('-')[1]} | <@${interaction.user.id}> (${interaction.user.username}) | <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
          `*Máy chủ của ${interaction.user.username}.*`,
        color: 0x1ABC9C,
        timestamp: false,
      });

      const infoEmbed = createEnhancedEmbed({
        title: '${emojis.copy} Thông tin ticket',
        description: `**Vấn đề của bạn**\n${issueDescription}`,
        color: 0xFEE75C,
        timestamp: false,
      });

      const claimButton = new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('🎫 Nhận ticket')
        .setStyle(ButtonStyle.Primary);

      const closeButton = new ButtonBuilder()
        .setCustomId('ticket_close_button')
        .setLabel('${emojis.lock} Đóng ticket')
        .setStyle(ButtonStyle.Primary);

      const closeWithReasonButton = new ButtonBuilder()
        .setCustomId('ticket_close_reason')
        .setLabel('${emojis.lock} Đóng với lí do')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        claimButton,
        closeButton,
        closeWithReasonButton
      );

      await channel.send({
        content: `Cảm ơn <@${interaction.user.id}> đã mở ticket! <@&${config.staffRoleId}> sẽ hỗ trợ bạn sớm nhất có thể ${emojis.art}${emojis.sparkles}`,
        embeds: [welcomeEmbed, infoEmbed],
        components: [row]
      });

      // Reply to user
      const successEmbed = createEnhancedEmbed({
        description: `${emojis.success} Ticket của bạn đã được tạo: <#${channel.id}>`,
        color: 0x1ABC9C, // Discord blurple
      });

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.editReply({
        content: '** Không thể tạo ticket. Vui lòng liên hệ quản trị viên.**'
      });
    }
  }

  private async handleTicketCloseButton(interaction: ButtonInteraction) {
    // DEFER IMMEDIATELY to prevent timeout
    await interaction.deferReply();

    const ticket = ticketManager.getTicket(interaction.channelId);
    if (!ticket) {
      return interaction.editReply({
        content: '${emojis.error} Không tìm thấy ticket!'
      });
    }

    // Generate transcript
    const channel = interaction.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`)
      .join('\n');

    // Close ticket
    ticketManager.closeTicket(interaction.channelId, interaction.user.id);

    const closeEmbed = createEnhancedEmbed({
      title: '`**Ticket đã đóng**`',
      description: ` **Ticket** này đã được đóng bởi <@${interaction.user.id}>`,
      color: 0x1ABC9C, // Discord blurple
      fields: [
        { name: 'ID', value: ticket.ticketId, inline: true },
        { name: 'Đóng bởi', value: `<@${interaction.user.id}>`, inline: true }
      ],
      footer: 'Kênh sẽ bị xóa sau **10 giây...**'
    });

    await interaction.editReply({ embeds: [closeEmbed] });

    // Send transcript
    const config = ticketManager.getConfig(interaction.guildId!);
    if (config?.logChannelId) {
      try {
        const logChannel = await interaction.guild?.channels.fetch(config.logChannelId) as TextChannel;
        const buffer = Buffer.from(transcript, 'utf-8');
        
        await logChannel.send({
          content: `${emojis.copy} Transcript cho ${ticket.ticketId}`,
          files: [{ attachment: buffer, name: `${ticket.ticketId}.txt` }]
        });
      } catch (e) {
        console.error('Failed to send transcript:', e);
      }
    }

    // Delete channel
    setTimeout(async () => {
      try {
        await channel.delete();
        ticketManager.deleteTicket(interaction.channelId);
      } catch (e) {
        console.error('Failed to delete channel:', e);
      }
    }, 10000);
  }

  private async handleTicketCloseWithReason(interaction: ButtonInteraction) {
    // Show modal to get close reason
    const modal = new ModalBuilder()
      .setCustomId('ticket_close_modal')
      .setTitle('Đóng Ticket');

    const reasonInput = new TextInputBuilder()
      .setCustomId('close_reason')
      .setLabel('Lý do đóng ticket')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Nhập lý do đóng ticket...')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(500);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }

  private async handleTicketCloseModal(interaction: ModalSubmitInteraction) {
    // DEFER IMMEDIATELY
    await interaction.deferReply();

    const ticket = ticketManager.getTicket(interaction.channelId!);
    if (!ticket) {
      return interaction.editReply({
        content: '${emojis.error} Không tìm thấy ticket!'
      });
    }

    const reason = interaction.fields.getTextInputValue('close_reason');

    // Generate transcript
    const channel = interaction.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`)
      .join('\n');

    // Close ticket
    ticketManager.closeTicket(interaction.channelId!, interaction.user.id);

    const closeEmbed = createEnhancedEmbed({
      title: '${emojis.lock} Ticket đã đóng',
      description: `Ticket này đã được đóng bởi <@${interaction.user.id}>`,
      color: 0x1ABC9C,
      fields: [
        { name: 'ID', value: ticket.ticketId, inline: true },
        { name: 'Đóng bởi', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Lý do', value: reason, inline: false }
      ],
      footer: 'Kênh sẽ bị xóa sau 10 giây...'
    });

    await interaction.editReply({ embeds: [closeEmbed] });

    // Send transcript
    const config = ticketManager.getConfig(interaction.guildId!);
    if (config?.logChannelId) {
      try {
        const logChannel = await interaction.guild?.channels.fetch(config.logChannelId) as TextChannel;
        const buffer = Buffer.from(transcript, 'utf-8');
        
        const logEmbed = createEnhancedEmbed({
          title: `${emojis.copy}  **Transcript Ticket** - ${ticket.ticketId}`,
          description: `**Tạo bởi:** <@${ticket.userId}>\n**Đóng bởi:** <@${interaction.user.id}>`,
          color: 'info',
          fields: [
            { name: 'Thời gian', value: `${Math.floor((Date.now() - ticket.createdAt) / 1000 / 60)} phút`, inline: true },
            { name: 'Người tham gia', value: `${ticket.participants.length}`, inline: true },
            { name: 'Lý do đóng', value: reason, inline: false }
          ]
        });

        await logChannel.send({
          embeds: [logEmbed],
          files: [{ attachment: buffer, name: `${ticket.ticketId}.txt` }]
        });
      } catch (e) {
        console.error('Failed to send transcript:', e);
      }
    }

    // Delete channel
    setTimeout(async () => {
      try {
        await channel.delete();
        ticketManager.deleteTicket(interaction.channelId!);
      } catch (e) {
        console.error('Failed to delete channel:', e);
      }
    }, 10000);
  }

  private async handleTicketClaim(interaction: ButtonInteraction) {
    // DEFER IMMEDIATELY to prevent timeout
    await interaction.deferReply();

    const ticket = ticketManager.getTicket(interaction.channelId);
    if (!ticket) {
      return interaction.editReply({
        content: '${emojis.error} Không tìm thấy ticket!'
      });
    }

    const claimEmbed = createEnhancedEmbed({
      description: `${emojis.success} <@${interaction.user.id}> đã nhận ticket này và sẽ** hỗ trợ **bạn!`,
      color: 0x1ABC9C, // Discord blurple
    });

    await interaction.editReply({ embeds: [claimEmbed] });
  }

  async cleanup() {
    console.log('🧹 Ticket module cleanup');
  }
}
