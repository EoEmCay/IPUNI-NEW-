import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC_IMAGE_PATH = 'C:/Users/lekho/.gemini/antigravity/brain/2656d953-bd81-4a95-979a-d68f457ab300/.user_uploaded/media_1793889856634_096801b7.jpg'
OUT_DIR = 'd:/DIA+'

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs('d:/DIA+/.scratch', exist_ok=True)

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

# Fonts
try:
    font_brand = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 30)
    font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
    font_regular = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 17)
    font_small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14)
except Exception:
    font_brand = ImageFont.load_default()
    font_bold = ImageFont.load_default()
    font_regular = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Background color of the plastic forehead
COLOR_PLASTIC = (189, 189, 181)
COLOR_RECESSED = (173, 173, 165)
COLOR_CHAMFER_LGT = (222, 222, 215)
COLOR_CHAMFER_SHD = (130, 130, 122)
COLOR_DARK_CAVITY = (20, 22, 26)
COLOR_CYAN = (0, 160, 230)
COLOR_CYAN_LIGHT = (56, 189, 248)

print("Starting generation of 3 speaker strip options...")

# ==============================================================================
# OPTION 1: DẢI RÃNH ÂM THANH ĐỨNG NHỊP ĐIỆU SÓNG ÂM (DYNAMIC WAVEFORM SLITS)
# ==============================================================================
print("Generating Option 1: Dynamic Waveform Slits...")
tex1 = Image.new('RGBA', (W, H), (0, 0, 0, 0))

# Recessed tray bounds
tw, th = 1180, 280
tx0, ty0 = (W - tw) // 2, 260
tx1, ty1 = tx0 + tw, ty0 + th

# Drop shadow for recessed tray
s_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
s_draw = ImageDraw.Draw(s_layer)
s_draw.rounded_rectangle([(tx0, ty0), (tx1, ty1)], radius=20, fill=(90, 90, 85, 130))
s_layer = s_layer.filter(ImageFilter.GaussianBlur(5))
tex1 = Image.alpha_composite(tex1, s_layer)

draw1 = ImageDraw.Draw(tex1)
# Recessed tray background
draw1.rounded_rectangle([(tx0, ty0), (tx1, ty1)], radius=20, fill=(COLOR_RECESSED[0], COLOR_RECESSED[1], COLOR_RECESSED[2], 255), outline=(150, 150, 142, 255), width=2)
# Bottom-right chamfer highlight
draw1.line([(tx0 + 20, ty1 - 1), (tx1 - 20, ty1 - 1)], fill=(225, 225, 218, 220), width=2)
draw1.line([(tx1 - 1, ty0 + 20), (tx1 - 1, ty1 - 20)], fill=(225, 225, 218, 220), width=2)
# Top-left chamfer shadow
draw1.line([(tx0 + 20, ty0 + 1), (tx1 - 20, ty0 + 1)], fill=(125, 125, 118, 180), width=2)
draw1.line([(tx0 + 1, ty0 + 20), (tx0 + 1, ty1 - 20)], fill=(125, 125, 118, 180), width=2)

# Dynamic Waveform Slits
n_slits = 35
pitch = 28.0
start_x = (W - (n_slits - 1) * pitch) / 2
center_y = ty0 + th / 2 + 15
slit_w = 12.0

for i in range(n_slits):
    sx = start_x + i * pitch
    dist = abs(i - (n_slits - 1) / 2.0)
    # Waveform height modulation: Gaussian bell with secondary harmonic
    sh = 42.0 + 120.0 * math.exp(- (dist**2) / 65.0) + 12.0 * math.cos(dist * 0.4)
    sh = min(sh, th - 65.0)
    sy0 = center_y - sh / 2
    sy1 = center_y + sh / 2
    
    # Bottom-right highlight rim
    draw1.rounded_rectangle([(sx - slit_w/2 - 1, sy0 - 1), (sx + slit_w/2 + 2, sy1 + 2)], radius=7, fill=(218, 218, 212, 170))
    # Top-left shadow rim
    draw1.rounded_rectangle([(sx - slit_w/2 - 2, sy0 - 2), (sx + slit_w/2 + 1, sy1 + 1)], radius=7, fill=(115, 115, 108, 160))
    # Dark cavity (speaker cloth behind)
    draw1.rounded_rectangle([(sx - slit_w/2, sy0), (sx + slit_w/2, sy1)], radius=6, fill=COLOR_DARK_CAVITY)
    # Top inner shadow inside slot
    draw1.ellipse([(sx - slit_w/2 + 1, sy0 + 1), (sx + slit_w/2 - 1, sy0 + slit_w - 1)], fill=(8, 10, 14, 255))
    # Acoustic mesh micro pattern
    for my in range(int(sy0 + slit_w), int(sy1 - slit_w), 8):
        draw1.line([(sx - slit_w/2 + 2, my), (sx + slit_w/2 - 2, my)], fill=(32, 35, 42), width=1)

