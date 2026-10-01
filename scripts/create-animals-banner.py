"""
ANIMALS BANNER - Inspired by cute bouncing style
6 cute animals: bunny, cat, bear, duck, pig, panda
"""

from PIL import Image, ImageDraw, ImageFont
import math
import random
import os

W, H, N, K = 800, 200, 30, 2  # K = scale up then down for smooth
GROUND = 185

# Find Minecraft font
font_path = os.path.join(os.getcwd(), 'code', 'assets', 'fonts', 'Minecraft.ttf')
if not os.path.exists(font_path):
    font_path = os.path.join(os.getcwd(), 'assets', 'fonts', 'Minecraft.ttf')

try:
    big = ImageFont.truetype(font_path, 50 * K)
    small = ImageFont.truetype(font_path, 20 * K)
except:
    big = ImageFont.load_default()
    small = ImageFont.load_default()

random.seed(3)
sparkles = [(random.randint(14, W - 14), random.randint(14, H - 14), random.random() * 6.28) for _ in range(30)]

DARK = (70, 40, 70)

# Helper functions
def pts(p): 
    return [(x * K, y * K) for x, y in p]

def epoly(cx, cy, rx, ry, ang=0, n=40):
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        out.append((cx + x * math.cos(ang) - y * math.sin(ang), 
                   cy + x * math.sin(ang) + y * math.cos(ang)))
    return out

def ell(d, cx, cy, rx, ry, fill, outline=None):
    d.ellipse([(cx - rx) * K, (cy - ry) * K, (cx + rx) * K, (cy + ry) * K],
              fill=fill, outline=outline, width=2 * K if outline else 0)

def poly(d, p, fill, outline=None):
    d.polygon(pts(p), fill=fill, outline=outline, width=2 * K if outline else 0)

def line(d, p, color, w):
    d.line(pts(p), fill=color, width=int(w * K), joint='curve')

def star(d, x, y, r, c):
    poly(d, [(x, y - r), (x + r * .3, y - r * .3), (x + r, y), (x + r * .3, y + r * .3),
             (x, y + r), (x - r * .3, y + r * .3), (x - r, y), (x - r * .3, y - r * .3)], c)

def heart(d, x, y, s, c):
    ell(d, x - s / 2, y - s / 2, s / 2, s / 2, c)
    ell(d, x + s / 2, y - s / 2, s / 2, s / 2, c)
    poly(d, [(x - s, y - s * .35), (x + s, y - s * .35), (x, y + s)], c)

# Animal configs
CFG = {
    'bunny': dict(fur=(255, 255, 255), line=(225, 150, 195), belly=None),
    'cat':   dict(fur=(255, 205, 150), line=(225, 150, 90),  belly=(255, 240, 220)),
    'bear':  dict(fur=(205, 155, 115), line=(150, 100, 70),  belly=(240, 205, 170)),
    'duck':  dict(fur=(255, 236, 120), line=(225, 170, 60),  belly=(255, 248, 200)),
    'pig':   dict(fur=(255, 192, 208), line=(225, 130, 160), belly=(255, 218, 228)),
    'panda': dict(fur=(255, 255, 255), line=(90, 80, 100),   belly=None),
}

