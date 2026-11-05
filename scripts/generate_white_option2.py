import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

# Source paths
SRC_IMAGE_PATH = 'C:/Users/lekho/.gemini/antigravity/brain/c18f634d-dd4e-47df-9dfe-5173135c2f21/.user_uploaded/media_1793888633629_e3179101.jpg'
LOGO_PATH = 'd:/DIA+/logo_transparent.png'

# Load base 3D render and logo
base_im = Image.open(SRC_IMAGE_PATH).convert('RGBA')
orig_w, orig_h = base_im.size
logo_im = Image.open(LOGO_PATH).convert('RGBA')
lw, lh = logo_im.size

print(f"Base image: {orig_w}x{orig_h}, Logo: {lw}x{lh}")

# ==================== PERSPECTIVE SYSTEM ====================
def get_y_top(x):
    return -0.1247 * x + 176.38

def get_y_cutout(x):
    return -0.1937 * x + 396.88

def get_face_pt(x, t):
    y0 = get_y_top(x)
    y1 = get_y_cutout(x)
    y = y0 + t * (y1 - y0)
    dx = (t - 0.5) * (y1 - y0) * 0.13
    return (x + dx, y)

def find_coeffs(pa, pb):
    matrix = []
    for p1, p2 in zip(pa, pb):
        matrix.append([p2[0], p2[1], 1, 0, 0, 0, -p1[0]*p2[0], -p1[1]*p2[1]])
        matrix.append([0, 0, 0, p2[0], p2[1], 1, -p1[1]*p2[0], -p1[1]*p2[1]])
    A = np.matrix(matrix, dtype=float)
    B = np.array(pa).reshape(8)
    res = np.dot(np.linalg.inv(A), B)
    return np.array(res).reshape(8)

def project_quad(source_image, dst_size, quad):
    sw, sh = source_image.size
    src_rect = [(0, 0), (sw, 0), (sw, sh), (0, sh)]
    coeffs = find_coeffs(src_rect, quad)
    return source_image.transform(dst_size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)

# Quad for logo placement
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

# Quad for day labels
quad_days = [
    get_face_pt(320, 0.82),
    get_face_pt(870, 0.82),
    get_face_pt(870, 0.97),
    get_face_pt(320, 0.97)
]

# Quad for trim line
quad_trim = [
    get_face_pt(310, 0.77),
    get_face_pt(880, 0.77),
    get_face_pt(880, 0.80),
    get_face_pt(310, 0.80)
]

# ==================== STEP 1: CREATE 3D EMBOSSED WHITE LOGO ====================
print("Synthesizing 3D Embossed White Logo badge...")
arr_logo = np.array(logo_im, dtype=float)
alpha = arr_logo[:, :, 3] / 255.0

# 1. Bevel highlights (light from top-right: dx=-2, dy=-2)
shift_hi = np.pad(alpha, ((2, 0), (2, 0)), mode='constant')[:-2, :-2]
shift_sh = np.pad(alpha, ((0, 3), (0, 3)), mode='constant')[3:, 3:]
shift_deep_sh = np.pad(alpha, ((0, 6), (0, 6)), mode='constant')[6:, 6:]

hi_mask = np.clip(shift_hi - alpha, 0, 1)
sh_mask = np.clip(shift_sh - alpha, 0, 1)
deep_sh_mask = np.clip(shift_deep_sh - alpha, 0, 1)

# Base white fill with soft ambient lighting gradient
white_base = np.zeros((lh, lw, 4), dtype=np.uint8)
for y in range(lh):
    grad = int(252 - (y / lh) * 12)
    white_base[y, :, 0] = grad
    white_base[y, :, 1] = grad
    white_base[y, :, 2] = min(255, grad + 2)
    white_base[y, :, 3] = (alpha[y, :] * 255).astype(np.uint8)
white_base_pil = Image.fromarray(white_base, 'RGBA')

