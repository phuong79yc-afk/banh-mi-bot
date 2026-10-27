import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDir = join(projectRoot, 'assets', 'emojis', 'tiktok');
const size = 128;
const colors = {
  cyan: '#FFFFFF',
  pink: '#D9DDE7',
  white: '#FFFFFF',
};

function createIcon(draw) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');
  const background = context.createRadialGradient(48, 38, 6, 64, 64, 62);
  background.addColorStop(0, '#303342');
  background.addColorStop(1, '#101116');
  context.fillStyle = background;
  context.beginPath();
  context.arc(64, 64, 60, 0, Math.PI * 2);
  context.fill();

  const ring = context.createLinearGradient(12, 14, 116, 114);
  ring.addColorStop(0, colors.white);
  ring.addColorStop(0.52, colors.pink);
  ring.addColorStop(1, colors.white);
  context.strokeStyle = ring;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(64, 64, 58, 0, Math.PI * 2);
  context.stroke();

  context.lineCap = 'round';
  context.lineJoin = 'round';
  draw(context);
  return canvas;
}

function drawNote(context) {
  const note = (color, offset) => {
    context.save();
    context.translate(offset, 0);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 11;
    context.beginPath();
    context.moveTo(72, 81);
    context.lineTo(72, 36);
    context.quadraticCurveTo(89, 39, 101, 48);
    context.stroke();
    context.beginPath();
    context.ellipse(57, 91, 13, 9, -0.22, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  note(colors.cyan, -3);
  note(colors.pink, 3);
  note(colors.white, 0);
}

function drawVideo(context) {
  context.shadowColor = colors.cyan;
  context.shadowBlur = 12;
  context.fillStyle = colors.cyan;
  context.beginPath();
  context.roundRect(27, 35, 74, 58, 16);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = '#171920';
  context.beginPath();
  context.roundRect(32, 40, 64, 48, 12);
  context.fill();
  context.fillStyle = colors.white;
  context.beginPath();
  context.moveTo(57, 49);
  context.lineTo(79, 64);
  context.lineTo(57, 79);
  context.closePath();
  context.fill();
  context.fillStyle = colors.pink;
  context.beginPath();
  context.arc(89, 43, 5, 0, Math.PI * 2);
  context.fill();
}

function drawPhoto(context) {
  context.strokeStyle = colors.cyan;
  context.lineWidth = 7;
  context.beginPath();
  context.roundRect(30, 30, 68, 68, 13);
  context.stroke();
  context.fillStyle = colors.pink;
  context.beginPath();
  context.arc(80, 48, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = colors.white;
  context.beginPath();
  context.moveTo(38, 88);
  context.lineTo(56, 65);
  context.lineTo(68, 77);
  context.lineTo(78, 64);
  context.lineTo(92, 83);
  context.lineTo(92, 89);
  context.closePath();
  context.fill();
}

function drawHeart(context) {
  context.save();
  context.translate(-3, 0);
  context.fillStyle = colors.cyan;
  context.beginPath();
  context.moveTo(64, 97);
  context.bezierCurveTo(52, 86, 34, 72, 34, 55);
  context.bezierCurveTo(34, 37, 56, 33, 64, 49);
  context.bezierCurveTo(74, 32, 96, 38, 96, 55);
  context.bezierCurveTo(96, 72, 77, 88, 64, 97);
  context.fill();
  context.restore();

  context.save();
  context.translate(3, 0);
  context.fillStyle = colors.pink;
  context.beginPath();
  context.moveTo(64, 97);
  context.bezierCurveTo(52, 86, 34, 72, 34, 55);
  context.bezierCurveTo(34, 37, 56, 33, 64, 49);
  context.bezierCurveTo(74, 32, 96, 38, 96, 55);
  context.bezierCurveTo(96, 72, 77, 88, 64, 97);
  context.fill();
  context.restore();

  context.fillStyle = colors.white;
  context.beginPath();
  context.moveTo(64, 91);
  context.bezierCurveTo(53, 81, 40, 69, 40, 55);
  context.bezierCurveTo(40, 43, 55, 40, 64, 55);
  context.bezierCurveTo(73, 40, 88, 43, 88, 55);
  context.bezierCurveTo(88, 69, 75, 81, 64, 91);
  context.fill();
}

function drawShare(context) {
  context.strokeStyle = colors.cyan;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(39, 82);
  context.bezierCurveTo(39, 56, 57, 48, 83, 48);
  context.stroke();
  context.fillStyle = colors.pink;
  context.beginPath();
  context.moveTo(73, 31);
  context.lineTo(98, 48);
  context.lineTo(73, 65);
  context.closePath();
  context.fill();
  context.strokeStyle = colors.white;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(39, 83);
  context.bezierCurveTo(39, 58, 56, 51, 79, 51);
  context.stroke();
  context.fillStyle = colors.white;
  context.beginPath();
  context.moveTo(75, 37);
  context.lineTo(91, 48);
  context.lineTo(75, 59);
  context.closePath();
  context.fill();
}

function drawComment(context) {
  context.fillStyle = colors.white;
  context.beginPath();
  context.roundRect(27, 31, 74, 56, 16);
  context.fill();
  context.beginPath();
  context.moveTo(42, 82);
  context.lineTo(34, 101);
  context.lineTo(59, 84);
  context.closePath();
  context.fill();

  context.fillStyle = '#171920';
  for (const x of [47, 64, 81]) {
    context.beginPath();
    context.arc(x, 59, 4, 0, Math.PI * 2);
    context.fill();
  }
}

const icons = [
  ['tt_music', drawNote],
  ['tt_video', drawVideo],
  ['tt_photo', drawPhoto],
  ['tt_like', drawHeart],
  ['tt_share', drawShare],
  ['tt_comment', drawComment],
];

mkdirSync(outputDir, { recursive: true });
for (const [name, draw] of icons) {
  const canvas = createIcon(draw);
  writeFileSync(join(outputDir, `${name}.png`), canvas.toBuffer('image/png'));
}

console.log(`Generated ${icons.length} TikTok emoji PNGs in ${outputDir}`);