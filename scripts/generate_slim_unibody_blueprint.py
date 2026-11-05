import os
from PIL import Image, ImageDraw, ImageFont

# Canvas Setup: 2400 x 1550 CAD Blueprint
W, H = 2400, 1550
img = Image.new('RGB', (W, H), color='#0A1128') # Deep CAD Navy
draw = ImageDraw.Draw(img)

# Load Windows System Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 32)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 19)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 22)
font_subheading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 16)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)
font_dim_small = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 14)

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#101C38', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#101C38', width=1)

# Outer Border
draw.rectangle([(25, 25), (W-25, H-25)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(45, 40), (W-45, 135)], fill='#131F37', outline='#38BDF8', width=2)
draw.text((70, 52), 'GIẢI PHÁP THIẾT KẾ: TRIỆT TIÊU LỒI ĐUÔI PHÍA SAU (FLUSH SLIM UNIBODY REDESIGN)', fill='#FFFFFF', font=font_title)
draw.text((70, 96), 'DỰ ÁN: CalenDIA+ • TỐI ƯU HỘC THUỐC VỪA ĐỦ 2 LẦN UỐNG • GIẢM ĐỘ DÀY TỪ 55mm XUỐNG 28mm • LƯNG PHẲNG 100%', fill='#34D399', font=font_subtitle)

