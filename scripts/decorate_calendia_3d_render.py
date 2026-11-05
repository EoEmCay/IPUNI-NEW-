import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

# Source paths
SRC_IMAGE_PATH = 'C:/Users/lekho/.gemini/antigravity/brain/c18f634d-dd4e-47df-9dfe-5173135c2f21/.user_uploaded/media_1793888633629_e3179101.jpg'
LOGO_PATH = 'd:/DIA+/logo_transparent.png'

# Load base 3D render and logo
base_im = Image.open(SRC_IMAGE_PATH).convert('RGBA')
orig_w, orig_h = base_im.size
logo_im = Image.open(LOGO_PATH).convert('RGBA')
lw, lh = logo_im.size

print(f"Base image: {orig_w}x{orig_h}, Logo: {lw}x{lh}")

# ==================== PERSPECTIVE PROJECTION SYSTEM ====================
# Geometry of the front panel:
# Top edge: y = -0.1247 * x + 176.38
# Cutout top edge: y = -0.1937 * x + 396.88
# Vertical tilt: dx/dy = +0.13

def get_y_top(x):
    return -0.1247 * x + 176.38

def get_y_cutout(x):
    return -0.1937 * x + 396.88

def get_face_pt(x, t):
    """
    Returns (x_screen, y_screen) on the upper forehead of the front face.
    t is normalized vertical coordinate: 0.0 = top edge, 1.0 = cutout top edge.
    """
    y0 = get_y_top(x)
    y1 = get_y_cutout(x)
    y = y0 + t * (y1 - y0)
    dx = (t - 0.5) * (y1 - y0) * 0.13
    return (x + dx, y)

def find_coeffs(pa, pb):
    """
    Compute 8-tuple perspective transform coefficients mapping pb (quad in dst) to pa (rect in src).
    """
    matrix = []
    for p1, p2 in zip(pa, pb):
        matrix.append([p2[0], p2[1], 1, 0, 0, 0, -p1[0]*p2[0], -p1[1]*p2[1]])
        matrix.append([0, 0, 0, p2[0], p2[1], 1, -p1[1]*p2[0], -p1[1]*p2[1]])
    A = np.matrix(matrix, dtype=float)
    B = np.array(pa).reshape(8)
    res = np.dot(np.linalg.inv(A), B)
    return np.array(res).reshape(8)

def project_quad(source_image, dst_size, quad):
    """
    Warp source_image into dst_size canvas fitting within the 4-point quad [TL, TR, BR, BL].
    """
    sw, sh = source_image.size
    src_rect = [(0, 0), (sw, 0), (sw, sh), (0, sh)]
    coeffs = find_coeffs(src_rect, quad)
    return source_image.transform(dst_size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)

# ==================== GENERATING OPTION 1: UV SILK-SCREEN PRINT ====================
print("Creating Option 1: UV Silk-Screen Brand...")
opt1 = base_im.copy()

# Logo placement: centered at x ~ 585
# Width ~ 460px. Aspect ratio of logo is 943 / 171 = 5.514.
# Height in 3D should be 460 / 5.514 = ~83.4px.
# Forehead height at x=585 is: get_y_cutout(585) - get_y_top(585) = 283.5 - 103.4 = 180.1px.
# So logo height is 83.4 / 180.1 = 0.463 of forehead height.
# We center it vertically at t_center = 0.46: t_top = 0.23, t_bot = 0.69.
# x_left = 355, x_right = 815 (width = 460).

t_top = 0.22
t_bot = 0.69
x_l = 355
x_r = 815

quad_logo = [
    get_face_pt(x_l, t_top),
    get_face_pt(x_r, t_top),
    get_face_pt(x_r, t_bot),
    get_face_pt(x_l, t_bot)
]

warped_logo = project_quad(logo_im, (orig_w, orig_h), quad_logo)

# Subtle shadow underneath logo (ink film contact shadow)
shadow_layer = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
# Shift logo slightly down-right
w_arr = np.array(warped_logo)
alpha_mask = Image.fromarray(w_arr[:, :, 3])
shadow_mask = alpha_mask.filter(ImageFilter.GaussianBlur(1.5))
shadow_tint = Image.new('RGBA', (orig_w, orig_h), (40, 35, 30, 90))
shadow_layer.paste(shadow_tint, (1, 2), shadow_mask)

opt1 = Image.alpha_composite(opt1, shadow_layer)
opt1 = Image.alpha_composite(opt1, warped_logo)

# Add sleek day labels above the 7 columns: T2, T3, T4, T5, T6, T7, CN
# We create a flat banner for the 7 days and project it with perspective!
day_banner_w = 900
day_banner_h = 45
day_banner = Image.new('RGBA', (day_banner_w, day_banner_h), (0, 0, 0, 0))
d_draw = ImageDraw.Draw(day_banner)

try:
    font_day = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
except:
    font_day = ImageFont.load_default()

days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
col_xs = np.linspace(50, day_banner_w - 50, 7)
for day_str, cx in zip(days, col_xs):
    # draw text centered at cx
    bbox = d_draw.textbbox((0, 0), day_str, font=font_day)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d_draw.text((cx - tw/2, (day_banner_h - th)/2), day_str, fill=(70, 85, 115, 210), font=font_day)

