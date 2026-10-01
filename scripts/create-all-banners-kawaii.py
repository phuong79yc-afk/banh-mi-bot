"""
Create kawaii chibi style banners - SUPER CUTE VERSION!
Big ears, big eyes, chubby characters
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80
TAU = 2 * math.pi

# Vibrant pastel colors
PINK = (255, 182, 193)
LAVENDER = (216, 191, 216)
MINT = (189, 252, 201)
PEACH = (255, 218, 185)
SKY = (173, 216, 230)
YELLOW = (255, 253, 208)
WHITE = (255, 255, 255)
DARK = (80, 60, 90)

def create_gradient_bg(width, height, colors):
    """Create vibrant gradient with multiple colors"""
    img = Image.new('RGB', (width, height))
    for y in range(height):
        ratio = y / height
        if ratio < 0.5:
            t = ratio * 2
            c1, c2 = colors[0], colors[1]
        else:
            t = (ratio - 0.5) * 2
            c1, c2 = colors[1], colors[2]
        
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        
        for x in range(width):
            # Add subtle horizontal gradient
            x_ratio = x / width * 0.1
            r = int(min(255, r + r * x_ratio))
            g = int(min(255, g + g * x_ratio))
            b = int(min(255, b + b * x_ratio))
            img.putpixel((x, y), (r, g, b))
    return img

def draw_kawaii_character(size, face_color, cheek_color, animal='cat', accessory=None, blink=False):
    """Draw SUPER KAWAII chibi character"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    radius = size // 2 - 8
    
    # BIGGER EARS - draw first
    if animal == 'cat':
        # HUGE cat triangle ears
        for sx in (-1, 1):
            # Outer ear
            ear_pts = [
                (center + sx * 15, center - radius + 5),
                (center + sx * 35, center - radius - 25),
                (center + sx * 5, center - radius + 8)
            ]
            draw.polygon(ear_pts, fill=face_color, outline=DARK, width=3)
            
            # Inner pink ear
            inner_pts = [
                (center + sx * 15, center - radius + 5),
                (center + sx * 28, center - radius - 15),
                (center + sx * 10, center - radius + 7)
            ]
            draw.polygon(inner_pts, fill=cheek_color)
    
    elif animal == 'bunny':
        # SUPER LONG bunny ears
        for sx in (-1, 1):
            # Outer ear
            ear_x = center + sx * 12
            draw.ellipse([ear_x - 9, center - radius - 35, 
                         ear_x + 9, center - radius + 5],
                        fill=face_color, outline=DARK, width=3)
            # Inner ear
            draw.ellipse([ear_x - 5, center - radius - 30,
                         ear_x + 5, center - radius],
                        fill=cheek_color)
    
    elif animal == 'bear':
        # BIG round bear ears
        for sx in (-1, 1):
            ear_x = center + sx * 25
            ear_y = center - radius - 5
            # Outer ear
            draw.ellipse([ear_x - 12, ear_y - 12,
                         ear_x + 12, ear_y + 12],
                        fill=face_color, outline=DARK, width=3)
            # Inner ear
            draw.ellipse([ear_x - 7, ear_y - 7,
                         ear_x + 7, ear_y + 7],
                        fill=cheek_color)
    
    # Shadow under face
    shadow_offset = 5
    draw.ellipse([center - radius + shadow_offset, center - radius + shadow_offset, 
                  center + radius + shadow_offset, center + radius + shadow_offset],
                fill=(0, 0, 0, 30))
    
    # Main body circle
    draw.ellipse([center - radius, center - radius, center + radius, center + radius],
                fill=face_color, outline=DARK, width=4)
    
    # Gradient/highlight on body
    highlight = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(highlight)
    h_draw.ellipse([center - radius + 10, center - radius + 5, 
                    center + 5, center - 10],
                   fill=(255, 255, 255, 80))
    img.paste(highlight, (0, 0), highlight)
    
    # BIGGER EYES - Kawaii style!
    eye_y = center - 10
    eye_size = 8 if not blink else 2
    
    if blink:
        # Closed eyes (happy arcs)
        for eye_x in [center - 15, center + 15]:
            draw.arc([eye_x - 8, eye_y - 3, eye_x + 8, eye_y + 3],
                    start=0, end=180, fill=DARK, width=3)
    else:
        # BIG sparkly eyes
        for eye_x in [center - 15, center + 15]:
            # White of eye
            draw.ellipse([eye_x - eye_size, eye_y - eye_size, 
                         eye_x + eye_size, eye_y + eye_size], 
                        fill=DARK)
            # Sparkle
            draw.ellipse([eye_x - 3, eye_y - 4, eye_x - 1, eye_y - 2], 
                        fill=WHITE)
            draw.ellipse([eye_x + 1, eye_y + 2, eye_x + 2, eye_y + 3], 
                        fill=WHITE)
    
    # Cute small nose
    draw.ellipse([center - 2, center + 2, center + 2, center + 6], fill=DARK)
    
    # HAPPY MOUTH - wider smile
    mouth_y = center + 5
    draw.arc([center - 12, mouth_y - 5, center + 12, mouth_y + 10],
            start=0, end=180, fill=DARK, width=3)
    
    # Tiny tongue (optional cute detail)
    if not blink:
        draw.ellipse([center - 3, mouth_y + 3, center + 3, mouth_y + 7], 
                    fill=(255, 150, 150))
    
    # BIG BLUSH CHEEKS
    for cheek_x in [center - 24, center + 24]:
        draw.ellipse([cheek_x - 9, center + 5, cheek_x + 9, center + 13], 
                    fill=(*cheek_color, 150), outline=None)
    
    # ACCESSORIES - bigger and cuter!
    if accessory == 'gift':
        gx, gy = size - 32, 8
        # Gift box
        draw.rectangle([gx, gy, gx + 26, gy + 24], fill=(255, 100, 150), outline=DARK, width=2)
        # Ribbon
        draw.rectangle([gx + 11, gy, gx + 15, gy + 24], fill=YELLOW, width=2)
        draw.rectangle([gx, gy + 10, gx + 26, gy + 14], fill=YELLOW, width=2)
        # Bow on top
        bow_pts = [(gx + 13, gy - 8), (gx + 5, gy - 2), (gx + 13, gy + 2)]
        draw.polygon(bow_pts, fill=YELLOW, outline=DARK, width=2)
        bow_pts2 = [(gx + 13, gy - 8), (gx + 21, gy - 2), (gx + 13, gy + 2)]
        draw.polygon(bow_pts2, fill=YELLOW, outline=DARK, width=2)
        # Sparkle
        draw.line([gx + 24, gy + 4, gx + 28, gy + 4], fill=WHITE, width=2)
        draw.line([gx + 26, gy + 2, gx + 26, gy + 6], fill=WHITE, width=2)
    
    elif accessory == 'coin':
        cx, cy = size - 24, 18
        # Gold coin with shine
        draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], 
                    fill=(255, 215, 0), outline=DARK, width=3)
        # Inner circle
        draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], 
                    fill=(255, 230, 100), outline=DARK, width=2)
        # Star symbol
        for angle in range(0, 360, 72):
            rad = math.radians(angle - 90)
            x1, y1 = cx + 6 * math.cos(rad), cy + 6 * math.sin(rad)
            draw.line([cx, cy, x1, y1], fill=DARK, width=2)
        # Shine
        draw.ellipse([cx - 4, cy - 6, cx - 1, cy - 3], fill=WHITE)
    
    elif accessory == 'calendar':
        cx, cy = size - 28, 12
        # Calendar page
        draw.rectangle([cx, cy, cx + 22, cy + 26], fill=WHITE, outline=DARK, width=2)
        # Header bar
        draw.rectangle([cx, cy, cx + 22, cy + 8], fill=(255, 100, 120), outline=None)
        # Rings
        for rx in [cx + 5, cx + 17]:
            draw.ellipse([rx - 2, cy - 3, rx + 2, cy + 1], fill=DARK)
        # Date number
        draw.text((cx + 5, cy + 11), "24", fill=DARK, font=None)
    
    elif accessory == 'flame':
        fx, fy = size - 24, 12
        # Flame layers
        draw.ellipse([fx - 10, fy + 10, fx + 10, fy + 28], 
                    fill=(255, 100, 0), outline=DARK, width=2)
        draw.ellipse([fx - 7, fy + 5, fx + 7, fy + 20], 
                    fill=(255, 180, 0))
        draw.ellipse([fx - 4, fy + 2, fx + 4, fy + 15], 
                    fill=YELLOW)
        draw.ellipse([fx - 2, fy, fx + 2, fy + 8], 
                    fill=WHITE)
    
    elif accessory == 'trophy':
        tx, ty = size - 26, 10
        # Trophy cup
        draw.ellipse([tx + 5, ty, tx + 15, ty + 6], fill=(255, 215, 0), outline=DARK, width=2)
        draw.rectangle([tx + 7, ty + 3, tx + 13, ty + 16], fill=(255, 215, 0), outline=DARK, width=2)
        # Handles
        draw.arc([tx, ty + 4, tx + 8, ty + 12], start=270, end=90, fill=DARK, width=2)
        draw.arc([tx + 12, ty + 4, tx + 20, ty + 12], start=90, end=270, fill=DARK, width=2)
        # Base
        draw.rectangle([tx + 5, ty + 16, tx + 15, ty + 20], fill=(255, 215, 0), outline=DARK, width=2)
        # Star
        draw.ellipse([tx + 8, ty + 7, tx + 12, ty + 11], fill=WHITE)
    
    elif accessory == 'checkmark':
        # Big checkmark
        cx, cy = size - 24, 16
        draw.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], 
                    fill=(100, 255, 150), outline=DARK, width=3)
        # Check
        draw.line([cx - 6, cy, cx - 2, cy + 6], fill=DARK, width=4)
        draw.line([cx - 2, cy + 6, cx + 8, cy - 6], fill=DARK, width=4)
    
    elif accessory == 'star':
        # Sparkly star
        sx, sy = size - 24, 16
        points = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = 14 if i % 2 == 0 else 6
            points.append((sx + r * math.cos(angle), sy + r * math.sin(angle)))
        draw.polygon(points, fill=YELLOW, outline=DARK, width=2)
        # Center shine
        draw.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=WHITE)
    
    return img

