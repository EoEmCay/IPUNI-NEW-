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
draw.text((70, 52), 'PHƯƠNG ÁN THIẾT KẾ: HỘC THUỐC CHIA 2 NGĂN (DUAL-COMPARTMENT DRAWER)', fill='#FFFFFF', font=font_title)
draw.text((70, 96), 'DỰ ÁN: CalenDIA+ • TỐI ƯU CÔNG THÁI HỌC • PHÂN CHIA THUỐC TRƯỚC/SAU ĂN HOẶC SÁNG/TỐI • VÁCH NGĂN t = 1.2 mm', fill='#34D399', font=font_subtitle)

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

# ==================== PANEL 1: HÌNH CHIẾU BẰNG TỪ TRÊN XUỐNG (TOP-DOWN VIEW) ====================
p1_x, p1_y, p1_w, p1_h = 50, 155, 1130, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+50)], fill='#1E3A8A')
draw.text((p1_x+20, p1_y+12), '1. HÌNH CHIẾU BẰNG (TOP VIEW): BỐ CỤC 2 KHOANG CHIA TRƯỚC - SAU', fill='#FFFFFF', font=font_heading)

scale_top = 13.0
box_w = 26.0 * scale_top # 338 px
box_l = 48.0 * scale_top # 624 px
bx0 = p1_x + (p1_w - box_l) // 2
by0 = p1_y + 110

# Outer box contour
draw.rectangle([(bx0, by0), (bx0 + box_l, by0 + box_w)], fill='#1E293B', outline='#60A5FA', width=3)

# Inner Cavity (wall thickness = 2.0mm -> 26px)
cav_x0 = bx0 + int(round(2.5 * scale_top)) # 32 px from front
cav_x1 = bx0 + box_l - int(round(2.5 * scale_top)) # 32 px from rear
cav_y0 = by0 + int(round(2.0 * scale_top)) # 26 px from side
cav_y1 = by0 + box_w - int(round(2.0 * scale_top)) # 26 px from side
draw.rectangle([(cav_x0, cav_y0), (cav_x1, cav_y1)], fill='#0B132B', outline='#34D399', width=2)

# Central Transverse Divider Wall (t = 1.2 mm -> 16 px)
div_mid_x = (cav_x0 + cav_x1) // 2
div_w = int(round(1.2 * scale_top)) # ~16 px
div_x0 = div_mid_x - div_w // 2
div_x1 = div_mid_x + div_w // 2

# Draw Divider
draw.rectangle([(div_x0, cav_y0), (div_x1, cav_y1)], fill='#38BDF8', outline='#7DD3FC', width=2)

