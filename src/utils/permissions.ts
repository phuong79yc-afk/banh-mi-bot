import { GuildMember, PermissionFlagsBits } from 'discord.js';

/**
 * Get list of moderator IDs from environment
 */
export function getModeratorIds(): string[] {
  const modIds = process.env.MODERATOR_IDS || '';
  return modIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
}

/**
 * Get owner ID from environment
 */
export function getOwnerId(): string {
  return process.env.OWNER_ID || '';
}

/**
 * Check if user is bot owner
 */
export function isOwner(userId: string): boolean {
  const ownerId = getOwnerId();
  return ownerId.length > 0 && userId === ownerId;
}

/**
 * Check if user is moderator (from hardcoded list)
 */
export function isModerator(userId: string): boolean {
  const modIds = getModeratorIds();
  return modIds.includes(userId);
}

/**
 * Check if user is admin (has Administrator permission)
 */
export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if user has moderator access (Owner, Admin, or in Moderator list)
 */
export function hasModeratorAccess(member: GuildMember): boolean {
  return isOwner(member.id) || isAdmin(member) || isModerator(member.id);
}

/**
 * Check if user has admin access (Owner or Admin)
 */
export function hasAdminAccess(member: GuildMember): boolean {
  return isOwner(member.id) || isAdmin(member);
}

/**
 * Get role description for user
 */
export function getUserRole(member: GuildMember): string {
  if (isOwner(member.id)) return 'Owner';
  if (isAdmin(member)) return 'Administrator';
  if (isModerator(member.id)) return 'Moderator';
  return 'Member';
}
