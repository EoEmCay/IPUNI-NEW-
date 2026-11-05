import os
from PIL import Image, ImageDraw, ImageFont

W, H = 2200, 1400
img = Image.new('RGB', (W, H), color='#0B132B') # Dark CAD theme
draw = ImageDraw.Draw(img)

# Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 38)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 23)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 26)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)

# Grid lines
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#152238', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#152238', width=1)

# Header Card
draw.rectangle([(50, 30), (W-50, 130)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 42), 'BẢN VẼ TỐI ƯU HÓA THIẾT KẾ DỰA TRÊN DÒNG TIỀN BOM (CALENDIA+ DFM EDITION)', fill='#FFFFFF', font=font_title)
draw.text((80, 92), 'Cắt giảm chi phí BOM • Khung tổ ong 1 chi tiết • 28 ngăn kéo PP trong mờ • Giá vốn xuất xưởng 146k - 178k', fill='#94A3B8', font=font_subtitle)

# Panel 1: BÓC TÁCH CƠ KHÍ ĐÚC PHUN TỐI GIẢN (TỔNG ~61K)
p1_w = (W - 140) // 2
draw.rectangle([(50, 150), (50+p1_w, 820)], fill='#152238', outline='#10B981', width=2)
draw.rectangle([(50, 150), (50+p1_w, 205)], fill='#047857')
draw.text((70, 162), '1. TỐI ƯU CƠ KHÍ ĐÚC PHUN (GIẢM TỪ 8 PART -> 4 CỤM ĐÚC ~61K)', fill='#FFFFFF', font=font_heading)

tx1 = 75
draw.text((tx1, 225), 'A. 28 NGĂN KÉO NHỰA PP TRONG MỜ (~20.000 đ)', fill='#6EE7B7', font=font_bold)
draw.text((tx1+20, 255), '- Vật liệu: Polypropylene (PP) nguyên sinh tiếp xúc thuốc an toàn tuyệt đối', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 285), '- Tính năng quang học: Nhựa trong mờ (Translucent) tự làm thấu kính tán sáng', fill='#38BDF8', font=font_bold)
draw.text((tx1+20, 315), '- Tay nắm: Hốc lõm công thái học dập liền khối (kéo tay êm, KHÔNG CẦN LÒ XO)', fill='#CBD5E1', font=font_label)

draw.text((tx1, 365), 'B. KHUNG TỔ ONG 1 CHI TIẾT ĐÚC LIỀN (~12.000 đ)', fill='#6EE7B7', font=font_bold)
draw.text((tx1+20, 395), '- Đột phá cơ khí: Đúc liền 1 khối ma trận 7 cột × 4 hàng (THAY CHO 28 VỎ LẺ)', fill='#FBBF24', font=font_bold)
draw.text((tx1+20, 425), '- Tích hợp sẵn ray dẫn hướng âm và vách chắn sáng quang học giữa các ô', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 455), '- Giảm 90% thời gian lắp ráp cơ khí (công nhân chỉ việc thả vào vỏ)', fill='#CBD5E1', font=font_label)

draw.text((tx1, 505), 'C. VỎ NGOÀI: MẶT TRƯỚC + NẮP LƯNG + CHÂN ĐỨNG (~25.000 đ)', fill='#6EE7B7', font=font_bold)
draw.text((tx1+20, 535), '- Chân đứng đúc liền khối với nắp lưng, góc nghiêng 75° cố định vững chãi', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 565), '- Mặt vát chân đế: In DUY NHẤT 1 logo D+ và tên \"CalenDIA+\" nổi bật', fill='#38BDF8', font=font_bold)
draw.text((tx1+20, 595), '- Liên kết ngàm Snap-fit kết hợp 4 vít cố định (thay vì 12 vít phức tạp)', fill='#CBD5E1', font=font_label)

draw.text((tx1, 645), 'D. CỬA SỔ HIỂN THỊ + VÁCH CHẮN SÁNG (~4.000 đ)', fill='#6EE7B7', font=font_bold)
draw.text((tx1+20, 675), '- Tấm Mica đen khói (Smoked Acrylic) bảo vệ màn hình hoặc dải đèn báo', fill='#CBD5E1', font=font_label)
draw.text((tx1+20, 705), '- Vách chắn sáng PP đen ngăn lọt quang tuyệt đối giữa 28 ô', fill='#CBD5E1', font=font_label)

draw.rectangle([(tx1+20, 745), (tx1+p1_w-50, 800)], fill='#0F172A', outline='#10B981', width=1)
draw.text((tx1+40, 760), 'TỔNG CHI PHÍ CƠ KHÍ HÀNG LOẠT:  ~61.000 VNĐ / SẢN PHẨM', fill='#4ADE80', font=font_dim)


