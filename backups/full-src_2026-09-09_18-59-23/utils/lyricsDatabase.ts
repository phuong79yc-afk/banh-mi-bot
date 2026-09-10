import fs from 'fs';
import path from 'path';

interface LyricsEntry {
  artist: string;
  title: string;
  lyrics: string;
  addedBy: string;
  addedAt: number;
}

class LyricsDatabase {
  private dbPath: string;
  private lyrics: Map<string, LyricsEntry>;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/lyrics.json');
    this.lyrics = new Map();
    this.load();
  }

  private getCacheKey(artist: string, title: string): string {
    return `${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
  }

  private load(): void {
    try {
      // Create data directory if not exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load lyrics from file
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const entries: LyricsEntry[] = JSON.parse(data);
        
        entries.forEach(entry => {
          const key = this.getCacheKey(entry.artist, entry.title);
          this.lyrics.set(key, entry);
        });

        console.log(`✅ Loaded ${this.lyrics.size} custom lyrics from database`);
      } else {
        // Create empty file
        fs.writeFileSync(this.dbPath, '[]', 'utf-8');
        console.log('📝 Created new lyrics database');
      }
    } catch (error) {
      console.error('Failed to load lyrics database:', error);
    }
  }

  private save(): void {
    try {
      const entries = Array.from(this.lyrics.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(entries, null, 2), 'utf-8');
      console.log(`💾 Saved ${entries.length} lyrics to database`);
    } catch (error) {
      console.error('Failed to save lyrics database:', error);
    }
  }

  public get(artist: string, title: string): string | null {
    const key = this.getCacheKey(artist, title);
    const entry = this.lyrics.get(key);
    return entry ? entry.lyrics : null;
  }

  public add(artist: string, title: string, lyrics: string, addedBy: string): boolean {
    try {
      const key = this.getCacheKey(artist, title);
      const entry: LyricsEntry = {
        artist,
        title,
        lyrics,
        addedBy,
        addedAt: Date.now()
      };
      
      this.lyrics.set(key, entry);
      this.save();
      
      console.log(`✅ Added lyrics for "${title}" by ${artist}`);
      return true;
    } catch (error) {
      console.error('Failed to add lyrics:', error);
      return false;
    }
  }

  public remove(artist: string, title: string): boolean {
    try {
      const key = this.getCacheKey(artist, title);
      const deleted = this.lyrics.delete(key);
      
      if (deleted) {
        this.save();
        console.log(`🗑️ Removed lyrics for "${title}" by ${artist}`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Failed to remove lyrics:', error);
      return false;
    }
  }

  public list(): LyricsEntry[] {
    return Array.from(this.lyrics.values());
  }

  public search(query: string): LyricsEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.lyrics.values()).filter(entry =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.artist.toLowerCase().includes(lowerQuery)
    );
  }

  public count(): number {
    return this.lyrics.size;
  }
}

export const lyricsDatabase = new LyricsDatabase();
