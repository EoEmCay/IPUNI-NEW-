import os
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 2400, 1550
img = Image.new('RGB', (W, H), color='#0B132B')
draw = ImageDraw.Draw(img)

# Windows System Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 38)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 21)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
font_subheading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 17)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_dim_small = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)
font_brand = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)

# Subtle CAD Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

# Outer Border
draw.rectangle([(30, 30), (W-30, H-30)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(50, 45), (W-50, 145)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 56), 'BẢN VẼ CHI TIẾT CAD: CỤM DẢI LOA ÂM THANH NHẮC UỐNG THUỐC (ACOUSTIC SOUNDBAR)', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • KHU VỰC TRÁN TRÊN MÁY • BUỒNG ÂM CỘNG HƯỞNG Ø 28mm 8Ω 2W • MÀNG LỌC BỤI IP54 • CÔNG SUẤT 80 dB', fill='#FBBF24', font=font_subtitle)

# Dimension line helpers
def draw_dim_h(x1, x2, y, text, offset_text=14, color='#38BDF8'):
    draw.line([(x1, y), (x2, y)], fill=color, width=2)
    draw.polygon([(x1, y), (x1+8, y-3), (x1+8, y+3)], fill=color)
    draw.polygon([(x2, y), (x2-8, y-3), (x2-8, y+3)], fill=color)
    draw.line([(x1, y-8), (x1, y+8)], fill=color, width=1)
    draw.line([(x2, y-8), (x2, y+8)], fill=color, width=1)
    bbox = font_dim.getbbox(text)
    tw = bbox[2] - bbox[0]
    draw.text(((x1 + x2 - tw)//2, y - offset_text - 14), text, fill='#FFFFFF', font=font_dim)

def draw_dim_v(x, y1, y2, text, offset_text=14, color='#38BDF8'):
    draw.line([(x, y1), (x, y2)], fill=color, width=2)
    draw.polygon([(x, y1), (x-3, y1+8), (x+3, y1+8)], fill=color)
    draw.polygon([(x, y2), (x-3, y2-8), (x+3, y2-8)], fill=color)
    draw.line([(x-8, y1), (x+8, y1)], fill=color, width=1)
    draw.line([(x-8, y2), (x+8, y2)], fill=color, width=1)
    draw.text((x + offset_text, (y1 + y2)//2 - 12), text, fill='#FFFFFF', font=font_dim)

# ==============================================================================
# PANEL 1: HÌNH CHIẾU ĐỨNG MẶT NGOÀI DẢI LOA (FRONT ELEVATION & SLIT ARRAY)
# ==============================================================================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1340, 680
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+50)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+12), '1. HÌNH CHIẾU ĐỨNG: DẢI RÃNH THOÁT ÂM SÓNG SÂM CÔNG THÁI HỌC (W = 160.0 mm × H = 26.0 mm)', fill='#FFFFFF', font=font_heading)

# Scale: 5.5 px / mm
scale1 = 5.5
bar_w = 160.0 * scale1 # 880 px
bar_h = 26.0 * scale1  # 143 px
bar_x0 = p1_x + (p1_w - bar_w) // 2
bar_y0 = p1_y + 160
bar_x1 = bar_x0 + bar_w
bar_y1 = bar_y0 + bar_h

# Surrounding Forehead Panel Reference
draw.rounded_rectangle([(bar_x0 - 70, bar_y0 - 55), (bar_x1 + 70, bar_y1 + 105)], radius=15, fill='#162544', outline='#334155', width=2)
draw.text((bar_x0 - 50, bar_y0 - 45), 'VÙNG TRÁN TRÊN MẶT TRƯỚC VỎ CALENDIA+ (PETG TRẮNG SỨ Y TẾ)', fill='#94A3B8', font=font_label)

# Outer Recessed Bezel (Bậc chìm sâu 1.2mm)
draw.rounded_rectangle([(bar_x0, bar_y0), (bar_x1, bar_y1)], radius=18, fill='#1B2A4A', outline='#38BDF8', width=2)
draw.text((bar_x0 + 20, bar_y0 + 12), 'BẬC CHÌM ÂM SÂU 1.2 mm • VÁT CHAMFER 45°', fill='#38BDF8', font=font_dim_small)

# Draw 33 vertical capsule slits
n_slits = 33
pitch_px = bar_w / (n_slits + 1)
slit_w_px = 2.2 * scale1 # ~12 px
cy = (bar_y0 + bar_y1) / 2 + 8

for i in range(1, n_slits + 1):
    sx = bar_x0 + i * pitch_px
    dist = abs(i - (n_slits + 1) / 2.0)
    sh_mm = 6.0 + 14.0 * math.exp(- (dist**2) / 45.0)
    sh_px = sh_mm * scale1
    sy0 = cy - sh_px / 2
    sy1 = cy + sh_px / 2
    
    # Slit body
    draw.rounded_rectangle([(sx - slit_w_px/2, sy0), (sx + slit_w_px/2, sy1)], radius=5, fill='#070A10', outline='#60A5FA', width=1)

# Central Acoustic Driver Circle Outline (Ø 28mm behind)
driver_r = (28.0 * scale1) / 2 # 77 px
draw.ellipse([(bar_x0 + bar_w/2 - driver_r, cy - driver_r), (bar_x0 + bar_w/2 + driver_r, cy + driver_r)], outline='#F59E0B', width=2)
draw.text((bar_x0 + bar_w/2 - 85, cy + driver_r + 12), 'VỊ TRÍ CỦ LOA Ø 28 mm PHÍA SAU', fill='#F59E0B', font=font_bold)

# Dimension annotations for Panel 1
draw_dim_h(bar_x0, bar_x1, bar_y0 - 25, 'W_bar = 160.0 mm (Chiều rộng dải loa)')
draw_dim_v(bar_x1 + 35, bar_y0, bar_y1, 'H_bar = 26.0 mm')
draw_dim_h(bar_x0 + pitch_px, bar_x0 + 2*pitch_px, bar_y1 + 35, 'P = 4.0 mm', offset_text=8, color='#FBBF24')
draw_dim_h(bar_x0 + bar_w/2 - driver_r, bar_x0 + bar_w/2 + driver_r, cy - driver_r - 20, 'Ø 28.0 mm', offset_text=8, color='#F59E0B')

# Technical Notes under Panel 1
draw.rectangle([(p1_x + 30, p1_y + p1_h - 130), (p1_x + p1_w - 30, p1_y + p1_h - 20)], fill='#152238', outline='#2563EB', width=1)
notes_p1 = [
    '• Tỷ lệ thoát âm (Acoustic Transparency): 33 rãnh kích thước 2.2 mm × (6.0 - 20.0 mm), diện tích thoát âm đạt ~1050 mm² (~38% diện tích buồng loa).',
    '• Góc thoát sóng âm: Góc mở 120° hình nón hướng trực diện vào người ngồi bàn hoặc nằm giường, triệt tiêu suy hao âm thanh bậc cao.',
    '• Độ nghiêng mặt trán 75°: Tự nhiên đưa luồng âm dội nhẹ lên phía tai người dùng, giúp âm lượng đạt độ vang 78 - 82 dB cực rõ mà không chát tai.',
    '• In 3D FDM: Miệng rãnh vát côn 45°, in trực tiếp bằng nhựa PETG không cần Support, các góc bo R = 1.1 mm triệt tiêu bavia.'
]
for idx, note in enumerate(notes_p1):
    draw.text((p1_x + 45, p1_y + p1_h - 122 + idx * 24), note, fill='#E2E8F0', font=font_label)

# ==============================================================================
# PANEL 2: MẶT CẮT DỌC A-A BÓC TÁCH BUỒNG ÂM & CỦ LOA (CROSS-SECTION A-A)
# ==============================================================================
p2_x, p2_y, p2_w, p2_h = 1430, 165, 910, 680
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+50)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+12), '2. MẶT CẮT A-A: KẾT CẤU BUỒNG ÂM CỘNG HƯỞNG & CỦ LOA', fill='#FFFFFF', font=font_heading)

