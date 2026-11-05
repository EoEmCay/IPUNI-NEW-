import os
from PIL import Image, ImageDraw, ImageFont

# Canvas Setup: High Resolution CAD Blueprint
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
font_dim_small = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)
font_mono = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 18)

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

# Outer Border
draw.rectangle([(30, 30), (W-30, H-30)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(50, 45), (W-50, 145)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 56), 'BẢN VẼ THIẾT KẾ CHI TIẾT CAD: KHUNG TỔ ONG DẪN HƯỚNG NGUYÊN KHỐI', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • CHI TIẾT: PART [3] CORE HONEYCOMB MATRIX • 28 HỘC TRƯỢT • ĐỘ CHÍNH XÁC CAO', fill='#38BDF8', font=font_subtitle)

# Helper function to draw dimension line with arrows
def draw_dim_h(x1, x2, y, text, offset_text=14, color='#38BDF8'):
    draw.line([(x1, y), (x2, y)], fill=color, width=2)
    # Left arrow
    draw.polygon([(x1, y), (x1+10, y-4), (x1+10, y+4)], fill=color)
    # Right arrow
    draw.polygon([(x2, y), (x2-10, y-4), (x2-10, y+4)], fill=color)
    # Extension lines
    draw.line([(x1, y-10), (x1, y+10)], fill=color, width=1)
    draw.line([(x2, y-10), (x2, y+10)], fill=color, width=1)
    # Text
    bbox = font_dim.getbbox(text)
    tw = bbox[2] - bbox[0]
    draw.text(((x1 + x2 - tw)//2, y - offset_text - 15), text, fill='#FFFFFF', font=font_dim)

def draw_dim_v(x, y1, y2, text, offset_text=15, color='#38BDF8'):
    draw.line([(x, y1), (x, y2)], fill=color, width=2)
    # Top arrow
    draw.polygon([(x, y1), (x-4, y1+10), (x+4, y1+10)], fill=color)
    # Bottom arrow
    draw.polygon([(x, y2), (x-4, y2-10), (x+4, y2-10)], fill=color)
    # Extension lines
    draw.line([(x-10, y1), (x+10, y1)], fill=color, width=1)
    draw.line([(x-10, y2), (x+10, y2)], fill=color, width=1)
    # Text
    draw.text((x + offset_text, (y1 + y2)//2 - 12), text, fill='#FFFFFF', font=font_dim)

# ==================== PANEL 1: HÌNH CHIẾU ĐỨNG (FRONT ELEVATION - 7x4 MATRIX) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1380, 800
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. HÌNH CHIẾU ĐỨNG CHÍNH DIỆN: MA TRẬN TỔ ONG 7 CỘT × 4 HÀNG (TỶ LỆ 1:1)', fill='#FFFFFF', font=font_heading)

# Draw Honeycomb Grid
# Outer body of honeycomb: Width ~ 185.5mm (scaled), Ears extend to 222mm
# Scale factor for drawing: 5.0 pixels per mm
scale = 5.2
grid_x0 = p1_x + 155
grid_y0 = p1_y + 160

# Real dims:
# Pocket: 26.5mm wide, 20.5mm high
# Wall: 2.0mm inner, 2.5mm outer
pw_px = 26.5 * scale  # ~137.8 px
ph_px = 20.5 * scale  # ~106.6 px
tw_px = 2.0 * scale   # ~10.4 px
tow_px = 2.5 * scale  # ~13.0 px

# Outer body rect
mat_w_px = 7 * pw_px + 6 * tw_px + 2 * tow_px # ~1053 px
mat_h_px = 4 * ph_px + 3 * tw_px + 2 * tow_px # ~483 px

# Mounting ears on left and right (Tabs with M3 holes)
# Left ear
ear_w_px = 10.0 * scale # 52 px
draw.rounded_rectangle([(grid_x0 - ear_w_px, grid_y0 + 50), (grid_x0, grid_y0 + 130)], radius=6, fill='#1E293B', outline='#60A5FA', width=2)
draw.ellipse([(grid_x0 - ear_w_px + 14, grid_y0 + 74), (grid_x0 - ear_w_px + 34, grid_y0 + 94)], fill='#0B132B', outline='#38BDF8', width=2)
draw.text((grid_x0 - ear_w_px - 85, grid_y0 + 73), 'M3 (Ø3.2)', fill='#FBBF24', font=font_dim_small)

draw.rounded_rectangle([(grid_x0 - ear_w_px, grid_y0 + mat_h_px - 130), (grid_x0, grid_y0 + mat_h_px - 50)], radius=6, fill='#1E293B', outline='#60A5FA', width=2)
draw.ellipse([(grid_x0 - ear_w_px + 14, grid_y0 + mat_h_px - 106), (grid_x0 - ear_w_px + 34, grid_y0 + mat_h_px - 86)], fill='#0B132B', outline='#38BDF8', width=2)
draw.text((grid_x0 - ear_w_px - 85, grid_y0 + mat_h_px - 107), 'M3 (Ø3.2)', fill='#FBBF24', font=font_dim_small)

# Right ear
draw.rounded_rectangle([(grid_x0 + mat_w_px, grid_y0 + 50), (grid_x0 + mat_w_px + ear_w_px, grid_y0 + 130)], radius=6, fill='#1E293B', outline='#60A5FA', width=2)
draw.ellipse([(grid_x0 + mat_w_px + 18, grid_y0 + 74), (grid_x0 + mat_w_px + 38, grid_y0 + 94)], fill='#0B132B', outline='#38BDF8', width=2)
draw.text((grid_x0 + mat_w_px + ear_w_px + 10, grid_y0 + 73), 'M3 (Ø3.2)', fill='#FBBF24', font=font_dim_small)

draw.rounded_rectangle([(grid_x0 + mat_w_px, grid_y0 + mat_h_px - 130), (grid_x0 + mat_w_px + ear_w_px, grid_y0 + mat_h_px - 50)], radius=6, fill='#1E293B', outline='#60A5FA', width=2)
draw.ellipse([(grid_x0 + mat_w_px + 18, grid_y0 + mat_h_px - 106), (grid_x0 + mat_w_px + 38, grid_y0 + mat_h_px - 86)], fill='#0B132B', outline='#38BDF8', width=2)
draw.text((grid_x0 + mat_w_px + ear_w_px + 10, grid_y0 + mat_h_px - 107), 'M3 (Ø3.2)', fill='#FBBF24', font=font_dim_small)

# Main Solid Perimeter Frame
draw.rectangle([(grid_x0, grid_y0), (grid_x0 + mat_w_px, grid_y0 + mat_h_px)], fill='#1E293B', outline='#93C5FD', width=3)

# Draw 28 Pockets (7 cols x 4 rows)
for r in range(4):
    for c in range(7):
        cx = grid_x0 + tow_px + c * (pw_px + tw_px)
        cy = grid_y0 + tow_px + r * (ph_px + tw_px)
        
        # Pocket Cavity (Hốc lọt lòng)
        draw.rectangle([(cx, cy), (cx + pw_px, cy + ph_px)], fill='#0F172A', outline='#60A5FA', width=2)
        
        # Internal LED Rear Optical Aperture (14x14mm centered)
        ap_w = 14.0 * scale
        ap_h = 14.0 * scale
        ap_x = cx + (pw_px - ap_w)/2
        ap_y = cy + (ph_px - ap_h)/2
        draw.rectangle([(ap_x, ap_y), (ap_x + ap_w, ap_y + ap_h)], fill='#1E1B4B', outline='#818CF8', width=1)
        
        # LED center cross / indicator
        draw.line([(cx + pw_px/2 - 6, cy + ph_px/2), (cx + pw_px/2 + 6, cy + ph_px/2)], fill='#A5B4FC', width=1)
        draw.line([(cx + pw_px/2, cy + ph_px/2 - 6), (cx + pw_px/2, cy + ph_px/2 + 6)], fill='#A5B4FC', width=1)
        
        # Internal Slide Guide Rails (Two horizontal side grooves / ribs)
        draw.line([(cx + 3, cy + 12), (cx + pw_px - 3, cy + 12)], fill='#334155', width=2)
        draw.line([(cx + 3, cy + ph_px - 12), (cx + pw_px - 3, cy + ph_px - 12)], fill='#334155', width=2)
        
        # Pull-out Stopper Tooth (Gờ chặn trên mép trước)
        draw.rectangle([(cx + pw_px/2 - 15, cy), (cx + pw_px/2 + 15, cy + 5)], fill='#F59E0B')

# Highlight One Pocket with Dimensions (Col 2, Row 1)
hc_x = grid_x0 + tow_px + 2 * (pw_px + tw_px)
hc_y = grid_y0 + tow_px + 1 * (ph_px + tw_px)
draw.rectangle([(hc_x, hc_y), (hc_x + pw_px, hc_y + ph_px)], fill='#1E293B', outline='#FBBF24', width=3)
# Draw dimension inside highlighted pocket
draw.text((hc_x + 18, hc_y + 18), 'W = 26.5 mm', fill='#FDE047', font=font_dim_small)
draw.text((hc_x + 18, hc_y + 44), 'H = 20.5 mm', fill='#FDE047', font=font_dim_small)
draw.text((hc_x + 18, hc_y + 70), 'LED 14×14mm', fill='#A5B4FC', font=font_dim_small)

# Dimensions for Panel 1
# Width over ears: 222.0 mm
draw_dim_h(grid_x0 - ear_w_px, grid_x0 + mat_w_px + ear_w_px, grid_y0 - 55, 'TỔNG CHIỀU RỘNG W = 222.0 mm (BAO GỒM TAI BẮT ỐC)')
# Width of core matrix: 202.5 mm
draw_dim_h(grid_x0, grid_x0 + mat_w_px, grid_y0 - 15, 'RỘNG THÂN KHUNG TỔ ONG = 202.5 mm', offset_text=10, color='#60A5FA')
# Height over body: 93.0 mm (total 102.0mm with top/bottom flange)
draw_dim_v(grid_x0 + mat_w_px + ear_w_px + 70, grid_y0, grid_y0 + mat_h_px, 'CHIỀU CAO H = 102.0 mm')

# Wall thickness callout
wt_x = grid_x0 + tow_px + pw_px
draw.line([(wt_x, grid_y0 + 100), (wt_x + 70, grid_y0 + 40)], fill='#34D399', width=2)
draw.line([(wt_x + 70, grid_y0 + 40), (wt_x + 220, grid_y0 + 40)], fill='#34D399', width=2)
draw.text((wt_x + 75, grid_y0 + 15), 'VÁCH NGĂN QUANG HỌC t = 2.0 mm (CHỐNG LEM SÁNG)', fill='#6EE7B7', font=font_bold)

# ==================== PANEL 2: MẶT CẮT DỌC A-A (CROSS SECTION A-A) ====================
p2_x, p2_y, p2_w, p2_h = 1470, 165, 870, 800
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. MẶT CẮT DỌC A-A: CẤU TRÚC 1 HỘC DẪN HƯỚNG', fill='#FFFFFF', font=font_heading)

# Draw Section of single pocket: Depth = 46.0mm, Height = 20.5mm
sec_scale = 8.5
sec_x0 = p2_x + 130
sec_y0 = p2_y + 190

sd_px = 46.0 * sec_scale  # 391 px
sh_px = 20.5 * sec_scale  # 174 px
sw_wall = 2.5 * sec_scale # 21 px

# Cavity Interior
draw.rectangle([(sec_x0, sec_y0), (sec_x0 + sd_px, sec_y0 + sh_px)], fill='#0F172A', outline='#60A5FA', width=3)

# Top & Bottom walls (cross-hatched)
draw.rectangle([(sec_x0 - sw_wall, sec_y0 - sw_wall), (sec_x0 + sd_px + sw_wall, sec_y0)], fill='#1E293B', outline='#93C5FD', width=2)
draw.rectangle([(sec_x0 - sw_wall, sec_y0 + sh_px), (sec_x0 + sd_px + sw_wall, sec_y0 + sh_px + sw_wall)], fill='#1E293B', outline='#93C5FD', width=2)

# Rear backplate (Đáy lưng hộc) with LED window aperture
# Rear wall from sec_x0 + sd_px to sec_x0 + sd_px + sw_wall
draw.rectangle([(sec_x0 + sd_px, sec_y0 - sw_wall), (sec_x0 + sd_px + sw_wall, sec_y0 + 25)], fill='#1E293B', outline='#93C5FD', width=2)
draw.rectangle([(sec_x0 + sd_px, sec_y0 + sh_px - 25), (sec_x0 + sd_px + sw_wall, sec_y0 + sh_px + sw_wall)], fill='#1E293B', outline='#93C5FD', width=2)
# The LED opening in between
draw.line([(sec_x0 + sd_px, sec_y0 + 25), (sec_x0 + sd_px + sw_wall, sec_y0 + 25)], fill='#818CF8', width=2)
draw.line([(sec_x0 + sd_px, sec_y0 + sh_px - 25), (sec_x0 + sd_px + sw_wall, sec_y0 + sh_px - 25)], fill='#818CF8', width=2)

# Pull-out Stopper Tooth at front entrance
draw.rectangle([(sec_x0, sec_y0), (sec_x0 + 16, sec_y0 + 12)], fill='#F59E0B')
draw.text((sec_x0 - 90, sec_y0 - 35), 'VẤU CẢN CHỐNG RƠI', fill='#FBBF24', font=font_bold)
draw.line([(sec_x0 + 8, sec_y0 + 6), (sec_x0 - 15, sec_y0 - 20)], fill='#FBBF24', width=2)

# Internal Guide Track (Ray trượt bên trong thành hộc)
draw.rectangle([(sec_x0 + 15, sec_y0 + sh_px/2 - 8), (sec_x0 + sd_px - 10, sec_y0 + sh_px/2 + 8)], fill='#334155', outline='#64748B')
draw.text((sec_x0 + 80, sec_y0 + sh_px/2 - 35), 'RAY DẪN HƯỚNG TRƯỢT ÂM (L = 40 mm)', fill='#38BDF8', font=font_bold)

# Drawer Insertion Ghost Line (Mô phỏng khay thuốc trượt vào)
dr_px = 36.0 * sec_scale # drawer inserted
draw.rectangle([(sec_x0 - 60, sec_y0 + 4), (sec_x0 + dr_px, sec_y0 + sh_px - 4)], outline='#34D399', width=2)
draw.text((sec_x0 - 50, sec_y0 + 20), 'NGĂN KÉO PP', fill='#34D399', font=font_dim_small)
draw.text((sec_x0 - 50, sec_y0 + 45), 'TRƯỢT VÀO HỘC', fill='#34D399', font=font_dim_small)

# LED Backlight Emitter Icon
led_x = sec_x0 + sd_px + 45
draw.rectangle([(led_x, sec_y0 + sh_px/2 - 25), (led_x + 35, sec_y0 + sh_px/2 + 25)], fill='#4338CA', outline='#818CF8', width=2)
draw.ellipse([(led_x + 7, sec_y0 + sh_px/2 - 10), (led_x + 27, sec_y0 + sh_px/2 + 10)], fill='#FDE047')
draw.text((led_x - 10, sec_y0 + sh_px/2 + 40), 'LED WS2812B', fill='#FDE047', font=font_bold)
# Light beam arrows
for ly in [sec_y0 + sh_px/2 - 15, sec_y0 + sh_px/2, sec_y0 + sh_px/2 + 15]:
    draw.line([(led_x, ly), (sec_x0 + sd_px, ly)], fill='#FDE047', width=2)

# Dimensions for Panel 2
# Depth = 46.0 mm
draw_dim_h(sec_x0, sec_x0 + sd_px, sec_y0 + sh_px + 60, 'CHIỀU SÂU LÒNG HỘC D = 46.0 mm')
# Height = 20.5 mm
draw_dim_v(sec_x0 + sd_px + sw_wall + 120, sec_y0, sec_y0 + sh_px, 'H_trong = 20.5 mm')

# Technical Notes on Panel 2
note_y = p2_y + 490
draw.rectangle([(p2_x+25, note_y), (p2_x+p2_w-25, p2_y+p2_h-25)], fill='#152238', outline='#38BDF8', width=1)
draw.text((p2_x+45, note_y+15), 'ƯU ĐIỂM CƠ HỌC ĐỘT PHÁ CỦA KHUNG TỔ ONG 1 CHI TIẾT:', fill='#FBBF24', font=font_subheading)
draw.text((p2_x+45, note_y+55), '• Thay thế 28 vỏ bọc độc lập: Loại bỏ 28 lần in rời, lắp ráp cực nhanh.', fill='#E2E8F0', font=font_label)
draw.text((p2_x+45, note_y+90), '• Ngăn cách quang học 100%: Vách dày 2.0 mm chặn hoàn toàn ánh sáng LED', fill='#6EE7B7', font=font_label)
draw.text((p2_x+45, note_y+120), '  không để ánh sáng lọt sang ngăn bên cạnh (Zero Optical Crosstalk).', fill='#6EE7B7', font=font_label)
draw.text((p2_x+45, note_y+155), '• Độ cứng kết cấu vượt trội: Dạng lưới tổ ong chịu lực nén mặt trước >50kg', fill='#E2E8F0', font=font_label)
draw.text((p2_x+45, note_y+190), '• Tích hợp gờ chặn hành trình (Pull-out Stopper): Khay không bị tuột rơi.', fill='#E2E8F0', font=font_label)
draw.text((p2_x+45, note_y+225), '• Giá thành đúc khuôn ép: Chỉ ~12.000 đ (Rẻ hơn 75% so với in 3D 28 vỏ rời).', fill='#FDE047', font=font_bold)

# ==================== PANEL 3: BẢNG THÔNG SỐ KỸ THUẬT & DUNG SAI GIA CÔNG ====================
p3_x, p3_y, p3_w, p3_h = 60, 990, W - 120, 490
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. BẢNG DỮ LIỆU KÍCH THƯỚC CHI TIẾT, DUNG SAI LẮP GHÉP & CHỈ DẪN IN 3D PETG', fill='#FFFFFF', font=font_heading)

# Table headers
t_cols = [p3_x+30, p3_x+450, p3_x+900, p3_x+1400, p3_x+1850]
t_y = p3_y + 75
draw.rectangle([(p3_x+20, t_y), (p3_x+p3_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'HẠNG MỤC HÌNH HỌC', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC TIÊU CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI CHO PHÉP', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'MỤC ĐÍCH KỸ THUẬT', fill='#38BDF8', font=font_bold)

table_data = [
    ('Kích thước phủ bì tổng thể', '222.0 × 102.0 × 46.0 mm', '± 0.20 mm', 'Vừa khít khoang máy CalenDIA+ và bàn in 235×235 mm'),
    ('Khoang lọt lòng 1 hộc trượt (28 hộc)', 'Rộng 26.5 × Cao 20.5 × Sâu 46.0 mm', '+ 0.15 / - 0.00 mm', 'Tạo khe hở trượt delta = 0.5 mm với ngăn kéo 26×20mm'),
    ('Bề dày vách ngăn tổ ong (Ribs)', '2.0 mm (Vách trong) / 2.5 mm (Vách ngoài)', '± 0.10 mm', 'Triệt tiêu 100% rò rỉ ánh sáng LED sang ô kế bên'),
    ('Cửa sổ thông quang LED sau lưng', '14.0 mm × 14.0 mm (Vuông)', '± 0.20 mm', 'Ánh sáng đèn LED WS2812B chiếu thẳng vào đuôi khay'),
    ('Tai bắt ốc định vị mặt trước', '6 tai gá, Lỗ xuyên Ø 3.2 mm (Ốc M3)', '± 0.05 mm', 'Bắt chặt vào 6 trụ ren đồng của mặt trước Part 1'),
    ('Vật liệu khuyên dùng', 'In 3D mẫu: PETG Matte White/Gray | Sản xuất: Hạt nhựa ABS/HIPS', 'Co ngót < 0.4%', 'Chống cong vênh, giữ kích thước chính xác tuyệt đối'),
    ('Thông số Slicer in 3D FDM', 'Layer 0.20mm | Wall: 4 lớp | Infill: 25% Gyroid | Bàn in PEI nhám', 'No support', 'In nguyên khối 1 lần, không cần chống đỡ, bề mặt phẳng')
]

curr_y = t_y + 55
for row in table_data:
    draw.rectangle([(p3_x+20, curr_y), (p3_x+p3_w-20, curr_y+45)], fill='#152238' if table_data.index(row)%2==0 else '#101C36')
    draw.text((t_cols[0], curr_y+10), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+10), row[1], fill='#FDE047', font=font_bold)
    draw.text((t_cols[2], curr_y+10), row[2], fill='#6EE7B7', font=font_label)
    draw.text((t_cols[3], curr_y+10), row[3], fill='#CBD5E1', font=font_label)
    curr_y += 48

# Output Path
out_path = 'd:/DIA+/ban_ve_chi_tiet_khung_to_ong_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
