import { AttachmentBuilder, Client } from 'discord.js';
import { getPixelEmoji } from '../config/emojis';
import { getCommandEmoji } from '../config/commandEmojis';
import { syncAnimatedEmojiMarkup } from '../config/emojis';

const EMOJI_PATTERN =
  /(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*(?:\u{1F3FB}-\u{1F3FF})?|\p{Regional_Indicator}{2})/gu;

const PIXEL_BY_GLYPH: Record<string, string> = {
  '💰': 'coin', '📜': 'receipt', '🎁': 'giveaway', '📦': 'package',
  '⭐': 'star', '🌟': 'star', '✨': 'star', '💫': 'beacon',
  '📊': 'chart', '🏆': 'trophy', '🔄': 'refresh', '🏪': 'shop',
  '🎒': 'backpack', '❌': 'error', '📋': 'list', '🎲': 'dice',
  '🎯': 'target', '🎰': 'slots', '🎉': 'celebration', '📝': 'note',
  '⏱️': 'alarm', '🔀': 'shuffle', '🗑️': 'trash', '📤': 'upload',
  '🧠': 'ai', '💭': 'thought', '👁️': 'eye', '🧹': 'broom',
  '🖼️': 'image', '➕': 'plus', '✏️': 'pencil', '📄': 'paper',
  '🔍': 'search', '➖': 'minus', '🔘': 'toggle', '⚙️': 'settings',
  '💡': 'bulb', '👢': 'boot', '🔨': 'hammer', '⏸️': 'pause',
  '🔒': 'lock', '🔓': 'unlock', '✅': 'success', '✔️': 'check',
  'ℹ️': 'info', '📈': 'chart', '🧽': 'sponge', '📑': 'report',
  '❎': 'error', '🔎': 'search', '📅': 'daily', '👮': 'police',
  '👤': 'user', '🚷': 'noentry', '🎭': 'mask', '🎛️': 'controlpanel',
  '⛔': 'noentry', '👔': 'suit', '🎨': 'image', '💥': 'explosion',
  '🛠️': 'tools', '📡': 'antenna', '❤️': 'heart', '❤': 'heart',
  '🔌': 'plugin', '👋': 'welcome', '💾': 'floppy', '🗂️': 'folders',
  '⏰': 'alarm', '❓': 'question', '📖': 'book', '🧮': 'calculator',
  '🧪': 'flask', '🎫': 'ticket', '📌': 'pin', '📏': 'report',
  '👻': 'ghost', '😴': 'sleepy', '⛏️': 'pickaxe', '🎵': 'music',
  '🏗️': 'construction', '👑': 'vip', '🎖️': 'medal', '💎': 'diamond',
  '🟢': 'online', '🔴': 'offline', '🟡': 'idle', '🏹': 'bow',
  '🛡️': 'shield', '⚔️': 'moderation', '💊': 'potion', '⚗️': 'potion',
  '📚': 'book', '📕': 'book', '📘': 'book', '📗': 'book',
  '📙': 'book', '🧰': 'chest', '💚': 'emerald', '🟥': 'redstone',
  '🍖': 'meat', '🔥': 'fire', '💧': 'water',
  '🌊': 'water', '🌳': 'tree', '🌲': 'tree', '🪨': 'rock',
  '🪙': 'coin', '💵': 'coin', '💴': 'coin', '💶': 'coin',
  '💷': 'coin', '💸': 'coin', '🛒': 'shop',
  '🏅': 'medal', '🥇': 'medal', '🥈': 'medal', '🥉': 'medal',
  '🤖': 'ai', '🐢': 'turtle', '🎮': 'game', '🕹️': 'game',
  '🎶': 'music', '🎼': 'music', '🎤': 'voice', '🎧': 'voice',
  '▶️': 'music', '⏹️': 'music', '⏭️': 'music', '⏮️': 'music',
  '🔁': 'refresh', '🔂': 'refresh', '🔧': 'tools',
  '💻': 'ai', '🖥️': 'server', '📱': 'server', '🖱️': 'tools',
  '⌨️': 'tools', '💬': 'message', '🗨️': 'message',
  '😊': 'welcome', '😄': 'welcome', '😃': 'welcome', '😀': 'welcome',
  '😂': 'welcome', '🤣': 'welcome', '🐱': 'user', '🐶': 'user',
  '🐕': 'user', '🐩': 'user', '🐰': 'user', '🐇': 'user',
  '🐉': 'minecraft', '🐲': 'minecraft', '🗡️': 'moderation',
  '🔔': 'daily', '🔕': 'daily', '✉️': 'message', '📧': 'message',
  '📨': 'message', '📩': 'message', '📫': 'message',
  '📷': 'image', '📸': 'image', '🎙️': 'voice',
  '🍃': 'tree', '🌿': 'tree', '🌱': 'tree',
  '☀️': 'success', '🌞': 'success', '🌅': 'success',
  '🌙': 'idle', '🌛': 'idle', '🌜': 'idle', '☔': 'water',
  '🗝️': 'security', '🐾': 'user',
};

