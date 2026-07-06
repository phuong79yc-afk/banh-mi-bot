import { createCanvas, loadImage } from 'canvas';
import { drawSVGIcon } from './svgIcons.js';
import GIFEncoder from 'gif-encoder-2';

/**
 * Create animated "Now Playing" image - Spotify Style
 */
export async function createNowPlayingGIF(
  trackTitle: string,
  trackAuthor: string,
  trackDuration: string,
  thumbnailUrl?: string
): Promise<Buffer> {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  
  const encoder = new GIFEncoder(800, 400);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(80);
  encoder.setQuality(10);

  let thumbnail = null;
  if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
    try {
      thumbnail = await loadImage(thumbnailUrl);
    } catch (error) {
      console.log('Failed to load thumbnail');
    }
  }

  const frames = 20;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 800, 400);
    
    // Background with album art
    if (thumbnail) {
      // Draw zoomed and darkened background
      ctx.globalAlpha = 0.3;
      ctx.drawImage(thumbnail, -100, -100, 1000, 600);
      ctx.globalAlpha = 1;
      
      // Dark overlay for better text contrast
      const overlayGradient = ctx.createLinearGradient(0, 0, 0, 400);
      overlayGradient.addColorStop(0, 'rgba(18, 18, 18, 0.85)');
      overlayGradient.addColorStop(1, 'rgba(18, 18, 18, 0.95)');
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, 800, 400);
    } else {
      // Fallback gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 400);
      bgGradient.addColorStop(0, '#121212');
      bgGradient.addColorStop(1, '#282828');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 800, 400);
    }

    // Album art with shadow and subtle animation
    const albumSize = 220;
    const albumX = 60;
    const albumY = 90 + Math.sin((frame / frames) * Math.PI * 2) * 3;
    
    if (thumbnail) {
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      
      // Draw album with rounded corners
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(albumX, albumY, albumSize, albumSize, 12);
      ctx.clip();
      ctx.drawImage(thumbnail, albumX, albumY, albumSize, albumSize);
      ctx.restore();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // Fallback disc icon
      const discX = albumX + albumSize / 2;
      const discY = albumY + albumSize / 2;
      const rotation = (frame / frames) * Math.PI * 2;
      
      ctx.save();
      ctx.translate(discX, discY);
      ctx.rotate(rotation);
      
      const discGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
      discGradient.addColorStop(0, '#1DB954');
      discGradient.addColorStop(0.3, '#1ed760');
      discGradient.addColorStop(1, '#169c46');
      ctx.fillStyle = discGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#121212';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // Track info section
    const infoX = 330;
    const infoY = 120;

    // "NOW PLAYING" label
    ctx.fillStyle = '#b3b3b3';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('NOW PLAYING', infoX, infoY);

    // Track title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    let titleSize = 32;
    ctx.font = `bold ${titleSize}px Arial`;
    while (ctx.measureText(trackTitle).width > 420 && titleSize > 20) {
      titleSize -= 2;
      ctx.font = `bold ${titleSize}px Arial`;
    }
    const truncTitle = trackTitle.length > 35 ? trackTitle.substring(0, 35) + '...' : trackTitle;
    ctx.fillText(truncTitle, infoX, infoY + 40);

    // Artist
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '20px Arial';
    const truncAuthor = trackAuthor.length > 40 ? trackAuthor.substring(0, 40) + '...' : trackAuthor;
    ctx.fillText(truncAuthor, infoX, infoY + 70);

    // Animated equalizer bars (Spotify style)
    const eqY = infoY + 110;
    const barCount = 30;
    const barWidth = 8;
    const barSpacing = 14;
    const maxBarHeight = 50;
    
    for (let i = 0; i < barCount; i++) {
      const wavePhase = (frame / frames) * Math.PI * 2 + i * 0.3;
      const barHeight = (Math.sin(wavePhase) * 0.5 + 0.5) * maxBarHeight * (0.5 + Math.random() * 0.5);
      
      const barGradient = ctx.createLinearGradient(0, eqY, 0, eqY - barHeight);
      barGradient.addColorStop(0, '#1DB954');
      barGradient.addColorStop(1, '#1ed760');
      
      ctx.fillStyle = barGradient;
      ctx.fillRect(infoX + i * barSpacing, eqY - barHeight, barWidth, barHeight);
    }

    // Duration badge
    const badgeY = infoY + 180;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(infoX, badgeY, 120, 36, 18);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⏱️ ' + trackDuration, infoX + 60, badgeY + 23);
    ctx.textAlign = 'left';

    // Progress bar (Spotify style)
    const progressY = 340;
    const progressX = 60;
    const progressWidth = 680;
    const progress = (frame / frames);
    
    // Time elapsed
    const elapsedMinutes = Math.floor((frame / frames) * 3.5);
    const elapsedSeconds = Math.floor(((frame / frames) * 3.5 - elapsedMinutes) * 60);
    const elapsedTime = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
    
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '12px Arial';
    ctx.fillText(elapsedTime, progressX, progressY - 8);
    
    // Total duration
    ctx.textAlign = 'right';
    ctx.fillText(trackDuration, progressX + progressWidth, progressY - 8);
    ctx.textAlign = 'left';
    
    // Progress track
    ctx.fillStyle = '#4d4d4d';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth, 4, 2);
    ctx.fill();
    
    // Progress bar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth * progress, 4, 2);
    ctx.fill();
    
    // Progress dot (appears on hover effect)
    const pulseSize = 6 + Math.sin((frame / frames) * Math.PI * 4) * 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(progressX + progressWidth * progress, progressY + 2, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Spotify green accent line at bottom
    ctx.fillStyle = '#1DB954';
    ctx.fillRect(0, 395, 800, 5);

    encoder.addFrame(ctx as any);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

/**
 * Create animated "Skipped" image
 */
export async function createSkippedGIF(
  trackTitle: string,
  trackAuthor: string,
  nextTrack?: { title: string, author: string }
): Promise<Buffer> {
  const canvas = createCanvas(700, 350);
  const ctx = canvas.getContext('2d');
  
  const encoder = new GIFEncoder(700, 350);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(60);
  encoder.setQuality(10);

  const frames = 20;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 700, 350);
    
    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 350);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 700, 350);

    // Skip icon with slide animation
    const slideX = 50 + (frame / frames) * 200;
    await drawSVGIcon(ctx, 'forward_music', slideX, 80, 64);
    
    // Fade trail effect
    for (let i = 0; i < 3; i++) {
      const trailX = slideX - (i + 1) * 30;
      const trailAlpha = 0.3 - i * 0.1;
      ctx.globalAlpha = trailAlpha;
      await drawSVGIcon(ctx, 'forward_music', trailX, 80, 64);
    }
    ctx.globalAlpha = 1;

    // "SKIPPED" text
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('SKIPPED', 350, 100);

    // Skipped track info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    const skippedTitle = trackTitle.length > 40 ? trackTitle.substring(0, 40) + '...' : trackTitle;
    ctx.fillText(skippedTitle, 50, 180);
    
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '18px Arial';
    const skippedAuthor = trackAuthor.length > 50 ? trackAuthor.substring(0, 50) + '...' : trackAuthor;
    ctx.fillText(skippedAuthor, 50, 210);

    // Divider with animation
    const dividerWidth = 600 * (frame / frames);
    ctx.strokeStyle = '#1DB954';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 240);
    ctx.lineTo(50 + dividerWidth, 240);
    ctx.stroke();

    // Next track (fade in)
    if (nextTrack && frame > 10) {
      const fadeAlpha = (frame - 10) / 10;
      ctx.globalAlpha = fadeAlpha;
      
      ctx.fillStyle = '#1DB954';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('▶ NEXT UP', 50, 275);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      const nextTitle = nextTrack.title.length > 45 ? nextTrack.title.substring(0, 45) + '...' : nextTrack.title;
      ctx.fillText(nextTitle, 50, 305);
      
      ctx.fillStyle = '#b3b3b3';
      ctx.font = '16px Arial';
      const nextAuthor = nextTrack.author.length > 50 ? nextTrack.author.substring(0, 50) + '...' : nextTrack.author;
      ctx.fillText(nextAuthor, 50, 330);
      
      ctx.globalAlpha = 1;
    }

    encoder.addFrame(ctx as any);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

