import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';
import { picture, combineFiles } from '../../utils/pictureHelper';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ==================== CONFIGURATION CONSTANTS ====================
const BASE_REWARD = 100;
const STREAK_BONUS_PER_DAY = 10;
const STREAK_BONUS_MAX = 100;
const BOOSTER_PERCENT = 5;
const TIMEZONE = 'Asia/Ho_Chi_Minh';

// Role bonus config - roles from shop get % bonus
const ROLE_BONUS_CONFIG = [
  { roleId: process.env.ROLE_CHUTIEM, percent: 10, name: 'Chủ Tiệm' },
  { roleId: process.env.ROLE_BANHCUONCHUA, percent: 10, name: 'Bánh Cuốn Chúa' },
  { roleId: process.env.ROLE_HANHPHI, percent: 8, name: 'Hành Phi Elite' },
  { roleId: process.env.ROLE_BANHMI, percent: 5, name: 'Bánh Mì Fan' },
  { roleId: process.env.ROLE_NUOCCHAM, percent: 3, name: 'Fan Nước Chấm' },
];

// ==================== DATABASE INITIALIZATION ====================

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Initialize SQLite database
const db = new Database(path.join(process.cwd(), 'data', 'economy.db'));

// Run database migrations
function runMigrations() {
  // Check if gold_balance column exists
  const tableInfo = db.prepare("PRAGMA table_info(daily_users)").all() as any[];
  const hasGoldBalance = tableInfo.some((col: any) => col.name === 'gold_balance');
  
  if (!hasGoldBalance) {
    console.log('[Migration] Adding gold_balance column to daily_users table...');
    db.exec('ALTER TABLE daily_users ADD COLUMN gold_balance INTEGER NOT NULL DEFAULT 0');
    console.log('[Migration] ✅ gold_balance column added successfully!');
  }
}

// Create table and run migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_users (
    user_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    total_checkins INTEGER NOT NULL DEFAULT 0,
    last_daily TEXT
  )
`);

runMigrations();

// Prepared statements
const stmtGetUser = db.prepare('SELECT * FROM daily_users WHERE user_id = ?');
const stmtUpsertUser = db.prepare(`
  INSERT INTO daily_users (user_id, balance, streak, max_streak, total_checkins, last_daily)
  VALUES (@user_id, @balance, @streak, @max_streak, @total_checkins, @last_daily)
  ON CONFLICT(user_id) DO UPDATE SET
    balance = balance + @balance,
    streak = @streak,
    max_streak = MAX(max_streak, @max_streak),
    total_checkins = total_checkins + 1,
    last_daily = @last_daily