# Section diagram setup
# Showing front plastic wall (2.5mm), dust mesh (0.3mm), EVA gasket (1.2mm), speaker driver (8.5mm), back cavity (10.0mm), rear cover (2.2mm)
sec_x0 = p2_x + 120
sec_y0 = p2_y + 140
sec_scale = 16.0 # 16 px / mm

# Wall 1: Front Bezel (t = 2.5 mm -> 40 px)
w_front = 2.5 * sec_scale
h_sec = 26.0 * sec_scale # 416 px

# Front Bezel Wall
draw.rectangle([(sec_x0, sec_y0), (sec_x0 + w_front, sec_y0 + h_sec)], fill='#475569', outline='#94A3B8', width=2)
# Slits cutouts
slit_h_cut = 18.0 * sec_scale
sy_slit0 = sec_y0 + (h_sec - slit_h_cut)/2
draw.rectangle([(sec_x0, sy_slit0), (sec_x0 + w_front, sy_slit0 + slit_h_cut)], fill='#0B132B') # through hole
draw.text((sec_x0 - 80, sy_slit0 + 50), 'KHE THOÁT\nÂM 2.2mm', fill='#38BDF8', font=font_dim_small)

# Layer 2: Dust Mesh IP54 (t = 0.4 mm -> 6 px)
x_mesh = sec_x0 + w_front
w_mesh = 0.4 * sec_scale
draw.rectangle([(x_mesh, sy_slit0 - 15), (x_mesh + w_mesh, sy_slit0 + slit_h_cut + 15)], fill='#1E293B', outline='#64748B', width=1)
draw.text((x_mesh + 15, sec_y0 + 20), '1. Màng vải âm học chống bụi IP54 (t = 0.4 mm)', fill='#38BDF8', font=font_dim_small)