# Highlight layer (glossy pure white rim)
hi_img = np.zeros((lh, lw, 4), dtype=np.uint8)
hi_img[:, :, :3] = 255
hi_img[:, :, 3] = (hi_mask * 240).astype(np.uint8)
hi_pil = Image.fromarray(hi_img, 'RGBA').filter(ImageFilter.GaussianBlur(0.8))

# Ambient occlusion shadow layer (soft charcoal rim)
sh_img = np.zeros((lh, lw, 4), dtype=np.uint8)
sh_img[:, :, 0] = 70
sh_img[:, :, 1] = 75
sh_img[:, :, 2] = 85
sh_img[:, :, 3] = (sh_mask * 190).astype(np.uint8)
sh_pil = Image.fromarray(sh_img, 'RGBA').filter(ImageFilter.GaussianBlur(1.5))

# Deep cast shadow under the 3D relief
deep_img = np.zeros((lh, lw, 4), dtype=np.uint8)
deep_img[:, :, 0] = 50
deep_img[:, :, 1] = 55
deep_img[:, :, 2] = 65
deep_img[:, :, 3] = (deep_sh_mask * 140).astype(np.uint8)
deep_pil = Image.fromarray(deep_img, 'RGBA').filter(ImageFilter.GaussianBlur(3.0))

# Composite 3D White Logo
logo_white_3d = Image.new('RGBA', (lw, lh), (0, 0, 0, 0))
logo_white_3d = Image.alpha_composite(logo_white_3d, deep_pil)
logo_white_3d = Image.alpha_composite(logo_white_3d, sh_pil)
logo_white_3d = Image.alpha_composite(logo_white_3d, white_base_pil)
logo_white_3d = Image.alpha_composite(logo_white_3d, hi_pil)

# Project embossed 3D white logo
warped_white_logo = project_quad(logo_white_3d, (orig_w, orig_h), quad_logo)

# Cast shadow onto the plastic face
cast_shadow_layer = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
w_arr = np.array(warped_white_logo)
a_mask = Image.fromarray(w_arr[:, :, 3]).filter(ImageFilter.GaussianBlur(3.5))
cast_tint = Image.new('RGBA', (orig_w, orig_h), (40, 45, 55, 130))
cast_shadow_layer.paste(cast_tint, (2, 4), a_mask)

# ==================== DAY LABELS (T2 - CN) IN ELEGANT SILVER/WHITE ====================
day_banner_w = 900
day_banner_h = 45
day_banner_white = Image.new('RGBA', (day_banner_w, day_banner_h), (0, 0, 0, 0))
d_draw = ImageDraw.Draw(day_banner_white)

try:
    font_day = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
except:
    font_day = ImageFont.load_default()

days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
col_xs = np.linspace(50, day_banner_w - 50, 7)
for day_str, cx in zip(days, col_xs):
    bbox = d_draw.textbbox((0, 0), day_str, font=font_day)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # draw subtle shadow
    d_draw.text((cx - tw/2 + 1, (day_banner_h - th)/2 + 1), day_str, fill=(80, 85, 95, 120), font=font_day)
    # draw crisp white / silver text
    d_draw.text((cx - tw/2, (day_banner_h - th)/2), day_str, fill=(245, 248, 255, 235), font=font_day)

warped_days_white = project_quad(day_banner_white, (orig_w, orig_h), quad_days)

# Silver / White Trim Line
trim_w = 900
trim_h = 6
trim_im_white = Image.new('RGBA', (trim_w, trim_h), (0, 0, 0, 0))
t_draw = ImageDraw.Draw(trim_im_white)
t_draw.line([(0, 2), (trim_w, 2)], fill=(255, 255, 255, 220), width=3)
t_draw.line([(0, 4), (trim_w, 4)], fill=(120, 125, 135, 100), width=1)
warped_trim_white = project_quad(trim_im_white, (orig_w, orig_h), quad_trim)