# Project day banner right above the cutout (t = 0.82 to 0.96)
quad_days = [
    get_face_pt(320, 0.82),
    get_face_pt(870, 0.82),
    get_face_pt(870, 0.97),
    get_face_pt(320, 0.97)
]
warped_days = project_quad(day_banner, (orig_w, orig_h), quad_days)
opt1 = Image.alpha_composite(opt1, warped_days)

opt1.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt1_uv_print.jpg', quality=95)
print("Saved Option 1: UV Silk-Screen")

# ==================== GENERATING OPTION 2: 3D EMBOSSED LUXURY BADGE ====================
print("Creating Option 2: 3D Embossed Luxury Badge...")
opt2 = base_im.copy()

# Create embossed version of logo
# 1. Bevel highlight (white gleam on top/right edges)
# 2. Deep ambient occlusion shadow on bottom/left
arr_logo = np.array(logo_im, dtype=float)
a = arr_logo[:, :, 3] / 255.0

# Shift masks
shift_hi = np.pad(a, ((2, 0), (2, 0)), mode='constant')[:-2, :-2]
shift_sh = np.pad(a, ((0, 3), (0, 3)), mode='constant')[3:, 3:]

hi_mask = np.clip(shift_hi - a, 0, 1)
sh_mask = np.clip(shift_sh - a, 0, 1)

# Highlight layer (glossy white rim)
hi_img = np.zeros((lh, lw, 4), dtype=np.uint8)
hi_img[:, :, :3] = 255
hi_img[:, :, 3] = (hi_mask * 210).astype(np.uint8)
hi_pil = Image.fromarray(hi_img, 'RGBA').filter(ImageFilter.GaussianBlur(1.0))

# Shadow layer
sh_img = np.zeros((lh, lw, 4), dtype=np.uint8)
sh_img[:, :, 0] = 30
sh_img[:, :, 1] = 25
sh_img[:, :, 2] = 20
sh_img[:, :, 3] = (sh_mask * 180).astype(np.uint8)
sh_pil = Image.fromarray(sh_img, 'RGBA').filter(ImageFilter.GaussianBlur(2.0))

# Composite 3D logo in source space:
# base shadow -> logo with subtle gradient -> highlight
logo_3d = Image.new('RGBA', (lw, lh), (0, 0, 0, 0))
logo_3d = Image.alpha_composite(logo_3d, sh_pil)
logo_3d = Image.alpha_composite(logo_3d, logo_im)
logo_3d = Image.alpha_composite(logo_3d, hi_pil)

# Project embossed 3D logo onto forehead
warped_3d_logo = project_quad(logo_3d, (orig_w, orig_h), quad_logo)

# Cast shadow onto the plastic face
cast_shadow = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
w_arr2 = np.array(warped_3d_logo)
a_mask2 = Image.fromarray(w_arr2[:, :, 3]).filter(ImageFilter.GaussianBlur(3.0))
cast_tint = Image.new('RGBA', (orig_w, orig_h), (35, 30, 25, 120))
cast_shadow.paste(cast_tint, (2, 4), a_mask2)

opt2 = Image.alpha_composite(opt2, cast_shadow)
opt2 = Image.alpha_composite(opt2, warped_3d_logo)
opt2 = Image.alpha_composite(opt2, warped_days)

# Add a subtle metallic accent trim line between forehead and compartment window
trim_w = 900
trim_h = 6
trim_im = Image.new('RGBA', (trim_w, trim_h), (0, 0, 0, 0))
t_draw = ImageDraw.Draw(trim_im)
t_draw.line([(0, 2), (trim_w, 2)], fill=(0, 119, 216, 180), width=3)
quad_trim = [
    get_face_pt(310, 0.77),
    get_face_pt(880, 0.77),
    get_face_pt(880, 0.80),
    get_face_pt(310, 0.80)
]
warped_trim = project_quad(trim_im, (orig_w, orig_h), quad_trim)
opt2 = Image.alpha_composite(opt2, warped_trim)

opt2.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt2_3d_embossed.jpg', quality=95)
print("Saved Option 2: 3D Embossed Luxury Badge")

# ==================== GENERATING OPTION 3: SMART OLED CONSOLE ====================
print("Creating Option 3: Smart OLED Glass Console...")
opt3 = base_im.copy()

# Render a high-tech curved OLED display strip across the upper section
disp_w = 1200
disp_h = 320
disp = Image.new('RGBA', (disp_w, disp_h), (0, 0, 0, 0))
disp_draw = ImageDraw.Draw(disp)

# Rounded dark glass background (deep obsidian blue / black with glass gradient)
for y in range(disp_h):
    # gradient from glossy highlight at top to deep OLED black
    factor = y / disp_h
    if factor < 0.25:
        r = int(35 + (1 - factor*4) * 25)
        g = int(45 + (1 - factor*4) * 35)
        b = int(65 + (1 - factor*4) * 50)
    else:
        r = int(12 + factor * 8)
        g = int(18 + factor * 10)
        b = int(28 + factor * 14)
    disp_draw.line([(0, y), (disp_w, y)], fill=(r, g, b, 245))

