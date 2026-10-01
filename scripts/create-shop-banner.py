"""
Create animated shop banner for Discord bot
Uses PIL to create modern animated GIF with gradient and effects
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

# Constants
WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80  # milliseconds

# Modern color palette
GOLD = (255, 215, 0)
GOLD_DARK = (218, 165, 32)
PURPLE = (138, 43, 226)
PURPLE_DARK = (75, 0, 130)
CYAN = (0, 255, 255)
PINK = (255, 105, 180)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

def create_gradient_bg(width, height, color1, color2, vertical=False):
    """Create gradient background"""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    
    for y in range(height):
        for x in range(width):
            if vertical:
                mask_data.append(int(255 * (y / height)))
            else:
                mask_data.append(int(255 * (x / width)))
    
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def create_star(size=20, points=5):
    """Create a star shape"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size / 2
    outer_radius = size / 2 - 2
    inner_radius = size / 4
    
    star_points = []
    for i in range(points * 2):
        angle = math.pi * i / points - math.pi / 2
        if i % 2 == 0:
            r = outer_radius
        else:
            r = inner_radius
        x = center + r * math.cos(angle)
        y = center + r * math.sin(angle)
        star_points.append((x, y))
    
    draw.polygon(star_points, fill=GOLD, outline=WHITE)
    return img

def create_coin_modern(size=60, frame=0, total_frames=30):
    """Create modern coin with 3D effect and rotation"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rotation effect (3D perspective)
    rotation = (frame / total_frames) * 2 * math.pi
    scale_x = abs(math.cos(rotation))
    
    # Draw coin shadow
    shadow_offset = 3
    shadow_size = int(size * 0.9)
    draw.ellipse(
        [shadow_offset, shadow_offset, shadow_offset + shadow_size, shadow_offset + shadow_size],
        fill=(0, 0, 0, 100)
    )
    
    # Main coin body with perspective
    margin = 5
    width_scale = max(0.3, scale_x)
    coin_width = int((size - margin * 2) * width_scale)
    coin_height = size - margin * 2
    coin_left = margin + (size - margin * 2 - coin_width) // 2
    
    # Outer rim (darker gold)
    draw.ellipse(
        [coin_left, margin, coin_left + coin_width, margin + coin_height],
        fill=GOLD_DARK,
        outline=GOLD,
        width=2
    )
    
    # Inner shine
    if coin_width > 20:
        inner_margin = 8
        draw.ellipse(
            [coin_left + inner_margin, margin + inner_margin, 
             coin_left + coin_width - inner_margin, margin + coin_height - inner_margin],
            fill=GOLD,
            outline=None
        )
    
    # Sparkle effect
    if scale_x > 0.8 or scale_x < 0.3:
        sparkle_size = 8
        sparkle_x = coin_left + coin_width // 2 - sparkle_size // 2
        sparkle_y = margin + coin_height // 3
        draw.ellipse(
            [sparkle_x, sparkle_y, sparkle_x + sparkle_size, sparkle_y + sparkle_size],
            fill=(255, 255, 200, 200)
        )
    
    return img

def create_gem(size=50, color=CYAN):
    """Create a gem/diamond sprite"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Diamond shape
    center_x = size / 2
    top = size * 0.2
    bottom = size * 0.8
    left = size * 0.2
    right = size * 0.8
    middle_y = size * 0.5
    
    # Draw facets
    points = [
        (center_x, top),
        (right, middle_y),
        (center_x, bottom),
        (left, middle_y)
    ]
    
    draw.polygon(points, fill=color, outline=WHITE, width=2)
    
    # Inner sparkle
    inner_points = [
        (center_x, top + 10),
        (right - 10, middle_y),
        (center_x, bottom - 10),
        (left + 10, middle_y)
    ]
    lighter = tuple(min(255, c + 50) for c in color[:3])
    draw.polygon(inner_points, fill=lighter)
    
    return img