# ==================== VARIATION 2.1: ALL-WHITE PORCELAIN MEDICAL CHASSIS ====================
print("Creating Variation 2.1: Pristine All-White Porcelain Chassis with 3D White Emboss...")
arr_base = np.array(base_im, dtype=float)
bg_mask = (arr_base[:, :, 0] > 250) & (arr_base[:, :, 1] > 250) & (arr_base[:, :, 2] > 250)

# Convert warm yellowish-beige body to pristine porcelain white
lum = 0.299 * arr_base[:, :, 0] + 0.587 * arr_base[:, :, 1] + 0.114 * arr_base[:, :, 2]
norm_lum = lum / 255.0
# Curve maps beige ~185-195 up to ~238-246, while preserving shadow gradients
new_lum = np.where(norm_lum < 0.98, (norm_lum ** 0.52) * 242.0, 255.0)

white_chassis_arr = np.zeros_like(arr_base)
for c, tint in enumerate([0.995, 1.002, 1.018]): # cool medical white tint
    white_chassis_arr[:, :, c] = np.clip(new_lum * tint, 0, 255)
white_chassis_arr[:, :, 3] = 255
white_chassis_arr[bg_mask] = [255, 255, 255, 255]

white_chassis_im = Image.fromarray(white_chassis_arr.astype(np.uint8), 'RGBA')

# Composite on all-white chassis
opt2_all_white = white_chassis_im.copy()
opt2_all_white = Image.alpha_composite(opt2_all_white, cast_shadow_layer)
opt2_all_white = Image.alpha_composite(opt2_all_white, warped_white_logo)
opt2_all_white = Image.alpha_composite(opt2_all_white, warped_trim_white)
opt2_all_white = Image.alpha_composite(opt2_all_white, warped_days_white)

opt2_all_white.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt2_all_white_porcelain.jpg', quality=95)
print("Saved Variation 2.1: All-White Porcelain Edition")


# ==================== VARIATION 2.2: WHITE 3D EMBOSS ON ORIGINAL BASE CAD ====================
print("Creating Variation 2.2: White 3D Embossed Logo on Original Shell...")
opt2_orig_shell = base_im.copy()
opt2_orig_shell = Image.alpha_composite(opt2_orig_shell, cast_shadow_layer)
opt2_orig_shell = Image.alpha_composite(opt2_orig_shell, warped_white_logo)
opt2_orig_shell = Image.alpha_composite(opt2_orig_shell, warped_trim_white)
opt2_orig_shell = Image.alpha_composite(opt2_orig_shell, warped_days_white)

opt2_orig_shell.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt2_white_on_original_shell.jpg', quality=95)
print("Saved Variation 2.2: White 3D Logo on Original Shell")


# ==================== VARIATION 2.3: ALL-WHITE CHASSIS + ACTIVE DOSE LED INDICATOR ====================
print("Creating Variation 2.3: All-White Chassis + Hero Active Dose LED Indicator...")
opt2_hero_white = opt2_all_white.copy()

# Add gentle warm amber/cyan LED illumination in active compartment (Thứ 5 - Sáng: Col 4, Row 1)
glow_layer = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
g_draw = ImageDraw.Draw(glow_layer)
g_draw.rounded_rectangle([595, 385, 665, 435], radius=6, fill=(0, 190, 255, 170))
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(8.0))
opt2_hero_white = Image.alpha_composite(opt2_hero_white, glow_layer)

# Illuminated crisp inner border
rim_layer = Image.new('RGBA', (orig_w, orig_h), (0, 0, 0, 0))
r_draw = ImageDraw.Draw(rim_layer)
r_draw.rounded_rectangle([600, 390, 660, 430], radius=4, outline=(190, 245, 255, 240), width=2)
opt2_hero_white = Image.alpha_composite(opt2_hero_white, rim_layer)

opt2_hero_white.convert('RGB').save('d:/DIA+/calendia_3d_decor_opt2_all_white_hero_led.jpg', quality=95)
print("Saved Variation 2.3: All-White Hero LED Edition")

print("All White Option 2 variations generated successfully!")
