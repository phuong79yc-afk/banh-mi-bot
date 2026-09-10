import { createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection, VoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import https from 'https';

/**
 * Announce text using Google TTS in voice channel
 * Uses existing voice connection or creates new one
 * @param guildId Guild ID
 * @param text Text to speak
 * @param language Language code (vi or en)
 * @param channelId Optional voice channel ID to join if not connected
 * @param guildAdapter Optional guild voice adapter
 */
export async function announceTTS(
  guildId: string, 
  text: string, 
  language: 'vi' | 'en' = 'vi',
  channelId?: string,
  guildAdapter?: any
): Promise<void> {
  try {
    let connection = getVoiceConnection(guildId);
    
    // If no connection and we have channel info, try to join
    if (!connection && channelId && guildAdapter) {
      connection = joinVoiceChannel({
        channelId,
        guildId,
        adapterCreator: guildAdapter,
      });
    }
    
    if (!connection) {
      console.log('⏭️ TTS: No voice connection, skipping');
      return;
    }

    console.log(`🔊 TTS: "${text}"`);

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text)}`;
    const tempFile = path.join(process.cwd(), `temp_tts_${Date.now()}.mp3`);
    const fileStream = createWriteStream(tempFile);

    // Download TTS audio
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Download timeout')), 5000);
      https.get(ttsUrl, (response) => {
        clearTimeout(timeout);
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      }).on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    console.log('✅ TTS: Audio downloaded');

    // Play audio - create separate player for TTS
    const ttsPlayer = createAudioPlayer();
    const resource = createAudioResource(tempFile);

    ttsPlayer.play(resource);
    
    // Subscribe TTS player to connection
    const subscription = connection.subscribe(ttsPlayer);
    
    console.log('✅ TTS: Playing');

    // Cleanup after playing
    ttsPlayer.once(AudioPlayerStatus.Idle, async () => {
      try {
        if (subscription) subscription.unsubscribe();
        await unlink(tempFile);
        console.log('✅ TTS: Cleaned up');
      } catch (error) {
        console.error('Failed to cleanup:', error);
      }
    });

  } catch (error) {
    console.error('❌ TTS error:', error);
  }
}