# Glass bezel / border
disp_draw.rectangle([0, 0, disp_w - 1, disp_h - 1], outline=(70, 110, 160, 180), width=2)
# Top specular reflection line
disp_draw.line([(10, 3), (disp_w - 10, 3)], fill=(200, 230, 255, 120), width=2)

# Place CalenDIA+ logo on the left of OLED
logo_small = logo_im.copy()
# Make logo pop with subtle emissive cyan/white backlight
logo_small_w = 460
logo_small_h = int(lh * (logo_small_w / lw))
logo_small = logo_small.resize((logo_small_w, logo_small_h), Image.LANCZOS)
disp.paste(logo_small, (50, 45), logo_small)

# Digital clock & UI on the right side of OLED display
try:
    font_clock = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 56)
    font_date = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 24)
    font_status = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
    font_icon = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
except:
    font_clock = ImageFont.load_default()
    font_date = ImageFont.load_default()
    font_status = ImageFont.load_default()
    font_icon = ImageFont.load_default()

# Clock
disp_draw.text((780, 35), "08:00", fill=(255, 255, 255, 255), font=font_clock)
disp_draw.text((950, 45), "AM", fill=(56, 189, 248, 255), font=font_date)

# Date & Reminder status
disp_draw.text((780, 105), "THỨ NĂM, 05/11", fill=(148, 163, 184, 255), font=font_date)
# Status pill
disp_draw.rounded_rectangle([50, 180, 520, 235], radius=12, fill=(30, 58, 138, 200), outline=(56, 189, 248, 150))
disp_draw.text((70, 192), "● ĐÃ ĐẾN GIỜ UỐNG THUỐC SÁNG", fill=(56, 189, 248, 255), font=font_status)

# Day of week row embedded at bottom of OLED panel
day_names = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
day_xs = np.linspace(80, disp_w - 80, 7)
active_idx = 3 # Thứ 5 (Thursday) active!

for idx, (dname, dx) in enumerate(zip(day_names, day_xs)):
    bbox = disp_draw.textbbox((0, 0), dname, font=font_status)
    tw = bbox[2] - bbox[0]
    if idx == active_idx:
        # Active day highlight in bright cyan pill
        disp_draw.rounded_rectangle([dx - 35, 255, dx + 35, 305], radius=8, fill=(0, 119, 216, 230), outline=(56, 189, 248, 255), width=2)
        disp_draw.text((dx - tw/2, 267), dname, fill=(255, 255, 255, 255), font=font_status)
    else:
        disp_draw.text((dx - tw/2, 267), dname, fill=(148, 163, 184, 200), font=font_status)

# Project OLED panel across forehead area (t = 0.08 to 0.94, x = 270 to 885)
quad_disp = [
    get_face_pt(265, 0.06),
    get_face_pt(890, 0.06),
    get_face_pt(890, 0.95),
    get_face_pt(265, 0.95)
]

# Glass cast shadow
glass_shadow = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
gs_draw = ImageDraw.Draw(glass_shadow)
# polygon shadow
gs_draw.polygon([
    (p[0] + 3, p[1] + 5) for p in quad_disp
], fill=(20, 15, 10, 130))
glass_shadow = glass_shadow.filter(ImageFilter.GaussianBlur(5.0))

opt3 = Image.alpha_composite(opt3, glass_shadow)
warped_disp = project_quad(disp, (orig_w, orig_h), quad_disp)
opt3 = Image.alpha_composite(opt3, warped_disp)

opt3.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt3_smart_oled.jpg', quality=95)
print("Saved Option 3: Smart OLED Glass Console")

# ==================== GENERATING OPTION 4: COMPLETE LIFESTYLE MASTERPIECE ====================
print("Creating Option 4: Complete Hero Masterpiece (Embossed Logo + Active Dose Lighting)...")
opt4 = opt2.copy()
# In opt4, let's also illuminate one of the 28 pill compartments with warm amber/cyan LED backlight to show how the smart device works!
# Thu 5, Sang is Col 4, Row 1 (near top-left/center of grid).
# Let's add a gentle warm glow inside Col 4, Row 1:
glow_layer = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
g_draw = ImageDraw.Draw(glow_layer)

# Compartment 4, Row 1 coordinates:
# x around 585 to 665, y around 380 to 440
g_draw.rounded_rectangle([595, 385, 665, 435], radius=6, fill=(0, 190, 255, 160))
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(8.0))
opt4 = Image.alpha_composite(opt4, glow_layer)

# Re-composite the crisp illuminated compartment rim
rim_layer = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
r_draw = ImageDraw.Draw(rim_layer)
r_draw.rounded_rectangle([600, 390, 660, 430], radius=4, outline=(180, 240, 255, 230), width=2)
opt4 = Image.alpha_composite(opt4, rim_layer)

opt4.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt4_complete_hero.jpg', quality=95)
print("Saved Option 4: Complete Hero Masterpiece")

print("All 4 design options created successfully!")
