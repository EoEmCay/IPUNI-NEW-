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
font_pill = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

# Outer Border
draw.rectangle([(30, 30), (W-30, H-30)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(50, 45), (W-50, 145)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 56), 'BẢN VẼ HIỆU CHỈNH KÍCH THƯỚC: CHIỀU CAO CHUẨN XÁC CỦA HỘC THUỐC (PART [2])', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • KHẮC PHỤC LỖI HỘC THẤP • NÂNG CAO LÊN 30.0 mm (HÌNH CHỮ NHẬT ĐỨNG 1:1.15 ĐÚNG ẢNH MẪU)', fill='#FBBF24', font=font_subtitle)

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

# ==================== PANEL 1: SO SÁNH TRỰC QUAN BẢN CŨ (20mm) VS BẢN CHUẨN MỚI (30mm) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1150, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. SO SÁNH TỶ LỆ HÌNH HỌC: BẢN CŨ BỊ LÙN (20mm) VS BẢN MỚI CHUẨN ẢNH (30mm)', fill='#FFFFFF', font=font_heading)

# Scale: 12.0 px / mm
c_scale = 12.0

# --- FIGURE A: BẢN CŨ (H = 20.0 mm - BỊ THẤP / NẰM NGANG) ---
old_x0 = p1_x + 90
old_y0 = p1_y + 130
old_w_px = 26.0 * c_scale # 312 px
old_h_px = 20.0 * c_scale # 240 px

draw.text((old_x0, old_y0 - 30), 'A. BẢN VẼ CŨ: CAO 20.0 mm (BỊ LÙN / HÌNH CHỮ NHẬT NẰM)', fill='#EF4444', font=font_subheading)
draw.rectangle([(old_x0, old_y0), (old_x0 + old_w_px, old_y0 + old_h_px)], fill='#1E293B', outline='#EF4444', width=2)
# Finger scoop
draw.rounded_rectangle([(old_x0 + old_w_px//2 - 60, old_y0 + old_h_px//2 - 20), (old_x0 + old_w_px//2 + 60, old_y0 + old_h_px//2 + 20)], radius=15, fill='#0B132B', outline='#EF4444', width=1)
draw.text((old_x0 + 40, old_y0 + old_h_px//2 - 8), 'Tỷ lệ H/W = 0.77 (Dẹt ngang)', fill='#FCA5A5', font=font_dim_small)

draw_dim_h(old_x0, old_x0 + old_w_px, old_y0 + old_h_px + 25, 'W = 26.0 mm', offset_text=8, color='#EF4444')
draw_dim_v(old_x0 + old_w_px + 15, old_y0, old_y0 + old_h_px, 'H = 20.0 mm (THẤP)', color='#EF4444')

# --- FIGURE B: BẢN HIỆU CHỈNH CHUẨN THEO ẢNH (H = 30.0 mm - CHỮ NHẬT ĐỨNG) ---
new_x0 = p1_x + 650
new_y0 = p1_y + 130
new_w_px = 26.0 * c_scale # 312 px
new_h_px = 30.0 * c_scale # 360 px (taller by 10mm!)

draw.text((new_x0, new_y0 - 30), 'B. BẢN CHUẨN THEO ẢNH: CAO 30.0 mm (CHỮ NHẬT ĐỨNG 1:1.15)', fill='#34D399', font=font_subheading)
draw.rectangle([(new_x0, new_y0), (new_x0 + new_w_px, new_y0 + new_h_px)], fill='#1E293B', outline='#34D399', width=3)
# Finger scoop
draw.rounded_rectangle([(new_x0 + new_w_px//2 - 60, new_y0 + new_h_px//2 - 20), (new_x0 + new_w_px//2 + 60, new_y0 + new_h_px//2 + 20)], radius=15, fill='#0B132B', outline='#FBBF24', width=2)
draw.text((new_x0 + 40, new_y0 + new_h_px//2 - 8), 'Tỷ lệ H/W = 1.15 (Chữ nhật đứng)', fill='#6EE7B7', font=font_bold)

# Dimension callouts for New Figure
draw_dim_h(new_x0, new_x0 + new_w_px, new_y0 + new_h_px + 25, 'RỘNG W = 26.0 mm', offset_text=8, color='#34D399')
draw_dim_v(new_x0 + new_w_px + 20, new_y0, new_y0 + new_h_px, 'CHIỀU CAO H = 30.0 mm (TĂNG +10mm)', color='#34D399')

# Mathematical Proof of Console Height (Chứng minh toán học kích thước máy 180mm)
math_y0 = p1_y + 580
draw.rectangle([(p1_x + 30, math_y0), (p1_x + p1_w - 30, math_y0 + 225)], fill='#152238', outline='#38BDF8', width=1)
draw.text((p1_x + 50, math_y0 + 15), 'CHỨNG MINH TOÁN HỌC: VÌ SAO CHIỀU CAO PHẢI LÀ 30.0 mm (KHỚP KHUNG 180mm):', fill='#FBBF24', font=font_subheading)

draw.text((p1_x + 50, math_y0 + 55), '• Tổng chiều cao máy CalenDIA+: H_tổng = 180.0 mm', fill='#FFFFFF', font=font_label)
draw.text((p1_x + 50, math_y0 + 85), '• Trừ đi: Cụm màn hình OLED đỉnh máy (~30.0 mm) + Hàng chữ thứ Mon-Sun (~8.0 mm) = 38.0 mm', fill='#CBD5E1', font=font_label)
draw.text((p1_x + 50, math_y0 + 115), '• Trừ đi: Phần chân đế vát logo D+ ở đáy (~14.5 mm) + 3 gân ngăn cách giữa 4 hàng (3 × 2.5mm = 7.5 mm)', fill='#CBD5E1', font=font_label)
draw.text((p1_x + 50, math_y0 + 145), '► Chiều cao còn lại cho 4 hàng hộc thuốc: 180 - 38 - 14.5 - 7.5 = 120.0 mm!', fill='#6EE7B7', font=font_bold)
draw.text((p1_x + 50, math_y0 + 178), '► CHIỀU CAO MỖI HỘC THUỐC: 120.0 mm / 4 hàng = ĐÚNG CHÍNH XÁC 30.0 mm / HỘC!', fill='#FDE047', font=font_heading)

# ==================== PANEL 2: MẶT CẮT DỌC SÂU LÒNG 26.5mm ====================
p2_x, p2_y, p2_w, p2_h = 1240, 165, 1100, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. MẶT CẮT DỌC CHI TIẾT: SÂU LÒNG 26.5 mm (CHỨA 12-15 VIÊN THUỐC)', fill='#FFFFFF', font=font_heading)

# Scale: 14 px / mm
s_scale = 14.0
cx0 = p2_x + 100
cy0 = p2_y + 160

# Real dimensions:
# Length L = 48.0 mm (672 px)
# Height H = 30.0 mm (420 px) - tall!
# Wall thickness: Bottom = 2.0 mm, Front = 2.5 mm, Back = 2.0 mm
# Inner Cavity: Length = 43.5 mm, Inner Depth from rim = 26.5 mm (371 px)

sec_l = 48.0 * s_scale # 672 px
sec_h = 30.0 * s_scale # 420 px
sec_hin = 26.5 * s_scale # 371 px

# Drawer Outer Section (Vuông vức, thành cao)
draw.rectangle([(cx0, cy0), (cx0 + sec_l, cy0 + sec_h)], fill='#1E293B', outline='#93C5FD', width=3)

# Inner Cavity (Lòng chứa thuốc - rất sâu và rộng)
draw.rectangle([(cx0 + 35, cy0), (cx0 + sec_l - 28, cy0 + sec_hin)], fill='#0F172A', outline='#34D399', width=2)

# Side Guide Rail Rib on outside wall
rail_y = cy0 + sec_h // 2
draw.rectangle([(cx0 + 15, rail_y - 8), (cx0 + sec_l - 15, rail_y + 8)], fill='#3B82F6', outline='#60A5FA', width=1)
draw.text((cx0 + sec_l // 2 - 130, rail_y - 30), 'GÂN TRƯỢT DẪN HƯỚNG BÊN HÔNG', fill='#60A5FA', font=font_dim_small)

# Rear Pull-out Stopper Tooth
draw.rectangle([(cx0 + sec_l - 28, cy0 - 16), (cx0 + sec_l, cy0)], fill='#F59E0B')
draw.text((cx0 + sec_l - 180, cy0 - 35), 'VẤU CẢN CHỐNG RƠI KHAY', fill='#FBBF24', font=font_bold)

# Front Finger Scoop Recess
draw.rectangle([(cx0, cy0 + sec_h//2 - 45), (cx0 + 25, cy0 + sec_h//2 + 45)], fill='#0B132B', outline='#FBBF24', width=2)

# Many Pills inside deep cavity (2 tầng viên thuốc)
# Layer 1: Bottom pills
for i in range(4):
    px = cx0 + 55 + i * 140
    py = cy0 + sec_hin - 50
    draw.rounded_rectangle([(px, py), (px + 120, py + 45)], radius=22, fill='#3B82F6', outline='#93C5FD')
    draw.rounded_rectangle([(px + 60, py), (px + 120, py + 45)], radius=22, fill='#EF4444', outline='#FCA5A5')

# Layer 2: Top pills
for i in range(3):
    px = cx0 + 125 + i * 140
    py = cy0 + sec_hin - 105
    draw.rounded_rectangle([(px, py), (px + 120, py + 45)], radius=22, fill='#FBBF24', outline='#FDE047')
    draw.rounded_rectangle([(px + 60, py), (px + 120, py + 45)], radius=22, fill='#10B981', outline='#6EE7B7')

draw.text((cx0 + 80, cy0 + 60), 'KHOANG CHỨA THUỐC SIÊU SÂU: 26.5 mm (CHỨA ĐƯỢC 2 TẦNG THUỐC)', fill='#FDE047', font=font_bold)

# Dimensions for Panel 2
# Length L = 48.0 mm
draw_dim_h(cx0, cx0 + sec_l, cy0 + sec_h + 35, 'CHIỀU DÀI / SÂU TRƯỢT PHỦ BÌ: L = 48.0 mm', offset_text=8)
# Height H = 30.0 mm
draw_dim_v(cx0 + sec_l + 30, cy0, cy0 + sec_h, 'CAO PHỦ BÌ H = 30.0 mm', color='#34D399')
# Inner Height Hin = 26.5 mm
draw_dim_v(cx0 + sec_l + 190, cy0, cy0 + sec_hin, 'SÂU LÒNG H_in = 26.5 mm', color='#FDE047')

# Technical Notes on Panel 2
note_y0 = p2_y + 630
draw.rectangle([(p2_x + 30, note_y0), (p2_x + p2_w - 30, p2_y + p2_h - 25)], fill='#152238', outline='#34D399', width=1)
draw.text((p2_x + 45, note_y0 + 15), 'ƯU ĐIỂM VƯỢT TRỘI KHI HIỆU CHỈNH CHIỀU CAO LÊN 30.0 mm:', fill='#34D399', font=font_subheading)
draw.text((p2_x + 45, note_y0 + 50), '• Đúng 100% tỷ lệ hình ảnh mẫu: Khay là hình chữ nhật đứng (H/W = 30/26 = 1.15).', fill='#FFFFFF', font=font_label)
draw.text((p2_x + 45, note_y0 + 80), '• Chiều sâu lòng khay tăng từ 16.5 mm lên 26.5 mm: Tăng thêm 60% thể tích chứa thuốc.', fill='#6EE7B7', font=font_label)
draw.text((p2_x + 45, note_y0 + 110), '• Bệnh nhân tiểu đường có thể bỏ thoải mái 10-15 viên thuốc lớn hoặc cả viên sủi C.', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 45, note_y0 + 140), '• Ngón tay người cao tuổi dễ dàng thò sâu vào nhón viên thuốc mà không bị chật.', fill='#FDE047', font=font_bold)

# ==================== PANEL 3: BẢNG THÔNG SỐ ĐÃ HIỆU CHỈNH CHUẨN ====================
p3_x, p3_y, p3_w, p3_h = 60, 1020, W - 120, 460
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. BẢNG THÔNG SỐ KÍCH THƯỚC ĐÃ HIỆU CHỈNH CHUẨN XÁC THEO ẢNH (BÀN GIAO XƯỞNG IN / ĐÚC KHUÔN)', fill='#FFFFFF', font=font_heading)

t_cols = [p3_x+30, p3_x+420, p3_x+780, p3_x+1080, p3_x+1520]
t_y = p3_y + 75
draw.rectangle([(p3_x+20, t_y), (p3_x+p3_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'HẠNG MỤC HÌNH HỌC', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'BẢN VẼ CŨ (BỊ LÙN)', fill='#EF4444', font=font_bold)
draw.text((t_cols[2], t_y+10), 'BẢN HIỆU CHỈNH MỚI', fill='#34D399', font=font_bold)
draw.text((t_cols[3], t_y+10), 'TỶ LỆ SO VỚI ẢNH MẪU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[4], t_y+10), 'Ý NGHĨA KỸ THUẬT & CÔNG THÁI HỌC', fill='#38BDF8', font=font_bold)

table_data = [
    ('1. Chiều Cao phủ bì khay (H)', 'H = 20.0 mm', 'H = 30.0 mm (+10 mm)', 'Đúng chuẩn tỷ lệ đứng 1:1.15', 'Khớp chính xác với 4 hàng trên khung 180mm'),
    ('2. Chiều Sâu lòng từ miệng xuống đáy', 'H_lòng = 16.5 mm', 'H_lòng = 26.5 mm (+10 mm)', 'Sâu gấp 1.6 lần', 'Chứa thoải mái 10 - 15 viên thuốc lớn, 2 tầng'),
    ('3. Chiều Rộng phủ bì khay (W)', 'W = 26.0 mm', 'W = 26.0 mm (Giữ nguyên)', 'Đúng 7 cột trên mặt 230mm', 'Khớp hoàn hảo với ma trận 7 cột thứ Hai - CN'),
    ('4. Chiều Dài / Sâu trượt phủ bì (L)', 'L = 48.0 mm', 'L = 48.0 mm (Giữ nguyên)', 'Trượt trong hộc sâu 50mm', 'Nằm gọn gàng trong thân máy CalenDIA+'),
    ('5. Thể tích lòng chứa thuốc', '15.5 cm³ (15.5 ml)', '25.0 cm³ (25.0 ml)', 'Tăng +61% dung tích', 'Chứa vừa cả viên sủi C hoặc vỉ thuốc cắt nhỏ'),
    ('6. Kích thước hộc tổ ong đón khay', '26.5 × 20.5 × 46.0 mm', '26.5 × 30.5 × 46.0 mm', 'Hiệu chỉnh đồng bộ', 'Khe hở trượt delta = 0.5 mm siêu êm ái'),
    ('7. Cửa sổ lọt lòng mặt trước Part 1', '26.8 × 20.8 mm', '26.8 × 30.8 mm', 'Hiệu chỉnh đồng bộ', 'Cửa sổ hình chữ nhật đứng sắc nét theo ảnh')
]

curr_y = t_y + 55
for row in table_data:
    draw.rectangle([(p3_x+20, curr_y), (p3_x+p3_w-20, curr_y+43)], fill='#152238' if table_data.index(row)%2==0 else '#101C36')
    draw.text((t_cols[0], curr_y+10), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+10), row[1], fill='#F87171', font=font_bold)
    draw.text((t_cols[2], curr_y+10), row[2], fill='#6EE7B7', font=font_bold)
    draw.text((t_cols[3], curr_y+10), row[3], fill='#FDE047', font=font_label)
    draw.text((t_cols[4], curr_y+10), row[4], fill='#CBD5E1', font=font_dim_small)
    curr_y += 46

# Output Path
out_path = 'd:/DIA+/ban_ve_hieu_chinh_chieu_cao_hoc_thuoc_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