`);
const stmtGetAll = db.prepare('SELECT * FROM daily_users ORDER BY streak DESC, total_checkins DESC LIMIT 10');

interface UserDailyData {
  user_id: string;
  last_daily: string | null;
  streak: number;
  max_streak: number;
  total_checkins: number;
  balance: number;
  gold_balance: number;
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

// ==================== JSON → SQLITE MIGRATION ====================

function migrateFromJson(): void {
  const dataPath = path.join(process.cwd(), 'data', 'daily.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('[Daily] No daily.json found, skipping migration');
    return;
  }
  
  try {
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let migrated = 0;
    
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO daily_users (user_id, balance, streak, max_streak, total_checkins, last_daily)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const [userId, userData] of Object.entries(jsonData) as [string, any][]) {
      const result = insertStmt.run(
        userId,
        userData.total_rewards || 0,
        userData.streak || userData.current_streak || 0,
        userData.max_streak || 0,
        userData.total_checkins || 0,
        userData.lastDaily || userData.last_checkin_date || null
      );
      if (result.changes > 0) migrated++;
    }
    
    console.log(`[Daily] Migrated ${migrated} users from JSON to SQLite`);
  } catch (error) {
    console.error('[Daily] Migration error:', error);
  }
}

// ==================== DATA ACCESS HELPERS ====================

// Helper function to check if user checked in today
function hasCheckedInToday(userId: string): boolean {
  const row = stmtGetUser.get(userId) as UserDailyData | undefined;
  if (!row || !row.last_daily) return false;
  
  const today = getTodayString();
  return row.last_daily === today;
}

// Helper function to get or create user data
function getUserData(userId: string): UserDailyData {
  const row = stmtGetUser.get(userId) as UserDailyData | undefined;
  
  return row ?? {
    user_id: userId,
    balance: 0,
    gold_balance: 0,
    streak: 0,
    max_streak: 0,
    total_checkins: 0,
    last_daily: null
  };
}

// ==================== REWARD CALCULATION ====================

interface RewardBreakdown {
  base: number;
  streakBonus: number;
  roleBonus: number;
  roleName?: string;
  rolePercent?: number;
  total: number;
}

function calculateReward(
  streak: number, 
  interaction: ChatInputCommandInteraction
): RewardBreakdown {
  const base = BASE_REWARD;
  const streakBonus = Math.min(streak * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX);
  const subtotal = base + streakBonus;
  
  // Check for role bonus (highest % wins)
  let roleBonus = 0;
  let bestRole: { roleId: string; percent: number; name: string } | undefined;
  
  const member = interaction.member;
  if (member && typeof member.roles !== 'string' && 'cache' in member.roles) {
    for (const config of ROLE_BONUS_CONFIG) {
      if (config.roleId && member.roles.cache.has(config.roleId)) {
        if (!bestRole || config.percent > bestRole.percent) {
          bestRole = { ...config, roleId: config.roleId! };
        }
      }
    }
  }
  
  if (bestRole) {
    roleBonus = Math.floor(subtotal * bestRole.percent / 100);
  }
  
  return {
    base,
    streakBonus,
    roleBonus,
    roleName: bestRole?.name,
    rolePercent: bestRole?.percent,
    total: subtotal + roleBonus
  };
}

// ==================== VIP ROLE CHECK (DEPRECATED - Use calculateReward instead) ====================

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

// ==================== STREAK LOGIC ====================

interface CheckInResult {
  success: boolean;
  alreadyClaimed?: boolean;
  streak?: number;
  isNewStreak?: boolean;
}

/**
 * Process user check-in with timezone-aware streak calculation
 */
function processCheckIn(userId: string): CheckInResult {
  const userData = getUserData(userId);
  const today = getTodayString();
  
  // Check if already claimed today
  if (userData.last_daily) {
    const diff = daysBetween(userData.last_daily, today);
    if (diff === 0) {
      return { success: false, alreadyClaimed: true };
    }
  }
  
  // Calculate new streak
  let newStreak = 1;
  let isNewStreak = true;
  
  if (userData.last_daily) {
    const diff = daysBetween(userData.last_daily, today);
    if (diff === 1) {
      // Streak continues
      newStreak = userData.streak + 1;
      isNewStreak = false;
    }
    // If diff > 1, streak resets to 1 (already set above)
  }
  
  const newMaxStreak = Math.max(userData.max_streak, newStreak);
  
  return {
    success: true,
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
    migrateFromJson(); // Run JSON → SQLite migration
    this.registerCommands();
    console.log(`✅ Daily module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /daily command
    const dailyCommand = {
      data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('📅 Điểm danh hàng ngày để nhận thưởng'),
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
        
        // Step 1: Process check-in
        const result = processCheckIn(userId);
        
        // Handle already claimed
        if (result.alreadyClaimed) {
          const data = getUserData(userId);
          const nextMidnight = getNextMidnightUnix();
          
          const lines = [
            `- Bạn đã điểm danh hôm nay rồi ${emojis.success}`,
            `${emojis.fire} Điểm danh liên tục **${data.streak}** ngày`,
            `${emojis.clock} Điểm danh tiếp <t:${nextMidnight}:R>`,
          ];
          
          const description = lines.map(l => `> ${l}`).join('\n');
          
          const alreadyEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setAuthor({ name: 'Điểm danh hằng ngày', iconURL: user.displayAvatarURL() })
            .setDescription(description)
            .setFooter({ 
              text: `${user.username} • Banhcuon-bot`,
              iconURL: user.displayAvatarURL()
            });
          
          // Add thumbnail and banner
          const thumbnail = picture(process.env.DAILY_THUMBNAIL, 'daily-icon.png');
          const banner = picture(process.env.DAILY_BANNER, 'banners/daily-banner.gif');
          
          if (thumbnail) {
            alreadyEmbed.setThumbnail(thumbnail.url);
          } else {
            alreadyEmbed.setThumbnail(user.displayAvatarURL());
          }
          
          if (banner) {
            alreadyEmbed.setImage(banner.url);
          }
          
          const files = combineFiles([thumbnail, banner]);
          
          await interaction.editReply({ 
            embeds: [alreadyEmbed],
            files: files.length > 0 ? files : undefined
          });
          return;
        }
        
        // Step 2: Calculate rewards with role bonus
        const streak = result.streak!;
        const rewards = calculateReward(streak, interaction);
        
        // Step 3: Save to database (balance, streak, max_streak, total_checkins, last_daily)
        const today = getTodayString();
        const userData = getUserData(userId);
        stmtUpsertUser.run({
          user_id: userId,
          balance: rewards.total,
          streak: streak,
          max_streak: Math.max(userData.max_streak, streak),
          total_checkins: 1, // Increments by 1 via UPDATE clause
          last_daily: today
        });
        
        // Step 4: Track quest progress (dynamic import to avoid circular dependency)
        console.log(`[Daily] Attempting to track quest for user ${userId}`);
        try {
          const { trackCommand } = await import('../quest-module/entry_point');
          trackCommand(userId, 'daily');
          console.log(`[Daily] Successfully tracked quest for user ${userId}`);
        } catch (error) {
          console.error('[Daily] Failed to track quest:', error);
        }
        
        // Step 5: Build embed with quote-style formatting
        const lines: string[] = [
          `• Điểm danh hằng ngày ~ \`${rewards.base}\` ${emojis.coin}`,
          `${emojis.fire} Điểm danh liên tục **${streak}** ngày ~ \`${rewards.streakBonus}\` ${emojis.coin}`,
        ];
        
        // Add role bonus line if applicable
        if (rewards.roleBonus > 0 && rewards.roleName) {
          const member = interaction.member;
          if (member && typeof member.roles !== 'string' && 'cache' in member.roles) {
            const roleConfig = ROLE_BONUS_CONFIG.find(r => r.name === rewards.roleName);
            if (roleConfig?.roleId) {
              lines.push(`• <@&${roleConfig.roleId}> ~ **+${rewards.rolePercent}%** ${emojis.coin}`);
            }
          }
        }
        
        const description =
          lines.map(l => `> ${l}`).join('\n') +
          '\n\n' +
          `> ${emojis.sparkles} **Tổng nhận:** \`${rewards.total}\` ${emojis.coin}`;
        
        // Streak milestone messages
        let milestoneMsg = '';
        if (streak === 7) {
          milestoneMsg = `\n\n${emojis.gift} **Cột mốc 1 tuần!** Bạn thật kiên trì!`;
        } else if (streak === 30) {
          milestoneMsg = `\n\n${emojis.sparkles} **Cột mốc 1 tháng!** Tuyệt vời!`;
        } else if (streak === 100) {
          milestoneMsg = `\n\n${emojis.trophy} **Cột mốc 100 ngày!** Huyền thoại!`;
        } else if (streak % 10 === 0 && streak > 0) {
          milestoneMsg = `\n\n${emojis.sparkles} **Cột mốc ${streak} ngày!** Tuyệt vời!`;
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
        
        // Add thumbnail and banner images
        const thumbnail = picture(process.env.DAILY_THUMBNAIL, 'daily-icon.png');
        const banner = picture(process.env.DAILY_BANNER, 'banners/daily-banner.gif');
        
        if (thumbnail) {
          embed.setThumbnail(thumbnail.url);
        } else {
          // Fallback to user avatar
          embed.setThumbnail(user.displayAvatarURL());
        }
        
        if (banner) {
          embed.setImage(banner.url);
        }
        
        // Combine files for attachment
        const files = combineFiles([thumbnail, banner]);
        
        await interaction.editReply({ 
          embeds: [embed],
          files: files.length > 0 ? files : undefined
        });
      }
    };

    // /daily-stats command
    const statsCommand = {
      data: new SlashCommandBuilder()
        .setName('daily-stats')
        .setDescription('📊 Xem thống kê điểm danh của bạn'),
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
              value: `**${data.balance}** coins`,
              inline: true
            },
            {
              name: `${emojis.calendar} Lần cuối điểm danh`,
              value: data.last_daily || 'Chưa có',
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
        .setDescription('🏆 Xem bảng xếp hạng điểm danh'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          // ⚡ DEFER IMMEDIATELY
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const leaderboard = stmtGetAll.all() as UserDailyData[];
        
        if (leaderboard.length === 0) {
          await interaction.editReply('Chưa có ai điểm danh cả! Hãy là người đầu tiên với `/daily`! 🎯');
          return;
        }
        
        const description = leaderboard.map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
          return `${medal} <@${entry.user_id}> • ${emojis.fire} **${entry.streak}** ngày • ${emojis.chart} **${entry.total_checkins}** lần`;
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
