// Quick Report Manager - Handle message reports with UUID
import { loadJsonDb, saveJsonDb } from '../../utils/jsonDb';
import path from 'path';
import { randomUUID } from 'crypto';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'quickreport-config.json');
const REPORTS_PATH = path.join(process.cwd(), 'data', 'quickreport-reports.json');

export interface ReportConfig {
  guildId: string;
  enabled: boolean;
  reportChannelId: string | null;
  managerRoleIds: string[];
  blacklistedChannelIds: string[];
  blacklistedCategoryIds: string[];
  whitelistedChannelIds: string[];
  whitelistedCategoryIds: string[];
}

export interface Report {
  id: string; // UUID
  guildId: string;
  messageId: string;
  messageContent: string;
  messageAuthorId: string;
  messageAuthorUsername: string;
  messageChannelId: string;
  messageUrl: string;
  messageTimestamp: number;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  status: 'pending' | 'resolved' | 'closed';
  createdAt: number;
  updatedAt: number;
  updatedBy: string | null;
  embeds?: any[]; // Store embeds for context
}

export interface ConfigData {
  [guildId: string]: ReportConfig;
}

export interface ReportsData {
  [reportId: string]: Report;
}

class QuickReportManager {
  private configs: ConfigData = {};
  private reports: ReportsData = {};

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.configs = loadJsonDb(CONFIG_PATH);
      this.reports = loadJsonDb(REPORTS_PATH);
      console.log(`✅ Loaded ${Object.keys(this.configs).length} report configs, ${Object.keys(this.reports).length} reports`);
    } catch (error) {
      console.error('Error loading report data:', error);
      this.configs = {};
      this.reports = {};
    }
  }

  private saveConfigs() {
    try {
      saveJsonDb(CONFIG_PATH, this.configs);
    } catch (error) {
      console.error('Error saving report configs:', error);
    }
  }

  private saveReports() {
    try {
      saveJsonDb(REPORTS_PATH, this.reports);
    } catch (error) {
      console.error('Error saving reports:', error);
    }
  }

  // Get or create config
  getConfig(guildId: string): ReportConfig {
    if (!this.configs[guildId]) {
      this.configs[guildId] = {
        guildId,
        enabled: false,
        reportChannelId: null,
        managerRoleIds: [],
        blacklistedChannelIds: [],
        blacklistedCategoryIds: [],
        whitelistedChannelIds: [],
        whitelistedCategoryIds: []
      };
      this.saveConfigs();
    }
    return this.configs[guildId];
  }

  // Update config
  updateConfig(guildId: string, updates: Partial<ReportConfig>) {
    const config = this.getConfig(guildId);
    Object.assign(config, updates);
    this.saveConfigs();
  }

  // Check if channel is allowed for reports
  isChannelAllowed(guildId: string, channelId: string, categoryId: string | null): boolean {
    const config = this.getConfig(guildId);

    // Check whitelist first (if exists)
    if (config.whitelistedChannelIds.length > 0 || config.whitelistedCategoryIds.length > 0) {
      const channelWhitelisted = config.whitelistedChannelIds.includes(channelId);
      const categoryWhitelisted = categoryId && config.whitelistedCategoryIds.includes(categoryId);
      return channelWhitelisted || !!categoryWhitelisted;
    }

    // Check blacklist
    const channelBlacklisted = config.blacklistedChannelIds.includes(channelId);
    const categoryBlacklisted = categoryId && config.blacklistedCategoryIds.includes(categoryId);
    
    return !channelBlacklisted && !categoryBlacklisted;
  }

  // Create report
  createReport(
    guildId: string,
    messageId: string,
    messageContent: string,
    messageAuthorId: string,
    messageAuthorUsername: string,
    messageChannelId: string,
    messageUrl: string,
    messageTimestamp: number,
    reporterId: string,
    reporterUsername: string,
    reason: string,
    embeds?: any[]
  ): Report {
    const id = randomUUID();
    const report: Report = {
      id,
      guildId,
      messageId,
      messageContent,
      messageAuthorId,
      messageAuthorUsername,
      messageChannelId,
      messageUrl,
      messageTimestamp,
      reporterId,
      reporterUsername,
      reason,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: null,
      embeds
    };

    this.reports[id] = report;
    this.saveReports();

    return report;
  }

  // Update report status
  updateReport(reportId: string, status: 'pending' | 'resolved' | 'closed', updatedBy: string): Report | null {
    const report = this.reports[reportId];
    if (!report) return null;

    report.status = status;
    report.updatedAt = Date.now();
    report.updatedBy = updatedBy;

    this.saveReports();
    return report;
  }

  // Get report by ID
  getReport(reportId: string): Report | null {
    return this.reports[reportId] || null;
  }

  // Get recent reports for guild
  getRecentReports(guildId: string, limit: number = 10): Report[] {
    return Object.values(this.reports)
      .filter(r => r.guildId === guildId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // Get reports by status
  getReportsByStatus(guildId: string, status: 'pending' | 'resolved' | 'closed'): Report[] {
    return Object.values(this.reports)
      .filter(r => r.guildId === guildId && r.status === status)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Delete reports by user (when they leave/kicked/banned)
  deleteReportsByUser(guildId: string, userId: string): number {
    let deleted = 0;
    
    for (const reportId in this.reports) {
      const report = this.reports[reportId];
      if (report.guildId === guildId && report.messageAuthorId === userId) {
        delete this.reports[reportId];
        deleted++;
      }
    }

    if (deleted > 0) {
      this.saveReports();
    }

    return deleted;
  }

  // Get statistics
  getStats(guildId: string): {
    total: number;
    pending: number;
    resolved: number;
    closed: number;
  } {
    const guildReports = Object.values(this.reports).filter(r => r.guildId === guildId);
    
    return {
      total: guildReports.length,
      pending: guildReports.filter(r => r.status === 'pending').length,
      resolved: guildReports.filter(r => r.status === 'resolved').length,
      closed: guildReports.filter(r => r.status === 'closed').length
    };
  }

  // Check if user is manager
  isManager(guildId: string, roleIds: string[]): boolean {
    const config = this.getConfig(guildId);
    return config.managerRoleIds.some(roleId => roleIds.includes(roleId));
  }
}

export const reportManager = new QuickReportManager();
