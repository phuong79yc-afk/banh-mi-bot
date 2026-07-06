import { Collection, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  handleBlackjackButton?: (interaction: any, action: string, userId: string) => Promise<void>;
  handleTicTacToeButton?: (interaction: any, gameId: string, position: number) => Promise<void>;
  isMaintenanceMode?: () => boolean;
  getMaintenanceInfo?: () => { reason: string; startTime?: Date };
  isCommandDisabled?: (commandName: string) => boolean;
  getDisabledInfo?: (commandName: string) => { reason: string; disabledBy: string; disabledAt: Date } | undefined;
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}
