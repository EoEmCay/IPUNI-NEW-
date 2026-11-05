import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Load the seamless master KeyShot render
base_path = 'd:/DIA+/calendia_seamless_photoreal_drawer_cad.png'
base = Image.open(base_path).convert('RGB')
w, h = base.size

# Convert to numpy array for pixel-level lighting & shading
arr = np.array(base).copy()

# ==================== GEOMETRIC MODEL OF THE DIVIDER WALL ====================
# Transverse direction across drawer cavity:
# Far-top corner: (x_far, y_far) = (632, 203)
# Near-top corner: (x_near, y_near) = (733, 317)
# Slope of divider top crest: m_trans = (317 - 203) / (733 - 632) = 114 / 101 = 1.1287
#
# Longitudinal direction (along drawer length):
# m_long = -0.428
# Divider thickness: t = 1.2 mm (~7.0 pixels in render scale)
# Vector along length for +7 px: dx_t = +6.44 px, dy_t = -2.76 px
#
# Far-back-top corner: (632 + 6.4, 203 - 2.8) = (638.4, 200.2)
# Near-back-top corner: (733 + 6.4, 317 - 2.8) = (739.4, 314.2)

# Create an RGBA layer for smooth rendering
layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(layer)

# 1. Subtle drop shadow cast by divider into rear compartment (light from top-left)
shadow_poly = [
    (639, 200),
    (740, 314),
    (755, 322),
    (662, 212)
]
draw.polygon(shadow_poly, fill=(8, 14, 24, 110))

# 2. Render Front Face of Divider Wall
# Front face goes down from y_top(u) into the cavity
# Let's render the front face down to y_top(u) + depth(u)
# Depth varies from ~75 px at far wall to ~45 px at near wall (where pills accumulate)
for u_step in range(101):
    u = u_step / 100.0 # 0.0 at far wall, 1.0 at near wall
    xf = 632.0 + u * (733.0 - 632.0)
    yf_top = 203.0 + u * (317.0 - 203.0)
    wall_depth = 75.0 - u * 35.0 # 75px at far wall down to 40px at near wall

    # Render vertical column of front face
    x_int = int(round(xf))
    for v_step in range(int(round(wall_depth))):
        v = v_step / wall_depth # 0.0 at top, 1.0 at bottom (pill interface)
        y_int = int(round(yf_top + v_step))

        if 0 <= x_int < w and 0 <= y_int < h:
            # Satin white plastic shading model
            # Near top: slightly brighter (diffuse key light)
            # Going down: ambient occlusion shadow from cavity walls
            # At far wall: slightly cooler ambient; at near wall: warmer front light
            light_ao = 1.0 - 0.38 * (v ** 0.8)
            col_r = int(round((192 - 10 * (1 - u)) * light_ao))
            col_g = int(round((192 - 8 * (1 - u)) * light_ao))
            col_b = int(round((188 - 5 * (1 - u)) * light_ao))

            # Blend slightly with existing pill pixels near the bottom edge
            alpha = 255
            if v > 0.85:
                alpha = int(round(255 * (1.0 - (v - 0.85) / 0.15)))

            # Only draw if within bounds and front face
            draw.point((x_int, y_int), fill=(col_r, col_g, col_b, alpha))

# 3. Render Top Crest of Divider (Rounded chamfer, width ~ 7 px)
crest_poly = [
    (632, 203),
    (639, 200),
    (740, 314),
    (733, 317)
]
# Base top crest color (bright satin white)
draw.polygon(crest_poly, fill=(226, 227, 223, 255))

# Top-front highlight line (bright specular reflection along crest front edge)
draw.line([(632, 203), (733, 317)], fill=(255, 255, 252, 255), width=2)

# Top-rear subtle shadow bevel
draw.line([(639, 200), (740, 314)], fill=(182, 183, 179, 255), width=1)

# Fillet blend where divider meets the near top rim (at x=733, y=317)
near_blend = [
    (730, 315),
    (742, 312),
    (740, 323),
    (728, 325)
]
draw.polygon(near_blend, fill=(215, 216, 212, 230))
draw.line([(728, 320), (742, 314)], fill=(245, 245, 242, 255), width=2)

# Fillet blend where divider meets far wall (at x=632, y=203)
far_blend = [
    (630, 201),
    (641, 198),
    (641, 212),
    (630, 214)
]
draw.polygon(far_blend, fill=(195, 196, 192, 220))

# 4. Composite Layer onto Base Image
rendered = Image.alpha_composite(base.convert('RGBA'), layer).convert('RGB')
draw_cad = ImageDraw.Draw(rendered)

# ==================== CAD ANNOTATIONS & LEADER LINES ====================
# Load fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 16)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)