# Helper function to draw dimension lines
def draw_dim_h(x1, x2, y, text, offset_y=-10, color='#38BDF8'):
    draw.line([(x1, y), (x2, y)], fill=color, width=2)
    draw.polygon([(x1, y), (x1+8, y-4), (x1+8, y+4)], fill=color)
    draw.polygon([(x2, y), (x2-8, y-4), (x2-8, y+4)], fill=color)
    draw.line([(x1, y-8), (x1, y+8)], fill=color, width=1)
    draw.line([(x2, y-8), (x2, y+8)], fill=color, width=1)
    bbox = font_dim.getbbox(text)
    tw = bbox[2] - bbox[0]
    draw.text(((x1 + x2 - tw)//2, y + offset_y - 18), text, fill='#FFFFFF', font=font_dim)

def draw_dim_v(x, y1, y2, text, align_right=False, color='#38BDF8'):
    draw.line([(x, y1), (x, y2)], fill=color, width=2)
    draw.polygon([(x, y1), (x-4, y1+8), (x+4, y1+8)], fill=color)
    draw.polygon([(x, y2), (x-4, y2-8), (x+4, y2-8)], fill=color)
    draw.line([(x-8, y1), (x+8, y1)], fill=color, width=1)
    draw.line([(x-8, y2), (x+8, y2)], fill=color, width=1)
    bbox = font_dim.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    if align_right:
        draw.text((x - tw - 12, (y1 + y2)//2 - th//2), text, fill='#FFFFFF', font=font_dim)
    else:
        draw.text((x + 12, (y1 + y2)//2 - th//2), text, fill='#FFFFFF', font=font_dim)

# ==================== PANEL 1: SO SÁNH TRỰC DIỆN MẶT BÊN (SIDE PROFILE COMPARISON) ====================
p1_x, p1_y, p1_w, p1_h = 50, 155, 1140, 770
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+48)], fill='#1E3A8A')
draw.text((p1_x+20, p1_y+12), '1. SO SÁNH HÌNH CHIẾU CẠNH: BẢN CŨ BỊ LỒI LƯNG (55mm) VS BẢN MỚI PHẲNG PHIU (28mm)', fill='#FFFFFF', font=font_heading)

# --- SUB-PANEL 1A: BẢN CŨ (HÌNH 2 CỦA USER: BỊ LỒI ĐUÔI RA SAU) ---
s1_x, s1_y = p1_x + 30, p1_y + 70
draw.rectangle([(s1_x, s1_y), (s1_x + 510, s1_y + 670)], fill='#162036', outline='#EF4444', width=2)
draw.rectangle([(s1_x, s1_y), (s1_x + 510, s1_y + 36)], fill='#991B1B')
draw.text((s1_x + 15, s1_y + 7), 'BẢN CŨ (HÌNH 2): BỊ LỒI ĐUÔI RA SAU QUÁ NHIỀU', fill='#FFFFFF', font=font_subheading)

# Draw Old Slanted Console (angle 75 deg, h = 480 px)
# Front Bezel (t = 18mm -> 36px)
# Base coordinate for ground:
g_y = s1_y + 570
# Slanted front face from (bx, gy) up to (tx, ty)
# tilt 15 deg from vertical (75 deg from horizontal)
bx_front = s1_x + 110
tx_front = bx_front + 115
by_front = g_y
ty_front = g_y - 430

# Front bezel thickness: 30px
bx_bez_back = bx_front + 35
tx_bez_back = tx_front + 35

# Front Bezel Polygon
draw.polygon([(bx_front, by_front), (tx_front, ty_front), (tx_bez_back, ty_front), (bx_bez_back, by_front)], fill='#E2E8F0', outline='#94A3B8', width=2)
draw.text((bx_front + 5, by_front - 230), 'Mặt trước\n(Dày 18mm)', fill='#0F172A', font=font_dim_small)

# The HUGE protruding rear block (4 rows of 48mm drawers sticking out!)
# Drawer length L = 48mm -> 96px!
# Starts from bez_back and sticks out to the right by 90px!
# Span across the 4 rows (y from by_front - 60 to by_front - 330)
r_y0 = ty_front + 110 # top row
r_y1 = by_front - 50  # bottom row
r_x0_top = tx_bez_back + 30
r_x0_bot = bx_bez_back + 15
r_x1_top = r_x0_top + 95 # protruding by ~48mm!
r_x1_bot = r_x0_bot + 95

# Draw protruding chassis block in warning red/dark grey
protrude_poly = [
    (r_x0_top, r_y0),
    (r_x1_top, r_y0),
    (r_x1_bot, r_y1),
    (r_x0_bot, r_y1)
]
draw.polygon(protrude_poly, fill='#334155', outline='#F87171', width=3)

# Hatched stripes on protruding area to emphasize the flaw
for hy in range(int(r_y0) + 15, int(r_y1), 25):
    t_h = (hy - r_y0) / (r_y1 - r_y0)
    hx0 = int(r_x0_top + t_h * (r_x0_bot - r_x0_top))
    hx1 = int(r_x1_top + t_h * (r_x1_bot - r_x1_top))
    draw.line([(hx0, hy), (hx1, hy)], fill='#EF4444', width=2)

draw.rectangle([(r_x1_top - 10, r_y0 + 40), (r_x1_top + 160, r_y0 + 130)], fill='#450A0A', outline='#EF4444', width=2)
draw.text((r_x1_top + 5, r_y0 + 48), 'LỒI RA PHÍA SAU!', fill='#FCA5A5', font=font_bold)
draw.text((r_x1_top + 5, r_y0 + 72), '• Hộc dài 48.0 mm\n• Khung tổ ong lòi 35mm\n• Dày tới 55 mm cồng kềnh!', fill='#FEE2E2', font=font_dim_small)

# Old Kickstand attached to protruding block
draw.line([(r_x1_bot - 20, r_y1 - 10), (s1_x + 360, g_y)], fill='#64748B', width=5)
draw.line([(s1_x + 360, g_y), (s1_x + 230, g_y)], fill='#64748B', width=5)

# Ground line
draw.line([(s1_x + 30, g_y), (s1_x + 480, g_y)], fill='#475569', width=2)

# Dimension for old thickness (55mm)
draw_dim_h(bx_front, r_x1_bot, g_y + 40, 'Độ dày cũ: 55.0 mm (BỊ DÀY & THÔ)', offset_y=5, color='#EF4444')


# --- SUB-PANEL 1B: BẢN THIẾT KẾ MỚI (SLIM FLUSH UNIBODY: PHẲNG PHIU 100%) ---
s2_x = p1_x + 570
draw.rectangle([(s2_x, s1_y), (s2_x + 540, s1_y + 670)], fill='#162036', outline='#34D399', width=2)
draw.rectangle([(s2_x, s1_y), (s2_x + 540, s1_y + 36)], fill='#065F46')
draw.text((s2_x + 15, s1_y + 7), 'BẢN THIẾT KẾ MỚI: PHẲNG LÌ 100% - KHÔNG HỀ BỊ LỒI', fill='#FFFFFF', font=font_subheading)

# Draw New Slanted Slim Console
bx2_front = s2_x + 120
tx2_front = bx2_front + 115
by2_front = g_y
ty2_front = g_y - 430

# New Sleek Unibody Back: only 26.0mm at top, 28.0mm at bottom (54px width)
bx2_back = bx2_front + 56
tx2_back = tx2_front + 52

# Single Continuous Unibody Polygon (Pure sleek slab!)
unibody_poly = [
    (bx2_front, by2_front),
    (tx2_front, ty2_front),
    (tx2_back, ty2_front),
    (bx2_back, by2_front)
]
draw.polygon(unibody_poly, fill='#1E293B', outline='#34D399', width=3)

# Internal Slim Drawers (L = 24.0mm -> 48px, perfectly housed inside!)
for i in range(4):
    y_row = ty2_front + 130 + i * 65
    t_row = (y_row - ty2_front) / 430.0
    x_front_row = bx2_front + (1 - t_row) * 115
    # Drawer box 46px long
    draw.rectangle([(x_front_row + 4, y_row), (x_front_row + 46, y_row + 48)], fill='#0F172A', outline='#38BDF8', width=2)
    # Drawer internal divider
    draw.line([(x_front_row + 25, y_row), (x_front_row + 25, y_row + 48)], fill='#FDE047', width=1)

# Back Wall is 100% FLUSH and Smooth
draw.line([(tx2_back, ty2_front), (bx2_back, by2_front)], fill='#10B981', width=4)

# Sleek Integrated kickstand (flush folded or elegant triangular strut)
draw.line([(bx2_back - 5, by2_front - 130), (s2_x + 280, g_y)], fill='#38BDF8', width=5)
draw.line([(s2_x + 280, g_y), (bx2_back, g_y)], fill='#38BDF8', width=5)

# Ground line
draw.line([(s2_x + 40, g_y), (s2_x + 500, g_y)], fill='#475569', width=2)

# Dimension for new thickness (28mm)
draw_dim_h(bx2_front, bx2_back, g_y + 40, 'Độ dày mới: 28.0 mm (GIẢM 49% - SIÊU MỎNG)', offset_y=5, color='#34D399')

# Callout badges for new design
draw.rectangle([(s2_x + 240, ty2_front + 50), (s2_x + 520, ty2_front + 180)], fill='#064E3B', outline='#34D399', width=2)
draw.text((s2_x + 252, ty2_front + 60), 'ƯU ĐIỂM ĐỘT PHÁ:', fill='#FDE047', font=font_bold)
draw.text((s2_x + 252, ty2_front + 88), '1. Hộc thuốc dài 24mm vừa khít thân vỏ.\n2. Lưng phẳng lì 100%, không lồi lõm.\n3. Khung tổ ong & LED giấu kín bên trong.\n4. Đứng nghiêng 75° siêu vững chãi!', fill='#ECFDF5', font=font_dim_small)


# ==================== PANEL 2: BÓC TÁCH HỘC THUỐC MỚI VỪA ĐỦ 2 LẦN UỐNG (NEW DRAWER SPEC) ====================
p2_x, p2_y, p2_w, p2_h = 1220, 155, 1130, 770
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+48)], fill='#1E3A8A')
draw.text((p2_x+20, p2_y+12), '2. BẢN VẼ BÓC TÁCH HỘC THUỐC SLIM: DÀI 24mm • CHIA 2 KHOANG VỪA ĐỦ CỮ UỐNG', fill='#FFFFFF', font=font_heading)

