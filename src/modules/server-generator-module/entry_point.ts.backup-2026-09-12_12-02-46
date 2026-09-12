/**
 * Server Generator Module - AI-powered Discord server setup
 * Using Components V2 for modern layout
 */

import { 
  Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction,
  PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder,
  TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  MessageFlags, SectionBuilder, ContainerBuilder, TextDisplayBuilder,
  EmbedBuilder
} from 'discord.js';
import { emojis } from '../../config/emojis';
import Groq from 'groq-sdk';
import { keyRotator } from '../../utils/aiKeyRotator';

export default class ServerGeneratorModule {
  name = 'server-generator-module';
  description = 'AI-powered Discord server setup generator';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private groq: Groq | null = null;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    const apiKey = keyRotator.getGroqKey();
    if (apiKey) {
      this.groq = new Groq({ apiKey });
      console.log('  ✅ Groq AI initialized for server generator');
    }

    this.registerCommands();
    this.setupEventHandlers();
    console.log(`${emojis.success} Server Generator module registered ${this.commands.size} command(s)`);
  }

  private registerCommands() {
    const generatorCommand = {
      data: new SlashCommandBuilder()
        .setName('generator')
        .setDescription(`${emojis.sparkles} AI-powered Discord server generator`)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
          return interaction.reply({
            content: `${emojis.error} This command can only be used in a server!`,
            flags: 64
          });
        }

        const settingsEmbed = new EmbedBuilder()
          .setTitle('Setting')
          .setColor(0x2B2D31)
          .setDescription(
            `**Prompt:**\n` +
            `\`\`\`\nMáy chủ cơ bản với đầy đủ tính năng\n\`\`\`\n\n` +
            `**Enhanced Prompt**\n\n` +
            `**Enhanced Result**`
          );

        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_prompt_${interaction.user.id}`)
              .setLabel('Đổi Prompt')
              .setStyle(ButtonStyle.Success)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_prompt_${interaction.user.id}`)
              .setLabel('Enable')
              .setStyle(ButtonStyle.Success)
          );

        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_result_${interaction.user.id}`)
              .setLabel('Enable')
              .setStyle(ButtonStyle.Success)
          );

        const row4 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_start_${interaction.user.id}`)
              .setLabel('Start')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`gen_exit_${interaction.user.id}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Danger)
          );

        await interaction.reply({
          embeds: [settingsEmbed],
          components: [row1, row2, row3, row4]
        });

        (this as any).tempSettings = (this as any).tempSettings || new Map();
        (this as any).tempSettings.set(interaction.user.id, {
          prompt: 'Máy chủ cơ bản với đầy đủ tính năng',
          enhancedPrompt: true,
          enhancedResult: true
        });
      }
    };

    this.commands.set('generator', generatorCommand);
  }

  private setupEventHandlers() {
    // Handle modals
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_prompt_modal_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      const newPrompt = interaction.fields.getTextInputValue('prompt');
      
      const settings = (this as any).tempSettings?.get(interaction.user.id) || {
        enhancedPrompt: true,
        enhancedResult: true
      };
      settings.prompt = newPrompt;
      (this as any).tempSettings?.set(interaction.user.id, settings);

      const settingsEmbed = new EmbedBuilder()
        .setTitle('Setting')
        .setColor(0x2B2D31)
        .setDescription(
          `**Prompt:**\n` +
          `\`\`\`\n${newPrompt}\n\`\`\`\n\n` +
          `**Enhanced Prompt**\n\n` +
          `**Enhanced Result**`
        );

      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_prompt_${interaction.user.id}`)
            .setLabel('Đổi Prompt')
            .setStyle(ButtonStyle.Success)
        );

      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_enhanced_prompt_${interaction.user.id}`)
            .setLabel(settings.enhancedPrompt ? 'Disable' : 'Enable')
            .setStyle(settings.enhancedPrompt ? ButtonStyle.Danger : ButtonStyle.Success)
        );

      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_enhanced_result_${interaction.user.id}`)
            .setLabel(settings.enhancedResult ? 'Disable' : 'Enable')
            .setStyle(settings.enhancedResult ? ButtonStyle.Danger : ButtonStyle.Success)
        );

      const row4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_start_${interaction.user.id}`)
            .setLabel('Start')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`gen_exit_${interaction.user.id}`)
            .setLabel('Exit')
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.update({
        embeds: [settingsEmbed],
        components: [row1, row2, row3, row4]
      });
    });

    // Handle select menus
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isStringSelectMenu()) return;
      if (!interaction.customId.startsWith('gen_template_select_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      const templates: Record<string, string> = {
        gaming: `Server game chuyên nghiệp với các kênh:
- Voice channels cho từng game
- Ranks: Owner, Admin, Moderator, VIP, Member
- Text channels: announcements, general, game-chat, voice-chat, media
- Có category riêng cho từng game phổ biến`,
        
        community: `Cộng đồng thân thiện và gắn kết:
- Roles: Founder, Admin, Moderator, Helper, Active Member, Member
- Channels: welcome, rules, announcements, general, chat, introductions, events, feedback
- Category cho các hoạt động: Gaming, Media, Support`,
        
        study: `Server học tập và trao đổi kiến thức:
- Roles: Admin, Teacher, Student, Helper
- Channels: announcements, rules, study-general, homework-help, resources, q&a, study-rooms
- Category theo môn học: Math, Science, Languages, Programming`,
        
        business: `Server chuyên nghiệp và tổ chức:
- Roles: CEO, Manager, Team Lead, Employee, Client
- Channels: announcements, general, meetings, projects, resources, reports
- Category: Departments, Projects, HR`,
        
        creative: `Server sáng tạo nội dung và nghệ thuật:
- Roles: Admin, Artist, Content Creator, Designer, Member
- Channels: showcase, feedback, wip, resources, collaborations, commissions
- Category: Art, Music, Video, Writing`,
        
        social: `Server kết nối bạn bè và giải trí:
- Roles: Admin, Moderator, Active, VIP, Member
- Channels: welcome, rules, chat, memes, media, music, games, voice-chat
- Category: Fun, Events, Voice Channels`
      };

      const selectedTemplate = interaction.values[0];
      const prompt = templates[selectedTemplate] || 'Máy chủ cơ bản với đầy đủ tính năng';

      const settings = (this as any).tempSettings?.get(interaction.user.id) || {
        language: 'vi',
        complexity: 'balanced',
        categories: true,
        permissions: 'basic'
      };
      settings.prompt = prompt;
      (this as any).tempSettings?.set(interaction.user.id, settings);

      const settingsEmbed = new EmbedBuilder()
        .setTitle('⚙️ Server Generator - Settings')
        .setDescription(
          `### 📝 Prompt\n` +
          `\`\`\`\n${prompt}\n\`\`\`\n` +
          `### ✨ Options\n` +
          `> **Language:** \`${settings.language === 'vi' ? 'Vietnamese' : 'English'}\`\n` +
          `> **Complexity:** \`${settings.complexity.charAt(0).toUpperCase() + settings.complexity.slice(1)}\`\n` +
          `> **Categories:** \`${settings.categories ? 'Enabled' : 'Disabled'}\`\n` +
          `> **Permissions:** \`${settings.permissions.charAt(0).toUpperCase() + settings.permissions.slice(1)}\`\n\n` +
          `*Nhấn Start để bắt đầu tạo server design*`
        )
        .setColor(0x57F287)
        .setFooter({ text: `✅ Template "${selectedTemplate}" đã được chọn` })
        .setTimestamp();

      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_prompt_${interaction.user.id}`)
            .setLabel('Đổi Prompt')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`gen_templates_${interaction.user.id}`)
            .setLabel('Templates')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_options_${interaction.user.id}`)
            .setLabel('Options')
            .setStyle(ButtonStyle.Secondary)
        );

      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gen_start_${interaction.user.id}`)
            .setLabel('Start')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`gen_exit_${interaction.user.id}`)
            .setLabel('Exit')
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.update({
        embeds: [settingsEmbed],
        components: [row1, row2, row3]
      });
    });

    // Handle buttons
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isButton()) return;
      
      const parts = interaction.customId.split('_');
      const userId = parts.pop();
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: `${emojis.error} This is not your button!`,
          flags: 64
        });
      }

      const action = parts.join('_');

      // Change prompt
      if (action === 'gen_prompt') {
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
        const modal = new ModalBuilder()
          .setCustomId(`gen_prompt_modal_${interaction.user.id}`)
          .setTitle('Đổi Prompt')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>()
              .addComponents(
                new TextInputBuilder()
                  .setCustomId('prompt')
                  .setLabel('Prompt mới')
                  .setPlaceholder('Nhập mô tả server của bạn...')
                  .setStyle(TextInputStyle.Paragraph)
                  .setValue(settings.prompt || 'Máy chủ cơ bản với đầy đủ tính năng')
                  .setRequired(true)
              )
          );

        await interaction.showModal(modal);
        return;
      }

      // Toggle enhanced prompt
      if (action === 'gen_enhanced_prompt') {
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
        settings.enhancedPrompt = !settings.enhancedPrompt;
        (this as any).tempSettings?.set(interaction.user.id, settings);

        const settingsEmbed = new EmbedBuilder()
          .setTitle('Setting')
          .setColor(0x2B2D31)
          .setDescription(
            `**Prompt:**\n` +
            `\`\`\`\n${settings.prompt || 'Máy chủ cơ bản với đầy đủ tính năng'}\n\`\`\`\n\n` +
            `**Enhanced Prompt**\n\n` +
            `**Enhanced Result**`
          );

        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_prompt_${interaction.user.id}`)
              .setLabel('Đổi Prompt')
              .setStyle(ButtonStyle.Success)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_prompt_${interaction.user.id}`)
              .setLabel(settings.enhancedPrompt ? 'Disable' : 'Enable')
              .setStyle(settings.enhancedPrompt ? ButtonStyle.Danger : ButtonStyle.Success)
          );

        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_result_${interaction.user.id}`)
              .setLabel(settings.enhancedResult ? 'Disable' : 'Enable')
              .setStyle(settings.enhancedResult ? ButtonStyle.Danger : ButtonStyle.Success)
          );

        const row4 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_start_${interaction.user.id}`)
              .setLabel('Start')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`gen_exit_${interaction.user.id}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Danger)
          );

        return interaction.update({
          embeds: [settingsEmbed],
          components: [row1, row2, row3, row4]
        });
      }

      // Toggle enhanced result
      if (action === 'gen_enhanced_result') {
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
        settings.enhancedResult = !settings.enhancedResult;
        (this as any).tempSettings?.set(interaction.user.id, settings);

        const settingsEmbed = new EmbedBuilder()
          .setTitle('Setting')
          .setColor(0x2B2D31)
          .setDescription(
            `**Prompt:**\n` +
            `\`\`\`\n${settings.prompt || 'Máy chủ cơ bản với đầy đủ tính năng'}\n\`\`\`\n\n` +
            `**Enhanced Prompt**\n\n` +
            `**Enhanced Result**`
          );

        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_prompt_${interaction.user.id}`)
              .setLabel('Đổi Prompt')
              .setStyle(ButtonStyle.Success)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_prompt_${interaction.user.id}`)
              .setLabel(settings.enhancedPrompt ? 'Disable' : 'Enable')
              .setStyle(settings.enhancedPrompt ? ButtonStyle.Danger : ButtonStyle.Success)
          );

        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_result_${interaction.user.id}`)
              .setLabel(settings.enhancedResult ? 'Disable' : 'Enable')
              .setStyle(settings.enhancedResult ? ButtonStyle.Danger : ButtonStyle.Success)
          );

        const row4 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_start_${interaction.user.id}`)
              .setLabel('Start')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`gen_exit_${interaction.user.id}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Danger)
          );

        return interaction.update({
          embeds: [settingsEmbed],
          components: [row1, row2, row3, row4]
        });
      }

      // Start generation
      if (action === 'gen_start') {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('🔄 Generator Processing')
              .setDescription(
                `### 📋 Lưu ý quan trọng\n` +
                `> • AI có thể tạo ra kết quả không hoàn hảo\n` +
                `> • Đây là công cụ hỗ trợ, hãy review và chỉnh sửa\n` +
                `> • Kiểm tra kỹ trước khi Export vào server\n\n` +
                `### 📚 Hướng dẫn sử dụng\n` +
                `**Export** → Xuất thiết kế vào server của bạn\n` +
                `**Menu** → Quay lại settings để chỉnh sửa\n\n` +
                `### ⏳ Tiến trình\n` +
                `\`\`\`\n⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0%\`\`\`\n` +
                `*Đang tạo server design...*`
              )
              .setColor(0xFEE75C)
              .setFooter({ text: '⏱️ Thời gian ước tính: 5-10 giây' })
          ],
          components: []
        });

        try {
          const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
          const design = await this.generateServerDesign(settings.prompt || 'Basic server', 'vi', 'balanced');
          
          if (!design) {
            return interaction.editReply({
              content: `${emojis.error} Failed to generate server design.`
            });
          }

          const treeView = this.formatTreeView(design, interaction.guild.name);

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('✅ Server Design Complete')
                .setDescription('```ansi\n' + treeView + '\n```')
                .setColor(0x57F287)
                .setFooter({ text: '💾 Nhấn Export để tạo channels & roles vào server' })
                .setTimestamp()
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(`gen_export_${interaction.user.id}`)
                    .setLabel('Export')
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setCustomId(`gen_menu_${interaction.user.id}`)
                    .setLabel('Menu')
                    .setStyle(ButtonStyle.Danger)
                )
            ]
          });

          (this as any).tempDesign = (this as any).tempDesign || new Map();
          (this as any).tempDesign.set(interaction.user.id, design);

        } catch (error: any) {
          console.error('Generation error:', error);
          await interaction.editReply({
            content: `${emojis.error} Error: ${error.message}`
          });
        }
        return;
      }

      // Export
      if (action === 'gen_export') {
        await interaction.deferUpdate();
        
        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.editReply({
            content: `${emojis.error} Design expired.`,
            components: []
          });
        }

        try {
          await interaction.editReply({
            content: `${emojis.loading} Creating channels and roles...`,
            embeds: [],
            components: []
          });

          for (const channelData of design.channels) {
            try {
              await interaction.guild.channels.create({
                name: channelData.name,
                type: channelData.type || ChannelType.GuildText
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              console.error(`Failed to create channel:`, err);
            }
          }

          for (const roleData of design.roles) {
            try {
              await interaction.guild.roles.create({
                name: roleData.name,
                color: roleData.color || undefined
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              console.error(`Failed to create role:`, err);
            }
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('✅ Export Successful')
                .setDescription(
                  `### 🎉 Server setup hoàn tất!\n\n` +
                  `**Đã tạo:**\n` +
                  `📁 **${design.channels.length}** channels\n` +
                  `🛡️ **${design.roles.length}** roles\n\n` +
                  `*Kiểm tra server của bạn để xem kết quả!*`
                )
                .setColor(0x57F287)
                .setFooter({ text: '✨ Tạo bởi Server Generator' })
                .setTimestamp()
            ],
            content: null,
            components: []
          });

        } catch (error: any) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('❌ Export Failed')
                .setDescription(
                  `### ⚠️ Có lỗi xảy ra\n\n` +
                  `**Error:**\n` +
                  `\`\`\`\n${error.message}\`\`\`\n\n` +
                  `*Vui lòng thử lại hoặc kiểm tra quyền bot*`
                )
                .setColor(0xED4245)
                .setFooter({ text: '💡 Tip: Bot cần quyền Manage Channels & Roles' })
            ],
            content: null,
            components: []
          });
        }
        return;
      }

      // Exit
      if (action === 'gen_exit') {
        (this as any).tempSettings?.delete(interaction.user.id);
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('👋 Generator Closed')
              .setDescription('*Generator đã đóng. Sử dụng `/generator` để mở lại.*')
              .setColor(0x5865F2)
          ],
          content: null,
          components: []
        });
        return;
      }

      // Menu - back to settings
      if (action === 'gen_menu') {
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {
          prompt: 'Máy chủ cơ bản với đầy đủ tính năng',
          language: 'vi',
          complexity: 'balanced',
          categories: true,
          permissions: 'basic'
        };

        const settingsEmbed = new EmbedBuilder()
          .setTitle('⚙️ Server Generator - Settings')
          .setDescription(
            `### 📝 Prompt\n` +
            `\`\`\`\n${settings.prompt}\n\`\`\`\n` +
            `### ✨ Options\n` +
            `> **Language:** \`${settings.language === 'vi' ? 'Vietnamese' : 'English'}\`\n` +
            `> **Complexity:** \`${settings.complexity.charAt(0).toUpperCase() + settings.complexity.slice(1)}\`\n` +
            `> **Categories:** \`${settings.categories ? 'Enabled' : 'Disabled'}\`\n` +
            `> **Permissions:** \`${settings.permissions.charAt(0).toUpperCase() + settings.permissions.slice(1)}\`\n\n` +
            `*Nhấn Start để bắt đầu tạo server design*`
          )
          .setColor(0x5865F2)
          .setFooter({ text: '💡 Tip: Chọn Templates hoặc tùy chỉnh Prompt' })
          .setTimestamp();

        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_prompt_${interaction.user.id}`)
              .setLabel('Đổi Prompt')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`gen_templates_${interaction.user.id}`)
              .setLabel('Templates')
              .setStyle(ButtonStyle.Primary)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_options_${interaction.user.id}`)
              .setLabel('Options')
              .setStyle(ButtonStyle.Secondary)
          );

        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_start_${interaction.user.id}`)
              .setLabel('Start')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`gen_exit_${interaction.user.id}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Danger)
          );

        await interaction.update({
          embeds: [settingsEmbed],
          components: [row1, row2, row3]
        });
        return;
      }
    });
  }

  private buildOptionsPanel(userId: string, settings: any) {
    const optionsEmbed = new EmbedBuilder()
      .setTitle('⚙️ Advanced Options')
      .setDescription(
        `Tùy chỉnh cách AI generate server của bạn:\n\n` +
        `**🌐 Language**\n\u200b\n` +
        `**📊 Complexity**\n\u200b\n` +
        `**📁 Categories**\n\u200b\n` +
        `**🔒 Permissions**`
      )
      .setColor(0x5865F2)
      .setFooter({ text: '⚙️ Click các nút để thay đổi options' });

    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gen_toggle_language_${userId}`)
          .setLabel(settings.language === 'vi' ? '🇻🇳 Vietnamese' : '🇺🇸 English')
          .setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gen_set_simple_${userId}`)
          .setLabel('⭐ Simple')
          .setStyle(settings.complexity === 'simple' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`gen_set_balanced_${userId}`)
          .setLabel('⭐⭐ Balanced')
          .setStyle(settings.complexity === 'balanced' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`gen_set_advanced_${userId}`)
          .setLabel('⭐⭐⭐ Advanced')
          .setStyle(settings.complexity === 'advanced' ? ButtonStyle.Success : ButtonStyle.Secondary)
      );

    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gen_toggle_categories_${userId}`)
          .setLabel(settings.categories ? '✅ Enabled' : '❌ Disabled')
          .setStyle(settings.categories ? ButtonStyle.Success : ButtonStyle.Danger)
      );

    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gen_toggle_permissions_${userId}`)
          .setLabel(settings.permissions === 'basic' ? '🔓 Basic' : '🔐 Advanced')
          .setStyle(ButtonStyle.Primary)
      );

    const row5 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gen_menu_${userId}`)
          .setLabel('Back to Settings')
          .setStyle(ButtonStyle.Secondary)
      );

    return {
      embeds: [optionsEmbed],
      components: [row1, row2, row3, row4, row5]
    };
  }

  private formatTreeView(design: any, serverName: string): string {
    let output = `\u001b[0;36m${serverName}\u001b[0m\n`;
    
    if (design.roles && design.roles.length > 0) {
      output += `├─ \u001b[0;35m🛡️ Roles (${design.roles.length})\u001b[0m\n`;
      design.roles.forEach((role: any, i: number) => {
        const isLast = i === design.roles.length - 1 && (!design.channels || design.channels.length === 0);
        const prefix = isLast ? '   └─' : '   ├─';
        output += `${prefix} ${i + 1}. \u001b[0;33m${role.name}\u001b[0m\n`;
      });
    }
    
    if (design.channels && design.channels.length > 0) {
      output += `└─ \u001b[0;34m📁 Channels (${design.channels.length})\u001b[0m\n`;
      design.channels.forEach((channel: any, i: number) => {
        const isLast = i === design.channels.length - 1;
        const prefix = isLast ? '   └─' : '   ├─';
        const icon = channel.type === 2 ? '🔊' : '#';
        output += `${prefix} ${i + 1}. ${icon} \u001b[0;32m${channel.name}\u001b[0m\n`;
      });
    }
    
    return output;
  }

  private async generateServerDesign(theme: string, language: string, complexity: string): Promise<any> {
    if (!this.groq) throw new Error('AI service not available');

    const channelCount = complexity === 'simple' ? 4 : complexity === 'balanced' ? 6 : 10;
    const roleCount = complexity === 'simple' ? 3 : complexity === 'balanced' ? 5 : 7;

    const prompt = `Generate a Discord server design:
Theme: ${theme}
Language: ${language === 'vi' ? 'Vietnamese' : 'English'}
Channels: ${channelCount}
Roles: ${roleCount}

Return ONLY valid JSON:
{
  "channels": [{"name": "channel-name", "type": 0}],
  "roles": [{"name": "Role Name", "color": "#FF5733"}]
}

Rules:
- Channel names: lowercase, hyphens, no spaces
- Role names: proper case
- Make it relevant to the theme`;

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = completion.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON in AI response');

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  getName() {
    return this.name;
  }

  getCommands() {
    return this.commands;
  }

  async cleanup() {
    console.log('🧹 Server Generator module cleanup');
  }
}
