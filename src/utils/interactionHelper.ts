/**
 * Interaction Helper - Utilities to safely handle Discord interactions
 * Prevents "Unknown interaction" crashes
 */

import { 
  ButtonInteraction, 
  StringSelectMenuInteraction, 
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  InteractionResponse,
  Message
} from 'discord.js';

type AnyInteraction = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction | ChatInputCommandInteraction;

/**
 * Safely defer an interaction
 * Returns true if successful, false if interaction expired
 */
export async function safeDeferReply(
  interaction: AnyInteraction,
  options?: { ephemeral?: boolean }
): Promise<boolean> {
  try {
    if (interaction.replied || interaction.deferred) {
      return true; // Already handled
    }

    await interaction.deferReply(options);
    return true;
  } catch (error: any) {
    if (error.code === 10062) {
      console.warn(`⚠️ Cannot defer - interaction expired`);
      return false;
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Safely defer update (for buttons/select menus)
 */
export async function safeDeferUpdate(
  interaction: ButtonInteraction | StringSelectMenuInteraction
): Promise<boolean> {
  try {
    if (interaction.replied || interaction.deferred) {
      return true;
    }

    await interaction.deferUpdate();
    return true;
  } catch (error: any) {
    if (error.code === 10062) {
      console.warn(`⚠️ Cannot defer update - interaction expired`);
      return false;
    }
    throw error;
  }
}

/**
 * Safely reply to an interaction
 */
export async function safeReply(
  interaction: AnyInteraction,
  content: any
): Promise<any> {
  try {
    if (interaction.replied) {
      return await interaction.followUp(content);
    } else if (interaction.deferred) {
      return await interaction.editReply(content);
    } else {
      return await interaction.reply(content);
    }
  } catch (error: any) {
    if (error.code === 10062) {
      console.warn(`⚠️ Cannot reply - interaction expired`);
      return null;
    }
    throw error;
  }
}

/**
 * Safely edit reply
 */
export async function safeEditReply(
  interaction: AnyInteraction,
  content: any
): Promise<Message | null> {
  try {
    return await interaction.editReply(content);
  } catch (error: any) {
    if (error.code === 10062) {
      console.warn(`⚠️ Cannot edit - interaction expired`);
      return null;
    }
    throw error;
  }
}

/**
 * Safely follow up
 */
export async function safeFollowUp(
  interaction: AnyInteraction,
  content: any
): Promise<Message | null> {
  try {
    return await interaction.followUp(content);
  } catch (error: any) {
    if (error.code === 10062) {
      console.warn(`⚠️ Cannot follow up - interaction expired`);
      return null;
    }
    throw error;
  }
}

/**
 * Safely update (for buttons/select menus)
 */
export async function safeUpdate(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  content: any
): Promise<any> {
  try {
    if (interaction.deferred) {
      return await interaction.editReply(content);
    } else {
      return await interaction.update(content);
    }
  } catch (error: any) {
    if (error.code === 10062) {
      console.warn(`⚠️ Cannot update - interaction expired`);
      return null;
    }
    throw error;
  }
}

/**
 * Check if interaction is still valid (not expired)
 */
export function isInteractionValid(interaction: AnyInteraction): boolean {
  // Discord interactions expire after 15 minutes
  // But we check for 14 minutes to be safe
  const now = Date.now();
  const interactionTime = interaction.createdTimestamp;
  const elapsed = now - interactionTime;
  
  return elapsed < 14 * 60 * 1000; // 14 minutes
}

/**
 * Wrap async interaction handler with error handling
 */
export function wrapInteractionHandler<T extends AnyInteraction>(
  handler: (interaction: T) => Promise<void>
): (interaction: T) => Promise<void> {
  return async (interaction: T) => {
    try {
      await handler(interaction);
    } catch (error: any) {
      if (error.code === 10062) {
        console.warn(`⚠️ Interaction expired in handler`);
        return; // Silent fail
      }
      
      // Log other errors
      console.error('Interaction handler error:', error);
      
      // Try to send error message
      try {
        const errorContent = {
          content: '❌ Có lỗi xảy ra khi xử lý tương tác này!',
          flags: 64
        };
        
        await safeReply(interaction, errorContent);
      } catch (replyError) {
        // Can't send error message, just log
        console.error('Cannot send error message:', replyError);
      }
    }
  };
}

/**
 * Create a safe collector with auto error handling
 */
export function createSafeCollector<T extends ButtonInteraction | StringSelectMenuInteraction>(
  message: Message,
  options: {
    time?: number;
    max?: number;
    filter?: (i: T) => boolean;
  },
  handler: (interaction: T) => Promise<void>
) {
  const collector = message.createMessageComponentCollector({
    time: options.time || 60000, // Default 1 minute
    max: options.max,
    filter: options.filter as any
  });

  collector.on('collect', wrapInteractionHandler(handler));

  collector.on('end', (collected, reason) => {
    console.log(`Collector ended: ${reason} (collected ${collected.size})`);
  });

  return collector;
}

/**
 * Execute with timeout protection
 */
export async function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 14000,
  timeoutMessage: string = 'Operation timeout'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}