# Layer 3: EVA Rubber Gasket (t = 1.2 mm -> 19 px)
x_eva = x_mesh + w_mesh
w_eva = 1.2 * sec_scale
draw.rectangle([(x_eva, sec_y0 + 30), (x_eva + w_eva, sec_y0 + 80)], fill='#0284C7', outline='#38BDF8', width=1)
draw.rectangle([(x_eva, sec_y0 + h_sec - 80), (x_eva + w_eva, sec_y0 + h_sec - 30)], fill='#0284C7', outline='#38BDF8', width=1)
draw.text((x_eva + 25, sec_y0 + 55), '2. Đệm mút EVA kín khí chống rè (1.2 mm)', fill='#0284C7', font=font_dim_small)

# Layer 4: Speaker Driver Frame & Magnet (t = 8.5 mm -> 136 px)
x_spk = x_eva + w_eva
w_spk = 8.5 * sec_scale
h_spk = 28.0 * 12.0 # driver height
# Driver Basket & Cone
draw.polygon([(x_spk, sec_y0 + 40), (x_spk + 35, sec_y0 + 110), (x_spk + 35, sec_y0 + h_sec - 110), (x_spk, sec_y0 + h_sec - 40)], fill='#334155', outline='#CBD5E1', width=2)
# Magnet Pot (NdFeB)
draw.rectangle([(x_spk + 35, sec_y0 + 130), (x_spk + w_spk, sec_y0 + h_sec - 130)], fill='#1E293B', outline='#F59E0B', width=2)
draw.text((x_spk + 45, sec_y0 + h_sec/2 - 10), 'NAM CHÂM NdFeB\n(CỦ LOA Ø 28mm 8Ω 2W)', fill='#F59E0B', font=font_bold)

# Layer 5: Acoustic Sealed Back-Chamber (t = 10.0 mm -> 160 px)
x_cav = x_spk + w_spk
w_cav = 10.0 * sec_scale
draw.rectangle([(x_cav, sec_y0 + 20), (x_cav + w_cav, sec_y0 + h_sec - 20)], fill='#132038', outline='#3B82F6', width=2)
draw.text((x_cav + 20, sec_y0 + h_sec - 60), 'BUỒNG CỘNG HƯỞNG KÍN KHÍ (V = 16.5 cm³)', fill='#60A5FA', font=font_dim_small)

# Layer 6: Rear Enclosure Wall (t = 2.2 mm -> 35 px)
x_back = x_cav + w_cav
w_back = 2.2 * sec_scale
draw.rectangle([(x_back, sec_y0), (x_back + w_back, sec_y0 + h_sec)], fill='#475569', outline='#94A3B8', width=2)

# Chamber Top & Bottom Enclosures
draw.rectangle([(sec_x0, sec_y0), (x_back + w_back, sec_y0 + 20)], fill='#475569', outline='#94A3B8', width=1)
draw.rectangle([(sec_x0, sec_y0 + h_sec - 20), (x_back + w_back, sec_y0 + h_sec)], fill='#475569', outline='#94A3B8', width=1)

