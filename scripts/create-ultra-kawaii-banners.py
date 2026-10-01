"""
ULTRA KAWAII BANNERS - MAXIMUM CUTENESS!
Huge ears, giant eyes, 3D fluffy style, vibrant colors
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

WIDTH = 800
HEIGHT = 200
FRAMES = 30
FRAME_DURATION = 80
TAU = 2 * math.pi

# Super vibrant pastel colors
PINK = (255, 192, 203)
LAVENDER = (230, 190, 255)
MINT = (170, 255, 195)
PEACH = (255, 218, 185)
SKY = (135, 206, 250)
YELLOW = (255, 255, 150)
WHITE = (255, 255, 255)
DARK = (70, 50, 80)

def create_vibrant_gradient(width, height, colors):
    """Create super vibrant multi-color gradient"""
    img = Image.new('RGB', (width, height))
    for y in range(height):
        ratio = y / height
        # 3-color gradient
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
            # Add radial brightness
            dx = (x - width // 2) / width
            dy = (y - height // 2) / height
            dist = math.sqrt(dx * dx + dy * dy)
            brightness = 1 + 0.15 * (1 - dist)
            
            r = int(min(255, r * brightness))
            g = int(min(255, g * brightness))
            b = int(min(255, b * brightness))
            img.putpixel((x, y), (r, g, b))
    return img

def draw_ultra_kawaii(size, face_color, cheek_color, animal='cat', accessory=None, blink=False):
    """Draw ULTRA KAWAII character with MAXIMUM cuteness"""
    # Create larger canvas for big ears
    canvas_size = int(size * 1.4)
    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center_x = canvas_size // 2
    center_y = canvas_size // 2 + int(size * 0.1)  # Shift down for ears
    radius = size // 2 - 6
    
    # HUGE EARS FIRST!
    if animal == 'cat':
        # MASSIVE cat ears
        for sx in (-1, 1):
            # Shadow for 3D effect
            shadow_pts = [
                (center_x + sx * 18 + 3, center_y - radius + 8 + 3),
                (center_x + sx * 45 + 3, center_y - radius - 35 + 3),
                (center_x + sx * 8 + 3, center_y - radius + 10 + 3)
            ]
            draw.polygon(shadow_pts, fill=(0, 0, 0, 40))
            
            # Outer ear
            ear_pts = [
                (center_x + sx * 18, center_y - radius + 8),
                (center_x + sx * 45, center_y - radius - 35),
                (center_x + sx * 8, center_y - radius + 10)
            ]
            draw.polygon(ear_pts, fill=face_color, outline=DARK, width=4)
            
            # Inner pink ear - BIGGER
            inner_pts = [
                (center_x + sx * 18, center_y - radius + 8),
                (center_x + sx * 38, center_y - radius - 22),
                (center_x + sx * 12, center_y - radius + 10)
            ]
            draw.polygon(inner_pts, fill=cheek_color)
            
            # Ear highlight for 3D
            highlight_pts = [
                (center_x + sx * 20, center_y - radius + 2),
                (center_x + sx * 28, center_y - radius - 15),
                (center_x + sx * 22, center_y - radius)
            ]
            draw.polygon(highlight_pts, fill=(255, 255, 255, 100))
    
    elif animal == 'bunny':
        # SUPER LONG bunny ears
        for sx in (-1, 1):
            ear_x = center_x + sx * 15
            
            # Shadow
            draw.ellipse([ear_x - 11 + 3, center_y - radius - 50 + 3,
                         ear_x + 11 + 3, center_y - radius + 8 + 3],
                        fill=(0, 0, 0, 40))
            
            # Outer ear
            draw.ellipse([ear_x - 11, center_y - radius - 50,
                         ear_x + 11, center_y - radius + 8],
                        fill=face_color, outline=DARK, width=4)
            
            # Inner ear - BIGGER
            draw.ellipse([ear_x - 7, center_y - radius - 45,
                         ear_x + 7, center_y - radius - 5],
                        fill=cheek_color)
            
            # Highlight
            draw.ellipse([ear_x - 4, center_y - radius - 42,
                         ear_x + 1, center_y - radius - 30],
                        fill=(255, 255, 255, 120))
    
    elif animal == 'bear':
        # HUGE round bear ears
        for sx in (-1, 1):
            ear_x = center_x + sx * 30
            ear_y = center_y - radius - 8
            
            # Shadow
            draw.ellipse([ear_x - 16 + 3, ear_y - 16 + 3,
                         ear_x + 16 + 3, ear_y + 16 + 3],
                        fill=(0, 0, 0, 40))
            
            # Outer ear
            draw.ellipse([ear_x - 16, ear_y - 16,
                         ear_x + 16, ear_y + 16],
                        fill=face_color, outline=DARK, width=4)
            
            # Inner ear - BIGGER
            draw.ellipse([ear_x - 10, ear_y - 10,
                         ear_x + 10, ear_y + 10],
                        fill=cheek_color)
            
            # Highlight
            draw.ellipse([ear_x - 8, ear_y - 10,
                         ear_x - 2, ear_y - 4],
                        fill=(255, 255, 255, 150))
    
    # Body shadow (3D effect)
    draw.ellipse([center_x - radius + 5, center_y - radius + 5,
                  center_x + radius + 5, center_y + radius + 5],
                fill=(0, 0, 0, 50))
    
    # Main body
    draw.ellipse([center_x - radius, center_y - radius,
                  center_x + radius, center_y + radius],
                fill=face_color, outline=DARK, width=5)
    
    # Gradient highlight on body (3D sphere effect)
    highlight = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(highlight)
    
    # Top-left highlight
    h_draw.ellipse([center_x - radius + 8, center_y - radius + 5,
                    center_x - 5, center_y - 15],
                   fill=(255, 255, 255, 100))
    
    # Soft glow around
    for i in range(3):
        alpha = 30 - i * 10
        offset = i * 2
        h_draw.ellipse([center_x - radius - offset, center_y - radius - offset,
                       center_x + radius + offset, center_y + radius + offset],
                      outline=(255, 255, 255, alpha), width=2)
    
    img.paste(highlight, (0, 0), highlight)
    
    # GIANT KAWAII EYES!
    eye_y = center_y - 12
    eye_size = 11  # HUGE!
    
    if blink:
        # Happy closed eyes
        for eye_x in [center_x - 18, center_x + 18]:
            # Thick happy arcs
            draw.arc([eye_x - 10, eye_y - 4, eye_x + 10, eye_y + 4],
                    start=0, end=180, fill=DARK, width=4)
    else:
        # HUGE sparkly eyes
        for eye_x in [center_x - 18, center_x + 18]:
            # White background
            draw.ellipse([eye_x - eye_size - 1, eye_y - eye_size - 1,
                         eye_x + eye_size + 1, eye_y + eye_size + 1],
                        fill=WHITE)
            
            # Black pupil
            draw.ellipse([eye_x - eye_size, eye_y - eye_size,
                         eye_x + eye_size, eye_y + eye_size],
                        fill=DARK)
            
            # Big white sparkle
            draw.ellipse([eye_x - 5, eye_y - 6, eye_x - 1, eye_y - 2],
                        fill=WHITE)
            
            # Small sparkle
            draw.ellipse([eye_x + 2, eye_y + 3, eye_x + 4, eye_y + 5],
                        fill=WHITE)
            
            # Tiny sparkle
            draw.rectangle([eye_x + 4, eye_y - 4, eye_x + 5, eye_y - 3],
                          fill=WHITE)
    
    # Cute nose
    draw.ellipse([center_x - 3, center_y + 3, center_x + 3, center_y + 8],
                fill=DARK)
    
    # BIG happy smile
    draw.arc([center_x - 15, center_y + 3, center_x + 15, center_y + 18],
            start=0, end=180, fill=DARK, width=4)
    
    # Little tongue (super cute!)
    if not blink:
        draw.ellipse([center_x - 4, center_y + 10, center_x + 4, center_y + 16],
                    fill=(255, 150, 150))
        draw.ellipse([center_x - 3, center_y + 11, center_x + 3, center_y + 15],
                    fill=(255, 180, 180))
    
    # HUGE blush cheeks with gradient
    for cheek_x in [center_x - 28, center_x + 28]:
        # Outer blush
        draw.ellipse([cheek_x - 12, center_y + 6, cheek_x + 12, center_y + 16],
                    fill=(*cheek_color, 120))
        # Inner blush
        draw.ellipse([cheek_x - 8, center_y + 8, cheek_x + 8, center_y + 14],
                    fill=(*cheek_color, 180))
    
    # ACCESSORIES - BIGGER and cuter!
    if accessory == 'gift':
        gx, gy = canvas_size - 45, 15
        # Shadow
        draw.rectangle([gx + 3, gy + 3, gx + 33, gy + 33], fill=(0, 0, 0, 40))
        # Box
        draw.rectangle([gx, gy, gx + 30, gy + 30], fill=(255, 100, 150), outline=DARK, width=3)
        # Ribbons
        draw.rectangle([gx + 12, gy, gx + 18, gy + 30], fill=YELLOW)
        draw.rectangle([gx, gy + 12, gx + 30, gy + 18], fill=YELLOW)
        # Big bow
        bow_pts = [(gx + 15, gy - 10), (gx + 5, gy), (gx + 15, gy + 5)]
        draw.polygon(bow_pts, fill=YELLOW, outline=DARK, width=2)
        bow_pts2 = [(gx + 15, gy - 10), (gx + 25, gy), (gx + 15, gy + 5)]
        draw.polygon(bow_pts2, fill=YELLOW, outline=DARK, width=2)
        # Sparkles
        for i in range(3):
            sx, sy = gx + 28 + i * 3, gy + 5 + i * 8
            draw.line([sx - 3, sy, sx + 3, sy], fill=WHITE, width=2)
            draw.line([sx, sy - 3, sx, sy + 3], fill=WHITE, width=2)
    
    elif accessory == 'coin':
        cx, cy = canvas_size - 35, 25
        # Shadow
        draw.ellipse([cx - 18 + 3, cy - 18 + 3, cx + 18 + 3, cy + 18 + 3],
                    fill=(0, 0, 0, 40))
        # Gold coin
        draw.ellipse([cx - 18, cy - 18, cx + 18, cy + 18],
                    fill=(255, 215, 0), outline=DARK, width=3)
        # Inner ring
        draw.ellipse([cx - 14, cy - 14, cx + 14, cy + 14],
                    fill=(255, 235, 100), outline=DARK, width=2)
        # Star in center
        star_pts = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = 8 if i % 2 == 0 else 4
            star_pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        draw.polygon(star_pts, fill=DARK)
        # Shine
        draw.ellipse([cx - 6, cy - 8, cx - 2, cy - 4], fill=WHITE)
    
    elif accessory == 'calendar':
        cx, cy = canvas_size - 40, 18
        # Shadow
        draw.rectangle([cx + 3, cy + 3, cx + 31, cy + 35], fill=(0, 0, 0, 40))
        # Page
        draw.rectangle([cx, cy, cx + 28, cy + 32], fill=WHITE, outline=DARK, width=3)
        # Header
        draw.rectangle([cx, cy, cx + 28, cy + 10], fill=(255, 120, 140))
        # Rings
        for rx in [cx + 6, cx + 22]:
            draw.ellipse([rx - 3, cy - 4, rx + 3, cy + 2], fill=DARK)
        # Big date number
        draw.text((cx + 6, cy + 13), "24", fill=DARK, font=None)
    
    elif accessory == 'flame':
        fx, fy = canvas_size - 35, 18
        # Shadow
        draw.ellipse([fx - 12 + 3, fy + 12 + 3, fx + 12 + 3, fy + 32 + 3],
                    fill=(0, 0, 0, 40))
        # Flame layers
        draw.ellipse([fx - 12, fy + 12, fx + 12, fy + 32],
                    fill=(255, 80, 0), outline=DARK, width=3)
        draw.ellipse([fx - 9, fy + 6, fx + 9, fy + 24],
                    fill=(255, 160, 0))
        draw.ellipse([fx - 6, fy + 2, fx + 6, fy + 18],
                    fill=YELLOW)
        draw.ellipse([fx - 3, fy, fx + 3, fy + 12],
                    fill=WHITE)
    
    elif accessory == 'trophy':
        tx, ty = canvas_size - 38, 16
        # Shadow
        draw.rectangle([tx + 3, ty + 3, tx + 28, ty + 28], fill=(0, 0, 0, 40))
        # Cup top
        draw.ellipse([tx + 8, ty, tx + 20, ty + 8], fill=(255, 215, 0), outline=DARK, width=3)
        # Cup body
        draw.rectangle([tx + 10, ty + 4, tx + 18, ty + 20], fill=(255, 215, 0), outline=DARK, width=3)
        # Handles
        draw.arc([tx, ty + 6, tx + 10, ty + 16], start=270, end=90, fill=DARK, width=3)
        draw.arc([tx + 18, ty + 6, tx + 28, ty + 16], start=90, end=270, fill=DARK, width=3)
        # Base
        draw.rectangle([tx + 8, ty + 20, tx + 20, ty + 25], fill=(255, 215, 0), outline=DARK, width=3)
        # Star
        draw.ellipse([tx + 11, ty + 9, tx + 17, ty + 15], fill=WHITE)
    
    elif accessory == 'checkmark':
        cx, cy = canvas_size - 35, 25
        # Shadow
        draw.ellipse([cx - 18 + 3, cy - 18 + 3, cx + 18 + 3, cy + 18 + 3],
                    fill=(0, 0, 0, 40))
        # Circle
        draw.ellipse([cx - 18, cy - 18, cx + 18, cy + 18],
                    fill=(100, 255, 150), outline=DARK, width=4)
        # Big check
        draw.line([cx - 8, cy, cx - 3, cy + 8], fill=DARK, width=5)
        draw.line([cx - 3, cy + 8, cx + 10, cy - 8], fill=DARK, width=5)
    
    elif accessory == 'star':
        sx, sy = canvas_size - 35, 25
        # Shadow
        star_pts = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = 18 if i % 2 == 0 else 8
            star_pts.append((sx + r * math.cos(angle) + 3, sy + r * math.sin(angle) + 3))
        draw.polygon(star_pts, fill=(0, 0, 0, 40))
        
        # Star
        star_pts = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = 18 if i % 2 == 0 else 8
            star_pts.append((sx + r * math.cos(angle), sy + r * math.sin(angle)))
        draw.polygon(star_pts, fill=YELLOW, outline=DARK, width=3)
        
        # Center
        draw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=WHITE)
    
    # Crop to original size but keep ears
    offset_x = (canvas_size - size) // 2
    offset_y = 0  # Keep top for ears
    result = img.crop((offset_x, offset_y, offset_x + size, offset_y + size))
    
    return result

def draw_mega_sparkle(size=25, color=WHITE):
    """Draw huge sparkle"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    
    # Main cross
    draw.line([center, 1, center, size - 1], fill=color, width=5)
    draw.line([1, center, size - 1, center], fill=color, width=5)
    
    # Diagonal
    draw.line([4, 4, size - 4, size - 4], fill=color, width=4)
    draw.line([size - 4, 4, 4, size - 4], fill=color, width=4)
    
    # Center glow
    draw.ellipse([center - 3, center - 3, center + 3, center + 3], fill=color)
    
    return img

