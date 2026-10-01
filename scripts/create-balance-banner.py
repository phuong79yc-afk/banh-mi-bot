"""
Create animated balance/coins banner for Discord bot
Gold/money theme with animated coins and sparkles
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# Constants
WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80

# Color palette - Gold/Money theme
GOLD = (255, 215, 0)
GOLD_DARK = (218, 165, 32)
GOLD_LIGHT = (255, 239, 150)
GREEN = (46, 204, 113)
GREEN_DARK = (39, 174, 96)
YELLOW = (241, 196, 15)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

def create_gradient_radial(width, height, center_color, outer_color):
    """Create radial gradient background"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = width // 2, height // 2
    max_radius = math.sqrt(center_x**2 + center_y**2)
    
    for y in range(height):
        for x in range(width):
            distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            ratio = distance / max_radius
            
            r = int(center_color[0] * (1 - ratio) + outer_color[0] * ratio)
            g = int(center_color[1] * (1 - ratio) + outer_color[1] * ratio)
            b = int(center_color[2] * (1 - ratio) + outer_color[2] * ratio)
            
            draw.point((x, y), fill=(r, g, b))
    
    return img

def create_coin_stack(width=80, height=100, frame=0, total_frames=30):
    """Create stacked coins with 3D effect"""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Animation offset
    bounce = int(5 * abs(math.sin(frame / total_frames * math.pi * 2)))
    
    # Draw 5 stacked coins
    for i in range(5):
        y_offset = height - 20 - (i * 12) - bounce
        
        # Shadow
        draw.ellipse(
            [10, y_offset + 2, width - 10, y_offset + 18],
            fill=(0, 0, 0, 50)
        )
        
        # Coin body
        draw.ellipse(
            [8, y_offset, width - 8, y_offset + 16],
            fill=GOLD if i % 2 == 0 else GOLD_DARK,
            outline=GOLD_DARK,
            width=2
        )
        
        # Shine
        draw.ellipse(
            [width // 4, y_offset + 2, width // 2, y_offset + 8],
            fill=(255, 255, 200, 150)
        )
    
    return img

def create_money_bag(size=90, frame=0, total_frames=30):
    """Create money bag sprite"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Swing animation
    swing = int(5 * math.sin(frame / total_frames * math.pi * 4))
    
    # Bag body (rounded bottom)
    bag_left = 15 + swing
    bag_right = size - 15 + swing
    bag_top = 25
    bag_bottom = size - 10
    
    # Draw bag shape
    draw.ellipse([bag_left, bag_bottom - 40, bag_right, bag_bottom], fill=GREEN_DARK, outline=GREEN, width=2)
    draw.rectangle([bag_left, bag_top + 20, bag_right, bag_bottom - 20], fill=GREEN_DARK, outline=None)
    
    # Bag tie/string at top
    string_center = size // 2 + swing
    draw.ellipse([string_center - 8, bag_top, string_center + 8, bag_top + 16], fill=YELLOW, outline=GOLD, width=2)
    
    # Dollar sign
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    dollar = "$"
    bbox = draw.textbbox((0, 0), dollar, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (size - text_width) // 2 + swing
    text_y = size // 2 - 10
    
    draw.text((text_x + 2, text_y + 2), dollar, fill=BLACK, font=font)
    draw.text((text_x, text_y), dollar, fill=GOLD, font=font)
    
    return img

def create_flying_coin(size=50, frame=0, total_frames=30, offset=0):
    """Create flying/rotating coin"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    rotation = ((frame + offset) / total_frames) * 2 * math.pi
    scale_x = abs(math.cos(rotation))
    
    # Floating motion
    float_y = int(5 * math.sin((frame + offset) / total_frames * math.pi * 2))
    
    margin = 5
    width_scale = max(0.2, scale_x)
    coin_width = int((size - margin * 2) * width_scale)
    coin_height = size - margin * 2
    coin_left = margin + (size - margin * 2 - coin_width) // 2
    
    # Shadow
    draw.ellipse(
        [coin_left + 2, margin + 2 + float_y, coin_left + coin_width + 2, margin + coin_height + 2 + float_y],
        fill=(0, 0, 0, 80)
    )
    
    # Coin
    draw.ellipse(
        [coin_left, margin + float_y, coin_left + coin_width, margin + coin_height + float_y],
        fill=GOLD,
        outline=GOLD_DARK,
        width=3
    )
    
    # Inner shine
    if coin_width > 15:
        shine_size = max(5, coin_width // 3)
        draw.ellipse(
            [coin_left + 5, margin + 5 + float_y, coin_left + shine_size + 5, margin + shine_size + 5 + float_y],
            fill=(255, 255, 200, 200)
        )
    
    return img

def create_sparkle_star(size=25):
    """Create 4-point sparkle"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    
    # Horizontal line
    draw.line([2, center, size - 2, center], fill=GOLD_LIGHT, width=4)
    # Vertical line
    draw.line([center, 2, center, size - 2], fill=GOLD_LIGHT, width=4)
    
    # Center glow
    draw.ellipse([center - 4, center - 4, center + 4, center + 4], fill=WHITE)
    
    return img

def create_frame(frame_num, total_frames):
    """Create single animation frame"""
    # Radial gradient background
    gradient = create_gradient_radial(WIDTH, HEIGHT, GREEN_DARK, GREEN)
    img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    img.paste(gradient.convert('RGBA'), (0, 0))
    
    draw = ImageDraw.Draw(img)
    
    # Animated sparkles
    for i in range(25):
        sparkle_frame = (frame_num + i * 2) % total_frames
        alpha = int(100 + 155 * abs(math.sin(sparkle_frame / total_frames * math.pi)))
        sparkle = create_sparkle_star(20)
        sparkle.putalpha(alpha)
        x = 30 + (i * 35) % (WIDTH - 60)
        y = 20 + (i * 20) % (HEIGHT - 40)
        img.paste(sparkle, (x, y), sparkle)
    
    # Money bag (left)
    money_bag = create_money_bag(100, frame_num, total_frames)
    img.paste(money_bag, (60, HEIGHT // 2 - 50), money_bag)
    
    # Coin stack (right-side)
    coin_stack = create_coin_stack(70, 110, frame_num, total_frames)
    img.paste(coin_stack, (WIDTH - 130, HEIGHT // 2 - 55), coin_stack)
    
    # Flying coins (scattered)
    flying_coins = [
        (190, HEIGHT // 2 - 60, 0),
        (240, HEIGHT // 2 + 20, 10),
        (WIDTH - 220, HEIGHT // 2 - 40, 20),
        (WIDTH - 180, HEIGHT // 2 + 10, 5),
    ]
    
    for x, y, offset in flying_coins:
        coin = create_flying_coin(45, frame_num, total_frames, offset)
        img.paste(coin, (x, y), coin)
    
    # Glowing border
    glow_intensity = int(120 + 135 * abs(math.sin(frame_num / total_frames * math.pi * 2)))
    for i in range(3, 0, -1):
        alpha = int(glow_intensity * (i / 3) * 0.6)
        draw.rectangle(
            [i, i, WIDTH - i - 1, HEIGHT - i - 1],
            outline=(GOLD[0], GOLD[1], 0, alpha),
            width=2
        )
    
    # Main text
    try:
        font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 75)
            subtitle_font = ImageFont.truetype(font_path, 26)
        else:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    text = "BALANCE"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = HEIGHT // 2 - 45
    
    # Text glow
    for offset in range(5, 0, -1):
        alpha = int(100 / offset)
        glow_layer = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_draw.text((text_x, text_y), text, fill=(GOLD[0], GOLD[1], 0, alpha), font=font)
        img = Image.alpha_composite(img, glow_layer)
    
    # Main text
    draw.text((text_x + 3, text_y + 3), text, fill=(0, 0, 0, 180), font=font)
    draw.text((text_x, text_y), text, fill=GOLD, font=font, stroke_width=3, stroke_fill=WHITE)
    
    # Subtitle
    subtitle = "💰 Check Your Coins & Wealth 💎"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (WIDTH - subtitle_width) // 2
    subtitle_y = HEIGHT // 2 + 38
    
    subtitle_glow = int(150 + 105 * abs(math.sin((frame_num + 10) / total_frames * math.pi * 2)))
    draw.text((subtitle_x + 2, subtitle_y + 2), subtitle, fill=(0, 0, 0, 150), font=subtitle_font)
    draw.text((subtitle_x, subtitle_y), subtitle, fill=(255, 255, 255, subtitle_glow), font=subtitle_font)
    
    return img

def create_balance_banner():
    """Create the animated balance banner"""
    print("🎨 Creating balance banner...")
    
    frames = []
    for i in range(FRAMES):
        print(f"  Creating frame {i+1}/{FRAMES}...")
        frame = create_frame(i, FRAMES)
        frames.append(frame)
    
    output_path = os.path.join(os.getcwd(), 'assets', 'banners', 'balance-banner.gif')
    
    print(f"💾 Saving to {output_path}...")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    
    print(f"✅ Balance banner created successfully!")
    print(f"📍 Location: {output_path}")
    print(f"📏 Size: {WIDTH}x{HEIGHT}")
    print(f"🎞️ Frames: {FRAMES}")

if __name__ == "__main__":
    create_balance_banner()