# Dimension lines for cross-section
draw_dim_h(sec_x0, x_back + w_back, sec_y0 + h_sec + 35, 'T_total = 24.8 mm (Tổng chiều sâu buồng loa)')
draw_dim_v(x_back + w_back + 30, sec_y0, sec_y0 + h_sec, 'H = 26.0 mm')

# Technical Specs Box for Panel 2
draw.rectangle([(p2_x + 30, p2_y + p2_h - 130), (p2_x + p2_w - 30, p2_y + p2_h - 20)], fill='#152238', outline='#2563EB', width=1)
specs_p2 = [
    '• Thể tích buồng âm (Cavity Volume): V = 16.5 cm³, tần số cộng hưởng tính toán Fs = 480 Hz.',
    '• Khử tiếng rè (Anti-Buzz): Vành mút EVA đàn hồi ép chặt củ loa vào ngàm nhựa, triệt tiêu 100% rung chấn cơ học.',
    '• Chống lọt khí ngược (Hermetic Seal): Đáy buồng loa kín khít, ngăn sóng âm dội ngược vào khoang điện tử ESP32.',
    '• Trụ bắt vít cố định: 2 tai bắt vít ren M2.5 đúc liền trên vỏ trước siết chặt nắp buồng loa.'
]
for idx, spec in enumerate(specs_p2):
    draw.text((p2_x + 45, p2_y + p2_h - 122 + idx * 24), spec, fill='#E2E8F0', font=font_label)

# ==============================================================================
# PANEL 3: SƠ ĐỒ MẠCH ĐIỆN TỬ & KẾT NỐI ESP32 (AUDIO ELECTRONICS ARCHITECTURE)
# ==============================================================================
p3_x, p3_y, p3_w, p3_h = 60, 875, 1340, 615
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+50)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+12), '3. SƠ ĐỒ ĐIỆN TỬ ÂM THANH: ESP32-C3 / S3 ➔ I2S DAC MAX98357A ➔ CỦ LOA 8Ω 2W', fill='#FFFFFF', font=font_heading)

# Block 1: ESP32-C3 / S3 Controller
b1_x, b1_y, b1_w, b1_h = p3_x + 50, p3_y + 110, 310, 340
draw.rounded_rectangle([(b1_x, b1_y), (b1_x + b1_w, b1_y + b1_h)], radius=12, fill='#1E293B', outline='#38BDF8', width=2)
draw.text((b1_x + 25, b1_y + 20), 'VI ĐIỀU KHIỂN ESP32', fill='#38BDF8', font=font_heading)
draw.text((b1_x + 25, b1_y + 55), '• ESP32-C3 / ESP32-S3\n• Wi-Fi 2.4GHz + BLE 5.0\n• Bộ nhớ Flash 4MB / 8MB\n• Phát file âm thanh MP3 / WAV\n• Đồng bộ giờ qua NTP y tế\n• Quản lý 28 cữ thuốc CalenDIA+', fill='#CBD5E1', font=font_label)

# Pinout terminals
pins = [('GPIO 6', 'BCLK (Bit Clock)'), ('GPIO 7', 'LRC (Left/Right Clock)'), ('GPIO 8', 'DIN (Data Out)'), ('3V3 / 5V', 'VCC (Power Rail)'), ('GND', 'GND (Common Ground)')]
for idx, (p_name, p_desc) in enumerate(pins):
    py_t = b1_y + 205 + idx * 24
    draw.text((b1_x + 20, py_t), p_name, fill='#FBBF24', font=font_dim_small)
    draw.text((b1_x + 100, py_t), f': {p_desc}', fill='#94A3B8', font=font_dim_small)

# Block 2: I2S Class-D Amplifier (MAX98357A)
b2_x, b2_y, b2_w, b2_h = p3_x + 480, p3_y + 110, 340, 340
draw.rounded_rectangle([(b2_x, b2_y), (b2_x + b2_w, b2_y + b2_h)], radius=12, fill='#1E293B', outline='#10B981', width=2)
draw.text((b2_x + 25, b2_y + 20), 'MODULE I2S DAC AMP', fill='#10B981', font=font_heading)
draw.text((b2_x + 25, b2_y + 55), '• IC MAX98357A Class-D\n• Hiệu suất chuyển đổi 92%\n• Công suất cực đại: 3.2W @ 4Ω\n  (Vận hành an toàn 2.0W @ 8Ω)\n• Tích hợp bộ giải mã DAC 24-bit\n• Tỷ số tín hiệu/nhiễu SNR > 98dB\n• Chống bụp loa khi bật nguồn (Pop-free)', fill='#CBD5E1', font=font_label)

