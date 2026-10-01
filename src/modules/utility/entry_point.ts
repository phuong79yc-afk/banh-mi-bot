import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import testEmojiCommand from './test-emoji';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import * as path from 'path';

export default class UtilityModule {
  name = 'utility';
  description = 'Utility commands (poll, calc, random, choose)';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`${emojis.rocket} Utility module initialized`);
    this.registerCommands();
    console.log(`${emojis.success} Utility module registered ${this.commands.size} commands`);
  }

  // Generate Help Banner
  private async generateHelpBanner(): Promise<Buffer> {
    const width = 940;
    const height = 96;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
    } catch (e) {
      console.log(`${emojis.warning} Minecraft font not found, using default`);
    }

    // Load Moss Block texture background
    try {
      const texturePath = path.resolve(__dirname, '../../../assets/textures/moss_block.png');
      const texture = await loadImage(texturePath);
      
      const scaledSize = 64;
      const tempCanvas = createCanvas(scaledSize, scaledSize);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(texture, 0, 0, scaledSize, scaledSize);
      
      const pattern = ctx.createPattern(tempCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Darker overlay
      ctx.fillStyle = 'rgba(10, 20, 10, 0.4)';
      ctx.fillRect(0, 0, width, height);
    } catch (e) {
      // Fallback green gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#527F4E');
      gradient.addColorStop(1, '#3E5F3B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw text with shadow
    const drawText = (text: string, x: number, y: number, fontSize: number, color: string) => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillText(text, x + 2, y + 2);
      
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Help icon (book)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(20, 24, 48, 48);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(24, 28, 40, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(32, 36, 8, 24);
    ctx.fillRect(44, 36, 8, 24);

    // Title
    drawText('HELP MENU', 88, 20, 28, '#FFFFFF');
    
    // Subtitle
    drawText('View all available commands', 88, 56, 16, '#AAAAAA');

    // Command count badge (right side)
    const totalCommands = '72+';
    ctx.fillStyle = '#5865F2';
    ctx.fillRect(820, 24, 100, 48);
    ctx.fillStyle = '#4752C4';
    ctx.fillRect(822, 26, 96, 44);
    
    drawText(totalCommands, 845, 32, 24, '#FFFFFF');
    drawText('COMMANDS', 832, 58, 12, '#AAAAAA');

    return canvas.toBuffer('image/png');
  }

  // Generate Info Banner
  private async generateInfoBanner(): Promise<Buffer> {
    const width = 940;
    const height = 96;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
    } catch (e) {
      console.log(`${emojis.warning} Minecraft font not found, using default`);
    }

    // Load End Stone texture background
    try {
      const texturePath = path.resolve(__dirname, '../../../assets/textures/end_stone.png');
      const texture = await loadImage(texturePath);
      
      const scaledSize = 64;
      const tempCanvas = createCanvas(scaledSize, scaledSize);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(texture, 0, 0, scaledSize, scaledSize);
      
      const pattern = ctx.createPattern(tempCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Darker overlay
      ctx.fillStyle = 'rgba(15, 18, 10, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } catch (e) {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#8a8560');
      gradient.addColorStop(1, '#6B6847');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw text with shadow
    const drawText = (text: string, x: number, y: number, fontSize: number, color: string) => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillText(text, x + 2, y + 2);
      
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Info icon (i in circle)
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.arc(44, 48, 24, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 36, 8, 8); // dot
    ctx.fillRect(40, 48, 8, 16); // line

    // Title
    drawText('BOT INFORMATION', 88, 20, 28, '#FFFFFF');
    
    // Subtitle
    drawText('TypeScript-based Discord Bot with AI', 88, 56, 16, '#AAAAAA');

    // Version badge (right side)
    const uptime = Math.floor(process.uptime() / 3600);
    ctx.fillStyle = '#57F287';
    ctx.fillRect(780, 24, 140, 48);
    ctx.fillStyle = '#3BA55D';
    ctx.fillRect(782, 26, 136, 44);
    
    drawText('ONLINE', 810, 32, 20, '#FFFFFF');
    drawText(`${uptime}h uptime`, 792, 58, 12, '#E0E0E0');

    return canvas.toBuffer('image/png');
  }

  // Generate Rule Banner
  private async generateRuleBanner(): Promise<Buffer> {
    const width = 940;
    const height = 96;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
    } catch (e) {
      console.log(`${emojis.warning} Minecraft font not found, using default`);
    }

    // Red gradient background (rule theme)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ED4245');
    gradient.addColorStop(1, '#A32D30');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Darker overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw text with shadow
    const drawText = (text: string, x: number, y: number, fontSize: number, color: string) => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillText(text, x + 2, y + 2);
      
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Scroll icon (left)
    ctx.fillStyle = '#F4E4C1';
    ctx.fillRect(20, 20, 56, 56);
    ctx.fillStyle = '#E8D4A8';
    ctx.fillRect(24, 24, 48, 48);
    
    // Scroll lines
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(32, 32, 32, 4);
    ctx.fillRect(32, 40, 32, 4);
    ctx.fillRect(32, 48, 24, 4);
    ctx.fillRect(32, 56, 28, 4);
    ctx.fillRect(32, 64, 32, 4);

    // Title
    drawText('SERVER RULES', 96, 20, 28, '#FFFFFF');
    
    // Subtitle
    drawText('Read and follow these guidelines', 96, 56, 16, '#FFCCCC');

    // Warning badge (right side)
    ctx.fillStyle = '#FEE75C';
    ctx.fillRect(800, 24, 120, 48);
    ctx.fillStyle = '#E6D054';
    ctx.fillRect(802, 26, 116, 44);
    
    // Warning triangle
    ctx.fillStyle = '#ED4245';
    ctx.beginPath();
    ctx.moveTo(860, 36);
    ctx.lineTo(850, 52);
    ctx.lineTo(870, 52);
    ctx.closePath();
    ctx.fill();
    
    // Exclamation mark
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(858, 40, 4, 6);
    ctx.fillRect(858, 48, 4, 2);
    
    drawText('IMPORTANT', 812, 58, 12, '#8B4513');

    return canvas.toBuffer('image/png');
  }

  private registerCommands() {
    // Store reference to this module instance
    const self = this;
    
    // Poll command
    const pollCommand = {
      data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('${emojis.chart} Tạo bình chọn')
        .addStringOption(option =>
          option
            .setName('question')
            .setDescription('Câu hỏi bình chọn')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('options')
            .setDescription('Các lựa chọn (phân cách bằng dấu phẩy, tối đa 10)')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const question = interaction.options.getString('question', true);
        const optionsStr = interaction.options.getString('options', true);
        const options = optionsStr.split(',').map(opt => opt.trim()).filter(Boolean);

        if (options.length < 2) {
          return interaction.reply({
            content: `${emojis.error} Cần ít nhất 2 options!`,
            flags: 64
          });
        }

        if (options.length > 10) {
          return interaction.reply({
            content: `${emojis.error} Tối đa 10 options!`,
            flags: 64
          });
        }

        const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const optionsText = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n');

        const embed = createEnhancedEmbed({
          title: `${emojis.chart} Poll`,
          description: `**${question}**\n\n${optionsText}\n\n${emojis.users} ${emojis.users} **React để vote!**`,
          color: 0x5865F2,
          footer: `Poll by ${interaction.user.username}`,
        });

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
          await message.react(numberEmojis[i]);
        }
      }
    };

    // Calc command
    const calcCommand = {
      data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('🧮 Tính toán biểu thức')
        .addStringOption(option =>
          option
            .setName('expression')
            .setDescription('Biểu thức toán học (vd: 2+2, 5*10)')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const expression = interaction.options.getString('expression', true);

        try {
          // Safe eval - only allow numbers and basic operators
          const sanitized = expression.replace(/[^0-9+\-*/.()%\s]/g, '');
          const result = eval(sanitized);

          const embed = createEnhancedEmbed({
            title: `${emojis.terminal} Calculator`,
            description: `**Expression:** \`${expression}\`\n\n# ${result}\n\n${emojis.success} ${emojis.success} ${emojis.success}`,
            color: 0x57F287,
          });

          await interaction.reply({ embeds: [embed] });
        } catch (error: any) {
          await interaction.reply({
            content: `${emojis.error} Invalid expression: ${error.message}`,
            flags: 64
          });
        }
      }
    };

    // Random command
    const randomCommand = {
      data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('🎲 Tạo số ngẫu nhiên')
        .addIntegerOption(option =>
          option
            .setName('min')
            .setDescription('Giá trị tối thiểu')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max')
            .setDescription('Giá trị tối đa')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const min = interaction.options.getInteger('min') || 1;
        const max = interaction.options.getInteger('max') || 100;

        if (min >= max) {
          return interaction.reply({
            content: `${emojis.error} Min phải nhỏ hơn Max!`,
            flags: 64
          });
        }

        const result = Math.floor(Math.random() * (max - min + 1)) + min;

        const embed = createEnhancedEmbed({
          title: `${emojis.sparkles} Random Number`,
          description: `**Range:** ${min} - ${max}\n\n${emojis.sparkles} ${emojis.sparkles} ${emojis.sparkles}\n\n# ${result}\n\n${emojis.success} **Random result!**`,
          color: 0xFF6B6B,
        });

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Choose command with animation
    const chooseCommand = {
      data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('🤔 Chọn giữa các lựa chọn với hiệu ứng')
        .addStringOption(option =>
          option
            .setName('options')
            .setDescription('Các lựa chọn (phân cách bằng dấu phẩy, vd: pizza, burger, sushi)')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const optionsStr = interaction.options.getString('options', true);
        const options = optionsStr.split(',').map(opt => opt.trim()).filter(Boolean);

        if (options.length < 2) {
          return interaction.reply({
            content: `${emojis.error} Cần ít nhất 2 options phân cách bởi dấu phẩy!`,
            flags: 64
          });
        }

        await interaction.deferReply();

        // Animation frames with larger emojis
        const frames = [
          `${emojis.loading} **Đang suy nghĩ...**`,
          `${emojis.loading} **Đang cân nhắc...**`,
          `${emojis.loading} **Hmmm...**`,
          `${emojis.sparkles} **Quyết định thôi...**`,
          `${emojis.success} **Đã chọn!**`
        ];

        // Show thinking animation
        for (let i = 0; i < frames.length; i++) {
          await interaction.editReply({ content: frames[i] });
          await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay
        }

        // Final choice with large emoji
        const chosen = options[Math.floor(Math.random() * options.length)];

        const text = `## ${emojis.search} Decision Maker\n\n` +
          `**Options:**\n${options.map(opt => `• ${opt}`).join('\n')}\n\n` +
          `${emojis.star} ${emojis.star} ${emojis.star}\n\n` +
          `# ➤ ${chosen}\n\n` +
          `${emojis.success} ${emojis.success} ${emojis.success}\n\n` +
          `*${options.length} options available*`;

        await interaction.editReply({ content: text });
      }
    };

    // Help command - Giống 100% GlitchBucket
    const helpCommand = {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 Menu Trợ Giúp - Xem tất cả lệnh'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        // DEFER only once at the start
        await interaction.deferReply();
        
        const client = interaction.client;

        // Generate help banner
        const { AttachmentBuilder } = require('discord.js');
        let bannerAttachment = null;
        
        try {
          const bannerBuffer = await self.generateHelpBanner();
          bannerAttachment = new AttachmentBuilder(bannerBuffer, { name: 'help-banner.png' });
          console.log(`${emojis.success} Help banner generated successfully`);
        } catch (error) {
          console.error('${emojis.error} Error generating help banner:', error);
        }

        // Get all commands from all modules
        const allCommands: any[] = [];
        client.emit('getAllCommands', allCommands);

        // Categorize commands with descriptions
        const categories: any = {};
        
        for (const cmd of allCommands) {
          const name = cmd.data.name;
          const description = cmd.data.description || 'No description';
          let category = 'Khác';
          let emoji = '${emojis.art}';

          if (name.startsWith('ticket-') || name.startsWith('sticky-') || name.startsWith('autoresponder-')) {
            category = 'Hệ thống xử lí tin nhắn';
            emoji = '${emojis.message}';
          } else if (name.startsWith('moderation-')) {
            category = 'Moderation';
            emoji = '${emojis.shield}';
          } else if (name.startsWith('ai-') || name === 'ai' || ['kiss', 'hug', 'slap', 'bite', 'pat', 'punch', 'handhold'].includes(name) || name.startsWith('gtn-') || name.startsWith('giveaway-')) {
            category = 'Giải trí';
            emoji = '${emojis.sparkles}';
          } else if (name.startsWith('customrole-') || name.startsWith('donation-') || name.startsWith('quickreport-') || name === 'Report Message' || name.startsWith('generator')) {
            category = 'Management';
            emoji = '⚙️';
          } else if (['poll', 'calc', 'random', 'choose', 'information', 'help', 'rule', 'rule-setup'].includes(name) || name.startsWith('afk-') || name.startsWith('minecraft-') || name.startsWith('snipe') || name === 'editsnipe') {
            category = 'Utility';
            emoji = '🔧';
          }

          if (!categories[category]) {
            categories[category] = { emoji, commands: [] };
          }
          categories[category].commands.push({ name, description });
        }

        // Get current time for footer
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');

        // Build main embed with custom footer (not using createEnhancedEmbed's auto-footer)
        const embed = new EmbedBuilder()
          .setTitle(`${emojis.document} Menu Trợ Giúp`)
          .setDescription(
            `**Banh Cuon Bot** là bot Discord TypeScript-based với AI integration, đáp ứng mọi nhu cầu thiết yếu.\n\n` +
            `• [Server Giải đáp & Hỗ trợ](https://discord.gg/support)\n` +
            `• [Hướng dẫn Sử dụng](https://docs.bot.com) – [Điều khoản Dịch vụ](https://tos.bot.com) – [Chính sách Bảo mật](https://privacy.bot.com) – [Invite bot!](https://invite.bot.com)\n\n` +
            `Để xem hướng dẫn về các lệnh có sẵn, sử dụng dropdown phía dưới.`
          )
          .setColor(0x5865F2)
          .addFields(
            {
              name: '${emojis.message} Hệ thống xử lí tin nhắn',
              value: `**${categories['Hệ thống xử lí tin nhắn']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '${emojis.sparkles} Giải trí',
              value: `**${categories['Giải trí']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '⚙️ Management',
              value: `**${categories['Management']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '${emojis.shield} Moderation',
              value: `**${categories['Moderation']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '🔧 Utility',
              value: `**${categories['Utility']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '${emojis.art} Khác',
              value: `**${categories['Khác']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: 'Lệnh prefix',
              value: '60',
              inline: true
            },
            {
              name: 'Lệnh slash',
              value: `${allCommands.length}`,
              inline: true
            }
          )
          .setFooter({ text: `Banh Cuon Bot • Tổng: ${allCommands.length} lệnh • Hôm nay lúc ${hours}:${minutes}` })
          .setTimestamp();
        
        // Add banner image if generated
        if (bannerAttachment) {
          embed.setImage('attachment://help-banner.png');
        }

        // Create select menu
        const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('help_category')
          .setPlaceholder('Chọn module lệnh...')
          .addOptions(
            Object.keys(categories).sort().map(cat => ({
              label: cat,
              description: `${categories[cat].commands.length} lệnh`,
              value: cat
            }))
          );

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const prefixBtn = new ButtonBuilder()
          .setCustomId('help_prefix')
          .setLabel('Lệnh Prefix')
          .setStyle(ButtonStyle.Primary);

        const slashBtn = new ButtonBuilder()
          .setCustomId('help_slash')
          .setLabel('Lệnh Slash')
          .setStyle(ButtonStyle.Primary);

        const row2 = new ActionRowBuilder().addComponents(prefixBtn, slashBtn);

        const replyOptions: any = { 
          embeds: [embed],
          components: [row1, row2]
        };
        
        if (bannerAttachment) {
          replyOptions.files = [bannerAttachment];
        }

        await interaction.editReply(replyOptions);

        // Handle interactions
        const collector = interaction.channel?.createMessageComponentCollector({
          filter: (i) => (i.customId.startsWith('help_')) && i.user.id === interaction.user.id,
          time: 300000 // 5 minutes
        });

        collector?.on('collect', async (i) => {
          // IMPORTANT: Use deferUpdate() instead of deferReply() for button/select menu interactions
          try {
            await i.deferUpdate();
          } catch (error) {
            console.error('Error deferring update:', error);
            return;
          }
          
          if (i.customId === 'help_category' && i.isStringSelectMenu()) {
            const selectedCategory = i.values[0];
            const categoryData = categories[selectedCategory];

            // Create detailed command list with descriptions
            const commandList = categoryData.commands
              .map((cmd: any, index: number) => {
                const cmdName = typeof cmd === 'string' ? cmd : cmd.name;
                const cmdDesc = typeof cmd === 'string' ? 'No description' : cmd.description;
                return `**${index + 1}. \`/${cmdName}\`**\n${cmdDesc}`;
              })
              .join('\n\n');

            const categoryEmbed = new EmbedBuilder()
              .setTitle(`${categoryData.emoji} ${selectedCategory}`)
              .setDescription(
                `**${categoryData.commands.length}** lệnh trong module này\n\n` +
                `━━━━━━━━━━━━━━━━━━━\n\n` +
                `${commandList}`
              )
              .setColor(0x5865F2)
              .setFooter({ text: `Banh Cuon Bot • Tổng: ${allCommands.length} lệnh • Hôm nay lúc ${hours}:${minutes}` })
              .setTimestamp();

            try {
              await i.editReply({ embeds: [categoryEmbed], components: [row1, row2] });
            } catch (error) {
              console.error('Error editing reply:', error);
            }
          } else if (i.customId === 'help_prefix' || i.customId === 'help_slash') {
            // Return to main menu
            try {
              await i.editReply({ embeds: [embed], components: [row1, row2] });
            } catch (error) {
              console.error('Error editing reply:', error);
            }
          }
        });
      }
    };

    // Info command
    const infoCommand = {
      data: new SlashCommandBuilder()
        .setName('information')
        .setDescription('${emojis.info} Thông tin về bot'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        // Generate info banner
        const { AttachmentBuilder } = require('discord.js');
        let bannerAttachment = null;
        
        try {
          const bannerBuffer = await self.generateInfoBanner();
          bannerAttachment = new AttachmentBuilder(bannerBuffer, { name: 'info-banner.png' });
          console.log(`${emojis.success} Info banner generated successfully`);
        } catch (error) {
          console.error('${emojis.error} Error generating info banner:', error);
        }
        
        const client = interaction.client;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024 / 1024).toFixed(2);
        const memTotal = (process.memoryUsage().heapTotal / 1024 / 1024 / 1024).toFixed(2);
        const memPercent = ((parseFloat(memUsage) / parseFloat(memTotal)) * 100).toFixed(2);

        // Convert English time to Vietnamese
        const convertTimeToVietnamese = (time: string): string => {
          return time
            .replace(/(\d+) second(s?) ago/, '$1 giây trước')
            .replace(/(\d+) minute(s?) ago/, '$1 phút trước')
            .replace(/(\d+) hour(s?) ago/, '$1 giờ trước')
            .replace(/(\d+) day(s?) ago/, '$1 ngày trước')
            .replace(/(\d+) week(s?) ago/, '$1 tuần trước')
            .replace(/(\d+) month(s?) ago/, '$1 tháng trước')
            .replace(/(\d+) year(s?) ago/, '$1 năm trước');
        };

        // Get latest commits from git with real repo URL
        let commitsText = '';
        let repoUrl = 'https://github.com/phuong79yc-afk/banh-mi-bot';
        let branchInfo = '';
        
        try {
          const { execSync } = require('child_process');
          
          // Get current branch
          try {
            const branch = execSync('git branch --show-current', { 
              cwd: process.cwd(),
              encoding: 'utf8',
              timeout: 3000
            }).trim();
            
            // Get total commits on this branch
            const totalCommits = execSync('git rev-list --count HEAD', { 
              cwd: process.cwd(),
              encoding: 'utf8',
              timeout: 3000
            }).trim();
            
            branchInfo = `Branch: \`${branch}\` • ${totalCommits} commits`;
          } catch (err) {
            branchInfo = 'Git info unavailable';
          }
          
          // Get remote URL
          try {
            const remote = execSync('git remote get-url origin', { 
              cwd: process.cwd(),
              encoding: 'utf8',
              timeout: 3000
            }).trim();
            
            // Convert git URL to https URL
            if (remote.startsWith('git@github.com:')) {
              repoUrl = remote.replace('git@github.com:', 'https://github.com/').replace('.git', '');
            } else if (remote.startsWith('https://')) {
              repoUrl = remote.replace('.git', '');
            }
          } catch (err) {
            // Use default if can't get remote
          }
          
          const gitLog = execSync('git log -5 --pretty=format:"%ar|%h|%s"', { 
            cwd: process.cwd(),
            encoding: 'utf8',
            timeout: 5000
          });
          
          const commits = gitLog.split('\n').map((line: string) => {
            const [time, hash, ...msgParts] = line.split('|');
            const msg = msgParts.join('|');
            return { time: convertTimeToVietnamese(time), hash, msg };
          });

          commitsText = commits.map((c: any) => 
            `${c.time} [\`${c.hash}\`](${repoUrl}/commit/${c.hash}) ${c.msg}`
          ).join('\n');
        } catch (error) {
          commitsText = '*Không thể lấy thông tin commit*';
        }

        // Try to get help command ID for clickable mention
        let helpMention = '/help';
        try {
          if (interaction.guild) {
            const guildCommands = await interaction.guild.commands.fetch();
            const helpCmd = guildCommands.find(cmd => cmd.name === 'help');
            if (helpCmd) {
              helpMention = `</help:${helpCmd.id}>`;
            }
          }
        } catch (error) {
          // Fallback to plain text
        }

        const embed = createEnhancedEmbed({
          title: `${emojis.info} Bot Information`,
          description: 
            `**${client.user?.username}** - Discord bot TypeScript-based với AI integration\n\n` +
            `${emojis.tag} ${branchInfo}\n\n` +
            `• Sử dụng ${helpMention} để xem danh sách lệnh\n\n` +
            `${emojis.clock} *Uptime: **${hours} giờ***`,
          color: 0x5865F2,
          timestamp: false,
          fields: [
            {
              name: `${emojis.chart} Stats`,
              value: 
                `${emojis.server} **${client.guilds.cache.size.toLocaleString()}** servers\n` +
                `${emojis.users} **${totalMembers.toLocaleString()}** members`,
              inline: true
            },
            {
              name: `${emojis.database} Resources`,
              value:
                `${emojis.terminal} **${memUsage} GiB** (${memPercent}%)\n` +
                `${emojis.clock} **${hours}h** uptime`,
              inline: true
            },
            {
              name: `${emojis.refresh} Latest Updates`,
              value: commitsText || '*No git info available*',
              inline: false
            }
          ],
          footer: `discord.kingmc.vn | hotro.kingmc.vn`
        });
        
        // Add banner image if generated
        if (bannerAttachment) {
          embed.setImage('attachment://info-banner.png');
        }

        const replyOptions: any = { embeds: [embed] };
        if (bannerAttachment) {
          replyOptions.files = [bannerAttachment];
        }

        await interaction.editReply(replyOptions);
      }
    };

    // Rule command
    const ruleCommand = {
      data: new SlashCommandBuilder()
        .setName('rule')
        .setDescription('📜 Xem luật server'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: 64 }); // ephemeral
        
        // Find rules channel
        const rulesChannel = interaction.guild?.channels.cache.find(
          ch => ch.name === 'rules' || ch.name === '📜rules' || ch.name === 'luật-server'
        );

        if (rulesChannel) {
          return interaction.editReply({
            content: `📜 Rules channel: <#${rulesChannel.id}>\n\nSử dụng \`/rule-setup\` để tạo rules channel mới.`
          });
        }

        await interaction.editReply({
          content: `${emojis.error} Chưa có rules channel!\n\nSử dụng \`/rule-setup\` để tạo rules channel.`
        });
      }
    };

    // Rule Setup command - Creates dedicated rules channel
    const ruleSetupCommand = {
      data: new SlashCommandBuilder()
        .setName('rule-setup')
        .setDescription('⚙️ Tạo danh mục và kênh rules riêng')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
          option
            .setName('force')
            .setDescription('Buộc tạo lại từ đầu (xóa rules cũ)')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const force = interaction.options.getBoolean('force') || false;

        // Find ALL existing rules-related channels and categories
        const existingRulesChannels = interaction.guild?.channels.cache.filter(
          ch => ch.name === 'rules' || ch.name === '📜rules' || ch.name === 'luật-server' || ch.name.toLowerCase().includes('rule')
        );

        const existingRulesCategories = interaction.guild?.channels.cache.filter(
          ch => ch.type === 4 && (ch.name === '📜 RULES' || ch.name.toLowerCase().includes('rule'))
        );

        const totalExisting = (existingRulesChannels?.size || 0) + (existingRulesCategories?.size || 0);

        if (totalExisting > 0 && !force) {
          const channelList = existingRulesChannels?.map(ch => `<#${ch.id}>`).join(', ') || 'Không có';
          const categoryList = existingRulesCategories?.map(ch => `**${ch.name}**`).join(', ') || 'Không có';
          
          return interaction.editReply({
            content: 
              `${emojis.warning} **Đã tìm thấy rules channel/category cũ:**\n\n` +
              `**Channels:** ${channelList}\n` +
              `**Categories:** ${categoryList}\n\n` +
              `Dùng \`force=True\` để xóa tất cả và tạo lại.`
          });
        }

        const { ChannelType, PermissionFlagsBits: Perms } = require('discord.js');

        // Progress embed with animated emojis from config
        const progressEmbed = createEnhancedEmbed({
          title: '⚙️ Thiết lập Rules Channel',
          description: 
            `\`[1/3]\` ${emojis.loading} Đang tạo danh mục...\n` +
            `\`[2/3]\` ${emojis.loading} Đang chuẩn bị...\n` +
            `\`[3/3]\` ${emojis.loading} Đang chuẩn bị...`,
          color: 0x5865F2,
          timestamp: false,
        });
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 1: Create Rules category
        await new Promise(resolve => setTimeout(resolve, 500));

        const category = await interaction.guild?.channels.create({
          name: '📜 RULES',
          type: ChannelType.GuildCategory,
          position: 0, // Top of the list
          permissionOverwrites: [{
            id: interaction.guild.id,
            allow: [Perms.ViewChannel],
            deny: [Perms.SendMessages] // Read-only for everyone
          }]
        });

        progressEmbed.setDescription(
          `\`[1/3]\` ${emojis.success} Đã tạo danh mục **📜 RULES**\n` +
          `\`[2/3]\` ${emojis.loading} Đang tạo kênh rules...\n` +
          `\`[3/3]\` ${emojis.loading} Đang chuẩn bị...`
        );
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 2: Create rules channel
        await new Promise(resolve => setTimeout(resolve, 500));

        const rulesChannel = await interaction.guild?.channels.create({
          name: '📜rules',
          type: ChannelType.GuildText,
          parent: category,
          position: 0,
          topic: 'Server Rules - Please read and follow',
          permissionOverwrites: [
            {
              id: interaction.guild!.id,
              allow: [Perms.ViewChannel, Perms.ReadMessageHistory],
              deny: [Perms.SendMessages, Perms.AddReactions]
            }
          ]
        });

        progressEmbed.setDescription(
          `\`[1/3]\` ${emojis.success} Đã tạo danh mục **📜 RULES**\n` +
          `\`[2/3]\` ${emojis.success} Đã tạo kênh <#${rulesChannel!.id}>\n` +
          `\`[3/3]\` ${emojis.loading} Đang gửi rules...`
        );
        await interaction.editReply({ embeds: [progressEmbed] });

        // STEP 3: Send rules with custom GIF banner
        await new Promise(resolve => setTimeout(resolve, 500));

        // Load GIF banner from assets folder
        const gifBannerPath = path.resolve(__dirname, '../../../assets/banners/rule-banner.gif');
        let gifBannerUrl = 'https://i.imgur.com/placeholder.gif'; // Fallback URL
        
        // Check if GIF file exists
        const fs = require('fs');
        let bannerAttachment = null;
        
        if (fs.existsSync(gifBannerPath)) {
          const { AttachmentBuilder } = require('discord.js');
          bannerAttachment = new AttachmentBuilder(gifBannerPath, { name: 'rule-banner.gif' });
          console.log(`${emojis.success} Loaded rule GIF banner from assets`);
        } else {
          console.log(`${emojis.warning} rule-banner.gif not found in assets/banners/, using fallback`);
        }

        // Default rules
        const rules = [
          {
            number: '1',
            title: 'Tôn trọng mọi người',
            description: 'Không spam, flood, hoặc quấy rối thành viên khác. Hãy lịch sự và tôn trọng.'
          },
          {
            number: '2',
            title: 'Không nội dung không phù hợp',
            description: 'Cấm chia sẻ nội dung NSFW, bạo lực, hoặc vi phạm pháp luật.'
          },
          {
            number: '3',
            title: 'Không quảng cáo',
            description: 'Không quảng cáo server/sản phẩm khác trừ khi được cho phép.'
          },
          {
            number: '4',
            title: 'Sử dụng đúng kênh',
            description: 'Đăng nội dung vào đúng kênh chuyên đề.'
          },
          {
            number: '5',
            title: 'Không gian lận',
            description: 'Cấm sử dụng bot spam, tự động hóa không được phép.'
          },
          {
            number: '6',
            title: 'Tuân thủ Discord ToS',
            description: 'Tuân thủ [Discord Terms of Service](https://discord.com/terms) và [Community Guidelines](https://discord.com/guidelines).'
          }
        ];

        const rulesText = rules.map(rule => 
          `**${rule.number}.** **${rule.title}**\n${rule.description}`
        ).join('\n\n');

        const embed = createEnhancedEmbed({
          title: '📜 Luật Server',
          description: 
            `Chào mừng đến **${interaction.guild?.name}**! 🎉\n\n` +
            `Vui lòng đọc và tuân thủ các quy tắc sau:\n\n` +
            `${rulesText}\n\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `${emojis.warning} **Vi phạm sẽ bị**: Cảnh cáo → Timeout → Kick → Ban\n\n` +
            `Cảm ơn bạn đã giúp giữ cho server thân thiện và an toàn! 💚`,
          color: 0xED4245,
          footer: `${interaction.guild?.name} • Server Rules`,
          timestamp: false,
        });

        // Use GIF banner (either from file or fallback URL)
        if (bannerAttachment) {
          embed.setImage('attachment://rule-banner.gif');
        } else {
          embed.setImage(gifBannerUrl);
        }

        const messageOptions: any = { embeds: [embed] };
        if (bannerAttachment) {
          messageOptions.files = [bannerAttachment];
        }

        await rulesChannel?.send(messageOptions);

        // Final success with animated emoji
        const successEmbed = createEnhancedEmbed({
          title: `${emojis.success} Rules Channel Setup Complete!`,
          description: 
            `\`[1/3]\` ${emojis.success} Đã tạo danh mục **📜 RULES**\n` +
            `\`[2/3]\` ${emojis.success} Đã tạo kênh <#${rulesChannel!.id}>\n` +
            `\`[3/3]\` ${emojis.success} Đã gửi rules và khóa kênh (read-only)\n\n` +
            `**Rules channel:** <#${rulesChannel!.id}>\n` +
            `**Quyền:** Tất cả có thể đọc, không ai có thể gửi tin nhắn\n\n` +
            `Bạn có thể chỉnh sửa rules bằng cách edit tin nhắn trong <#${rulesChannel!.id}>`,
          color: 0x57F287,
          timestamp: false,
        });

        await interaction.editReply({ embeds: [successEmbed] });

        // Cleanup old rules (if force) - Delete ALL old channels AND categories
        if (force && totalExisting > 0) {
          setTimeout(async () => {
            try {
              console.log(`${emojis.delete} Cleaning up ${totalExisting} old rules channels/categories...`);
              
              // Strategy: Delete categories first (which auto-deletes their child channels)
              // Then delete any remaining standalone channels
              
              // Step 1: Delete all old rules categories (this also deletes child channels)
              if (existingRulesCategories && existingRulesCategories.size > 0) {
                for (const [id, category] of existingRulesCategories) {
                  try {
                    // Fetch fresh to ensure it still exists
                    const freshCategory = await interaction.guild?.channels.fetch(id).catch(() => null);
                    if (freshCategory) {
                      await freshCategory.delete('Rules setup: cleanup old category');
                      console.log(`${emojis.success} Deleted old category: ${category.name} (and its child channels)`);
                    }
                  } catch (err: any) {
                    // Ignore "Unknown Channel" errors (already deleted)
                    if (err.code !== 10003) {
                      console.error(`${emojis.error} Error deleting category ${category.name}:`, err);
                    }
                  }
                }
              }
              
              // Step 2: Delete any remaining standalone rules channels (not in a category)
              if (existingRulesChannels && existingRulesChannels.size > 0) {
                for (const [id, channel] of existingRulesChannels) {
                  try {
                    // Fetch fresh to ensure it still exists (may have been deleted with parent category)
                    const freshChannel = await interaction.guild?.channels.fetch(id).catch(() => null);
                    if (freshChannel) {
                      await freshChannel.delete('Rules setup: cleanup old channel');
                      console.log(`${emojis.success} Deleted old standalone channel: ${channel.name}`);
                    }
                  } catch (err: any) {
                    // Ignore "Unknown Channel" errors (already deleted with parent)
                    if (err.code !== 10003) {
                      console.error(`${emojis.error} Error deleting channel ${channel.name}:`, err);
                    }
                  }
                }
              }
              
              console.log(`${emojis.success} Cleanup complete!`);
            } catch (error) {
              console.error('${emojis.error} Error during cleanup:', error);
            }
          }, 3000);
        }
      }
    };

    // Add all commands
    this.commands.set('poll', pollCommand);
    this.commands.set('calc', calcCommand);
    this.commands.set('random', randomCommand);
    this.commands.set('choose', chooseCommand);
    this.commands.set('help', helpCommand);
    this.commands.set('information', infoCommand);
    this.commands.set('rule', ruleCommand);
    this.commands.set('rule-setup', ruleSetupCommand);
    this.commands.set('test-emoji', testEmojiCommand);
  }

  async cleanup() {
    console.log('🧹 Utility module cleanup');
  }
}
