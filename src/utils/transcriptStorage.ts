import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export function saveTranscript(html: string, ticketName: string): string {
  // Create transcripts directory if not exists
  const transcriptsDir = join(process.cwd(), 'public', 'transcripts');
  if (!existsSync(transcriptsDir)) {
    mkdirSync(transcriptsDir, { recursive: true });
  }

  // Generate filename
  const filename = `${ticketName}-${Date.now()}.html`;
  const filepath = join(transcriptsDir, filename);

  // Save file
  writeFileSync(filepath, html, 'utf-8');

  // Return URL
  return `/transcripts/${filename}`;
}