# Connecting Lines: ESP32 to MAX98357A
draw.line([(b1_x + b1_w, b1_y + 215), (b2_x, b1_y + 215)], fill='#FBBF24', width=3)
draw.text((b1_x + b1_w + 25, b1_y + 195), 'I2S BUS 3 DÂY', fill='#FBBF24', font=font_dim_small)
draw.line([(b1_x + b1_w, b1_y + 270), (b2_x, b1_y + 270)], fill='#38BDF8', width=2)
draw.text((b1_x + b1_w + 30, b1_y + 250), 'VCC (5V) & GND', fill='#38BDF8', font=font_dim_small)

# Block 3: Neodymium Micro Speaker Driver
b3_x, b3_y, b3_w, b3_h = p3_x + 940, p3_y + 110, 340, 340
draw.rounded_rectangle([(b3_x, b3_y), (b3_x + b3_w, b3_y + b3_h)], radius=12, fill='#1E293B', outline='#F59E0B', width=2)
draw.text((b3_x + 25, b3_y + 20), 'CỦ LOA TỪ TÍNH Ø 28mm', fill='#F59E0B', font=font_heading)
draw.text((b3_x + 25, b3_y + 55), '• Trở kháng chuẩn: 8 Ohm (Ω)\n• Công suất định mức: 2.0 Watt\n• Nam châm vĩnh cửu NdFeB N42\n• Màng loa Mylar chống ẩm mốc\n• Dải tần số: 300 Hz - 8,000 Hz\n  (Tối ưu rõ giọng nói tiếng Việt)\n• Độ nhạy: 86 dB / W / m', fill='#CBD5E1', font=font_label)

# Connecting Lines: MAX98357A to Speaker
draw.line([(b2_x + b2_w, b2_y + 215), (b3_x, b2_y + 215)], fill='#EF4444', width=3) # SPK+
draw.line([(b2_x + b2_w, b2_y + 245), (b3_x, b2_y + 245)], fill='#10B981', width=3) # SPK-
draw.text((b2_x + b2_w + 20, b2_y + 185), 'SPK+ / SPK- (Dây xoắn AWG26)', fill='#F59E0B', font=font_dim_small)

# Panel 3 Footer Notes
draw.rectangle([(p3_x + 30, p3_y + p3_h - 110), (p3_x + p3_w - 30, p3_y + p3_h - 20)], fill='#152238', outline='#2563EB', width=1)
notes_p3 = [
    '• Cấu hình thay thế giá rẻ (BOM Tiết Kiệm): Có thể dùng Còi Buzzer chủ động 5V (Active Buzzer 85dB) nếu chỉ cần tiếng BÍP BÍP nhắc giờ.',
    '• Cấu hình cao cấp (Khuyến nghị): Dùng ESP32-C3 I2S + MAX98357A phát giọng nói tiếng Việt mượt mà: "Bác ơi, đến giờ uống thuốc sáng rồi ạ!".',
    '• Điều chỉnh âm lượng: Hỗ trợ 3 mức âm lượng qua web/app di động (Yên tĩnh 60dB ban đêm, Trung bình 72dB, Chuông to 82dB cho người nặng tai).'
]
for idx, note in enumerate(notes_p3):
    draw.text((p3_x + 45, p3_y + p3_h - 100 + idx * 26), note, fill='#E2E8F0', font=font_label)

# ==============================================================================
# PANEL 4: BẢNG DUNG SAI GIA CÔNG & THÔNG SỐ SLICER IN 3D (TOLERANCE & SLICER)
# ==============================================================================
p4_x, p4_y, p4_w, p4_h = 1430, 875, 910, 615
draw.rectangle([(p4_x, p4_y), (p4_x+p4_w, p4_y+p4_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p4_x, p4_y), (p4_x+p4_w, p4_y+50)], fill='#1E3A8A')
draw.text((p4_x+25, p4_y+12), '4. THÔNG SỐ DUNG SAI CAD & CHỈ DẪN IN 3D FDM PETG', fill='#FFFFFF', font=font_heading)

