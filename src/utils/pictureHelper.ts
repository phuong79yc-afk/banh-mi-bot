import { AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface PictureResult {
  url: string;
  files: AttachmentBuilder[];
}

/**
 * Picture helper function - Load image from URL or assets folder
 * 
 * @param urlFromEnv - URL from environment variable (if set, use this directly)
 * @param fileName - Filename in assets/ folder (fallback if no URL)
 * @returns Object with url and files array for Discord embed
 * 
 * Usage:
 * const icon = picture(process.env.DAILY_THUMBNAIL, 'daily-icon.png');
 * if (icon) {
 *   embed.setThumbnail(icon.url);
 *   // Send with files: { embeds: [embed], files: icon.files }
 * }
 */
export function picture(urlFromEnv: string | undefined, fileName: string): PictureResult | null {
  // If URL is provided in env, use it directly (no attachment needed)
  if (urlFromEnv && urlFromEnv.trim()) {
    return { url: urlFromEnv, files: [] };
  }
  
  // Otherwise, look for file in assets/ folder
  const filePath = path.join(process.cwd(), 'assets', fileName);
  
  // If file doesn't exist, return null (embed will work without image)
  if (!fs.existsSync(filePath)) {
    console.log(`[Picture] File not found: ${filePath} - embed will display without this image`);
    return null;
  }
  
  // Create attachment
  const attachment = new AttachmentBuilder(filePath, { name: fileName });
  
  return {
    url: `attachment://${fileName}`,
    files: [attachment]
  };
}

/**
 * Combine multiple picture results into one array
 * 
 * @param pictures - Array of PictureResult objects
 * @returns Combined files array
 * 
 * Usage:
 * const icon = picture(process.env.DAILY_THUMBNAIL, 'daily-icon.png');
 * const banner = picture(process.env.DAILY_BANNER, 'daily-banner.png');
 * const files = combineFiles([icon, banner]);
 */
export function combineFiles(pictures: (PictureResult | null)[]): AttachmentBuilder[] {
  const allFiles: AttachmentBuilder[] = [];
  
  for (const pic of pictures) {
    if (pic && pic.files) {
      allFiles.push(...pic.files);
    }
  }
  
  return allFiles;
}