/**
 * Create animated "Queue" image
 */
export async function createQueueGIF(
  currentTrack: { title: string, author: string },
  queueLength: number,
  thumbnailUrl?: string
): Promise<Buffer> {
  const canvas = createCanvas(700, 300);
  const ctx = canvas.getContext('2d');
  
  const encoder = new GIFEncoder(700, 300);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(80);
  encoder.setQuality(10);

  let thumbnail = null;
  if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
    try {
      thumbnail = await loadImage(thumbnailUrl);
    } catch (error) {
      console.log('Failed to load thumbnail');
    }
  }

  const frames = 20;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 700, 300);
    
    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 300);
    bgGradient.addColorStop(0, '#2d1b3d');
    bgGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 700, 300);

    // Animated lines
    for (let i = 0; i < 5; i++) {
      const lineY = 50 + i * 50;
      const lineWidth = 550 + Math.sin((frame / frames) * Math.PI * 2 + i) * 20;
      ctx.fillStyle = `rgba(139, 92, 246, ${0.1 + i * 0.02})`;
      ctx.fillRect(120, lineY, lineWidth, 30);
    }

    // Thumbnail or icon
    if (thumbnail) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(60, 150, 45, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(thumbnail, 15, 105, 90, 90);
      ctx.restore();
      
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(60, 150, 47, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      await drawSVGIcon(ctx, 'music_disc', 30, 120, 60);
    }

    // Queue icon with pulse
    const pulseScale = 1 + Math.sin((frame / frames) * Math.PI * 2) * 0.1;
    ctx.save();
    ctx.translate(650, 30);
    ctx.scale(pulseScale, pulseScale);
    await drawSVGIcon(ctx, 'music_notes', -16, -16, 32);
    ctx.restore();

    // Queue count
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${queueLength}`, 645, 70);

    // Current track
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    const currentTitle = currentTrack.title.length > 35 ? currentTrack.title.substring(0, 35) + '...' : currentTrack.title;
    ctx.fillText(currentTitle, 130, 140);
    
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '16px Arial';
    const currentAuthor = currentTrack.author.length > 40 ? currentTrack.author.substring(0, 40) + '...' : currentTrack.author;
    ctx.fillText(currentAuthor, 130, 165);

    // Progress bar animation
    const progress = (frame / frames);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.fillRect(130, 185, 520, 4);
    
    ctx.fillStyle = '#8B5CF6';
    ctx.fillRect(130, 185, 520 * progress, 4);

    encoder.addFrame(ctx as any);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}
