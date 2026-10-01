"""
Create cute animated quest banner inspired by emoji style
Minimal, clean design with cute character
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# Settings
S = 3  # Scale factor
W = 800 // S  # Base width
H = 200 // S  # Base height
C_W = W * S  # Canvas width
C_H = H * S  # Canvas height
N = 30  # Number of frames
DUR = 80  # Duration per frame
TAU = 2 * math.pi

# Colors
def h(x):
    x = x.lstrip('#')
    return tuple(int(x[i:i+2], 16) for i in (0, 2, 4)) + (255,)

def mix(a, b, u):
    return tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3)) + (255,)

# Color palette
BLUE = h('5865F2')
BLUE_DARK = h('4752C4')
GOLD = h('FFD700')
GOLD_DARK = h('FFC700')
WHITE = h('FFFFFF')
CREAM = h('FFF7EC')
PINK = h('FFB3C7')
ORANGE = h('FFB27A')
GREEN = h('9BE3B4')
PURPLE = h('B49BFF')
OUT = h('5B4570')

class L:
    def __init__(self, ox, oy):
        self.im = Image.new('RGBA', (C_W, C_H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.ox = ox
        self.oy = oy
    
    def P(self, x, y):
        return ((self.ox + x) * S, (self.oy + y) * S)
    
    def W(self, v):
        return max(1, round(v * S))
    
    def c(self, x, y, r, f=None, o=OUT, ow=1.6):
        self.d.ellipse([self.P(x - r, y - r), self.P(x + r, y + r)], 
                      fill=f, outline=o if ow else None, width=self.W(ow))
    
    def e(self, x, y, rx, ry, f=None, o=OUT, ow=1.6):
        self.d.ellipse([self.P(x - rx, y - ry), self.P(x + rx, y + ry)],
                      fill=f, outline=o if ow else None, width=self.W(ow))
    
    def r(self, x0, y0, x1, y1, rad=3, f=None, o=OUT, ow=1.6):
        self.d.rounded_rectangle([self.P(x0, y0), self.P(x1, y1)], 
                                radius=rad * S, fill=f,
                                outline=o if ow else None, width=self.W(ow))
    
    def poly(self, pts, f=None, o=OUT, ow=1.6):
        q = [self.P(*p) for p in pts]
        if f:
            self.d.polygon(q, fill=f)
        if ow:
            self.d.line(q + [q[0]], fill=o, width=self.W(ow), joint='curve')
            for p in q:
                rr = self.W(ow) / 2
                self.d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=o)
    
    def line(self, pts, c=OUT, w=2):
        q = [self.P(*p) for p in pts]
        self.d.line(q, fill=c, width=self.W(w), joint='curve')
        rr = self.W(w) / 2
        for p in q:
            self.d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=c)

def star_pts(cx, cy, ro, ri, n=5):
    pts = []
    for i in range(n * 2):
        a = math.radians(-90 + i * 180 / n)
        r = ro if i % 2 == 0 else ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def draw_character(l, t):
    """Draw cute cat character"""
    s = math.sin(TAU * t)
    
    # Ears
    for sx in (-1, 1):
        l.poly([(sx * 13, -4), (sx * 12, -16), (sx * 4, -11)], f=PINK)
    
    # Head
    l.e(0, 0, 15, 13, f=PINK)
    
    # Eyes
    for sx in (-1, 1):
        blink = 0.83 <= t < 0.92
        ry = 1.5 if blink else 1.8
        l.c(sx * 5.5, -1, ry, f=OUT, ow=0)
    
    # Cheeks
    for sx in (-1, 1):
        l.e(sx * 10, 2.5, 2.5, 1.5, f=h('FF9DB8'), ow=0)
    
    # Mouth
    l.line([(-1.3, 1.7), (1.3, 1.7)], OUT, 0.8)

def draw_scroll(l, x, y, t):
    """Draw quest scroll"""
    # Paper
    l.r(x - 9, y - 11, x + 9, y + 11, 2, f=CREAM)
    # Rods
    l.r(x - 10, y - 12, x + 10, y - 10, 0.5, f=h('8B4513'), ow=0)
    l.r(x - 10, y + 10, x + 10, y + 12, 0.5, f=h('8B4513'), ow=0)
    # Checkmark
    l.line([(x - 3, y), (x - 1, y + 2), (x + 4, y - 3)], GREEN, 1.2)

def draw_trophy(l, x, y, t):
    """Draw trophy"""
    float_y = 2 * math.sin(TAU * t)
    # Cup
    l.poly([(x - 5, y - 8 + float_y), (x + 5, y - 8 + float_y), 
            (x + 6, y + 2 + float_y), (x - 6, y + 2 + float_y)], f=GOLD)
    # Handles
    for sx in (-1, 1):
        pts = []
        for i in range(5):
            a = math.radians(90 + i * 36)
            pts.append((x + sx * 7 + 3 * sx * math.cos(a), 
                       y - 5 + float_y + 3 * math.sin(a)))
        l.line(pts, GOLD, 1.5)
    # Base
    l.r(x - 7, y + 2 + float_y, x + 7, y + 5 + float_y, 1, f=ORANGE)

def draw_quest_marker(l, x, y, t):
    """Draw quest marker (!)"""
    pulse = 1 + 0.15 * abs(math.sin(TAU * t))
    r = 8 * pulse
    l.c(x, y, r, f=GOLD)
    
    # Exclamation mark
    l.line([(x, y - 3), (x, y + 1)], WHITE, 1.5)
    l.c(x, y + 3, 0.8, f=WHITE, ow=0)

def create_frame(frame_num):
    """Create single frame"""
    t = frame_num / N
    
    # Gradient background
    base = Image.new('RGB', (C_W, C_H), BLUE_DARK)
    for y in range(C_H):
        ratio = y / C_H
        color = mix(BLUE_DARK, BLUE, ratio)
        for x in range(C_W):
            base.putpixel((x, y), color[:3])
    
    l = L(0, 0)
    l.im = base.convert('RGBA')
    
    # Draw sparkles
    for i in range(20):
        star_frame = (frame_num + i * 2) % N
        alpha = int(100 + 155 * abs(math.sin(star_frame / N * math.pi)))
        x = 20 + (i * 20) % (W - 40)
        y = 10 + (i * 12) % (H - 20)
        
        star_l = L(x, y)
        star_l.poly(star_pts(0, 0, 2, 0.8, 4), f=GOLD)
        star_l.im.putalpha(alpha)
        l.im.alpha_composite(star_l.im)
    
    # Character (left)
    char_l = L(35, 33)
    draw_character(char_l, t)
    # Bounce
    bounce = int(3 * abs(math.sin(TAU * t)))
    l.im.alpha_composite(char_l.im, (0, -bounce * S))
    
    # Scroll
    scroll_l = L(70, 33)
    draw_scroll(scroll_l, 0, 0, t)
    l.im.alpha_composite(scroll_l.im)
    
    # Quest marker
    marker_l = L(W - 80, 33)
    draw_quest_marker(marker_l, 0, 0, t)
    l.im.alpha_composite(marker_l.im)
    
    # Trophy (right)
    trophy_l = L(W - 35, 33)
    draw_trophy(trophy_l, 0, 0, t)
    l.im.alpha_composite(trophy_l.im)
    
    # Text
    draw = ImageDraw.Draw(l.im)
    try:
        font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 24 * S)
            sub_font = ImageFont.truetype(font_path, 9 * S)
        else:
            font = ImageFont.load_default()
            sub_font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
    
    text = "DAILY QUESTS"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (C_W - text_width) // 2
    text_y = H * S // 2 - 15 * S
    
    # Shadow
    draw.text((text_x + 2 * S, text_y + 2 * S), text, fill=(0, 0, 0, 180), font=font)
    # Main text
    draw.text((text_x, text_y), text, fill=GOLD, font=font, stroke_width=S, stroke_fill=WHITE)
    
    # Subtitle
    subtitle = "Complete Tasks & Earn Rewards!"
    bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    sub_width = bbox[2] - bbox[0]
    sub_x = (C_W - sub_width) // 2
    sub_y = H * S // 2 + 13 * S
    
    glow = int(150 + 105 * abs(math.sin(TAU * (t + 0.3))))
    draw.text((sub_x + S, sub_y + S), subtitle, fill=(0, 0, 0, 120), font=sub_font)
    draw.text((sub_x, sub_y), subtitle, fill=(255, 255, 255, glow), font=sub_font)
    
    return l.im

def create_quest_banner():
    """Create the banner"""
    print("🎨 Creating cute quest banner...")
    
    frames = []
    for i in range(N):
        print(f"  Creating frame {i+1}/{N}...")
        frame = create_frame(i)
        frames.append(frame)
    
    output_path = os.path.join(os.getcwd(), 'assets', 'banners', 'quest-banner.gif')
    
    print(f"💾 Saving to {output_path}...")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=DUR,
        loop=0,
        optimize=True
    )
    
    print(f"✅ Quest banner created!")
    print(f"📍 Location: {output_path}")
    print(f"📏 Size: {C_W}x{C_H}")
    print(f"🎞️ Frames: {N}")

if __name__ == "__main__":
    create_quest_banner()
