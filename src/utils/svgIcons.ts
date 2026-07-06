import { createCanvas, loadImage, Image, CanvasRenderingContext2D } from 'canvas';

/**
 * SVG Icons utility for Discord bot
 * Converts SVG to canvas-compatible images
 */

// SVG icon definitions
export const SVG_ICONS = {
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FFD700">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>`,
  
  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FFD700">
    <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"/>
    <circle cx="12" cy="12" r="2" fill="#FFF"/>
  </svg>`,
  
  trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FFD700">
    <path d="M20 2H4v4H2v4c0 2.21 1.79 4 4 4h.29C7.18 15.69 9.29 17 12 17s4.82-1.31 5.71-3H18c2.21 0 4-1.79 4-4V6h-2V2zM6 10c-1.1 0-2-.9-2-2V8h2v2zm10 5h-2v4h-4v-4H8l4-4 4 4zm2-5V8h2v2c0 1.1-.9 2-2 2z"/>
  </svg>`,
  
  fire: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FF4500">
    <path d="M13.5 0C10.5 3 9 6 9 9c0 .5.1 1 .2 1.5-1.2-.3-2.3-.8-3.3-1.5 0 2.8.8 5.5 2.3 7.7C9.3 18.5 10.8 20 12.5 21c-.1-.3-.1-.6-.1-1 0-2.8 1.3-5.4 3.5-7.1-.6 1.2-.9 2.6-.9 4 0 .3 0 .7.1 1 2.4-1.7 4-4.5 4-7.7 0-5.2-3.8-9.4-8.1-10.2z"/>
  </svg>`,
  
  lightning: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FFFF00">
    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
  </svg>`,
  
  crown: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FFD700">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
  </svg>`,
  
  gem: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#00CED1">
    <path d="M6.5 2L2 9l10 13L22 9l-4.5-7h-11zM12 19.3L4.2 9h15.6L12 19.3zM8.5 7L12 3.5 15.5 7h-7z"/>
  </svg>`,
  
  rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FF6347">
    <path d="M12 2c0 3-2 7-2 7H8s-2-4-4-4c0 0 0 4-2 6 0 0 0 2 2 2 0 0 2 2 6 2v5l2 2 2-2v-5c4 0 6-2 6-2 2 0 2-2 2-2-2-2-2-6-2-6-2 0-4 4-4 4h-2s-2-4-2-7z"/>
  </svg>`,
  
  medal: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FFD700">
    <circle cx="12" cy="15" r="5" fill="#FFD700"/>
    <path d="M8 2L7 7l5 3 5-3-1-5H8z" fill="#FF6347"/>
    <circle cx="12" cy="15" r="3" fill="#FFA500"/>
  </svg>`,
  
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FF1493">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>`,
  
  // TempVoice icons
  name_tag: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#7289DA">
    <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
  </svg>`,
  
  users_limit: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#7289DA">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>`,
  
  privacy_lock: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#7289DA">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
  </svg>`,
  
  waiting_time: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#7289DA">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>`,
  
  thread_hash: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#7289DA">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8.5 15H7.3l-2.55-3.5L7.3 8H8.5l-2.55 3.5L8.5 15zm5.5 0h-1.2l-2.55-3.5L12.8 8H14l-2.55 3.5L14 15zm5.5 0h-1.2l-2.55-3.5L18.3 8h1.2l-2.55 3.5L19.5 15z"/>
  </svg>`,
  
  user_trust: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#43B581">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    <path d="M16 14l2 2 4-4" stroke="#43B581" stroke-width="2" fill="none"/>
  </svg>`,
  
  user_untrust: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#F04747">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    <path d="M17 13l4 4m0-4l-4 4" stroke="#F04747" stroke-width="2" fill="none"/>
  </svg>`,
  
  phone_invite: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#43B581">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
  </svg>`,
  
  kick_boot: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#F04747">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
    <path d="M19 12l-5 5v-3H8v-4h6V7l5 5z" fill="#FFFFFF"/>
  </svg>`,
  
  globe_region: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#7289DA">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
  </svg>`,
  
  block_x: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#F04747">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
  </svg>`,
  
  unblock_check: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#43B581">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`,
  
  crown_claim: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#F1C40F">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
  </svg>`,
  
  transfer_arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#F1C40F">
    <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
  </svg>`,
  
  trash_delete: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#F04747">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>`,
  
  // Music icons
  music_playing: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>`,
  
  music_notes: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10-9h-3V7h3v3zm0 4h-3v-3h3v3z"/>
  </svg>`,
  
  music_disc: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
  </svg>`,
  
  music_headphones: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
  </svg>`,
  
  music_volume: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>`,
  
  loading_music: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.3"/>
    <path d="M18 12c0-3.31-2.69-6-6-6v2c2.21 0 4 1.79 4 4h2z"/>
  </svg>`,
  
  checkmark_music: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#43B581">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`,
  
  forward_music: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
  </svg>`,
  
  party_music: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FF6347">
    <path d="M7 8h10l2 4h-14z"/>
    <path d="M12 12l-7 8h14l-7-8z" fill="#FFD700"/>
    <circle cx="12" cy="4" r="2" fill="#FF69B4"/>
  </svg>`,
  
  vinyl_spin: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
    <circle cx="12" cy="12" r="10" fill="#2C2C2C"/>
    <circle cx="12" cy="12" r="7" fill="#1DB954"/>
    <circle cx="12" cy="12" r="4" fill="#2C2C2C"/>
    <circle cx="12" cy="12" r="1.5" fill="#FFD700"/>
  </svg>`,
  
  // Control button icons - Material Design style (flat, minimalist)
  pause_button: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
  </svg>`,
  
  play_button: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#57F287">
    <path d="M8 5v14l11-7z"/>
  </svg>`,
  
  stop_button: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#ED4245">
    <path d="M6 6h12v12H6z"/>
  </svg>`,
  
  skip_button: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
  </svg>`,
  
  previous_button: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
  </svg>`,
  
  loop_button: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#FEE75C">
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
  </svg>`,
};

/**
 * Convert SVG string to canvas Image
 */
async function svgToImage(svgString: string, width: number = 64, height: number = 64): Promise<Image> {
  // Create a data URI from SVG
  const svgBuffer = Buffer.from(svgString);
  const base64 = svgBuffer.toString('base64');
  const dataUri = `data:image/svg+xml;base64,${base64}`;
  
  return await loadImage(dataUri);
}

/**
 * Cache for loaded SVG images to improve performance
 */
const iconCache = new Map<string, Image>();

/**
 * Load and cache an SVG icon
 */
export async function loadSVGIcon(iconName: keyof typeof SVG_ICONS, width: number = 64, height: number = 64): Promise<Image> {
  const cacheKey = `${iconName}_${width}_${height}`;
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }
  
  const svgString = SVG_ICONS[iconName];
  if (!svgString) {
    throw new Error(`Icon "${iconName}" not found`);
  }
  
  const image = await svgToImage(svgString, width, height);
  iconCache.set(cacheKey, image);
  
  return image;
}

/**
 * Draw an SVG icon on canvas
 */
export async function drawSVGIcon(
  ctx: CanvasRenderingContext2D,
  iconName: keyof typeof SVG_ICONS,
  x: number,
  y: number,
  size: number = 32
): Promise<void> {
  try {
    const icon = await loadSVGIcon(iconName, size, size);
    ctx.drawImage(icon, x, y, size, size);
  } catch (error) {
    console.error(`Error drawing SVG icon "${iconName}":`, error);
  }
}

/**
 * Create a custom SVG icon from path data
 */
export async function createCustomSVGIcon(
  pathData: string,
  fillColor: string = '#FFD700',
  width: number = 64,
  height: number = 64
): Promise<Image> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="${fillColor}">
    <path d="${pathData}"/>
  </svg>`;
  
  return await svgToImage(svg, width, height);
}

/**
 * Batch load multiple icons for better performance
 */
export async function preloadIcons(icons: Array<keyof typeof SVG_ICONS>): Promise<void> {
  const promises = icons.map(icon => loadSVGIcon(icon));
  await Promise.all(promises);
  console.log(`✅ Preloaded ${icons.length} SVG icons`);
}

// Export icon names for type safety
export type IconName = keyof typeof SVG_ICONS;
