// Welcome event handler - triggers when member joins
import { GuildMember } from 'discord.js';
import { handleMemberAdd } from '../modules/welcome-system-module/handlers';

export const name = 'guildMemberAdd';
export const once = false;

export async function execute(member: GuildMember): Promise<void> {
  try {
    await handleMemberAdd(member);
  } catch (error) {
    console.error('[Welcome Event] Error handling member join:', error);
  }
}
