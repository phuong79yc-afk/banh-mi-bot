// Quick Report System - Like Supporter
// Context menu report, whitelist/blacklist, manager roles, max concurrent reports

import fs from 'fs';
import path from 'path';

export type ReportStatus = 'pending' | 'approved' | 'declined';
export type SourceMode = 'serverwide' | 'whitelist' | 'blacklist';

export interface Report {
  id: string;
  guildId: string;
  reporterId: string;
  reportedId: string;
  messageId: string;
  channelId: string;
  messageContent: string;
  reason: string;
  status: ReportStatus;
  createdAt: number;
  updatedAt?: number;
  reviewerId?: string;
  reviewMessage?: string;
}

export interface QuickReportConfig {
  guildId: string;
  enabled: boolean;
  incomingChannelId?: string;
  managerRoleId?: string;
  bypassRoleIds: string[]; // Roles protected from reports
  blacklistRoleIds: string[]; // Roles that can't report
  muteRoleId?: string; // External mute role
  sourceMode: SourceMode;
  whitelistedChannelIds: string[];
  blacklistedChannelIds: string[];
  whitelistedCategoryIds: string[];
  blacklistedCategoryIds: string[];
  maxConcurrentPerUser: number;
  autoDeleteOnTimeout: boolean;
  autoDeleteOnMute: boolean;
  autoDeleteOnLeave: boolean;
  autoExpireHours?: number; // Auto-expire after X hours
  successMessage?: string;
}

class QuickReportManager {
  private configPath: string;
  private reportsPath: string;
  private configs: Map<string, QuickReportConfig>;
  private reports: Map<string, Report[]>; // guildId -> reports

  constructor() {
    this.configPath = path.join(process.cwd(), 'data', 'quickreport-config.json');
    this.reportsPath = path.join(process.cwd(), 'data', 'quickreport-reports.json');
    this.configs = new Map();
    this.reports = new Map();
    this.loadFromFiles();
  }

  private loadFromFiles(): void {
    try {
      const dataDir = path.dirname(this.configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load configs
      if (!fs.existsSync(this.configPath)) {
        fs.writeFileSync(this.configPath, JSON.stringify([], null, 2));
      } else {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) as QuickReportConfig[];
        for (const config of data) {
          this.configs.set(config.guildId, config);
        }
      }

      // Load reports
      if (!fs.existsSync(this.reportsPath)) {
        fs.writeFileSync(this.reportsPath, JSON.stringify([], null, 2));
      } else {
        const data = JSON.parse(fs.readFileSync(this.reportsPath, 'utf-8')) as { guildId: string; reports: Report[] }[];
        for (const guildData of data) {
          this.reports.set(guildData.guildId, guildData.reports);
        }
      }

      console.log(`✅ Loaded ${this.configs.size} quick report configs, ${this.reports.size} guild reports`);
    } catch (error) {
      console.error('❌ Error loading quick reports:', error);
    }
  }

  private saveConfigs(): void {
    try {
      const data = Array.from(this.configs.values());
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving quick report configs:', error);
    }
  }