const wrappedTargets = new WeakMap<object, Set<string>>();

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

function pixelEmojiForGlyph(glyph: string): string | undefined {
  const pixelName = PIXEL_BY_GLYPH[glyph] ?? 'star';
  return getPixelEmoji(pixelName);
}

function convertText(value: string): string {
  return value.replace(EMOJI_PATTERN, (glyph) => pixelEmojiForGlyph(glyph) ?? glyph);
}

function convertComponentLabel(target: Record<string, unknown>): boolean {
  if (typeof target.label !== 'string') return false;

  const matches = [...target.label.matchAll(EMOJI_PATTERN)];
  if (!matches.length) return false;

  const pixelEmoji = pixelEmojiForGlyph(matches[0][0]);
  const parsedEmoji = pixelEmoji?.match(/^<:([^:]+):(\d+)>$/);
  if (!parsedEmoji) return false;

  target.emoji = { name: parsedEmoji[1], id: parsedEmoji[2] };
  const label = target.label.replace(EMOJI_PATTERN, '').trim();
  target.label = label.trim() ? label : 'pixel';
  return true;
}

function transformPayload(value: unknown, key = ''): unknown {
  if (typeof value === 'string') {
    if (!key || ['content', 'title', 'description'].includes(key)) {
      return convertText(value);
    }
    return value;
  }
  if (!value || typeof value !== 'object' || ArrayBuffer.isView(value)) return value;
  if (value instanceof AttachmentBuilder) return value;

  if (Array.isArray(value)) {
    return value.map((entry) => transformPayload(entry));
  }

  const object = value as Record<string, unknown>;
  const toJSON = object.toJSON;
  if (typeof toJSON === 'function') {
    return transformPayload(Reflect.apply(toJSON, value, []), key);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  const transformed: Record<string, unknown> = { ...object };
  const supportsPixelEmoji =
    'label' in transformed &&
    (transformed.type === 2 ||
      ('value' in transformed && !('custom_id' in transformed) && !('style' in transformed)));
  const convertedComponentEmoji = supportsPixelEmoji && convertComponentLabel(transformed);

  for (const [property, child] of Object.entries(object)) {
    if (property === 'files' || property === 'attachments') {
      transformed[property] = child;
      continue;
    }
    if (property === 'label' && 'label' in transformed) {
      if (supportsPixelEmoji) continue;
      transformed[property] = child;
      continue;
    }
    if (property === 'emoji' && convertedComponentEmoji) continue;
    if (property === 'value' && 'label' in object && 'value' in object) {
      transformed[property] = child;
      continue;
    }
    transformed[property] = transformPayload(child, property);
  }
  return transformed;
}

function prefixText(value: string, emoji: string): string {
  const heading = value.match(/^(\s{0,3}#{1,6}\s+)([\s\S]*)$/);
  if (heading) {
    const [, marker, content] = heading;
    return content.startsWith(emoji) ? value : `${marker}${emoji} ${content}`;
  }

  return value.trimStart().startsWith(emoji) ? value : `${emoji} ${value}`;
}

function prefixFirstTextDisplay(value: unknown, emoji: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => prefixFirstTextDisplay(entry, emoji));
  }
  if (!value || typeof value !== 'object') return false;

  const component = value as Record<string, unknown>;
  if (component.type === 10 && typeof component.content === 'string') {
    component.content = prefixText(component.content, emoji);
    return true;
  }
  return prefixFirstTextDisplay(component.components, emoji);
}

function decorateCommandPayload(value: unknown, emoji: string): unknown {
  if (typeof value === 'string') return prefixText(value, emoji);
  if (!value || typeof value !== 'object' || ArrayBuffer.isView(value)) return value;

  const payload = value as Record<string, unknown>;
  if (typeof payload.content === 'string') {
    payload.content = prefixText(payload.content, emoji);
    return payload;
  }

  if (Array.isArray(payload.embeds) && payload.embeds.length > 0) {
    const embed = payload.embeds[0] as Record<string, unknown>;
    const textKey = typeof embed.title === 'string' ? 'title' : 'description';
    if (typeof embed[textKey] === 'string') {
      embed[textKey] = prefixText(embed[textKey] as string, emoji);
      return payload;
    }
  }

  prefixFirstTextDisplay(payload.components, emoji);
  return payload;
}

function wrapMethods(target: object, methodNames: string[], commandEmoji?: string): void {
  let wrapped = wrappedTargets.get(target);
  if (!wrapped) {
    wrapped = new Set<string>();
    wrappedTargets.set(target, wrapped);
  }

  for (const methodName of methodNames) {
    if (wrapped.has(methodName)) continue;
    const method = Reflect.get(target, methodName);
    if (typeof method !== 'function') continue;

    Reflect.set(target, methodName, function (this: object, ...args: unknown[]) {
      if (args.length > 0) args[0] = transformPayload(args[0]);
      if (commandEmoji && args.length > 0) {
        args[0] = decorateCommandPayload(args[0], commandEmoji);
      }
      const result = Reflect.apply(method, this, args);
      if (
        commandEmoji &&
        (methodName === 'reply' || methodName === 'followUp') &&
        isPromiseLike(result)
      ) {
        return result.then((response: unknown) => {
          if (response && typeof response === 'object') {
            wrapMethods(response, ['edit'], commandEmoji);
          }
          return response;
        });
      }
      return result;
    });
    wrapped.add(methodName);
  }
}

function installMessageHooks(client: Client, guildId?: string): void {
  const guild = guildId ? client.guilds.cache.get(guildId) : undefined;
  if (guild) {
    for (const channel of guild.channels.cache.values()) {
      wrapMethods(channel, ['send']);
    }
  }
}

export function installPixelEmojiMiddleware(client: Client): void {
  const syncAnimatedEmojis = () => {
    syncAnimatedEmojiMarkup(
      [...client.guilds.cache.values()].flatMap((guild) => [...guild.emojis.cache.values()]),
    );
  };
  client.on('ready', syncAnimatedEmojis);
  client.on('guildCreate', syncAnimatedEmojis);
  client.on('emojiCreate', syncAnimatedEmojis);
  client.on('emojiDelete', syncAnimatedEmojis);
  client.on('emojiUpdate', syncAnimatedEmojis);

  client.on('interactionCreate', (interaction) => {
    const commandEmoji = interaction.isChatInputCommand()
      ? getCommandEmoji(
          interaction.commandName,
          interaction.options.getSubcommand(false) ?? undefined,
          interaction.options.getSubcommandGroup(false) ?? undefined,
        )
      : undefined;
    wrapMethods(interaction, ['reply', 'followUp', 'editReply', 'update', 'showModal'], commandEmoji);
    installMessageHooks(client, interaction.guildId ?? undefined);
  });

  client.on('messageCreate', (message) => {
    const prefixParts = message.content.startsWith('!')
      ? message.content.slice(1).trim().split(/\s+/)
      : [];
    const prefixCommand = prefixParts[0]?.toLowerCase() === 'bc'
      ? prefixParts[1]?.toLowerCase() ?? 'music'
      : prefixParts[0]?.toLowerCase();
    const commandEmoji = prefixCommand ? getCommandEmoji(prefixCommand, prefixParts[1]) : undefined;
    wrapMethods(message, ['reply', 'edit'], commandEmoji);
    wrapMethods(message.channel, ['send']);
    installMessageHooks(client, message.guildId ?? undefined);
  });
}