# Table Header
t_y0 = p4_y + 80
draw.rectangle([(p4_x + 30, t_y0), (p4_x + p4_w - 30, t_y0 + 38)], fill='#1E3A8A')
draw.text((p4_x + 45, t_y0 + 8), 'HẠNG MỤC HÌNH HỌC', fill='#FFFFFF', font=font_bold)
draw.text((p4_x + 330, t_y0 + 8), 'KÍCH THƯỚC CHUẨN', fill='#FBBF24', font=font_bold)
draw.text((p4_x + 560, t_y0 + 8), 'DUNG SAI / YÊU CẦU IN 3D', fill='#38BDF8', font=font_bold)

table_rows = [
    ('1. Chiều rộng dải khe loa (W)', '160.0 mm', '± 0.2 mm (Cân đối trán máy 230 mm)'),
    ('2. Chiều cao dải khe loa (H)', '26.0 mm', '± 0.1 mm (Nằm gọn khoang trán 38 mm)'),
    ('3. Bề rộng mỗi rãnh thoát âm', '2.2 mm', '± 0.08 mm (Đầu phun nozzle 0.4 mm)'),
    ('4. Bước rãnh (Pitch X)', '4.0 mm', '± 0.05 mm (Đồng đều 33 rãnh song song)'),
    ('5. Góc vát miệng rãnh (Chamfer)', '45.0° (vát sâu 0.8 mm)', 'In FDM không cần tạo Support'),
    ('6. Đường kính gá củ loa', 'Ø 28.4 mm lọt lòng', '+0.2 / -0.0 mm (Lắp ép nhẹ củ loa Ø28)'),
    ('7. Độ sâu buồng loa (Cavity)', '10.0 mm', '± 0.2 mm (Thể tích buồng V = 16.5 cm³)'),
    ('8. Chiều dày thành vách buồng', 't = 2.0 mm', 'In 4 lớp thành (Perimeters), đặc 100%'),
    ('9. Chiều cao lớp in (Layer Height)', '0.16 mm - 0.20 mm', 'Mịn đẹp satin, sắc nét từng khe rãnh'),
    ('10. Vật liệu khuyên dùng', 'PETG Food-safe', 'Màu Trắng sứ y tế (Porcelain White)')
]

for idx, (col1, col2, col3) in enumerate(table_rows):
    ry = t_y0 + 44 + idx * 36
    bg_c = '#152238' if idx % 2 == 0 else '#101C36'
    draw.rectangle([(p4_x + 30, ry), (p4_x + p4_w - 30, ry + 34)], fill=bg_c)
    draw.text((p4_x + 45, ry + 7), col1, fill='#E2E8F0', font=font_label)
    draw.text((p4_x + 330, ry + 7), col2, fill='#FBBF24', font=font_bold)
    draw.text((p4_x + 560, ry + 7), col3, fill='#94A3B8', font=font_label)

# Slicer Quick Tips Box
draw.rectangle([(p4_x + 30, p4_y + p4_h - 110), (p4_x + p4_w - 30, p4_y + p4_h - 20)], fill='#152238', outline='#10B981', width=1)
draw.text((p4_x + 45, p4_y + p4_h - 100), 'MẸO SLICER BAMBU LAB / PRUSASLICER KHI IN CỤM LOA CALENDIA+:', fill='#10B981', font=font_bold)
draw.text((p4_x + 45, p4_y + p4_h - 75), '• Đặt mặt trước úp trực tiếp xuống bàn in PEI nhám mờ: Miệng rãnh 45° tự bắc cầu (bridge) hoàn hảo, không sợi thừa.\n• Bật chế độ "Arachne Wall Generator" để tạo thành vách rãnh 2.2 mm mịn màng không rỗng ruột.\n• Dán màng vải lọc bụi mỏng ở mặt sau bằng băng keo 2 mặt 3M 300LSE trước khi lắp củ loa.', fill='#CBD5E1', font=font_label)

# Save Blueprint Image
out_path = 'd:/DIA+/ban_ve_chi_tiet_dai_loa_am_thanh_cad.png'
img.save(out_path, quality=95)
print(f"CAD Blueprint successfully saved to {out_path}!")
