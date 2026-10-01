"""
REALLY CUTE BANNERS - Simple, clean, adorable style
Bright colorful eyes, simple shapes, NOT CREEPY!
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80
TAU = 2 * math.pi

# Soft pastel colors
PINK = (255, 192, 203)
LAVENDER = (230, 200, 250)
MINT = (180, 255, 210)
PEACH = (255, 220, 190)
SKY = (150, 210, 255)
YELLOW = (255, 250, 180)
WHITE = (255, 255, 255)
DARK = (90, 70, 100)

def create_soft_gradient(width, height, c1, c2):
    """Create soft pastel gradient"""
    img = Image.new('RGB', (width, height))
    for y in range(height):
        ratio = y / height
        r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
        g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
        b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
        for x in range(width):
            img.putpixel((x, y), (r, g, b))
    return img

def draw_cute_character(size, body_color, cheek_color, eye_color, animal='cat', accessory=None, blink=False):
    """Draw simple cute character - NOT CREEPY!"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    radius = size // 2 - 8
    
    # CUTE EARS - simple and clear
    if animal == 'cat':
        # Triangle cat ears
        for sx in (-1, 1):
            # Outer ear
            ear_pts = [
                (center + sx * 16, center - radius + 5),
                (center + sx * 32, center - radius - 20),
                (center + sx * 10, center - radius + 8)
            ]
            draw.polygon(ear_pts, fill=body_color, outline=DARK, width=3)
            # Inner pink
            inner_pts = [
                (center + sx * 17, center - radius + 6),
                (center + sx * 26, center - radius - 10),
                (center + sx * 14, center - radius + 7)
            ]
            draw.polygon(inner_pts, fill=cheek_color)
    
    elif animal == 'bunny':
        # Long bunny ears
        for sx in (-1, 1):
            ear_x = center + sx * 13
            # Outer
            draw.ellipse([ear_x - 8, center - radius - 30,
                         ear_x + 8, center - radius + 5],
                        fill=body_color, outline=DARK, width=3)
            # Inner
            draw.ellipse([ear_x - 5, center - radius - 25,
                         ear_x + 5, center - radius],
                        fill=cheek_color)
    
    elif animal == 'bear':
        # Round bear ears
        for sx in (-1, 1):
            ear_x = center + sx * 25
            ear_y = center - radius - 3
            # Outer
            draw.ellipse([ear_x - 11, ear_y - 11,
                         ear_x + 11, ear_y + 11],
                        fill=body_color, outline=DARK, width=3)
            # Inner
            draw.ellipse([ear_x - 6, ear_y - 6,
                         ear_x + 6, ear_y + 6],
                        fill=cheek_color)
    
    # Body circle
    draw.ellipse([center - radius, center - radius,
                  center + radius, center + radius],
                fill=body_color, outline=DARK, width=4)
    
    # Cute highlight (not too much)
    highlight_size = radius // 3
    draw.ellipse([center - radius + 8, center - radius + 6,
                  center - radius + 8 + highlight_size, center - radius + 6 + highlight_size],
                fill=(255, 255, 255, 80))
    
    # CUTE BRIGHT EYES - colorful, NOT black!
    eye_y = center - 10
    
    if blink:
        # Happy closed eyes
        for eye_x in [center - 14, center + 14]:
            draw.arc([eye_x - 7, eye_y - 3, eye_x + 7, eye_y + 3],
                    start=0, end=180, fill=DARK, width=3)
    else:
        # Bright colorful eyes
        for eye_x in [center - 14, center + 14]:
            # White base
            draw.ellipse([eye_x - 7, eye_y - 7, eye_x + 7, eye_y + 7],
                        fill=WHITE, outline=DARK, width=2)
            # Colored iris (bright!)
            draw.ellipse([eye_x - 5, eye_y - 5, eye_x + 5, eye_y + 5],
                        fill=eye_color)
            # Small pupil
            draw.ellipse([eye_x - 2, eye_y - 2, eye_x + 2, eye_y + 2],
                        fill=DARK)
            # Sparkle
            draw.ellipse([eye_x - 4, eye_y - 5, eye_x - 2, eye_y - 3],
                        fill=WHITE)
    
    # Simple nose
    draw.ellipse([center - 2, center + 2, center + 2, center + 5],
                fill=DARK)
    
    # Happy smile
    draw.arc([center - 10, center + 2, center + 10, center + 12],
            start=0, end=180, fill=DARK, width=3)
    
    # Soft blush cheeks
    for cheek_x in [center - 22, center + 22]:
        draw.ellipse([cheek_x - 8, center + 4, cheek_x + 8, center + 12],
                    fill=(*cheek_color, 140))
    
    # SIMPLE ACCESSORIES
    if accessory == 'gift':
        gx, gy = size - 28, 12
        # Box
        draw.rectangle([gx, gy, gx + 22, gy + 20],
                      fill=(255, 120, 160), outline=DARK, width=2)
        # Ribbon
        draw.rectangle([gx + 9, gy, gx + 13, gy + 20], fill=YELLOW)
        draw.rectangle([gx, gy + 8, gx + 22, gy + 12], fill=YELLOW)
        # Bow
        draw.ellipse([gx + 4, gy - 5, gx + 10, gy + 1], fill=YELLOW, outline=DARK, width=2)
        draw.ellipse([gx + 12, gy - 5, gx + 18, gy + 1], fill=YELLOW, outline=DARK, width=2)
    
    elif accessory == 'coin':
        cx, cy = size - 22, 18
        # Gold coin
        draw.ellipse([cx - 13, cy - 13, cx + 13, cy + 13],
                    fill=(255, 215, 0), outline=DARK, width=2)
        # Star
        for angle in range(0, 360, 72):
            rad = math.radians(angle - 90)
            x1 = cx + 5 * math.cos(rad)
            y1 = cy + 5 * math.sin(rad)
            draw.line([cx, cy, x1, y1], fill=DARK, width=2)
    
    elif accessory == 'calendar':
        cx, cy = size - 26, 14
        # Page
        draw.rectangle([cx, cy, cx + 20, cy + 24],
                      fill=WHITE, outline=DARK, width=2)
        # Header
        draw.rectangle([cx, cy, cx + 20, cy + 7],
                      fill=(255, 130, 150))
        # Date dots
        for dy in [12, 18]:
            for dx in [4, 12]:
                draw.ellipse([cx + dx, cy + dy, cx + dx + 2, cy + dy + 2],
                            fill=SKY)
    
    elif accessory == 'flame':
        fx, fy = size - 22, 14
        # Fire shape
        draw.ellipse([fx - 9, fy + 6, fx + 9, fy + 22],
                    fill=(255, 120, 0), outline=DARK, width=2)
        draw.ellipse([fx - 6, fy + 2, fx + 6, fy + 16],
                    fill=(255, 180, 0))
        draw.ellipse([fx - 3, fy, fx + 3, fy + 10],
                    fill=YELLOW)
    
    elif accessory == 'trophy':
        tx, ty = size - 24, 14
        # Cup
        draw.ellipse([tx + 6, ty, tx + 14, ty + 5],
                    fill=(255, 215, 0), outline=DARK, width=2)
        draw.rectangle([tx + 8, ty + 3, tx + 12, ty + 14],
                      fill=(255, 215, 0), outline=DARK, width=2)
        # Handles
        draw.arc([tx + 2, ty + 5, tx + 8, ty + 11], start=270, end=90, fill=DARK, width=2)
        draw.arc([tx + 12, ty + 5, tx + 18, ty + 11], start=90, end=270, fill=DARK, width=2)
        # Base
        draw.rectangle([tx + 6, ty + 14, tx + 14, ty + 18],
                      fill=(255, 215, 0), outline=DARK, width=2)
    
    elif accessory == 'checkmark':
        cx, cy = size - 22, 18
        # Circle
        draw.ellipse([cx - 13, cy - 13, cx + 13, cy + 13],
                    fill=(120, 255, 160), outline=DARK, width=2)
        # Check
        draw.line([cx - 5, cy, cx - 2, cy + 5], fill=DARK, width=3)
        draw.line([cx - 2, cy + 5, cx + 6, cy - 5], fill=DARK, width=3)
    
    elif accessory == 'star':
        sx, sy = size - 22, 18
        # Star shape
        star_pts = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = 13 if i % 2 == 0 else 6
            star_pts.append((sx + r * math.cos(angle), sy + r * math.sin(angle)))
        draw.polygon(star_pts, fill=YELLOW, outline=DARK, width=2)
    
    return img

