// Guess The Number Manager - Handle active games
export interface GameState {
  channelId: string;
  guildId: string;
  targetNumber: number;
  minRange: number;
  maxRange: number;
  rounds: number;
  currentRound: number;
  duration: number;
  startedAt: number;
  startedBy: string;
  participants: Map<string, number>; // userId -> attempts
  guesses: Array<{
    userId: string;
    username: string;
    guess: number;
    timestamp: number;
  }>;
  winnerId: string | null;
  winnerUsername: string | null;
  winnerAttempts: number | null;
  endTimeout: NodeJS.Timeout | null;
}

class GuessTheNumberManager {
  private games: Map<string, GameState> = new Map();

  // Start a new game
  startGame(
    channelId: string,
    guildId: string,
    startedBy: string,
    rounds: number = 1,
    duration: number = 60,
    minRange: number = 1,
    maxRange: number = 100
  ): GameState {
    // End existing game if any
    this.endGame(channelId);

    const targetNumber = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;

    const game: GameState = {
      channelId,
      guildId,
      targetNumber,
      minRange,
      maxRange,
      rounds,
      currentRound: 1,
      duration,
      startedAt: Date.now(),
      startedBy,
      participants: new Map(),
      guesses: [],
      winnerId: null,
      winnerUsername: null,
      winnerAttempts: null,
      endTimeout: null
    };

    this.games.set(channelId, game);
    return game;
  }

  // Get active game
  getGame(channelId: string): GameState | null {
    return this.games.get(channelId) || null;
  }

  // Check if game exists
  hasGame(channelId: string): boolean {
    return this.games.has(channelId);
  }

  // Make a guess
  makeGuess(
    channelId: string,
    userId: string,
    username: string,
    guess: number
  ): { result: 'too_low' | 'too_high' | 'correct' | 'invalid'; game: GameState | null } {
    const game = this.games.get(channelId);
    if (!game) {
      return { result: 'invalid', game: null };
    }

    // Check if guess is in range
    if (guess < game.minRange || guess > game.maxRange) {
      return { result: 'invalid', game };
    }

    // Track participant
    const attempts = game.participants.get(userId) || 0;
    game.participants.set(userId, attempts + 1);

    // Record guess
    game.guesses.push({
      userId,
      username,
      guess,
      timestamp: Date.now()
    });

    // Check if correct
    if (guess === game.targetNumber) {
      game.winnerId = userId;
      game.winnerUsername = username;
      game.winnerAttempts = game.participants.get(userId)!;
      return { result: 'correct', game };
    }

    if (guess < game.targetNumber) {
      return { result: 'too_low', game };
    } else {
      return { result: 'too_high', game };
    }
  }

  // End game
  endGame(channelId: string): GameState | null {
    const game = this.games.get(channelId);
    if (!game) return null;

    // Clear timeout if exists
    if (game.endTimeout) {
      clearTimeout(game.endTimeout);
      game.endTimeout = null;
    }

    this.games.delete(channelId);
    return game;
  }

  // Set auto-end timeout
  setAutoEnd(channelId: string, callback: () => void) {
    const game = this.games.get(channelId);
    if (!game) return;

    // Clear existing timeout
    if (game.endTimeout) {
      clearTimeout(game.endTimeout);
    }

    // Set new timeout
    game.endTimeout = setTimeout(() => {
      callback();
    }, game.duration * 1000);
  }

  // Get game statistics
  getStats(game: GameState): {
    totalGuesses: number;
    totalParticipants: number;
    avgAttempts: number;
    elapsedTime: number;
  } {
    const totalParticipants = game.participants.size;
    const totalGuesses = game.guesses.length;
    const avgAttempts = totalParticipants > 0 
      ? Array.from(game.participants.values()).reduce((a, b) => a + b, 0) / totalParticipants
      : 0;
    const elapsedTime = Math.floor((Date.now() - game.startedAt) / 1000);

    return {
      totalGuesses,
      totalParticipants,
      avgAttempts: Math.round(avgAttempts * 10) / 10,
      elapsedTime
    };
  }
}

export const gtnManager = new GuessTheNumberManager();
