/**
 * Rate Limiter - Giới hạn số lượng request trong một khoảng thời gian
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  /**
   * @param maxRequests - Số lượng request tối đa
   * @param windowMs - Khoảng thời gian (milliseconds)
   */
  constructor(maxRequests: number = 5, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // ⚡ Auto cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Kiểm tra xem user có vượt giới hạn không
   * @returns true nếu được phép, false nếu vượt giới hạn
   */
  check(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // Nếu chưa có entry hoặc đã hết thời gian
    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    // Nếu vượt giới hạn
    if (entry.count >= this.maxRequests) {
      return false;
    }

    // Tăng count
    entry.count++;
    return true;
  }

  /**
   * Lấy thời gian còn lại trước khi reset (seconds)
   */
  getTimeRemaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const remaining = Math.ceil((entry.resetTime - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  /**
   * Reset rate limit cho một key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Dọn dẹp các entry đã hết hạn
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Lấy số lượng requests còn lại
   */
  getRemaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Lấy thông tin chi tiết
   */
  getInfo(key: string): {
    remaining: number;
    limit: number;
    resetIn: number;
  } {
    return {
      remaining: this.getRemaining(key),
      limit: this.maxRequests,
      resetIn: this.getTimeRemaining(key)
    };
  }
}

// Export singleton instances với các giới hạn khác nhau
export const commandRateLimiter = new RateLimiter(5, 60000); // 5 commands/minute
export const aiChatRateLimiter = new RateLimiter(10, 60000); // 10 AI chats/minute
export const interactionRateLimiter = new RateLimiter(20, 60000); // 20 interactions/minute
