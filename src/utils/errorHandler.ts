import { ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
import { emojis } from '../config/emojis';

export async function handleCommandError(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  error: any,
  commandName: string
): Promise<void> {
  console.error(`[${commandName}] Error:`, error);
  
  // Handle specific Discord.js errors
  if (error.code === 10062) {
    console.warn(`[${commandName}] Interaction expired`);
    return;
  }
  
  if (error.code === 50013) {
    const message = `${emojis.error} Bot thiếu quyền để thực hiện hành động này!`;
    return sendErrorReply(interaction, message);
  }
  
  if (error.code === 50001) {
    const message = `${emojis.error} Bot thiếu quyền truy cập!`;
    return sendErrorReply(interaction, message);
  }
  
  // Generic error
  const message = `${emojis.error} Có lỗi xảy ra khi thực hiện lệnh này!`;
  await sendErrorReply(interaction, message);
}

async function sendErrorReply(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  message: string
): Promise<void> {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: message });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  } catch (replyError: any) {
    if (replyError.code !== 10062) {
      console.error('Failed to send error reply:', replyError);
    }
  }
}

export function logError(context: string, error: any): void {
  console.error(`[${context}]`, {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
}
