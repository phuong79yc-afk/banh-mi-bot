/**
 * Server Generator Module - AI-powered Discord server setup
 * Generates: channels, roles, emojis, server description based on theme
 */

import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import Groq from 'groq-sdk';
import { keyRotator } from '../../utils/aiKeyRotator';
import { emojis } from '../../config/emojis';


export default class ServerGeneratorModule {
  name = 'server-generator-module';
  description = 'AI-powered Discord server setup generator';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  groqClient: Groq | null = null;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.initializeAI();
    this.registerCommands();
    this.setupModalHandler();
  }

  private initializeAI() {
    const groqKey = keyRotator.getGroqKey();
    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey });
      console.log('  ✅ Groq AI initialized for server generator');
    } else {
      console.log('  ⚠️ No Groq API key for server generator');
    }
  }

  private registerCommands() {
    // /generator command - shows modal
    const generatorCommand = {
      data: new SlashCommandBuilder()
        .setName('generator')
        .setDescription(' AI thiết kế máy chủ Discord theo chủ đề')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const modal = new ModalBuilder()
          .setCustomId('generator_modal')
          .setTitle('AI Thiết Kế Máy Chủ');

        // Theme input - CHỈ 1 DÒNG
        const themeInput = new TextInputBuilder()
          .setCustomId('theme')
          .setLabel('Chủ đề máy chủ của bạn')
          .setPlaceholder('Ví dụ: gaming, anime, học tập, cộng đồng...')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100);

        // Add input to action row
        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(themeInput);

        modal.addComponents(row1);

        // Show modal
        await interaction.showModal(modal);
      }
    };

    this.commands.set('generator', generatorCommand);
  }

  private setupModalHandler() {
    const self = this;

    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      
      // Handle generator modal
      if (interaction.customId === 'generator_modal') {
        // Defer reply immediately to prevent timeout
        await interaction.deferReply();

      const theme = interaction.fields.getTextInputValue('theme');
      
      // Show Settings panel with options
      const settingsEmbed = createEnhancedEmbed({
          title: `${emojis.edit} Server Generator Settings`,
          description: 
            `### 📝 Theme\n` +
            `> ${theme}\n\n` +
            `### ${emojis.edit} Options\n` +
            `🌐 **Language:** Vietnamese\n` +
            `${emojis.art} **Style:** Professional\n` +
            `${emojis.chart} **Complexity:** Detailed\n\n` +
            `💡 *Nhấn **Start** để generate hoặc **Settings** để customize*`,
          color: 0x5865F2
        });
        
        // Remove footer
        delete (settingsEmbed as any).data.footer;

        // Create buttons
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`generator_start_${interaction.user.id}`)
              .setLabel('Start')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`generator_settings_${interaction.user.id}`)
              .setLabel('Settings')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`generator_exit_${interaction.user.id}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Primary)
          );

        // Store settings temporarily with defaults
        const settingsKey = `gen_${interaction.user.id}`;
        (self as any).tempSettings = (self as any).tempSettings || new Map();
        (self as any).tempSettings.set(settingsKey, {
          theme,
          language: 'vi', // Default Vietnamese
          style: 'professional', // professional, casual, creative
          complexity: 'detailed' // simple, balanced, detailed
        });

        await interaction.editReply({
          embeds: [settingsEmbed],
          components: [row]
        });
      }

      // Handle delete confirmation modal
      else if (interaction.customId.startsWith('delete_confirm_')) {
        const parts = interaction.customId.split('_');
        const userId = parts[2];
        const correctCode = parts[3];
        
        const userCode = interaction.fields.getTextInputValue('confirm_code');

        if (userCode !== correctCode) {
          return interaction.reply({
            content: `${emojis.error}\n**Mã xác nhận sai!**\nDeletion đã hủy.`,
            ephemeral: true
          });
        }

        // Code correct - proceed with deletion
        await interaction.reply({
          content: `${emojis.edit}\n**Đang xóa toàn bộ...**\nChannels, categories và roles`,
          ephemeral: true
        });

        const guild = interaction.guild;
        let deleted = { channels: 0, categories: 0, roles: 0 };

        // Delete all channels and categories
        const channels = await guild.channels.fetch();
        for (const [id, ch] of channels) {
          try {
            if (ch.type === 4) { // Category
              await ch.delete('Generator: Delete All');
              deleted.categories++;
            } else if (ch.type === 0 || ch.type === 2) { // Text or Voice
              await ch.delete('Generator: Delete All');
              deleted.channels++;
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
          } catch (err) {
            console.error(`Failed to delete channel ${ch.name}:`, err);
          }
        }

        // Delete all roles (except @everyone and bot roles)
        const roles = await guild.roles.fetch();
        for (const [id, role] of roles) {
          try {
            if (role.name !== '@everyone' && !role.managed && role.position < guild.members.me.roles.highest.position) {
              await role.delete('Generator: Delete All');
              deleted.roles++;
              await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
            }
          } catch (err) {
            console.error(`Failed to delete role ${role.name}:`, err);
          }
        }

        await interaction.editReply({
          content: `${emojis.success} **Hoàn tất!**\n${emojis.delete} Đã xóa: ${deleted.channels} channels, ${deleted.categories} categories, ${deleted.roles} roles.`
        });
      }
    });

    // Handle Start/Exit buttons
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('generator_')) return;

      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: `${emojis.error} Bạn không thể dùng button này!`,
          flags: 64
        });
      }

      // Exit button
      if (interaction.customId.startsWith('generator_exit_')) {
        await interaction.update({
          embeds: [
            createEnhancedEmbed({
              title: `${emojis.edit} Server Generator Settings`,
              description: `${emojis.error} **Đã hủy** - Generator bị hủy bởi người dùng`,
              color: 0xED4245
            })
          ],
          components: []
        });

        // Clean up temp settings
        const settingsKey = `gen_${userId}`;
        (self as any).tempSettings?.delete(settingsKey);
        return;
      }

      // Settings button - Show options menu
      if (interaction.customId.startsWith('generator_settings_')) {
        const settingsKey = `gen_${userId}`;
        const settings = (self as any).tempSettings?.get(settingsKey);

        // Language select menu
        const languageSelect = new StringSelectMenuBuilder()
          .setCustomId(`gen_lang_${userId}`)
          .setPlaceholder('🌐 Select Language')
          .addOptions([
            { label: 'Tiếng Việt', value: 'vi', emoji: '🇻🇳', default: settings?.language === 'vi' },
            { label: 'English', value: 'en', emoji: '🇺🇸', default: settings?.language === 'en' }
          ]);

        // Style select menu
        const styleSelect = new StringSelectMenuBuilder()
          .setCustomId(`gen_style_${userId}`)
          .setPlaceholder(`${emojis.art} Select Style`)
          .addOptions([
            { label: 'Professional', value: 'professional', emoji: '💼', default: settings?.style === 'professional' },
            { label: 'Casual', value: 'casual', emoji: '😊', default: settings?.style === 'casual' },
            { label: 'Creative', value: 'creative', emoji: `${emojis.art}`, default: settings?.style === 'creative' }
          ]);

        // Complexity select menu
        const complexitySelect = new StringSelectMenuBuilder()
          .setCustomId(`gen_complexity_${userId}`)
          .setPlaceholder(`${emojis.chart} Select Complexity`)
          .addOptions([
            { label: 'Simple (3-5 channels)', value: 'simple', emoji: `${emojis.pin}`, default: settings?.complexity === 'simple' },
            { label: 'Balanced (5-8 channels)', value: 'balanced', emoji: '⚖️', default: settings?.complexity === 'balanced' },
            { label: 'Detailed (8-12 channels)', value: 'detailed', emoji: `${emojis.chart}`, default: settings?.complexity === 'detailed' }
          ]);

        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(languageSelect);
        const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(styleSelect);
        const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(complexitySelect);

        // Back button
        const backButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`gen_back_${userId}`)
              .setLabel('Back')
              .setStyle(ButtonStyle.Primary)
          );

        await interaction.update({
          embeds: [
            createEnhancedEmbed({
              title: `${emojis.edit} Customize Generator Options`,
              description: 
                `### 📝 Theme\n> ${settings?.theme}\n\n` +
                `**Current Settings:**\n` +
                `🌐 Language: ${settings?.language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇺🇸'}\n` +
                `${emojis.art} Style: ${settings?.style || 'professional'}\n` +
                `${emojis.chart} Complexity: ${settings?.complexity || 'detailed'}`,
              color: 0x5865F2
            })
          ],
          components: [row1, row2, row3, backButton]
        });
        return;
      }

      // Back button - Return to main settings
      if (interaction.customId.startsWith('gen_back_')) {
        const settingsKey = `gen_${userId}`;
        const settings = (self as any).tempSettings?.get(settingsKey);

        if (!settings) {
          return interaction.reply({
            content: `${emojis.error} Settings expired!`,
            flags: 64
          });
        }

        // Show original settings panel
        const languageDisplay = settings.language === `vi' ? 'Vietnamese' : 'English`;
        const styleDisplay = settings.style.charAt(0).toUpperCase() + settings.style.slice(1);
        const complexityDisplay = settings.complexity.charAt(0).toUpperCase() + settings.complexity.slice(1);

        const settingsEmbed = createEnhancedEmbed({
          title: `${emojis.edit} Server Generator Settings`,
          description: 
            `### 📝 Theme\n` +
            `> ${settings.theme}\n\n` +
            `### ${emojis.edit} Options\n` +
            `🌐 **Language:** ${languageDisplay}\n` +
            `${emojis.art} **Style:** ${styleDisplay}\n` +
            `${emojis.chart} **Complexity:** ${complexityDisplay}\n\n` +
            `💡 *Nhấn **Start** để generate hoặc **Settings** để customize*`,
          color: 0x5865F2
        });

        delete (settingsEmbed as any).data.footer;

        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`generator_start_${userId}`)
              .setLabel(`Start')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`generator_settings_${userId}`)
              .setLabel('Settings')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`generator_exit_${userId}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Primary)
          );

        await interaction.update({
          embeds: [settingsEmbed],
          components: [row]
        });
        return;
      }

      // Start button - Begin generation
      if (interaction.customId.startsWith('generator_start_`)) {
        const settingsKey = `gen_${userId}`;
        const settings = (self as any).tempSettings?.get(settingsKey);

        if (!settings) {
          return interaction.reply({
            content: `${emojis.error} Settings không tìm thấy. Vui lòng thử lại!`,
            flags: 64
          });
        }

        const { theme, description, language, apply } = settings;
        
        // Update to show generation started
        await interaction.update({
          embeds: [
            createEnhancedEmbed({
              title: `${emojis.edit} Server Generator Settings`,
              description: 
                `### 📝 Prompt\n` +
                `> ${theme}\n\n` +
                `### ${emojis.sparkles} Enhanced Options\n` +
                `🔹 **Enhanced Prompt:** \`Enabled\`\n` +
                `🔹 **Enhanced Result:** \`Enabled\`\n\n` +
                `${emojis.loading} **Đang khởi động AI generator...**`,
              color: 0x5865F2
            })
          ],
          components: []
        });

        try {
        const generatingEmbed = createEnhancedEmbed({
          title: `${emojis.art} AI Server Generator`,
          description: 
            `### ${emojis.warning} Lưu ý\n` +
            `• AI có thể mắc sai sót và tạo ra sản phẩm không như ý muốn\n` +
            `• Đây chỉ là công cụ hỗ trợ, bạn nên review lại\n` +
            `• Hãy chỉnh sửa thiết kế sau khi AI hoàn thành\n\n` +
            `### 📖 Hướng dẫn sử dụng\n` +
            `🔸 **Export** - Xuất bản thiết kế vào server\n` +
            `🔸 **Regen** - Yêu cầu AI chỉnh sửa lại\n` +
            `🔸 **Menu** - Mở công cụ tùy chỉnh thủ công\n\n` +
            `### ${emojis.chart} Progress\n` +
            `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ **0%**`,
          color: 0x5865F2
        });
        
        // Remove footer
        delete (generatingEmbed as any).data.footer;

        await interaction.editReply({ embeds: [generatingEmbed] });

        // Simulate progress
        for (let progress = 30; progress <= 90; progress += 30) {
          const filled = Math.floor(progress / 100 * 30); // 30 blocks total
          const empty = 30 - filled;
          const progressBar = `▓'.repeat(filled) + '▓`.repeat(empty);
          
          generatingEmbed.data.description = 
            `### ${emojis.warning} Lưu ý\n` +
            `• AI có thể mắc sai sót và tạo ra sản phẩm không như ý muốn\n` +
            `• Đây chỉ là công cụ hỗ trợ, bạn nên review lại\n` +
            `• Hãy chỉnh sửa thiết kế sau khi AI hoàn thành\n\n` +
            `### 📖 Hướng dẫn sử dụng\n` +
            `🔸 **Export** - Xuất bản thiết kế vào server\n` +
            `🔸 **Regen** - Yêu cầu AI chỉnh sửa lại\n` +
            `🔸 **Menu** - Mở công cụ tùy chỉnh thủ công\n\n` +
            `### ${emojis.chart} Progress\n` +
            `${progressBar} **${progress}%**`;

          await interaction.editReply({ embeds: [generatingEmbed] });
          await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Build full prompt with description
        const fullTheme = description 
          ? `${theme} (${description})` 
          : theme;

        // Generate server design with AI
        const design = await this.generateServerDesign(
          fullTheme, 
          settings.language || `vi',
          settings.style || 'professional',
          settings.complexity || 'detailed`
        );

        if (!design) {
          return interaction.editReply({
            content: `${emojis.error} **AI không phản hồi**. Thử lại sau!`,
            embeds: []
          });
        }

        // Update to 100%
        generatingEmbed.data.description = 
          `### ${emojis.warning} Lưu ý\n` +
          `• AI có thể mắc sai sót và tạo ra sản phẩm không như ý muốn\n` +
          `• Đây chỉ là công cụ hỗ trợ, bạn nên review lại\n` +
          `• Hãy chỉnh sửa thiết kế sau khi AI hoàn thành\n\n` +
          `### 📖 Hướng dẫn sử dụng\n` +
          `🔸 **Export** - Xuất bản thiết kế vào server\n` +
          `🔸 **Regen** - Yêu cầu AI chỉnh sửa lại\n` +
          `🔸 **Menu** - Mở công cụ tùy chỉnh thủ công\n\n` +
          `### ${emojis.chart} Progress\n` +
          `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ **100%**`;

        await interaction.editReply({ embeds: [generatingEmbed] });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create embed with design
        const designId = Date.now().toString();
        const designKey = `${interaction.user.id}_${designId}`;
        
        // Store design for button actions
        (self as any).generatedDesigns = (self as any).generatedDesigns || new Map();
        (self as any).generatedDesigns.set(designKey, {
          design,
          theme,
          language: settings.language || `vi',
          style: settings.style || 'professional',
          complexity: settings.complexity || 'detailed'
        });
        
        // Format channels gọn
        const channelsList = design.channels
          .map((cat: any) => {
            const channels = cat.channels
              .map((ch: any) => `${ch.emoji || `${emojis.message}`}・${ch.name}`)
              .join(', ');
            return `**${cat.category}**\n${channels}`;
          })
          .join('\n\n');
        
        const embed = createEnhancedEmbed({
          title: `${design.name}`,
          description: 
            `${design.description}\n\n` +
            `📖 **Hướng dẫn sử dụng**\n` +
            `🔸 **Export** - Xuất bản thiết kế vào server\n` +
            `🔸 **Regen** - Yêu cầu AI chỉnh sửa lại\n` +
            `🔸 **Menu** - Mở công cụ tùy chỉnh thủ công`,
          color: 0x5865F2,
          fields: [
            {
              name: ' Channels',
              value: channelsList.length > 1024 ? channelsList.substring(0, 1021) + '...' : channelsList,
              inline: false
            },
            {
              name: ' Roles',
              value: design.roles.map((r: any) => r.name).join(' • ') || 'Không có',
              inline: true
            },
            {
              name: ' Emojis',
              value: design.emojis.slice(0, 15).join(' ') || 'Không có',
              inline: true
            }
          ]
        });
        
        // Remove footer and thumbnail
        delete (embed as any).data.footer;
        delete (embed as any).data.thumbnail;

        // Create Select Menu instead of buttons (closer to "in embed" look)
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`gen_select_${interaction.user.id}_${designId}`)
          .setPlaceholder('Máy chủ của ...')
          .addOptions([
            {
              label: '│ Export',
              description: 'Xuất bản thiết kế vào server',
              value: 'export',
              emoji: { name: 'export', id: '1546865815700246639' }
            },
            {
              label: '│ Delete All',
              description: 'Xóa toàn bộ channels/categories/roles',
              value: 'delete',
              emoji: { name: 'delete', id: '1546858039556972545' }
            },
            {
              label: '│ Regen',
              description: 'Yêu cầu AI chỉnh sửa lại',
              value: 'regen',
              emoji: { name: 'refresh', id: '1546864957075882015' }
            },
            {
              label: '│ Menu',
              description: 'Mở công cụ tùy chỉnh thủ công',
              value: 'menu',
              emoji: { name: 'settings', id: '1546857981482635397' }
            }
          ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        // Apply if requested and has permission
        if (apply && interaction.guild && interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.editReply({ 
            content: `${emojis.loading} Đang áp dụng thiết kế...`, 
            embeds: [embed], 
            components: [row]
          });
          
          try {
            await self.applyServerDesign(interaction, design);
            await interaction.editReply({ 
              embeds: [embed],
              components: [row],
              content: `${emojis.success} **Hoàn tất!** Server đã được thiết lập theo design.`
            });
          } catch (error) {
            console.error('Error applying design:`, error);
            await interaction.editReply({ 
              embeds: [embed],
              components: [row],
              content: `${emojis.warning} **Một phần hoàn tất.** Một số channels/roles không tạo được. Tạo thủ công nhé!` 
            });
          }
        } else {
          await interaction.editReply({ embeds: [embed], components: [row] });
        }

      } catch (error) {
        console.error(`Generator error:`, error);
        await interaction.editReply({
          embeds: [
            createEnhancedEmbed({
              title: `${emojis.art} AI Server Generator`,
              description: `${emojis.error} **Lỗi!** Không thể kết nối AI hoặc tạo thiết kế. Vui lòng thử lại!`,
              color: 0xED4245
            })
          ]
        });
      }

      // Clean up temp settings
      const cleanupKey = `gen_${userId}`;
      (self as any).tempSettings?.delete(cleanupKey);
    }
    });
  }

  private async generateServerDesign(
    theme: string, 
    language: string, 
    style: string = `professional', 
    complexity: string = 'detailed'
  ): Promise<any> {
    if (!this.groqClient) {
      return null;
    }

    // Complexity settings
    const complexityConfig = {
      simple: { categories: '3-4', channels: '2-4', roles: '4-6' },
      balanced: { categories: '4-5', channels: '3-5', roles: '6-8' },
      detailed: { categories: '5-6', channels: '4-6', roles: '8-10' }
    };
    const config = complexityConfig[complexity as keyof typeof complexityConfig] || complexityConfig.detailed;

    // Style instructions
    const styleInstructions = {
      professional: 'Phong cách chuyên nghiệp, tên channels rõ ràng, mô tả chi tiết',
      casual: 'Phong cách thân thiện, tên channels ngắn gọn, emoji vui vẻ',
      creative: 'Phong cách sáng tạo, tên channels độc đáo, emoji đa dạng'
    };
    const styleGuide = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.professional;

    const prompt = language === 'vi` 
      ? `Bạn là chuyên gia thiết kế Discord server. Tạo thiết kế cho chủ đề: "${theme}".

${emojis.art} **Style:** ${styleGuide}

${emojis.warning} QUAN TRỌNG: CHỈ trả về JSON thuần túy, KHÔNG có text, markdown hay giải thích khác!

FORMAT JSON BẮT BUỘC:
{
  "name": "Tên server ngắn gọn",
  "description": "Mô tả server chi tiết 3-4 câu",
  "channels": [
    {"category": "📁 Tên Category", "channels": [
      {"name": "channel-name", "emoji": "${emojis.pin}"},
      {"name": "another-channel", "emoji": "${emojis.message}"}
    ]}
  ],
  "roles": [
    {"name": "Role Name", "color": "#FF5733", "description": "Mô tả ngắn"}
  ],
  "emojis": ["${emojis.pin}", "${emojis.message}", "🎮", "${emojis.sparkles}", "🔥"]
}

YÊU CẦU:
• ${config.categories} categories, mỗi category ${config.channels} channels
• Tên channel: lowercase, dấu-gạch-ngang
• MỖI channel có 1 emoji phù hợp duy nhất
• ${config.roles} roles với màu hex đa dạng (#FF0000 format)
• 10-15 emojis liên quan chủ đề
• Tất cả tiếng Việt có dấu

${emojis.warning} CHỈ OUTPUT JSON, BẮT ĐẦU VỚI { VÀ KẾT THÚC VỚI }`
      : `You are a Discord server design expert. Create design for theme: "${theme}".

${emojis.art} **Style:** ${style === `professional' ? 'Professional, clear names, detailed' : style === 'casual' ? 'Friendly, short names, fun emoji' : 'Creative, unique names, diverse emoji`}

${emojis.warning} CRITICAL: Return ONLY pure JSON, NO text, markdown, or explanations!

REQUIRED JSON FORMAT:
{
  "name": "Short server name",
  "description": "Detailed 3-4 sentence description",
  "channels": [
    {"category": "📁 Category Name", "channels": [
      {"name": "channel-name", "emoji": "${emojis.pin}"},
      {"name": "another-channel", "emoji": "${emojis.message}"}
    ]}
  ],
  "roles": [
    {"name": "Role Name", "color": "#FF5733", "description": "Brief description"}
  ],
  "emojis": ["${emojis.pin}", "${emojis.message}", "🎮", "${emojis.sparkles}", "🔥"]
}

REQUIREMENTS:
• 4-6 categories, each with 3-6 channels
• Channel names: lowercase, hyphen-separated
• EVERY channel has 1 unique relevant emoji
• 6-10 roles with diverse hex colors (#FF0000 format)
• 10-15 theme-related emojis

${emojis.warning} OUTPUT ONLY JSON, START WITH { AND END WITH }`;

    try {
      const response = await this.groqClient.chat.completions.create({
        model: `openai/gpt-oss-20b', // Fast 1000 T/s, free tier
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Extract JSON from response - try multiple strategies
      let jsonStr = '';
      
      // Strategy 1: Find JSON block with curly braces
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        console.error('No JSON found in response:', content);
        return null;
      }

      // Clean up common JSON errors
      jsonStr = jsonStr
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' '); // Normalize whitespace

      let design;
      try {
        design = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse failed:', parseError);
        console.error('JSON string:', jsonStr);
        return null;
      }

      return design;

    } catch (error) {
      console.error('AI generation error:', error);
      return null;
    }
  }

  private formatChannels(channels: any[]): string {
    let output = '';
    for (let i = 0; i < channels.length; i++) {
      const cat = channels[i];
      output += `\n╭ **${cat.category}**\n`;
      
      for (let j = 0; j < cat.channels.length; j++) {
        const ch = cat.channels[j];
        const isLast = j === cat.channels.length - 1;
        const prefix = isLast ? '╰─' : '├─';
        
        // Handle both string and object format
        if (typeof ch === 'string') {
          output += `${prefix} ${ch}\n`;
        } else {
          const emoji = ch.emoji || `${emojis.message}`;
          output += `${prefix} ${emoji}・${ch.name}\n`;
        }
      }
    }
    return output.trim();
  }

  private formatRoles(roles: any[]): string {
    return roles.map((role, index) => {
      const colorDot = role.color ? `\`${role.color}\`` : '`#99AAB5`';
      const number = `\`${index + 1}\``;
      return `${number} ${colorDot} **${role.name}** — *${role.description}*`;
    }).join('\n');
  }

  private async applyServerDesign(interaction: any, design: any) {
    const guild = interaction.guild;
    if (!guild) return;

    // Create roles
    for (const roleData of design.roles) {
      try {
        await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          reason: `Server Generator - Theme: ${design.name}`
        });
      } catch (err) {
        console.error(`Failed to create role ${roleData.name}:`, err);
      }
    }

    // Create categories and channels
    for (const categoryData of design.channels) {
      try {
        // Create category
        const category = await guild.channels.create({
          name: categoryData.category,
          type: ChannelType.GuildCategory,
          reason: `Server Generator - Theme: ${design.name}`
        });

        // Create channels in category
        for (const channelData of categoryData.channels) {
          let channelName: string;
          
          if (typeof channelData === 'string') {
            channelName = channelData;
          } else {
            // Format: "emoji-|-channel-name" to show emoji in Discord
            const emoji = channelData.emoji || `${emojis.message}`;
            channelName = `${emoji}・${channelData.name}`;
          }
          
          await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            reason: `Server Generator - Theme: ${design.name}`
          });
        }
      } catch (err) {
        console.error(`Failed to create category ${categoryData.category}:`, err);
      }
    }
  }

  private setupButtonHandlers() {
    const self = this;
    
    // Store designs temporarily for button actions
    (self as any).generatedDesigns = (self as any).generatedDesigns || new Map();
    
    // Handle Select Menu for Settings Options
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isStringSelectMenu()) return;
      
      // Settings select menus
      if (interaction.customId.startsWith('gen_lang_') || 
          interaction.customId.startsWith('gen_style_') ||
          interaction.customId.startsWith('gen_complexity_')) {
        
        const userId = interaction.customId.split('_')[2];
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: `${emojis.error} Bạn không thể dùng menu này!`,
            flags: 64
          });
        }

        const settingsKey = `gen_${userId}`;
        const settings = (self as any).tempSettings?.get(settingsKey);
        
        if (!settings) {
          return interaction.reply({
            content: `${emojis.error} Settings expired. Vui lòng /generator lại!`,
            flags: 64
          });
        }

        // Update settings based on menu type
        if (interaction.customId.startsWith('gen_lang_')) {
          settings.language = interaction.values[0];
        } else if (interaction.customId.startsWith('gen_style_')) {
          settings.style = interaction.values[0];
        } else if (interaction.customId.startsWith('gen_complexity_')) {
          settings.complexity = interaction.values[0];
        }

        (self as any).tempSettings.set(settingsKey, settings);

        // Update embed to show new settings
        const languageDisplay = settings.language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇺🇸`;
        const styleDisplay = settings.style.charAt(0).toUpperCase() + settings.style.slice(1);
        const complexityDisplay = settings.complexity.charAt(0).toUpperCase() + settings.complexity.slice(1);

        await interaction.update({
          embeds: [
            createEnhancedEmbed({
              title: `${emojis.edit} Customize Generator Options`,
              description: 
                `### 📝 Theme\n> ${settings.theme}\n\n` +
                `**Current Settings:**\n` +
                `🌐 Language: ${languageDisplay}\n` +
                `${emojis.art} Style: ${styleDisplay}\n` +
                `${emojis.chart} Complexity: ${complexityDisplay}\n\n` +
                `${emojis.success} Updated!`,
              color: 0x10b981
            })
          ]
        });
        return;
      }

      // Export/Regen/Menu select menu (existing handler)
      if (!interaction.customId.startsWith('gen_select_')) return;

      const parts = interaction.customId.split('_');
      const userId = parts[2];
      const designId = parts[3];
      const action = interaction.values[0]; // 'export', 'regen', or 'menu`
      
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: `${emojis.error} Bạn không thể dùng menu này!`,
          flags: 64
        });
      }

      // Get stored design
      const designKey = `${userId}_${designId}`;
      const storedData = (self as any).generatedDesigns.get(designKey);

      // Export button - Apply design to server
      if (action === `export`) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${emojis.error} Bạn cần quyền Administrator để export thiết kế!`,
            flags: 64
          });
        }

        if (!storedData) {
          return interaction.reply({
            content: `${emojis.error} Không tìm thấy design. Vui lòng generate lại!`,
            flags: 64
          });
        }

        // Ask if user wants to delete old channels first
        const confirmMsg = await interaction.reply({
          content: 
            `${emojis.export} **Export Thiết Kế**\n\n` +
            `**Xóa channels/roles cũ trước khi export?**\n` +
            `• Reply \`yes\` - Xóa hết rồi tạo mới (clean)\n` +
            `• Reply \`no\` - Giữ nguyên, chỉ thêm mới\n\n` +
            `Timeout: 20 giây`,
          flags: 64,
          fetchReply: true
        });

        const filter = (m: any) => m.author.id === userId && [`yes', 'no', 'có', 'không'].includes(m.content.toLowerCase());
        
        try {
          const collected = await interaction.channel.awaitMessages({ 
            filter, 
            max: 1, 
            time: 20000, 
            errors: ['time'] 
          });

          const shouldDelete = ['yes', 'có'].includes(collected.first()?.content.toLowerCase() || '');

          // Delete confirmation message
          try {
            await collected.first()?.delete();
          } catch (e) {}

          await interaction.followUp({
            content: `${emojis.loading} **Đang export thiết kế...**`,
            flags: 64
          });

          const guild = interaction.guild;
          const design = storedData.design;
          let progress = { deleted: 0, created: 0, total: 0 };

          // Calculate total items
          design.channels.forEach((cat: any) => {
            progress.total += 1 + cat.channels.length; // category + channels
          });
          progress.total += design.roles.length;

          // Delete old if requested
          if (shouldDelete) {
            const channels = await guild.channels.fetch();
            for (const [id, ch] of channels) {
              try {
                if ([0, 2, 4].includes(ch.type)) {
                  await ch.delete('Generator: Export Clean');
                  progress.deleted++;
                }
              } catch (err) {}
            }

            const roles = await guild.roles.fetch();
            for (const [id, role] of roles) {
              try {
                if (role.name !== '@everyone' && !role.managed && role.position < guild.members.me.roles.highest.position) {
                  await role.delete('Generator: Export Clean');
                  progress.deleted++;
                }
              } catch (err) {}
            }
          }

          // Create roles
          for (const roleData of design.roles) {
            try {
              await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                permissions: roleData.permissions,
                reason: `Generator: ${design.name}`
              });
              progress.created++;
              
              // Update progress every 3 items
              if (progress.created % 3 === 0) {
                const percentage = Math.round(progress.created/progress.total*100);
                const filled = Math.floor(percentage / 100 * 30); // 30 blocks total
                const empty = 30 - filled;
                const progressBar = '▓'.repeat(filled) + '▓`.repeat(empty);
                
                await interaction.editReply({
                  content: `${emojis.loading} **Export**\n[${progressBar}] ${percentage}%\n${progress.created}/${progress.total} items`
                });
              }
            } catch (err) {}
          }

          // Create categories and channels
          for (const categoryData of design.channels) {
            try {
              const category = await guild.channels.create({
                name: categoryData.category,
                type: 4,
                reason: `Generator: ${design.name}`
              });
              progress.created++;

              for (const channelData of categoryData.channels) {
                let channelName = channelData.name;
                if (channelData.emoji) {
                  channelName = `${channelData.emoji}・${channelData.name}`;
                }
                
                await guild.channels.create({
                  name: channelName,
                  type: channelData.type || 0,
                  parent: category.id,
                  reason: `Generator: ${design.name}`
                });
                progress.created++;

                if (progress.created % 3 === 0) {
                  const percentage = Math.round(progress.created/progress.total*100);
                  const filled = Math.floor(percentage / 100 * 30); // 30 blocks total
                  const empty = 30 - filled;
                  const progressBar = `▓'.repeat(filled) + '▓`.repeat(empty);
                  
                  await interaction.editReply({
                    content: `${emojis.loading} **Export**\n[${progressBar}] ${percentage}%\n${progress.created}/${progress.total} items`
                  });
                }
              }
            } catch (err) {}
          }

          await interaction.editReply({
            content: 
              `${emojis.success} **Export hoàn tất!**\n` +
              `${emojis.delete} Đã xóa: ${progress.deleted} items\n` +
              `${emojis.sparkles} Đã tạo: ${progress.created}/${progress.total} items`
          });

        } catch (error) {
          await interaction.followUp({
            content: `${emojis.error} Timeout hoặc lỗi! Export đã hủy.`,
            flags: 64
          });
        }
      }

      // Delete All - Xóa toàn bộ channels/categories/roles
      else if (action === `delete`) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${emojis.error} Bạn cần quyền Administrator để xóa!`,
            flags: 64
          });
        }

        // Generate random confirmation code
        const confirmCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Create modal with confirmation code input
        
        const modal = new ModalBuilder()
          .setCustomId(`delete_confirm_${userId}_${confirmCode}`)
          .setTitle(`Xác nhận xóa toàn bộ');

        const codeInput = new TextInputBuilder()
          .setCustomId('confirm_code')
          .setLabel(`Nhập mã xác nhận: ${confirmCode}`)
          .setPlaceholder(confirmCode)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(4)
          .setMinLength(4);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }

      // Regen button - Regenerate with AI
      else if (action === 'regen`) {
        if (!storedData) {
          return interaction.reply({
            content: `${emojis.error} Không tìm thấy theme gốc. Vui lòng dùng \`/generator\` để tạo mới!`,
            flags: 64
          });
        }

        // Ask if user wants to modify prompt
        await interaction.reply({
          content: 
            `${emojis.refresh} **Regenerate Thiết Kế**\n\n` +
            `Theme hiện tại: \`${storedData.theme}\`\n\n` +
            `**Chỉnh sửa prompt?**\n` +
            `• Reply với prompt mới để thay đổi\n` +
            `• Reply \`same\` để giữ nguyên\n\n` +
            `Timeout: 30 giây`,
          flags: 64
        });

        const filter = (m: any) => m.author.id === userId;
        
        try {
          const collected = await interaction.channel.awaitMessages({ 
            filter, 
            max: 1, 
            time: 30000, 
            errors: [`time'] 
          });

          const userInput = collected.first()?.content || 'same';
          const newTheme = userInput.toLowerCase() === 'same` ? storedData.theme : userInput;

          // Delete user message
          try {
            await collected.first()?.delete();
          } catch (e) {}

          await interaction.followUp({
            content: `${emojis.refresh} **Đang regenerate với theme:** \`${newTheme}\``,
            flags: 64
          });

          // Regenerate with new/same theme
          const newDesign = await self.generateServerDesign(
            newTheme, 
            storedData.language || `vi',
            storedData.style || 'professional',
            storedData.complexity || 'detailed`
          );

          if (!newDesign) {
            return interaction.editReply({
              content: `${emojis.error} **Lỗi!** AI không phản hồi. Thử lại sau!`
            });
          }

          // Create new design ID
          const newDesignId = Date.now().toString();
          const newDesignKey = `${userId}_${newDesignId}`;
          (self as any).generatedDesigns.set(newDesignKey, {
            design: newDesign,
            theme: newTheme,
            language: storedData.language || `vi',
            style: storedData.style || 'professional',
            complexity: storedData.complexity || 'detailed'
          });

          // Create embed with new design (gọn)
          const channelsList = newDesign.channels
            .map((cat: any) => {
              const channels = cat.channels
                .map((ch: any) => `${ch.emoji || `${emojis.message}`}・${ch.name}`)
                .join(', ');
              return `**${cat.category}**\n${channels}`;
            })
            .join('\n\n');
          
          const embed = createEnhancedEmbed({
            title: `${newDesign.name}`,
            description: 
              `${newDesign.description}\n\n` +
              `📖 **Hướng dẫn sử dụng**\n` +
              `🔸 **Export** - Xuất bản thiết kế vào server\n` +
              `🔸 **Delete All** - Xóa toàn bộ channels/categories/roles\n` +
              `🔸 **Regen** - Yêu cầu AI chỉnh sửa lại\n` +
              `🔸 **Menu** - Mở công cụ tùy chỉnh thủ công`,
            color: 0x5865F2,
            fields: [
              {
                name: `${emojis.folder} Channels`,
                value: channelsList.length > 1024 ? channelsList.substring(0, 1021) + '...' : channelsList,
                inline: false
              },
              {
                name: '🎭 Roles',
                value: newDesign.roles.map((r: any) => r.name).join(' • ') || 'Không có',
                inline: true
              },
              {
                name: '😊 Emojis',
                value: newDesign.emojis.slice(0, 15).join(' ') || 'Không có',
                inline: true
              }
            ]
          });
          
          delete (embed as any).data.footer;
          delete (embed as any).data.thumbnail;

          // Create new select menu with new design ID
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`gen_select_${userId}_${newDesignId}`)
          .setPlaceholder('Máy chủ của ...')
          .addOptions([
            {
              label: '│ Export',
              description: 'Xuất bản thiết kế vào server',
              value: 'export',
              emoji: { name: 'export', id: '1546865815700246639' }
            },
            {
              label: '│ Delete All',
              description: 'Xóa toàn bộ channels/categories/roles',
              value: 'delete',
              emoji: { name: 'delete', id: '1546858039556972545' }
            },
            {
              label: '│ Regen',
              description: 'Yêu cầu AI chỉnh sửa lại',
              value: 'regen',
              emoji: { name: 'refresh', id: '1546864957075882015' }
            },
            {
              label: '│ Menu',
              description: 'Mở công cụ tùy chỉnh thủ công',
              value: 'menu',
              emoji: { name: 'settings', id: '1546857981482635397' }
            }
          ]);

          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

          await interaction.editReply({ 
            content: null,
            embeds: [embed], 
            components: [row] 
          });

        } catch (error) {
          await interaction.followUp({
            content: `${emojis.error} Timeout! Regen đã hủy.`,
            flags: 64
          });
        }
      }

      // Menu button - Show customization menu
      else if (action === `menu`) {
        if (!storedData) {
          return interaction.reply({
            content: `${emojis.error} Không tìm thấy design. Vui lòng generate lại!`,
            flags: 64
          });
        }

        const menuEmbed = createEnhancedEmbed({
          title: `${emojis.menu} Customization Menu`,
          description: 
            `**Theme:** ${storedData.theme}\n\n` +
            `**Edit Options:**\n\n` +
            `📝 Edit Name\n` +
            `${emojis.folder} Edit Channels\n` +
            `🎭 Edit Roles\n` +
            `😊 Edit Emojis\n\n` +
            `Reply with number (1-4) or "cancel"`,
          color: 0x5865F2,
          footer: { text: 'Timeout: 60s' }
        });

        await interaction.reply({
          embeds: [menuEmbed],
          flags: 64
        });

        // TODO: Add collector for user input
        // For now just show the menu
      }
    });
  }

  getName() {
    return this.name;
  }

  getCommands() {
    return this.commands;
  }
}