# Helper function to draw crisp CAD leader line with dot and callout box
def draw_callout_box(x_target, y_target, x_box, y_box, box_w, box_h, title, subtitle, line_color='#38BDF8', tag_color='#34D399'):
    # Draw target point & circle
    draw_cad.ellipse([(x_target-4, y_target-4), (x_target+4, y_target+4)], fill=line_color, outline='#FFFFFF', width=1)
    
    # Leader line: target -> elbow -> box
    if x_box > x_target:
        x_elbow = x_box - 25
        y_elbow = y_box + box_h // 2
        draw_cad.line([(x_target, y_target), (x_elbow, y_elbow)], fill=line_color, width=2)
        draw_cad.line([(x_elbow, y_elbow), (x_box, y_elbow)], fill=line_color, width=2)
    else:
        x_elbow = x_box + box_w + 25
        y_elbow = y_box + box_h // 2
        draw_cad.line([(x_target, y_target), (x_elbow, y_elbow)], fill=line_color, width=2)
        draw_cad.line([(x_elbow, y_elbow), (x_box + box_w, y_elbow)], fill=line_color, width=2)
        
    # Semi-transparent dark card background
    card = Image.new('RGBA', (box_w, box_h), (11, 20, 38, 235))
    card_draw = ImageDraw.Draw(card)
    card_draw.rectangle([(0, 0), (box_w-1, box_h-1)], outline=line_color, width=2)
    card_draw.rectangle([(0, 0), (box_w-1, 28)], fill='#1E293B')
    
    # Text inside card
    card_draw.text((12, 5), title, fill='#FFFFFF', font=font_bold)
    card_draw.text((12, 33), subtitle[0], fill=tag_color, font=font_bold)
    if len(subtitle) > 1:
        card_draw.text((12, 54), subtitle[1], fill='#CBD5E1', font=font_label)
        
    rendered.paste(card, (x_box, y_box), card)

# --- CALLOUT 1: NGĂN TRƯỚC (FRONT COMPARTMENT) ---
draw_callout_box(
    x_target=640, y_target=320,
    x_box=420, y_box=60,
    box_w=280, box_h=80,
    title='NGĂN 1 (TRƯỚC): 22.0 × 20.8 mm',
    subtitle=['• Thuốc Sáng / Trước ăn', '• Lộ 100% ngay khi bấm nhả 25 mm'],
    line_color='#FDE047', tag_color='#FDE047'
)

# --- CALLOUT 2: VÁCH NGĂN TRUNG TÂM (CENTRAL DIVIDER) ---
draw_callout_box(
    x_target=685, y_target=260,
    x_box=740, y_box=50,
    box_w=295, box_h=80,
    title='VÁCH NGĂN: t = 1.2 mm (R = 0.6 mm)',
    subtitle=['• Option 1: Đúc nhựa ABS liền khối', '• Option 2: Rãnh trượt mô-đun tháo lắp'],
    line_color='#38BDF8', tag_color='#38BDF8'
)

# --- CALLOUT 3: NGĂN SAU (REAR COMPARTMENT) ---
draw_callout_box(
    x_target=785, y_target=245,
    x_box=1050, y_box=110,
    box_w=280, box_h=80,
    title='NGĂN 2 (SAU): 22.0 × 20.8 mm',
    subtitle=['• Thuốc Tối / Sau ăn', '• Ngăn cách vật lý chống uống nhầm'],
    line_color='#34D399', tag_color='#34D399'
)

# --- CALLOUT 4: BADGE GÓC TRÁI DƯỚI (SPECS SUMMARY BADGE) ---
badge_w, badge_h = 360, 110
badge = Image.new('RGBA', (badge_w, badge_h), (10, 18, 36, 240))
b_draw = ImageDraw.Draw(badge)
b_draw.rectangle([(0, 0), (badge_w-1, badge_h-1)], outline='#3B82F6', width=2)
b_draw.rectangle([(0, 0), (badge_w-1, 26)], fill='#1D4ED8')
b_draw.text((10, 4), 'KẾT CẤU CHIA 2 NGĂN (DUAL COMPARTMENT)', fill='#FFFFFF', font=font_bold)
b_draw.text((10, 32), 'Kích thước lọt lòng: 22.0 (W) × 43.0 (L) × 26.5 (H) mm', fill='#CBD5E1', font=font_label)
b_draw.text((10, 53), 'Phân chia: 2 khoang đều nhau (22.0 × 20.8 mm / ngăn)', fill='#38BDF8', font=font_label)
b_draw.text((10, 74), 'Dung tích: ~12-15 viên nang chuẩn / khoang', fill='#34D399', font=font_bold)
rendered.paste(badge, (40, 620), badge)

# Save output
out_path = 'd:/DIA+/calendia_dual_compartment_drawer_cad.png'
rendered.save(out_path, quality=95)
print(f'Saved {out_path} successfully!')

# Also save to artifact directory
art_path = 'C:/Users/lekho/.gemini/antigravity/brain/7251b335-744a-4e70-92c3-94b3b7f6903f/calendia_dual_compartment_drawer_cad.png'
rendered.save(art_path, quality=95)
print(f'Saved {art_path} successfully!')