def create_frame(frame_num, total_frames):
    """Create a single frame of the animation"""
    # Create gradient background
    gradient = create_gradient_bg(WIDTH, HEIGHT, PURPLE_DARK, PURPLE, vertical=False)
    img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    img.paste(gradient.convert('RGBA'), (0, 0))
    
    draw = ImageDraw.Draw(img)
    
    # Animated stars in background
    for i in range(15):
        star_offset = (frame_num + i * 2) % total_frames
        star_alpha = int(255 * (0.3 + 0.7 * abs(math.sin(star_offset / total_frames * math.pi))))
        star = create_star(15 + i % 10)
        star.putalpha(star_alpha)
        star_x = 50 + (i * 60) % (WIDTH - 50)
        star_y = 20 + (i * 30) % (HEIGHT - 40)
        img.paste(star, (star_x, star_y), star)
    
    # Rotating coins (left and right)
    coin_left = create_coin_modern(70, frame_num, total_frames)
    coin_right = create_coin_modern(70, frame_num + total_frames // 2, total_frames)
    
    # Bouncing effect
    bounce = abs(int(15 * math.sin(frame_num / total_frames * math.pi * 2)))
    
    img.paste(coin_left, (100, HEIGHT // 2 - 35 - bounce), coin_left)
    img.paste(coin_right, (WIDTH - 170, HEIGHT // 2 - 35 + bounce), coin_right)
    
    # Gems
    gem_cyan = create_gem(45, CYAN)
    gem_pink = create_gem(45, PINK)
    
    gem_float = int(10 * math.sin((frame_num + 5) / total_frames * math.pi * 2))
    img.paste(gem_cyan, (200, HEIGHT // 2 - 25 + gem_float), gem_cyan)
    img.paste(gem_pink, (WIDTH - 245, HEIGHT // 2 - 25 - gem_float), gem_pink)
    
    # Draw glowing border
    border_width = 3
    glow_intensity = int(100 + 155 * abs(math.sin(frame_num / total_frames * math.pi * 2)))
    glow_color = (GOLD[0], GOLD[1], GOLD[2], glow_intensity)
    
    # Outer glow
    for i in range(border_width, 0, -1):
        alpha = int(glow_intensity * (i / border_width))
        draw.rectangle(
            [i, i, WIDTH - i - 1, HEIGHT - i - 1],
            outline=(GOLD[0], GOLD[1], GOLD[2], alpha),
            width=2
        )
    
    # Draw text "SHOP" with outline and glow
    try:
        font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 80)
            subtitle_font = ImageFont.truetype(font_path, 28)
        else:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    text = "SHOP"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = HEIGHT // 2 - 50
    
    # Text glow effect
    glow_offset = int(3 + 2 * abs(math.sin(frame_num / total_frames * math.pi)))
    for offset in range(glow_offset, 0, -1):
        alpha = int(100 / offset)
        glow_layer = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_draw.text(
            (text_x, text_y), 
            text, 
            fill=(GOLD[0], GOLD[1], 0, alpha), 
            font=font
        )
        img = Image.alpha_composite(img, glow_layer)
    
    # Main text with gradient effect
    draw.text((text_x + 3, text_y + 3), text, fill=(0, 0, 0, 180), font=font)  # Shadow
    draw.text((text_x, text_y), text, fill=GOLD, font=font, stroke_width=3, stroke_fill=WHITE)
    
    # Animated subtitle
    subtitle = "✨ Buy Premium Roles & Items ✨"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (WIDTH - subtitle_width) // 2
    subtitle_y = HEIGHT // 2 + 40
    
    subtitle_glow = int(150 + 105 * abs(math.sin((frame_num + 10) / total_frames * math.pi * 2)))
    draw.text((subtitle_x + 2, subtitle_y + 2), subtitle, fill=(0, 0, 0, 150), font=subtitle_font)
    draw.text((subtitle_x, subtitle_y), subtitle, fill=(255, 255, 255, subtitle_glow), font=subtitle_font)
    
    return img

def create_shop_banner():
    """Create the animated shop banner"""
    print("🎨 Creating shop banner...")
    
    frames = []
    for i in range(FRAMES):
        print(f"  Creating frame {i+1}/{FRAMES}...")
        frame = create_frame(i, FRAMES)
        frames.append(frame)
    
    # Save as animated GIF
    output_path = os.path.join(os.getcwd(), 'assets', 'banners', 'shop-banner.gif')
    
    print(f"💾 Saving to {output_path}...")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    
    print(f"✅ Shop banner created successfully!")
    print(f"📍 Location: {output_path}")
    print(f"📏 Size: {WIDTH}x{HEIGHT}")
    print(f"🎞️ Frames: {FRAMES}")

if __name__ == "__main__":
    create_shop_banner()
