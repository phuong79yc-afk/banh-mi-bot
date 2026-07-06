// Simple in-memory level roles system
// In production, use a database

interface LevelRole {
  level: number;
  roleId: string;
}

// Map: guildId -> LevelRole[]
const levelRolesMap = new Map<string, LevelRole[]>();

export async function getLevelRoles(guildId: string): Promise<LevelRole[]> {
  return levelRolesMap.get(guildId) || [];
}

export async function setLevelRole(guildId: string, level: number, roleId: string): Promise<void> {
  const roles = levelRolesMap.get(guildId) || [];
  
  // Remove existing role for this level if any
  const filtered = roles.filter(r => r.level !== level);
  
  // Add new role
  filtered.push({ level, roleId });
  
  levelRolesMap.set(guildId, filtered);
}

export async function removeLevelRole(guildId: string, level: number): Promise<void> {
  const roles = levelRolesMap.get(guildId) || [];
  const filtered = roles.filter(r => r.level !== level);
  levelRolesMap.set(guildId, filtered);
}

export async function getRoleForLevel(guildId: string, level: number): Promise<string | null> {
  const roles = levelRolesMap.get(guildId) || [];
  const role = roles.find(r => r.level === level);
  return role ? role.roleId : null;
}

export async function getAllRolesUpToLevel(guildId: string, level: number): Promise<string[]> {
  const roles = levelRolesMap.get(guildId) || [];
  return roles
    .filter(r => r.level <= level)
    .map(r => r.roleId);
}
