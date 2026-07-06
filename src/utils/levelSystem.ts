import { Collection } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import { drawSVGIcon, preloadIcons } from './svgIcons';

interface UserLevel {
  userId: string;
  xp: number;
  level: number;
  totalXp: number;
  messageCount: number;
}

const levels = new Collection<string, UserLevel>();

// XP cần để lên level (công thức: level^2 * 100)
export function getXPForLevel(level: number): number {
  return level * level * 100;
}

// Tính level từ total XP
function calculateLevel(totalXp: number): number {
  let level = 0;
  let xpNeeded = 0;
  
  while (totalXp >= xpNeeded) {
    level++;
    xpNeeded += getXPForLevel(level);
  }
  
  return level;
}

// Lấy thông tin user
export function getUserLevel(userId: string): UserLevel {
  let user = levels.get(userId);
  if (!user) {
    user = {
      userId,
      xp: 0,
      level: 1,
      totalXp: 0,
      messageCount: 0
    };
    levels.set(userId, user);
  }
  return user;
}

// Thêm XP cho user
export function addXP(userId: string, amount: number): { leveledUp: boolean; oldLevel: number; newLevel: number; user: UserLevel } {
  const user = getUserLevel(userId);
  const oldLevel = user.level;
  
  user.xp += amount;
  user.totalXp += amount;
  user.messageCount++;
  
  // Kiểm tra level up
  const xpNeeded = getXPForLevel(user.level);
  let leveledUp = false;
  
  if (user.xp >= xpNeeded) {
    user.level++;
    user.xp -= xpNeeded;
    leveledUp = true;
  }
  
  levels.set(userId, user);
  
  return {
    leveledUp,
    oldLevel,
    newLevel: user.level,
    user
  };
}

// Lấy leaderboard
export function getLevelLeaderboard(limit: number = 10): UserLevel[] {
  return Array.from(levels.values())
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit);
}

