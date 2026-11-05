import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC_IMAGE_PATH = 'C:/Users/lekho/.gemini/antigravity/brain/2656d953-bd81-4a95-979a-d68f457ab300/.user_uploaded/media_1793889856634_096801b7.jpg'
OUT_DIR = 'd:/DIA+'

base_im = Image.open(SRC_IMAGE_PATH).convert('RGBA')
orig_w, orig_h = base_im.size

# Quad of the flat forehead on base_im (1024x763):
quad = [(545, 178), (852, 214), (738, 350), (465, 363)]

def find_coeffs(pa, pb):
    matrix = []
    for p1, p2 in zip(pa, pb):
        matrix.append([p2[0], p2[1], 1, 0, 0, 0, -p1[0]*p2[0], -p1[1]*p2[1]])
        matrix.append([0, 0, 0, p2[0], p2[1], 1, -p1[1]*p2[0], -p1[1]*p2[1]])
    A = np.matrix(matrix, dtype=float)
    B = np.array(pa).reshape(8)
    res = np.dot(np.linalg.inv(A), B)
    return np.array(res).reshape(8)

def project_to_model(tex_layer):
    sw, sh = tex_layer.size
    src_rect = [(0, 0), (sw, 0), (sw, sh), (0, sh)]
    coeffs = find_coeffs(src_rect, quad)
    warped = tex_layer.transform(base_im.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    return warped

W, H = 1600, 800

# High-Res Texture for User's 4-Tier Speaker Grille
tex = Image.new('RGBA', (W, H), (0, 0, 0, 0))

# Trapezoid recessed plate matching user's exact CAD part
# Top width: 920, Bottom width: 440, Top y: 95, Bottom y: 690
p_top_w = 920
p_bot_w = 460
p_y0 = 95
p_y1 = 690

poly_panel = [
    (W/2 - p_top_w/2, p_y0),
    (W/2 + p_top_w/2, p_y0),
    (W/2 + p_bot_w/2, p_y1),
    (W/2 - p_bot_w/2, p_y1)
]

# Recessed contact shadow
s_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
s_draw = ImageDraw.Draw(s_layer)
s_draw.polygon(poly_panel, fill=(70, 70, 65, 140))
s_layer = s_layer.filter(ImageFilter.GaussianBlur(8))
tex = Image.alpha_composite(tex, s_layer)

draw = ImageDraw.Draw(tex)

# Recessed faceplate body (subtle warm tone matching PETG model)
draw.polygon(poly_panel, fill=(175, 175, 167, 255), outline=(150, 150, 142, 255))

# 3D Chamfer edge lighting:
# Light from top-left:
# Top & Left edges catch drop shadow
draw.line([(W/2 - p_top_w/2, p_y0), (W/2 + p_top_w/2, p_y0)], fill=(115, 115, 108, 220), width=3)
draw.line([(W/2 - p_top_w/2, p_y0), (W/2 - p_bot_w/2, p_y1)], fill=(115, 115, 108, 220), width=3)
# Bottom & Right edges catch highlight
draw.line([(W/2 + p_top_w/2, p_y0), (W/2 + p_bot_w/2, p_y1)], fill=(228, 228, 222, 240), width=3)
draw.line([(W/2 - p_bot_w/2, p_y1), (W/2 + p_bot_w/2, p_y1)], fill=(228, 228, 222, 240), width=3)

# 4 Rows of Slits (matching user's CAD model in media_1793891386171_fd7034ca.jpg)
row_counts = [24, 20, 15, 8]
row_ys = [175, 285, 395, 505]
slit_h = 72.0
slit_w = 12.5
pitch = 28.0

for r_idx, (cnt, ry) in enumerate(zip(row_counts, row_ys)):
    start_x = (W - (cnt - 1) * pitch) / 2
    for i in range(cnt):
        sx = start_x + i * pitch
        sy0 = ry - slit_h / 2
        sy1 = ry + slit_h / 2
        
        # Bottom-right chamfer highlight
        draw.rounded_rectangle([(sx - slit_w/2 - 1, sy0 - 1), (sx + slit_w/2 + 2, sy1 + 2)], radius=6, fill=(220, 220, 214, 180))
        # Top-left chamfer shadow
        draw.rounded_rectangle([(sx - slit_w/2 - 2, sy0 - 2), (sx + slit_w/2 + 1, sy1 + 1)], radius=6, fill=(110, 110, 104, 170))
        # Deep acoustic dark cavity
        draw.rounded_rectangle([(sx - slit_w/2, sy0), (sx + slit_w/2, sy1)], radius=5, fill=(18, 20, 24, 255))
        # Top inner shadow
        draw.ellipse([(sx - slit_w/2 + 1, sy0 + 1), (sx + slit_w/2 - 1, sy0 + slit_w - 1)], fill=(8, 10, 14, 255))
        # Acoustic mesh micro lines inside slot
        for my in range(int(sy0 + slit_w), int(sy1 - slit_w), 9):
            draw.line([(sx - slit_w/2 + 2, my), (sx + slit_w/2 - 2, my)], fill=(32, 35, 42), width=1)

# CalenDIA+ Logo at the bottom of the plate
try:
    font_logo = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 32)
except Exception:
    font_logo = ImageFont.load_default()

txt_logo = 'CalenDIA+'
bbox = font_logo.getbbox(txt_logo)
lw = bbox[2] - bbox[0]
ly = 595

# Debossed text (highlight below, shadow above)
draw.text(((W - lw)//2 + 1, ly + 1.5), txt_logo, fill=(230, 230, 224, 220), font=font_logo)
draw.text(((W - lw)//2, ly), txt_logo, fill=(105, 105, 98, 255), font=font_logo)

# Perspective projection onto 3D model
warped = project_to_model(tex)
full_im = Image.alpha_composite(base_im, warped)

out_full = os.path.join(OUT_DIR, 'calendia_3d_speaker_user_fixed_full.jpg')
full_im.convert('RGB').save(out_full, quality=95)

# Crop matching Image 2
crop_im = full_im.crop((391, 122, 824, 403))
out_crop = os.path.join(OUT_DIR, 'calendia_3d_speaker_user_fixed_closeup.jpg')
crop_im.convert('RGB').save(out_crop, quality=95)

print("Corrected user speaker renders successfully generated!")