def animal(d, kind, cx, t, phase):
    c = CFG[kind]
    fur, ln, belly = c['fur'], c['line'], c['belly']
    hop = abs(math.sin(t + phase))
    cy = GROUND - 40 - hop * 15
    wig = math.sin(t * 2 + phase) * 0.18
    
    # Shadow
    ell(d, cx, GROUND + 2, 26 - hop * 8, 4 - hop * 1.5, (225, 150, 200))
    
    # Tail
    if kind == 'bunny':
        ell(d, cx - 24, cy + 28, 8, 8, fur, ln)
    elif kind == 'cat':
        tail = [(cx + 22 + 18 * u + 5 * math.sin(t + phase + u * 3), cy + 32 - 30 * u) 
                for u in [i / 10 for i in range(11)]]
        line(d, tail, ln, 10)
        line(d, tail, fur, 7)
    elif kind == 'bear':
        ell(d, cx + 25, cy + 30, 6, 6, fur, ln)
    elif kind == 'duck':
        poly(d, [(cx + 21, cy + 27), (cx + 36, cy + 17), (cx + 30, cy + 33)], fur, ln)
    elif kind == 'pig':
        curl = [(cx + 29 + (2 + a * 1) * math.cos(a), cy + 24 + (2 + a * 1) * math.sin(a))
                for a in [i * 0.3 for i in range(0, 11)]]
        line(d, curl, ln, 2)
    elif kind == 'panda':
        ell(d, cx + 24, cy + 30, 6, 6, fur, ln)
    
    # Ears (before head)
    if kind == 'bunny':
        for s in (-1, 1):
            a = s * 0.18 + wig * s
            poly(d, [(x, y) for x, y in epoly(cx + s * 13, cy - 38, 7, 20, a)], fur, ln)
            poly(d, epoly(cx + s * 13, cy - 36, 4, 14, a), (255, 175, 210))
    elif kind in ('cat', 'pig'):
        inner = (255, 175, 200) if kind == 'cat' else (255, 150, 180)
        fill = fur if kind == 'cat' else (255, 170, 192)
        for s in (-1, 1):
            tip = (cx + s * (20 + (3 if kind == 'pig' else 0) + wig * 15), cy - (39 if kind == 'cat' else 35))
            poly(d, [(cx + s * 23, cy - 15), tip, (cx + s * 5, cy - 27)], fill, ln)
            poly(d, [(cx + s * 19, cy - 20), (tip[0] - s * 1, tip[1] + 7), (cx + s * 9, cy - 26)], inner)
    elif kind == 'bear':
        for s in (-1, 1):
            ell(d, cx + s * 19, cy - 25, 8, 8, fur, ln)
            ell(d, cx + s * 19, cy - 24, 4.5, 4.5, belly)
    elif kind == 'panda':
        for s in (-1, 1):
            ell(d, cx + s * 19, cy - 25, 8, 8, (70, 60, 85), ln)
    
    # Body
    ell(d, cx, cy + 19, 25, 21, fur, ln)
    if belly:
        ell(d, cx, cy + 23, 16, 13, belly)
    if kind == 'panda':
        for s in (-1, 1):
            ell(d, cx + s * 22, cy + 20, 7, 11, (70, 60, 85), ln)
    if kind == 'duck':
        flap = 10 + 2 * math.sin(t * 2 + phase)
        for s in (-1, 1):
            ell(d, cx + s * 22, cy + 21, 6, flap, (255, 215, 80), ln)
    
    # Feet
    foot = {'panda': (70, 60, 85), 'duck': (255, 170, 70)}.get(kind, fur)
    for s in (-1, 1):
        ell(d, cx + s * 12, cy + 39, 10, 5, foot, ln)
    
    # Head
    ell(d, cx, cy - 9, 23, 20, fur, ln)
    if kind == 'duck':
        for s, a in ((-1, -0.5), (1, 0.4)):
            poly(d, epoly(cx + s * 2, cy - 30, 2, 5, a), fur, ln)
    if kind == 'cat':
        for dx in (-5, 0, 5):
            line(d, [(cx + dx, cy - 28), (cx + dx * 0.8, cy - 21)], ln, 1.5)
    
    # Cheeks & eyes
    if kind != 'panda':
        ell(d, cx - 16, cy - 2, 5, 4, (255, 175, 200))
        ell(d, cx + 16, cy - 2, 5, 4, (255, 175, 200))
    
    blink = math.cos(t - phase) > 0.95
    for s in (-1, 1):
        ex = cx + s * 9
        if kind == 'panda':
            poly(d, epoly(ex + s * 1, cy - 9, 6, 7.5, s * -0.5), (70, 60, 85))
        if blink:
            line(d, [(ex - 4, cy - 9), (ex + 4, cy - 9)], 
                 (255, 255, 255) if kind == 'panda' else DARK, 1.5)
        elif kind == 'panda':
            ell(d, ex + s * 1, cy - 9, 2.5, 3, (255, 255, 255))
            ell(d, ex + s * 1, cy - 9, 1.4, 1.7, DARK)
        else:
            ell(d, ex, cy - 9, 3.5, 4, DARK)
            ell(d, ex + 1.2, cy - 10.5, 1.2, 1.2, (255, 255, 255))
    
    # Nose/mouth
    mouth = (200, 110, 150)
    if kind == 'duck':
        ell(d, cx, cy + 5, 7, 3, (255, 140, 40), (225, 110, 30))
        ell(d, cx, cy - 1, 9, 4.5, (255, 175, 70), (225, 120, 30))
    elif kind == 'pig':
        ell(d, cx, cy + 1, 10, 7, (255, 160, 185), ln)
        ell(d, cx - 3.5, cy + 1, 1.5, 2.2, (170, 70, 110))
        ell(d, cx + 3.5, cy + 1, 1.5, 2.2, (170, 70, 110))
    else:
        if kind == 'bear':
            ell(d, cx, cy + 1, 9, 7, belly)
            ell(d, cx, cy - 2, 3, 2.2, (100, 60, 40))
        elif kind == 'panda':
            ell(d, cx, cy - 2, 3, 2.2, (70, 60, 85))
        else:
            ell(d, cx, cy - 2, 2.6, 1.9, (255, 120, 165))
        line(d, [(cx, cy - 1), (cx, cy + 2)], mouth, 0.8)
        d.arc([(cx - 4.5) * K, cy * K, cx * K, (cy + 5) * K], 0, 160, fill=mouth, width=K)
        d.arc([cx * K, cy * K, (cx + 4.5) * K, (cy + 5) * K], 20, 180, fill=mouth, width=K)
    
    if kind == 'cat':
        for s in (-1, 1):
            for dy in (-1.5, 2):
                line(d, [(cx + s * 13, cy + dy * 0.4), (cx + s * 25, cy + dy * 1.4 - 1.5)], 
                     (200, 140, 100), 0.8)