# Shading & labels for Compartment 1 (Front)
comp1_box = [(cav_x0 + 5, cav_y0 + 5), (div_x0 - 5, cav_y1 - 5)]
draw.rectangle(comp1_box, fill='#13203A')
draw.text((cav_x0 + 35, by0 + box_w // 2 - 35), 'NGĂN 1 (TRƯỚC)', fill='#FDE047', font=font_heading)
draw.text((cav_x0 + 20, by0 + box_w // 2 + 5), 'Dài 20.8 × Rộng 22.0 mm', fill='#CBD5E1', font=font_label)
draw.text((cav_x0 + 20, by0 + box_w // 2 + 30), 'Thuốc TRƯỚC ĂN / SÁNG', fill='#34D399', font=font_bold)

# Shading & labels for Compartment 2 (Rear)
comp2_box = [(div_x1 + 5, cav_y0 + 5), (cav_x1 - 5, cav_y1 - 5)]
draw.rectangle(comp2_box, fill='#13203A')
draw.text((div_x1 + 45, by0 + box_w // 2 - 35), 'NGĂN 2 (SAU)', fill='#38BDF8', font=font_heading)
draw.text((div_x1 + 30, by0 + box_w // 2 + 5), 'Dài 20.8 × Rộng 22.0 mm', fill='#CBD5E1', font=font_label)
draw.text((div_x1 + 30, by0 + box_w // 2 + 30), 'Thuốc SAU ĂN / TỐI', fill='#FBBF24', font=font_bold)

# Pills inside Compartment 1 (Orange tablets & Red/White capsules)
draw.ellipse([(cav_x0 + 40, cav_y0 + 30), (cav_x0 + 100, cav_y0 + 90)], fill='#F97316', outline='#FFFFFF')
draw.ellipse([(cav_x0 + 130, cav_y0 + 40), (cav_x0 + 220, cav_y0 + 80)], fill='#EF4444', outline='#FFFFFF')
draw.ellipse([(cav_x0 + 175, cav_y0 + 40), (cav_x0 + 220, cav_y0 + 80)], fill='#FFFFFF', outline='#FFFFFF')
draw.ellipse([(cav_x0 + 60, cav_y0 + 180), (cav_x0 + 150, cav_y0 + 220)], fill='#3B82F6', outline='#FFFFFF')
draw.ellipse([(cav_x0 + 105, cav_y0 + 180), (cav_x0 + 150, cav_y0 + 220)], fill='#FFFFFF', outline='#FFFFFF')

# Pills inside Compartment 2 (Blue & Green capsules / Yellow tablets)
draw.ellipse([(div_x1 + 50, cav_y0 + 40), (div_x1 + 140, cav_y0 + 80)], fill='#10B981', outline='#FFFFFF')
draw.ellipse([(div_x1 + 95, cav_y0 + 40), (div_x1 + 140, cav_y0 + 80)], fill='#FBBF24', outline='#FFFFFF')
draw.ellipse([(div_x1 + 140, cav_y0 + 160), (div_x1 + 200, cav_y0 + 220)], fill='#FDE047', outline='#FFFFFF')
draw.ellipse([(div_x1 + 50, cav_y0 + 180), (div_x1 + 140, cav_y0 + 220)], fill='#8B5CF6', outline='#FFFFFF')
draw.ellipse([(div_x1 + 95, cav_y0 + 180), (div_x1 + 140, cav_y0 + 220)], fill='#EC4899', outline='#FFFFFF')

# Dimension Callouts for Top View
# Overall length L = 48.0 mm
draw_dim_h(bx0, bx0 + box_l, by0 + box_w + 35, 'CHIỀU DÀI PHỦ BÌ L = 48.0 mm', offset_y=0)
# Overall width W = 26.0 mm
draw_dim_v(bx0 - 30, by0, by0 + box_w, 'W = 26.0 mm', align_right=True, color='#38BDF8')
# Inner width Win = 22.0 mm
draw_dim_v(bx0 + 20, cav_y0, cav_y1, 'Win = 22.0 mm', align_right=False, color='#34D399')
# Compartment 1 Length = 20.8 mm
draw_dim_h(cav_x0, div_x0, by0 - 25, 'L1 = 20.8 mm', offset_y=-5, color='#FDE047')
# Divider thickness t = 1.2 mm
draw.line([(div_mid_x, by0 - 15), (div_mid_x, by0 - 55)], fill='#38BDF8', width=2)
draw.text((div_mid_x - 30, by0 - 80), 't = 1.2 mm', fill='#38BDF8', font=font_bold)
# Compartment 2 Length = 20.8 mm
draw_dim_h(div_x1, cav_x1, by0 - 25, 'L2 = 20.8 mm', offset_y=-5, color='#38BDF8')

# Front Pull Notch (on left)
draw.rectangle([(bx0 - 12, by0 + box_w//2 - 40), (bx0, by0 + box_w//2 + 40)], fill='#0F172A', outline='#FBBF24', width=2)
draw.text((bx0 - 100, by0 + box_w//2 - 10), 'MẶT TRƯỚC', fill='#FBBF24', font=font_bold)

# Engineering Analysis text at bottom of Panel 1
nb1_y = p1_y + 570
draw.rectangle([(p1_x + 30, nb1_y), (p1_x + p1_w - 30, p1_y + p1_h - 25)], fill='#131F37', outline='#34D399', width=1)
draw.text((p1_x + 50, nb1_y + 15), 'ƯU ĐIỂM CỦA BỐ CỤC CHIA 2 NGĂN TRƯỚC - SAU (FRONT / BACK):', fill='#34D399', font=font_subheading)
draw.text((p1_x + 50, nb1_y + 48), '1. Thuận tiện bốc thuốc: Lòng mỗi ngăn rộng 22.0 × dài 20.8 mm, ngón tay với vào cực kỳ thoải mái.', fill='#FFFFFF', font=font_label)
draw.text((p1_x + 50, nb1_y + 75), '2. Phù hợp hành trình búng mở 25.0 mm: Khi ấn mở, khay thò ra 25mm -> Ngăn 1 lộ diện hoàn toàn 100%!', fill='#FDE047', font=font_bold)
draw.text((p1_x + 50, nb1_y + 102), '3. Phân loại y tế trực quan: Tách biệt rạch ròi 2 cữ uống (Trước ăn vs Sau ăn) tránh người già uống nhầm.', fill='#CBD5E1', font=font_label)
draw.text((p1_x + 50, nb1_y + 130), '4. Sức chứa dồi dào: Mỗi ngăn chứa được 6 - 8 viên nang lớn (tổng cộng 12 - 15 viên/ngày).', fill='#6EE7B7', font=font_label)
draw.text((p1_x + 50, nb1_y + 158), '5. Không nên chia Trái - Phải: Vì nếu chia ngang thì lòng chỉ còn 10mm, ngón tay người lớn sẽ bị kẹt!', fill='#F87171', font=font_label)


# ==================== PANEL 2: HAI PHƯƠNG ÁN KỸ THUẬT (ĐÚC LIỀN VS THÁO LẮP) ====================
p2_x, p2_y, p2_w, p2_h = 1220, 155, 1130, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+50)], fill='#1E3A8A')
draw.text((p2_x+20, p2_y+12), '2. MẶT CẮT DỌC & 2 PHƯƠNG ÁN KỸ THUẬT: ĐÚC LIỀN VS THÁO LẮP MÔ-ĐUN', fill='#FFFFFF', font=font_heading)

scale_sec = 11.5
sec_l = 48.0 * scale_sec # 552 px
sec_h = 30.0 * scale_sec # 345 px
sec_x0 = p2_x + 90
sec_y0 = p2_y + 90
sec_hin = 26.5 * scale_sec # 304 px

# Longitudinal Section Box
draw.rectangle([(sec_x0, sec_y0), (sec_x0 + sec_l, sec_y0 + sec_h)], fill='#1E293B', outline='#60A5FA', width=3)
# Inner cavity
draw.rectangle([(sec_x0 + 28, sec_y0), (sec_x0 + sec_l - 28, sec_y0 + sec_hin)], fill='#0B132B', outline='#34D399', width=2)

# Vertical Divider in Section
sec_mid_x = (sec_x0 + 28 + sec_x0 + sec_l - 28) // 2
sec_div_w = int(round(1.2 * scale_sec)) # ~14 px
draw.rectangle([(sec_mid_x - sec_div_w//2, sec_y0 + 15), (sec_mid_x + sec_div_w//2, sec_y0 + sec_hin)], fill='#38BDF8', outline='#7DD3FC', width=2)
# Bo tròn góc đáy R = 1.5mm ở chân vách ngăn
draw.circle((sec_mid_x - sec_div_w//2, sec_y0 + sec_hin - 8), 6, fill='#38BDF8')
draw.circle((sec_mid_x + sec_div_w//2, sec_y0 + sec_hin - 8), 6, fill='#38BDF8')

# Callout to Divider in Section
draw.line([(sec_mid_x, sec_y0 + 50), (sec_mid_x + 60, sec_y0 - 25)], fill='#38BDF8', width=2)
draw.line([(sec_mid_x + 60, sec_y0 - 25), (sec_mid_x + 220, sec_y0 - 25)], fill='#38BDF8', width=2)
draw.text((sec_mid_x + 65, sec_y0 - 50), 'VÁCH NGĂN CHIA ĐÔI t = 1.2 mm', fill='#38BDF8', font=font_bold)
draw.text((sec_mid_x + 65, sec_y0 - 23), 'Bo góc đáy R = 1.5mm (Dễ vệ sinh)', fill='#CBD5E1', font=font_dim_small)

# Rear closing wall
draw.rectangle([(sec_x0 + sec_l - 28, sec_y0), (sec_x0 + sec_l, sec_y0 + sec_h)], fill='#334155', outline='#38BDF8', width=2)

# Pills in Section
# Ngăn 1 (Trái)
draw.rounded_rectangle([(sec_x0 + 45, sec_y0 + sec_hin - 40), (sec_x0 + 125, sec_y0 + sec_hin - 8)], radius=16, fill='#EF4444', outline='#FFFFFF')
draw.rounded_rectangle([(sec_x0 + 85, sec_y0 + sec_hin - 40), (sec_x0 + 125, sec_y0 + sec_hin - 8)], radius=16, fill='#FFFFFF', outline='#FFFFFF')
draw.rounded_rectangle([(sec_x0 + 140, sec_y0 + sec_hin - 40), (sec_x0 + 220, sec_y0 + sec_hin - 8)], radius=16, fill='#F97316', outline='#FFFFFF')
draw.rounded_rectangle([(sec_x0 + 90, sec_y0 + sec_hin - 85), (sec_x0 + 170, sec_y0 + sec_hin - 53)], radius=16, fill='#3B82F6', outline='#FFFFFF')

# Ngăn 2 (Phải)
draw.rounded_rectangle([(sec_mid_x + 25, sec_y0 + sec_hin - 40), (sec_mid_x + 105, sec_y0 + sec_hin - 8)], radius=16, fill='#10B981', outline='#FFFFFF')
draw.rounded_rectangle([(sec_mid_x + 65, sec_y0 + sec_hin - 40), (sec_mid_x + 105, sec_y0 + sec_hin - 8)], radius=16, fill='#FBBF24', outline='#FFFFFF')
draw.rounded_rectangle([(sec_mid_x + 120, sec_y0 + sec_hin - 40), (sec_mid_x + 200, sec_y0 + sec_hin - 8)], radius=16, fill='#8B5CF6', outline='#FFFFFF')
draw.rounded_rectangle([(sec_mid_x + 70, sec_y0 + sec_hin - 85), (sec_mid_x + 150, sec_y0 + sec_hin - 53)], radius=16, fill='#EC4899', outline='#FFFFFF')

# Dimensions in Section
draw_dim_h(sec_x0, sec_x0 + sec_l, sec_y0 + sec_h + 35, 'CHIỀU DÀI SÂU TRƯỢT PHỦ BÌ L = 48.0 mm', offset_y=0)
draw_dim_v(sec_x0 - 30, sec_y0, sec_y0 + sec_h, 'H = 30.0 mm', align_right=True, color='#34D399')
draw_dim_v(sec_x0 + 15, sec_y0, sec_y0 + sec_hin, 'SÂU 26.5 mm', align_right=False, color='#FDE047')

# Comparison of Option A vs Option B
nb2_y = p2_y + 490
draw.rectangle([(p2_x + 30, nb2_y), (p2_x + p2_w - 30, p2_y + p2_h - 25)], fill='#131F37', outline='#38BDF8', width=1)
draw.text((p2_x + 50, nb2_y + 15), 'SO SÁNH 2 PHƯƠNG ÁN GIA CÔNG THỰC TẾ:', fill='#38BDF8', font=font_subheading)

draw.text((p2_x + 50, nb2_y + 45), '★ PHƯƠNG ÁN 1: VÁCH ĐÚC LIỀN NGUYÊN KHỐI (Khuyên Dùng Cho In 3D & Ép Nhựa)', fill='#34D399', font=font_bold)
draw.text((p2_x + 50, nb2_y + 72), '  • Ưu điểm: Đúc/in 1 lần duy nhất, kết cấu vững chắc, không bao giờ rơi mất vách ngăn.', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 50, nb2_y + 98), '  • Nhược điểm: Cố định 2 ngăn vĩnh viễn, không biến thành 1 ngăn lớn được.', fill='#94A3B8', font=font_label)

draw.text((p2_x + 50, nb2_y + 130), '★ PHƯƠNG ÁN 2: VÁCH RỜI THÁO LẮP MÔ-ĐUN (Cực Kỳ Đa Năng & Thông Minh)', fill='#FDE047', font=font_bold)
draw.text((p2_x + 50, nb2_y + 157), '  • Cơ cấu: Đúc sẵn 2 rãnh trượt 0.8mm ở thành trong; người dùng thích 2 ngăn thì trượt vách vào,', fill='#CBD5E1', font=font_label)
draw.text((p2_x + 50, nb2_y + 182), '    khi cần đựng viên sủi to thì rút vách ra thành 1 ngăn lớn 43mm siêu rộng rãi.', fill='#CBD5E1', font=font_label)


# ==================== PANEL 3: BẢNG THÔNG SỐ GIA CÔNG HỘC THUỐC 2 NGĂN ====================
p3_x, p3_y, p3_w, p3_h = 50, 1010, W - 100, 480
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#0F172A', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+50)], fill='#1E3A8A')
draw.text((p3_x+20, p3_y+12), '3. BẢNG THÔNG SỐ KỸ THUẬT GIA CÔNG HỘC THUỐC CHIA 2 NGĂN (BÀN GIAO GIA CÔNG)', fill='#FFFFFF', font=font_heading)

t_cols = [p3_x+25, p3_x+470, p3_x+820, p3_x+1260, p3_x+1720]
t_y = p3_y + 65
draw.rectangle([(p3_x+15, t_y), (p3_x+p3_w-15, t_y+42)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'HẠNG MỤC KHOANG THUỐC', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC TIÊU CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI / KẾT CẤU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'ỨNG DỤNG Y TẾ', fill='#38BDF8', font=font_bold)
draw.text((t_cols[4], t_y+10), 'TỐI ƯU CÔNG THÁI HỌC', fill='#38BDF8', font=font_bold)

table_data = [
    ('Ngăn 1 (Khoang trước)', 'Dài 20.8 × Rộng 22.0 × Sâu 26.5 mm', '± 0.15 mm | Thể tích ~12 cm³', 'Thuốc TRƯỚC BỮA ĂN (hoặc cữ Sáng)', 'Lộ ra 100% khi búng mở 25mm'),
    ('Ngăn 2 (Khoang sau)', 'Dài 20.8 × Rộng 22.0 × Sâu 26.5 mm', '± 0.15 mm | Thể tích ~12 cm³', 'Thuốc SAU BỮA ĂN (hoặc cữ Chiều/Tối)', 'Lấy dễ dàng khi rút khay ra thêm'),
    ('Vách ngăn chia đôi (Divider)', 'Dày t = 1.2 mm × Cao 24.5 mm', '± 0.08 mm | Thẳng đứng 90°', 'Ngăn cách tuyệt đối 2 nhóm thuốc', 'Mép trên bo tròn R = 0.6mm không cấn tay'),
    ('Rãnh gài vách (Nếu làm tháo lắp)', 'Sâu 0.8 mm × Rộng 1.4 mm', '± 0.05 mm | 2 sườn bên', 'Linh hoạt biến đổi 1 ngăn <-> 2 ngăn', 'Trượt êm nhẹ, không bị lỏng lẻo'),
    ('Bo góc chân vách ngăn đáy', 'Bán kính fillet R = 1.5 mm', 'Gia công nhẵn bóng', 'Chống đọng cặn bột thuốc ở chân vách', 'Lau chùi vệ sinh y tế cực dễ'),
    ('Vật liệu khuyên dùng', 'Nhựa PP trong mờ y tế / PETG trắng', 'Food-safe chuẩn FDA', 'Không độc hại, kháng cồn khử khuẩn', 'Rơi không vỡ, chịu kéo trên 100.000 lần'),
    ('Chỉ dẫn in 3D FDM', 'Mặt đáy úp xuống bàn in PEI', 'Layer 0.16mm | Wall 4 lớp', 'In liền 1 khối vách ngăn, KHÔNG SUPPORT', 'Lòng khay bóng mịn, không ba via')
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

# Save output
out_path = 'd:/DIA+/ban_ve_hoc_thuoc_chia_2_ngan_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