# Panel 2: TỐI ƯU HÓA LINH KIỆN ĐIỆN TỬ (CẮT GIẢM BOM)
p2_x = 50 + p1_w + 40
draw.rectangle([(p2_x, 150), (p2_x+p1_w, 820)], fill='#152238', outline='#3B82F6', width=2)
draw.rectangle([(p2_x, 150), (p2_x+p1_w, 205)], fill='#1D4ED8')
draw.text((p2_x+20, 162), '2. TỐI ƯU ĐIỆN TỬ: CẮT GIẢM ĐÚNG CHỖ, GIỮ NGUYÊN GIÁ TRỊ', fill='#FFFFFF', font=font_heading)

tx2 = p2_x + 25
draw.text((tx2, 225), 'A. BỎ MODULE RTC DS3231 CỒNG KỀNH (TIẾT KIỆM ~20.000 đ)', fill='#93C5FD', font=font_bold)
draw.text((tx2+20, 255), '- Chip ESP32-C3 có Wi-Fi: Tự động lấy giờ Internet NTP (GMT+7)', fill='#4ADE80', font=font_label)
draw.text((tx2+20, 285), '- Khi không có Wi-Fi: Đồng bộ giờ chuẩn trực tiếp từ Smartphone qua BLE', fill='#CBD5E1', font=font_label)
draw.text((tx2+20, 315), '- Bỏ hoàn toàn pin cúc áo CR2032 và module rời, không lo hết pin đồng hồ', fill='#CBD5E1', font=font_label)

draw.text((tx2, 365), 'B. BẢN CƠ BẢN: CẮT GIẢM LOA VÀ DAC (CHÍNH SÁCH ZERO-NOISE)', fill='#93C5FD', font=font_bold)
draw.text((tx2+20, 395), '- Bỏ mạch DAC MAX98357A và Loa trên máy (tiết kiệm ~45.000 đ)', fill='#F43F5E', font=font_bold)
draw.text((tx2+20, 425), '- Chuông báo âm thanh và giọng nói phát qua APP ĐIỆN THOẠI (lịch sự, riêng tư)', fill='#FBBF24', font=font_label)
draw.text((tx2+20, 455), '- Trên hộp: Đèn LED cữ thuốc sáng quầng màu ấm nhịp thở + OLED hiển thị', fill='#38BDF8', font=font_label)

draw.text((tx2, 505), 'C. DẢI LED WS2812B NGUYÊN BẢN (KHÔNG CẮT HÀN 28 MẮT LẺ)', fill='#93C5FD', font=font_bold)
draw.text((tx2+20, 535), '- Dùng dải LED dán FPC linh hoạt dán thẳng sau lưng khung tổ ong', fill='#CBD5E1', font=font_label)
draw.text((tx2+20, 565), '- Giảm 28 mối hàn thủ công, công nhân chỉ mất 30 giây để gắn LED', fill='#4ADE80', font=font_label)
draw.text((tx2+20, 595), '- Điều khiển 28 mắt độc lập chỉ bằng DUY NHẤT 1 chân GPIO 8', fill='#CBD5E1', font=font_label)

draw.text((tx2, 645), 'D. NGUỒN CẤP TYPE-C TRỰC TIẾP 5V', fill='#93C5FD', font=font_bold)
draw.text((tx2+20, 675), '- Cổng sạc Type-C tích hợp ngay trên bo mạch ESP32-C3', fill='#CBD5E1', font=font_label)
draw.text((tx2+20, 705), '- Dùng chung củ sạc điện thoại có sẵn của người dùng (bản cơ bản)', fill='#CBD5E1', font=font_label)

draw.rectangle([(tx2+20, 745), (tx2+p1_w-50, 800)], fill='#0F172A', outline='#3B82F6', width=1)
draw.text((tx2+40, 760), 'TỔNG ĐIỆN TỬ BẢN CƠ BẢN:  ~50.000 VNĐ / SẢN PHẨM', fill='#38BDF8', font=font_dim)


# Panel 3: BẢNG GIÁ VỐN 3 TẦNG & ĐỊNH GIÁ BÁN LẺ SHOPEE (COGS & PRICING TIERS)
draw.rectangle([(50, 850), (W-50, 1350)], fill='#152238', outline='#F59E0B', width=2)
draw.rectangle([(50, 850), (W-50, 905)], fill='#D97706')
draw.text((70, 862), '3. BẢNG BÓC TÁCH GIÁ VỐN (COGS) 3 PHÂN KHÚC & BÀI TOÁN KINH DOANH SHOPEE', fill='#FFFFFF', font=font_heading)

