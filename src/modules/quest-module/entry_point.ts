import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  MessageReaction,
  User as DiscordUser,
  PartialMessageReaction,
  PartialUser,
  AttachmentBuilder
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

// Database path
const dataPath = path.join(process.cwd(), 'data', 'quests.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Initialize database file
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({}));
}

interface Quest {
  id: string;
  name: string;
  description: string;
  reward: number;
  target: number;
  type: 'message' | 'reaction' | 'voice' | 'daily';
}

interface UserQuestProgress {
  [questId: string]: {
    progress: number;
    completed: boolean;
    lastReset?: string;
  };
}

interface QuestData {
  [userId: string]: {
    quests: UserQuestProgress;
    totalCompleted: number;
    totalRewards: number;
    lastReset: string;
  };
}

// Default quests
const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'send_messages_10',
    name: 'Gửi 10 tin nhắn',
    description: 'Gửi 10 tin nhắn trong server',
    reward: 100,
    target: 10,
    type: 'message'
  },
  {
    id: 'send_messages_50',
    name: 'Gửi 50 tin nhắn',
    description: 'Gửi 50 tin nhắn trong server',
    reward: 500,
    target: 50,
    type: 'message'
  },
  {
    id: 'react_5',
    name: 'React 5 bài',
    description: 'Thả reaction vào 5 tin nhắn',
    reward: 150,
    target: 5,
    type: 'reaction'
  },
  {
    id: 'react_20',
    name: 'React 20 bài',
    description: 'Thả reaction vào 20 tin nhắn',
    reward: 600,
    target: 20,
    type: 'reaction'
  },
  {
    id: 'daily_checkin',
    name: 'Điểm danh hàng ngày',
    description: 'Hoàn thành điểm danh hôm nay',
    reward: 200,
    target: 1,
    type: 'daily'
  }
];

