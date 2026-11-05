import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Load the original high-resolution render (1376 x 768)
src_path = 'C:/Users/lekho/.gemini/antigravity/brain/7251b335-744a-4e70-92c3-94b3b7f6903f/medicine_drawer_cad_corrected_30mm_1793866084836.jpg'
im = Image.open(src_path).convert('RGB')
w, h = im.size

# Convert to numpy array for precision pixel manipulation
arr = np.array(im).copy()

# ==================== MATHEMATICAL GEOMETRY OF THE SEAMLESS SIDE WALL ====================
# Reference points on the clean front section:
# At x = 485 (where side meets front faceplate):
#   y_top = 425
# At x = 600:
#   y_top = 376, y_bot = 565
# At x = 700:
#   y_top = 333, y_bot = 522
# Linear equations for the continuous unibody plane:
# Slope m = -0.430
# y_top(x) = 376 - 0.430 * (x - 600) = 634.0 - 0.430 * x
# y_bot(x) = 565 - 0.430 * (x - 600) = 823.0 - 0.430 * x
# Rail center: y_rail(x) = 728.5 - 0.430 * x

def get_y_top(x):
    # Gentle perspective taper: slope slightly flattens from -0.430 to -0.415
    return 376.0 - 0.428 * (x - 600.0)

def get_y_bot(x):
    return 565.0 - 0.428 * (x - 600.0)

def get_y_rail(x):
    return 485.0 - 0.428 * (x - 600.0)

# ==================== STEP 1: CLEAN UP AREA BELOW Y_BOT(X) (REMOVE HANGING BLOCK) ====================
# Between x = 745 and x = 985, the hanging block extends from y_bot(x) down to y_bot(x) + 48 px.
# We replace it with the blue blueprint background, sampling from adjacent background columns.

# Sample background texture from the clean area below the drawer (y = 590 to 720, x = 740 to 990)
# The blueprint has a vertical grid line at x = 750, 800, 850, 900, 950, 1000, and horizontal lines every ~50px
for x in range(740, 990):
    y_b = int(round(get_y_bot(x)))
    # The hanging block goes from y_b to y_b + 55
    for y in range(y_b, min(y_b + 55, h - 20)):
        # Sample clean background from y + 70 or y + 90
        sample_y = min(y + 80, h - 10)
        # Preserve any white dimension lines/arrows if present
        # In original, the dimension line is at y ~ 660, so y < 620 is pure background
        arr[y, x] = arr[sample_y, x]

# ==================== STEP 2: FILL SEAMLESS SIDE WALL FROM X = 740 TO X = 990 ====================
# Side wall is defined between y_top(x) and y_bot(x)
# Shading model:
# Near y_top: bright rounded highlight (RGB: 195, 195, 190)
# Upper body (y_top + 10 to y_rail - 10): smooth satin gradient (RGB: 168, 168, 165 down to 158, 158, 156)
# Guide rail zone (y_rail - 8 to y_rail + 8):
#   - Upper bevel / highlight: RGB(200, 202, 200)
#   - Rail face: RGB(165, 165, 162)
#   - Lower groove / shadow: RGB(125, 125, 125)
# Lower body (y_rail + 10 to y_bot - 8): diffuse light shadow (RGB: 152, 152, 150)
# Bottom edge / chamfer (y_bot - 8 to y_bot): soft occlusion shadow (RGB: 135, 136, 138)