ty = 925
draw.rectangle([(70, ty), (W-70, ty+45)], fill='#334155')
draw.text((90, ty+10), 'KHOẢN MỤC CHI PHÍ', fill='#F8FAFC', font=font_bold)
draw.text((520, ty+10), 'BẢN CƠ BẢN (ESSENTIAL)', fill='#F8FAFC', font=font_bold)
draw.text((1050, ty+10), 'BẢN + GIỌNG NÓI, MÀN SỐ', fill='#F8FAFC', font=font_bold)
draw.text((1600, ty+10), 'BẢN + CỦ SẠC 5V (FULL BOX)', fill='#F8FAFC', font=font_bold)

# Row 1: Linh kiện + Cơ khí + Bao bì + Cáp
r1_y = ty + 55
draw.rectangle([(70, r1_y), (W-70, r1_y+40)], fill='#1E293B')
draw.text((90, r1_y+10), 'Điện tử + Cơ khí + Bao bì (8k) + Cáp (5k)', fill='#CBD5E1', font=font_label)
draw.text((520, r1_y+10), '119.000 đ', fill='#F8FAFC', font=font_bold)
draw.text((1050, r1_y+10), '136.000 đ', fill='#F8FAFC', font=font_bold)
draw.text((1600, r1_y+10), '147.000 đ', fill='#F8FAFC', font=font_bold)

# Row 2: Nhân công lắp ráp
r2_y = r1_y + 45
draw.rectangle([(70, r2_y), (W-70, r2_y+40)], fill='#0F172A')
draw.text((90, r2_y+10), 'Nhân công lắp ráp (~10 phút)', fill='#CBD5E1', font=font_label)
draw.text((520, r2_y+10), '10.000 đ', fill='#CBD5E1', font=font_label)
draw.text((1050, r2_y+10), '10.000 đ', fill='#CBD5E1', font=font_label)
draw.text((1600, r2_y+10), '10.000 đ', fill='#CBD5E1', font=font_label)

# Row 3: Vận chuyển / Đại lý (10%)
r3_y = r2_y + 45
draw.rectangle([(70, r3_y), (W-70, r3_y+40)], fill='#1E293B')
draw.text((90, r3_y+10), 'Vận chuyển / Đại lý phân phối (10%)', fill='#CBD5E1', font=font_label)
draw.text((520, r3_y+10), '12.000 đ', fill='#CBD5E1', font=font_label)
draw.text((1050, r3_y+10), '14.000 đ', fill='#CBD5E1', font=font_label)
draw.text((1600, r3_y+10), '15.000 đ', fill='#CBD5E1', font=font_label)

# Row 4: Hao hụt (4%)
r4_y = r3_y + 45
draw.rectangle([(70, r4_y), (W-70, r4_y+40)], fill='#0F172A')
draw.text((90, r4_y+10), 'Hao hụt sản xuất / Bảo hành (4%)', fill='#CBD5E1', font=font_label)
draw.text((520, r4_y+10), '5.000 đ', fill='#CBD5E1', font=font_label)
draw.text((1050, r4_y+10), '6.000 đ', fill='#CBD5E1', font=font_label)
draw.text((1600, r4_y+10), '6.000 đ', fill='#CBD5E1', font=font_label)

# Row 5: TỔNG GIÁ VỐN
r5_y = r4_y + 45
draw.rectangle([(70, r5_y), (W-70, r5_y+45)], fill='#047857')
draw.text((90, r5_y+10), 'TỔNG GIÁ VỐN XUẤT XƯỞNG (COGS)', fill='#FFFFFF', font=font_bold)
draw.text((520, r5_y+10), '~146.000 VNĐ', fill='#FFFFFF', font=font_dim)
draw.text((1050, r5_y+10), '~165.000 VNĐ', fill='#FFFFFF', font=font_dim)
draw.text((1600, r5_y+10), '~178.000 VNĐ', fill='#FFFFFF', font=font_dim)

# Row 6: ĐỊNH GIÁ BÁN LẺ SHOPEE & LỢI NHUẬN
r6_y = r5_y + 55
draw.rectangle([(70, r6_y), (W-70, r6_y+45)], fill='#1E3A8A')
draw.text((90, r6_y+10), 'GIÁ BÁN LẺ ĐỀ XUẤT TRÊN SHOPEE', fill='#93C5FD', font=font_bold)
draw.text((520, r6_y+10), '299.000 VNĐ (Lãi 51%)', fill='#38BDF8', font=font_bold)
draw.text((1050, r6_y+10), '349.000 VNĐ (Lãi 53%)', fill='#38BDF8', font=font_bold)
draw.text((1600, r6_y+10), '399.000 VNĐ (Lãi 55%)', fill='#38BDF8', font=font_bold)

img.save('d:/DIA+/ban_ve_toi_uu_bom_calen_dia.png', 'PNG')
print('SUCCESS: Generated ban_ve_toi_uu_bom_calen_dia.png')
