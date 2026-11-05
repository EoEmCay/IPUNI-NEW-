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

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

# Outer Border
draw.rectangle([(30, 30), (W-30, H-30)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(50, 45), (W-50, 145)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 56), 'BẢN VẼ CHI TIẾT CAD: KHAY BẮT BO MẠCH ESP32 & MẢNG 28 ĐÈN LED (PART [4])', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • KHAY ĐIỆN TỬ CHUẨN XÁC CAO • BƯỚC LED Px=28.5mm, Py=22.5mm • TRỤ GÁ ESP32 PITCH 44×20mm', fill='#FBBF24', font=font_subtitle)

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

# ==================== PANEL 1: MẶT CHÍNH KHAY GÁ ĐIỆN TỬ (FRONT ELEVATION VIEW) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1420, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. HÌNH CHIẾU MẶT TRƯỚC: MẢNG 28 HỐC LED WS2812B & KHOANG GÁ ESP32-C3 (TỶ LỆ 1:1)', fill='#FFFFFF', font=font_heading)

# Scale: 5.2 px / mm
scale = 5.2
plate_w_px = 218.0 * scale # 1133 px
plate_h_px = 142.0 * scale # 738 px
px0 = p1_x + (p1_w - plate_w_px) // 2 + 10
py0 = p1_y + 80

# Main Unified Carrier Plate Body
draw.rounded_rectangle([(px0, py0), (px0 + plate_w_px, py0 + plate_h_px)], radius=6, fill='#111827', outline='#60A5FA', width=3)

# 6 Mounting Ears on the perimeter (matching Honeycomb Part 3)
ear_w = 9.0 * scale
ear_h = 16.0 * scale
# Left & Right ears
for ey in [py0 + 80, py0 + plate_h_px - 80]:
    # Left ear
    draw.rectangle([(px0 - ear_w, ey), (px0, ey + ear_h)], fill='#1E293B', outline='#60A5FA', width=2)
    draw.ellipse([(px0 - ear_w + 14, ey + ear_h//2 - 9), (px0 - ear_w + 32, ey + ear_h//2 + 9)], fill='#0B132B', outline='#FBBF24', width=2)
    # Right ear
    draw.rectangle([(px0 + plate_w_px, ey), (px0 + plate_w_px + ear_w, ey + ear_h)], fill='#1E293B', outline='#60A5FA', width=2)
    draw.ellipse([(px0 + plate_w_px + 14, ey + ear_h//2 - 9), (px0 + plate_w_px + 32, ey + ear_h//2 + 9)], fill='#0B132B', outline='#FBBF24', width=2)

# --- TOP ELECTRONICS BAY (Y = py0 + 15 to py0 + 50 mm) ---
top_bay_h = 38.0 * scale
draw.rectangle([(px0 + 20, py0 + 15), (px0 + plate_w_px - 20, py0 + 15 + top_bay_h)], fill='#1F2937', outline='#374151', width=1)
draw.text((px0 + 35, py0 + 25), 'KHOANG ĐIỆN TỬ ĐỈNH: ESP32-C3 DEVKIT + CỔNG TYPE-C + BUỒNG LOA', fill='#9CA3AF', font=font_dim_small)

# ESP32-C3 Standoff Bosses (Pitch 44.0 x 20.0 mm)
esp_pitch_w = 44.0 * scale # 228 px
esp_pitch_h = 20.0 * scale # 104 px
esp_x0 = px0 + 80
esp_y0 = py0 + 65

# Board ghost outline (48.5 x 25.5 mm)
brd_w = 48.5 * scale
brd_h = 25.5 * scale
draw.rectangle([(esp_x0 - 10, esp_y0 - 10), (esp_x0 - 10 + brd_w, esp_y0 - 10 + brd_h)], fill='#064E3B', outline='#34D399', width=2)
draw.text((esp_x0 + 25, esp_y0 + 35), 'ESP32-C3-DevKitM-1', fill='#ECFDF5', font=font_bold)

# Antenna Keep-out Slot (Under PCB antenna)
ant_w = 16.0 * scale
ant_h = 8.0 * scale
draw.rectangle([(esp_x0 - 8, esp_y0 - 8), (esp_x0 - 8 + ant_w, esp_y0 - 8 + ant_h)], fill='#7F1D1D', outline='#EF4444', width=1)
draw.text((esp_x0 - 6, esp_y0 - 28), 'ANTENNA KEEP-OUT', fill='#F87171', font=font_dim_small)

# 4 Screw Bosses with M2 holes
boss_r = 10
bosses = [
    (esp_x0, esp_y0), (esp_x0 + esp_pitch_w, esp_y0),
    (esp_x0, esp_y0 + esp_pitch_h), (esp_x0 + esp_pitch_w, esp_y0 + esp_pitch_h)
]
for bx, by in bosses:
    draw.ellipse([(bx - boss_r, by - boss_r), (bx + boss_r, by + boss_r)], fill='#1E40AF', outline='#60A5FA', width=2)
    draw.ellipse([(bx - 4, by - 4), (bx + 4, by + 4)], fill='#FBBF24')

# Dimension Callout for ESP32 Pitch: 44.0 x 20.0 mm
draw_dim_h(esp_x0, esp_x0 + esp_pitch_w, esp_y0 - 35, 'PITCH X = 44.0 mm', offset_text=8, color='#34D399')
draw_dim_v(esp_x0 + esp_pitch_w + 30, esp_y0, esp_y0 + esp_pitch_h, 'PITCH Y = 20.0 mm', offset_text=10, color='#34D399')

# Mini Speaker Standoff on top right
spk_cx = px0 + plate_w_px - 140
spk_cy = py0 + 100
draw.ellipse([(spk_cx - 50, spk_cy - 50), (spk_cx + 50, spk_cy + 50)], fill='#1E293B', outline='#F43F5E', width=2)
draw.text((spk_cx - 40, spk_cy - 8), 'GÁ LOA Ø30mm', fill='#FDA4AF', font=font_bold)

# --- 28-LED MATRIX SECTION (7 COLUMNS × 4 ROWS) ---
mat_top_y = py0 + top_bay_h + 30
# Pitch: Px = 28.5 mm, Py = 22.5 mm
pitch_x_px = 28.5 * scale # 148.2 px
pitch_y_px = 22.5 * scale # 117.0 px
led_cx0 = px0 + (plate_w_px - 6 * pitch_x_px) // 2
led_cy0 = mat_top_y + 35

# Serpentine Wire Channel (Snake Track: Row 1 L->R, Row 2 R->L, Row 3 L->R, Row 4 R->L)
# Draw continuous blue track behind LEDs
track_pts = []
for r in range(4):
    cols = range(7) if r % 2 == 0 else range(6, -1, -1)
    for c in cols:
        lx = led_cx0 + c * pitch_x_px
        ly = led_cy0 + r * pitch_y_px
        track_pts.append((lx, ly))

for i in range(len(track_pts) - 1):
    draw.line([track_pts[i], track_pts[i+1]], fill='#1E3A8A', width=8)

# Connect from ESP32 GPIO 8 to LED 1
draw.line([(esp_x0 + esp_pitch_w, esp_y0 + esp_pitch_h), (track_pts[0][0], track_pts[0][1])], fill='#34D399', width=4)
draw.text((esp_x0 + esp_pitch_w + 10, esp_y0 + esp_pitch_h + 15), 'GPIO 8 (DATA OUT)', fill='#34D399', font=font_bold)

# Draw 28 LED Pockets
led_num = 1
for r in range(4):
    for c in range(7):
        lx = led_cx0 + c * pitch_x_px
        ly = led_cy0 + r * pitch_y_px
        
        # Outer Light Baffle Collar: 14.0 x 14.0 mm
        col_w = 14.0 * scale
        draw.rectangle([(lx - col_w/2, ly - col_w/2), (lx + col_w/2, ly + col_w/2)], fill='#1E293B', outline='#60A5FA', width=2)
        
        # Inner Recessed LED Pocket: 12.0 x 12.0 mm
        pock_w = 12.0 * scale
        draw.rectangle([(lx - pock_w/2, ly - pock_w/2), (lx + pock_w/2, ly + pock_w/2)], fill='#0F172A', outline='#38BDF8', width=1)
        
        # 5050 RGB LED Chip (5.0 x 5.0 mm)
        chip_w = 5.0 * scale
        draw.rectangle([(lx - chip_w/2, ly - chip_w/2), (lx + chip_w/2, ly + chip_w/2)], fill='#374151', outline='#9CA3AF', width=1)
        draw.ellipse([(lx - chip_w/2 + 4, ly - chip_w/2 + 4), (lx + chip_w/2 - 4, ly + chip_w/2 - 4)], fill='#FBBF24')
        
        # LED Index Number
        draw.text((lx - 12, ly + col_w/2 + 4), f'#{led_num}', fill='#94A3B8', font=font_dim_small)
        led_num += 1

# Highlight Dimensions between LEDs (Col 1 to Col 2)
draw_dim_h(led_cx0, led_cx0 + pitch_x_px, led_cy0 - 45, 'Px = 28.5 mm (BƯỚC NGANG)', offset_text=10, color='#FBBF24')
draw_dim_v(led_cx0 + 6 * pitch_x_px + 70, led_cy0, led_cy0 + pitch_y_px, 'Py = 22.5 mm', offset_text=10, color='#FBBF24')

# Overall Dimensions
draw_dim_h(px0, px0 + plate_w_px, py0 + plate_h_px + 40, 'TỔNG CHIỀU RỘNG W = 218.0 mm (KHAY GÁ ĐIỆN TỬ NGUYÊN KHỐI)', offset_text=10)
draw_dim_v(px0 - 75, py0, py0 + plate_h_px, 'H = 142.0 mm')

# ==================== PANEL 2: CHI TIẾT PHÓNG ĐẠI & SƠ ĐỒ ĐẤU DÂY ====================
p2_x, p2_y, p2_w, p2_h = 1510, 165, 830, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. CHI TIẾT PHÓNG ĐẠI 1 HỐC LED & ĐẤU NỐI BUS 3 DÂY', fill='#FFFFFF', font=font_heading)

# Detail A: Zoom-in on 1 LED Pocket (Scale 18.0)
z_scale = 18.0
zx0 = p2_x + 90
zy0 = p2_y + 110

# Baffle Collar (14.0 x 14.0 mm) -> 252 px
bw_px = 14.0 * z_scale
bh_px = 14.0 * z_scale
draw.rectangle([(zx0, zy0), (zx0 + bw_px, zy0 + bh_px)], fill='#1E293B', outline='#60A5FA', width=3)

# Pocket Cavity (12.0 x 12.0 mm) -> 216 px
pw_px = 12.0 * z_scale
ph_px = 12.0 * z_scale
p_off = (bw_px - pw_px) / 2
draw.rectangle([(zx0 + p_off, zy0 + p_off), (zx0 + p_off + pw_px, zy0 + p_off + ph_px)], fill='#0F172A', outline='#38BDF8', width=2)

# LED 5050 Chip (5.0 x 5.0 mm) -> 90 px
cw_px = 5.0 * z_scale
c_off = (bw_px - cw_px) / 2
draw.rectangle([(zx0 + c_off, zy0 + c_off), (zx0 + c_off + cw_px, zy0 + c_off + cw_px)], fill='#374151', outline='#E5E7EB', width=2)
draw.ellipse([(zx0 + c_off + 15, zy0 + c_off + 15), (zx0 + c_off + cw_px - 15, zy0 + c_off + cw_px - 15)], fill='#FBBF24')

# Solder Pads & 3 Wires (+5V, DIN, GND)
pad_w = 20
draw.rectangle([(zx0 + c_off - 15, zy0 + c_off + 10), (zx0 + c_off, zy0 + c_off + 30)], fill='#EF4444') # +5V
draw.rectangle([(zx0 + c_off - 15, zy0 + c_off + 35), (zx0 + c_off, zy0 + c_off + 55)], fill='#10B981') # DIN
draw.rectangle([(zx0 + c_off - 15, zy0 + c_off + 60), (zx0 + c_off, zy0 + c_off + 80)], fill='#1F2937') # GND

draw.text((zx0 + bw_px + 20, zy0 + 30), 'GỜ CHẮN SÁNG: 14.0 × 14.0 mm', fill='#60A5FA', font=font_bold)
draw.text((zx0 + bw_px + 20, zy0 + 60), 'HỐC CHÌM ĐÈN: 12.0 × 12.0 mm (Sâu 2.0mm)', fill='#38BDF8', font=font_label)
draw.text((zx0 + bw_px + 20, zy0 + 90), 'LED RGB SMD 5050 WS2812B (5.0 × 5.0mm)', fill='#FDE047', font=font_bold)
draw.text((zx0 + bw_px + 20, zy0 + 120), 'RÃNH LUỒN DÂY: Rộng 3.0 mm × sâu 1.5mm', fill='#A7F3D0', font=font_label)
draw.text((zx0 + bw_px + 20, zy0 + 150), 'TỤ LỌC NHIỄU: 100nF dán song song nguồn', fill='#CBD5E1', font=font_dim_small)

# Wiring Bus Schematic (Sơ đồ nối tiếp Serpentine Data Flow)
sch_y = p2_y + 400
draw.rectangle([(p2_x + 30, sch_y), (p2_x + p2_w - 30, sch_y + 390)], fill='#152238', outline='#38BDF8', width=1)
draw.text((p2_x + 50, sch_y + 15), 'SƠ ĐỒ ĐẤU NỐI MẠCH ĐIỆN TỬ VÀ DÒNG TÍN HIỆU DATA:', fill='#FBBF24', font=font_subheading)

draw.text((p2_x + 50, sch_y + 55), '1. DÒNG DỮ LIỆU LED (SERPENTINE DATA BUS):', fill='#34D399', font=font_bold)
draw.text((p2_x + 70, sch_y + 85), '• ESP32-C3 GPIO 8 ---> DIN (LED #1 - Thứ 2 Sáng)', fill='#FFFFFF', font=font_mono)
draw.text((p2_x + 70, sch_y + 115), '• DOUT (#1) -> DIN (#2) -> ... -> DOUT (#7 - CN Sáng)', fill='#FFFFFF', font=font_mono)
draw.text((p2_x + 70, sch_y + 145), '• Vòng xuống Hàng 2 (Trưa): DOUT (#8) -> ... -> DOUT (#14)', fill='#FFFFFF', font=font_mono)
draw.text((p2_x + 70, sch_y + 175), '• Chạy dích dắc khép kín tới LED #28 (CN Tối).', fill='#6EE7B7', font=font_label)

draw.text((p2_x + 50, sch_y + 215), '2. NGUỒN CẤP ĐIỆN ÁP (5V BUS & 3.3V BUS):', fill='#38BDF8', font=font_bold)
draw.text((p2_x + 70, sch_y + 245), '• Cổng Type-C cấp nguồn 5V trực tiếp cho chân 5V ESP32 & Dải LED.', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 70, sch_y + 275), '• Dòng tiêu thụ cực đại 28 LED (Full Trắng 100%): ~1.2A (Củ sạc 2A dư tải).', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 70, sch_y + 305), '• Chế độ sáng 1 ô nhắc thuốc: Chỉ tiêu thụ ~45mA, mạch cực mát.', fill='#FDE047', font=font_bold)
draw.text((p2_x + 70, sch_y + 335), '• Màn hình OLED & cảm biến: Dùng nguồn 3.3V ổn định từ IC nguồn ESP32.', fill='#CBD5E1', font=font_label)

# ==================== PANEL 3: BẢNG THÔNG SỐ KỸ THUẬT & DUNG SAI PART [4] ====================
p3_x, p3_y, p3_w, p3_h = 60, 1020, W - 120, 460
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. BẢNG THÔNG SỐ KỸ THUẬT, DUNG SAI ĐIỆN CƠ & HƯỚNG DẪN IN 3D KHAY PART [4]', fill='#FFFFFF', font=font_heading)

t_cols = [p3_x+30, p3_x+480, p3_x+950, p3_x+1450, p3_x+1850]
t_y = p3_y + 75
draw.rectangle([(p3_x+20, t_y), (p3_x+p3_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'HẠNG MỤC CƠ KHÍ & ĐIỆN TỬ', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC TIÊU CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI / VẬT LIỆU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'MỤC ĐÍCH & TIÊU CHUẨN KỸ THUẬT', fill='#38BDF8', font=font_bold)

table_data = [
    ('Tấm vỉ gá nguyên khối Part 4', '218.0 × 142.0 × 4.5 mm (Dày nền 3.0mm)', '± 0.15 mm | PETG Đen mờ', 'Gá đồng thời bo mạch ESP32 và mảng 28 đèn LED, chắn sáng 100%'),
    ('Bước tọa độ tâm đèn LED (Pitch)', 'Ngang Px = 28.5 mm | Dọc Py = 22.5 mm', '± 0.10 mm (Cực chuẩn)', 'Tâm đèn LED rọi thẳng vào tâm đuôi của 28 ngăn kéo thuốc'),
    ('Hốc LED & Gờ chắn sáng Baffle', 'Hốc 12×12mm, Gờ viền 14×14mm (Cao 1.5mm)', '± 0.10 mm', 'Khóa ngàm vào đáy khung tổ ong Part 3, triệt tiêu lọt sáng giữa các ô'),
    ('4 Trụ bắt ốc bo mạch ESP32-C3', 'Tâm lỗ 44.0 × 20.0 mm | Lỗ ren M2 (Ø1.8mm)', '± 0.05 mm | Bắt vít M2', 'Gá chặt bo ESP32-C3, standoff cao 4.0mm cách điện chân linh kiện'),
    ('Khe hở thoát sóng Antenna Wi-Fi', 'Khoét rỗng 16.0 × 8.0 mm (Keep-out zone)', 'Vùng cấm kim loại/nhựa', 'Đảm bảo sóng Wi-Fi và BLE truyền xa 15-20 mét, không bị suy hao'),
    ('Rãnh luồn dây nối tiếp Serpentine', 'Rộng 3.0 mm × Sâu 1.5 mm (Chạy dích dắc)', '± 0.15 mm', 'Chứa vừa 3 dây điện mềm AWG28 hoặc dải cáp FPC dán phẳng'),
    ('Hướng dẫn in 3D FDM nhựa PETG', 'Mặt lưng úp bàn in | Layer 0.16mm | Wall 4', 'Ruột 30% Gyroid', 'DÙNG NHỰA PETG MÀU ĐEN ĐẶC để hấp thụ ánh sáng LED triệt để')
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
out_path = 'd:/DIA+/ban_ve_khay_esp32_led_tray_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
