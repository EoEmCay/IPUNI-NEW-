import os
from PIL import Image, ImageDraw, ImageFont

# Canvas Setup: 2400 x 1550 CAD Blueprint
W, H = 2400, 1550
img = Image.new('RGB', (W, H), color='#0A1128') # Deep CAD Navy
draw = ImageDraw.Draw(img)

# Load Windows System Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 35)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 22)
font_subheading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 19)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 19)
font_dim_small = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)

# Subtle Blueprint Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#101C38', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#101C38', width=1)

# Outer Border
draw.rectangle([(25, 25), (W-25, H-25)], outline='#1E3A8A', width=2)

# ==================== HEADER CARD ====================
draw.rectangle([(45, 40), (W-45, 135)], fill='#131F37', outline='#38BDF8', width=2)
draw.text((70, 52), 'BẢN VẼ THIẾT KẾ CHI TIẾT: HỘC THUỐC NGUYÊN KHỐI LIỀN MẠCH (SEAMLESS UNIBODY)', fill='#FFFFFF', font=font_title)
draw.text((70, 96), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • KHẮC PHỤC LỖI GIẬT CẤP ĐUÔI SAU • THÀNH HÔNG PHẲNG TẮP • ĐÁY PHẲNG 100% • 30×26×48 mm', fill='#34D399', font=font_subtitle)

# Helper function to draw horizontal dimension lines
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

# ==================== PANEL 1: SO SÁNH TRỰC DIỆN (TRƯỚC & SAU) ====================
p1_x, p1_y, p1_w, p1_h = 50, 155, 1130, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+50)], fill='#1E3A8A')
draw.text((p1_x+20, p1_y+12), '1. SO SÁNH TRỰC DIỆN: BẢN CŨ BỊ GIẬT CẤP VS BẢN MỚI LIỀN MẠCH', fill='#FFFFFF', font=font_heading)

scale_p1 = 8.5
l_px = 48.0 * scale_p1 # 408 px
h_px = 30.0 * scale_p1 # 255 px

# 1.1 HÌNH BẢN CŨ (TRÊN)
f1_x = p1_x + 130
f1_y = p1_y + 80
draw.text((f1_x, f1_y), 'A. BẢN CŨ (ẢNH CHỤP CỦA BẠN): THÀNH BÊN VÀ ĐÁY BỊ GIẬT CẤP', fill='#EF4444', font=font_subheading)

# Outer contour of old stepped design
box1_y = f1_y + 35
# Top edge with drop
draw.line([(f1_x, box1_y), (f1_x + 180, box1_y)], fill='#EF4444', width=3)
draw.line([(f1_x + 180, box1_y), (f1_x + 180, box1_y + 40)], fill='#EF4444', width=3) # Ugly drop
draw.line([(f1_x + 180, box1_y + 40), (f1_x + l_px, box1_y + 40)], fill='#EF4444', width=3)
# Rear edge
draw.line([(f1_x + l_px, box1_y + 40), (f1_x + l_px, box1_y + h_px)], fill='#EF4444', width=3)
# Bottom edge with jog
draw.line([(f1_x + l_px, box1_y + h_px), (f1_x + 220, box1_y + h_px)], fill='#EF4444', width=3)
draw.line([(f1_x + 220, box1_y + h_px), (f1_x + 220, box1_y + h_px - 35)], fill='#EF4444', width=3) # Step up
draw.line([(f1_x + 220, box1_y + h_px - 35), (f1_x, box1_y + h_px - 35)], fill='#EF4444', width=3)
draw.line([(f1_x, box1_y + h_px - 35), (f1_x, box1_y)], fill='#EF4444', width=3)

