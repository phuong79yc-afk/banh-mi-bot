// Localization system for Vietnamese + English
export type Locale = 'vi-VN' | 'en-US';

export interface LocaleData {
  common: {
    none: string;
    add: string;
    remove: string;
    enable: string;
    disable: string;
    saved: string;
    edited: string;
    updated: string;
    error: string;
    success: string;
    cancel: string;
  };
  errors: {
    no_permission: string;
    unknown_error: string;
    database_error: string;
    cooldown: string;
    invalid_input: string;
    not_found: string;
  };
}

const translations: Record<Locale, LocaleData> = {
  'vi-VN': {
    common: {
      none: 'Không có',
      add: 'Thêm',
      remove: 'Xóa',
      enable: 'Bật',
      disable: 'Tắt',
      saved: 'Đã lưu cấu hình!',
      edited: 'Đã chỉnh sửa cấu hình!',
      updated: 'Đã cập nhật cấu hình!',
      error: 'Lỗi',
      success: 'Thành công',
      cancel: 'Hủy'
    },
    errors: {
      no_permission: '❌ Bạn không có quyền sử dụng lệnh này!',
      unknown_error: '❌ Đã xảy ra lỗi không xác định, vui lòng thử lại sau...',
      database_error: '❌ Lỗi cơ sở dữ liệu, vui lòng thử lại sau...',
      cooldown: '⏰ Vui lòng đợi <t:{time}:R> trước khi sử dụng lệnh lại.',
      invalid_input: '❌ Dữ liệu nhập vào không hợp lệ!',
      not_found: '❌ Không tìm thấy dữ liệu!'
    }
  },
  'en-US': {
    common: {
      none: 'None',
      add: 'Add',
      remove: 'Remove',
      enable: 'Enable',
      disable: 'Disable',
      saved: 'Successfully saved configuration!',
      edited: 'Successfully edited configuration!',
      updated: 'Successfully updated configuration!',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel'
    },
    errors: {
      no_permission: '❌ You do not have permission to use this command!',
      unknown_error: '❌ An unknown error occurred, please try again later...',
      database_error: '❌ A database error occurred, please try again later...',
      cooldown: '⏰ Please wait <t:{time}:R> before using the command again.',
      invalid_input: '❌ Invalid input data!',
      not_found: '❌ Data not found!'
    }
  }
};

// Store user/guild locale preferences
const userLocales = new Map<string, Locale>();
const guildLocales = new Map<string, Locale>();

export function setUserLocale(userId: string, locale: Locale): void {
  userLocales.set(userId, locale);
}

export function setGuildLocale(guildId: string, locale: Locale): void {
  guildLocales.set(guildId, locale);
}

export function getUserLocale(userId: string): Locale | undefined {
  return userLocales.get(userId);
}

export function getGuildLocale(guildId: string): Locale | undefined {
  return guildLocales.get(guildId);
}

export function getLocale(userId?: string, guildId?: string, overrideGuild: boolean = false): Locale {
  // Priority: User preference (if override) > Guild preference > Default Vietnamese
  if (userId && overrideGuild) {
    const userLocale = userLocales.get(userId);
    if (userLocale) return userLocale;
  }
  
  if (guildId) {
    const guildLocale = guildLocales.get(guildId);
    if (guildLocale) return guildLocale;
  }
  
  if (userId && !overrideGuild) {
    const userLocale = userLocales.get(userId);
    if (userLocale) return userLocale;
  }
  
  return 'vi-VN'; // Default to Vietnamese
}

export function t(path: string, locale: Locale = 'vi-VN', replacements?: Record<string, string>): string {
  const keys = path.split('.');
  let value: any = translations[locale];
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return path; // Return path if not found
    }
  }
  
  if (typeof value !== 'string') return path;
  
  // Replace placeholders
  if (replacements) {
    for (const [key, replacement] of Object.entries(replacements)) {
      value = value.replace(`{${key}}`, replacement);
    }
  }
  
  return value;
}

// Auto-detect locale from Discord user
export function detectLocale(discordLocale?: string): Locale {
  if (discordLocale?.startsWith('vi')) return 'vi-VN';
  return 'en-US';
}
