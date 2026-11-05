import os
from PIL import Image, ImageDraw, ImageFont

W, H = 2200, 1400
img = Image.new('RGB', (W, H), color='#0A0F1D') # Dark CAD theme
draw = ImageDraw.Draw(img)

# Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 40)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 24)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 21)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 21)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)

# Grid lines
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#151E33', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#151E33', width=1)

# Header Card
draw.rectangle([(50, 30), (W-50, 130)], fill='#151E33', outline='#38BDF8', width=2)
draw.text((80, 42), 'BẢN VẼ BÓC TÁCH KỸ THUẬT: VỊ TRÍ GẮN CHIP ESP32-C3 VÀ BO MẠCH CALENDIA+', fill='#FFFFFF', font=font_title)
draw.text((80, 92), 'Bóc tách 3 tầng cơ khí • Định vị 4 trụ ốc M2 • Cổng sạc Type-C • Bố trí RTC, DAC, Loa và Dải LED 28 mắt', fill='#94A3B8', font=font_subtitle)

# Panel 1: SƠ ĐỒ BÓC TÁCH 3 TẦNG (EXPLODED ARCHITECTURE)
p1_w = 980
draw.rectangle([(50, 150), (50+p1_w, 820)], fill='#151E33', outline='#3B82F6', width=2)
draw.rectangle([(50, 150), (50+p1_w, 205)], fill='#1D4ED8')
draw.text((70, 162), '1. SƠ ĐỒ BÓC TÁCH 3 TẦNG CƠ KHÍ VÀ KHÔNG GIAN BÊN TRONG', fill='#FFFFFF', font=font_heading)

tx1 = 75
draw.text((tx1, 225), '• TẦNG 1: MẶT TRƯỚC VÀ 28 NGĂN THUỐC (PART 1 + 2)', fill='#93C5FD', font=font_bold)
draw.text((tx1+20, 255), '- Kích thước: 230 mm × 175 mm × dày 16 mm', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 285), '- Mặt vát chân đế phía dưới: Gắn DUY NHẤT 1 logo D+ và chữ \"CalenDIA+\"', fill='#38BDF8', font=font_bold)
draw.text((tx1+20, 315), '- 28 Ngăn kéo phẳng lì tích hợp rãnh tim Push-to-Open', fill='#CBD5E1', font=font_label)

draw.text((tx1, 365), '• TẦNG 2: KHUNG ĐỊNH VỊ LED VÀ MÀN HÌNH (PART 3 + 4 + 5)', fill='#93C5FD', font=font_bold)
draw.text((tx1+20, 395), '- Màn hình OLED 0.96\"/1.3\" I2C đặt tại Bezel đỉnh máy', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 425), '- Khay 28 mắt LED WS2812B có buồng quang học cách sáng 100%', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 455), '- 28 Lò xo nén Inox 304 Ø4 × 25mm đẩy khay búng mở', fill='#CBD5E1', font=font_label)

draw.text((tx1, 505), '• TẦNG 3: VỎ ỐP LƯNG VÀ KHOANG ĐIỆN TỬ (PART 6)', fill='#93C5FD', font=font_bold)
draw.text((tx1+20, 535), '- Kích thước: 228 mm × 173 mm × sâu 28 mm (khoang rộng rãi)', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 565), '- Nơi gắn trực tiếp vi điều khiển ESP32-C3-DevKitM-1', fill='#4ADE80', font=font_bold)
draw.text((tx1+20, 595), '- Tích hợp buồng cộng hưởng âm thanh cho loa mini 8Ω 2W', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 625), '- Khe luồn cáp USB Type-C cắm sạc nguồn 5V 2A', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 655), '- Nắp bảo trì Part 8 mở nhanh để thay pin RTC DS3231', fill='#CBD5E1', font=font_label)

# Draw miniature exploded schematic inside Panel 1
draw.rectangle([(tx1+20, 695), (tx1+300, 795)], fill='#0F172A', outline='#38BDF8', width=1)
draw.text((tx1+35, 715), '[ TẦNG 1: MẶT TRƯỚC ]', fill='#38BDF8', font=font_bold)
draw.text((tx1+35, 745), 'Logo D+ & CalenDIA+ ở chân đế', fill='#94A3B8', font=font_label)