def draw_sparkle(size=20, color=WHITE):
    """Draw animated sparkle"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    
    # Cross sparkle
    draw.line([center, 2, center, size - 2], fill=color, width=4)
    draw.line([2, center, size - 2, center], fill=color, width=4)
    draw.line([6, 6, size - 6, size - 6], fill=color, width=3)
    draw.line([size - 6, 6, 6, size - 6], fill=color, width=3)
    
    return img

def create_shop_banner():
    """KAWAII SHOP BANNER"""
    print("🎀 Creating KAWAII SHOP banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Purple gradient
        img = create_gradient_bg(WIDTH, HEIGHT, 
                                [(160, 130, 200), (200, 170, 230), (230, 200, 255)])
        img = img.convert('RGBA')
        
        # MORE sparkles!
        for j in range(25):
            sparkle_frame = (i + j * 2) % FRAMES
            alpha = int(80 + 175 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(18, WHITE)
            sparkle.putalpha(alpha)
            x = 20 + (j * 55) % (WIDTH - 40)
            y = 15 + (j * 25) % (HEIGHT - 30)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters - BIGGER and CUTER!
        char_size = 95
        y_base = HEIGHT // 2 - char_size // 2 + 5
        
        bounce1 = int(10 * abs(math.sin(TAU * t)))
        bounce2 = int(10 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(10 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.85 <= t < 0.93
        
        # Cat with gift
        char1 = draw_kawaii_character(char_size, LAVENDER, (230, 180, 230), 'cat', 'gift', blink)
        img.paste(char1, (50, y_base - bounce1), char1)
        
        # Bunny with coin
        char2 = draw_kawaii_character(char_size, PINK, (255, 150, 170), 'bunny', 'coin', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        # Bear with gift
        char3 = draw_kawaii_character(char_size, MINT, (150, 255, 180), 'bear', 'gift', blink)
        img.paste(char3, (WIDTH - char_size - 50, y_base - bounce3), char3)
        
        # Text with better styling
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 80)
            subtitle_font = ImageFont.truetype(font_path, 26)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "SHOP"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 20
        
        # Multi-layer shadow
        for offset in range(5, 0, -1):
            alpha = int(30 * (6 - offset))
            draw.text((text_x + offset, text_y + offset), text, 
                     fill=(80, 60, 100, alpha), font=font)
        
        # Main text with glow
        glow = int(200 + 55 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font, 
                 stroke_width=4, stroke_fill=DARK)
        
        subtitle = "✨ Buy Premium Roles & Items ✨"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 35
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(80, 60, 100, 120), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'shop-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:], 
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ KAWAII SHOP banner created!")

def create_daily_banner():
    """KAWAII DAILY BANNER"""
    print("🎀 Creating KAWAII DAILY banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Blue-sky gradient
        img = create_gradient_bg(WIDTH, HEIGHT,
                                [(140, 180, 255), (180, 210, 255), (210, 230, 255)])
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(25):
            sparkle_frame = (i + j * 2) % FRAMES
            alpha = int(80 + 175 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(18, (255, 255, 200))
            sparkle.putalpha(alpha)
            x = 20 + (j * 55) % (WIDTH - 40)
            y = 15 + (j * 25) % (HEIGHT - 30)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters
        char_size = 95
        y_base = HEIGHT // 2 - char_size // 2 + 5
        
        bounce1 = int(10 * abs(math.sin(TAU * t)))
        bounce2 = int(10 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(10 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.85 <= t < 0.93
        
        # Bear with calendar
        char1 = draw_kawaii_character(char_size, SKY, (150, 200, 255), 'bear', 'calendar', blink)
        img.paste(char1, (50, y_base - bounce1), char1)
        
        # Cat with flame
        char2 = draw_kawaii_character(char_size, PEACH, (255, 180, 140), 'cat', 'flame', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        # Bunny with coin
        char3 = draw_kawaii_character(char_size, YELLOW, (255, 240, 150), 'bunny', 'coin', blink)
        img.paste(char3, (WIDTH - char_size - 50, y_base - bounce3), char3)
        
        # Text
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 80)
            subtitle_font = ImageFont.truetype(font_path, 26)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "DAILY CHECK-IN"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 20
        
        # Shadow
        for offset in range(5, 0, -1):
            alpha = int(30 * (6 - offset))
            draw.text((text_x + offset, text_y + offset), text, 
                     fill=(60, 80, 120, alpha), font=font)
        
        glow = int(200 + 55 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=4, stroke_fill=DARK)
        
        subtitle = "🔥 Keep Your Streak Going! 💰"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 35
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(60, 80, 120, 120), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'daily-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:], 
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ KAWAII DAILY banner created!")

def create_quest_banner():
    """KAWAII QUEST BANNER"""
    print("🎀 Creating KAWAII QUEST banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Pink-purple gradient
        img = create_gradient_bg(WIDTH, HEIGHT,
                                [(255, 180, 200), (255, 200, 220), (255, 220, 240)])
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(25):
            sparkle_frame = (i + j * 2) % FRAMES
            alpha = int(80 + 175 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_sparkle(18, (255, 255, 200))
            sparkle.putalpha(alpha)
            x = 20 + (j * 55) % (WIDTH - 40)
            y = 15 + (j * 25) % (HEIGHT - 30)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters
        char_size = 95
        y_base = HEIGHT // 2 - char_size // 2 + 5
        
        bounce1 = int(10 * abs(math.sin(TAU * t)))
        bounce2 = int(10 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(10 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.85 <= t < 0.93
        
        # Cat with checkmark
        char1 = draw_kawaii_character(char_size, PINK, (255, 150, 170), 'cat', 'checkmark', blink)
        img.paste(char1, (50, y_base - bounce1), char1)
        
        # Bunny with star
        char2 = draw_kawaii_character(char_size, LAVENDER, (230, 180, 230), 'bunny', 'star', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        # Bear with trophy
        char3 = draw_kawaii_character(char_size, MINT, (150, 255, 180), 'bear', 'trophy', blink)
        img.paste(char3, (WIDTH - char_size - 50, y_base - bounce3), char3)
        
        # Text
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 80)
            subtitle_font = ImageFont.truetype(font_path, 26)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "QUESTS"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 20
        
        # Shadow
        for offset in range(5, 0, -1):
            alpha = int(30 * (6 - offset))
            draw.text((text_x + offset, text_y + offset), text, 
                     fill=(120, 80, 100, alpha), font=font)
        
        glow = int(200 + 55 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=4, stroke_fill=DARK)
        
        subtitle = "⭐ Complete Quests & Earn Rewards! 🏆"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 35
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(120, 80, 100, 120), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'quest-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:], 
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ KAWAII QUEST banner created!")

if __name__ == "__main__":
    create_shop_banner()
    create_daily_banner()
    create_quest_banner()
    print("\n🎉 ALL KAWAII BANNERS CREATED! SO CUTE! 🎀")
