"""
Create quest banner with cute round characters style
Pastel gradient background with adorable characters
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80

# Pastel color palette
PINK = (255, 179, 199)
LAVENDER = (206, 185, 255)
MINT = (180, 240, 214)
PEACH = (255, 203, 164)
SKY = (168, 218, 255)
YELLOW = (255, 236, 154)
WHITE = (255, 255, 255)
OUTLINE = (91, 69, 112)

def create_gradient_bg(width, height):
    """Create soft pastel gradient"""
    img = Image.new('RGB', (width, height))
    for y in range(height):
        ratio = y / height
        # Pink to lavender gradient
        r = int(255 * (1 - ratio) + 230 * ratio)
        g = int(220 * (1 - ratio) + 220 * ratio)
        b = int(240 * (1 - ratio) + 255 * ratio)
        for x in range(width):
            img.putpixel((x, y), (r, g, b))
    return img

def draw_round_character(size, face_color, cheek_color, accessory=None, animal='cat'):
    """Draw cute round character with animal ears"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    radius = size // 2 - 4
    
    # Animal ears BEFORE body
    if animal == 'cat':
        for sx in (-1, 1):
            ear_pts = [(center + sx * 13, center - radius), 
                      (center + sx * 25, center - radius - 15),
                      (center + sx * 9, center - radius + 5)]
            draw.polygon(ear_pts, fill=face_color, outline=OUTLINE, width=3)
            inner_pts = [(center + sx * 14, center - radius + 2),
                        (center + sx * 20, center - radius - 8),
                        (center + sx * 12, center - radius + 5)]
            draw.polygon(inner_pts, fill=cheek_color, outline=None)
    
    elif animal == 'bunny':
        for sx in (-1, 1):
            draw.ellipse([center + sx * 10 - 6, center - radius - 25, 
                         center + sx * 10 + 6, center - radius + 5],
                        fill=face_color, outline=OUTLINE, width=3)
            draw.ellipse([center + sx * 10 - 3, center - radius - 20,
                         center + sx * 10 + 3, center - radius + 2],
                        fill=cheek_color, outline=None)
    
    elif animal == 'bear':
        for sx in (-1, 1):
            draw.ellipse([center + sx * 20 - 8, center - radius - 8,
                         center + sx * 20 + 8, center - radius + 8],
                        fill=face_color, outline=OUTLINE, width=3)
            draw.ellipse([center + sx * 20 - 4, center - radius - 4,
                         center + sx * 20 + 4, center - radius + 4],
                        fill=cheek_color, outline=None)
    
    # Body circle
    draw.ellipse([center - radius, center - radius, center + radius, center + radius],
                fill=face_color, outline=OUTLINE, width=3)
    
    # Eyes
    eye_y = center - 8
    for eye_x in [center - 12, center + 12]:
        draw.ellipse([eye_x - 3, eye_y - 3, eye_x + 3, eye_y + 3],
                    fill=OUTLINE)
    
    # Mouth (happy)
    draw.arc([center - 10, center - 5, center + 10, center + 8],
            start=0, end=180, fill=OUTLINE, width=2)
    
    # Cheeks
    for cheek_x in [center - 20, center + 20]:
        draw.ellipse([cheek_x - 6, center + 2, cheek_x + 6, center + 8],
                    fill=cheek_color)
    
    # Accessory
    if accessory == 'checkmark':
        # Green checkmark circle
        check_size = size // 3
        check_x = size - check_size + 5
        check_y = 5
        draw.ellipse([check_x, check_y, check_x + check_size, check_y + check_size],
                    fill=MINT, outline=OUTLINE, width=2)
        # Check symbol
        draw.line([check_x + 8, check_y + 15, check_x + 12, check_y + 19], fill=WHITE, width=3)
        draw.line([check_x + 12, check_y + 19, check_x + 20, check_y + 10], fill=WHITE, width=3)
    
    elif accessory == 'star':
        # Yellow star
        star_pts = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = 12 if i % 2 == 0 else 6
            x = size - 20 + r * math.cos(angle)
            y = 15 + r * math.sin(angle)
            star_pts.append((x, y))
        draw.polygon(star_pts, fill=YELLOW, outline=OUTLINE, width=2)
    
    elif accessory == 'trophy':
        # Gold trophy
        trophy_x = size - 25
        trophy_y = 10
        # Cup
        draw.polygon([
            (trophy_x + 8, trophy_y),
            (trophy_x + 17, trophy_y),
            (trophy_x + 18, trophy_y + 12),
            (trophy_x + 7, trophy_y + 12)
        ], fill=YELLOW, outline=OUTLINE, width=2)
        # Handles
        draw.arc([trophy_x + 2, trophy_y + 2, trophy_x + 8, trophy_y + 8],
                start=90, end=270, fill=OUTLINE, width=2)
        draw.arc([trophy_x + 17, trophy_y + 2, trophy_x + 23, trophy_y + 8],
                start=270, end=90, fill=OUTLINE, width=2)
        # Base
        draw.rectangle([trophy_x + 6, trophy_y + 12, trophy_x + 19, trophy_y + 16],
                      fill=YELLOW, outline=OUTLINE, width=2)
    
    return img