def draw_sparkle(size=18):
    """Simple sparkle"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    c = size // 2
    
    draw.line([c, 2, c, size - 2], fill=WHITE, width=3)
    draw.line([2, c, size - 2, c], fill=WHITE, width=3)
    
    return img

def create_shop_banner():
    """Cute shop banner"""
    print("💖 Creating cute SHOP banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Soft purple gradient
        img = create_soft_gradient(WIDTH, HEIGHT, (200, 170, 230), (230, 200, 250))
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(20):
            sparkle_frame = (i + j * 3) % FRAMES
            alpha = int(100 + 155 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(16)
            sparkle.putalpha(alpha)
            x = 25 + (j * 55) % (WIDTH - 50)
            y = 18 + (j * 28) % (HEIGHT - 36)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters
        char_size = 90
        y_base = HEIGHT // 2 - char_size // 2 + 5
        
        bounce1 = int(10 * abs(math.sin(TAU * t)))
        bounce2 = int(10 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(10 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.85 <= t < 0.92
        
        # Cat (purple eyes)
        char1 = draw_cute_character(char_size, LAVENDER, (240, 200, 255), (180, 140, 255), 'cat', 'gift', blink)
        img.paste(char1, (50, y_base - bounce1), char1)
        
        # Bunny (pink eyes)
        char2 = draw_cute_character(char_size, PINK, (255, 160, 180), (255, 120, 150), 'bunny', 'coin', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        # Bear (green eyes)
        char3 = draw_cute_character(char_size, MINT, (150, 255, 180), (100, 220, 150), 'bear', 'gift', blink)
        img.paste(char3, (WIDTH - char_size - 50, y_base - bounce3), char3)
        
        # Text
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 75)
            subtitle_font = ImageFont.truetype(font_path, 25)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "SHOP"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 22
        
        # Shadow
        draw.text((text_x + 4, text_y + 4), text, fill=(80, 60, 100, 150), font=font)
        
        # Main text
        glow = int(200 + 55 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=4, stroke_fill=DARK)
        
        subtitle = "✨ Buy Premium Roles & Items ✨"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 36
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(80, 60, 100, 120), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'shop-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print("✅ Cute SHOP created!")

def create_daily_banner():
    """Cute daily banner"""
    print("💖 Creating cute DAILY banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Soft blue gradient
        img = create_soft_gradient(WIDTH, HEIGHT, (160, 200, 255), (200, 230, 255))
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(20):
            sparkle_frame = (i + j * 3) % FRAMES
            alpha = int(100 + 155 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(16)
            sparkle.putalpha(alpha)
            x = 25 + (j * 55) % (WIDTH - 50)
            y = 18 + (j * 28) % (HEIGHT - 36)
            img.paste(sparkle, (x, y), sparkle)
        
        char_size = 90
        y_base = HEIGHT // 2 - char_size // 2 + 5
        
        bounce1 = int(10 * abs(math.sin(TAU * t)))
        bounce2 = int(10 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(10 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.85 <= t < 0.92
        
        # Bear (blue eyes)
        char1 = draw_cute_character(char_size, SKY, (140, 200, 255), (100, 170, 255), 'bear', 'calendar', blink)
        img.paste(char1, (50, y_base - bounce1), char1)
        
        # Cat (orange eyes)
        char2 = draw_cute_character(char_size, PEACH, (255, 190, 150), (255, 150, 100), 'cat', 'flame', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        # Bunny (yellow eyes)
        char3 = draw_cute_character(char_size, YELLOW, (255, 240, 150), (255, 200, 100), 'bunny', 'coin', blink)
        img.paste(char3, (WIDTH - char_size - 50, y_base - bounce3), char3)
        
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 75)
            subtitle_font = ImageFont.truetype(font_path, 25)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "DAILY CHECK-IN"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 22
        
        draw.text((text_x + 4, text_y + 4), text, fill=(60, 80, 120, 150), font=font)
        
        glow = int(200 + 55 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=4, stroke_fill=DARK)
        
        subtitle = "🔥 Keep Your Streak Going! 💰"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 36
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(60, 80, 120, 120), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'daily-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print("✅ Cute DAILY created!")

def create_quest_banner():
    """Cute quest banner"""
    print("💖 Creating cute QUEST banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Soft pink gradient
        img = create_soft_gradient(WIDTH, HEIGHT, (255, 190, 210), (255, 220, 235))
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(20):
            sparkle_frame = (i + j * 3) % FRAMES
            alpha = int(100 + 155 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(16)
            sparkle.putalpha(alpha)
            x = 25 + (j * 55) % (WIDTH - 50)
            y = 18 + (j * 28) % (HEIGHT - 36)
            img.paste(sparkle, (x, y), sparkle)
        
        char_size = 90
        y_base = HEIGHT // 2 - char_size // 2 + 5
        
        bounce1 = int(10 * abs(math.sin(TAU * t)))
        bounce2 = int(10 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(10 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.85 <= t < 0.92
        
        # Cat (pink eyes)
        char1 = draw_cute_character(char_size, PINK, (255, 160, 180), (255, 120, 160), 'cat', 'checkmark', blink)
        img.paste(char1, (50, y_base - bounce1), char1)
        
        # Bunny (purple eyes)
        char2 = draw_cute_character(char_size, LAVENDER, (240, 200, 255), (200, 150, 255), 'bunny', 'star', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        # Bear (mint eyes)
        char3 = draw_cute_character(char_size, MINT, (150, 255, 180), (100, 230, 160), 'bear', 'trophy', blink)
        img.paste(char3, (WIDTH - char_size - 50, y_base - bounce3), char3)
        
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 75)
            subtitle_font = ImageFont.truetype(font_path, 25)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "QUESTS"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 22
        
        draw.text((text_x + 4, text_y + 4), text, fill=(100, 70, 90, 150), font=font)
        
        glow = int(200 + 55 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=4, stroke_fill=DARK)
        
        subtitle = "⭐ Complete Quests & Earn Rewards! 🏆"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 36
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(100, 70, 90, 120), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'quest-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print("✅ Cute QUEST created!")

if __name__ == "__main__":
    create_shop_banner()
    create_daily_banner()
    create_quest_banner()
    print("\n🎉 ALL CUTE BANNERS DONE - Simple & Adorable! 💖")
