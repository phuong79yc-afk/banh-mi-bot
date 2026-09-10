/**
 * Server Generator Module - AI-powered Discord server setup
 * Using Components V2 for modern layout
 */

import { 
  Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction,
  PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder,
  TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  MessageFlags, SectionBuilder, ContainerBuilder, TextDisplayBuilder
} from 'discord.js';
import { emojis } from '../../config/emojis';
import Groq from 'groq-sdk';
import { keyRotator } from '../../utils/aiKeyRotator';

export default class ServerGeneratorModule {
  name = 'server-generator-module';
  description = 'AI-powered Discord server setup generator with Components V2';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  groq: Groq;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.groq = new Groq({ apiKey: keyRotator.getGroqKey() || '' });
  }

  // Predefined server templates
  private templates = {
    gaming: {
      name: '🎮 Gaming Community',
      prompt: 'Tạo server gaming chuyên nghiệp với 5 categories: Welcome (rules, announcements), Game Channels (valorant, league-of-legends, minecraft), Voice Channels (lobby-1, lobby-2, afk), Community (general-chat, memes, screenshots), Support (tickets, feedback). Roles: Owner, Admin, Moderator, VIP Member, Member.'
    },
    community: {
      name: '💬 Community Hub',
      prompt: 'Tạo server cộng đồng thân thiện với 4 categories: Information (welcome, rules, announcements), Chat Rooms (general, random, introductions, topic-discussion), Activities (events, games, media-sharing), Support (help-desk, suggestions). Roles: Founder, Admin, Moderator, Helper, Active Member, Member.'
    },
    study: {
      name: '📚 Study Group',
      prompt: 'Tạo server học tập với 5 categories: Information (welcome, rules, announcements), Study Rooms (math, science, language, history), Resources (books, links, notes), Discussion (homework-help, study-groups, q-and-a), Break Time (general-chat, memes). Roles: Teacher, Study Leader, Tutor, Student.'
    },
    business: {
      name: '💼 Business/Work',
      prompt: 'Tạo server công việc chuyên nghiệp với 5 categories: Information (announcements, company-news), Departments (sales, marketing, development, hr), Projects (project-alpha, project-beta, deadlines), General (general-discussion, random, water-cooler), Resources (documents, tools, training). Roles: Executive, Manager, Team Lead, Employee, Intern.'
    },
    anime: {
      name: '🌸 Anime/Manga',
      prompt: 'Tạo server anime/manga với 5 categories: Welcome (rules, announcements, introductions), Anime Discussion (anime-talk, manga-discussion, recommendations), Media (fanart, cosplay, videos), Events (movie-nights, game-nights), Community (general-chat, memes, voice-channels). Roles: Admin, Moderator, Otaku, Weeb, Member.'
    },
    tech: {
      name: '💻 Tech/Development',
      prompt: 'Tạo server tech/dev với 5 categories: Information (rules, announcements, resources), Development (web-dev, mobile-dev, backend, frontend), Help & Support (code-help, debugging, project-reviews), Discussion (tech-news, career-advice, off-topic), Projects (showcase, collaborations). Roles: Admin, Senior Dev, Developer, Junior Dev, Learner.'
    }
  };

  async initialize() {
    this.registerCommands();
    this.setupEventHandlers();
    return true;
  }

  private registerCommands() {
    const generatorCommand = {
      data: new SlashCommandBuilder()
        .setName('generator')
        .setDescription('AI-powered server generator with Components V2')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

      async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
          return interaction.reply({
            content: `${emojis.error} This command can only be used in a server!`,
            flags: 64
          });
        }

        // Show initial modal to input requirements
        const modal = new ModalBuilder()
          .setCustomId(`gen_initial_modal_${interaction.user.id}`)
          .setTitle('Server Generator - Yêu cầu');

        const promptInput = new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('Mô tả server bạn muốn tạo')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('VD: Server game Minecraft với channels cho survival, creative, và trading...')
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(500);

        const themeInput = new TextInputBuilder()
          .setCustomId('theme')
          .setLabel('Chủ đề (tùy chọn)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('VD: Gaming, Community, Business, Education...')
          .setRequired(false)
          .setMaxLength(50);

        const complexityInput = new TextInputBuilder()
          .setCustomId('complexity')
          .setLabel('Độ phức tạp')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('simple / medium / complex')
          .setValue('medium')
          .setRequired(false)
          .setMaxLength(20);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(themeInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(complexityInput)
        );

        await interaction.showModal(modal);
      }
    };

    this.commands.set('generator', generatorCommand);
  }

  private setupEventHandlers() {
    // Handle initial modal (requirements input)
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_initial_modal_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      const prompt = interaction.fields.getTextInputValue('prompt');
      const theme = interaction.fields.getTextInputValue('theme') || '';
      const complexity = interaction.fields.getTextInputValue('complexity') || 'medium';

      // Save to temp settings
      (this as any).tempSettings = (this as any).tempSettings || new Map();
      (this as any).tempSettings.set(interaction.user.id, {
        prompt,
        theme,
        complexity,
        enhancedPrompt: true,
        enhancedResult: true
      });

      // Show settings panel
      const settingsContainer = this.buildSettingsPanel(interaction.user.id, {
        prompt,
        theme,
        complexity,
        enhancedPrompt: true,
        enhancedResult: true
      });

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [settingsContainer]
      });
    });

    // Handle prompt change modal
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_prompt_modal_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      const newPrompt = interaction.fields.getTextInputValue('prompt');
      const newTheme = interaction.fields.getTextInputValue('theme') || '';
      const newComplexity = interaction.fields.getTextInputValue('complexity') || 'medium';
      
      const settings = (this as any).tempSettings?.get(interaction.user.id) || {
        enhancedPrompt: true,
        enhancedResult: true
      };
      settings.prompt = newPrompt;
      settings.theme = newTheme;
      settings.complexity = newComplexity;
      (this as any).tempSettings?.set(interaction.user.id, settings);

      // Rebuild settings panel with new values
      const settingsContainer = this.buildSettingsPanel(interaction.user.id, settings);

      await interaction.update({
        flags: MessageFlags.IsComponentsV2,
        components: [settingsContainer]
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
          .setTitle('Chỉnh sửa yêu cầu');

        const promptInput = new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('Mô tả server')
          .setPlaceholder('VD: Server game Minecraft với channels cho survival...')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(settings.prompt || 'Máy chủ cơ bản với đầy đủ tính năng')
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(500);

        const themeInput = new TextInputBuilder()
          .setCustomId('theme')
          .setLabel('Chủ đề (tùy chọn)')
          .setPlaceholder('VD: Gaming, Community, Business...')
          .setStyle(TextInputStyle.Short)
          .setValue(settings.theme || '')
          .setRequired(false)
          .setMaxLength(50);

        const complexityInput = new TextInputBuilder()
          .setCustomId('complexity')
          .setLabel('Độ phức tạp')
          .setPlaceholder('simple / medium / complex')
          .setStyle(TextInputStyle.Short)
          .setValue(settings.complexity || 'medium')
          .setRequired(false)
          .setMaxLength(20);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(themeInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(complexityInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // Templates menu
      if (action === 'gen_templates') {
        const templatesContainer = new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.sparkles} Server Templates\n\nChọn một mẫu máy chủ có sẵn:`)
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`🎮 **Gaming Community**\nServer game chuyên nghiệp với game channels, voice lobbies, và community chat`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_template_gaming_${interaction.user.id}`)
                  .setLabel('Chọn')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`💬 **Community Hub**\nCộng đồng thân thiện với chat rooms, activities, và support`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_template_community_${interaction.user.id}`)
                  .setLabel('Chọn')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`📚 **Study Group**\nServer học tập với study rooms, resources, và homework help`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_template_study_${interaction.user.id}`)
                  .setLabel('Chọn')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`💼 **Business/Work**\nServer công việc chuyên nghiệp với departments, projects, và resources`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_template_business_${interaction.user.id}`)
                  .setLabel('Chọn')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`🌸 **Anime/Manga**\nServer anime với discussion, media sharing, và community events`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_template_anime_${interaction.user.id}`)
                  .setLabel('Chọn')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`💻 **Tech/Development**\nServer tech với development channels, code help, và project showcases`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_template_tech_${interaction.user.id}`)
                  .setLabel('Chọn')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.refresh} Quay lại settings`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_back_to_settings_${interaction.user.id}`)
                  .setLabel('Quay lại')
                  .setStyle(ButtonStyle.Primary)
              )
          );

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [templatesContainer]
        });
        return;
      }

      // Apply template
      if (action === 'gen_template') {
        const templateName = parts[2]; // gaming, community, study, etc
        const template = (this as any).templates[templateName];
        
        if (template) {
          const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
          settings.prompt = template.prompt;
          settings.theme = templateName;
          (this as any).tempSettings?.set(interaction.user.id, settings);

          const settingsContainer = this.buildSettingsPanel(interaction.user.id, settings);

          await interaction.update({
            flags: MessageFlags.IsComponentsV2,
            components: [settingsContainer]
          });
        }
        return;
      }

      // Back to settings from templates
      if (action === 'gen_back_to_settings') {
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {
          prompt: 'Máy chủ cơ bản với đầy đủ tính năng',
          theme: '',
          complexity: 'medium',
          enhancedPrompt: true,
          enhancedResult: true
        };

        const settingsContainer = this.buildSettingsPanel(interaction.user.id, settings);

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [settingsContainer]
        });
        return;
      }

      // Toggle enhanced prompt
      if (action === 'gen_enhanced_prompt') {
        // Defer not needed for update()
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
        settings.enhancedPrompt = !settings.enhancedPrompt;
        (this as any).tempSettings?.set(interaction.user.id, settings);

        const settingsContainer = this.buildSettingsPanel(interaction.user.id, settings);

        return interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [settingsContainer]
        });
      }

      // Toggle enhanced result
      if (action === 'gen_enhanced_result') {
        // Defer not needed for update()
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
        settings.enhancedResult = !settings.enhancedResult;
        (this as any).tempSettings?.set(interaction.user.id, settings);

        const settingsContainer = this.buildSettingsPanel(interaction.user.id, settings);

        return interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [settingsContainer]
        });
      }

      // Start generation
      if (action === 'gen_start') {
        const processingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent('# 🔄 Generator Processing'),
            (text) => text.setContent(
              '### 📋 Lưu ý quan trọng\n' +
              '> • AI có thể tạo ra kết quả không hoàn hảo\n' +
              '> • Đây là công cụ hỗ trợ, hãy review và chỉnh sửa\n' +
              '> • Kiểm tra kỹ trước khi Export vào server\n\n' +
              '### 📚 Hướng dẫn sử dụng\n' +
              '**Export** → Xuất thiết kế vào server của bạn\n' +
              '**Menu** → Quay lại settings để chỉnh sửa\n\n' +
              `${emojis.loading} ${emojis.loading} ${emojis.loading}\n\n` +
              '**AI đang tạo server design...**'
            )
          );

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [processingContainer]
        });

        try {
          const settings = (this as any).tempSettings?.get(interaction.user.id) || {};
          const design = await this.generateServerDesign(
            settings.prompt || 'Basic server',
            settings.theme || '',
            settings.complexity || 'medium'
          );
          
          if (!design) {
            return interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [
                new ContainerBuilder()
                  .setAccentColor(0xED4245)
                  .addTextDisplayComponents(
                    (text) => text.setContent(`# ${emojis.error} Generation Failed\n\n${emojis.warning} Failed to generate server design. Please try again.`)
                  )
              ]
            });
          }

          const treeView = this.formatTreeView(design, interaction.guild.name);

          // Result panel - Export and Menu as Section accessories
          const resultContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(`# ${emojis.success} Server Design Complete\n\n${emojis.success} ${emojis.success} ${emojis.success}`)
            )
            .addTextDisplayComponents(
              (text) => text.setContent('```ansi\n' + treeView + '\n```')
            )
            .addTextDisplayComponents(
              (text) => text.setContent(`### ${emojis.export} Actions`)
            )
            .addSectionComponents(
              (section) => section
                .addTextDisplayComponents(
                  (text) => text.setContent(`${emojis.rocket} Apply this design to your server`)
                )
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId(`gen_export_${interaction.user.id}`)
                    .setLabel('Export')
                    .setStyle(ButtonStyle.Primary)
                )
            )
            .addSectionComponents(
              (section) => section
                .addTextDisplayComponents(
                  (text) => text.setContent(`${emojis.refresh} Modify settings or generate new design`)
                )
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId(`gen_menu_${interaction.user.id}`)
                    .setLabel('Menu')
                    .setStyle(ButtonStyle.Primary)
                )
            )
            .addTextDisplayComponents(
              (text) => text.setContent(`### ${emojis.warning} Danger Zone`)
            )
            .addSectionComponents(
              (section) => section
                .addTextDisplayComponents(
                  (text) => text.setContent(`${emojis.delete} ${emojis.warning} ${emojis.delete} Delete ALL server content (roles, categories, channels, voice)\n**Warning:** This cannot be undone!`)
                )
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId(`gen_delete_all_${interaction.user.id}`)
                    .setLabel('Delete All')
                    .setStyle(ButtonStyle.Primary)
                )
            );

          (this as any).tempDesign = (this as any).tempDesign || new Map();
          (this as any).tempDesign.set(interaction.user.id, design);

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [resultContainer]
          });

        } catch (error: any) {
          console.error('Generation error:', error);
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ❌ Error\n\n\`\`\`\n${error.message}\`\`\``)
                )
            ]
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
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ${emojis.error} Design expired\n\n${emojis.warning} Design expired. Please generate again.`)
                )
            ]
          });
        }

        try {
          const loadingContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(
              (text) => text.setContent(`# ${emojis.loading} Creating...\n\nCreating categories, channels and roles...`)
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [loadingContainer]
          });

          let totalChannels = 0;
          let totalRoles = 0;

          // Create roles first
          if (design.roles && design.roles.length > 0) {
            for (const roleData of design.roles) {
              try {
                await interaction.guild.roles.create({
                  name: roleData.name,
                  color: roleData.color || undefined
                });
                totalRoles++;
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (err) {
                console.error(`Failed to create role ${roleData.name}:`, err);
              }
            }
          }

          // Create categories and channels
          if (design.categories && design.categories.length > 0) {
            for (const category of design.categories) {
              try {
                // Create category
                const createdCategory = await interaction.guild.channels.create({
                  name: category.name,
                  type: ChannelType.GuildCategory
                });
                await new Promise(resolve => setTimeout(resolve, 300));

                // Create channels in this category
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
                      console.error(`Failed to create channel ${channelData.name}:`, err);
                    }
                  }
                }
              } catch (err) {
                console.error(`Failed to create category ${category.name}:`, err);
              }
            }
          }
          // Fallback: create channels without categories
          else if (design.channels && design.channels.length > 0) {
            for (const channelData of design.channels) {
              try {
                await interaction.guild.channels.create({
                  name: channelData.name,
                  type: channelData.type || ChannelType.GuildText
                });
                totalChannels++;
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (err) {
                console.error(`Failed to create channel:`, err);
              }
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.gift} Export Successful\n\n` +
                `${emojis.success} ${emojis.success} ${emojis.success}\n\n` +
                '**Đã tạo:**\n' +
                `${emojis.folder} **${totalChannels}** channels\n` +
                `${emojis.shield} **${totalRoles}** roles\n` +
                `${emojis.database} **${design.categories?.length || 0}** categories\n\n` +
                `${emojis.gift} ${emojis.gift} ${emojis.gift}\n\n` +
                `*Kiểm tra server của bạn để xem kết quả!*`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Export Failed\n\n` +
                    `### ${emojis.warning} Có lỗi xảy ra\n\n` +
                    `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
                    `*${emojis.info} Vui lòng thử lại hoặc kiểm tra quyền bot*`
                  )
                )
            ]
          });
        }
        return;
      }

      // Delete Channels
      if (action === 'gen_delete_channels') {
        await interaction.deferUpdate();

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.loading} Deleting Channels...\n\n${emojis.warning} Please wait...`)
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        try {
          let deletedCount = 0;
          const channels = interaction.guild.channels.cache.filter(
            (c: any) => c.type !== ChannelType.GuildCategory && !c.isThread()
          );

          for (const [id, channel] of channels) {
            try {
              // Skip system channels
              if ((channel as any).isSystemChannel?.() || (channel as any).name === 'rules' || (channel as any).name === 'general') {
                continue;
              }
              await channel.delete();
              deletedCount++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete channel ${(channel as any).name}:`, err);
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} Channels Deleted\n\n` +
                `${emojis.delete} Deleted **${deletedCount}** channels\n\n` +
                `${emojis.info} System channels were preserved`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ${emojis.error} Delete Failed\n\n\`\`\`\n${error.message}\`\`\``)
                )
            ]
          });
        }
        return;
      }

      // Delete Categories
      if (action === 'gen_delete_categories') {
        await interaction.deferUpdate();

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.loading} Deleting Categories...\n\n${emojis.warning} Please wait...`)
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        try {
          let deletedCount = 0;
          const categories = interaction.guild.channels.cache.filter(
            (c: any) => c.type === ChannelType.GuildCategory
          );

          for (const [id, category] of categories) {
            try {
              await category.delete();
              deletedCount++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete category ${(category as any).name}:`, err);
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} Categories Deleted\n\n` +
                `${emojis.folder} Deleted **${deletedCount}** categories`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ${emojis.error} Delete Failed\n\n\`\`\`\n${error.message}\`\`\``)
                )
            ]
          });
        }
        return;
      }

      // Delete Roles
      if (action === 'gen_delete_roles') {
        await interaction.deferUpdate();

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.loading} Deleting Roles...\n\n${emojis.warning} Please wait...`)
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        try {
          let deletedCount = 0;
          const roles = interaction.guild.roles.cache.filter(
            (r: any) => !r.managed && r.name !== '@everyone' && r.position < interaction.guild.members.me.roles.highest.position
          );

          for (const [id, role] of roles) {
            try {
              await role.delete();
              deletedCount++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete role ${role.name}:`, err);
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} Roles Deleted\n\n` +
                `${emojis.shield} Deleted **${deletedCount}** roles\n\n` +
                `${emojis.info} Bot roles and @everyone were preserved`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ${emojis.error} Delete Failed\n\n\`\`\`\n${error.message}\`\`\``)
                )
            ]
          });
        }
        return;
      }

      // Delete Voice Channels
      if (action === 'gen_delete_voice') {
        await interaction.deferUpdate();

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.loading} Deleting Voice Channels...\n\n${emojis.warning} Please wait...`)
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        try {
          let deletedCount = 0;
          const voiceChannels = interaction.guild.channels.cache.filter(
            (c: any) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
          );

          for (const [id, channel] of voiceChannels) {
            try {
              await channel.delete();
              deletedCount++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete voice channel ${(channel as any).name}:`, err);
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} Voice Channels Deleted\n\n` +
                `${emojis.voice} Deleted **${deletedCount}** voice channels`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ${emojis.error} Delete Failed\n\n\`\`\`\n${error.message}\`\`\``)
                )
            ]
          });
        }
        return;
      }

      // Delete All
      if (action === 'gen_delete_all') {
        await interaction.deferUpdate();

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(`# ${emojis.loading} Deleting All Server Content...\n\n${emojis.warning} ${emojis.warning} ${emojis.warning} Please wait, this may take a while...`)
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

          // Step 1: Delete Roles (except @everyone and bot roles)
          const roles = interaction.guild.roles.cache.filter(
            (r: any) => !r.managed && r.name !== '@everyone' && r.position < interaction.guild.members.me!.roles.highest.position
          );
          for (const [id, role] of roles) {
            try {
              await role.delete();
              rolesDeleted++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete role ${(role as any).name}:`, err);
            }
          }

          // Step 2: Delete Categories
          const categories = interaction.guild.channels.cache.filter(
            (c: any) => c.type === ChannelType.GuildCategory
          );
          for (const [id, category] of categories) {
            try {
              await category.delete();
              categoriesDeleted++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete category ${(category as any).name}:`, err);
            }
          }

          // Step 3: Delete Text Channels (except system channels)
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
              console.error(`Failed to delete channel ${(channel as any).name}:`, err);
            }
          }

          // Step 4: Delete Voice Channels
          const voiceChannels = interaction.guild.channels.cache.filter(
            (c: any) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
          );
          for (const [id, channel] of voiceChannels) {
            try {
              await channel.delete();
              voiceDeleted++;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error(`Failed to delete voice channel ${(channel as any).name}:`, err);
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} ${emojis.success} ${emojis.success} All Content Deleted!\n\n` +
                `${emojis.shield} Roles: **${rolesDeleted}** deleted\n` +
                `${emojis.folder} Categories: **${categoriesDeleted}** deleted\n` +
                `${emojis.delete} Channels: **${channelsDeleted}** deleted\n` +
                `${emojis.voice} Voice: **${voiceDeleted}** deleted\n\n` +
                `${emojis.info} Protected: @everyone role, bot roles, system channels`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          }).catch(() => {});

        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(`# ${emojis.error} Delete Failed\n\n\`\`\`\n${error.message}\`\`\``)
                )
            ]
          }).catch(() => {});
        }
        return;
      }

      // Exit
      if (action === 'gen_exit') {
        (this as any).tempSettings?.delete(interaction.user.id);
        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0x5865F2)
              .addTextDisplayComponents(
                (text) => text.setContent(`# ${emojis.bell} Generator Closed\n\n*${emojis.info} Generator đã đóng. Sử dụng \`/generator\` để mở lại.*`)
              )
          ]
        });
        return;
      }

      // Menu - back to settings
      if (action === 'gen_menu') {
        const settings = (this as any).tempSettings?.get(interaction.user.id) || {
          prompt: 'Máy chủ cơ bản với đầy đủ tính năng',
          enhancedPrompt: true,
          enhancedResult: true
        };

        const settingsContainer = this.buildSettingsPanel(interaction.user.id, settings);

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [settingsContainer]
        });
        return;
      }
    });
  }

  private buildSettingsPanel(userId: string, settings: any): ContainerBuilder {
    const prompt = settings.prompt || 'Máy chủ cơ bản với đầy đủ tính năng';
    const theme = settings.theme ? ` (${settings.theme})` : '';
    const complexity = settings.complexity || 'medium';
    
    return new ContainerBuilder()
      .setAccentColor(0x2B2D31)
      .addTextDisplayComponents(
        (text) => text.setContent(`# ${emojis.menu} Generator Settings`)
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.document} **Yêu cầu:** ${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}${theme}`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_prompt_${userId}`)
              .setLabel('Đổi')
              .setStyle(ButtonStyle.Primary)
          )
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.sparkles} **Templates:** Gaming, Community, Study, Business, Anime, Tech`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_templates_${userId}`)
              .setLabel('Chọn mẫu')
              .setStyle(ButtonStyle.Primary)
          )
      )
      .addTextDisplayComponents(
        (text) => text.setContent(`${emojis.chart} **Độ phức tạp:** ${complexity}`)
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.sparkles} Enhance prompt with AI suggestions`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_prompt_${userId}`)
              .setLabel(settings.enhancedPrompt ? 'Disable' : 'Enable')
              .setStyle(settings.enhancedPrompt ? ButtonStyle.Danger : ButtonStyle.Success)
          )
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.art} Beautify result with colors & emojis`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_enhanced_result_${userId}`)
              .setLabel(settings.enhancedResult ? 'Disable' : 'Enable')
              .setStyle(settings.enhancedResult ? ButtonStyle.Danger : ButtonStyle.Success)
          )
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.server} Generate server design with AI`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_start_${userId}`)
              .setLabel('Start')
              .setStyle(ButtonStyle.Primary)
          )
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.delete} Close generator panel`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_exit_${userId}`)
              .setLabel('Exit')
              .setStyle(ButtonStyle.Primary)
          )
      );
  }

  private async generateServerDesign(prompt: string, theme: string, complexity: string): Promise<any> {
    const themeText = theme ? ` Theme: ${theme}.` : '';
    const systemPrompt = `You are a professional Discord server designer. Create a well-structured server with categories, channels (text & voice), and roles.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations.

Format:
{
  "categories": [
    {
      "name": "Welcome",
      "emoji": "👋",
      "channels": [
        {"name": "rules", "type": 0, "emoji": "📜"},
        {"name": "announcements", "type": 0, "emoji": "📢"}
      ]
    },
    {
      "name": "Community",
      "emoji": "💬",
      "channels": [
        {"name": "general", "type": 0, "emoji": "💬"},
        {"name": "lounge", "type": 2, "emoji": "🔊"}
      ]
    }
  ],
  "roles": [
    {"name": "Owner", "color": 16711680, "emoji": "👑"},
    {"name": "Admin", "color": 15158332, "emoji": "🛡️"},
    {"name": "Moderator", "color": 3447003, "emoji": "⚔️"},
    {"name": "Member", "color": 10070709, "emoji": "👤"}
  ]
}

Rules:
- Categories: 3-7 logical groups (use emoji)
- Channels per category: 2-5 channels
- Channel types: 0=text, 2=voice, 5=announcement
- Channel names: lowercase-with-hyphens, no spaces
- Add emoji for visual appeal
- Role colors: RGB integer (red=16711680, blue=3447003, green=5763719)
- Create hierarchy: Owner > Admin > Mod > Member
- Complexity "${complexity}": simple=3-4 categories, medium=5-6, complex=7+

Examples by theme:
Gaming: Categories like "Welcome", "Game Channels", "Voice Channels", "Community"
Business: "Information", "Departments", "Projects", "General"
Community: "Welcome", "Chat Rooms", "Activities", "Support"`;

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a Discord server for: ${prompt}.${themeText} Complexity: ${complexity}` }
        ],
        temperature: 0.8,
        max_tokens: 3000
      });

      const content = completion.choices[0]?.message?.content || '';
      console.log('AI Response:', content.substring(0, 500) + '...');

      // Extract JSON
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```$/g, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '').trim();
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response');
        throw new Error('No valid JSON in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!parsed.categories || !parsed.roles || !Array.isArray(parsed.categories) || !Array.isArray(parsed.roles)) {
        throw new Error('Invalid JSON structure - missing categories or roles');
      }

      // Validate categories have channels
      for (const cat of parsed.categories) {
        if (!cat.channels || !Array.isArray(cat.channels) || cat.channels.length === 0) {
          throw new Error(`Category ${cat.name} has no channels`);
        }
      }

      console.log(`✅ Generated ${parsed.categories.length} categories, ${parsed.roles.length} roles`);
      return parsed;
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      // Return enhanced fallback design with categories
      return {
        categories: [
          {
            name: 'Server Info',
            emoji: 'ℹ️',
            channels: [
              { name: 'welcome', type: 0, emoji: '👋' },
              { name: 'rules', type: 0, emoji: '📜' },
              { name: 'announcements', type: 5, emoji: '📢' }
            ]
          },
          {
            name: 'Community',
            emoji: '💬',
            channels: [
              { name: 'general', type: 0, emoji: '💬' },
              { name: 'chat', type: 0, emoji: '💭' },
              { name: 'memes', type: 0, emoji: '😂' }
            ]
          },
          {
            name: 'Voice Channels',
            emoji: '🔊',
            channels: [
              { name: 'lounge-1', type: 2, emoji: '🎙️' },
              { name: 'lounge-2', type: 2, emoji: '🎙️' }
            ]
          }
        ],
        roles: [
          { name: 'Owner', color: 16711680, emoji: '👑' },
          { name: 'Admin', color: 15158332, emoji: '🛡️' },
          { name: 'Moderator', color: 3447003, emoji: '⚔️' },
          { name: 'Member', color: 10070709, emoji: '👤' }
        ]
      };
    }
  }

  private formatTreeView(design: any, serverName: string): string {
    let output = `\u001b[0;36m${serverName}\u001b[0m\n`;
    
    // Roles section
    if (design.roles && design.roles.length > 0) {
      output += `├─ \u001b[0;35m${emojis.shield} Roles (${design.roles.length})\u001b[0m\n`;
      design.roles.forEach((role: any, index: number) => {
        const isLast = index === design.roles.length - 1;
        const emoji = role.emoji || emojis.user;
        const prefix = isLast ? '└─' : '├─';
        output += `│  ${prefix} ${emoji} \u001b[0;33m${role.name}\u001b[0m\n`;
      });
    }

    // Categories with channels
    if (design.categories && design.categories.length > 0) {
      design.categories.forEach((category: any, catIndex: number) => {
        const isLastCat = catIndex === design.categories.length - 1;
        const catPrefix = isLastCat ? '└─' : '├─';
        const catEmoji = category.emoji || emojis.folder;
        
        output += `${catPrefix} ${catEmoji} \u001b[0;34m${category.name}\u001b[0m\n`;
        
        if (category.channels && category.channels.length > 0) {
          category.channels.forEach((channel: any, chIndex: number) => {
            const isLastCh = chIndex === category.channels.length - 1;
            const linePrefix = isLastCat ? '   ' : '│  ';
            const chPrefix = isLastCh ? '└─' : '├─';
            const chEmoji = channel.emoji || (channel.type === 2 ? emojis.music : emojis.message);
            const chName = channel.type === 2 ? `\u001b[0;36m${channel.name}\u001b[0m` : `\u001b[0;32m${channel.name}\u001b[0m`;
            
            output += `${linePrefix}${chPrefix} ${chEmoji} ${chName}\n`;
          });
        }
      });
    }
    // Fallback for old format (channels without categories)
    else if (design.channels && design.channels.length > 0) {
      output += `└─ ${emojis.folder} \u001b[0;34mChannels\u001b[0m\n`;
      design.channels.forEach((channel: any, index: number) => {
        const isLast = index === design.channels.length - 1;
        const emoji = channel.emoji || emojis.message;
        output += `   ${isLast ? '└' : '├'}─ ${emoji} \u001b[0;32m${channel.name}\u001b[0m\n`;
      });
    }

    return output;
  }
}
