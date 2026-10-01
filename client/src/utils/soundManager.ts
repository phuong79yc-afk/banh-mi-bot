// Sound Manager for Notifications

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private soundTheme: 'modern' | 'classic' | 'gaming' | 'minimal' = 'modern';

  constructor() {
    // Check if sound is enabled in localStorage
    const soundEnabled = localStorage.getItem('notificationSound');
    this.enabled = soundEnabled !== 'false'; // Default true
    
    const savedTheme = localStorage.getItem('soundTheme') as 'modern' | 'classic' | 'gaming' | 'minimal';
    if (savedTheme) {
      this.soundTheme = savedTheme;
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate more pleasant sounds with multiple oscillators
  private playModernSound(baseFreq: number, duration: number, pattern: 'single' | 'double' | 'triple' | 'chord' | 'melody') {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      
      switch (pattern) {
        case 'chord':
          // Play harmonious chord (major triad)
          this.createOscillator(ctx, baseFreq, duration, 0.15);           // Root
          this.createOscillator(ctx, baseFreq * 1.25, duration, 0.12);    // Major 3rd
          this.createOscillator(ctx, baseFreq * 1.5, duration, 0.1);      // Perfect 5th
          break;
          
        case 'melody':
          // Ascending melody
          this.createOscillator(ctx, baseFreq, 100, 0.2, 0);
          this.createOscillator(ctx, baseFreq * 1.25, 100, 0.2, 120);
          this.createOscillator(ctx, baseFreq * 1.5, 120, 0.25, 240);
          break;
          
        case 'double':
          // Quick double tap
          this.createOscillator(ctx, baseFreq, 80, 0.25, 0);
          this.createOscillator(ctx, baseFreq * 1.2, 80, 0.25, 120);
          break;
          
        case 'triple':
          // Alert triple
          this.createOscillator(ctx, baseFreq, 100, 0.2, 0);
          this.createOscillator(ctx, baseFreq, 100, 0.2, 150);
          this.createOscillator(ctx, baseFreq, 120, 0.25, 300);
          break;
          
        default:
          // Single clean tone
          this.createOscillator(ctx, baseFreq, duration, 0.25);
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private createOscillator(
    ctx: AudioContext, 
    frequency: number, 
    duration: number, 
    volume: number,
    delay: number = 0
  ) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Low-pass filter for warmer sound
    filter.type = 'lowpass';
    filter.frequency.value = frequency * 2;

    const startTime = ctx.currentTime + delay / 1000;
    const endTime = startTime + duration / 1000;

    // Smooth envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.1);
  }

  // Gaming-style sounds
  private playGamingSound(type: string) {
    const ctx = this.getAudioContext();
    
    switch (type) {
      case 'powerup':
        // Power-up ascending
        for (let i = 0; i < 8; i++) {
          this.createOscillator(ctx, 200 + i * 100, 50, 0.15, i * 40);
        }
        break;
        
      case 'coin':
        // Coin collect
        this.createOscillator(ctx, 988, 100, 0.3, 0);
        this.createOscillator(ctx, 1319, 100, 0.3, 100);
        break;
        
      case 'achievement':
        // Achievement unlock
        this.createOscillator(ctx, 523, 150, 0.2, 0);
        this.createOscillator(ctx, 659, 150, 0.2, 150);
        this.createOscillator(ctx, 784, 150, 0.2, 300);
        this.createOscillator(ctx, 1047, 300, 0.25, 450);
        break;
        
      case 'alert':
        // Alert sound
        this.createOscillator(ctx, 800, 100, 0.3, 0);
        this.createOscillator(ctx, 600, 100, 0.3, 120);
        this.createOscillator(ctx, 800, 100, 0.3, 240);
        break;
    }
  }

  // Play notification sound based on theme and type
  playNotificationSound(type: string = 'default') {
    if (!this.enabled) return;

    if (this.soundTheme === 'gaming') {
      switch (type) {
        case 'serverAlerts':
          this.playGamingSound('powerup');
          break;
        case 'errorReports':
          this.playGamingSound('alert');
          break;
        case 'musicUpdates':
          this.playGamingSound('coin');
          break;
        case 'commandUsage':
          this.playGamingSound('coin');
          break;
        case 'maintenance':
          this.playGamingSound('alert');
          break;
        default:
          this.playGamingSound('achievement');
      }
      return;
    }

    // Modern theme (default)
    switch (type) {
      case 'serverAlerts':
        this.playModernSound(600, 150, 'double');
        break;

      case 'errorReports':
        this.playModernSound(400, 250, 'single');
        break;

      case 'musicUpdates':
        this.playModernSound(523, 150, 'melody');
        break;

      case 'commandUsage':
        this.playModernSound(800, 100, 'single');
        break;

      case 'maintenance':
        this.playModernSound(700, 120, 'triple');
        break;

      default:
        this.playModernSound(750, 150, 'chord');
        break;
    }
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('notificationSound', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Set sound theme
  setSoundTheme(theme: 'modern' | 'classic' | 'gaming' | 'minimal') {
    this.soundTheme = theme;
    localStorage.setItem('soundTheme', theme);
  }

  getSoundTheme(): string {
    return this.soundTheme;
  }

  // Play success sound (for user actions)
  playSuccess() {
    if (this.soundTheme === 'gaming') {
      this.playGamingSound('powerup');
    } else {
      this.playModernSound(800, 120, 'melody');
    }
  }

  // Play error sound (for user actions)
  playError() {
    this.playModernSound(400, 200, 'single');
  }

  // Generic play method (compatibility)
  play(type: 'success' | 'error' | 'info' | 'warning' = 'success') {
    switch (type) {
      case 'success':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
      case 'warning':
        this.playModernSound(600, 150, 'double');
        break;
      case 'info':
      default:
        this.playModernSound(750, 120, 'single');
        break;
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();
