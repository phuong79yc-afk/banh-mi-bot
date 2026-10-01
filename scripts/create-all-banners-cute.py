"""
Create all banners with cute round characters style
Matching the pastel gradient style with adorable characters
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80
TAU = 2 * math.pi

# Pastel color palette
PINK = (255, 179, 199)
LAVENDER = (206, 185, 255)
MINT = (180, 240, 214)
PEACH = (255, 203, 164)
SKY = (168, 218, 255)
YELLOW = (255, 236, 154)
WHITE = (255, 255, 255)
OUTLINE = (91, 69, 112)

def create_gradient_bg(width, height, color1, color2):
    """Create soft pastel gradient"""
    img = Image.new('RGB', (width, height))
    for y in range(height):
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        for x in range(width):
            img.putpixel((x, y), (r, g, b))
    return img

def draw_round_character(size, face_color, cheek_color, accessory=None, acc_param=None, animal='cat'):
    """Draw cute round character with animal ears"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    radius = size // 2 - 4
    
    # Animal ears BEFORE body
    if animal == 'cat':
        # Cat triangle ears
        for sx in (-1, 1):
            ear_pts = [(center + sx * 13, center - radius), 
                      (center + sx * 25, center - radius - 15),
                      (center + sx * 9, center - radius + 5)]
            draw.polygon(ear_pts, fill=face_color, outline=OUTLINE, width=3)
            # Inner ear
            inner_pts = [(center + sx * 14, center - radius + 2),
                        (center + sx * 20, center - radius - 8),
                        (center + sx * 12, center - radius + 5)]
            draw.polygon(inner_pts, fill=cheek_color, outline=None)
    
    elif animal == 'bunny':
        # Long bunny ears
        for sx in (-1, 1):
            draw.ellipse([center + sx * 10 - 6, center - radius - 25, 
                         center + sx * 10 + 6, center - radius + 5],
                        fill=face_color, outline=OUTLINE, width=3)
            # Inner ear
            draw.ellipse([center + sx * 10 - 3, center - radius - 20,
                         center + sx * 10 + 3, center - radius + 2],
                        fill=cheek_color, outline=None)
    
    elif animal == 'bear':
        # Round bear ears
        for sx in (-1, 1):
            draw.ellipse([center + sx * 20 - 8, center - radius - 8,
                         center + sx * 20 + 8, center - radius + 8],
                        fill=face_color, outline=OUTLINE, width=3)
            # Inner ear
            draw.ellipse([center + sx * 20 - 4, center - radius - 4,
                         center + sx * 20 + 4, center - radius + 4],
                        fill=cheek_color, outline=None)
    
    elif animal == 'frog':
        # Frog eyes on top
        for sx in (-1, 1):
            draw.ellipse([center + sx * 15 - 8, center - radius - 10,
                         center + sx * 15 + 8, center - radius + 6],
                        fill=face_color, outline=OUTLINE, width=3)
            # Eye
            draw.ellipse([center + sx * 15 - 4, center - radius - 6,
                         center + sx * 15 + 4, center - radius + 2],
                        fill=OUTLINE)
    
    # Body circle
    draw.ellipse([center - radius, center - radius, center + radius, center + radius],
                fill=face_color, outline=OUTLINE, width=3)
    
    # Eyes (skip if frog - eyes are on top)
    if animal != 'frog':
        eye_y = center - 8
        if acc_param and acc_param.get('blink'):
            for eye_x in [center - 12, center + 12]:
                draw.arc([eye_x - 4, eye_y - 2, eye_x + 4, eye_y + 2],
                        start=0, end=180, fill=OUTLINE, width=2)
        else:
            for eye_x in [center - 12, center + 12]:
                draw.ellipse([eye_x - 3, eye_y - 3, eye_x + 3, eye_y + 3], fill=OUTLINE)
    
    # Mouth (happy)
    draw.arc([center - 10, center - 5, center + 10, center + 8],
            start=0, end=180, fill=OUTLINE, width=2)
    
    # Cheeks
    for cheek_x in [center - 20, center + 20]:
        draw.ellipse([cheek_x - 6, center + 2, cheek_x + 6, center + 8], fill=cheek_color)
    
    # Accessories
    if accessory == 'gift':
        # Gift box
        gx, gy = size - 28, 8
        draw.rectangle([gx, gy, gx + 20, gy + 18], fill=PINK, outline=OUTLINE, width=2)
        draw.rectangle([gx + 8, gy, gx + 12, gy + 18], fill=YELLOW, width=2)
        draw.rectangle([gx, gy + 7, gx + 20, gy + 11], fill=YELLOW, width=2)
        # Bow
        draw.ellipse([gx + 3, gy - 6, gx + 9, gy], fill=YELLOW, outline=OUTLINE, width=2)
        draw.ellipse([gx + 11, gy - 6, gx + 17, gy], fill=YELLOW, outline=OUTLINE, width=2)
    
    elif accessory == 'coin':
        # Gold coin
        cx, cy = size - 20, 15
        draw.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=YELLOW, outline=OUTLINE, width=2)
        # Dollar sign or star
        pts = []
        for i in range(8):
            angle = math.radians(i * 45 - 90)
            r = 5 if i % 2 == 0 else 3
            pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        draw.polygon(pts, fill=WHITE)
    
    elif accessory == 'calendar':
        # Calendar
        cx, cy = size - 24, 12
        draw.rectangle([cx, cy, cx + 18, cy + 20], fill=WHITE, outline=OUTLINE, width=2)
        draw.rectangle([cx, cy, cx + 18, cy + 6], fill=PINK, outline=None)
        # Date dots
        for dy in [10, 16]:
            for dx in [4, 10]:
                draw.ellipse([cx + dx, cy + dy, cx + dx + 2, cy + dy + 2], fill=SKY)
    
    elif accessory == 'flame':
        # Flame
        fx, fy = size - 20, 10
        # Fire shape
        draw.ellipse([fx - 8, fy + 8, fx + 8, fy + 20], fill=(255, 140, 0), outline=OUTLINE, width=2)
        draw.ellipse([fx - 5, fy, fx + 5, fy + 14], fill=YELLOW, outline=None)
        draw.ellipse([fx - 3, fy + 2, fx + 3, fy + 10], fill=WHITE, outline=None)
    
    return img

