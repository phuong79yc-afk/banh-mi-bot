import { GuildMember, User, Guild } from 'discord.js';

/**
 * Premium Status Checker
 * Checks if a user has Premium role in the guild
 */

export interface PremiumStatus {
  isPremium: boolean;
  reason?: string;
}

/**
 * Check if user has Premium role in guild
 */
export async function checkPremium(
  user: User,
  guild: Guild | null
): Promise<PremiumStatus> {
  if (!guild) {
    return {
      isPremium: false,
      reason: 'Not in a guild'
    };
  }

  try {
    const member = await guild.members.fetch(user.id);
    return checkMemberPremium(member);
  } catch (error) {
    console.error('Error checking premium status:', error);
    return {
      isPremium: false,
      reason: 'Error fetching member'
    };
  }
}

/**
 * Check if guild member has Premium role
 */
export function checkMemberPremium(member: GuildMember): PremiumStatus {
  const premiumRoleName = process.env.PREMIUM_ROLE_NAME || 'Premium';
  const hasPremiumRole = member.roles.cache.some(role => role.name === premiumRoleName);

  return {
    isPremium: hasPremiumRole
  };
}

/**
 * Get premium role from guild
 */
export function getPremiumRole(guild: Guild) {
  const premiumRoleName = process.env.PREMIUM_ROLE_NAME || 'Premium';
  return guild.roles.cache.find(role => role.name === premiumRoleName);
}

/**
 * Free tier limits
 */
export const FREE_LIMITS = {
  AI_DAILY: 50,           // 50 AI requests per day
  IMAGINE_DAILY: 10,      // 10 image generations per day
  QUEUE_SIZE: 50,         // Max 50 songs in queue
  PLAYLIST_SIZE: 20,      // Max 20 songs in playlist
  SKIP_VOTES: 3,          // Need 3 votes to skip
  VOLUME_MAX: 100,        // Max volume 100%
} as const;

/**
 * Premium tier limits (unlimited for most)
 */
export const PREMIUM_LIMITS = {
  AI_DAILY: -1,           // Unlimited
  IMAGINE_DAILY: -1,      // Unlimited
  QUEUE_SIZE: 200,        // Max 200 songs in queue
  PLAYLIST_SIZE: -1,      // Unlimited
  SKIP_VOTES: 1,          // Only 1 vote to skip
  VOLUME_MAX: 150,        // Max volume 150%
} as const;

/**
 * Get limits based on premium status
 */
export function getLimits(isPremium: boolean) {
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}
