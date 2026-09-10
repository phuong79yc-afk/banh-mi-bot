474/**
 * Helper functions for emoji rendering with different sizes
 */

import { emojis } from './emojis';

/**
 * Render emoji in large size (standalone)
 * Discord automatically renders standalone emojis larger
 */
export function largeEmoji(emojiString: string): string {
  return `\n${emojiString}\n`;
}

/**
 * Render multiple emojis in a row (large size)
 */
export function largeEmojiRow(...emojiStrings: string[]): string {
  return `\n${emojiStrings.join(' ')}\n`;
}

/**
 * Create a visual separator with emoji
 */
export function emojiSeparator(emoji: string, count: number = 3): string {
  return `\n${emoji.repeat(count)}\n`;
}

/**
 * Wrap text with emoji decorations (large)
 */
export function decoratedText(emoji: string, text: string): string {
  return `\n${emoji}\n**${text}**\n`;
}

/**
 * Create animated loading sequence
 */
export function loadingSequence(step: number, total: number = 5): string {
  const filled = emojis.sparkles.repeat(step);
  const empty = '⬜'.repeat(total - step);
  return `${filled}${empty}`;
}

/**
 * Status indicator with emoji
 */
export function statusEmoji(status: 'success' | 'error' | 'warning' | 'info' | 'loading'): string {
  const map = {
    success: emojis.success,
    error: emojis.error,
    warning: emojis.warning,
    info: emojis.info,
    loading: emojis.loading
  };
  return map[status];
}