# Decorative header text above slits
txt_label = "CALENDIA+ MEDICAL ACOUSTIC ALARM • 8Ω 2W CHIME"
bbox = font_small.getbbox(txt_label)
tw_t = bbox[2] - bbox[0]
draw1.text(((W - tw_t) // 2 + 1, ty0 + 17), txt_label, fill=(215, 215, 208, 180), font=font_small)
draw1.text(((W - tw_t) // 2, ty0 + 16), txt_label, fill=(120, 120, 114, 255), font=font_small)

# Project and compose Option 1
warped1 = project_to_model(tex1)
full1 = Image.alpha_composite(base_im, warped1)
full1.convert('RGB').save(os.path.join(OUT_DIR, 'calendia_3d_speaker_opt1_waveform_full.jpg'), quality=95)
crop1 = full1.crop((391, 122, 824, 403))
crop1.convert('RGB').save(os.path.join(OUT_DIR, 'calendia_3d_speaker_opt1_waveform_closeup.jpg'), quality=95)

# ==============================================================================
# OPTION 2: MA TRẬN VI LỖ TỔ ONG CÔNG NGHỆ CAO (PRECISION HONEYCOMB MICRO-MESH)
# ==============================================================================
print("Generating Option 2: Precision Honeycomb Micro-Mesh...")
tex2 = Image.new('RGBA', (W, H), (0, 0, 0, 0))

tw2, th2 = 1200, 270
tx0_2, ty0_2 = (W - tw2) // 2, 265
tx1_2, ty1_2 = tx0_2 + tw2, ty0_2 + th2

# Drop shadow
s_layer2 = Image.new('RGBA', (W, H), (0, 0, 0, 0))
s_draw2 = ImageDraw.Draw(s_layer2)
s_draw2.rounded_rectangle([(tx0_2, ty0_2), (tx1_2, ty1_2)], radius=16, fill=(90, 90, 85, 120))
s_layer2 = s_layer2.filter(ImageFilter.GaussianBlur(5))
tex2 = Image.alpha_composite(tex2, s_layer2)

draw2 = ImageDraw.Draw(tex2)
draw2.rounded_rectangle([(tx0_2, ty0_2), (tx1_2, ty1_2)], radius=16, fill=(COLOR_RECESSED[0], COLOR_RECESSED[1], COLOR_RECESSED[2], 255), outline=(150, 150, 142, 255), width=2)
draw2.line([(tx0_2 + 16, ty1_2 - 1), (tx1_2 - 16, ty1_2 - 1)], fill=(225, 225, 218, 220), width=2)
draw2.line([(tx1_2 - 1, ty0_2 + 16), (tx1_2 - 1, ty1_2 - 16)], fill=(225, 225, 218, 220), width=2)
draw2.line([(tx0_2 + 16, ty0_2 + 1), (tx1_2 - 16, ty0_2 + 1)], fill=(125, 125, 118, 180), width=2)
draw2.line([(tx0_2 + 1, ty0_2 + 16), (tx0_2 + 1, ty1_2 - 16)], fill=(125, 125, 118, 180), width=2)

# Hexagonal Micro-Perforations Matrix
n_rows = 7
n_cols = 42
dx = 24.0
dy = 22.0
r_hole = 5.5

mesh_w = (n_cols - 1) * dx
mesh_h = (n_rows - 1) * dy
mx0 = (W - mesh_w) // 2
my0 = ty0_2 + (th2 - mesh_h) // 2 + 12

for r in range(n_rows):
    row_y = my0 + r * dy
    row_offset = (dx / 2.0) if (r % 2 == 1) else 0.0
    for c in range(n_cols):
        col_x = mx0 + c * dx + row_offset
        if col_x > tx1_2 - 40 or col_x < tx0_2 + 40:
            continue
        
        # Center speaker driver accent: concentric circle effect
        dist_from_center = math.hypot(col_x - W/2, row_y - (my0 + mesh_h/2))
        
        # Chamfer highlight on hole (bottom-right)
        draw2.ellipse([(col_x - r_hole - 1, row_y - r_hole - 1), (col_x + r_hole + 1.5, row_y + r_hole + 1.5)], fill=(218, 218, 212, 170))
        # Chamfer shadow on hole (top-left)
        draw2.ellipse([(col_x - r_hole - 1.5, row_y - r_hole - 1.5), (col_x + r_hole + 0.5, row_y + r_hole + 0.5)], fill=(115, 115, 108, 160))
        # Black acoustic cavity
        draw2.ellipse([(col_x - r_hole, row_y - r_hole), (col_x + r_hole, row_y + r_hole)], fill=COLOR_DARK_CAVITY)

# Concentric ring accent for driver
driver_cx = W / 2
driver_cy = my0 + mesh_h / 2
draw2.ellipse([(driver_cx - 90, driver_cy - 90), (driver_cx + 90, driver_cy + 90)], outline=(145, 145, 138, 120), width=2)
draw2.ellipse([(driver_cx - 150, driver_cy - 150), (driver_cx + 150, driver_cy + 150)], outline=(145, 145, 138, 80), width=1)

# Subtle medical branding on top
brand_txt = "DIA+ SOUND • PRECISION MEDICINE DISPENSER"
bbox2 = font_small.getbbox(brand_txt)
tw_b = bbox2[2] - bbox2[0]
draw2.text(((W - tw_b) // 2 + 1, ty0_2 + 14), brand_txt, fill=(215, 215, 208, 180), font=font_small)
draw2.text(((W - tw_b) // 2, ty0_2 + 13), brand_txt, fill=(120, 120, 114, 255), font=font_small)

warped2 = project_to_model(tex2)
full2 = Image.alpha_composite(base_im, warped2)
full2.convert('RGB').save(os.path.join(OUT_DIR, 'calendia_3d_speaker_opt2_micromesh_full.jpg'), quality=95)
crop2 = full2.crop((391, 122, 824, 403))
crop2.convert('RGB').save(os.path.join(OUT_DIR, 'calendia_3d_speaker_opt2_micromesh_closeup.jpg'), quality=95)

# ==============================================================================
# OPTION 3: DẢI LOA HORIZON SOUNDBAR NẸP CHỈ CYAN & ĐÈN BÁO (HORIZON GLOW SOUNDBAR)
# ==============================================================================
print("Generating Option 3: Horizon Glow Soundbar...")
tex3 = Image.new('RGBA', (W, H), (0, 0, 0, 0))

tw3, th3 = 1240, 260
tx0_3, ty0_3 = (W - tw3) // 2, 270
tx1_3, ty1_3 = tx0_3 + tw3, ty0_3 + th3

# Drop shadow
s_layer3 = Image.new('RGBA', (W, H), (0, 0, 0, 0))
s_draw3 = ImageDraw.Draw(s_layer3)
s_draw3.rounded_rectangle([(tx0_3, ty0_3), (tx1_3, ty1_3)], radius=18, fill=(90, 90, 85, 120))
s_layer3 = s_layer3.filter(ImageFilter.GaussianBlur(5))
tex3 = Image.alpha_composite(tex3, s_layer3)

draw3 = ImageDraw.Draw(tex3)
draw3.rounded_rectangle([(tx0_3, ty0_3), (tx1_3, ty1_3)], radius=18, fill=(COLOR_RECESSED[0], COLOR_RECESSED[1], COLOR_RECESSED[2], 255), outline=(150, 150, 142, 255), width=2)
draw3.line([(tx0_3 + 18, ty1_3 - 1), (tx1_3 - 18, ty1_3 - 1)], fill=(225, 225, 218, 220), width=2)
draw3.line([(tx1_3 - 1, ty0_3 + 18), (tx1_3 - 1, ty1_3 - 18)], fill=(225, 225, 218, 220), width=2)

# Cyan Medical Trim Band running along top of soundbar
cyan_h = 10
cyan_y = ty0_3 + 18
draw3.rounded_rectangle([(tx0_3 + 30, cyan_y), (tx1_3 - 30, cyan_y + cyan_h)], radius=5, fill=COLOR_CYAN)
draw3.line([(tx0_3 + 32, cyan_y + 1), (tx1_3 - 32, cyan_y + 1)], fill=(120, 220, 255), width=2)

# Smart Notification Glow Light in center
glow_w = 260
glow_x0 = (W - glow_w) // 2
glow_x1 = glow_x0 + glow_w
glow_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
g_draw = ImageDraw.Draw(glow_img)
g_draw.rounded_rectangle([(glow_x0 - 15, cyan_y - 6), (glow_x1 + 15, cyan_y + cyan_h + 6)], radius=10, fill=(56, 189, 248, 130))
glow_img = glow_img.filter(ImageFilter.GaussianBlur(8))
tex3 = Image.alpha_composite(tex3, glow_img)
draw3 = ImageDraw.Draw(tex3)
draw3.rounded_rectangle([(glow_x0, cyan_y), (glow_x1, cyan_y + cyan_h)], radius=5, fill=(180, 240, 255, 255))

# 3 Rows of Horizontal Capsule Acoustic Slits
row_ys = [ty0_3 + 65, ty0_3 + 125, ty0_3 + 185]
n_slots_per_row = 15
slot_pitch_x = 76.0
slot_len = 54.0
slot_h = 14.0
start_sx = (W - (n_slots_per_row - 1) * slot_pitch_x) / 2

for r_idx, ry in enumerate(row_ys):
    # Stagger middle row
    offset_x = (slot_pitch_x / 2.0) if (r_idx == 1) else 0.0
    for sc in range(n_slots_per_row):
        cur_sx = start_sx + sc * slot_pitch_x + offset_x
        if cur_sx - slot_len/2 < tx0_3 + 35 or cur_sx + slot_len/2 > tx1_3 - 35:
            continue
        
        # Chamfer highlight (bottom-right)
        draw3.rounded_rectangle([(cur_sx - slot_len/2 - 1, ry - slot_h/2 - 1), (cur_sx + slot_len/2 + 2, ry + slot_h/2 + 2)], radius=7, fill=(218, 218, 212, 170))
        # Chamfer shadow (top-left)
        draw3.rounded_rectangle([(cur_sx - slot_len/2 - 2, ry - slot_h/2 - 2), (cur_sx + slot_len/2 + 1, ry + slot_h/2 + 1)], radius=7, fill=(115, 115, 108, 160))
        # Dark cavity
        draw3.rounded_rectangle([(cur_sx - slot_len/2, ry - slot_h/2), (cur_sx + slot_len/2, ry + slot_h/2)], radius=6, fill=COLOR_DARK_CAVITY)
        # Left inner shadow
        draw3.ellipse([(cur_sx - slot_len/2 + 1, ry - slot_h/2 + 1), (cur_sx - slot_len/2 + slot_h - 1, ry + slot_h/2 - 1)], fill=(8, 10, 14, 255))

# Sub-branding
txt_opt3 = "CALENDIA+ SMART AUDIO & VISUAL REMINDER"
bbox3 = font_small.getbbox(txt_opt3)
tw3_txt = bbox3[2] - bbox3[0]
draw3.text(((W - tw3_txt) // 2, ty1_3 - 30), txt_opt3, fill=(125, 125, 118, 255), font=font_small)

warped3 = project_to_model(tex3)
full3 = Image.alpha_composite(base_im, warped3)
full3.convert('RGB').save(os.path.join(OUT_DIR, 'calendia_3d_speaker_opt3_soundbar_full.jpg'), quality=95)
crop3 = full3.crop((391, 122, 824, 403))
crop3.convert('RGB').save(os.path.join(OUT_DIR, 'calendia_3d_speaker_opt3_soundbar_closeup.jpg'), quality=95)

print("All 3 options successfully generated and saved to d:/DIA+!")
