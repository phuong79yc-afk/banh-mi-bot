// Permissions utility
import { GuildMember, PermissionFlagsBits } from 'discord.js';

export function hasPermission(member: GuildMember, permission: bigint): boolean {
  return member.permissions.has(permission);
}

export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export function isModerator(member: GuildMember): boolean {
  return member.permissions.has([
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.ManageMessages,
  ]);
}