def create_banner(name, title, subtitle):
    """Create animated banner"""
    ORDER = ['bunny', 'cat', 'bear', 'duck', 'pig', 'panda']
    XS = [60 + i * 125 for i in range(6)]
    
    frames = []
    for i in range(N):
        t = i / N * 2 * math.pi
        im = Image.new('RGB', (W * K, H * K))
        d = ImageDraw.Draw(im)
        
        # Gradient background
        for y in range(H * K):
            k = y / (H * K)
            d.line([(0, y), (W * K, y)], 
                   fill=(int(255 - 20 * k), int(190 + 30 * k), int(225 + 20 * k)))
        
        # Border
        d.rounded_rectangle([6 * K, 6 * K, (W - 6) * K, (H - 6) * K], 
                           radius=20 * K, outline=(255, 255, 255), width=4 * K)
        
        # Sparkles
        for x, y, p in sparkles:
            star(d, x, y, 2 + 2.5 * abs(math.sin(t + p)), (255, 255, 255))
        
        # Title
        b = int(5 * math.sin(t) * K)
        tw = d.textlength(title, font=big)
        x0 = (W * K - tw) / 2
        d.text((x0 + 2 * K, 18 * K + b + 3 * K), title, font=big, fill=(214, 120, 170))
        d.text((x0, 18 * K + b), title, font=big, fill=(255, 255, 255))
        
        # Subtitle
        sw = d.textlength(subtitle, font=small)
        d.text(((W * K - sw) / 2, 75 * K), subtitle, font=small, fill=(150, 90, 150))
        
        # Hearts between animals
        for j in range(5):
            u = (t / (2 * math.pi) + j / 5) % 1
            heart(d, XS[j] + 62, 165 - u * 45, 5 * (1 - u * .5), (255, 105, 160))
        
        # Animals
        for kind, x, ph in zip(ORDER, XS, [0, 1.0, 2.0, 3.0, 4.0, 5.0]):
            animal(d, kind, x, t, ph)
        
        frames.append(im.resize((W, H), Image.LANCZOS))
    
    output = os.path.join(os.getcwd(), 'code', 'assets', 'banners', f'{name}-banner.gif')
    frames[0].save(output, save_all=True, append_images=frames[1:], 
                  duration=80, loop=0, optimize=True)
    print(f"✅ {name} banner created!")

# Create all banners
create_banner('shop', 'SHOP', '✨ new cuties every day ✨')
create_banner('daily', 'DAILY CHECK-IN', '🔥 come back every day! 💰')
create_banner('quest', 'QUESTS', '⭐ complete & earn rewards! 🏆')
create_banner('balance', 'BALANCE', '💰 your coins & inventory 💎')

print("\n🎉 ALL ANIMAL BANNERS COMPLETE! 6 cute bouncing friends! 💖")