# Top View of New Slim Drawer
sc_d = 16.0 # scale factor
d_w = int(26.0 * sc_d) # 416 px
d_l = int(24.0 * sc_d) # 384 px (instead of 48*16 = 768px!)

dx0 = p2_x + 60
dy0 = p2_y + 110

# Outer contour (26.0 x 24.0 mm)
draw.rectangle([(dx0, dy0), (dx0 + d_l, dy0 + d_w)], fill='#1E293B', outline='#60A5FA', width=3)

# Inner Cavity (wall thickness 2.0mm -> 32px)
cav_x0 = dx0 + int(2.0 * sc_d)
cav_x1 = dx0 + d_l - int(2.0 * sc_d)
cav_y0 = dy0 + int(2.0 * sc_d)
cav_y1 = dy0 + d_w - int(2.0 * sc_d)
draw.rectangle([(cav_x0, cav_y0), (cav_x1, cav_y1)], fill='#0B132B', outline='#34D399', width=2)

# Central Partition Wall (t = 1.0mm -> 16px) dividing Front - Back
div_x = (cav_x0 + cav_x1) // 2
draw.rectangle([(div_x - 8, cav_y0), (div_x + 8, cav_y1)], fill='#38BDF8', outline='#7DD3FC', width=2)

# Text inside Compartment 1 (Front - Sáng)
draw.rectangle([(cav_x0 + 6, cav_y0 + 6), (div_x - 14, cav_y1 - 6)], fill='#172554')
draw.text((cav_x0 + 20, dy0 + d_w//2 - 40), 'NGĂN 1 (TRƯỚC)', fill='#FDE047', font=font_bold)
draw.text((cav_x0 + 15, dy0 + d_w//2 - 12), '22.0 × 9.5 mm', fill='#FFFFFF', font=font_heading)
draw.text((cav_x0 + 15, dy0 + d_w//2 + 20), 'Cữ Sáng / Trước ăn', fill='#34D399', font=font_bold)
draw.text((cav_x0 + 15, dy0 + d_w//2 + 45), '(Chứa 4-5 viên nang)', fill='#CBD5E1', font=font_dim_small)

# Text inside Compartment 2 (Rear - Tối)
draw.rectangle([(div_x + 14, cav_y0 + 6), (cav_x1 - 6, cav_y1 - 6)], fill='#172554')
draw.text((div_x + 30, dy0 + d_w//2 - 40), 'NGĂN 2 (SAU)', fill='#38BDF8', font=font_bold)
draw.text((div_x + 25, dy0 + d_w//2 - 12), '22.0 × 9.5 mm', fill='#FFFFFF', font=font_heading)
draw.text((div_x + 25, dy0 + d_w//2 + 20), 'Cữ Tối / Sau ăn', fill='#34D399', font=font_bold)
draw.text((div_x + 25, dy0 + d_w//2 + 45), '(Chứa 4-5 viên nang)', fill='#CBD5E1', font=font_dim_small)

# Dimension Lines
draw_dim_h(dx0, dx0 + d_l, dy0 - 25, 'Chiều Dài Hộc Mới: L = 24.0 mm (Giảm 50% so với 48mm)', offset_y=-5, color='#FDE047')
draw_dim_v(dx0 + d_l + 30, dy0, dy0 + d_w, 'Rộng W = 26.0 mm', color='#38BDF8')
draw_dim_h(cav_x0, div_x - 8, dy0 + d_w + 35, 'Ngăn 1: 9.5mm', offset_y=5, color='#34D399')
draw_dim_h(div_x + 8, cav_x1, dy0 + d_w + 35, 'Ngăn 2: 9.5mm', offset_y=5, color='#34D399')

# Detailed explanation box on the right of Panel 2
exp_x, exp_y = dx0 + d_l + 120, dy0
draw.rectangle([(exp_x, exp_y), (p2_x + p2_w - 30, exp_y + 580)], fill='#13203A', outline='#38BDF8', width=2)
draw.rectangle([(exp_x, exp_y), (p2_x + p2_w - 30, exp_y + 40)], fill='#1E3A8A')
draw.text((exp_x + 15, exp_y + 8), 'TẠI SAO KÍCH THƯỚC NÀY LÀ "VỪA ĐỦ" CHO 2 CỮ?', fill='#FFFFFF', font=font_bold)

text_reasons = [
    ('1. Phân tích toa thuốc thực tế:', '#FDE047', True),
    ('   • Bệnh nhân tiểu đường / cao tuổi uống 2 cữ/ngày.\n   • Mỗi cữ trung bình từ 2 đến 4 viên (Metformin,\n     Amlodipine, Atorvastatin, thuốc bổ).\n   • Thể tích 1 cữ thuốc chỉ khoảng 2.0 - 3.0 cm³.', '#CBD5E1', False),
    ('2. Dung tích khoang mới:', '#FDE047', True),
    ('   • Mỗi ngăn: 22.0 × 9.5 × 26.5 mm = 5.5 cm³.\n   • Đựng thoải mái 4 - 5 viên nang lớn (Size 0).\n   • Đạt 180% dung tích cần thiết -> Vừa vặn hoàn hảo!', '#34D399', False),
    ('3. Công thái học lấy thuốc dễ dàng:', '#FDE047', True),
    ('   • Chiều ngang 22.0 mm rất rộng rãi cho ngón tay.\n   • Đáy hộc bo cong máng trượt R = 2.0 mm giúp\n     chỉ cần miết nhẹ ngón tay là thuốc trượt ra.', '#CBD5E1', False),
    ('4. Hành trình bật lò xo chỉ 12.0 mm:', '#FDE047', True),
    ('   • Bấm nhả nảy ra 12mm là Ngăn 1 lộ 100% ra ngoài.\n   • Kéo nhẹ thêm 10mm là lấy được Ngăn 2.', '#38BDF8', False)
]

cur_ty = exp_y + 55
for header, color, is_head in text_reasons:
    draw.text((exp_x + 15, cur_ty), header, fill=color, font=font_bold if is_head else font_dim_small)
    lines_cnt = header.count('\n') + 1
    cur_ty += lines_cnt * 24 + (10 if not is_head else 5)


# ==================== PANEL 3: BẢNG SO SÁNH THÔNG SỐ VÀ DUNG SAI (SPEC MATRIX) ====================
p3_x, p3_y, p3_w, p3_h = 50, 950, W - 100, 550
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+48)], fill='#1E3A8A')
draw.text((p3_x+20, p3_y+12), '3. BẢNG SO SÁNH ĐỐI CHIẾU: BẢN CŨ (BỊ LỒI) VS BẢN MỚI (SLIM FLUSH UNIBODY)', fill='#FFFFFF', font=font_heading)

# Table Header
cols = [
    ('HẠNG MỤC THIẾT KẾ', 400),
    ('BẢN CŨ HÌNH 2 & 3 (BỊ LỒI LƯNG)', 580),
    ('BẢN THIẾT KẾ MỚI (CHỐNG LỒI TUYỆT ĐỐI)', 620),
    ('LỢI ÍCH CÔNG THÁI HỌC & THẨM MỸ', 660)
]

tbl_x0 = p3_x + 20
tbl_y0 = p3_y + 65
tbl_h_row = 46

cx = tbl_x0
for c_title, c_w in cols:
    draw.rectangle([(cx, tbl_y0), (cx + c_w, tbl_y0 + tbl_h_row)], fill='#1E293B', outline='#475569', width=1)
    draw.text((cx + 15, tbl_y0 + 12), c_title, fill='#38BDF8', font=font_bold)
    cx += c_w

tbl_data = [
    ('1. Chiều dài hộc thuốc (L)', '48.0 mm (Dư thừa quá mức)', '24.0 mm (Cắt giảm đúng 50%)', 'Tiết kiệm chiều sâu, vừa vặn không gian'),
    ('2. Độ dày toàn bộ máy', '55.0 mm (Khung tổ ong lòi ra sau 35mm)', '28.0 mm (Mỏng hơn 49%)', 'Mặt lưng phẳng phiu 100%, cực kỳ thẩm mỹ'),
    ('3. Kích thước 2 ngăn chia', '22.0 × 20.8 × 26.5 mm (Mỗi ngăn)', '22.0 × 9.5 × 26.5 mm (Mỗi ngăn)', 'Chiều ngang 22mm rộng rãi, chứa 4-5 viên/cữ'),
    ('4. Thể tích mỗi ngăn chứa', '12.1 cm³ (Đựng 15 viên - Quá thừa)', '5.5 cm³ (Đựng vừa đủ 4 - 5 viên/cữ)', 'Đúng chuẩn y tế 1 cữ uống của bệnh nhân'),
    ('5. Vỏ lưng máy (Back Cover)', 'Bị khoét hở, cơ cấu lòi ra gồ ghề', 'Kín khít, phẳng phiu nguyên khối', 'Chống bụi tuyệt đối, lau chùi dễ dàng'),
    ('6. Hành trình bấm nảy lò xo', '25.0 mm (Cần lò xo dài, lực đẩy lớn)', '12.0 mm (Lò xo ngắn, bấm siêu êm)', 'Nhẹ tay hơn, người già bấm dễ dàng'),
    ('7. Chân đế chống trượt', 'Gắn gượng ép vào khối lòi phía sau', 'Tích hợp gập phẳng âm mặt lưng', 'Gọn gàng như iPad / Surface Studio'),
    ('8. Khối lượng & Chi phí in', 'Nặng ~620g, tốn nhiều nhựa in 3D', 'Chỉ ~380g (Giảm 38% trọng lượng)', 'Tiết kiệm chi phí vật liệu, cầm nhẹ tay')
]

for row_idx, row in enumerate(tbl_data):
    ry = tbl_y0 + tbl_h_row * (row_idx + 1)
    bg_row = '#162036' if row_idx % 2 == 0 else '#0F172A'
    cx = tbl_x0
    for col_idx, (c_title, c_w) in enumerate(cols):
        draw.rectangle([(cx, ry), (cx + c_w, ry + tbl_h_row)], fill=bg_row, outline='#334155', width=1)
        val = row[col_idx]
        text_color = '#FFFFFF'
        if col_idx == 1 and 'BỊ' in val:
            text_color = '#FCA5A5'
        elif col_idx == 2:
            text_color = '#34D399'
        elif col_idx == 3:
            text_color = '#FDE047'
        draw.text((cx + 15, ry + 12), val, fill=text_color, font=font_bold if col_idx < 3 else font_dim_small)
        cx += c_w

# Save Blueprint
out_bp = 'd:/DIA+/ban_ve_giai_phap_chong_loi_lung_cad.png'
img.save(out_bp, quality=95)
print(f'Saved {out_bp} successfully!')

art_bp = 'C:/Users/lekho/.gemini/antigravity/brain/7251b335-744a-4e70-92c3-94b3b7f6903f/ban_ve_giai_phap_chong_loi_lung_cad.png'
img.save(art_bp, quality=95)
print(f'Saved {art_bp} successfully!')