draw.rectangle([(tx1+330, 695), (tx1+610, 795)], fill='#0F172A', outline='#FBBF24', width=1)
draw.text((tx1+345, 715), '[ TẦNG 2: LED & KHUNG ]', fill='#FBBF24', font=font_bold)
draw.text((tx1+345, 745), '28 Mắt LED + OLED 0.96\"', fill='#94A3B8', font=font_label)

draw.rectangle([(tx1+640, 695), (tx1+920, 795)], fill='#0F172A', outline='#4ADE80', width=1)
draw.text((tx1+655, 715), '[ TẦNG 3: ESP32 & PIN ]', fill='#4ADE80', font=font_bold)
draw.text((tx1+655, 745), 'ESP32 + RTC + DAC + Loa', fill='#94A3B8', font=font_label)


# Panel 2: VỊ TRÍ GẮN CHIP ESP32-C3 CHI TIẾT
p2_x = 50 + p1_w + 40
p2_w = W - p2_x - 50
draw.rectangle([(p2_x, 150), (p2_x+p2_w, 820)], fill='#151E33', outline='#10B981', width=2)
draw.rectangle([(p2_x, 150), (p2_x+p2_w, 205)], fill='#047857')
draw.text((p2_x+20, 162), '2. CHI TIẾT ĐỊNH VỊ GÁ CHIP ESP32-C3 TRÊN VỎ LƯNG (PART 6)', fill='#FFFFFF', font=font_heading)

# Draw CAD Layout of the Rear Chassis Inside
rx, ry = p2_x + 30, 230
rw, rh = p2_w - 60, 560
draw.rectangle([(rx, ry), (rx+rw, ry+rh)], fill='#0D1929', outline='#334155', width=2)

# Top Bar / Wall of Chassis
draw.text((rx+20, ry+15), 'KHOANG CHỨA LINH KIỆN ĐIỆN TỬ MẶT TRONG VỎ LƯNG (PART 6)', fill='#94A3B8', font=font_bold)

# 1. ESP32-C3 Board footprint
ex, ey = rx + 30, ry + 60
ew, eh = 270, 150
draw.rectangle([(ex, ey), (ex+ew, ey+eh)], fill='#1E293B', outline='#38BDF8', width=2)
draw.text((ex+20, ey+15), 'ESP32-C3-DevKitM-1', fill='#38BDF8', font=font_bold)
draw.text((ex+20, ey+45), 'Kích thước bo: 50 × 26 mm', fill='#CBD5E1', font=font_label)
draw.text((ex+20, ey+75), 'Ăng-ten Wi-Fi PCB hướng đỉnh', fill='#4ADE80', font=font_label)

# 4 Screw Bosses M2 on ESP32
for bx, by in [(ex+15, ey+15), (ex+ew-15, ey+15), (ex+15, ey+eh-15), (ex+ew-15, ey+eh-15)]:
    draw.ellipse([(bx-8, by-8), (bx+8, by+8)], fill='#D97706', outline='#FBBF24', width=2)
    draw.ellipse([(bx-3, by-3), (bx+3, by+3)], fill='#0F172A')

draw.text((ex+ew+15, ey+15), '◄ 4 Trụ ren M2 (Bosses)', fill='#FBBF24', font=font_bold)
draw.text((ex+ew+15, ey+45), 'Tâm: 44 × 20 mm', fill='#CBD5E1', font=font_label)
draw.text((ex+ew+15, ey+75), 'Đường kính: Ø 4.2 mm', fill='#CBD5E1', font=font_label)
draw.text((ex+ew+15, ey+105), 'Cấy tán nhiệt đồng', fill='#CBD5E1', font=font_label)

# USB Type-C Port cutout
cx, cy = ex + ew//2 - 30, ry
draw.rectangle([(cx, cy-5), (cx+60, cy+15)], fill='#F43F5E')
draw.text((cx-90, cy-25), 'Cổng USB-C (Khoét lỗ 10 × 4.5 mm) ▲', fill='#F43F5E', font=font_bold)

