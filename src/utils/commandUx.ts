import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import { V2_EPHEMERAL } from './v2Helper';

export const COMMAND_TIMEOUT_MS = 14_000;

export function buildCommandContainer(title: string, message: string, accentColor = 0x5865f2) {
  const container = new ContainerBuilder().setAccentColor(accentColor);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(title),
    new TextDisplayBuilder().setContent(message),
  );
  return container;
}

export async function replyCommandError(
  interaction: ChatInputCommandInteraction,
  message: string,
) {
  const content = {
    components: [buildCommandContainer('## ❌ Không thể hoàn tất', message, 0xed4245)],
    flags: V2_EPHEMERAL,
  };

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(content);
    } else {
      await interaction.reply(content);
    }
  } catch (error: any) {
    if (error?.code !== 10062) {
      console.error('[CommandUX] Failed to send error reply', error);
    }
  }
}

export async function runCommandWithTimeout<T>(
  commandName: string,
  interaction: ChatInputCommandInteraction,
  task: Promise<T>,
): Promise<T | undefined> {
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const result = await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(Object.assign(new Error(`Command timeout: ${commandName}`), { code: 'COMMAND_TIMEOUT' })),
          COMMAND_TIMEOUT_MS,
        );
      }),
    ]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function auditSlashCommands(commands: Map<string, any>) {
  const seen = new Set<string>();
  const problems: string[] = [];

  for (const [name, command] of commands) {
    if (seen.has(name)) problems.push(`trùng tên: ${name}`);
    seen.add(name);

    const json = command?.data?.toJSON?.();
    if (!json?.name) {
      problems.push(`thiếu metadata data.name: ${name}`);
      continue;
    }
    if (json.type !== undefined && json.type !== 1) continue;
    if (!json.description || json.description.includes('\uFFFD')) {
      problems.push(`mô tả chưa chuẩn: /${json.name}`);
    }
    if ((json.description?.length ?? 0) > 100) {
      problems.push(`mô tả quá dài: /${json.name}`);
    }
  }

  if (problems.length) {
    console.warn('[CommandAudit]', {
      totalCommands: commands.size,
      problems,
    });
  } else {
    console.log(`[CommandAudit] ${commands.size} slash commands hợp lệ`);
  }
}

export function sanitizeCommandJson(commandJson: any): any {
  if (!commandJson || typeof commandJson !== 'object') return commandJson;

  if (typeof commandJson.description === 'string') {
    commandJson.description = commandJson.description
      .replace(/\uFFFD/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  if (Array.isArray(commandJson.options)) {
    for (const option of commandJson.options) {
      if (typeof option.description === 'string') {
        option.description = option.description
          .replace(/\uFFFD/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 100);
      }
      if (Array.isArray(option.options)) {
        option.options = option.options.map((child: any) => sanitizeCommandJson(child));
      }
      if (Array.isArray(option.choices)) {
        for (const choice of option.choices) {
          if (typeof choice.name === 'string') {
            choice.name = choice.name.replace(/\uFFFD/g, '').replace(/\s+/g, ' ').trim().slice(0, 100);
          }
        }
      }
    }
  }

  return commandJson;
}
