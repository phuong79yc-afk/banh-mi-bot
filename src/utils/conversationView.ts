// Conversation View - Components V2 không viền (không Container)

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';

import type { Conversation, ConversationStats } from './conversationManager';

/* ───────────────────────── Types ────────────────────────────── */

type Block =
  | TextDisplayBuilder
  | SectionBuilder
  | SeparatorBuilder
  | ActionRowBuilder<ButtonBuilder>;

/** Payload dùng chung cho reply / editReply / followUp / send. */
export interface V2Payload {
  components: Block[];
  flags: number;
}

/* ───────────────────────── Helpers ──────────────────────────── */

const ICONS = { info: '💭', warn: '⏱️', error: '❌' } as const;

// Giới hạn Discord: tổng text trong 1 tin Components V2 là 4000 ký tự
const MAX_TEXT = 3500;

const text = (content: string) => new TextDisplayBuilder().setContent(content);

const divider = () =>
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);

function toPayload(blocks: Block[], ephemeral = false): V2Payload {
  return {
    components: blocks,
    flags: ephemeral
      ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      : MessageFlags.IsComponentsV2,
  };
}

/** Header có ảnh nhỏ bên phải (giống thumbnail của embed), không cần Container. */
function header(content: string, thumbnailURL?: string): Block {
  if (!thumbnailURL) return text(content);

  return new SectionBuilder()
    .addTextDisplayComponents(text(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailURL));
}

/** Chia text dài thành nhiều phần, ưu tiên cắt ở xuống dòng. */
export function splitText(input: string, max = MAX_TEXT): string[] {
  const chunks: string[] = [];
  let rest = input.trim();

  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;

    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

/* ───────────────────────── Views ────────────────────────────── */

export interface AiReplyMeta {
  model: string;
  style?: string;
  /** Tên người hỏi, hiện ở header. */
  askedBy?: string;
  /** Avatar hiện bên phải header (thường là avatar bot). */
  avatarURL?: string;
}

/**
 * Câu trả lời AI. Trả về mảng payload (mỗi phần ≤ 3500 ký tự):
 * phần đầu dùng reply/editReply, các phần sau dùng followUp / channel.send.
 * Header chỉ có ở tin đầu, footer chỉ có ở tin cuối.
 */
export function buildAiReply(answer: string, meta: AiReplyMeta): V2Payload[] {
  const parts = splitText(answer);
  const last = parts.length - 1;
  const title = `## 🤖 AI Chat${meta.askedBy ? `\n-# Trả lời ${meta.askedBy}` : ''}`;
  const footer = `-# 🤖 ${meta.model}${meta.style ? ` • ${meta.style}` : ''}`;

  return parts.map((part, i) => {
    const blocks: Block[] = [];
    if (i === 0) blocks.push(header(title, meta.avatarURL), divider());
    blocks.push(text(part));
    if (i === last) blocks.push(divider(), text(footer));
    return toPayload(blocks);
  });
}

/** Xem lịch sử hội thoại (/ai-memory view). */
export function buildMemoryView(conv: Conversation | undefined): V2Payload {
  if (!conv || conv.messages.length <= 1) {
    return toPayload([text('## 🧠 Bộ nhớ AI\nChưa có hội thoại nào trong kênh này.')], true);
  }

  const history = conv.messages
    .filter((m) => m.role !== 'system')
    .slice(-10)
    .map((m) => {
      const who = m.role === 'user' ? '👤' : '🤖';
      const body = m.content.length > 150 ? `${m.content.slice(0, 150)}…` : m.content;
      return `${who} ${body}`;
    })
    .join('\n');

  return toPayload(
    [
      text(`## 🧠 Bộ nhớ AI\n-# Model: ${conv.model} • ${conv.messages.length - 1} tin nhắn`),
      divider(),
      text(history),
      divider(),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('ai-memory-clear')
          .setLabel('Xóa bộ nhớ')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger)
      ),
    ],
    true
  );
}

/** Thống kê hội thoại. */
export function buildStatsView(stats: ConversationStats): V2Payload {
  return toPayload(
    [
      text('## 📊 Thống kê AI Chat'),
      divider(),
      text(
        [
          `**Tổng hội thoại:** ${stats.totalConversations}`,
          `**Đang hoạt động:** ${stats.activeConversations}`,
          `**Tổng tin nhắn:** ${stats.totalMessages}`,
        ].join('\n')
      ),
    ],
    true
  );
}

/** Thông báo đơn giản (lỗi, cảnh báo, gợi ý…). */
export function buildNotice(
  message: string,
  kind: 'info' | 'warn' | 'error' = 'info',
  ephemeral = true
): V2Payload {
  return toPayload([text(`${ICONS[kind]} ${message}`)], ephemeral);
}
