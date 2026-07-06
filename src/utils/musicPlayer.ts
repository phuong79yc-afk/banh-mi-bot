import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { Client } from 'discord.js';

let player: Player | null = null;

export async function initializeMusicPlayer(client: Client): Promise<Player> {
  if (player) return player;

  player = new Player(client, {
    // Tối ưu hiệu suất
    skipFFmpeg: false
  });

  // Load default extractors
  await player.extractors.loadMulti(DefaultExtractors);

  // ===== OPTIMIZED EVENT HANDLERS =====
  
  player.events.on('playerStart', (queue, track) => {
    console.log(`🎵 Playing: ${track.title}`);
    
    // Auto-adjust volume based on track
    if (queue.node.volume < 70) {
      queue.node.setVolume(70);
    }
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`❌ Player error:`, error.message);
    
    // Auto-recovery: Skip to next track
    const nextTrack = queue.tracks.data[0];
    if (nextTrack) {
      console.log(`⏭️ Auto-skipping to: ${nextTrack.title}`);
      setTimeout(() => {
        try {
          queue.node.skip();
        } catch (e) {
          console.error('Skip failed:', e);
        }
      }, 500);
    }
  });

  player.events.on('error', (queue, error) => {
    console.error(`❌ Queue error:`, error.message);
    
    // Try to reconnect if connection lost
    if (error.message.includes('connection') || error.message.includes('network')) {
      console.log('🔄 Attempting to reconnect...');
      setTimeout(() => {
        try {
          if (queue.tracks.data.length > 0) {
            queue.node.skip();
          }
        } catch (e) {}
      }, 1000);
    }
  });

  player.events.on('playerSkip', (queue, track) => {
    console.log(`⏭️ Skipped: ${track.title}`);
  });

  player.events.on('disconnect', (queue) => {
    console.log(`👋 Disconnected from ${queue.guild.name}`);
  });

  player.events.on('emptyChannel', (queue) => {
    console.log(`📭 Channel empty in ${queue.guild.name}`);
    // Clean up queue to free memory
    queue.clear();
  });

  player.events.on('emptyQueue', (queue) => {
    console.log(`✅ Queue finished in ${queue.guild.name}`);
    // Clean up to prevent memory leaks
    setTimeout(() => {
      if (queue.tracks.data.length === 0) {
        queue.delete();
      }
    }, 60000); // Wait 1 minute before cleanup
  });

  player.events.on('audioTrackAdd', (queue, track) => {
    console.log(`✅ Queued: ${track.title}`);
  });

  // Debug events for monitoring
  player.events.on('debug', (queue, message) => {
    if (message.includes('error') || message.includes('warn')) {
      console.log(`🔍 Debug: ${message}`);
    }
  });

  console.log('🎵 Music player initialized with optimizations!');
  return player;
}

export function getMusicPlayer(): Player | null {
  return player;
}
