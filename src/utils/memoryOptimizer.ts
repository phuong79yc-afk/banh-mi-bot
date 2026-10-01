/**
 * Memory Optimizer - Tối ưu hóa bộ nhớ cho bot
 * Tự động dọn dẹp cache và unused data
 */

export class MemoryOptimizer {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryStats: { before: number; after: number; freed: number }[] = [];

  /**
   * Bắt đầu tự động dọn dẹp memory
   * @param intervalMinutes - Số phút giữa mỗi lần cleanup (mặc định: 30 phút)
   */
  startAutoCleanup(intervalMinutes: number = 30): void {
    if (this.cleanupInterval) {
      console.log('⚠️ Memory optimizer already running');
      return;
    }

    console.log(`🧹 Starting memory optimizer (interval: ${intervalMinutes}m)`);
    
    // Cleanup ngay lập tức
    this.cleanup();

    // Sau đó cleanup định kỳ
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Dừng auto cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Memory optimizer stopped');
    }
  }

  /**
   * Thực hiện cleanup ngay lập tức
   */
  cleanup(): void {
    const before = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // ⚡ Clear require cache của modules không còn dùng
    this.clearUnusedRequireCache();

    // ⚡ Force garbage collection nếu có thể
    if (global.gc) {
      global.gc();
    } else {
      console.log('⚠️ Garbage collection không khả dụng. Chạy với --expose-gc để bật');
    }

    const after = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const freed = before - after;

    this.memoryStats.push({ before, after, freed });

    // Giữ tối đa 20 stats gần nhất
    if (this.memoryStats.length > 20) {
      this.memoryStats.shift();
    }

    console.log(`🧹 Memory cleanup: ${before.toFixed(2)}MB → ${after.toFixed(2)}MB (freed: ${freed > 0 ? '+' : ''}${freed.toFixed(2)}MB)`);
  }

  /**
   * Clear require cache của các file không còn dùng
   */
  private clearUnusedRequireCache(): void {
    const cache = require.cache;
    let cleared = 0;

    // Xóa cache của các file tạm hoặc backup
    for (const key in cache) {
      if (
        key.includes('\\backups\\') ||
        key.includes('/backups/') ||
        key.includes('.bak') ||
        key.includes('.old') ||
        key.includes('.unused')
      ) {
        delete cache[key];
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`  ↳ Cleared ${cleared} unused require cache entries`);
    }
  }

  /**
   * Lấy thống kê memory
   */
  getStats(): {
    current: NodeJS.MemoryUsage;
    history: { before: number; after: number; freed: number }[];
  } {
    return {
      current: process.memoryUsage(),
      history: this.memoryStats,
    };
  }

  /**
   * In báo cáo memory chi tiết
   */
  printReport(): void {
    const mem = process.memoryUsage();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MEMORY REPORT');
    console.log('='.repeat(60));
    console.log(`Heap Used:     ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Total:    ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`RSS:           ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External:      ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
    
    if (this.memoryStats.length > 0) {
      const totalFreed = this.memoryStats.reduce((sum, stat) => sum + stat.freed, 0);
      const avgFreed = totalFreed / this.memoryStats.length;
      console.log(`\nCleanup History: ${this.memoryStats.length} runs`);
      console.log(`Total Freed:     ${totalFreed.toFixed(2)} MB`);
      console.log(`Average Freed:   ${avgFreed.toFixed(2)} MB per cleanup`);
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Export singleton instance
export const memoryOptimizer = new MemoryOptimizer();