// Tạo ảnh level up
export async function createLevelUpImage(
  username: string,
  avatarURL: string,
  level: number,
  xp: number,
  xpNeeded: number
): Promise<AttachmentBuilder> {
  const canvas = createCanvas(900, 350);
  const ctx = canvas.getContext('2d');

  // Background - Multi gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 900, 350);
  bgGradient.addColorStop(0, '#667eea');
  bgGradient.addColorStop(0.5, '#764ba2');
  bgGradient.addColorStop(1, '#f093fb');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 900, 350);

  // Overlay pattern - Diagonal lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  for (let i = -350; i < 900; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 350, 350);
    ctx.stroke();
  }

  // Decorative circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(750, 50, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(850, 300, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(50, 300, 60, 0, Math.PI * 2);
  ctx.fill();

  // Main content box with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(40, 40, 820, 270);
  ctx.shadowBlur = 0;

  // Avatar with glow effect
  try {
    const avatar = await loadImage(avatarURL);
    
    // Glow
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(140, 175, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 175, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 65, 100, 150, 150);
    ctx.restore();

    // Avatar border - gradient
    const avatarBorder = ctx.createLinearGradient(65, 100, 215, 250);
    avatarBorder.addColorStop(0, '#FFD700');
    avatarBorder.addColorStop(0.5, '#FFA500');
    avatarBorder.addColorStop(1, '#FFD700');
    ctx.strokeStyle = avatarBorder;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(140, 175, 75, 0, Math.PI * 2);
    ctx.stroke();
  } catch (error) {
    console.error('Lỗi load avatar:', error);
  }

  // Level badge
  const badgeGradient = ctx.createLinearGradient(180, 100, 280, 150);
  badgeGradient.addColorStop(0, '#FFD700');
  badgeGradient.addColorStop(1, '#FFA500');
  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.arc(200, 120, 35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(200, 120, 35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(level.toString(), 200, 130);

  // Username with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(username, 260, 130);
  ctx.shadowBlur = 0;

  // "LEVEL UP!" text with animation effect and SVG icons
  ctx.font = 'bold 36px Arial';
  const levelUpGradient = ctx.createLinearGradient(260, 160, 500, 180);
  levelUpGradient.addColorStop(0, '#FFD700');
  levelUpGradient.addColorStop(0.5, '#FFA500');
  levelUpGradient.addColorStop(1, '#FFD700');
  ctx.fillStyle = levelUpGradient;
  
  // Draw trophy icons on both sides
  await drawSVGIcon(ctx, 'trophy', 220, 150, 35);
  ctx.fillText('LEVEL UP!', 270, 180);
  await drawSVGIcon(ctx, 'trophy', 480, 150, 35);

  // XP bar container with border
  const barX = 260;
  const barY = 210;
  const barWidth = 580;
  const barHeight = 40;

  // Bar shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.shadowBlur = 0;

  // Bar border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // XP bar fill with gradient
  const progress = xp / xpNeeded;
  const fillWidth = barWidth * progress;

  const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  barGradient.addColorStop(0, '#57F287');
  barGradient.addColorStop(0.5, '#5865F2');
  barGradient.addColorStop(1, '#FFD700');
  ctx.fillStyle = barGradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // Shine effect on bar
  const shineGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shineGradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight / 2);

  // XP text on bar
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText(`${xp} / ${xpNeeded} XP`, barX + barWidth / 2, barY + 27);
  ctx.shadowBlur = 0;

  // Progress percentage
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${(progress * 100).toFixed(1)}%`, barX + barWidth - 10, barY + barHeight + 25);

  // Decorative SVG icons
  await drawSVGIcon(ctx, 'star', 55, 55, 40);
  await drawSVGIcon(ctx, 'star', 805, 295, 40);
  await drawSVGIcon(ctx, 'sparkle', 835, 75, 40);
  await drawSVGIcon(ctx, 'sparkle', 85, 295, 40);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'levelup.png' });
}

// Tạo rank card
export async function createRankCard(
  username: string,
  avatarURL: string,
  level: number,
  xp: number,
  xpNeeded: number,
  rank: number,
  totalXp: number
): Promise<AttachmentBuilder> {
  const canvas = createCanvas(1000, 350);
  const ctx = canvas.getContext('2d');

  // Background - Dark gradient with pattern
  const bgGradient = ctx.createLinearGradient(0, 0, 1000, 350);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(0.5, '#16213e');
  bgGradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1000, 350);

  // Hexagon pattern
  ctx.strokeStyle = 'rgba(88, 101, 242, 0.1)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 1000; x += 60) {
    for (let y = 0; y < 350; y += 52) {
      const offsetX = (y / 52) % 2 === 0 ? 0 : 30;
      drawHexagon(ctx, x + offsetX, y, 25);
    }
  }

  // Accent bar on left
  const accentGradient = ctx.createLinearGradient(0, 0, 10, 350);
  accentGradient.addColorStop(0, '#5865F2');
  accentGradient.addColorStop(0.5, '#57F287');
  accentGradient.addColorStop(1, '#FFD700');
  ctx.fillStyle = accentGradient;
  ctx.fillRect(0, 0, 10, 350);

  // Main content box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(30, 30, 940, 290);

  // Avatar with glow
  try {
    const avatar = await loadImage(avatarURL);
    
    // Glow effect
    ctx.shadowColor = '#5865F2';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.arc(140, 175, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 175, 70, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 70, 105, 140, 140);
    ctx.restore();

    // Avatar border - animated gradient
    const avatarBorder = ctx.createLinearGradient(70, 105, 210, 245);
    avatarBorder.addColorStop(0, '#5865F2');
    avatarBorder.addColorStop(0.5, '#57F287');
    avatarBorder.addColorStop(1, '#FFD700');
    ctx.strokeStyle = avatarBorder;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(140, 175, 70, 0, Math.PI * 2);
    ctx.stroke();
  } catch (error) {
    console.error('Lỗi load avatar:', error);
  }

  // Rank badge - hexagon shape
  ctx.save();
  ctx.translate(190, 110);
  
  // Badge background
  const badgeGradient = ctx.createLinearGradient(-30, -30, 30, 30);
  badgeGradient.addColorStop(0, '#FFD700');
  badgeGradient.addColorStop(1, '#FFA500');
  ctx.fillStyle = badgeGradient;
  drawHexagon(ctx, 0, 0, 30);
  ctx.fill();
  
  // Badge border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  drawHexagon(ctx, 0, 0, 30);
  ctx.stroke();
  
  // Rank number
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank}`, 0, 0);
  
  ctx.restore();

  // Username with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(username, 250, 110);
  ctx.shadowBlur = 0;

  // Level badge
  const levelBadgeGradient = ctx.createLinearGradient(250, 130, 350, 160);
  levelBadgeGradient.addColorStop(0, '#5865F2');
  levelBadgeGradient.addColorStop(1, '#57F287');
  ctx.fillStyle = levelBadgeGradient;
  ctx.fillRect(250, 130, 100, 35);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`Level ${level}`, 260, 153);

  // Stats
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '18px Arial';
  ctx.fillText(`Total XP: ${totalXp.toLocaleString()}`, 370, 153);

  // XP bar container
  const barX = 250;
  const barY = 190;
  const barWidth = 700;
  const barHeight = 45;

  // Bar shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.shadowBlur = 0;

  // Bar border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // XP bar fill
  const progress = Math.min(xp / xpNeeded, 1);
  const fillWidth = barWidth * progress;

  const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  barGradient.addColorStop(0, '#5865F2');
  barGradient.addColorStop(0.5, '#57F287');
  barGradient.addColorStop(1, '#FFD700');
  ctx.fillStyle = barGradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // Shine effect
  const shineGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight / 2);
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shineGradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight / 2);

  // XP text on bar
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText(`${xp} / ${xpNeeded} XP`, barX + barWidth / 2, barY + 28);
  ctx.shadowBlur = 0;

  // Progress info
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Progress: ${(progress * 100).toFixed(1)}%`, barX, barY + barHeight + 30);
  
  ctx.textAlign = 'right';
  ctx.fillText(`Next Level: ${xpNeeded - xp} XP`, barX + barWidth, barY + barHeight + 30);

  // Decorative elements
  ctx.fillStyle = 'rgba(88, 101, 242, 0.3)';
  ctx.beginPath();
  ctx.arc(950, 50, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(950, 300, 35, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'rank.png' });
}

// Helper function to draw hexagon
function drawHexagon(ctx: any, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

