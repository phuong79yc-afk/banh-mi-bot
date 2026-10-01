"""
Create animated daily check-in banner for Discord bot
Modern gradient design with calendar and coin animations
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

# Constants
WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80

# Color palette
BLUE = (88, 101, 242)  # Discord blue
BLUE_LIGHT = (114, 137, 218)
GREEN = (87, 242, 135)
GOLD = (255, 215, 0)
WHITE = (255, 255, 255)
ORANGE = (255, 165, 0)

def create_gradient_bg(width, height, color1, color2, angle=0):
    """Create gradient background with angle"""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    
    for y in range(height):
        for x in range(width):
            # Diagonal gradient
            progress = (x + y) / (width + height)
            mask_data.append(int(255 * progress))
    
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def create_calendar_icon(size=80, day=0, total_days=30):
    """Create animated calendar icon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calendar background (white)
    margin = 5
    draw.rounded_rectangle(
        [margin, margin + 10, size - margin, size - margin],
        radius=8,
        fill=WHITE,
        outline=BLUE,
        width=3
    )
    
    # Calendar header (red strip)
    draw.rounded_rectangle(
        [margin, margin + 10, size - margin, margin + 25],
        radius=8,
        fill=(220, 53, 69)
    )
    
    # Binding rings
    ring_size = 8
    draw.ellipse([size//3 - ring_size//2, margin, size//3 + ring_size//2, margin + ring_size], 
                 fill=(150, 150, 150))
    draw.ellipse([2*size//3 - ring_size//2, margin, 2*size//3 + ring_size//2, margin + ring_size], 
                 fill=(150, 150, 150))
    
    # Animated number (current day)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()
    
    # Calculate day number (1-31)
    day_num = (day % 31) + 1
    day_text = str(day_num)
    
    bbox = draw.textbbox((0, 0), day_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = margin + 35
    
    draw.text((text_x, text_y), day_text, fill=BLUE, font=font)
    
    return img

def create_coin_rotating(size=50, frame=0, total_frames=30):
    """Create 3D rotating coin"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    rotation = (frame / total_frames) * 2 * math.pi
    scale_x = abs(math.cos(rotation))
    
    margin = 5
    width_scale = max(0.2, scale_x)
    coin_width = int((size - margin * 2) * width_scale)
    coin_height = size - margin * 2
    coin_left = margin + (size - margin * 2 - coin_width) // 2
    
    # Coin shadow
    draw.ellipse(
        [coin_left + 2, margin + 2, coin_left + coin_width + 2, margin + coin_height + 2],
        fill=(0, 0, 0, 80)
    )
    
    # Coin body
    draw.ellipse(
        [coin_left, margin, coin_left + coin_width, margin + coin_height],
        fill=GOLD,
        outline=ORANGE,
        width=2
    )
    
    # Coin shine
    if coin_width > 15:
        shine_margin = 8
        draw.ellipse(
            [coin_left + shine_margin, margin + shine_margin,
             coin_left + coin_width - shine_margin, margin + coin_height - shine_margin],
            fill=(255, 255, 200, 150)
        )
    
    return img

def create_streak_flame(size=60, frame=0, total_frames=30):
    """Create animated flame for streak"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Flame flicker animation
    flicker = math.sin(frame / total_frames * math.pi * 4) * 5
    
    # Flame shape (using circles)
    center_x = size // 2
    
    # Bottom (red/orange)
    draw.ellipse(
        [center_x - 20, size - 25 + flicker, center_x + 20, size - 5],
        fill=(255, 69, 0)
    )
    
    # Middle (orange/yellow)
    draw.ellipse(
        [center_x - 15, size - 35 + flicker, center_x + 15, size - 15],
        fill=(255, 140, 0)
    )
    
    # Top (yellow)
    draw.ellipse(
        [center_x - 10, size - 45 + flicker, center_x + 10, size - 25],
        fill=(255, 215, 0)
    )
    
    # Inner glow (white)
    draw.ellipse(
        [center_x - 5, size - 35 + flicker, center_x + 5, size - 25],
        fill=(255, 255, 200)
    )
    
    return img

def create_sparkle(size=20):
    """Create sparkle/star"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    # Draw + shape
    draw.line([center, 2, center, size - 2], fill=WHITE, width=3)
    draw.line([2, center, size - 2, center], fill=WHITE, width=3)
    # Draw X shape
    draw.line([4, 4, size - 4, size - 4], fill=WHITE, width=2)
    draw.line([size - 4, 4, 4, size - 4], fill=WHITE, width=2)
    
    return img

def create_frame(frame_num, total_frames):
    """Create single animation frame"""
    # Gradient background
    gradient = create_gradient_bg(WIDTH, HEIGHT, BLUE, BLUE_LIGHT)
    img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    img.paste(gradient.convert('RGBA'), (0, 0))
    
    draw = ImageDraw.Draw(img)
    
    # Animated sparkles
    for i in range(20):
        sparkle_frame = (frame_num + i * 3) % total_frames
        alpha = int(100 + 155 * abs(math.sin(sparkle_frame / total_frames * math.pi)))
        sparkle = create_sparkle(12)
        sparkle.putalpha(alpha)
        x = 30 + (i * 40) % (WIDTH - 60)
        y = 15 + (i * 25) % (HEIGHT - 30)
        img.paste(sparkle, (x, y), sparkle)
    
    # Calendar icon (left side)
    calendar = create_calendar_icon(100, frame_num, total_frames)
    bounce = int(8 * abs(math.sin(frame_num / total_frames * math.pi * 2)))
    img.paste(calendar, (80, HEIGHT // 2 - 50 - bounce), calendar)
    
    # Streak flame (left-center)
    flame = create_streak_flame(70, frame_num, total_frames)
    img.paste(flame, (220, HEIGHT // 2 - 40), flame)
    
    # Coins (right side)
    coin1 = create_coin_rotating(55, frame_num, total_frames)
    coin2 = create_coin_rotating(55, frame_num + total_frames // 3, total_frames)
    coin3 = create_coin_rotating(55, frame_num + 2 * total_frames // 3, total_frames)
    
    coin_bounce = int(10 * abs(math.sin((frame_num + 5) / total_frames * math.pi * 2)))
    img.paste(coin1, (WIDTH - 200, HEIGHT // 2 - 30 - coin_bounce), coin1)
    img.paste(coin2, (WIDTH - 140, HEIGHT // 2 - 30 + coin_bounce), coin2)
    img.paste(coin3, (WIDTH - 80, HEIGHT // 2 - 30), coin3)
    
    # Glowing border
    glow_intensity = int(100 + 155 * abs(math.sin(frame_num / total_frames * math.pi * 2)))
    for i in range(3, 0, -1):
        alpha = int(glow_intensity * (i / 3) * 0.5)
        draw.rectangle(
            [i, i, WIDTH - i - 1, HEIGHT - i - 1],
            outline=(GREEN[0], GREEN[1], GREEN[2], alpha),
            width=2
        )
    
    # Main text
    try:
        font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 70)
            subtitle_font = ImageFont.truetype(font_path, 26)
        else:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    text = "DAILY CHECK-IN"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = HEIGHT // 2 - 45
    
    # Text glow
    for offset in range(4, 0, -1):
        alpha = int(80 / offset)
        glow_layer = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_draw.text((text_x, text_y), text, fill=(GREEN[0], GREEN[1], GREEN[2], alpha), font=font)
        img = Image.alpha_composite(img, glow_layer)
    
    # Main text
    draw.text((text_x + 2, text_y + 2), text, fill=(0, 0, 0, 150), font=font)
    draw.text((text_x, text_y), text, fill=WHITE, font=font, stroke_width=2, stroke_fill=GREEN)
    
    # Subtitle
    subtitle = "🔥 Keep Your Streak Going! 💰"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (WIDTH - subtitle_width) // 2
    subtitle_y = HEIGHT // 2 + 35
    
    subtitle_glow = int(150 + 105 * abs(math.sin((frame_num + 15) / total_frames * math.pi * 2)))
    draw.text((subtitle_x + 2, subtitle_y + 2), subtitle, fill=(0, 0, 0, 120), font=subtitle_font)
    draw.text((subtitle_x, subtitle_y), subtitle, fill=(255, 255, 255, subtitle_glow), font=subtitle_font)
    
    return img

def create_daily_banner():
    """Create the animated daily banner"""
    print("🎨 Creating daily check-in banner...")
    
    frames = []
    for i in range(FRAMES):
        print(f"  Creating frame {i+1}/{FRAMES}...")
        frame = create_frame(i, FRAMES)
        frames.append(frame)
    
    output_path = os.path.join(os.getcwd(), 'assets', 'banners', 'daily-banner.gif')
    
    print(f"💾 Saving to {output_path}...")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    
    print(f"✅ Daily banner created successfully!")
    print(f"📍 Location: {output_path}")
    print(f"📏 Size: {WIDTH}x{HEIGHT}")
    print(f"🎞️ Frames: {FRAMES}")

if __name__ == "__main__":
    create_daily_banner()