def create_shop_banner():
    """ULTRA KAWAII SHOP"""
    print("🎀 Creating ULTRA KAWAII SHOP banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Vibrant purple gradient
        img = create_vibrant_gradient(WIDTH, HEIGHT,
                                     [(180, 140, 230), (210, 170, 255), (240, 200, 255)])
        img = img.convert('RGBA')
        
        # TONS of sparkles!
        for j in range(30):
            sparkle_frame = (i + j * 2) % FRAMES
            alpha = int(60 + 195 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_mega_sparkle(22, WHITE)
            sparkle.putalpha(alpha)
            x = 15 + (j * 50) % (WIDTH - 30)
            y = 10 + (j * 20) % (HEIGHT - 20)
            img.paste(sparkle, (x, y), sparkle)
        
        # Characters - HUGE!
        char_size = 110
        y_base = HEIGHT // 2 - char_size // 2 + 10
        
        bounce1 = int(12 * abs(math.sin(TAU * t)))
        bounce2 = int(12 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(12 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.87 <= t < 0.95
        
        char1 = draw_ultra_kawaii(char_size, LAVENDER, (240, 180, 255), 'cat', 'gift', blink)
        img.paste(char1, (40, y_base - bounce1), char1)
        
        char2 = draw_ultra_kawaii(char_size, PINK, (255, 150, 180), 'bunny', 'coin', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        char3 = draw_ultra_kawaii(char_size, MINT, (140, 255, 180), 'bear', 'gift', blink)
        img.paste(char3, (WIDTH - char_size - 40, y_base - bounce3), char3)
        
        # Epic text
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 90)
            subtitle_font = ImageFont.truetype(font_path, 28)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "SHOP"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 15
        
        # Multi-layer shadow
        for offset in range(8, 0, -1):
            alpha = int(25 * (9 - offset))
            draw.text((text_x + offset, text_y + offset), text,
                     fill=(60, 40, 80, alpha), font=font)
        
        # Animated glow
        glow = int(220 + 35 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=5, stroke_fill=DARK)
        
        subtitle = "✨ Buy Premium Roles & Items ✨"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 32
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(60, 40, 80, 100), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'shop-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ ULTRA KAWAII SHOP created!")

def create_daily_banner():
    """ULTRA KAWAII DAILY"""
    print("🎀 Creating ULTRA KAWAII DAILY banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Vibrant blue gradient
        img = create_vibrant_gradient(WIDTH, HEIGHT,
                                     [(130, 190, 255), (170, 220, 255), (210, 240, 255)])
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(30):
            sparkle_frame = (i + j * 2) % FRAMES
            alpha = int(60 + 195 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_mega_sparkle(22, (255, 255, 180))
            sparkle.putalpha(alpha)
            x = 15 + (j * 50) % (WIDTH - 30)
            y = 10 + (j * 20) % (HEIGHT - 20)
            img.paste(sparkle, (x, y), sparkle)
        
        char_size = 110
        y_base = HEIGHT // 2 - char_size // 2 + 10
        
        bounce1 = int(12 * abs(math.sin(TAU * t)))
        bounce2 = int(12 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(12 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.87 <= t < 0.95
        
        char1 = draw_ultra_kawaii(char_size, SKY, (140, 200, 255), 'bear', 'calendar', blink)
        img.paste(char1, (40, y_base - bounce1), char1)
        
        char2 = draw_ultra_kawaii(char_size, PEACH, (255, 190, 150), 'cat', 'flame', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        char3 = draw_ultra_kawaii(char_size, YELLOW, (255, 245, 140), 'bunny', 'coin', blink)
        img.paste(char3, (WIDTH - char_size - 40, y_base - bounce3), char3)
        
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 90)
            subtitle_font = ImageFont.truetype(font_path, 28)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "DAILY CHECK-IN"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 15
        
        for offset in range(8, 0, -1):
            alpha = int(25 * (9 - offset))
            draw.text((text_x + offset, text_y + offset), text,
                     fill=(40, 60, 100, alpha), font=font)
        
        glow = int(220 + 35 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=5, stroke_fill=DARK)
        
        subtitle = "🔥 Keep Your Streak Going! 💰"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 32
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(40, 60, 100, 100), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'daily-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ ULTRA KAWAII DAILY created!")

def create_quest_banner():
    """ULTRA KAWAII QUEST"""
    print("🎀 Creating ULTRA KAWAII QUEST banner...")
    
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        
        # Vibrant pink gradient
        img = create_vibrant_gradient(WIDTH, HEIGHT,
                                     [(255, 170, 200), (255, 200, 220), (255, 230, 245)])
        img = img.convert('RGBA')
        
        # Sparkles
        for j in range(30):
            sparkle_frame = (i + j * 2) % FRAMES
            alpha = int(60 + 195 * abs(math.sin(sparkle_frame / FRAMES * math.pi)))
            sparkle = draw_mega_sparkle(22, (255, 255, 180))
            sparkle.putalpha(alpha)
            x = 15 + (j * 50) % (WIDTH - 30)
            y = 10 + (j * 20) % (HEIGHT - 20)
            img.paste(sparkle, (x, y), sparkle)
        
        char_size = 110
        y_base = HEIGHT // 2 - char_size // 2 + 10
        
        bounce1 = int(12 * abs(math.sin(TAU * t)))
        bounce2 = int(12 * abs(math.sin(TAU * (t + 0.33))))
        bounce3 = int(12 * abs(math.sin(TAU * (t + 0.66))))
        
        blink = 0.87 <= t < 0.95
        
        char1 = draw_ultra_kawaii(char_size, PINK, (255, 150, 180), 'cat', 'checkmark', blink)
        img.paste(char1, (40, y_base - bounce1), char1)
        
        char2 = draw_ultra_kawaii(char_size, LAVENDER, (240, 180, 255), 'bunny', 'star', blink)
        img.paste(char2, (WIDTH // 2 - char_size // 2, y_base - bounce2), char2)
        
        char3 = draw_ultra_kawaii(char_size, MINT, (140, 255, 180), 'bear', 'trophy', blink)
        img.paste(char3, (WIDTH - char_size - 40, y_base - bounce3), char3)
        
        draw = ImageDraw.Draw(img)
        try:
            font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
            font = ImageFont.truetype(font_path, 90)
            subtitle_font = ImageFont.truetype(font_path, 28)
        except:
            font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        text = "QUESTS"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (WIDTH - text_width) // 2
        text_y = 15
        
        for offset in range(8, 0, -1):
            alpha = int(25 * (9 - offset))
            draw.text((text_x + offset, text_y + offset), text,
                     fill=(100, 60, 80, alpha), font=font)
        
        glow = int(220 + 35 * abs(math.sin(TAU * t)))
        draw.text((text_x, text_y), text, fill=(255, 255, 255, glow), font=font,
                 stroke_width=5, stroke_fill=DARK)
        
        subtitle = "⭐ Complete Quests & Earn Rewards! 🏆"
        bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_width) // 2
        sub_y = HEIGHT - 32
        
        draw.text((sub_x + 2, sub_y + 2), subtitle, fill=(100, 60, 80, 100), font=subtitle_font)
        draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=subtitle_font)
        
        frames.append(img)
    
    output_path = os.path.join(os.getcwd(), 'code', 'assets', 'banners', 'quest-banner.gif')
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                  duration=FRAME_DURATION, loop=0, optimize=True)
    print(f"✅ ULTRA KAWAII QUEST created!")

if __name__ == "__main__":
    create_shop_banner()
    create_daily_banner()
    create_quest_banner()
    print("\n🎉✨💖 ALL ULTRA KAWAII BANNERS COMPLETE! MAXIMUM CUTENESS ACHIEVED! 💖✨🎉")
