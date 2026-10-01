import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

// Simple JSON database
const dataPath = path.join(process.cwd(), 'data', 'daily.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Initialize database file
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({}));
}

interface DailyData {
  [userId: string]: {
    current_streak: number;
    max_streak: number;
    total_checkins: number;
    last_checkin_date: string;
    total_rewards: number;
  };
}

// Load data
function loadData(): DailyData {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save data
function saveData(data: DailyData): void {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Helper function to check if user checked in today
function hasCheckedInToday(userId: string): boolean {
  const data = loadData();
  const userData = data[userId];
  
  if (!userData || !userData.last_checkin_date) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return userData.last_checkin_date === today;
}

// Helper function to calculate reward
function calculateReward(streak: number): number {
  const baseReward = 100;
  const streakBonus = Math.min(streak * 10, 300); // Max 300 bonus
  return baseReward + streakBonus;
}

// Helper function to get or create user data
function getUserData(userId: string) {
  const data = loadData();
  
  if (!data[userId]) {
    data[userId] = {
      current_streak: 0,
      max_streak: 0,
      total_checkins: 0,
      last_checkin_date: '',
      total_rewards: 0
    };
    saveData(data);
  }
  
  return data[userId];
}

// Process check-in
function processCheckIn(userId: string) {
  const data = loadData();
  const userData = getUserData(userId);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let newStreak = userData.current_streak;
  let isNewStreak = false;
  
  // Check if streak continues or breaks
  if (userData.last_checkin_date === yesterday) {
    newStreak = userData.current_streak + 1;
  } else if (userData.last_checkin_date !== today) {
    newStreak = 1;
    isNewStreak = true;
  }
  
  const reward = calculateReward(newStreak);
  const newMaxStreak = Math.max(userData.max_streak, newStreak);
  
  // Update data
  data[userId] = {
    current_streak: newStreak,
    max_streak: newMaxStreak,
    total_checkins: userData.total_checkins + 1,
    last_checkin_date: today,
    total_rewards: userData.total_rewards + reward
  };
  
  saveData(data);
  
  // Add coins to shop system
  addCoinsToShop(userId, reward);
  
  return {
    success: true,
    data: data[userId],
    reward,
    isNewStreak
  };
}

// Helper to add coins (will sync with shop module)
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

export default class DailyModule {
  name = 'daily-module';
  description = 'Hệ thống điểm danh hàng ngày';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`${emojis.calendar} Daily check-in module initialized`);
    this.registerCommands();
    console.log(`${emojis.success} Daily module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /daily command
    const dailyCommand = {
      data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Điểm danh hàng ngày để nhận thưởng'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const userId = interaction.user.id;
        
        // Load banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'daily-banner.gif');
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'daily-banner.gif' });
        
        // Check if already checked in today
        if (hasCheckedInToday(userId)) {
          const data = getUserData(userId);
          
          const alreadyEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setImage('attachment://daily-banner.gif')
            .setTitle(`${emojis.calendar} Điểm Danh Hàng Ngày`)
            .setDescription([
              `${emojis.sparkles} **Bạn đã điểm danh hôm nay rồi!**`,
              '',
              `━━━━━━━━━━━━━━━━━━━━`,
              '',
              `🔥 **Chuỗi hiện tại:** ${data.current_streak} ngày`,
              `${emojis.trophy} **Chuỗi dài nhất:** ${data.max_streak} ngày`,
              `${emojis.chart} **Tổng lần điểm danh:** ${data.total_checkins} lần`,
              '',
              `${emojis.coin} **Tổng coins nhận được:** ${data.total_rewards}`,
              '',
              `⏰ **Quay lại vào:** <t:${Math.floor(Date.now() / 1000) + 86400}:R>`
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
            .setFooter({ 
              text: `${interaction.user.tag} • Hẹn gặp lại vào ngày mai!`,
              iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();
          
          await interaction.editReply({ 
            embeds: [alreadyEmbed],
            files: [bannerAttachment]
          });
          return;
        }
        
        // Process check-in
        const result = processCheckIn(userId);
        
        // Streak milestone messages
        let milestoneMsg = '';
        if (result.data.current_streak === 7) {
          milestoneMsg = `\n\n🎉 **Cột mốc 1 tuần!** Bạn thật kiên trì!`;
        } else if (result.data.current_streak === 30) {
          milestoneMsg = `\n\n🎊 **Cột mốc 1 tháng!** Tuyệt vời!`;
        } else if (result.data.current_streak === 100) {
          milestoneMsg = `\n\n🏆 **Cột mốc 100 ngày!** Huyền thoại!`;
        } else if (result.data.current_streak % 10 === 0 && result.data.current_streak > 0) {
          milestoneMsg = `\n\n✨ **Cột mốc ${result.data.current_streak} ngày!** Tuyệt vời!`;
        }
        
        // Create beautiful embed
        const embed = new EmbedBuilder()
          .setColor('#57F287')  // Green success color
          .setImage('attachment://daily-banner.gif')
          .setTitle(`${emojis.success} Điểm Danh Thành Công!`)
          .setDescription([
            `**${interaction.user.displayName}** đã điểm danh hôm nay!`,
            '',
            `━━━━━━━━━━━━━━━━━━━━`,
            '',
            `${emojis.gift} **Phần thưởng:** +${result.reward} ${emojis.coin} coins`,
            `🔥 **Chuỗi hiện tại:** ${result.data.current_streak} ngày ${result.isNewStreak ? '(Bắt đầu mới!)' : ''}`,
            `${emojis.chart} **Tổng lần điểm danh:** ${result.data.total_checkins} lần`,
            '',
            `${emojis.coin} **Tổng coins:** ${result.data.total_rewards}`,
            milestoneMsg
          ].join('\n'))
          .addFields(
            {
              name: `${emojis.trophy} Kỷ lục của bạn`,
              value: `Chuỗi dài nhất: **${result.data.max_streak}** ngày`,
              inline: true
            },
            {
              name: `🎯 Phần thưởng tiếp theo`,
              value: `Ngày mai: **${calculateReward(result.data.current_streak + 1)}** ${emojis.coin}`,
              inline: true
            }
          )
          .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
          .setFooter({ 
            text: `${interaction.user.tag} • Tiếp tục chuỗi của bạn vào ngày mai!`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        await interaction.editReply({ 
          embeds: [embed],
          files: [bannerAttachment]
        });
      }
    };

    // /daily-stats command
    const statsCommand = {
      data: new SlashCommandBuilder()
        .setName('daily-stats')
        .setDescription('Xem thống kê điểm danh của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const userId = interaction.user.id;
        const data = getUserData(userId);
        
        const embed = new EmbedBuilder()
          .setColor('#5865f2')
          .setAuthor({
            name: 'Thống kê điểm danh',
            iconURL: interaction.user.displayAvatarURL()
          })
          .addFields(
            {
              name: `${emojis.chart} Tổng số lần điểm danh`,
              value: `**${data.total_checkins}** lần`,
              inline: true
            },
            {
              name: `${emojis.trophy} Chuỗi hiện tại`,
              value: `**${data.current_streak}** ngày`,
              inline: true
            },
            {
              name: `${emojis.star} Chuỗi dài nhất`,
              value: `**${data.max_streak}** ngày`,
              inline: true
            },
            {
              name: `${emojis.coin} Tổng phần thưởng`,
              value: `**${data.total_rewards}** coins`,
              inline: true
            },
            {
              name: `${emojis.calendar} Lần cuối điểm danh`,
              value: data.last_checkin_date || 'Chưa có',
              inline: true
            },
            {
              name: `${emojis.clock} Điểm danh hôm nay`,
              value: hasCheckedInToday(userId) ? `${emojis.success} Đã điểm danh` : `${emojis.warning} Chưa điểm danh`,
              inline: true
            }
          )
          .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
          .setFooter({ 
            text: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    };

    // /daily-leaderboard command
    const leaderboardCommand = {
      data: new SlashCommandBuilder()
        .setName('daily-leaderboard')
        .setDescription('Xem bảng xếp hạng điểm danh'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const data = loadData();
        const leaderboard = Object.entries(data)
          .map(([userId, userData]) => ({ userId, ...userData }))
          .sort((a, b) => b.current_streak - a.current_streak || b.total_checkins - a.total_checkins)
          .slice(0, 10);
        
        if (leaderboard.length === 0) {
          await interaction.editReply('Chưa có ai điểm danh cả! Hãy là người đầu tiên với `/daily`! 🎯');
          return;
        }
        
        const description = leaderboard.map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
          return `${medal} <@${entry.userId}> • 🔥 **${entry.current_streak}** ngày • ${emojis.chart} **${entry.total_checkins}** lần`;
        }).join('\n');
        
        const embed = new EmbedBuilder()
          .setColor('#ffd700')
          .setTitle('${emojis.trophy} Bảng Xếp Hạng Điểm Danh')
          .setDescription(description)
          .setFooter({ text: 'Top 10 người điểm danh nhiều nhất' })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    };

    this.commands.set('daily', dailyCommand);
    this.commands.set('daily-stats', statsCommand);
    this.commands.set('daily-leaderboard', leaderboardCommand);
  }

  async cleanup() {
    console.log('🧹 Daily module cleanup');
  }
}
