import { Client, GuildMember, EmbedBuilder, TextChannel, Guild } from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RaidConfig {
  enabled: boolean;
  channel_id: string;
  threshold: number; // Số user join trong khoảng thời gian
  timeWindow: number; // Thời gian tính bằng ms (mặc định 10s)
  action: 'kick' | 'ban'; // Hành động với raiders
  minAccountAge: number; // Tuổi tài khoản tối thiểu (ngày), 0 = không giới hạn
  whitelistedRoles: string[]; // Roles được bỏ qua
  whitelistedUsers: string[]; // Users được bỏ qua
}

interface JoinRecord {
  userId: string;
  timestamp: number;
}

class AntiRaidSystem {
  private config: RaidConfig;
  private configPath: string;
  private joinRecords: JoinRecord[] = [];
  private isRaidMode: boolean = false;

  constructor() {
    this.configPath = join(process.cwd(), 'raid-config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): RaidConfig {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Lỗi load raid config:', error);
    }

    // Default config
    return {
      enabled: false,
      channel_id: '',
      threshold: 5, // 5 users
      timeWindow: 10000, // 10 seconds
      action: 'kick',
      minAccountAge: 0, // Không giới hạn
      whitelistedRoles: [],
      whitelistedUsers: []
    };
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Lỗi save raid config:', error);
    }
  }

  public getConfig(): RaidConfig {
    return { ...this.config };
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  public setLogChannel(channelId: string): void {
    this.config.channel_id = channelId;
    this.saveConfig();
  }

  public setThreshold(threshold: number): void {
    this.config.threshold = threshold;
    this.saveConfig();
  }

  public setTimeWindow(seconds: number): void {
    this.config.timeWindow = seconds * 1000;
    this.saveConfig();
  }

  public setAction(action: 'kick' | 'ban'): void {
    this.config.action = action;
    this.saveConfig();
  }

  public setMinAccountAge(days: number): void {
    this.config.minAccountAge = days;
    this.saveConfig();
  }

  public addWhitelistedRole(roleId: string): void {
    if (!this.config.whitelistedRoles.includes(roleId)) {
      this.config.whitelistedRoles.push(roleId);
      this.saveConfig();
    }
  }

  public removeWhitelistedRole(roleId: string): void {
    this.config.whitelistedRoles = this.config.whitelistedRoles.filter(id => id !== roleId);
    this.saveConfig();
  }

  public addWhitelistedUser(userId: string): void {
    if (!this.config.whitelistedUsers.includes(userId)) {
      this.config.whitelistedUsers.push(userId);
      this.saveConfig();
    }
  }

  public removeWhitelistedUser(userId: string): void {
    this.config.whitelistedUsers = this.config.whitelistedUsers.filter(id => id !== userId);
    this.saveConfig();
  }

  private isWhitelisted(member: GuildMember): boolean {
    // Check user whitelist
    if (this.config.whitelistedUsers.includes(member.id)) {
      return true;
    }

    // Check role whitelist
    const hasWhitelistedRole = member.roles.cache.some(role => 
      this.config.whitelistedRoles.includes(role.id)
    );

    return hasWhitelistedRole;
  }

  private isAccountTooNew(member: GuildMember): boolean {
    if (this.config.minAccountAge === 0) return false;

    const accountAge = Date.now() - member.user.createdTimestamp;
    const minAge = this.config.minAccountAge * 24 * 60 * 60 * 1000; // Convert days to ms

    return accountAge < minAge;
  }

  public async handleMemberJoin(member: GuildMember, client: Client): Promise<void> {
    if (!this.config.enabled) return;

    const now = Date.now();
    
    // Thêm record mới
    this.joinRecords.push({
      userId: member.id,
      timestamp: now
    });

    // Xóa records cũ (ngoài time window)
    this.joinRecords = this.joinRecords.filter(
      record => now - record.timestamp < this.config.timeWindow
    );

    // Kiểm tra raid
    if (this.joinRecords.length >= this.config.threshold) {
      if (!this.isRaidMode) {
        this.isRaidMode = true;
        await this.activateRaidMode(member.guild, client);
      }

      // Xử lý raider
      await this.handleRaider(member, client);
    }
  }

  private async activateRaidMode(guild: Guild, client: Client): Promise<void> {
    console.log(`🚨 RAID DETECTED in ${guild.name}!`);

    // Gửi thông báo vào log channel
    if (this.config.channel_id) {
      try {
        const channel = await client.channels.fetch(this.config.channel_id) as TextChannel;
        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle('🚨 RAID DETECTED!')
            .setDescription(`Phát hiện raid attack tại server **${guild.name}**`)
            .addFields(
              { name: '⚠️ Trạng thái', value: 'Raid Mode ACTIVATED', inline: true },
              { name: '👥 Threshold', value: `${this.config.threshold} users`, inline: true },
              { name: '⏱️ Time Window', value: `${this.config.timeWindow / 1000}s`, inline: true },
              { name: '🔨 Action', value: this.config.action.toUpperCase(), inline: true }
            )
            .setColor(0xFF0000)
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('❌ Không thể gửi raid alert:', error);
      }
    }

    // Tự động tắt raid mode sau 5 phút
    setTimeout(() => {
      this.isRaidMode = false;
      this.joinRecords = [];
      console.log('✅ Raid mode deactivated');
      this.sendRaidEndNotification(guild, client);
    }, 5 * 60 * 1000);
  }

  private async sendRaidEndNotification(guild: Guild, client: Client): Promise<void> {
    if (this.config.channel_id) {
      try {
        const channel = await client.channels.fetch(this.config.channel_id) as TextChannel;
        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle('✅ Raid Mode Deactivated')
            .setDescription(`Raid mode đã tự động tắt tại **${guild.name}**`)
            .setColor(0x00FF00)
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('❌ Không thể gửi raid end notification:', error);
      }
    }
  }

  private async handleRaider(member: GuildMember, client: Client): Promise<void> {
    try {
      // Check whitelist
      if (this.isWhitelisted(member)) {
        console.log(`✅ Skipped whitelisted user: ${member.user.tag}`);
        return;
      }

      // Check account age
      const accountTooNew = this.isAccountTooNew(member);
      const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
      
      const action = this.config.action;
      
      if (action === 'kick') {
        await member.kick(`Anti-Raid: Suspected raider${accountTooNew ? ' (Account too new)' : ''}`);
        console.log(`👢 Kicked raider: ${member.user.tag}`);
      } else if (action === 'ban') {
        await member.ban({ reason: `Anti-Raid: Suspected raider${accountTooNew ? ' (Account too new)' : ''}` });
        console.log(`🔨 Banned raider: ${member.user.tag}`);
      }

      // Log vào channel
      if (this.config.channel_id) {
        try {
          const channel = await client.channels.fetch(this.config.channel_id) as TextChannel;
          if (channel) {
            const embed = new EmbedBuilder()
              .setTitle(`🔨 Raider ${action === 'kick' ? 'Kicked' : 'Banned'}`)
              .setDescription(`**${member.user.tag}** (${member.id})`)
              .addFields(
                { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R> (${accountAge} ngày)`, inline: true },
                { name: '🔨 Action', value: action.toUpperCase(), inline: true },
                { name: '⚠️ Reason', value: accountTooNew ? 'Account quá mới' : 'Raid detected', inline: true }
              )
              .setColor(accountTooNew ? 0xFF6B6B : 0xFF4444)
              .setThumbnail(member.user.displayAvatarURL())
              .setTimestamp();

            await channel.send({ embeds: [embed] });
          }
        } catch (error) {
          console.error('❌ Không thể log raider:', error);
        }
      }
    } catch (error) {
      console.error(`❌ Không thể ${this.config.action} raider:`, error);
    }
  }

  public isInRaidMode(): boolean {
    return this.isRaidMode;
  }

  public getJoinCount(): number {
    return this.joinRecords.length;
  }
}

// Export singleton instance
export const antiRaidSystem = new AntiRaidSystem();
