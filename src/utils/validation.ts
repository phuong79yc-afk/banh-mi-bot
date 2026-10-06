import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.body;
  if (!userId || !/^\d{17,19}$/.test(userId)) {
    return res.status(400).json({ success: false, error: 'Invalid userId' });
  }
  next();
}

export function validateAdminAuth(req: Request, res: Response, next: NextFunction) {
  const { adminPassword } = req.body;
  const validPassword = process.env.ADMIN_PASSWORD;
  
  if (!validPassword) {
    return res.status(500).json({ success: false, error: 'Admin auth not configured' });
  }
  
  // Use constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(adminPassword, validPassword)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  next();
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string | undefined, b: string): boolean {
  if (!a) return false;
  
  // Ensure both strings are the same length for comparison
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  // If lengths differ, compare against a dummy buffer to prevent timing leak
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufB, bufB); // Dummy comparison
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function sanitizeString(input: string, maxLength: number = 100): string {
  return input.trim().substring(0, maxLength).replace(/[<>]/g, '');
}

export function validateAmount(amount: any): { valid: boolean; value?: number; error?: string } {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    return { valid: false, error: 'Amount must be a number' };
  }
  
  const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  
  if (isNaN(num) || num < 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  
  if (num > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: 'Amount is too large' };
  }
  
  return { valid: true, value: num };
}
