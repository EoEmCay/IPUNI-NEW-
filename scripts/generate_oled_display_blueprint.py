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
font_mono = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 18)
font_oled = ImageFont.truetype('C:/Windows/Fonts/consolab.ttf', 24)

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

# Outer Border
draw.rectangle([(30, 30), (W-30, H-30)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(50, 45), (W-50, 145)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 56), 'BẢN VẼ CHI TIẾT CAD: CỤM MÀN HÌNH HIỂN THỊ OLED ĐỈNH MÁY (PART [5])', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • THÔNG SỐ: CHIỀU NGANG × CHIỀU DỌC × ĐỘ CAO (DÀY) • CẤU TRÚC 3 LỚP QUANG HỌC', fill='#FBBF24', font=font_subtitle)

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

# ==================== PANEL 1: BÓC TÁCH KÍCH THƯỚC 3 LỚP (NGANG - DỌC - CAO) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1420, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. HÌNH CHIẾU BÓC TÁCH 3 LỚP & KÍCH THƯỚC NGANG × DỌC × CAO (DÀY)', fill='#FFFFFF', font=font_heading)

# Scale: 5.8 px / mm
scale = 5.8
cx_center = p1_x + p1_w // 2

# --- LAYER 1: TẤM KÍNH MICA ĐEN KHÓI MẶT NGOÀI ---
# Ngang: 192.0 mm, Dọc: 24.0 mm, Cao/Dày: 2.0 mm
l1_w_px = 192.0 * scale # 1113.6 px
l1_h_px = 24.0 * scale  # 139.2 px
l1_x0 = cx_center - l1_w_px // 2
l1_y0 = p1_y + 90

draw.text((l1_x0, l1_y0 - 28), 'LỚP 1: TẤM MẶT NẠ KÍNH MICA ĐEN KHÓI (SMOKED ACRYLIC WINDOW)', fill='#38BDF8', font=font_subheading)
draw.rounded_rectangle([(l1_x0, l1_y0), (l1_x0 + l1_w_px, l1_y0 + l1_h_px)], radius=22, fill='#05070B', outline='#60A5FA', width=3)

# Glowing Display Effect Simulation through the dark acrylic
disp_w = 110.0 * scale
disp_x0 = cx_center - disp_w // 2
disp_y0 = l1_y0 + 20
draw.rounded_rectangle([(disp_x0, disp_y0), (disp_x0 + disp_w, disp_y0 + l1_h_px - 40)], radius=6, fill='#02131D', outline='#065A82')
draw.text((disp_x0 + 40, disp_y0 + 15), 'DIA+ 142 mg/dL  •  BA ƠI ĐẾN GIỜ UỐNG THUỐC  •  08:00', fill='#38BDF8', font=font_oled)
draw.text((disp_x0 + 80, disp_y0 + 55), 'Màn hình OLED 128x64 phát sáng rực rỡ xuyên qua lớp kính đen khói', fill='#94A3B8', font=font_dim_small)

# Dimensions for Layer 1
draw_dim_h(l1_x0, l1_x0 + l1_w_px, l1_y0 + l1_h_px + 30, 'CHIỀU NGANG = 192.0 mm (Bo góc R = 5.0 mm)', offset_text=8)
draw_dim_v(l1_x0 + l1_w_px + 20, l1_y0, l1_y0 + l1_h_px, 'DỌC = 24.0 mm')

# Thickness callout for Layer 1
draw.line([(l1_x0 + 20, l1_y0 + l1_h_px), (l1_x0 - 40, l1_y0 + l1_h_px + 40)], fill='#FBBF24', width=2)
draw.line([(l1_x0 - 40, l1_y0 + l1_h_px + 40), (l1_x0 - 150, l1_y0 + l1_h_px + 40)], fill='#FBBF24', width=2)
draw.text((l1_x0 - 160, l1_y0 + l1_h_px + 15), 'ĐỘ DÀY / CAO: t = 2.0 mm', fill='#FDE047', font=font_bold)
draw.text((l1_x0 - 160, l1_y0 + l1_h_px + 45), '(Mica đen khói xuyên quang 40%)', fill='#CBD5E1', font=font_dim_small)

# --- LAYER 2: HỘC KHOÉT ÂM BẬC CHÌM TRÊN MẶT TRƯỚC PART 1 ---
l2_y0 = p1_y + 360
draw.text((l1_x0, l2_y0 - 28), 'LỚP 2: HỘC KHOÉT BẬC CHÌM TRÊN KHUNG VỎ MẶT TRƯỚC (PART [1] RECESSED BEZEL)', fill='#34D399', font=font_subheading)

# Outer Bezel Body Surrounding
draw.rectangle([(l1_x0 - 40, l2_y0 - 10), (l1_x0 + l1_w_px + 40, l2_y0 + l1_h_px + 40)], fill='#1F2937', outline='#4B5563', width=1)

# Recessed Pocket: 192.4 mm x 24.4 mm (depth 2.0 mm)
l2_w_px = 192.4 * scale
l2_h_px = 24.4 * scale
l2_x0 = cx_center - l2_w_px // 2
draw.rounded_rectangle([(l2_x0, l2_y0), (l2_x0 + l2_w_px, l2_y0 + l2_h_px)], radius=23, fill='#111827', outline='#34D399', width=2)

# Inner Cutout Opening (Lỗ xuyên sáng vào trong: 186.0 x 18.0 mm)
in_w_px = 186.0 * scale
in_h_px = 18.0 * scale
in_x0 = cx_center - in_w_px // 2
in_y0 = l2_y0 + (l2_h_px - in_h_px) // 2
draw.rounded_rectangle([(in_x0, in_y0), (in_x0 + in_w_px, in_y0 + in_h_px)], radius=15, fill='#030712', outline='#10B981', width=2)

# Ledge Callout (Gờ đỡ dán keo rộng 3.0mm)
draw.text((in_x0 + 80, in_y0 + in_h_px//2 - 12), 'GỜ BÍCH BẬC CHÌM RỘNG 3.0 mm (DÁN KEO 3M 300LSE KÍN BỤI)', fill='#A7F3D0', font=font_bold)

# Dimensions for Layer 2
draw_dim_h(l2_x0, l2_x0 + l2_w_px, l2_y0 + l2_h_px + 25, 'HỘC KHOÉT: NGANG = 192.4 mm (KHE HỞ LẮP GHÉP delta = 0.4 mm)', offset_text=8, color='#34D399')
draw_dim_v(l2_x0 + l2_w_px + 20, l2_y0, l2_y0 + l2_h_px, 'DỌC = 24.4 mm', color='#34D399')

# Depth callout
draw.line([(l2_x0 + 10, l2_y0 + 10), (l2_x0 - 50, l2_y0 - 20)], fill='#FBBF24', width=2)
draw.line([(l2_x0 - 50, l2_y0 - 20), (l2_x0 - 150, l2_y0 - 20)], fill='#FBBF24', width=2)
draw.text((l2_x0 - 160, l2_y0 - 45), 'ĐỘ SÂU BẬC HẠ: 2.0 mm', fill='#FDE047', font=font_bold)
draw.text((l2_x0 - 160, l2_y0 - 20), '(Để kính mica phẳng lì ngang mặt vỏ)', fill='#CBD5E1', font=font_dim_small)

# --- LAYER 3: CỤM MODULE OLED & KHUNG GÁ PART 5 ---
l3_y0 = p1_y + 610
draw.text((l1_x0, l3_y0 - 28), 'LỚP 3: KHUNG GÁ PART [5] & MODULE MÀN HÌNH OLED 0.96\" / 1.3\" BÊN TRONG', fill='#FBBF24', font=font_subheading)

# Carrier Bracket: 190.0 x 28.0 mm
b_w_px = 190.0 * scale
b_h_px = 28.0 * scale
b_x0 = cx_center - b_w_px // 2
draw.rounded_rectangle([(b_x0, l3_y0), (b_x0 + b_w_px, l3_y0 + b_h_px)], radius=10, fill='#1F2937', outline='#FBBF24', width=2)

# Central OLED Module PCB (OLED 0.96 inch: 27.0 x 27.5 mm)
oled_w_px = 27.0 * scale
oled_h_px = 27.5 * scale
oled_x0 = cx_center - oled_w_px // 2
oled_y0 = l3_y0 + (b_h_px - oled_h_px) // 2
draw.rectangle([(oled_x0, oled_y0), (oled_x0 + oled_w_px, oled_y0 + oled_h_px)], fill='#047857', outline='#34D399', width=2)

# Active Display Glass: 21.7 x 10.9 mm
act_w_px = 21.7 * scale
act_h_px = 10.9 * scale
act_x0 = cx_center - act_w_px // 2
act_y0 = l3_y0 + (b_h_px - act_h_px) // 2
draw.rectangle([(act_x0, act_y0), (act_x0 + act_w_px, act_y0 + act_h_px)], fill='#022C22', outline='#6EE7B7', width=1)
draw.text((act_x0 + 15, act_y0 + 18), 'OLED 0.96\" (128×64)', fill='#A7F3D0', font=font_bold)

# Status LEDs on Left & Right wings
draw.ellipse([(b_x0 + 40, l3_y0 + b_h_px//2 - 12), (b_x0 + 64, l3_y0 + b_h_px//2 + 12)], fill='#1D4ED8', outline='#38BDF8', width=2)
draw.text((b_x0 + 75, l3_y0 + b_h_px//2 - 10), 'LED Wi-Fi', fill='#93C5FD', font=font_dim_small)

draw.ellipse([(b_x0 + b_w_px - 64, l3_y0 + b_h_px//2 - 12), (b_x0 + b_w_px - 40, l3_y0 + b_h_px//2 + 12)], fill='#D97706', outline='#FBBF24', width=2)
draw.text((b_x0 + b_w_px - 165, l3_y0 + b_h_px//2 - 10), 'LED Báo Giờ', fill='#FDE047', font=font_dim_small)

# 4 Screw Mounting Ears M2 on Bracket
for ear_x in [b_x0 + 15, b_x0 + b_w_px - 15]:
    for ear_y in [l3_y0 + 10, l3_y0 + b_h_px - 10]:
        draw.ellipse([(ear_x - 6, ear_y - 6), (ear_x + 6, ear_y + 6)], fill='#0B132B', outline='#FBBF24', width=2)

draw_dim_h(b_x0, b_x0 + b_w_px, l3_y0 + b_h_px + 25, 'KHUNG GÁ PART 5: NGANG = 190.0 mm × DỌC = 28.0 mm', offset_text=8, color='#FBBF24')

# Total Height / Depth Callout
draw.text((l1_x0, l3_y0 + b_h_px + 65), '► TỔNG CHIỀU CAO (CHIỀU SÂU CHIẾM CHỖ TRONG MÁY): H_tổng = 7.5 mm (TÍNH TỪ MẶT KÍNH ĐẾN ĐUÔI MẠCH)', fill='#FDE047', font=font_bold)

# ==================== PANEL 2: CHI TIẾT MODULE OLED & MẶT CẮT C-C ====================
p2_x, p2_y, p2_w, p2_h = 1510, 165, 830, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. MẶT CẮT C-C & THÔNG SỐ MODULE OLED 0.96\" / 1.3\"', fill='#FFFFFF', font=font_heading)

# Cross Section View C-C (Thực tế lắp ghép lớp)
cs_x0 = p2_x + 50
cs_y0 = p2_y + 90
draw.text((cs_x0, cs_y0), 'MẶT CẮT DỌC C-C (TỶ LỆ PHÓNG ĐẠI 10:1):', fill='#38BDF8', font=font_subheading)

# Layers drawn vertically
# Front Bezel Plastic (t = 2.5 mm, with 2.0mm step recess)
draw.rectangle([(cs_x0 + 40, cs_y0 + 35), (cs_x0 + 720, cs_y0 + 75)], fill='#374151', outline='#6B7280')
draw.text((cs_x0 + 50, cs_y0 + 45), 'VỎ MẶT TRƯỚC PART 1 (Nhựa PETG Trắng sứ)', fill='#E5E7EB', font=font_label)

# Acrylic Glass (t = 2.0 mm, flush)
draw.rectangle([(cs_x0 + 120, cs_y0 + 75), (cs_x0 + 640, cs_y0 + 115)], fill='#020617', outline='#38BDF8', width=2)
draw.text((cs_x0 + 150, cs_y0 + 85), 'KÍNH MICA ĐEN KHÓI (DÀY 2.0 mm, PHẲNG LÌ MẶT VỎ)', fill='#38BDF8', font=font_bold)

# Adhesive Tape (3M 300LSE t = 0.15 mm)
draw.line([(cs_x0 + 120, cs_y0 + 117), (cs_x0 + 200, cs_y0 + 117)], fill='#EF4444', width=3)
draw.line([(cs_x0 + 560, cs_y0 + 117), (cs_x0 + 640, cs_y0 + 117)], fill='#EF4444', width=3)
draw.text((cs_x0 + 50, cs_y0 + 130), 'Băng dính 3M viền (0.15mm)', fill='#EF4444', font=font_dim_small)

# Air Gap (0.5 mm) & OLED Glass
draw.rectangle([(cs_x0 + 220, cs_y0 + 130), (cs_x0 + 540, cs_y0 + 155)], fill='#047857', outline='#10B981', width=2)
draw.text((cs_x0 + 240, cs_y0 + 135), 'KÍNH HIỂN THỊ OLED (DÀY 1.3 mm)', fill='#A7F3D0', font=font_bold)

# OLED PCB & Components (t = 1.6 mm PCB + 1.2 mm chips)
draw.rectangle([(cs_x0 + 180, cs_y0 + 155), (cs_x0 + 580, cs_y0 + 195)], fill='#064E3B', outline='#059669', width=2)
draw.text((cs_x0 + 200, cs_y0 + 165), 'BO MẠCH PCB OLED (DÀY 1.6 mm + LINH KIỆN)', fill='#6EE7B7', font=font_bold)

# Bracket Part 5 (t = 2.0 mm)
draw.rectangle([(cs_x0 + 120, cs_y0 + 195), (cs_x0 + 640, cs_y0 + 235)], fill='#1F2937', outline='#FBBF24', width=2)
draw.text((cs_x0 + 180, cs_y0 + 205), 'KHUNG GÁ PART 5 + TRỤ ÉP REN ỐC M2', fill='#FDE047', font=font_bold)

# Detailed Table of OLED Module Specs (0.96" vs 1.3")
sch_y = p2_y + 360
draw.rectangle([(p2_x + 30, sch_y), (p2_x + p2_w - 30, sch_y + 430)], fill='#152238', outline='#38BDF8', width=1)
draw.text((p2_x + 50, sch_y + 15), 'BẢNG SO SÁNH 2 LOẠI MÀN HÌNH OLED PHÙ HỢP:', fill='#FBBF24', font=font_subheading)

draw.text((p2_x + 50, sch_y + 55), 'A. MÀN HÌNH OLED 0.96 INCH (I2C SSD1306) - KHUYÊN DÙNG:', fill='#34D399', font=font_bold)
draw.text((p2_x + 70, sch_y + 85), '• Kích thước PCB: Ngang 27.0 mm × Dọc 27.5 mm × Cao 4.1 mm', fill='#FFFFFF', font=font_label)
draw.text((p2_x + 70, sch_y + 115), '• Vùng hiển thị (Active): Ngang 21.74 mm × Dọc 10.86 mm (128×64 px)', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 70, sch_y + 145), '• Chân kết nối: 4 chân I2C (GND, VCC, SCL-GPIO5, SDA-GPIO4)', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 70, sch_y + 175), '• Ưu điểm: Cực rẻ (~35k), siêu tiết kiệm điện (15mA), cực bền.', fill='#6EE7B7', font=font_label)

draw.text((p2_x + 50, sch_y + 225), 'B. MÀN HÌNH OLED 1.3 INCH (I2C SH1106) - BẢN NÂNG CẤP:', fill='#38BDF8', font=font_bold)
draw.text((p2_x + 70, sch_y + 255), '• Kích thước PCB: Ngang 35.4 mm × Dọc 33.5 mm × Cao 4.3 mm', fill='#FFFFFF', font=font_label)
draw.text((p2_x + 70, sch_y + 285), '• Vùng hiển thị: Ngang 29.42 mm × Dọc 14.70 mm (Chữ to hơn 35%)', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 70, sch_y + 315), '• Rất thích hợp cho người cao tuổi mắt kém dễ đọc chữ.', fill='#FDE047', font=font_bold)
draw.text((p2_x + 70, sch_y + 345), '• Giá thành: ~55k - 65k (chênh lệch ~25k so với bản 0.96 inch).', fill='#CBD5E1', font=font_label)

# ==================== PANEL 3: BẢNG TỔNG HỢP KÍCH THƯỚC NGANG - DỌC - CAO ====================
p3_x, p3_y, p3_w, p3_h = 60, 1020, W - 120, 460
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. BẢNG TỔNG HỢP KÍCH THƯỚC 3 CHIỀU: NGANG × DỌC × CAO (DÀY) VÀ CHỈ DẪN LẮP RÁP', fill='#FFFFFF', font=font_heading)

t_cols = [p3_x+30, p3_x+420, p3_x+680, p3_x+940, p3_x+1320, p3_x+1800]
t_y = p3_y + 75
draw.rectangle([(p3_x+20, t_y), (p3_x+p3_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'CHI TIẾT THÀNH PHẦN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'CHIỀU NGANG', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'CHIỀU DỌC', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'CHIỀU CAO (DÀY)', fill='#38BDF8', font=font_bold)
draw.text((t_cols[4], t_y+10), 'VẬT LIỆU / DUNG SAI', fill='#38BDF8', font=font_bold)
draw.text((t_cols[5], t_y+10), 'CHỨC NĂNG LẮP GHÉP', fill='#38BDF8', font=font_bold)

table_data = [
    ('1. Tấm kính Mica mặt ngoài', '192.0 mm', '24.0 mm', '2.0 mm', 'PMMA Đen khói | ±0.15mm', 'Mặt kính bảo vệ phẳng lì ngang mặt vỏ máy'),
    ('2. Hộc khoét bậc chìm Part 1', '192.4 mm', '24.4 mm', '2.0 mm (Sâu)', 'Nhựa PETG | +0.2/-0.0mm', 'Đón tấm kính mica, khe hở viền delta = 0.4 mm'),
    ('3. Lỗ xuyên sáng khoang trong', '186.0 mm', '18.0 mm', 'Xuyên thủng', 'Nhựa PETG | ±0.20mm', 'Tạo gờ bích rộng 3.0mm dán keo 3M 300LSE'),
    ('4. Khung gá bắt ốc Part 5', '190.0 mm', '28.0 mm', '5.0 mm', 'In 3D PETG đen | ±0.15mm', 'Giữ chặt bo mạch OLED, bắt 4 ốc vít M2'),
    ('5. Module OLED 0.96\" I2C', '27.0 mm (PCB)', '27.5 mm', '4.1 mm (Cả IC)', 'FR4 + Kính | Chuẩn hãng', 'Màn hình hiển thị số đường huyết & lời nhắc'),
    ('6. Module OLED 1.3\" I2C', '35.4 mm (PCB)', '33.5 mm', '4.3 mm', 'FR4 + Kính | Bản nâng cấp', 'Màn hình cỡ lớn cho người cao tuổi dễ đọc'),
    ('7. TỔNG CỤM LẮP RÁP HOÀN THIỆN', '192.0 mm', '28.0 mm', '7.5 mm (Tổng sâu)', 'Toàn bộ cụm chi tiết', 'Nằm gọn trong khoang đỉnh 18mm của CalenDIA+')
]

curr_y = t_y + 55
for row in table_data:
    draw.rectangle([(p3_x+20, curr_y), (p3_x+p3_w-20, curr_y+43)], fill='#152238' if table_data.index(row)%2==0 else '#101C36')
    draw.text((t_cols[0], curr_y+10), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+10), row[1], fill='#FDE047', font=font_bold)
    draw.text((t_cols[2], curr_y+10), row[2], fill='#FDE047', font=font_bold)
    draw.text((t_cols[3], curr_y+10), row[3], fill='#6EE7B7', font=font_bold)
    draw.text((t_cols[4], curr_y+10), row[4], fill='#CBD5E1', font=font_dim_small)
    draw.text((t_cols[5], curr_y+10), row[5], fill='#93C5FD', font=font_dim_small)
    curr_y += 46

# Output Path
out_path = 'd:/DIA+/ban_ve_man_hinh_oled_dinh_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
