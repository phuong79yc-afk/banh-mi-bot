import { createCanvas } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import fs from 'fs';
import path from 'path';

/**
 * Create animated control button emojis (GIF)
 */

const OUTPUT_DIR = 'control-emojis-animated';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Creating animated control button emojis...\n');

// Pause button - sleeping cat
async function createPauseButton() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const encoder = new GIFEncoder(128, 128);
  
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(150);
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);

  const frames = 8;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 128, 128);
    
    const breathe = Math.sin((frame / frames) * Math.PI * 2) * 2;
    
    // Cat body (sleeping)
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(64, 70 + breathe, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cat head
    ctx.beginPath();
    ctx.arc(64, 50 + breathe, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.moveTo(45, 35 + breathe);
    ctx.lineTo(38, 20 + breathe);
    ctx.lineTo(52, 30 + breathe);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(83, 35 + breathe);
    ctx.lineTo(90, 20 + breathe);
    ctx.lineTo(76, 30 + breathe);
    ctx.fill();
    
    // Closed eyes (sleeping)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(52, 48 + breathe);
    ctx.lineTo(58, 48 + breathe);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(70, 48 + breathe);
    ctx.lineTo(76, 48 + breathe);
    ctx.stroke();
    
    // Nose
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(64, 55 + breathe, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Whiskers
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 52 + breathe);
    ctx.lineTo(25, 50 + breathe);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(88, 52 + breathe);
    ctx.lineTo(103, 50 + breathe);
    ctx.stroke();
    
    // "Zzz" text
    ctx.fillStyle = '#5865F2';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Z', 90, 30 + breathe);
    ctx.font = 'bold 12px Arial';
    ctx.fillText('z', 100, 25 + breathe);
    ctx.font = 'bold 8px Arial';
    ctx.fillText('z', 107, 22 + breathe);
    
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

// Play button - excited running cat
async function createPlayButton() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const encoder = new GIFEncoder(128, 128);
  
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(100);
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);

  const frames = 8;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 128, 128);
    
    const bounce = Math.abs(Math.sin((frame / frames) * Math.PI * 2)) * 5;
    const tailWag = Math.sin((frame / frames) * Math.PI * 4) * 15;
    
    // Cat body
    ctx.fillStyle = '#57F287';
    ctx.beginPath();
    ctx.ellipse(64, 70 - bounce, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail (wagging)
    ctx.strokeStyle = '#57F287';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(35, 70 - bounce);
    ctx.quadraticCurveTo(20, 60 - bounce + tailWag, 15, 45 - bounce + tailWag);
    ctx.stroke();
    
    // Cat head
    ctx.fillStyle = '#57F287';
    ctx.beginPath();
    ctx.arc(70, 50 - bounce, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears (perked up)
    ctx.beginPath();
    ctx.moveTo(58, 35 - bounce);
    ctx.lineTo(52, 20 - bounce);
    ctx.lineTo(65, 30 - bounce);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(82, 35 - bounce);
    ctx.lineTo(88, 20 - bounce);
    ctx.lineTo(75, 30 - bounce);
    ctx.fill();
    
    // Excited eyes (wide open)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(63, 48 - bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(77, 48 - bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth (happy)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(70, 55 - bounce, 5, 0, Math.PI);
    ctx.stroke();
    
    // Running legs
    const legAngle = (frame / frames) * Math.PI * 2;
    ctx.strokeStyle = '#57F287';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    // Front leg
    ctx.beginPath();
    ctx.moveTo(75, 85 - bounce);
    ctx.lineTo(75 + Math.sin(legAngle) * 8, 95 - bounce);
    ctx.stroke();
    
    // Back leg
    ctx.beginPath();
    ctx.moveTo(55, 85 - bounce);
    ctx.lineTo(55 + Math.sin(legAngle + Math.PI) * 8, 95 - bounce);
    ctx.stroke();
    
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

// Stop button - sitting cat with paw up (stop gesture)
async function createStopButton() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const encoder = new GIFEncoder(128, 128);
  
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(150);
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);

  const frames = 6;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 128, 128);
    
    const pawMove = Math.sin((frame / frames) * Math.PI * 2) * 3;
    
    // Cat body (sitting)
    ctx.fillStyle = '#ED4245';
    ctx.beginPath();
    ctx.ellipse(64, 75, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cat head
    ctx.beginPath();
    ctx.arc(64, 45, 28, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.moveTo(46, 30);
    ctx.lineTo(40, 15);
    ctx.lineTo(52, 25);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(82, 30);
    ctx.lineTo(88, 15);
    ctx.lineTo(76, 25);
    ctx.fill();
    
    // Serious eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(54, 42, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(74, 42, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Frown
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(64, 55, 6, Math.PI, 0, true);
    ctx.stroke();
    
    // Raised paw (stop gesture)
    ctx.fillStyle = '#ED4245';
    ctx.beginPath();
    ctx.ellipse(90, 50 + pawMove, 12, 18, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Paw pads
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(90, 48 + pawMove, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(87, 52 + pawMove, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(93, 52 + pawMove, 2, 0, Math.PI * 2);
    ctx.fill();
    
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

// Skip button - cat jumping forward
async function createSkipButton() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const encoder = new GIFEncoder(128, 128);
  
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(100);
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);

  const frames = 8;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 128, 128);
    
    const jumpHeight = Math.abs(Math.sin((frame / frames) * Math.PI)) * 20;
    const moveX = (frame / frames) * 15;
    
    // Cat body (stretched during jump)
    ctx.fillStyle = '#00D4FF';
    ctx.save();
    ctx.translate(50 + moveX, 70 - jumpHeight);
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Cat head
    ctx.beginPath();
    ctx.arc(70 + moveX, 55 - jumpHeight, 22, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.moveTo(58 + moveX, 42 - jumpHeight);
    ctx.lineTo(53 + moveX, 30 - jumpHeight);
    ctx.lineTo(64 + moveX, 38 - jumpHeight);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(82 + moveX, 42 - jumpHeight);
    ctx.lineTo(87 + moveX, 30 - jumpHeight);
    ctx.lineTo(76 + moveX, 38 - jumpHeight);
    ctx.fill();
    
    // Determined eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(64 + moveX, 52 - jumpHeight, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(76 + moveX, 52 - jumpHeight, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Speed lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.5 - i * 0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30 + moveX - i * 15, 65 - jumpHeight);
      ctx.lineTo(20 + moveX - i * 15, 65 - jumpHeight);
      ctx.stroke();
    }
    
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

// Previous button - cat walking backward
async function createPreviousButton() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const encoder = new GIFEncoder(128, 128);
  
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(100);
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);

  const frames = 8;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 128, 128);
    
    const walkCycle = Math.sin((frame / frames) * Math.PI * 2) * 3;
    const moveX = -(frame / frames) * 12;
    
    // Cat body
    ctx.fillStyle = '#9B59B6';
    ctx.beginPath();
    ctx.ellipse(64 + moveX, 70 + walkCycle, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cat head (looking back)
    ctx.save();
    ctx.translate(50 + moveX, 52 + walkCycle);
    ctx.rotate(0.5);
    ctx.fillStyle = '#9B59B6';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Confused eye (looking back)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Ears
    ctx.fillStyle = '#9B59B6';
    ctx.beginPath();
    ctx.moveTo(42 + moveX, 40 + walkCycle);
    ctx.lineTo(37 + moveX, 28 + walkCycle);
    ctx.lineTo(48 + moveX, 35 + walkCycle);
    ctx.fill();
    
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

// Loop button - cat chasing tail
async function createLoopButton() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const encoder = new GIFEncoder(128, 128);
  
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(120);
  encoder.setQuality(10);
  encoder.setTransparent(0x000000);

  const frames = 12;
  for (let frame = 0; frame < frames; frame++) {
    ctx.clearRect(0, 0, 128, 128);
    
    const angle = (frame / frames) * Math.PI * 2;
    
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(angle);
    
    // Cat body (spinning)
    ctx.fillStyle = '#FEE75C';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cat head
    ctx.beginPath();
    ctx.arc(15, -5, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.moveTo(8, -18);
    ctx.lineTo(4, -28);
    ctx.lineTo(14, -20);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(22, -18);
    ctx.lineTo(26, -28);
    ctx.lineTo(18, -20);
    ctx.fill();
    
    // Dizzy eyes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    // X eyes (dizzy)
    ctx.beginPath();
    ctx.moveTo(9, -8);
    ctx.lineTo(13, -4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(13, -8);
    ctx.lineTo(9, -4);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(17, -8);
    ctx.lineTo(21, -4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21, -8);
    ctx.lineTo(17, -4);
    ctx.stroke();
    
    // Tail (chasing)
    ctx.strokeStyle = '#FEE75C';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 35, Math.PI, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Dizzy stars
    const starAngle = -angle;
    for (let i = 0; i < 3; i++) {
      const starX = 64 + Math.cos(starAngle + i * (Math.PI * 2 / 3)) * 45;
      const starY = 64 + Math.sin(starAngle + i * (Math.PI * 2 / 3)) * 45;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('★', starX - 8, starY + 8);
    }
    
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

// Create all animated emojis
try {
  const pauseGif = await createPauseButton();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'pause_button.gif'), pauseGif);
  console.log('✅ Created pause_button.gif');

  const playGif = await createPlayButton();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'play_button.gif'), playGif);
  console.log('✅ Created play_button.gif');

  const stopGif = await createStopButton();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'stop_button.gif'), stopGif);
  console.log('✅ Created stop_button.gif');

  const skipGif = await createSkipButton();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'skip_button.gif'), skipGif);
  console.log('✅ Created skip_button.gif');

  const previousGif = await createPreviousButton();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'previous_button.gif'), previousGif);
  console.log('✅ Created previous_button.gif');

  const loopGif = await createLoopButton();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'loop_button.gif'), loopGif);
  console.log('✅ Created loop_button.gif');

  console.log(`\n✅ All animated control button emojis created in "${OUTPUT_DIR}/" directory!`);
  console.log('📤 Now run /setup-control-emojis in Discord to upload them');
} catch (error) {
  console.error('❌ Error:', error.message);
}