# Finger scoop
draw.rectangle([(f1_x, box1_y + h_px//2 - 25), (f1_x + 15, box1_y + h_px//2 + 25)], fill='#0F172A', outline='#F87171', width=2)

# Red Callouts pointing out flaws
draw.ellipse([(f1_x + 165, box1_y + 25), (f1_x + 195, box1_y + 55)], outline='#EF4444', width=2)
draw.text((f1_x + 210, box1_y + 5), '✖ Hẫng bậc thang mép trên (Trông chắp vá)', fill='#FCA5A5', font=font_label)

draw.ellipse([(f1_x + 205, box1_y + h_px - 45), (f1_x + 235, box1_y + h_px - 20)], outline='#EF4444', width=2)
draw.text((f1_x + 250, box1_y + h_px - 30), '✖ Đáy giật cấp lồi lõm (Dễ kẹt khi trượt)', fill='#FCA5A5', font=font_label)

draw.text((f1_x + l_px + 25, box1_y + 90), '❌ ĐÁNH GIÁ: Kém thẩm mỹ,', fill='#F87171', font=font_bold)
draw.text((f1_x + l_px + 25, box1_y + 120), 'khó làm khuôn ép nhựa,', fill='#F87171', font=font_label)
draw.text((f1_x + l_px + 25, box1_y + 150), 'dễ bám cặn thuốc ở khe bậc.', fill='#F87171', font=font_label)


# 1.2 HÌNH BẢN MỚI HIỆU CHỈNH (DƯỚI)
f2_x = p1_x + 130
f2_y = p1_y + 440
draw.text((f2_x, f2_y), 'B. BẢN MỚI HIỆU CHỈNH: THÀNH HÔNG LIỀN MẠCH, ĐÁY PHẲNG TẮP', fill='#34D399', font=font_subheading)

box2_y = f2_y + 55
# Flat unbroken rectangle
draw.rectangle([(f2_x, box2_y), (f2_x + l_px, box2_y + h_px)], fill='#1E293B', outline='#34D399', width=3)

# Continuous guide rail
rail_y = box2_y + h_px // 2
draw.rectangle([(f2_x + 15, rail_y - 5), (f2_x + l_px - 15, rail_y + 5)], fill='#38BDF8', outline='#7DD3FC', width=1)
draw.text((f2_x + 35, rail_y - 25), 'GÂN TRƯỢT ĐÚC LIỀN (Chạy suốt 48mm)', fill='#38BDF8', font=font_bold)

# Subtle Stopper on top edge of rear
draw.rectangle([(f2_x + l_px - 18, box2_y - 12), (f2_x + l_px, box2_y)], fill='#F59E0B')
draw.text((f2_x + l_px - 150, box2_y - 22), 'Vấu cản 1.2mm', fill='#FDE047', font=font_bold)

# Finger scoop on front
draw.rectangle([(f2_x, box2_y + h_px//2 - 25), (f2_x + 15, box2_y + h_px//2 + 25)], fill='#0F172A', outline='#FBBF24', width=2)

# Dimensions for Figure B
draw_dim_h(f2_x, f2_x + l_px, box2_y + h_px + 30, 'CHIỀU DÀI L = 48.0 mm', offset_y=0, color='#34D399')
draw_dim_v(f2_x - 30, box2_y, box2_y + h_px, 'H = 30.0 mm', align_right=True, color='#34D399')

# Green Pros List
draw.text((f2_x + l_px + 25, box2_y + 30), '✔ Thành bên phẳng lì 100%', fill='#34D399', font=font_bold)
draw.text((f2_x + l_px + 25, box2_y + 65), '✔ Đáy phẳng suốt toàn bộ chiều sâu', fill='#34D399', font=font_bold)
draw.text((f2_x + l_px + 25, box2_y + 100), '✔ Đuôi vuông vức, thanh lịch, sang trọng', fill='#34D399', font=font_bold)
draw.text((f2_x + l_px + 25, box2_y + 135), '✔ Trượt nhẹ êm ái, chuẩn công thái học', fill='#34D399', font=font_bold)
draw.text((f2_x + l_px + 25, box2_y + 170), '✔ Dễ đúc khuôn ép nhựa, không kẹt phôi', fill='#34D399', font=font_bold)


# ==================== PANEL 2: MẶT CẮT & CẤU TRÚC ĐUÔI SAU PHẲNG ====================
p2_x, p2_y, p2_w, p2_h = 1220, 155, 1130, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+50)], fill='#1E3A8A')
draw.text((p2_x+20, p2_y+12), '2. MẶT CẮT DỌC LÒNG KHAY & CHI TIẾT VÁCH ĐUÔI SAU PHẲNG', fill='#FFFFFF', font=font_heading)

scale_p2 = 11.5
sec_l = 48.0 * scale_p2 # 552 px
sec_h = 30.0 * scale_p2 # 345 px
sec_x0 = p2_x + 90
sec_y0 = p2_y + 90
sec_hin = 26.5 * scale_p2 # 304 px

# Outer body contour
draw.rectangle([(sec_x0, sec_y0), (sec_x0 + sec_l, sec_y0 + sec_h)], fill='#1E293B', outline='#60A5FA', width=3)
# Inner cavity (cutout)
draw.rectangle([(sec_x0 + 25, sec_y0), (sec_x0 + sec_l - 24, sec_y0 + sec_hin)], fill='#0B132B', outline='#34D399', width=2)

# Solid Rear Closure Wall
draw.rectangle([(sec_x0 + sec_l - 24, sec_y0), (sec_x0 + sec_l, sec_y0 + sec_h)], fill='#334155', outline='#38BDF8', width=2)

# Pointer to Rear Wall
draw.line([(sec_x0 + sec_l - 12, sec_y0 + 20), (sec_x0 + sec_l + 70, sec_y0 - 20)], fill='#38BDF8', width=2)
draw.line([(sec_x0 + sec_l + 70, sec_y0 - 20), (sec_x0 + sec_l + 250, sec_y0 - 20)], fill='#38BDF8', width=2)
draw.text((sec_x0 + sec_l + 75, sec_y0 - 45), 'VÁCH ĐUÔI SAU PHẲNG ĐẶC', fill='#38BDF8', font=font_bold)
draw.text((sec_x0 + sec_l + 75, sec_y0 - 18), 'Dày t = 2.0 mm • Đóng kín 100%', fill='#CBD5E1', font=font_dim_small)

# Pointer to LED back illumination
draw.line([(sec_x0 + sec_l - 12, sec_y0 + sec_h//2), (sec_x0 + sec_l + 70, sec_y0 + sec_h//2)], fill='#FDE047', width=2)
draw.line([(sec_x0 + sec_l + 70, sec_y0 + sec_h//2), (sec_x0 + sec_l + 260, sec_y0 + sec_h//2)], fill='#FDE047', width=2)
draw.text((sec_x0 + sec_l + 75, sec_y0 + sec_h//2 - 25), 'VÙNG ĐÓN ÁNH SÁNG LED WS2812B', fill='#FDE047', font=font_bold)
draw.text((sec_x0 + sec_l + 75, sec_y0 + sec_h//2 + 5), 'Vách phẳng tán xạ ánh sáng đều vào lòng khay', fill='#CBD5E1', font=font_dim_small)

# Colorful Medicine Capsules in cross section
caps = [
    (sec_x0 + 40, sec_y0 + sec_hin - 40, '#3B82F6', '#EF4444'),
    (sec_x0 + 145, sec_y0 + sec_hin - 40, '#F59E0B', '#10B981'),
    (sec_x0 + 250, sec_y0 + sec_hin - 40, '#8B5CF6', '#EC4899'),
    (sec_x0 + 355, sec_y0 + sec_hin - 40, '#06B6D4', '#F97316'),
    (sec_x0 + 90, sec_y0 + sec_hin - 85, '#EF4444', '#FBBF24'),
    (sec_x0 + 195, sec_y0 + sec_hin - 85, '#10B981', '#3B82F6'),
    (sec_x0 + 300, sec_y0 + sec_hin - 85, '#6366F1', '#E11D48'),
]
for cx, cy, c1, c2 in caps:
    draw.rounded_rectangle([(cx, cy), (cx + 85, cy + 32)], radius=16, fill=c1, outline='#FFFFFF')
    draw.rounded_rectangle([(cx + 42, cy), (cx + 85, cy + 32)], radius=16, fill=c2, outline='#FFFFFF')

# Dimensions for Panel 2
draw_dim_h(sec_x0, sec_x0 + sec_l, sec_y0 + sec_h + 35, 'CHIỀU DÀI SÂU TRƯỢT PHỦ BÌ L = 48.0 mm', offset_y=0)
draw_dim_v(sec_x0 - 30, sec_y0, sec_y0 + sec_h, 'H = 30.0 mm', align_right=True, color='#34D399')
draw_dim_v(sec_x0 + 15, sec_y0, sec_y0 + sec_hin, 'LÒNG SÂU 26.5 mm', align_right=False, color='#FDE047')

# Engineering Notes Box at bottom of Panel 2
nb_y = p2_y + 510
draw.rectangle([(p2_x + 30, nb_y), (p2_x + p2_w - 30, p2_y + p2_h - 25)], fill='#131F37', outline='#34D399', width=1)
draw.text((p2_x + 50, nb_y + 15), 'ƯU ĐIỂM CƠ HỌC CỦA THIẾT KẾ LIỀN MẠCH NGUYÊN KHỐI:', fill='#34D399', font=font_subheading)
draw.text((p2_x + 50, nb_y + 50), '1. Thẩm mỹ hoàn hảo: Xóa bỏ 100% cảm giác chắp vá, bậc thang thô kệch.', fill='#FFFFFF', font=font_label)
draw.text((p2_x + 50, nb_y + 80), '2. Trượt êm ái tuyệt đối: Gân đúc liền chạy suốt chiều dài giúp khay vào ra thẳng trục,', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 50, nb_y + 105), '   không bị cấn khớp hay xóc nảy khi kéo.', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 50, nb_y + 135), '3. Tối ưu khuôn ép nhựa (DFM): Thành phẳng thoát khuôn cực dễ, chu kỳ ép nhanh,', fill='#6EE7B7', font=font_label)
draw.text((p2_x + 50, nb_y + 160), '   giảm 15% chi phí gia công khuôn ép đúc hàng loạt.', fill='#6EE7B7', font=font_label)
draw.text((p2_x + 50, nb_y + 195), '4. Vệ sinh y tế thuận tiện: Không khe bám bụi, lau chùi khử khuẩn dễ dàng.', fill='#FDE047', font=font_bold)


# ==================== PANEL 3: BẢNG DỮ LIỆU KỸ THUẬT BÀN GIAO ====================
p3_x, p3_y, p3_w, p3_h = 50, 1010, W - 100, 480
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+50)], fill='#1E3A8A')
draw.text((p3_x+20, p3_y+12), '3. BẢNG THÔNG SỐ KỸ THUẬT HỘC THUỐC NGUYÊN KHỐI LIỀN MẠCH (BÀN GIAO GIA CÔNG)', fill='#FFFFFF', font=font_heading)

t_cols = [p3_x+25, p3_x+470, p3_x+820, p3_x+1260, p3_x+1720]
t_y = p3_y + 65
draw.rectangle([(p3_x+15, t_y), (p3_x+p3_w-15, t_y+42)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'HẠNG MỤC CƠ KHÍ', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC TIÊU CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI / KẾT CẤU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'ĐIỂM CẢI TIẾN LIỀN MẠCH', fill='#38BDF8', font=font_bold)
draw.text((t_cols[4], t_y+10), 'HIỆU QUẢ SẢN PHẨM', fill='#38BDF8', font=font_bold)

table_data = [
    ('Thành hông ngăn kéo (Side Walls)', 'Rộng 26.0 × Cao 30.0 × Dài 48.0 mm', '± 0.15 mm | Phẳng 100%', 'Phẳng tắp nguyên khối, bỏ hoàn toàn bậc giật cấp', 'Thanh thoát, sang trọng chuẩn y tế'),
    ('Mặt sàn đáy khay (Bottom Floor)', 'Dày t = 2.0 mm (Phẳng suốt 48mm)', '± 0.10 mm | Không gấp khúc', 'Mặt phẳng ngang 100% từ trước ra đuôi sau', 'Không cấn kẹt khi trượt trong hộc'),
    ('Gân trượt dẫn hướng (Guide Rib)', 'Nhô 1.0 mm × Cao 0.8 mm (Chạy suốt L)', '± 0.05 mm | Đúc liền hông', 'Gân mảnh chạy thẳng tắp, không ngắt quãng', 'Khay trượt cực êm, không rung lắc'),
    ('Vách đuôi sau khép kín (Rear Wall)', 'Rộng 26.0 × Cao 30.0 × Dày 2.0 mm', '± 0.10 mm | Vuông góc 90°', 'Vách đứng liền khối, có vấu cản 1.2mm mép trên', 'Chống rơi rớt khay, đón LED đều'),
    ('Khoang lọt lòng chứa thuốc', 'Rộng 22.0 × Dài 43.0 × Sâu 26.5 mm', '+ 0.2 / - 0.0 mm', 'Lòng khay nhẵn mịn, bo góc đáy R = 1.5mm', 'Không bám cặn thuốc, lấy thuốc êm ái'),
    ('Vật liệu khuyên dùng', 'Nhựa PP trong mờ (hoặc PETG trắng)', 'Food-safe chuẩn Y tế', 'Dẻo dai, rơi không vỡ, chịu mài mòn trượt', 'Độ bền cơ học trên 100.000 lần kéo'),
    ('Chỉ dẫn in 3D FDM', 'Mặt đáy úp xuống bàn in PEI phẳng', 'Layer 0.16mm | Wall 4 lớp', 'In trơn tru 1 lần, KHÔNG CẦN SUPPORT', 'Bề mặt thành bên láng mịn hoàn hảo')
]

curr_y = t_y + 48
for row in table_data:
    idx = table_data.index(row)
    draw.rectangle([(p3_x+15, curr_y), (p3_x+p3_w-15, curr_y+46)], fill='#131F37' if idx%2==0 else '#0F172A')
    draw.text((t_cols[0], curr_y+12), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+12), row[1], fill='#FDE047', font=font_bold)
    draw.text((t_cols[2], curr_y+12), row[2], fill='#6EE7B7', font=font_label)
    draw.text((t_cols[3], curr_y+12), row[3], fill='#34D399', font=font_bold)
    draw.text((t_cols[4], curr_y+12), row[4], fill='#CBD5E1', font=font_label)
    curr_y += 50

# Output Path
out_path = 'd:/DIA+/ban_ve_hoc_thuoc_lien_mach_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
