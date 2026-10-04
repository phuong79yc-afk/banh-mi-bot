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
import { trackCommand } from '../quest-module/entry_point';
import fs from 'fs';
import path from 'path';

// ==================== CONFIGURATION CONSTANTS ====================
const BASE_REWARD = 100;
const STREAK_BONUS_PER_DAY = 10;
const STREAK_BONUS_MAX = 100;
const BOOSTER_PERCENT = 5;
const TIMEZONE = 'Asia/Ho_Chi_Minh';

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

interface UserDailyData {
  lastDaily: string;  // 'YYYY-MM-DD'
  streak: number;
  max_streak: number;
  total_checkins: number;
  total_rewards: number;
}

interface DailyData {
  [userId: string]: UserDailyData;
}

// ==================== TIMEZONE-AWARE DATE UTILITIES ====================

/**
 * Get today's date as YYYY-MM-DD string in configured timezone
 */
function getTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

/**
 * Calculate days between two YYYY-MM-DD date strings
 */
function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/**
 * Get Unix timestamp for next midnight in configured timezone
 */
function getNextMidnightUnix(): number {
  const now = new Date();
  const tzOffset = 7 * 60; // Asia/Ho_Chi_Minh is UTC+7
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const localMs = utcMs + tzOffset * 60000;
  const localDate = new Date(localMs);
  
  // Set to next midnight
  localDate.setHours(24, 0, 0, 0);
  
  // Convert back to UTC timestamp
  const nextMidnightLocal = localDate.getTime();
  const nextMidnightUtc = nextMidnightLocal - tzOffset * 60000;
  
  return Math.floor(nextMidnightUtc / 1000);
}

// ==================== DATA MANAGEMENT ====================

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

// Data migration from old field names
function migrateDailyData(): void {
  try {
    const data = loadData();
    let migrated = false;
    for (const userId in data) {
      const user = data[userId] as any;
      // Rename current_streak → streak
      if ('current_streak' in user && !('streak' in user)) {
        user.streak = user.current_streak;
        delete user.current_streak;
        migrated = true;
      }
      // Rename last_checkin_date → lastDaily
      if ('last_checkin_date' in user && !('lastDaily' in user)) {
        user.lastDaily = user.last_checkin_date;
        delete user.last_checkin_date;
        migrated = true;
      }
    }
    if (migrated) {
      saveData(data);
      console.log('[Daily] Data migration completed');
    }
  } catch (error) {
    console.error('[Daily] Migration error:', error);
  }
}

// Helper function to check if user checked in today
function hasCheckedInToday(userId: string): boolean {
  const data = loadData();
  const userData = data[userId];
  
  if (!userData || !userData.lastDaily) return false;
  
  const today = getTodayString();
  return userData.lastDaily === today;
}

// Helper function to get or create user data
function getUserData(userId: string): UserDailyData {
  const data = loadData();
  
  if (!data[userId]) {
    data[userId] = {
      streak: 0,
      max_streak: 0,
      total_checkins: 0,
      lastDaily: '',
      total_rewards: 0
    };
    saveData(data);
  }
  
  return data[userId];
}

// ==================== REWARD CALCULATION ====================

interface RewardBreakdown {
  base: number;
  streakBonus: number;
  boosterBonus: number;
  total: number;
}

function calculateReward(streak: number, hasBooster: boolean): RewardBreakdown {
  const base = BASE_REWARD;
  const streakBonus = Math.min(streak * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX);
  const subtotal = base + streakBonus;
  const boosterBonus = hasBooster ? Math.floor(subtotal * BOOSTER_PERCENT / 100) : 0;
  
  return {
    base,
    streakBonus,
    boosterBonus,
    total: subtotal + boosterBonus
  };
}

// ==================== VIP ROLE CHECK ====================

function hasBoosterRole(interaction: ChatInputCommandInteraction): boolean {
  const vipNames = ['Premium Member', 'Bot Developer', 'Bot Owner'];
  const member = interaction.member;
  
  // In guilds, member.roles is GuildMemberRoleManager with cache
  if (member && typeof member.roles !== 'string' && 'cache' in member.roles) {
    return member.roles.cache.some((r: any) =>
      vipNames.some(v => r.name.includes(v))
    );
  }
  
  return false;
}

