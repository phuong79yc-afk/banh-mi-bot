import { announceTTS } from './tts-player';

/**
 * Auto-announce track using text message
 */
export async function autoAnnounce(queue: any, track: any): Promise<void> {
  // Only announce the track title (what user typed)
  const text = track.title;
  
  if (queue.metadata?.channel) {
    await announceTTS(text, queue.metadata.channel);
  }
}