# 2. Module RTC DS3231
rtc_x, rtc_y = ex, ey + eh + 50
rtc_w, rtc_h = 240, 110
draw.rectangle([(rtc_x, rtc_y), (rtc_x+rtc_w, rtc_y+rtc_h)], fill='#1E293B', outline='#A855F7', width=2)
draw.text((rtc_x+15, rtc_y+15), 'Module RTC DS3231', fill='#C084FC', font=font_bold)
draw.text((rtc_x+15, rtc_y+45), 'Kèm pin cúc áo CR2032', fill='#CBD5E1', font=font_label)
draw.text((rtc_x+15, rtc_y+75), 'Giao tiếp I2C chung OLED', fill='#CBD5E1', font=font_label)

# 3. Module DAC MAX98357A
dac_x, dac_y = rtc_x + rtc_w + 30, rtc_y
dac_w, dac_h = 200, 110
draw.rectangle([(dac_x, dac_y), (dac_x+dac_w, dac_y+dac_h)], fill='#1E293B', outline='#EC4899', width=2)
draw.text((dac_x+15, dac_y+15), 'DAC MAX98357A', fill='#F472B6', font=font_bold)
draw.text((dac_x+15, dac_y+45), 'Mạch I2S Class-D', fill='#CBD5E1', font=font_label)
draw.text((dac_x+15, dac_y+75), 'Xuất âm thanh ra loa', fill='#CBD5E1', font=font_label)

# 4. Buồng loa Mini 8Ω
spk_x, spk_y = rx + rw - 190, ey + 40
draw.ellipse([(spk_x, spk_y), (spk_x+150, spk_y+150)], fill='#1E293B', outline='#F59E0B', width=3)
draw.ellipse([(spk_x+40, spk_y+40), (spk_x+110, spk_y+110)], fill='#0F172A', outline='#F59E0B', width=2)
draw.text((spk_x+15, spk_y+165), 'Hộp cộng hưởng loa', fill='#FBBF24', font=font_bold)
draw.text((spk_x-10, spk_y+195), 'Loa mini 8Ω 1W-2W (Ø 28mm)', fill='#CBD5E1', font=font_label)


# Panel 3: BẢNG TỌA ĐỘ VÀ HƯỚNG DẪN BÀN GIAO THỢ CAD
draw.rectangle([(50, 850), (W-50, 1350)], fill='#151E33', outline='#6366F1', width=2)
draw.rectangle([(50, 850), (W-50, 905)], fill='#4F46E5')
draw.text((70, 862), '3. BẢNG THÔNG SỐ CƠ KHÍ ĐỊNH VỊ CÁC LINH KIỆN TRONG KHOANG ĐIỆN TỬ', fill='#FFFFFF', font=font_heading)

ty = 925
draw.rectangle([(70, ty), (W-70, ty+45)], fill='#334155')
draw.text((90, ty+10), 'LINH KIỆN', fill='#F8FAFC', font=font_bold)
draw.text((360, ty+10), 'VỊ TRÍ BỐ TRÍ TRÊN PART 6', fill='#F8FAFC', font=font_bold)
draw.text((820, ty+10), 'QUY CÁCH GÁ ĐẶT CƠ KHÍ', fill='#F8FAFC', font=font_bold)
draw.text((1300, ty+10), 'KẾT NỐI ĐIỆN / CỔNG NGOÀI', fill='#F8FAFC', font=font_bold)
draw.text((1720, ty+10), 'ƯU ĐIỂM THIẾT KẾ', fill='#F8FAFC', font=font_bold)

