import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Load original 1376 x 768 KeyShot render
src_path = 'C:/Users/lekho/.gemini/antigravity/brain/7251b335-744a-4e70-92c3-94b3b7f6903f/medicine_drawer_cad_corrected_30mm_1793866084836.jpg'
orig = Image.open(src_path).convert('RGB')
w, h = orig.size

arr = np.array(orig).copy()

# ==================== GEOMETRIC CONSTANTS ====================
# Reference point: at x = 640
# yt = 368.0 (top rim white crest)
# yr = 494.0 (guide rail center)
# yb = 549.0 (bottom edge chamfer)
# Perspective slope m = -0.455

def y_top(x):
    return 368.0 - 0.455 * (x - 640.0)

def y_bot(x):
    return 549.0 - 0.455 * (x - 640.0)

def y_rail(x):
    return 494.0 - 0.455 * (x - 640.0)

# ==================== STEP 1: CLEAN UP HANGING BLOCK BELOW Y_BOT(X) ====================
# The hanging block is located between x = 718 and x = 980, from y_bot(x) down to y_bot(x) + 40.
# Right below it is pure, clean blue blueprint background.
# We sample from y_bot(x) + 42 to fill the hanging block area with the pristine blue background.
for x in range(718, 980):
    yb = int(round(y_bot(x)))
    sample_y = min(yb + 42, h - 5)
    bg_color = orig.getpixel((x, sample_y))

    for y in range(yb, min(yb + 40, h - 5)):
        orig_p = orig.getpixel((x, y))
        # If the pixel was already part of the white text/arrow line, preserve it!
        if orig_p[0] > 220 and orig_p[1] > 220 and orig_p[2] > 220:
            continue
        # Replace plastic pixels (r > 50, g > 50) with clean background
        if orig_p[0] > 50 and orig_p[1] > 50:
            arr[y, x] = bg_color

# ==================== STEP 2: EXTRACT 1D PRISTINE MATERIAL PROFILE AT X = 640 ====================
x_ref = 640
yt_ref = 368.0 # Pure white top rim start (no pill color)
yr_ref = 494.0 # Rail center
yb_ref = 549.0 # Bottom edge chamfer

# Extract profile above rail
profile_above = []
for y in np.linspace(yt_ref, yr_ref, 100):
    profile_above.append(np.array(orig.getpixel((x_ref, int(round(y)))), dtype=float))
profile_above = np.array(profile_above)

# Extract profile below rail
profile_below = []
for y in np.linspace(yr_ref, yb_ref, 100):
    profile_below.append(np.array(orig.getpixel((x_ref, int(round(y)))), dtype=float))
profile_below = np.array(profile_below)

# ==================== STEP 3: APPLY SEAMLESS UNIBODY TEXTURE FROM X = 715 TO 980 ====================
for x in range(715, 980):
    yt = y_top(x)
    yb = y_bot(x)
    yr = y_rail(x)

    t_dist = (x - 715.0) / (980.0 - 715.0)
    ao = 1.0 - 0.08 * t_dist # subtle ambient occlusion as drawer enters slot

    # Blend factor at boundary x = 715..730
    blend_x = 1.0
    if x < 730:
        blend_x = 0.5 - 0.5 * math.cos(math.pi * (x - 715.0) / 15.0)

    # Upper panel (yt to yr)
    for y in range(int(round(yt)), int(round(yr))):
        v = (y - yt) / (yr - yt)
        idx = int(round(v * 99))
        idx = np.clip(idx, 0, 99)
        col = profile_above[idx] * ao

        if blend_x < 1.0:
            orig_col = np.array(arr[y, x], dtype=float)
            col = (1.0 - blend_x) * orig_col + blend_x * col

        arr[y, x] = np.clip(col, 0, 255).astype(np.uint8)

    # Lower panel (yr to yb)
    for y in range(int(round(yr)), int(round(yb))):
        v = (y - yr) / (yb - yr)
        idx = int(round(v * 99))
        idx = np.clip(idx, 0, 99)
        col = profile_below[idx] * ao

        if blend_x < 1.0:
            orig_col = np.array(arr[y, x], dtype=float)
            col = (1.0 - blend_x) * orig_col + blend_x * col

        arr[y, x] = np.clip(col, 0, 255).astype(np.uint8)

# ==================== STEP 4: ADD CRISP TOP RIM HIGHLIGHT ====================
for x in range(715, 980):
    yt = int(round(y_top(x)))
    arr[yt, x] = [228, 230, 228]
    if yt - 1 >= 0:
        arr[yt - 1, x] = [212, 214, 212]
    if yt - 2 >= 0:
        arr[yt - 2, x] = [178, 180, 178]
    if yt + 1 < h:
        arr[yt + 1, x] = [200, 202, 198]

# ==================== STEP 5: REDRAW GUIDE RAIL LEADER ARROW ====================
res_img = Image.fromarray(arr)
draw = ImageDraw.Draw(res_img)

# Leader line arrow pointing from (970, 290) down-left to the seamless guide rail at (860, y_rail(860))
xr, yr = 860, int(round(y_rail(860)))
draw.line([(xr, yr), (970, 290)], fill='#FFFFFF', width=2)
# Arrow head pointing to rail
draw.polygon([(xr, yr), (xr + 10, yr - 2), (xr + 7, yr - 9)], fill='#FFFFFF')

# Add subtle badge on top: 'THIẾT KẾ LIỀN MẠCH NGUYÊN KHỐI (SEAMLESS UNIBODY)'
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)
badge_text = 'THIẾT KẾ LIỀN MẠCH NGUYÊN KHỐI (SEAMLESS UNIBODY)'
bbox = font_bold.getbbox(badge_text)
tw = bbox[2] - bbox[0]
bx, by = w // 2 - tw // 2, 40
draw.rounded_rectangle([(bx - 18, by - 8), (bx + tw + 18, by + 34)], radius=6, fill='#081E3F', outline='#38BDF8', width=2)
draw.text((bx, by), badge_text, fill='#38BDF8', font=font_bold)

# Save output
out_path = 'd:/DIA+/calendia_seamless_photoreal_drawer_cad.png'
res_img.save(out_path, quality=98)
print(f'Successfully generated: {out_path}')