// ==================== CURRENCY INTEGRATION ====================

function addCurrency(userId: string, amount: number): void {
  const currPath = path.join(process.cwd(), 'data', 'currencies.json');
  let data: any = {};
  try {
    if (fs.existsSync(currPath)) {
      data = JSON.parse(fs.readFileSync(currPath, 'utf8'));
    }
  } catch {}
  const bal = data[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  bal.cowoncy += amount;
  data[userId] = bal;
  fs.writeFileSync(currPath, JSON.stringify(data, null, 2));
}

// ==================== STREAK LOGIC ====================

interface CheckInResult {
  success: boolean;
  alreadyClaimed?: boolean;
  data?: UserDailyData;
  streak?: number;
  isNewStreak?: boolean;
}

/**
 * Process user check-in with timezone-aware streak calculation
 * Returns -1 for streak if already claimed today
 */
function processCheckIn(userId: string): CheckInResult {
  const data = loadData();
  const userData = getUserData(userId);
  const today = getTodayString();
  
  // Check if already claimed today
  if (userData.lastDaily) {
    const diff = daysBetween(userData.lastDaily, today);
    if (diff === 0) {
      return { success: false, alreadyClaimed: true };
    }
  }
  
  // Calculate new streak
  let newStreak = 1;
  let isNewStreak = true;
  
  if (userData.lastDaily) {
    const diff = daysBetween(userData.lastDaily, today);
    if (diff === 1) {
      // Streak continues
      newStreak = userData.streak + 1;
      isNewStreak = false;
    }
    // If diff > 1, streak resets to 1 (already set above)
  }
  
  const newMaxStreak = Math.max(userData.max_streak, newStreak);
  
  // Update data (don't add reward yet - that happens after VIP check)
  data[userId] = {
    streak: newStreak,
    max_streak: newMaxStreak,
    total_checkins: userData.total_checkins + 1,
    lastDaily: today,
    total_rewards: userData.total_rewards // Will be updated after reward calculation
  };
  
  saveData(data);
  
  return {
    success: true,
    data: data[userId],
    streak: newStreak,
    isNewStreak
  };
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
    console.log(`📅 Daily check-in module initialized`);
    migrateDailyData(); // Run data migration
    this.registerCommands();
    console.log(`✅ Daily module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /daily command
    const dailyCommand = {
      data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Điểm danh hàng ngày để nhận thưởng'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          // ⚡ DEFER IMMEDIATELY
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const userId = interaction.user.id;
        const user = interaction.user;
        
        // Load banner
        const bannerPath = path.join(process.cwd(), 'assets', 'banners', 'daily-banner.gif');
        let files: AttachmentBuilder[] = [];
        if (fs.existsSync(bannerPath)) {
          files.push(new AttachmentBuilder(bannerPath, { name: 'daily-banner.gif' }));
        }
        
        // Step 1: Process check-in
        const result = processCheckIn(userId);
        
        // Handle already claimed
        if (result.alreadyClaimed) {
          const data = getUserData(userId);
          const nextMidnight = getNextMidnightUnix();
          
          const alreadyEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setAuthor({ name: 'Điểm danh hằng ngày', iconURL: user.displayAvatarURL() })
            .setDescription([
              `❌ **Hôm nay bạn đã điểm danh rồi!**`,
              '',
              `━━━━━━━━━━━━━━━━━━━━`,
              '',
              `${emojis.fire} **Chuỗi hiện tại:** ${data.streak} ngày`,
              `${emojis.trophy} **Chuỗi dài nhất:** ${data.max_streak} ngày`,
              `${emojis.chart} **Tổng lần điểm danh:** ${data.total_checkins} lần`,
              '',
              `${emojis.coin} **Tổng phần thưởng:** ${data.total_rewards}`,
              '',
              `⏰ **Quay lại vào:** <t:${nextMidnight}:R>`
            ].join('\n'))
            .setFooter({ 
              text: `${user.username} • Banhcuon-bot`,
              iconURL: user.displayAvatarURL()
            })
            .setTimestamp();
          
          if (files.length > 0) {
            alreadyEmbed.setImage('attachment://daily-banner.gif');
          }
          
          await interaction.editReply({ 
            embeds: [alreadyEmbed],
            files
          });
          return;
        }
        
        // Step 2: Check VIP role
        const hasVIP = hasBoosterRole(interaction);
        
        // Step 3: Calculate rewards
        const streak = result.streak!;
        const rewards = calculateReward(streak, hasVIP);
        
        // Step 4: Update total_rewards in database
        const data = loadData();
        data[userId].total_rewards += rewards.total;
        saveData(data);
        
        // Step 5: Add currency (cowoncy)
        addCurrency(userId, rewards.total);
        
        // Step 6: Track quest progress
        try {
          trackCommand(userId, 'daily');
        } catch (error) {
          console.error('Failed to track quest:', error);
        }
        
        // Step 7: Build embed with quote-style formatting
        const lines: string[] = [
          `• Điểm danh hằng ngày ~ \`${rewards.base}\` ${emojis.coin}`,
          `${emojis.fire} Điểm danh liên tục **${streak}** ngày ~ \`${rewards.streakBonus}\` ${emojis.coin}`,
        ];
        
        if (hasVIP) {
          lines.push(`⭐ VIP Member ~ **+${BOOSTER_PERCENT}%** ${emojis.coin}`);
        }
        
        const description =
          lines.map(l => `> ${l}`).join('\n') +
          '\n\n' +
          `> ➡️ **Tổng nhận:** \`${rewards.total}\` ${emojis.coin}`;
        
        // Streak milestone messages
        let milestoneMsg = '';
        if (streak === 7) {
          milestoneMsg = `\n\n🎉 **Cột mốc 1 tuần!** Bạn thật kiên trì!`;
        } else if (streak === 30) {
          milestoneMsg = `\n\n🎊 **Cột mốc 1 tháng!** Tuyệt vời!`;
        } else if (streak === 100) {
          milestoneMsg = `\n\n🏆 **Cột mốc 100 ngày!** Huyền thoại!`;
        } else if (streak % 10 === 0 && streak > 0) {
          milestoneMsg = `\n\n✨ **Cột mốc ${streak} ngày!** Tuyệt vời!`;
        }
        
        const embed = new EmbedBuilder()
          .setColor('#7BE0B0')
          .setAuthor({ name: 'Điểm danh hằng ngày', iconURL: user.displayAvatarURL() })
          .setDescription(description + milestoneMsg)
          .setFooter({ 
            text: `${user.username} • Banhcuon-bot`,
            iconURL: user.displayAvatarURL()
          })
          .setTimestamp();
        
        if (files.length > 0) {
          embed.setImage('attachment://daily-banner.gif');
        }
        
        await interaction.editReply({ 
          embeds: [embed],
          files
        });
      }
    };

    // /daily-stats command
    const statsCommand = {
      data: new SlashCommandBuilder()
        .setName('daily-stats')
        .setDescription('Xem thống kê điểm danh của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          // ⚡ DEFER IMMEDIATELY
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
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
              value: `**${data.streak}** ngày`,
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
              value: data.lastDaily || 'Chưa có',
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
        try {
          // ⚡ DEFER IMMEDIATELY
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const data = loadData();
        const leaderboard = Object.entries(data)
          .map(([userId, userData]) => ({ userId, ...userData }))
          .sort((a, b) => b.streak - a.streak || b.total_checkins - a.total_checkins)
          .slice(0, 10);
        
        if (leaderboard.length === 0) {
          await interaction.editReply('Chưa có ai điểm danh cả! Hãy là người đầu tiên với `/daily`! 🎯');
          return;
        }
        
        const description = leaderboard.map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
          return `${medal} <@${entry.userId}> • 🔥 **${entry.streak}** ngày • ${emojis.chart} **${entry.total_checkins}** lần`;
        }).join('\n');
        
        const embed = new EmbedBuilder()
          .setColor('#ffd700')
          .setTitle(`${emojis.trophy} Bảng Xếp Hạng Điểm Danh`)
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