# Row 1: ESP32-C3
r1_y = ty + 55
draw.rectangle([(70, r1_y), (W-70, r1_y+45)], fill='#1E293B')
draw.text((90, r1_y+10), 'ESP32-C3 DevKit', fill='#38BDF8', font=font_bold)
draw.text((360, r1_y+10), 'Khoang trên bên trái Part 6', fill='#CBD5E1', font=font_label)
draw.text((820, r1_y+10), '4 Trụ ốc M2 (tâm 44 × 20 mm)', fill='#FBBF24', font=font_bold)
draw.text((1300, r1_y+10), 'Cổng USB-C thò ra mép vỏ', fill='#F43F5E', font=font_bold)
draw.text((1720, r1_y+10), 'Sóng Wi-Fi mạnh, gần OLED', fill='#4ADE80', font=font_label)

# Row 2: RTC DS3231
r2_y = r1_y + 50
draw.rectangle([(70, r2_y), (W-70, r2_y+45)], fill='#0F172A')
draw.text((90, r2_y+10), 'RTC DS3231', fill='#C084FC', font=font_bold)
draw.text((360, r2_y+10), 'Ngay bên dưới ESP32-C3', fill='#CBD5E1', font=font_label)
draw.text((820, r2_y+10), '2 Vấu kẹp ngàm snap-fit', fill='#CBD5E1', font=font_label)
draw.text((1300, r2_y+10), 'Chung bus I2C với OLED (4, 5)', fill='#CBD5E1', font=font_label)
draw.text((1720, r2_y+10), 'Dễ thay pin cúc CR2032', fill='#4ADE80', font=font_label)

# Row 3: MAX98357A & Loa
r3_y = r2_y + 50
draw.rectangle([(70, r3_y), (W-70, r3_y+45)], fill='#1E293B')
draw.text((90, r3_y+10), 'DAC + Loa 8Ω', fill='#F472B6', font=font_bold)
draw.text((360, r3_y+10), 'Góc phải phía sau Part 6', fill='#CBD5E1', font=font_label)
draw.text((820, r3_y+10), 'Buồng cộng hưởng Ø 30 × 8 mm', fill='#FBBF24', font=font_bold)
draw.text((1300, r3_y+10), 'Dây I2S (GPIO 6, 7, 10)', fill='#CBD5E1', font=font_label)
draw.text((1720, r3_y+10), 'Âm thanh to rõ, không rè', fill='#4ADE80', font=font_label)

# Row 4: Logo & Chân đế
r4_y = r3_y + 50
draw.rectangle([(70, r4_y), (W-70, r4_y+45)], fill='#0F172A')
draw.text((90, r4_y+10), 'Logo DIAPLUS', fill='#38BDF8', font=font_bold)
draw.text((360, r4_y+10), 'Mặt vát chân đế phía dưới', fill='#38BDF8', font=font_bold)
draw.text((820, r4_y+10), 'Dập nổi 0.6 mm hoặc in màu', fill='#CBD5E1', font=font_label)
draw.text((1300, r4_y+10), 'Kèm chữ \"CalenDIA+\" duy nhất', fill='#FBBF24', font=font_bold)
draw.text((1720, r4_y+10), 'Mặt màn hình sạch sẽ 100%', fill='#4ADE80', font=font_label)

# Footer Note
fy = r4_y + 60
draw.text((90, fy), 'LƯU Ý QUAN TRỌNG KHI BÀN GIAO CHO THỢ CAD / IN 3D:', fill='#F43F5E', font=font_bold)
draw.text((90, fy+30), '1. Trụ bắt ốc M2 của ESP32: Lỗ in đường kính Ø 1.8 mm nếu dùng vít tự ren M2; hoặc in lỗ Ø 3.2 mm x sâu 4.5 mm nếu dùng tán nhiệt đồng M2.', fill='#CBD5E1', font=font_label)
draw.text((90, fy+60), '2. Khe Type-C: Vát góc mép ngoài 45° rộng 1.0 mm để đầu cắm cáp sạc điện thoại Type-C cắm ngập khít hoàn toàn không bị cấn vỏ.', fill='#CBD5E1', font=font_label)

img.save('d:/DIA+/ban_ve_boc_tach_vi_tri_esp32_chi_tiet.png', 'PNG')
print('SUCCESS: Generated ban_ve_boc_tach_vi_tri_esp32_chi_tiet.png')
