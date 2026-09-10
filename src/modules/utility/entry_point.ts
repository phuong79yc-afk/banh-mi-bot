import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import testEmojiCommand from './test-emoji';

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
    console.log('🚀 Utility module initialized');
    this.registerCommands();
    console.log(`✅ Utility module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // Poll command
    const pollCommand = {
      data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription(`${emojis.chart} Tạo bình chọn`)
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
        .setDescription(`${emojis.document} Menu Trợ Giúp - Xem tất cả lệnh`),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const client = interaction.client;

        // Get all commands from all modules
        const allCommands: any[] = [];
        client.emit('getAllCommands', allCommands);

        // Categorize commands
        const categories: any = {};
        
        for (const cmd of allCommands) {
          const name = cmd.data.name;
          let category = 'Khác';
          let emoji = '🎨';

          if (name.startsWith('ticket-') || name.startsWith('sticky-') || name.startsWith('autoresponder-')) {
            category = 'Hệ thống xử lí tin nhắn';
            emoji = '💬';
          } else if (name.startsWith('moderation-')) {
            category = 'Moderation';
            emoji = '🛡️';
          } else if (name.startsWith('ai-') || name === 'ai' || ['kiss', 'hug', 'slap', 'bite', 'pat', 'punch', 'handhold'].includes(name) || name.startsWith('gtn-') || name.startsWith('giveaway-')) {
            category = 'Giải trí';
            emoji = '✨';
          } else if (name.startsWith('customrole-') || name.startsWith('donation-') || name.startsWith('quickreport-') || name === 'Report Message') {
            category = 'Management';
            emoji = '⚙️';
          } else if (['poll', 'calc', 'random', 'choose', 'information', 'help'].includes(name) || name.startsWith('afk-') || name.startsWith('minecraft-') || name.startsWith('snipe') || name === 'editsnipe') {
            category = 'Utility';
            emoji = '🔧';
          }

          if (!categories[category]) {
            categories[category] = { emoji, commands: [] };
          }
          categories[category].commands.push(name);
        }

        // Get current time for footer
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');

        // Build main embed with custom footer (not using createEnhancedEmbed's auto-footer)
        const embed = new EmbedBuilder()
          .setTitle(`${emojis.document} Menu Trợ Giúp`)
          .setDescription(
            `**Supporter** là một bot Discord dựa trên [discord.py](https://discord.py), đáp ứng mọi nhu cầu thiết.\n\n` +
            `• [Server Giải đáp & Hỗ trợ](https://discord.gg/support)\n` +
            `• [Hướng dẫn Sử dụng](https://docs.bot.com) – [Điều khoản Dịch vụ](https://tos.bot.com) – [Chính sách Bảo mật](https://privacy.bot.com) – [Invite bot!](https://invite.bot.com)\n\n` +
            `Để xem hướng dẫn về các lệnh có sẵn, sử dụng dropdown phía dưới.`
          )
          .setColor(0x000000)
          .addFields(
            {
              name: '💬 Hệ thống xử lí tin nhắn',
              value: `**${categories['Hệ thống xử lí tin nhắn']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '✨ Giải trí',
              value: `**${categories['Giải trí']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '⚙️ Management',
              value: `**${categories['Management']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '🛡️ Moderation',
              value: `**${categories['Moderation']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '🔧 Utility',
              value: `**${categories['Utility']?.commands.length || 0}** lệnh`,
              inline: true
            },
            {
              name: '🎨 Khác',
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
          .setFooter({ text: `Supporter • Tổng: ${allCommands.length} lệnh • Hôm nay lúc ${hours}:${minutes}` })
          .setTimestamp();

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

        await interaction.reply({ 
          embeds: [embed],
          components: [row1, row2]
        });

        // Handle interactions
        const collector = interaction.channel?.createMessageComponentCollector({
          filter: (i) => (i.customId.startsWith('help_')) && i.user.id === interaction.user.id,
          time: 300000 // 5 minutes
        });

        collector?.on('collect', async (i) => {
          await i.deferUpdate();
          
          if (i.customId === 'help_category' && i.isStringSelectMenu()) {
            const selectedCategory = i.values[0];
            const categoryData = categories[selectedCategory];

            const categoryEmbed = new EmbedBuilder()
              .setTitle(`${categoryData.emoji} ${selectedCategory}`)
              .setDescription(`**${categoryData.commands.length}** lệnh trong module này`)
              .setColor(0x000000)
              .addFields({
                name: 'Danh sách lệnh',
                value: categoryData.commands.map((cmd: string) => `• \`/${cmd}\``).join('\n'),
                inline: false
              })
              .setFooter({ text: `Supporter • Tổng: ${allCommands.length} lệnh • Hôm nay lúc ${hours}:${minutes}` })
              .setTimestamp();

            await i.editReply({ embeds: [categoryEmbed], components: [row1, row2] });
          } else if (i.customId === 'help_prefix' || i.customId === 'help_slash') {
            // Return to main menu
            await i.editReply({ embeds: [embed], components: [row1, row2] });
          }
        });
      }
    };

    // Info command
    const infoCommand = {
      data: new SlashCommandBuilder()
        .setName('information')
        .setDescription(`${emojis.info} Thông tin về bot`),
      execute: async (interaction: ChatInputCommandInteraction) => {
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
          footer: `${emojis.heart} TypeScript + Discord.js`
        });

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Add all commands
    this.commands.set('poll', pollCommand);
    this.commands.set('calc', calcCommand);
    this.commands.set('random', randomCommand);
    this.commands.set('choose', chooseCommand);
    this.commands.set('help', helpCommand);
    this.commands.set('information', infoCommand);
    this.commands.set('test-emoji', testEmojiCommand);
  }

  async cleanup() {
    console.log('🧹 Utility module cleanup');
  }
}
