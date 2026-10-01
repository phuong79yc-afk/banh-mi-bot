"""
Create animated shop banner for Discord bot
Uses PIL to create Minecraft-style animated GIF
"""

from PIL import Image, ImageDraw, ImageFont, ImageSequence
import os

# Constants
WIDTH = 800
HEIGHT = 200
FRAMES = 20
FRAME_DURATION = 100  # milliseconds

# Colors (Minecraft palette)
GOLD = (255, 215, 0)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
DARK_GRAY = (64, 64, 64)
LIGHT_GRAY = (192, 192, 192)
BROWN = (139, 69, 19)
DARK_BROWN = (101, 67, 33)

def create_chest_sprite(size=64):
    """Create a simple Minecraft chest sprite"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Chest body (brown)
    draw.rectangle([8, 16, size-8, size-8], fill=BROWN, outline=DARK_BROWN, width=2)
    
    # Chest lid (darker brown)
    draw.rectangle([8, 8, size-8, 20], fill=DARK_BROWN, outline=BLACK, width=2)
    
    # Lock (gold)
    lock_x = size // 2
    draw.rectangle([lock_x-4, 12, lock_x+4, 18], fill=GOLD, outline=BLACK, width=1)
    
    return img

def create_coin_sprite(size=48, color=GOLD):
    """Create a coin sprite"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Coin circle
    margin = 4
    draw.ellipse([margin, margin, size-margin, size-margin], fill=color, outline=DARK_BROWN, width=3)
    
    # Inner circle for shine effect
    shine_size = size // 3
    draw.ellipse([size//4, size//4, size//4 + shine_size, size//4 + shine_size], 
                 fill=(255, 255, 200, 200), outline=None)
    
    return img

def create_frame(frame_num, total_frames):
    """Create a single frame of the animation"""
    # Use RGBA for transparency
    img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw chest (center)
    chest = create_chest_sprite(80)
    chest_x = WIDTH // 2 - 40
    chest_y = HEIGHT // 2 - 20
    img.paste(chest, (chest_x, chest_y), chest)
    
    # Draw animated coins (bouncing effect)
    coin_offset = abs(int(10 * (frame_num / total_frames * 2 - 1)))
    
    # Left coin
    coin1 = create_coin_sprite(40)
    coin1_x = WIDTH // 2 - 120
    coin1_y = HEIGHT // 2 - 20 - coin_offset
    img.paste(coin1, (coin1_x, coin1_y), coin1)
    
    # Right coin
    coin2 = create_coin_sprite(40)
    coin2_x = WIDTH // 2 + 80
    coin2_y = HEIGHT // 2 - 20 + coin_offset
    img.paste(coin2, (coin2_x, coin2_y), coin2)
    
    # Draw border (semi-transparent background box)
    border_width = 4
    # Draw semi-transparent dark background for better text visibility
    draw.rectangle([border_width, border_width, WIDTH-border_width, HEIGHT-border_width], 
                  fill=(0, 0, 0, 180), outline=None)
    
    # Draw colored borders
    draw.rectangle([0, 0, WIDTH-1, HEIGHT-1], outline=BROWN, width=border_width)
    draw.rectangle([border_width, border_width, WIDTH-border_width-1, HEIGHT-border_width-1], 
                  outline=GOLD, width=2)
    
    # Draw text "SHOP"
    try:
        # Try to use Minecraft font
        font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 72)
        else:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    text = "SHOP"
    
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Draw text with shadow
    text_x = (WIDTH - text_width) // 2
    text_y = 20
    
    # Shadow (black)
    draw.text((text_x + 3, text_y + 3), text, fill=BLACK, font=font)
    # Text (gold with white outline)
    draw.text((text_x, text_y), text, fill=GOLD, font=font, stroke_width=2, stroke_fill=WHITE)
    
    # Draw subtitle
    try:
        subtitle_font = ImageFont.truetype(font_path, 24) if os.path.exists(font_path) else ImageFont.load_default()
    except:
        subtitle_font = ImageFont.load_default()
    
    subtitle = "Buy Roles & Items with Coins!"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (WIDTH - subtitle_width) // 2
    subtitle_y = HEIGHT - 40
    
    draw.text((subtitle_x + 2, subtitle_y + 2), subtitle, fill=BLACK, font=subtitle_font)
    draw.text((subtitle_x, subtitle_y), subtitle, fill=WHITE, font=subtitle_font)
    
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
