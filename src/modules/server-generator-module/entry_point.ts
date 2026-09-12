/**
 * Server Generator Module - AI-powered Discord server setup
 * Using Components V2 for modern, beautiful layout
 */

import { 
  Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction,
  PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder,
  TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  MessageFlags, ContainerBuilder
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
        .setDescription(`${emojis.sparkles} Tạo cấu trúc Discord server bằng AI`)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
          return interaction.reply({
            content: `${emojis.error} **Lỗi!** Command chỉ dùng trong server!`,
            flags: 64
          });
        }

        // Show prompt modal
        const modal = new ModalBuilder()
          .setCustomId(`gen_prompt_modal_${interaction.user.id}`)
          .setTitle('🎨 Server Generator');

        const promptInput = new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('Mô tả server bạn muốn tạo')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ví dụ: Server gaming với kênh voice, kênh chat game...')
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(500);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput)
        );

        await interaction.showModal(modal);
      }
    };

    this.commands.set('generator', generatorCommand);
  }

  private setupEventHandlers() {
    // Handle prompt modal submission
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_prompt_modal_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      await interaction.deferReply({ flags: 64 });

      const prompt = interaction.fields.getTextInputValue('prompt');

      // Generate with AI
      try {
        if (!this.groq) {
          return interaction.editReply({
            content: `${emojis.error} **Lỗi!** AI service không khả dụng.`
          });
        }

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.loading} Đang tạo server...\n\n` +
              `${emojis.sparkles} AI đang phân tích yêu cầu của bạn\n` +
              `${emojis.database} Đang thiết kế cấu trúc server\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.info} *Vui lòng đợi 10-20 giây...*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        const systemPrompt = `You are a Discord server structure designer. Generate a JSON design for a Discord server based on user requirements.

Output ONLY valid JSON in this exact format:
{
  "serverName": "Server Name",
  "categories": [
    {
      "name": "CATEGORY NAME",
      "emoji": "👋",
      "channels": [
        {"name": "channel-name", "type": 0, "emoji": "💬"},
        {"name": "voice channel", "type": 2, "emoji": "🎙️"}
      ]
    }
  ],
  "roles": [
    {"name": "Owner", "emoji": "👑", "color": "#FF0000", "permissions": []}
  ]
}

RULES:
- Channel types: 0=Text, 2=Voice, 5=Announcement, 13=Stage
- Text channels: use hyphens (game-discussion)
- Voice channels: use spaces (game discussion)
- Add emoji to every role, category, and channel
- Use Vietnamese names if user asks in Vietnamese
- Keep it practical and organized
- Include Welcome, Community, Voice categories minimum`;

        const completion = await this.groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model: 'openai/gpt-oss-20b',
          temperature: 0.7,
          max_tokens: 2000
        });

        const aiResponse = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const design = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        // Store design
        (this as any).tempDesign = (this as any).tempDesign || new Map();
        (this as any).tempDesign.set(interaction.user.id, design);

        // Count items
        const totalCategories = design.categories?.length || 0;
        const totalChannels = design.categories?.reduce((sum: number, cat: any) => 
          sum + (cat.channels?.length || 0), 0) || 0;
        const totalRoles = design.roles?.length || 0;

        // Generate beautiful tree preview with colors (using ANSI)
        let preview = `\x1b[36m${design.serverName || 'Server Design'}\x1b[0m\n`;
        preview += `└── \x1b[35m🛡️ Roles (${design.roles?.length || 0})\x1b[0m\n`;

        // Roles section
        if (design.roles && design.roles.length > 0) {
          design.roles.forEach((role: any, index: number) => {
            const isLast = index === design.roles.length - 1;
            const prefix = isLast ? '    └──' : '    ├──';
            preview += `\x1b[31m${prefix} ${index + 1}. ${role.name}\x1b[0m (${role.emoji || '🎖️'})\n`;
          });
        }

        // Categories and channels
        if (design.categories && design.categories.length > 0) {
          design.categories.forEach((cat: any, catIndex: number) => {
            const isCatLast = catIndex === design.categories.length - 1;
            const catPrefix = isCatLast ? '└──' : '├──';
            preview += `\x1b[33m${catPrefix} ${catIndex + 1}. ${cat.name}\x1b[0m ${cat.emoji || '📁'}\n`;
            
            if (cat.channels && cat.channels.length > 0) {
              cat.channels.forEach((ch: any, chIndex: number) => {
                const isChLast = chIndex === cat.channels.length - 1;
                const lineChar = isCatLast ? '    ' : '│   ';
                const chPrefix = isChLast ? '└──' : '├──';
                const chIcon = ch.type === 2 ? '\x1b[34m🔊\x1b[0m' : '\x1b[32m#\x1b[0m';
                const chEmoji = ch.emoji || (ch.type === 2 ? '🎙️' : '💬');
                preview += `${lineChar}${chPrefix} ${catIndex + 1}.${chIndex + 1} ${chIcon} ${chEmoji}・${ch.name}\n`;
              });
            }
          });
        }

        // Show result with compact layout - tree preview only
        const resultContainer = new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `**${design.serverName || 'Server Design'}**\n` +
              `\`\`\`ansi\n${preview}\`\`\``
            )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.export} Export to Server`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_export_${interaction.user.id}`)
                  .setLabel('Export')
                  .setStyle(ButtonStyle.Success)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.sparkles} More Options`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_menu_${interaction.user.id}`)
                  .setLabel('Menu')
                  .setStyle(ButtonStyle.Danger)
              )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [resultContainer]
        });

      } catch (error: any) {
        console.error('Generation error:', error);
        
        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.error} Lỗi AI!\n\n` +
              `${emojis.warning} Không thể tạo server design\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
              `${emojis.info} *Vui lòng thử lại sau*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
      }
    });

    // Handle delete confirmation modal
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_confirm_delete_all_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      const enteredCode = interaction.fields.getTextInputValue('confirm_code');
      const correctCode = (this as any).deleteConfirmCodes?.get(interaction.user.id);

      if (enteredCode !== correctCode) {
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0xED4245)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.error} Mã xác nhận sai!\n\n` +
                  `${emojis.warning} Code không đúng\n\n` +
                  `${emojis.info} Vui lòng thử lại`
                )
              )
          ]
        });
      }

      // Clear code
      (this as any).deleteConfirmCodes?.delete(interaction.user.id);

      await interaction.deferReply({ flags: 64 });

      const loadingContainer = new ContainerBuilder()
        .setAccentColor(0xED4245)
        .addTextDisplayComponents(
          (text) => text.setContent(
            `# ${emojis.loading} Đang xóa...\n\n` +
            `${emojis.delete} Đang xóa roles...\n` +
            `${emojis.delete} Đang xóa categories...\n` +
            `${emojis.delete} Đang xóa channels...\n` +
            `${emojis.delete} Đang xóa voice channels...\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${emojis.warning} *Vui lòng không tắt bot...*`
          )
        );

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [loadingContainer]
      }).catch(() => {});

      try {
        let rolesDeleted = 0;
        let categoriesDeleted = 0;
        let channelsDeleted = 0;
        let voiceDeleted = 0;

        // Delete Roles
        const roles = interaction.guild.roles.cache.filter(
          (r: any) => !r.managed && r.name !== '@everyone' && r.position < interaction.guild.members.me!.roles.highest.position
        );
        for (const [id, role] of roles) {
          try {
            await role.delete();
            rolesDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete role:`, err);
          }
        }

        // Delete Categories
        const categories = interaction.guild.channels.cache.filter(
          (c: any) => c.type === ChannelType.GuildCategory
        );
        for (const [id, category] of categories) {
          try {
            await category.delete();
            categoriesDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete category:`, err);
          }
        }

        // Delete Text Channels
        const textChannels = interaction.guild.channels.cache.filter(
          (c: any) => (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement || c.type === ChannelType.GuildForum) &&
            c.id !== interaction.guild.rulesChannelId &&
            c.id !== interaction.guild.publicUpdatesChannelId
        );
        for (const [id, channel] of textChannels) {
          try {
            await channel.delete();
            channelsDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete channel:`, err);
          }
        }

        // Delete Voice Channels
        const voiceChannels = interaction.guild.channels.cache.filter(
          (c: any) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
        );
        for (const [id, channel] of voiceChannels) {
          try {
            await channel.delete();
            voiceDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete voice channel:`, err);
          }
        }

        const successContainer = new ContainerBuilder()
          .setAccentColor(0x57F287)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.success} Xóa thành công!\n\n` +
              `${emojis.gift} Đã xóa toàn bộ nội dung server\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `### ${emojis.chart} Thống kê\n` +
              `${emojis.shield} **Roles:** ${rolesDeleted} đã xóa\n` +
              `${emojis.folder} **Categories:** ${categoriesDeleted} đã xóa\n` +
              `${emojis.delete} **Channels:** ${channelsDeleted} đã xóa\n` +
              `${emojis.music} **Voice:** ${voiceDeleted} đã xóa\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.shield} **Protected:** @everyone role, bot roles, system channels\n` +
              `${emojis.sparkles} *Server của bạn giờ đã sạch sẽ!*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [successContainer]
        }).catch(() => {});

      } catch (error: any) {
        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.error} Lỗi Delete!\n\n` +
              `${emojis.warning} Không thể xóa\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Error:**\n\`\`\`\n${error.message}\`\`\``
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        }).catch(() => {});
      }
    });

    // Handle buttons
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('gen_')) return;

      const parts = interaction.customId.split('_');
      const action = parts[1];
      const userId = parts[parts.length - 1];

      if (interaction.user.id !== userId) {
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0xED4245)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.error} **Lỗi!**\n\nĐây không phải button của bạn!`
                )
              )
          ]
        });
      }

      // Export to server
      if (action === 'export') {
        await interaction.deferReply({ flags: 64 });

        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.loading} Đang export...\n\n` +
              `${emojis.sparkles} Đang tạo roles...\n` +
              `${emojis.sparkles} Đang tạo categories...\n` +
              `${emojis.sparkles} Đang tạo channels...\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.info} *Quá trình này có thể mất vài phút...*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        try {
          let totalRoles = 0;
          let totalChannels = 0;

          // Create roles
          if (design.roles && design.roles.length > 0) {
            for (const roleData of design.roles) {
              try {
                await interaction.guild.roles.create({
                  name: roleData.name,
                  color: roleData.color || undefined,
                  permissions: roleData.permissions || []
                });
                totalRoles++;
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (err) {
                console.error(`Failed to create role:`, err);
              }
            }
          }

          // Create categories and channels
          if (design.categories && design.categories.length > 0) {
            for (const category of design.categories) {
              try {
                const createdCategory = await interaction.guild.channels.create({
                  name: category.name,
                  type: ChannelType.GuildCategory
                });
                await new Promise(resolve => setTimeout(resolve, 300));

                if (category.channels && category.channels.length > 0) {
                  for (const channelData of category.channels) {
                    try {
                      await interaction.guild.channels.create({
                        name: channelData.name,
                        type: channelData.type || ChannelType.GuildText,
                        parent: createdCategory.id
                      });
                      totalChannels++;
                      await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (err) {
                      console.error(`Failed to create channel:`, err);
                    }
                  }
                }
              } catch (err) {
                console.error(`Failed to create category:`, err);
              }
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} Export thành công!\n\n` +
                `${emojis.gift} Server đã được tạo xong\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `### ${emojis.chart} Thống kê\n` +
                `${emojis.message} **Channels:** ${totalChannels} đã tạo\n` +
                `${emojis.shield} **Roles:** ${totalRoles} đã tạo\n` +
                `${emojis.folder} **Categories:** ${design.categories?.length || 0} đã tạo\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `${emojis.info} *Kiểm tra Discord server để xem kết quả!*\n` +
                `${emojis.sparkles} *Server của bạn đã sẵn sàng!*`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          const errorContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.error} Lỗi Export!\n\n` +
                `${emojis.warning} Không thể export vào server\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
                `${emojis.info} *Kiểm tra quyền bot*`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [errorContainer]
          });
        }
        return;
      }

      // Export JSON
      if (action === 'json') {
        await interaction.deferReply({ flags: 64 });

        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        const jsonStr = JSON.stringify(design, null, 2);
        const buffer = Buffer.from(jsonStr, 'utf-8');

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0x57F287)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.success} JSON Export\n\n` +
                  `${emojis.document} File thiết kế server của bạn\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${emojis.info} *Download file bên dưới*`
                )
              )
          ],
          files: [{ attachment: buffer, name: 'server-design.json' }]
        });
        return;
      }

      // Import JSON
      if (action === 'import') {
        await interaction.deferReply({ flags: 64 });

        // Create example JSON file
        const exampleDesign = {
          "serverName": "🎮 My Gaming Server",
          "roles": [
            {"name": "Owner", "emoji": "👑", "color": "#FF0000"},
            {"name": "Admin", "emoji": "🛡️", "color": "#FFA500"},
            {"name": "Moderator", "emoji": "⚔️", "color": "#FFFF00"},
            {"name": "VIP", "emoji": "⭐", "color": "#FFD700"},
            {"name": "Member", "emoji": "👤", "color": "#808080"}
          ],
          "categories": [
            {
              "name": "WELCOME",
              "emoji": "👋",
              "channels": [
                {"name": "welcome", "type": 0, "emoji": "👋"},
                {"name": "rules", "type": 0, "emoji": "📜"},
                {"name": "announcements", "type": 5, "emoji": "📢"}
              ]
            },
            {
              "name": "COMMUNITY",
              "emoji": "💬",
              "channels": [
                {"name": "general", "type": 0, "emoji": "💬"},
                {"name": "off-topic", "type": 0, "emoji": "🎲"},
                {"name": "introductions", "type": 0, "emoji": "🙋"}
              ]
            },
            {
              "name": "GAMING",
              "emoji": "🎮",
              "channels": [
                {"name": "game-discussion", "type": 0, "emoji": "🎮"},
                {"name": "looking-for-group", "type": 0, "emoji": "🔍"},
                {"name": "tournaments", "type": 0, "emoji": "🏆"}
              ]
            },
            {
              "name": "VOICE CHANNELS",
              "emoji": "🔊",
              "channels": [
                {"name": "lobby voice", "type": 2, "emoji": "🎙️"},
                {"name": "gaming voice", "type": 2, "emoji": "🎮"},
                {"name": "music room", "type": 2, "emoji": "🎵"},
                {"name": "afk", "type": 2, "emoji": "💤"}
              ]
            }
          ]
        };

        const jsonStr = JSON.stringify(exampleDesign, null, 2);
        const buffer = Buffer.from(jsonStr, 'utf-8');

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0x5865F2)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.cloud} Import Template\n\n` +
                  `${emojis.document} File mẫu server design\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${emojis.info} **Cách dùng:**\n` +
                  `1. Download file bên dưới\n` +
                  `2. Chỉnh sửa theo ý bạn\n` +
                  `3. Dùng \`/generator\` và upload file đã chỉnh sửa\n\n` +
                  `${emojis.sparkles} *Template bao gồm roles, categories, channels mẫu*`
                )
              )
          ],
          files: [{ attachment: buffer, name: 'server-template.json' }]
        });
        return;
      }

      // Menu - show all options
      if (action === 'menu') {
        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        const menuContainer = new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.sparkles} Menu Options`)
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.document} **Export JSON**\nXuất thiết kế ra file JSON`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_json_${interaction.user.id}`)
                  .setLabel('💾 JSON')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.cloud} **Download Template**\nTải file mẫu server design`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_import_${interaction.user.id}`)
                  .setLabel('📥 Template')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.refresh} **Tạo lại**\nTạo thiết kế mới với prompt khác`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_retry_${interaction.user.id}`)
                  .setLabel('🔄 Retry')
                  .setStyle(ButtonStyle.Secondary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.delete} **Xóa toàn bộ**\nXóa ALL server content`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_delete_${interaction.user.id}`)
                  .setLabel('💥 Delete All')
                  .setStyle(ButtonStyle.Danger)
              )
          );

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [menuContainer]
        });
        return;
      }

      // Retry
      if (action === 'retry') {
        const modal = new ModalBuilder()
          .setCustomId(`gen_prompt_modal_${interaction.user.id}`)
          .setTitle('🎨 Server Generator');

        const promptInput = new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('Mô tả server bạn muốn tạo')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ví dụ: Server gaming với kênh voice, kênh chat game...')
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(500);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // Delete All (with confirmation)
      if (action === 'delete') {
        const confirmCode = Math.floor(1000 + Math.random() * 9000).toString();
        (this as any).deleteConfirmCodes = (this as any).deleteConfirmCodes || new Map();
        (this as any).deleteConfirmCodes.set(interaction.user.id, confirmCode);

        const modal = new ModalBuilder()
          .setCustomId(`gen_confirm_delete_all_${interaction.user.id}`)
          .setTitle('⚠️ Xác nhận xóa TOÀN BỘ');

        const codeInput = new TextInputBuilder()
          .setCustomId('confirm_code')
          .setLabel(`Nhập mã xác nhận: ${confirmCode}`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Nhập mã 4 số để xác nhận xóa ALL')
          .setRequired(true)
          .setMinLength(4)
          .setMaxLength(4);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput)
        );

        await interaction.showModal(modal);
        return;
      }
    });
  }

  async shutdown() {
    console.log(`Shutting down ${this.name}`);
  }
}