def draw_sparkle(size=20):
    """Draw sparkle/star"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    
    draw.line([center, 2, center, size - 2], fill=WHITE, width=3)
    draw.line([2, center, size - 2, center], fill=WHITE, width=3)
    draw.line([5, 5, size - 5, size - 5], fill=WHITE, width=2)
    draw.line([size - 5, 5, 5, size - 5], fill=WHITE, width=2)
    
    return img

def create_shop_banner():
    """Shop banner with cute characters"""
    print("🎨 Creating SHOP banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Purple gradient
        img = create_gradient_bg(WIDTH, HEIGHT, (180, 150, 200), (220, 200, 240))
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(15):
            sparkle_frame = (i + j * 3) % FRAMES
            alpha = int(100 + 155 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(15)
            sparkle.putalpha(alpha)
            x = 30 + (j * 60) % (WIDTH - 60)
            y = 20 + (j * 30) % (HEIGHT - 40)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters
        char_size = 80
        y_base = HEIGHT // 2 - char_size // 2
        
        bounce1 = int(8 * abs(math.sin(TAU * t)))
        bounce2 = int(8 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(8 * abs(math.sin(TAU * (t + 0.66))))
        
        char1 = draw_round_character(char_size, LAVENDER, (180, 160, 220), 'gift', None, 'cat')
        img.paste(char1, (60, y_base - bounce1), char1)
        
        char2 = draw_round_character(char_size, PINK, (255, 160, 180), 'coin', None, 'bunny')
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        char3 = draw_round_character(char_size, MINT, (150, 220, 190), 'gift', None, 'bear')
        img.paste(char3, (WIDTH - 140, y_base - bounce3), char3)
        
        # Text
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 70)
            subtitle_font = ImageFont.truetype(font_path, 24)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "SHOP"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 25
        
        draw.text((text_x + 3, text_y + 3), text, fill=(100, 80, 120, 200), font=font)
        draw.text((text_x, text_y), text, fill=WHITE, font=font, stroke_width=3, stroke_fill=OUTLINE)
        
        subtitle = "✨ Buy Premium Roles & Items ✨"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 40
        
        glow = int(180 + 75 * abs(math.sin(TAU * (t + 0.2))))
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(100, 80, 120, 150), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'assets', 'banners', 'shop-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:], 
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ SHOP banner created!")

def create_daily_banner():
    """Daily banner with cute characters"""
    print("🎨 Creating DAILY banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Blue gradient
        img = create_gradient_bg(WIDTH, HEIGHT, (150, 180, 240), (200, 220, 255))
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(15):
            sparkle_frame = (i + j * 3) % FRAMES
            alpha = int(100 + 155 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(15)
            sparkle.putalpha(alpha)
            x = 30 + (j * 60) % (WIDTH - 60)
            y = 20 + (j * 30) % (HEIGHT - 40)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters
        char_size = 80
        y_base = HEIGHT // 2 - char_size // 2
        
        bounce1 = int(8 * abs(math.sin(TAU * t)))
        bounce2 = int(8 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(8 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.83 <= t < 0.92
        
        char1 = draw_round_character(char_size, SKY, (140, 190, 240), 'calendar', {'blink': blink}, 'bear')
        img.paste(char1, (60, y_base - bounce1), char1)
        
        char2 = draw_round_character(char_size, PEACH, (255, 180, 140), 'flame', None, 'cat')
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        char3 = draw_round_character(char_size, YELLOW, (255, 220, 120), 'coin', None, 'bunny')
        img.paste(char3, (WIDTH - 140, y_base - bounce3), char3)
        
        # Text
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 70)
            subtitle_font = ImageFont.truetype(font_path, 24)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "DAILY CHECK-IN"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 25
        
        draw.text((text_x + 3, text_y + 3), text, fill=(100, 80, 120, 200), font=font)
        draw.text((text_x, text_y), text, fill=WHITE, font=font, stroke_width=3, stroke_fill=OUTLINE)
        
        subtitle = "🔥 Keep Your Streak Going! 💰"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 40
        
        glow = int(180 + 75 * abs(math.sin(TAU * (t + 0.2))))
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(100, 80, 120, 150), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'assets', 'banners', 'daily-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:], 
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ DAILY banner created!")

if __name__ == "__main__":
    create_shop_banner()
    create_daily_banner()
    print("\n🎉 All banners created successfully!")