for x in range(740, 990):
    yt = get_y_top(x)
    yb = get_y_bot(x)
    yr = get_y_rail(x)
    wall_height = yb - yt

    for y in range(int(round(yt)), int(round(yb))):
        rel_pos = (y - yt) / wall_height # 0.0 at top, 1.0 at bottom
        dist_rail = y - yr

        # Guide Rail Rib (Height ~ 14 px)
        if -2 <= dist_rail <= 0:
            # Rail top bevel highlight
            color = np.array([198, 200, 196], dtype=float)
        elif 0 < dist_rail <= 6:
            # Rail front face
            color = np.array([168, 169, 166], dtype=float)
        elif 6 < dist_rail <= 10:
            # Rail lower shadow groove
            color = np.array([126, 126, 126], dtype=float)
        elif rel_pos < 0.05:
            # Top rounded rim highlight
            t_blend = rel_pos / 0.05
            color = (1.0 - t_blend) * np.array([215, 215, 210]) + t_blend * np.array([178, 178, 175])
        elif rel_pos < 0.5:
            # Upper wall panel
            t_blend = (rel_pos - 0.05) / 0.45
            color = (1.0 - t_blend) * np.array([178, 178, 175]) + t_blend * np.array([158, 158, 156])
        elif rel_pos > 0.94:
            # Bottom edge chamfer
            t_blend = (rel_pos - 0.94) / 0.06
            color = (1.0 - t_blend) * np.array([148, 148, 146]) + t_blend * np.array([132, 133, 135])
        else:
            # Lower wall panel
            t_blend = (rel_pos - 0.5) / 0.44
            color = (1.0 - t_blend) * np.array([158, 158, 156]) + t_blend * np.array([148, 148, 146])

        # Distance attenuation towards the rear slot (subtle ambient occlusion as it approaches the slot)
        t_dist = (x - 740) / 250.0
        shadow_factor = 1.0 - 0.08 * t_dist
        final_color = np.clip(color * shadow_factor, 0, 255).astype(np.uint8)

        # Smooth horizontal blend around seam at x = 740..755
        if x < 755:
            alpha = (x - 740) / 15.0
            arr[y, x] = (1.0 - alpha) * arr[y, x] + alpha * final_color
        else:
            arr[y, x] = final_color

# ==================== STEP 3: TOP INNER RIM (INNER LIP OF CAVITY) ====================
# Add the inner thickness of the top rim (wall thickness t = 2.0 mm -> ~ 10 px in perspective)
# From x = 740 to 985
for x in range(740, 985):
    yt = int(round(get_y_top(x)))
    for dy in range(-7, 0):
        y = yt + dy
        # Inner top lip shadow
        t_lip = (dy + 7) / 7.0
        lip_col = (1.0 - t_lip) * np.array([145, 145, 142]) + t_lip * np.array([215, 215, 210])
        arr[y, x] = lip_col.astype(np.uint8)

# Convert back to PIL Image for drawing annotations & anti-aliased lines
res_img = Image.fromarray(arr)
draw = ImageDraw.Draw(res_img)

# Load fonts
font_annot = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)

# Redraw the crisp leader line for 'Precision molded Horizontal guide rib'
# The arrow points to the guide rail at (x=860, y=get_y_rail(860))
rail_target = (860, int(round(get_y_rail(860))))
draw.line([(rail_target[0], rail_target[1]), (rail_target[0] + 50, rail_target[1] - 40)], fill='#FFFFFF', width=2)
draw.polygon([(rail_target[0], rail_target[1]), (rail_target[0]+8, rail_target[1]-2), (rail_target[0]+5, rail_target[1]-8)], fill='#FFFFFF')

# Redraw / clean the dimension line for 'Stroke = 25.0 mm'
# Extension line at x = 760 should now cleanly align with the drawer extension position
dim_y = 565
draw.line([(760, dim_y), (1030, dim_y)], fill='#FFFFFF', width=2)
# Arrows
draw.polygon([(760, dim_y), (770, dim_y - 4), (770, dim_y + 4)], fill='#FFFFFF')
draw.polygon([(1030, dim_y), (1020, dim_y - 4), (1020, dim_y + 4)], fill='#FFFFFF')

# Add subtle badge in upper center: 'THIẾT KẾ LIỀN MẠCH NGUYÊN KHỐI (SEAMLESS UNIBODY)'
badge_text = 'THIẾT KẾ LIỀN MẠCH NGUYÊN KHỐI (SEAMLESS UNIBODY)'
bbox = font_bold.getbbox(badge_text)
tw = bbox[2] - bbox[0]
bx, by = 688 - tw // 2, 40
draw.rounded_rectangle([(bx - 15, by - 8), (bx + tw + 15, by + 32)], radius=6, fill='#0B2247', outline='#38BDF8', width=2)
draw.text((bx, by), badge_text, fill='#38BDF8', font=font_bold)

# Save result
out_path = 'd:/DIA+/calendia_seamless_photoreal_drawer_cad.png'
res_img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