def draw_sparkle(size=20):
    """Draw sparkle/star"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    
    # 4-point star
    draw.line([center, 2, center, size - 2], fill=WHITE, width=3)
    draw.line([2, center, size - 2, center], fill=WHITE, width=3)
    draw.line([5, 5, size - 5, size - 5], fill=WHITE, width=2)
    draw.line([size - 5, 5, 5, size - 5], fill=WHITE, width=2)
    
    return img

def create_frame(frame_num, total_frames):
    """Create single frame"""
    t = frame_num / total_frames
    
    # Gradient background
    img = create_gradient_bg(WIDTH, HEIGHT)
    img = img.convert('RGBA')
    
    # Add sparkles
    for i in range(15):
        sparkle_frame = (frame_num + i * 3) % total_frames
        alpha = int(100 + 155 * abs(math.sin(sparkle_frame / total_frames * math.pi)))
        sparkle = draw_sparkle(15)
        sparkle.putalpha(alpha)
        x = 30 + (i * 60) % (WIDTH - 60)
        y = 20 + (i * 30) % (HEIGHT - 40)
        img.paste(sparkle, (x, y), sparkle)
    
    # Characters
    char_size = 80
    y_base = HEIGHT // 2 - char_size // 2
    
    # Bounce animation offset
    bounce = int(8 * abs(math.sin(TAU * t)))
    
    # Character 1: Pink cat with checkmark
    char1 = draw_round_character(char_size, PINK, (255, 160, 180), 'checkmark', animal='cat')
    img.paste(char1, (60, y_base - bounce), char1)
    
    # Character 2: Lavender bunny with star
    char2 = draw_round_character(char_size, LAVENDER, (180, 160, 220), 'star', animal='bunny')
    bounce2 = int(8 * abs(math.sin(TAU * (t + 0.33))))
    img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
    
    # Character 3: Mint bear with trophy
    char3 = draw_round_character(char_size, MINT, (150, 220, 190), 'trophy', animal='bear')
    bounce3 = int(8 * abs(math.sin(TAU * (t + 0.66))))
    img.paste(char3, (WIDTH - 140, y_base - bounce3), char3)
    
    # Text
    draw = ImageDraw.Draw(img)
    try:
        font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 70)
            subtitle_font = ImageFont.truetype(font_path, 24)
        else:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    text = "DAILY QUESTS"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = 25
    
    # Text shadow
    draw.text((text_x + 3, text_y + 3), text, fill=(100, 80, 120, 200), font=font)
    # Main text
    draw.text((text_x, text_y), text, fill=WHITE, font=font, 
             stroke_width=3, stroke_fill=OUTLINE)
    
    # Subtitle
    subtitle = "✨ Complete Tasks & Earn Rewards! ✨"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    sub_width = bbox[2] - bbox[0]
    sub_x = (WIDTH - sub_width) // 2
    sub_y = HEIGHT - 40
    
    glow = int(180 + 75 * abs(math.sin(TAU * (t + 0.2))))
    draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(100, 80, 120, 150), font=subtitle_font)
    draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
    
    return img

TAU = 2 * math.pi

def create_quest_banner():
    """Create the banner"""
    print("🎨 Creating cute quest banner v2...")
    
    frames = []
    for i in range(FRAMES):
        print(f"  Creating frame {i+1}/{FRAMES}...")
        frame = create_frame(i, FRAMES)
        frames.append(frame)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'quest-banner.gif')
    
    print(f"💾 Saving to {output_path}...")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    
    print(f"✅ Quest banner v2 created!")
    print(f"📍 Location: {output_path}")
    print(f"📏 Size: {WIDTH}x{HEIGHT}")
    print(f"🎞️ Frames: {FRAMES}")

if __name__ == "__main__":
    create_quest_banner()
