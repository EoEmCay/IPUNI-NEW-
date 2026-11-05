import os
import math
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
draw.text((80, 56), 'BẢN VẼ CHI TIẾT CAD: VỎ LƯNG KHOANG ĐIỆN TỬ & CHÂN ĐẾ NGHIÊNG 75° CHỐNG LẬT', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • PART [6] REAR HOUSING & PART [7] 75° DESKTOP STAND • FOOTPRINT D = 120.0 mm', fill='#FBBF24', font=font_subtitle)

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

# ==================== PANEL 1: HÌNH CHIẾU CẠNH & GÓC NGHIÊNG 75° (SIDE PROFILE) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 820, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. HÌNH CHIẾU CẠNH: GÓC NGHIÊNG 75° & CHÂN ĐẾ CHỐNG LẬT', fill='#FFFFFF', font=font_heading)

# Desktop Reference Line
desk_y = p1_y + 700
draw.line([(p1_x + 30, desk_y), (p1_x + p1_w - 30, desk_y)], fill='#475569', width=3)
draw.text((p1_x + 50, desk_y + 15), 'MẶT BÀN LÀM VIỆC (DESKTOP LEVEL)', fill='#94A3B8', font=font_label)

# Side view geometry:
# Tilt angle = 75 deg from horizontal = 15 deg from vertical
# Height = 180.0 mm. At 75 deg, vertical span = 180 * sin(75) = 173.8 mm, horizontal span = 180 * cos(75) = 46.6 mm
# Scale: 3.5 px / mm
s_scale = 3.5
origin_x = p1_x + 180
origin_y = desk_y - 10 # rubber pad height 2.5mm

# Console body inclined polygon
# Console thickness T = 46mm
rad_75 = math.radians(75)
cos_75 = math.cos(rad_75)
sin_75 = math.sin(rad_75)
cos_15 = math.sin(rad_75) # normal vector
sin_15 = -math.cos(rad_75)

# 4 corners of main console
h_px = 180.0 * s_scale # 630 px
t_px = 46.0 * s_scale  # 161 px

# P0: front bottom corner
p0_x = origin_x
p0_y = origin_y

# P1: front top corner (along 75 deg)
p1_pt_x = p0_x + h_px * cos_75
p1_pt_y = p0_y - h_px * sin_75

# P2: rear top corner (normal to 75 deg)
p2_pt_x = p1_pt_x + t_px * sin_75
p2_pt_y = p1_pt_y + t_px * cos_75

# P3: rear bottom corner
p3_pt_x = p0_x + t_px * sin_75
p3_pt_y = p0_y + t_px * cos_75

# Draw Main Console Body in Side Profile
console_poly = [(p0_x, p0_y), (p1_pt_x, p1_pt_y), (p2_pt_x, p2_pt_y), (p3_pt_x, p3_pt_y)]
draw.polygon(console_poly, fill='#1E293B', outline='#93C5FD')

# Draw seam between Front Bezel (Part 1, 18mm) and Rear Housing (Part 6, 28mm)
t_front_px = 18.0 * s_scale
seam_p0_x = p0_x + t_front_px * sin_75
seam_p0_y = p0_y + t_front_px * cos_75
seam_p1_x = p1_pt_x + t_front_px * sin_75
seam_p1_y = p1_pt_y + t_front_px * cos_75
draw.line([(seam_p0_x, seam_p0_y), (seam_p1_x, seam_p1_y)], fill='#60A5FA', width=2)
draw.text((p0_x - 30, p0_y - 250), 'MẶT TRƯỚC (18mm)', fill='#60A5FA', font=font_dim_small)
draw.text((p0_x + 80, p0_y - 200), 'VỎ LƯNG (28mm)', fill='#93C5FD', font=font_dim_small)

# Draw Part 7: Triangular Base Stand / Kickstand extending back to X = 120mm
# Footprint D = 120mm from p0_x
stand_foot_x = p0_x + 120.0 * s_scale # 420 px
stand_poly = [
    (p3_pt_x - 10, p3_pt_y - 30), # attached to back of console
    (p2_pt_x - 30 * sin_75, p2_pt_y - 30 * cos_75), # higher anchor
    (stand_foot_x, desk_y - 8), # rear ground heel
    (stand_foot_x - 35, desk_y - 8)
]
draw.polygon(stand_poly, fill='#0F172A', outline='#FBBF24')

# Anti-slip rubber pads under the base (Mặt đáy có đệm cao su silicon)
draw.rounded_rectangle([(p0_x, desk_y - 8), (p0_x + 25, desk_y)], radius=2, fill='#F59E0B')
draw.rounded_rectangle([(stand_foot_x - 25, desk_y - 8), (stand_foot_x, desk_y)], radius=2, fill='#F59E0B')
draw.text((p0_x + 15, desk_y + 35), 'ĐỆM CAO SU CHỐNG TRƯỢT (Ø10mm)', fill='#FDE047', font=font_dim_small)

# Angle Arc: 75° callout
arc_r = 75
draw.arc([(p0_x - arc_r, p0_y - arc_r), (p0_x + arc_r, p0_y + arc_r)], start=-75, end=0, fill='#FDE047', width=3)
draw.text((p0_x + 35, p0_y - 55), '75°', fill='#FDE047', font=font_heading)

# Base Footprint Dimension: D = 120.0 mm
draw_dim_h(p0_x, stand_foot_x, desk_y + 20, 'CHIỀU SÂU CHÂN ĐẾ D = 120.0 mm (CHỐNG LẬT 100%)', offset_text=10, color='#FBBF24')

# Height Dimension: 180.0 mm
draw_dim_v(p1_x + 50, p1_pt_y, p0_y, 'H = 180.0 mm')

# Push Force Stability Arrow (Mô phỏng lực ấn tay người dùng)
push_y = p0_y - 350
draw.line([(p0_x - 80, push_y), (p0_x - 10, push_y)], fill='#EF4444', width=3)
draw.polygon([(p0_x - 10, push_y), (p0_x - 22, push_y - 6), (p0_x - 22, push_y + 6)], fill='#EF4444')
draw.text((p0_x - 120, push_y - 30), 'LỰC ẤN TAY (F_push)', fill='#EF4444', font=font_bold)
draw.text((p0_x - 120, push_y - 8), 'Dồn trọng tâm xuống đế', fill='#CBD5E1', font=font_dim_small)

# ==================== PANEL 2: MẶT NGOÀI VỎ LƯNG (REAR EXTERIOR VIEW) ====================
p2_x, p2_y, p2_w, p2_h = 910, 165, 710, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. HÌNH CHIẾU MẶT NGOÀI VỎ LƯNG: PART [6]', fill='#FFFFFF', font=font_heading)

# Rear shell rect: 230 x 180 mm scaled (scale = 2.6)
r_scale = 2.6
rw_px = 230.0 * r_scale # 598 px
rh_px = 180.0 * r_scale # 468 px
rx0 = p2_x + (p2_w - rw_px) // 2
ry0 = p2_y + 110

# Main Rear Backplate (Vuông vức, R=4px vi mô)
draw.rounded_rectangle([(rx0, ry0), (rx0 + rw_px, ry0 + rh_px)], radius=4, fill='#1E293B', outline='#93C5FD', width=3)

# 8 Perimeter Countersunk Holes for M3 Screws (Vít bắt chìm M3)
screw_pts = [
    (rx0 + 20, ry0 + 20), (rx0 + rw_px//2, ry0 + 15), (rx0 + rw_px - 20, ry0 + 20),
    (rx0 + 20, ry0 + rh_px - 20), (rx0 + rw_px//2, ry0 + rh_px - 15), (rx0 + rw_px - 20, ry0 + rh_px - 20),
    (rx0 + 15, ry0 + rh_px//2), (rx0 + rw_px - 15, ry0 + rh_px//2)
]

for sx, sy in screw_pts:
    draw.ellipse([(sx - 7, sy - 7), (sx + 7, sy + 7)], fill='#0B132B', outline='#60A5FA', width=1)
    draw.ellipse([(sx - 3, sy - 3), (sx + 3, sy + 3)], fill='#FBBF24')

draw.text((rx0 + 35, ry0 + 25), '8× LỖ VÍT BẮT CHÌM M3', fill='#FDE047', font=font_dim_small)

# Center Debossed DIAPLUS D+ Brand Logo
logo_cx = rx0 + rw_px // 2
logo_cy = ry0 + 130
draw.ellipse([(logo_cx - 35, logo_cy - 35), (logo_cx + 35, logo_cy + 35)], fill='#152238', outline='#38BDF8', width=2)
draw.text((logo_cx - 18, logo_cy - 16), 'D+', fill='#38BDF8', font=font_title)
draw.text((logo_cx - 50, logo_cy + 45), 'DIAPLUS CalenDIA+', fill='#94A3B8', font=font_bold)
draw.text((logo_cx - 40, logo_cy + 70), 'Khắc chìm sâu 0.8mm', fill='#64748B', font=font_dim_small)

# Acoustic Speaker & Heat Ventilation Slots (Khe tản nhiệt & thoát âm loa)
vent_y0 = ry0 + 270
for i in range(5):
    vy = vent_y0 + i * 14
    draw.rounded_rectangle([(rx0 + rw_px//2 - 60, vy), (rx0 + rw_px//2 + 60, vy + 6)], radius=3, fill='#0B132B', outline='#60A5FA')
draw.text((rx0 + rw_px//2 - 80, vent_y0 + 78), 'KHE THOÁT ÂM LOA & TẢN NHIỆT', fill='#60A5FA', font=font_dim_small)

# Recessed USB Type-C Port at bottom right edge
usb_x = rx0 + rw_px - 50
usb_y = ry0 + rh_px - 40
draw.rounded_rectangle([(usb_x, usb_y), (usb_x + 35, usb_y + 16)], radius=6, fill='#020617', outline='#34D399', width=2)
draw.line([(usb_x + 18, usb_y + 25), (usb_x + 18, usb_y + 60)], fill='#34D399', width=2)
draw.text((usb_x - 60, usb_y + 65), 'CỔNG SẠC TYPE-C (5V 2A)', fill='#34D399', font=font_bold)

# Attachment Bosses for Stand (4 lỗ bắt chân đế Part 7)
for st_x, st_y in [(rx0 + 100, ry0 + 360), (rx0 + rw_px - 100, ry0 + 360), (rx0 + 100, ry0 + 400), (rx0 + rw_px - 100, ry0 + 400)]:
    draw.ellipse([(st_x - 6, st_y - 6), (st_x + 6, st_y + 6)], fill='#0F172A', outline='#F59E0B', width=2)
draw.text((rx0 + 120, ry0 + 375), '4× LỖ GÁ BẮT VÍT CHÂN ĐẾ PART 7', fill='#FBBF24', font=font_dim_small)

# ==================== PANEL 3: MẶT TRONG LÒNG VỎ & GÁ BO MẠCH (INTERNAL VIEW) ====================
p3_x, p3_y, p3_w, p3_h = 1650, 165, 710, 830
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. MẶT TRONG LÒNG VỎ: GÁ ESP32-C3 & LOA', fill='#FFFFFF', font=font_heading)

ix0 = p3_x + (p3_w - rw_px) // 2
iy0 = p3_y + 110

# Inner cavity border
draw.rounded_rectangle([(ix0, iy0), (ix0 + rw_px, iy0 + rh_px)], radius=4, fill='#152238', outline='#60A5FA', width=3)
draw.rounded_rectangle([(ix0 + 10, iy0 + 10), (ix0 + rw_px - 10, iy0 + rh_px - 10)], radius=3, fill='#0B132B', outline='#334155', width=2)

# ESP32-C3 Mounting Posts (4 Trụ ốc M2: 44.0 x 20.0 mm pitch)
esp_w_px = 44.0 * r_scale # 114 px
esp_h_px = 20.0 * r_scale # 52 px
esp_x0 = ix0 + 35
esp_y0 = iy0 + 40

draw.rectangle([(esp_x0, esp_y0), (esp_x0 + esp_w_px, esp_y0 + esp_h_px)], fill='#047857', outline='#34D399', width=2)
draw.text((esp_x0 + 12, esp_y0 + 16), 'ESP32-C3 DevKit', fill='#FFFFFF', font=font_bold)

# 4 Screw Bosses M2
for bx, by in [(esp_x0, esp_y0), (esp_x0 + esp_w_px, esp_y0), (esp_x0, esp_y0 + esp_h_px), (esp_x0 + esp_w_px, esp_y0 + esp_h_px)]:
    draw.ellipse([(bx - 5, by - 5), (bx + 5, by + 5)], fill='#FBBF24', outline='#FFFFFF')

draw.text((esp_x0, esp_y0 + esp_h_px + 10), '4× Trụ ốc M2 (Pitch 44×20mm)', fill='#6EE7B7', font=font_dim_small)

# Acoustic Speaker Pocket (Hốc loa tròn Ø30mm x sâu 8mm)
spk_r = 15.0 * r_scale # 39 px
spk_cx = ix0 + rw_px - 75
spk_cy = iy0 + 80
draw.ellipse([(spk_cx - spk_r, spk_cy - spk_r), (spk_cx + spk_r, spk_cy + spk_r)], fill='#1E293B', outline='#F43F5E', width=2)
draw.ellipse([(spk_cx - 10, spk_cy - 10), (spk_cx + 10, spk_cy + 10)], fill='#BE123C')
draw.text((spk_cx - 45, spk_cy + spk_r + 10), 'HỐC LOA Ø30mm (1-2W)', fill='#FDA4AF', font=font_dim_small)

# Wire Routing Clips (Gờ kẹp dây điện)
for wy in [iy0 + 170, iy0 + 230, iy0 + 290]:
    draw.rectangle([(ix0 + 40, wy), (ix0 + 55, wy + 8)], fill='#38BDF8')
    draw.rectangle([(ix0 + rw_px - 55, wy), (ix0 + rw_px - 40, wy + 8)], fill='#38BDF8')
draw.text((ix0 + 65, iy0 + 225), 'RÃNH KẸP DÂY NGUỒN & DATA LED WS2812B', fill='#38BDF8', font=font_dim_small)

# Central Honeycomb Backing Area
draw.rectangle([(ix0 + 40, iy0 + 260), (ix0 + rw_px - 40, iy0 + rh_px - 25)], outline='#475569', width=1)
draw.text((ix0 + 80, iy0 + 340), 'KHOANG TIẾP XÚC SAU LƯNG KHUNG TỔ ONG PART 3', fill='#64748B', font=font_bold)

# ==================== PANEL 4: BẢNG DỮ LIỆU KỸ THUẬT & HƯỚNG DẪN IN 3D PETG ====================
p4_x, p4_y, p4_w, p4_h = 60, 1020, W - 120, 460
draw.rectangle([(p4_x, p4_y), (p4_x+p4_w, p4_y+p4_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p4_x, p4_y), (p4_x+p4_w, p4_y+55)], fill='#1E3A8A')
draw.text((p4_x+25, p4_y+14), '4. BẢNG THÔNG SỐ HÌNH HỌC, DUNG SAI & CHỈ DẪN IN 3D CHO PART [6] VÀ PART [7]', fill='#FFFFFF', font=font_heading)

t_cols = [p4_x+30, p4_x+480, p4_x+950, p4_x+1450, p4_x+1850]
t_y = p4_y + 75
draw.rectangle([(p4_x+20, t_y), (p4_x+p4_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'CHI TIẾT / HẠNG MỤC', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC TIÊU CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI / VẬT LIỆU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'CHỨC NĂNG CƠ KHÍ & CÔNG THÁI HỌC', fill='#38BDF8', font=font_bold)

table_data = [
    ('PART [6]: Vỏ lưng khoang máy', '230.0 × 180.0 × 28.0 mm (Vuông 90°)', '± 0.20 mm | PETG Trắng sứ', 'Đóng kín máy, chứa ESP32-C3, loa và cổng sạc USB-C'),
    ('PART [7]: Chân đế nghiêng 75°', '210.0 × 120.0 × 12.0 mm (Chân choãi)', '± 0.25 mm | PETG 40% Infill', 'Tạo góc nghiêng 75°, chống lật đổ khi ấn mở 28 khay thuốc'),
    ('4 Trụ bắt vi điều khiển ESP32', 'Tâm lỗ 44.0 × 20.0 mm, Lỗ Ø 1.8mm', '± 0.05 mm | Bắt vít M2', 'Cố định bo mạch ESP32-C3 chắc chắn, không bị rung lắc'),
    ('Hốc buồng cộng hưởng loa', 'Đường kính Ø 30.0 mm × sâu 8.0 mm', '± 0.10 mm | Đệm mút xốp', 'Tăng âm lượng lời nhắc giọng nói \"Ba ơi uống thuốc\" rõ ràng'),
    ('6 Chân đệm chống trượt đáy', '6 Hốc tròn Ø 10.0 mm × sâu 1.5 mm', '± 0.10 mm | Dán Silicon 3M', 'Tăng ma sát, bám chặt mặt bàn kính/gỗ không bị xê dịch'),
    ('Cổng nguồn USB Type-C', 'Khoét lỗ Oval 10.5 × 5.0 mm', '± 0.15 mm | Viền vát bo', 'Cắm vừa mọi đầu cáp Type-C phổ thông trên thị trường'),
    ('Chỉ dẫn Slicer xưởng in 3D', 'Vỏ lưng úp mặt lưng | Chân đế úp đáy', 'Layer 0.20mm | Wall 4-5 lớp', 'Chân đế in infill 40% Gyroid để tăng độ nặng đầm tay, chống trượt')
]

curr_y = t_y + 55
for row in table_data:
    draw.rectangle([(p4_x+20, curr_y), (p4_x+p4_w-20, curr_y+43)], fill='#152238' if table_data.index(row)%2==0 else '#101C36')
    draw.text((t_cols[0], curr_y+10), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+10), row[1], fill='#FDE047', font=font_bold)
    draw.text((t_cols[2], curr_y+10), row[2], fill='#6EE7B7', font=font_label)
    draw.text((t_cols[3], curr_y+10), row[3], fill='#CBD5E1', font=font_label)
    curr_y += 46

# Output Path
out_path = 'd:/DIA+/ban_ve_vo_lung_va_chan_de_75do_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
