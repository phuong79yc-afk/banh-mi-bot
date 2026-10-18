// Goodbye event handler - triggers when member leaves
import { GuildMember, PartialGuildMember } from 'discord.js';
import { handleMemberRemove } from '../modules/welcome-system-module/handlers';

export const name = 'guildMemberRemove';
export const once = false;

export async function execute(member: GuildMember | PartialGuildMember): Promise<void> {
  try {
    // Fetch partial member data if needed
    if (member.partial) {
      try {
        await member.fetch();
      } catch (e) {
        console.warn('[Goodbye Event] Could not fetch partial member');
        return;
      }
    }
    
    await handleMemberRemove(member as GuildMember);
  } catch (error) {
    console.error('[Goodbye Event] Error handling member leave:', error);
  }
}
