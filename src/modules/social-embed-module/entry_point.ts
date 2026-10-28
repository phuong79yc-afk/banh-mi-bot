import { Client, Message } from 'discord.js';

interface SocialEmbedPlatform {
  name: string;
  hosts: string[];
  rewrite: (url: URL) => string;
}

const PLATFORMS: SocialEmbedPlatform[] = [
  {
    name: 'Instagram',
    hosts: ['instagram.com', 'www.instagram.com'],
    rewrite: (url) => `https://ddinstagram.com${url.pathname}${url.search}`,
  },
  {
    name: 'Twitter / X',
    hosts: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com', 'mobile.twitter.com'],
    rewrite: (url) => `https://fxtwitter.com${url.pathname}${url.search}`,
  },
  {
    name: 'Reddit',
    hosts: ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'redd.it'],
    rewrite: (url) => {
      if (url.hostname === 'redd.it') return `https://rxddit.com${url.pathname}${url.search}`;
      return `https://rxddit.com${url.pathname}${url.search}`;
    },
  },
  {
    name: 'Threads',
    hosts: ['threads.net', 'www.threads.net', 'threads.com', 'www.threads.com'],
    rewrite: (url) => `https://vxthreads.net${url.pathname}${url.search}`,
  },
  {
    name: 'Facebook',
    hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'],
    rewrite: (url) => url.toString(),
  },
];

const SOCIAL_URL_REGEX = /https?:\/\/[^\s<>()]+/gi;
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com']);

export class SocialEmbedModule {
  private readonly client: Client;
  private messageHandler: ((message: Message) => Promise<void>) | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  async initialize(): Promise<void> {
    this.messageHandler = async (message: Message) => {
      if (message.author.bot || !message.guild || message.webhookId) return;

      const matches = Array.from(message.content.matchAll(SOCIAL_URL_REGEX), (match) => match[0])
        .map((link) => link.replace(/[.,!?;:'\]}>]+$/g, ''));

      if (matches.length === 0) return;

      const rewritten: string[] = [];
      const seen = new Set<string>();

      for (const rawLink of matches.slice(0, 4)) {
        let url: URL;
        try {
          url = new URL(rawLink);
        } catch {
          continue;
        }

        const hostname = url.hostname.toLowerCase();
        if (TIKTOK_HOSTS.has(hostname) || hostname.endsWith('.tiktok.com')) continue;

        const platform = PLATFORMS.find((item) => item.hosts.includes(hostname));
        if (!platform || seen.has(rawLink)) continue;

        seen.add(rawLink);
        rewritten.push(`${platform.name}: ${platform.rewrite(url)}`);
      }

      if (rewritten.length === 0) return;

      await message.suppressEmbeds(true).catch(() => {});
      if (!('send' in message.channel)) return;
      await message.channel.send({
        content: rewritten.join('\n'),
        allowedMentions: { repliedUser: false, parse: [] },
      });
    };

    this.client.on('messageCreate', this.messageHandler);
    console.log('✅ Social Embed Module loaded');
  }

  async cleanup(): Promise<void> {
    if (this.messageHandler) {
      this.client.off('messageCreate', this.messageHandler);
      this.messageHandler = null;
    }
  }
}

export default function createModule(client: Client): SocialEmbedModule {
  return new SocialEmbedModule(client);
}
