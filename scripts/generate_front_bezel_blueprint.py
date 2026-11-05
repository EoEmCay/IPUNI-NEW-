import os
from PIL import Image, ImageDraw, ImageFont

# Canvas Setup: 2400 x 1550 CAD Blueprint
W, H = 2400, 1550
img = Image.new('RGB', (W, H), color='#0B132B') # Dark CAD theme
draw = ImageDraw.Draw(img)

# Load Windows System Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 40)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 25)
font_subheading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 21)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 19)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 22)
font_dim_small = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 16)
font_brand = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 26)

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

# Outer Border
draw.rectangle([(30, 30), (W-30, H-30)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(50, 45), (W-50, 145)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 56), 'BẢN VẼ THIẾT KẾ CHI TIẾT CAD: KHUNG VỎ MẶT TRƯỚC (FRONT BEZEL - PART [1])', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • 230.0 × 180.0 × 18.0 mm • 28 CỬA SỔ KHỞI TẠO • NHẬN DIỆN THƯƠNG HIỆU CHÂN ĐẾ', fill='#38BDF8', font=font_subtitle)

# Helper function to draw dimension lines
def draw_dim_h(x1, x2, y, text, offset_text=14, color='#38BDF8'):
    draw.line([(x1, y), (x2, y)], fill=color, width=2)
    draw.polygon([(x1, y), (x1+10, y-4), (x1+10, y+4)], fill=color)
    draw.polygon([(x2, y), (x2-10, y-4), (x2-10, y+4)], fill=color)
    draw.line([(x1, y-10), (x1, y+10)], fill=color, width=1)
    draw.line([(x2, y-10), (x2, y+10)], fill=color, width=1)
    bbox = font_dim.getbbox(text)
    tw = bbox[2] - bbox[0]
    draw.text(((x1 + x2 - tw)//2, y - offset_text - 15), text, fill='#FFFFFF', font=font_dim)

def draw_dim_v(x, y1, y2, text, offset_text=15, color='#38BDF8'):
    draw.line([(x, y1), (x, y2)], fill=color, width=2)
    draw.polygon([(x, y1), (x-4, y1+10), (x+4, y1+10)], fill=color)
    draw.polygon([(x, y2), (x-4, y2-10), (x+4, y2-10)], fill=color)
    draw.line([(x-10, y1), (x+10, y1)], fill=color, width=1)
    draw.line([(x-10, y2), (x+10, y2)], fill=color, width=1)
    draw.text((x + offset_text, (y1 + y2)//2 - 12), text, fill='#FFFFFF', font=font_dim)

# ==================== PANEL 1: HÌNH CHIẾU MẶT TRƯỚC (FRONT VIEW) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1260, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. HÌNH CHIẾU MẶT TRƯỚC (FRONT ELEVATION VIEW - 230 × 180 mm)', fill='#FFFFFF', font=font_heading)

# Scale: 4.8 px per mm
scale = 4.8
b_w_px = 230.0 * scale # 1104 px
b_h_px = 180.0 * scale # 864 px (fits tightly with padding, let's use scale = 4.3 for comfort)
scale = 4.3
b_w_px = 230.0 * scale # 989 px
b_h_px = 180.0 * scale # 774 px (wait, panel height is 830, top header is 55, available is 775)
# Let's use scale = 3.8
scale = 3.8
b_w_px = 230.0 * scale # 874 px
b_h_px = 180.0 * scale # 684 px

bx0 = p1_x + (p1_w - b_w_px) // 2 + 30
by0 = p1_y + 90

# Outer Main Shell (Front Bezel with R=8mm corners)
draw.rounded_rectangle([(bx0, by0), (bx0 + b_w_px, by0 + b_h_px)], radius=18, fill='#1E293B', outline='#93C5FD', width=3)

# Top Display Window (Smoked Acrylic Bezel: ~190mm x 25mm)
top_w_px = 190.0 * scale # 722 px
top_h_px = 24.0 * scale  # 91 px
top_x0 = bx0 + (b_w_px - top_w_px) // 2
top_y0 = by0 + 20 * scale # 76 px down from top
draw.rounded_rectangle([(top_x0, top_y0), (top_x0 + top_w_px, top_y0 + top_h_px)], radius=10, fill='#090D16', outline='#475569', width=2)
draw.text((top_x0 + 40, top_y0 + 28), 'CỬA SỔ HIỂN THỊ MICA ĐEN KHÓI (190.0 × 24.0 mm)', fill='#64748B', font=font_bold)

# Column Headers (Mon -> Sun)
days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
pw_px = 26.8 * scale # 101.8 px (opening width)
ph_px = 20.8 * scale # 79.0 px  (opening height)
rib_px = 3.5 * scale # 13.3 px

mat_w_px = 7 * pw_px + 6 * rib_px
mat_x0 = bx0 + (b_w_px - mat_w_px) // 2 + 15 * scale # shift right for row labels
mat_y0 = top_y0 + top_h_px + 14 * scale

# Draw Day Labels above matrix
for c, day in enumerate(days):
    cx = mat_x0 + c * (pw_px + rib_px)
    draw.text((cx + pw_px//2 - 18, mat_y0 - 28), day, fill='#94A3B8', font=font_bold)

# Row Headers (MORN, NOON, EVE, NIGHT)
times = ['MORN', 'NOON', 'EVE', 'NIGHT']
for r, t in enumerate(times):
    cy = mat_y0 + r * (ph_px + rib_px)
    draw.text((mat_x0 - 75, cy + ph_px//2 - 12), t, fill='#94A3B8', font=font_dim_small)

# Draw 28 Window Cutouts
for r in range(4):
    for c in range(7):
        cx = mat_x0 + c * (pw_px + rib_px)
        cy = mat_y0 + r * (ph_px + rib_px)
        
        # Step recess border (1.0mm)
        draw.rectangle([(cx - 2, cy - 2), (cx + pw_px + 2, cy + ph_px + 2)], fill='#0F172A', outline='#334155', width=1)
        # Main cutout opening
        draw.rectangle([(cx, cy), (cx + pw_px, cy + ph_px)], fill='#030712', outline='#60A5FA', width=2)
        # Inner guide shadow
        draw.rectangle([(cx + 3, cy + 3), (cx + pw_px - 3, cy + ph_px - 3)], outline='#1E3A8A', width=1)

# Highlight One Cutout with Dimensions (Col 1, Row 1)
hl_cx = mat_x0 + 1 * (pw_px + rib_px)
hl_cy = mat_y0 + 1 * (ph_px + rib_px)
draw.rectangle([(hl_cx, hl_cy), (hl_cx + pw_px, hl_cy + ph_px)], outline='#FBBF24', width=2)
draw.text((hl_cx + 8, hl_cy + 15), '26.8 mm', fill='#FDE047', font=font_dim_small)
draw.text((hl_cx + 8, hl_cy + 42), '× 20.8 mm', fill='#FDE047', font=font_dim_small)

# Bottom Chin Area: DIAPLUS D+ Logo & CalenDIA+
chin_y0 = mat_y0 + 4 * ph_px + 3 * rib_px + 12 * scale
chin_x0 = bx0 + b_w_px // 2 - 130

# D+ logo glyph mockup
draw.ellipse([(chin_x0 - 55, chin_y0 + 2), (chin_x0 - 15, chin_y0 + 42)], fill='#1D4ED8', outline='#38BDF8', width=2)
draw.text((chin_x0 - 45, chin_y0 + 6), 'D+', fill='#FFFFFF', font=font_bold)
draw.text((chin_x0, chin_y0 + 7), 'CalenDIA+', fill='#FFFFFF', font=font_brand)
draw.text((chin_x0 + 160, chin_y0 + 14), 'by DIAPLUS', fill='#38BDF8', font=font_dim_small)

# Overall Dimensions
draw_dim_h(bx0, bx0 + b_w_px, by0 - 45, 'TỔNG CHIỀU RỘNG W = 230.0 mm (R = 8.0 mm)')
draw_dim_v(bx0 - 110, by0, by0 + b_h_px, 'CHIỀU CAO H = 180.0 mm')

# ==================== PANEL 2: MẶT SAU & 8 TRỤ REN M3 (REAR VIEW) ====================
p2_x, p2_y, p2_w, p2_h = 1350, 165, 990, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. HÌNH CHIẾU MẶT SAU: 8 TRỤ BẮT ỐC REN M3 & GỜ ĐỊNH VỊ', fill='#FFFFFF', font=font_heading)

# Scaled down rear representation
r_scale = 3.2
rb_w_px = 230.0 * r_scale # 736 px
rb_h_px = 180.0 * r_scale # 576 px
rx0 = p2_x + (p2_w - rb_w_px) // 2
ry0 = p2_y + 90

# Rear hollow cavity border
draw.rounded_rectangle([(rx0, ry0), (rx0 + rb_w_px, ry0 + rb_h_px)], radius=15, fill='#152238', outline='#60A5FA', width=3)
# Inner pocket boundary (Thành viền dày 2.5mm)
draw.rounded_rectangle([(rx0 + 10, ry0 + 10), (rx0 + rb_w_px - 10, ry0 + rb_h_px - 10)], radius=12, fill='#0B132B', outline='#334155', width=2)

# Central Matrix opening for Part 3 Honeycomb frame (202.5 x 93.0 mm)
c_w = 202.5 * r_scale
c_h = 93.0 * r_scale
cx0 = rx0 + (rb_w_px - c_w) // 2
cy0 = ry0 + 52 * r_scale
draw.rectangle([(cx0, cy0), (cx0 + c_w, cy0 + c_h)], fill='#1E293B', outline='#FBBF24', width=2)
draw.text((cx0 + 15, cy0 + c_h//2 - 12), 'KHOANG ĐÓN KHUNG TỔ ONG PART 3 (202.5 × 93.0 mm)', fill='#FDE047', font=font_bold)

# 8 Cylindrical Mounting Bosses for M3 brass heat-set inserts (Ø 6.0 mm with Ø 4.1 mm hole)
boss_coords = [
    (cx0 - 25, cy0 + 20), (cx0 - 25, cy0 + c_h - 20), # Left pair
    (cx0 + c_w + 25, cy0 + 20), (cx0 + c_w + 25, cy0 + c_h - 20), # Right pair
    (cx0 + 80, cy0 - 25), (cx0 + c_w - 80, cy0 - 25), # Top pair
    (cx0 + 80, cy0 + c_h + 25), (cx0 + c_w - 80, cy0 + c_h + 25) # Bottom pair
]

for bx, by in boss_coords:
    # Outer boss circle
    draw.ellipse([(bx - 12, by - 12), (bx + 12, by + 12)], fill='#1E40AF', outline='#60A5FA', width=2)
    # Inner brass insert hole
    draw.ellipse([(bx - 6, by - 6), (bx + 6, by + 6)], fill='#F59E0B')

# Callout for Boss
bx, by = boss_coords[0]
draw.line([(bx, by), (bx - 40, by - 40)], fill='#FBBF24', width=2)
draw.line([(bx - 40, by - 40), (bx - 100, by - 40)], fill='#FBBF24', width=2)
draw.text((bx - 120, by - 70), '8× TRỤ REN M3', fill='#FDE047', font=font_bold)
draw.text((bx - 120, by - 45), '(Tán nhiệt đồng Ø4.1mm)', fill='#CBD5E1', font=font_dim_small)

# Snap-fit lugs on 4 sides
draw.rectangle([(rx0 + rb_w_px//2 - 30, ry0 + 4), (rx0 + rb_w_px//2 + 30, ry0 + 10)], fill='#34D399')
draw.rectangle([(rx0 + rb_w_px//2 - 30, ry0 + rb_h_px - 10), (rx0 + rb_w_px//2 + 30, ry0 + rb_h_px - 4)], fill='#34D399')
draw.rectangle([(rx0 + 4, ry0 + rb_h_px//2 - 25), (rx0 + 10, ry0 + rb_h_px//2 + 25)], fill='#34D399')
draw.rectangle([(rx0 + rb_w_px - 10, ry0 + rb_h_px//2 - 25), (rx0 + rb_w_px - 4, ry0 + rb_h_px//2 + 25)], fill='#34D399')
draw.text((rx0 + rb_w_px//2 - 80, ry0 + rb_h_px + 20), '4× NGÀM SẬP SNAP-FIT GẮN NẮP LƯNG', fill='#34D399', font=font_bold)

# Depth indicator
draw.text((rx0 + 30, ry0 + rb_h_px + 50), 'CHIỀU DÀY THÀNH VỎ: t = 2.5 mm • ĐỘ SÂU GỜ VIỀN: D = 18.0 mm', fill='#38BDF8', font=font_bold)

# ==================== PANEL 3: BẢNG THÔNG SỐ KỸ THUẬT & DUNG SAI PART [1] ====================
p3_x, p3_y, p3_w, p3_h = 60, 1020, W - 120, 460
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. BẢNG THÔNG SỐ HÌNH HỌC, DUNG SAI LẮP GHÉP & CHỈ DẪN IN 3D / ĐÚC PHUN CHO PART [1]', fill='#FFFFFF', font=font_heading)

# Table headers
t_cols = [p3_x+30, p3_x+480, p3_x+950, p3_x+1450, p3_x+1850]
t_y = p3_y + 75
draw.rectangle([(p3_x+20, t_y), (p3_x+p3_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'HẠNG MỤC CƠ KHÍ', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC TIÊU CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI YÊU CẦU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'CHỨC NĂNG LẮP GHÉP', fill='#38BDF8', font=font_bold)

table_data = [
    ('Kích thước bao ngoài phủ bì', 'Rộng 230.0 × Cao 180.0 × Sâu 18.0 mm', '± 0.25 mm', 'Định hình mặt diện thiết bị, vừa vặn bàn in 235×235 mm'),
    ('28 Cửa sổ lọt lòng ngăn kéo', 'Rộng 26.8 × Cao 20.8 mm (Gân 3.5 mm)', '+ 0.20 / - 0.00 mm', 'Đảm bảo ngăn kéo 26×20mm trượt qua êm, có gờ đón viền khít'),
    ('Cửa sổ hiển thị đỉnh máy', '190.0 × 24.0 mm (Bo góc R=6mm)', '± 0.15 mm', 'Gắn tấm mica đen khói bảo vệ màn hình OLED và đèn trạng thái'),
    ('8 Trụ ren liên kết mặt sau', 'Ø Ngoài 6.0 mm, Lỗ trong Ø 4.1 × sâu 5.5 mm', '± 0.05 mm', 'Cấy tán nhiệt đồng M3 để bắt vít siết khung tổ ong và nắp lưng'),
    ('Mặt vát chân đế & Nhận diện', 'In lụa / Khắc laser Logo D+ & CalenDIA+', 'Vị trí cân đối', 'Biểu tượng nhận diện DIAPLUS duy nhất, thanh lịch và trang nhã'),
    ('Vật liệu khuyên dùng', 'In 3D mẫu: PETG Trắng sứ | Đúc khuôn: Nhựa ABS trắng sứ', 'Độ phẳng bề mặt < 0.3mm', 'Chống cong vênh cạnh dài 230mm, bề mặt láng mịn sang trọng'),
    ('Hướng dẫn Slicer in 3D FDM', 'Mặt trước úp bàn in PEI nhám | Layer 0.20mm | Wall 4 | Infill 25%', 'Không cần Support', 'Mặt trước đạt độ mịn satin đồng nhất 100%, không lộ vân sợi')
]

curr_y = t_y + 55
for row in table_data:
    draw.rectangle([(p3_x+20, curr_y), (p3_x+p3_w-20, curr_y+43)], fill='#152238' if table_data.index(row)%2==0 else '#101C36')
    draw.text((t_cols[0], curr_y+10), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+10), row[1], fill='#FDE047', font=font_bold)
    draw.text((t_cols[2], curr_y+10), row[2], fill='#6EE7B7', font=font_label)
    draw.text((t_cols[3], curr_y+10), row[3], fill='#CBD5E1', font=font_label)
    curr_y += 46

# Output Path
out_path = 'd:/DIA+/ban_ve_khung_vo_mat_truoc_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