// Load data
function loadData(): QuestData {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save data
function saveData(data: QuestData): void {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Get user data
function getUserData(userId: string) {
  const data = loadData();
  const today = new Date().toISOString().split('T')[0];
  
  if (!data[userId]) {
    data[userId] = {
      quests: {},
      totalCompleted: 0,
      totalRewards: 0,
      lastReset: today
    };
    
    // Initialize quests
    DEFAULT_QUESTS.forEach(quest => {
      data[userId].quests[quest.id] = {
        progress: 0,
        completed: false
      };
    });
    
    saveData(data);
  }
  
  // Reset daily quests if new day
  if (data[userId].lastReset !== today) {
    DEFAULT_QUESTS.forEach(quest => {
      data[userId].quests[quest.id] = {
        progress: 0,
        completed: false
      };
    });
    data[userId].lastReset = today;
    saveData(data);
  }
  
  return data[userId];
}

// Update quest progress
function updateQuestProgress(userId: string, questType: 'message' | 'reaction' | 'voice' | 'daily', amount: number = 1): Quest[] {
  const data = loadData();
  const userData = getUserData(userId);
  const completedQuests: Quest[] = [];
  
  DEFAULT_QUESTS.filter(q => q.type === questType).forEach(quest => {
    const questProgress = userData.quests[quest.id];
    
    if (!questProgress.completed) {
      questProgress.progress = Math.min(questProgress.progress + amount, quest.target);
      
      // Check if quest completed
      if (questProgress.progress >= quest.target && !questProgress.completed) {
        questProgress.completed = true;
        userData.totalCompleted++;
        userData.totalRewards += quest.reward;
        completedQuests.push(quest);
        
        // Add coins to shop balance
        addCoinsToShop(userId, quest.reward);
      }
    }
  });
  
  data[userId] = userData;
  saveData(data);
  
  return completedQuests;
}

// Add coins to shop when quest completed
function addCoinsToShop(userId: string, amount: number): void {
  const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
  let coins: any = {};
  
  try {
    if (fs.existsSync(coinsPath)) {
      coins = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
    }
  } catch {}
  
  coins[userId] = (coins[userId] || 0) + amount;
  fs.writeFileSync(coinsPath, JSON.stringify(coins, null, 2));
}

// Get quest statistics
function getQuestStats(userId: string) {
  const userData = getUserData(userId);
  const completed = Object.values(userData.quests).filter(q => q.completed).length;
  const total = DEFAULT_QUESTS.length;
  
  return {
    completed,
    total,
    totalCompleted: userData.totalCompleted,
    totalRewards: userData.totalRewards,
    percentage: Math.round((completed / total) * 100)
  };
}

export default class QuestModule {
  name = 'quest-module';
  description = 'Hệ thống nhiệm vụ hàng ngày';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`✨ Quest module initialized`);
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Quest module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /quest command
    const questCommand = {
      data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Xem nhiệm vụ hàng ngày của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          // ⚡ DEFER IMMEDIATELY
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const userId = interaction.user.id;
        const userData = getUserData(userId);
        const stats = getQuestStats(userId);
        
        // Load quest banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'quest-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'quest-banner.gif' });
        
        // Build quest list
        const questList = DEFAULT_QUESTS.map(quest => {
          const progress = userData.quests[quest.id];
          const status = progress.completed ? emojis.success : emojis.loading;
          const progressBar = this.createProgressBar(progress.progress, quest.target);
          
          return [
            `${status} **${quest.name}**`,
            `└ ${quest.description}`,
            `${emojis.coin} Phần thưởng: **${quest.reward}** coins`,
            `${emojis.chart} Tiến độ: **${progress.progress}/${quest.target}** ${progressBar}`,
            ''
          ].join('\n');
        }).join('\n');
        
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setImage('attachment://quest-banner.gif')
          .setTitle(`${emojis.sparkles} Nhiệm Vụ Hàng Ngày`)
          .setDescription([
            `**${interaction.user.displayName}** - Hoàn thành nhiệm vụ để nhận coins!`,
            '',
            `━━━━━━━━━━━━━━━━━━━━`,
            '',
            `${emojis.trophy} **Đã hoàn thành**: ${stats.completed}/${stats.total} nhiệm vụ`,
            `${emojis.chart} **Tổng hoàn thành**: ${stats.totalCompleted} nhiệm vụ`,
            `${emojis.coin} **Tổng phần thưởng**: ${stats.totalRewards} coins`,
            '',
            `━━━━━━━━━━━━━━━━━━━━`,
            '',
            questList
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `${interaction.user.tag} • Nhiệm vụ reset mỗi ngày lúc 00:00`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        // Create buttons
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('quest_refresh')
              .setLabel('🔄 Làm Mới')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('quest_stats')
              .setLabel('📊 Thống Kê')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('quest_guide')
              .setLabel('🏆 Hướng Dẫn')
              .setStyle(ButtonStyle.Success)
          );
        
        const response = await interaction.editReply({ 
          embeds: [embed],
          components: [row],
          files: [bannerAttachment]
        });
        
        // Button collector
        const collector = response.createMessageComponentCollector({ 
          time: 300000 // 5 minutes
        });
        
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({ 
              content: '${emojis.error} Bạn không thể sử dụng button này!',
              ephemeral: true 
            });
            return;
          }
          
          if (i.customId === 'quest_refresh') {
            await i.deferUpdate();
            
            const newUserData = getUserData(userId);
            const newStats = getQuestStats(userId);
            
            const newQuestList = DEFAULT_QUESTS.map(quest => {
              const progress = newUserData.quests[quest.id];
              const status = progress.completed ? emojis.success : emojis.loading;
              const progressBar = this.createProgressBar(progress.progress, quest.target);
              
              return [
                `${status} **${quest.name}**`,
                `${emojis.document} ${quest.description}`,
                `${emojis.trophy} Phần thưởng: **${quest.reward}** ${emojis.trophy}`,
                `${emojis.chart} Tiến độ: **${progress.progress}/${quest.target}** ${progressBar}`,
                ''
              ].join('\n');
            }).join('\n');
            
            const newEmbed = new EmbedBuilder()
              .setColor('#5865f2')
              .setAuthor({
                name: `${emojis.refresh} Nhiệm Vụ Hàng Ngày (Đã làm mới)`,
                iconURL: interaction.user.displayAvatarURL()
              })
              .setDescription([
                `${emojis.chart} **Số Nhiệm Vụ**`,
                `• **Đã hoàn thành**: ${newStats.completed}/${newStats.total} ${emojis.trophy}`,
                `• **Tổng hoàn thành**: ${newStats.totalCompleted} nhiệm vụ`,
                `• **Tổng phần thưởng**: ${newStats.totalRewards} ${emojis.trophy}`,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                newQuestList
              ].join('\n'))
              .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
              .setFooter({
                text: `${interaction.user.tag} • Đã làm mới lúc ${new Date().toLocaleTimeString('vi-VN')}`,
                iconURL: interaction.user.displayAvatarURL()
              })
              .setTimestamp();
            
            await i.editReply({ embeds: [newEmbed] });
          }
          
          if (i.customId === 'quest_stats') {
            const statsEmbed = new EmbedBuilder()
              .setColor('#ffd700')
              .setTitle(`${emojis.chart} Thống Kê Nhiệm Vụ`)
              .addFields(
                {
                  name: `${emojis.success} Hoàn thành hôm nay`,
                  value: `**${stats.completed}**/${stats.total}`,
                  inline: true
                },
                {
                  name: `${emojis.sparkles} Tỷ lệ hoàn thành`,
                  value: `**${stats.percentage}%**`,
                  inline: true
                },
                {
                  name: `${emojis.trophy} Phần thưởng hôm nay`,
                  value: `**${userData.totalRewards}** ${emojis.trophy}`,
                  inline: true
                },
                {
                  name: `${emojis.chart} Tổng nhiệm vụ đã hoàn thành`,
                  value: `**${stats.totalCompleted}** nhiệm vụ`,
                  inline: true
                },
                {
                  name: `${emojis.gift} Tổng phần thưởng đã nhận`,
                  value: `**${stats.totalRewards}** ${emojis.trophy}`,
                  inline: true
                }
              )
              .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
              .setFooter({
                text: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL()
              })
              .setTimestamp();
            
            await i.reply({ embeds: [statsEmbed], ephemeral: true });
          }
          
          if (i.customId === 'quest_guide') {
            const guideEmbed = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle(`${emojis.info} Hướng Dẫn Nhiệm Vụ`)
              .setDescription([
                '**Cách hoàn thành nhiệm vụ:**',
                '',
                `${emojis.message} **Gửi tin nhắn** - Gửi tin nhắn trong bất kỳ kênh nào`,
                `${emojis.heart} **React bài viết** - Thả reaction vào tin nhắn`,
                `${emojis.calendar} **Điểm danh** - Sử dụng lệnh \`/daily\``,
                '',
                `${emojis.warning} **Lưu ý:**`,
                `• Nhiệm vụ reset mỗi ngày lúc 00:00`,
                `• Phần thưởng được cộng tự động khi hoàn thành`,
                `• Sử dụng \`/quest\` để kiểm tra tiến độ`,
                '',
                `${emojis.sparkles} **Mẹo:**`,
                `• Hoàn thành nhiệm vụ dễ trước để tích lũy phần thưởng`,
                `• Kiểm tra tiến độ thường xuyên với nút ${emojis.refresh} Làm Mới`,
                `• Nhiệm vụ hoàn thành sẽ có dấu ${emojis.success}`
              ].join('\n'))
              .setFooter({
                text: 'Chúc bạn hoàn thành nhiệm vụ thành công!',
                iconURL: interaction.client.user?.displayAvatarURL()
              })
              .setTimestamp();
            
            await i.reply({ embeds: [guideEmbed], ephemeral: true });
          }
        });
      }
    };

    // /quest-leaderboard command
    const leaderboardCommand = {
      data: new SlashCommandBuilder()
        .setName('quest-leaderboard')
        .setDescription('Xem bảng xếp hạng nhiệm vụ'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          // ⚡ DEFER IMMEDIATELY
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const data = loadData();
        const leaderboard = Object.entries(data)
          .map(([userId, userData]) => ({
            userId,
            totalCompleted: userData.totalCompleted,
            totalRewards: userData.totalRewards
          }))
          .sort((a, b) => b.totalCompleted - a.totalCompleted || b.totalRewards - a.totalRewards)
          .slice(0, 10);
        
        if (leaderboard.length === 0) {
          await interaction.editReply('Chưa có ai hoàn thành nhiệm vụ! Hãy là người đầu tiên với `/quest`! 🎯');
          return;
        }
        
        const description = leaderboard.map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
          return `${medal} <@${entry.userId}> • ${emojis.success} **${entry.totalCompleted}** nhiệm vụ • ${emojis.trophy} **${entry.totalRewards}** rewards`;
        }).join('\n');
        
        const embed = new EmbedBuilder()
          .setColor('#ffd700')
          .setTitle(`${emojis.trophy} Bảng Xếp Hạng Nhiệm Vụ`)
          .setDescription(description)
          .setFooter({ text: 'Top 10 người hoàn thành nhiều nhiệm vụ nhất' })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    };

    this.commands.set('quest', questCommand);
    this.commands.set('quest-leaderboard', leaderboardCommand);
  }

  private registerEvents() {
    // Track messages for quests
    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot || !message.guild) return;
      
      const completedQuests = updateQuestProgress(message.author.id, 'message', 1);
      
      // Notify user if quest completed
      if (completedQuests.length > 0) {
        for (const quest of completedQuests) {
          try {
            await message.reply({
              content: `${emojis.sparkles} **Hoàn thành nhiệm vụ!** ${quest.name} • +${quest.reward} ${emojis.trophy}`
            }).then(msg => {
              setTimeout(() => msg.delete().catch(() => {}), 10000);
            });
          } catch (error) {
            // Ignore errors
          }
        }
      }
    });
    
    // Track reactions for quests
    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot || user.partial) return;
      
      const completedQuests = updateQuestProgress(user.id, 'reaction', 1);
      
      // Notify user if quest completed
      if (completedQuests.length > 0 && reaction.message.channel && 'send' in reaction.message.channel) {
        for (const quest of completedQuests) {
          try {
            const msg = await reaction.message.channel.send({
              content: `${emojis.sparkles} <@${user.id}> **Hoàn thành nhiệm vụ!** ${quest.name} • +${quest.reward} ${emojis.trophy}`
            });
            setTimeout(() => msg.delete().catch(() => {}), 10000);
          } catch (error) {
            // Ignore errors
          }
        }
      }
    });
  }

  private createProgressBar(current: number, target: number): string {
    const percentage = Math.min((current / target) * 100, 100);
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    
    return `[${'▰'.repeat(filled)}${'▱'.repeat(empty)}] ${Math.round(percentage)}%`;
  }

  async cleanup() {
    console.log('🧹 Quest module cleanup');
  }
}