  private saveReports(): void {
    try {
      const data: { guildId: string; reports: Report[] }[] = [];
      for (const [guildId, reports] of this.reports.entries()) {
        data.push({ guildId, reports });
      }
      fs.writeFileSync(this.reportsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving reports:', error);
    }
  }

  public enable(
    guildId: string,
    incomingChannelId: string,
    userId: string
  ): { success: boolean; message: string } {
    const existing = this.configs.get(guildId);
    if (existing && existing.enabled) {
      return {
        success: false,
        message: '❌ Quick Report đã được bật trong server này!'
      };
    }

    const config: QuickReportConfig = existing || {
      guildId,
      enabled: true,
      incomingChannelId,
      bypassRoleIds: [],
      blacklistRoleIds: [],
      sourceMode: 'serverwide',
      whitelistedChannelIds: [],
      blacklistedChannelIds: [],
      whitelistedCategoryIds: [],
      blacklistedCategoryIds: [],
      maxConcurrentPerUser: 3,
      autoDeleteOnTimeout: false,
      autoDeleteOnMute: false,
      autoDeleteOnLeave: false
    };

    config.enabled = true;
    config.incomingChannelId = incomingChannelId;

    this.configs.set(guildId, config);
    this.saveConfigs();

    return {
      success: true,
      message: `✅ Đã bật Quick Report! Reports sẽ được gửi đến <#${incomingChannelId}>`
    };
  }

  public disable(guildId: string): { success: boolean; message: string } {
    const config = this.configs.get(guildId);
    if (!config || !config.enabled) {
      return {
        success: false,
        message: '❌ Quick Report chưa được bật trong server này!'
      };
    }

    config.enabled = false;
    this.saveConfigs();

    return {
      success: true,
      message: '✅ Đã tắt Quick Report!'
    };
  }

  public getConfig(guildId: string): QuickReportConfig | null {
    return this.configs.get(guildId) || null;
  }

  public updateConfig(guildId: string, updates: Partial<QuickReportConfig>): void {
    const config = this.configs.get(guildId);
    if (config) {
      Object.assign(config, updates);
      this.saveConfigs();
    }
  }

  public createReport(
    guildId: string,
    reporterId: string,
    reportedId: string,
    messageId: string,
    channelId: string,
    messageContent: string,
    reason: string
  ): { success: boolean; message: string; report?: Report } {
    const config = this.getConfig(guildId);
    if (!config || !config.enabled) {
      return {
        success: false,
        message: '❌ Quick Report chưa được bật trong server này!'
      };
    }

    // Check max concurrent
    const userReports = this.getUserReports(guildId, reporterId).filter(r => r.status === 'pending');
    if (userReports.length >= config.maxConcurrentPerUser) {
      return {
        success: false,
        message: `❌ Bạn đã đạt giới hạn **${config.maxConcurrentPerUser}** reports đang chờ xử lý!`
      };
    }

    const report: Report = {
      id: `${guildId}-${Date.now()}`,
      guildId,
      reporterId,
      reportedId,
      messageId,
      channelId,
      messageContent,
      reason,
      status: 'pending',
      createdAt: Date.now()
    };

    const reports = this.reports.get(guildId) || [];
    reports.push(report);
    this.reports.set(guildId, reports);
    this.saveReports();

    return {
      success: true,
      message: config.successMessage || '✅ Đã gửi report thành công! Moderator sẽ xem xét trong giây lát.',
      report
    };
  }

  public updateReportStatus(
    reportId: string,
    status: ReportStatus,
    reviewerId: string,
    reviewMessage?: string
  ): { success: boolean; message: string; report?: Report } {
    for (const [guildId, reports] of this.reports.entries()) {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        if (report.status !== 'pending') {
          return {
            success: false,
            message: '❌ Report này đã được xử lý rồi, không thể thay đổi!'
          };
        }

        report.status = status;
        report.reviewerId = reviewerId;
        report.reviewMessage = reviewMessage;
        report.updatedAt = Date.now();

        this.saveReports();

        return {
          success: true,
          message: `✅ Đã ${status === 'approved' ? 'chấp nhận' : 'từ chối'} report!`,
          report
        };
      }
    }

    return {
      success: false,
      message: '❌ Không tìm thấy report với ID này!'
    };
  }

  public getReport(reportId: string): Report | null {
    for (const reports of this.reports.values()) {
      const report = reports.find(r => r.id === reportId);
      if (report) return report;
    }
    return null;
  }

  public getUserReports(guildId: string, userId: string): Report[] {
    const reports = this.reports.get(guildId) || [];
    return reports.filter(r => r.reporterId === userId);
  }

  public getRecentReports(
    guildId: string,
    filters?: {
      status?: ReportStatus;
      reporterId?: string;
      reportedId?: string;
      limit?: number;
    }
  ): Report[] {
    let reports = this.reports.get(guildId) || [];

    if (filters?.status) {
      reports = reports.filter(r => r.status === filters.status);
    }
    if (filters?.reporterId) {
      reports = reports.filter(r => r.reporterId === filters.reporterId);
    }
    if (filters?.reportedId) {
      reports = reports.filter(r => r.reportedId === filters.reportedId);
    }

    // Sort by creation date (newest first)
    reports.sort((a, b) => b.createdAt - a.createdAt);

    if (filters?.limit) {
      reports = reports.slice(0, filters.limit);
    }

    return reports;
  }

  public canReport(
    guildId: string,
    reporterId: string,
    reportedId: string,
    channelId: string,
    categoryId?: string,
    reporterRoles?: string[],
    reportedRoles?: string[]
  ): { canReport: boolean; reason?: string } {
    const config = this.getConfig(guildId);
    if (!config || !config.enabled) {
      return { canReport: false, reason: '❌ Quick Report chưa được bật!' };
    }

    // Check if reporter is blacklisted
    if (reporterRoles && config.blacklistRoleIds.some(roleId => reporterRoles.includes(roleId))) {
      return { canReport: false, reason: '❌ Bạn đã bị chặn không thể report!' };
    }

    // Check if reported user has bypass role
    if (reportedRoles && config.bypassRoleIds.some(roleId => reportedRoles.includes(roleId))) {
      return { canReport: false, reason: '❌ Không thể report user này!' };
    }

    // Check channel/category permissions based on source mode
    if (config.sourceMode === 'whitelist') {
      const channelAllowed = config.whitelistedChannelIds.includes(channelId);
      const categoryAllowed = categoryId ? config.whitelistedCategoryIds.includes(categoryId) : false;
      
      if (!channelAllowed && !categoryAllowed) {
        return { canReport: false, reason: '❌ Không thể report trong kênh này!' };
      }
    } else if (config.sourceMode === 'blacklist') {
      const channelBlocked = config.blacklistedChannelIds.includes(channelId);
      const categoryBlocked = categoryId ? config.blacklistedCategoryIds.includes(categoryId) : false;
      
      if (channelBlocked || categoryBlocked) {
        return { canReport: false, reason: '❌ Không thể report trong kênh này!' };
      }
    }

    return { canReport: true };
  }
}

export const quickReportManager = new QuickReportManager();
