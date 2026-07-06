// Game configuration settings
interface GameConfig {
  slots: {
    jackpotMultiplier: number;    // Nhân cho 💎💎💎 (mặc định: 10x)
    lucky7Multiplier: number;      // Nhân cho 7️⃣7️⃣7️⃣ (mặc định: 7x)
    tripleMultiplier: number;      // Nhân cho 3 giống nhau (mặc định: 3x)
    doubleMultiplier: number;      // Nhân cho 2 giống nhau (mặc định: 2x)
  };
  blackjack: {
    blackjackMultiplier: number;   // Nhân cho Blackjack (mặc định: 2.5x)
    winMultiplier: number;         // Nhân cho thắng thường (mặc định: 2x)
    dealerStandValue: number;      // Dealer dừng ở (mặc định: 17)
  };
  daily: {
    minReward: number;             // Phần thưởng tối thiểu (mặc định: 100)
    maxReward: number;             // Phần thưởng tối đa (mặc định: 600)
  };
}

// Default configuration
const defaultConfig: GameConfig = {
  slots: {
    jackpotMultiplier: 10,
    lucky7Multiplier: 7,
    tripleMultiplier: 3,
    doubleMultiplier: 2
  },
  blackjack: {
    blackjackMultiplier: 2.5,
    winMultiplier: 2,
    dealerStandValue: 17
  },
  daily: {
    minReward: 100,
    maxReward: 600
  }
};

// Current configuration (in-memory)
let currentConfig: GameConfig = { ...defaultConfig };

// Getters
export function getSlotsConfig() {
  return currentConfig.slots;
}

export function getBlackjackConfig() {
  return currentConfig.blackjack;
}

export function getDailyConfig() {
  return currentConfig.daily;
}

export function getAllConfig(): GameConfig {
  return { ...currentConfig };
}

// Setters
export function setSlotsConfig(config: Partial<GameConfig['slots']>) {
  currentConfig.slots = { ...currentConfig.slots, ...config };
}

export function setBlackjackConfig(config: Partial<GameConfig['blackjack']>) {
  currentConfig.blackjack = { ...currentConfig.blackjack, ...config };
}

export function setDailyConfig(config: Partial<GameConfig['daily']>) {
  currentConfig.daily = { ...currentConfig.daily, ...config };
}

// Reset to default
export function resetConfig() {
  currentConfig = { ...defaultConfig };
}

// Get default config
export function getDefaultConfig(): GameConfig {
  return { ...defaultConfig };
}
