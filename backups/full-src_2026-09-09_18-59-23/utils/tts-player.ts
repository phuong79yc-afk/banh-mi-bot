/**
 * TTS is not possible with discord-player due to Discord API limitations
 * Only one voice connection per bot per channel is allowed
 * 
 * Text announcement in chat has been DISABLED
 */

export async function announceTTS(text: string, channel: any): Promise<void> {
  try {
    // Text announcement DISABLED - no message sent to chat
    console.log(`🔕 Announcement disabled (would have said: ${text})`);
  } catch (error) {
    console.error('Announcement error:', error);
  }
}
