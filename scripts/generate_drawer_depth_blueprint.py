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
draw.text((80, 56), 'BẢN VẼ CHI TIẾT CAD: ĐỘ SÂU & KÍCH THƯỚC HÌNH HỌC HỘC KÉO THUỐC (PART [2])', fill='#FFFFFF', font=font_title)
draw.text((80, 108), 'DỰ ÁN: CalenDIA+ (DIAPLUS) • PHÂN TÍCH 4 THÔNG SỐ ĐỘ SÂU • SÂU DÀI 48.0mm • SÂU LÒNG 16.5mm • HÀNH TRÌNH THÒ RA 25.0mm', fill='#FBBF24', font=font_subtitle)

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

# ==================== PANEL 1: MẶT CẮT DỌC CHIỀU SÂU KHAY (LONGITUDINAL SECTION) ====================
p1_x, p1_y, p1_w, p1_h = 60, 165, 1260, 830
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+p1_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p1_x, p1_y), (p1_x+p1_w, p1_y+55)], fill='#1E3A8A')
draw.text((p1_x+25, p1_y+14), '1. MẶT CẮT DỌC THEO CHIỀU SÂU TRƯỢT: KHAY KÉO & HỐC TỔ ONG (TỶ LỆ 12:1)', fill='#FFFFFF', font=font_heading)

# Scale: 16.0 px / mm
scale = 16.0
sec_x0 = p1_x + 160
sec_y0 = p1_y + 230

# Real dimensions:
# Drawer Outer: Length L = 48.0 mm, Height H = 20.0 mm
# Honeycomb Pocket: Depth L_p = 50.0 mm, Height H_p = 20.5 mm
# Wall thickness: Bottom t_b = 2.0 mm, Front t_f = 2.5 mm, Rear t_r = 2.0 mm
# Inner Cavity: Length L_in = 48 - 2.5 - 2.0 = 43.5 mm (or 42.0 mm with front lip), Depth from rim H_in = 16.5 mm

dl_px = 48.0 * scale  # 768 px
dh_px = 20.0 * scale  # 320 px
tf_px = 2.5 * scale   # 40 px
tb_px = 2.0 * scale   # 32 px
tr_px = 2.0 * scale   # 32 px
tin_d_px = 16.5 * scale # 264 px
lin_px = 42.0 * scale  # 672 px

# Draw Outer Pocket Sleeve (Honeycomb Guide Pocket - Part 3 in ghosted blue)
pocket_depth_px = 50.0 * scale # 800 px
draw.rectangle([(sec_x0 - 25, sec_y0 - 25), (sec_x0 + pocket_depth_px, sec_y0)], fill='#1E293B', outline='#475569') # Top wall
draw.rectangle([(sec_x0 - 25, sec_y0 + dh_px), (sec_x0 + pocket_depth_px, sec_y0 + dh_px + 25)], fill='#1E293B', outline='#475569') # Bottom wall
draw.rectangle([(sec_x0 + pocket_depth_px - 25, sec_y0), (sec_x0 + pocket_depth_px, sec_y0 + dh_px)], fill='#1E293B', outline='#475569') # Rear wall
draw.text((sec_x0 + pocket_depth_px - 280, sec_y0 - 55), 'HỐC TỔ ONG PART 3 (SÂU 50.0 mm)', fill='#64748B', font=font_bold)

# Draw Drawer Solid Plastic Body in Section (Mặt cắt lòng ngăn kéo)
# Solid front plate
draw.rectangle([(sec_x0, sec_y0), (sec_x0 + tf_px, sec_y0 + dh_px)], fill='#1E293B', outline='#93C5FD', width=2)

# Solid bottom floor (Dày 2.0 mm)
draw.rectangle([(sec_x0 + tf_px, sec_y0 + tin_d_px), (sec_x0 + dl_px - tr_px, sec_y0 + dh_px)], fill='#1E293B', outline='#93C5FD', width=2)

# Solid rear wall (Dày 2.0 mm)
draw.rectangle([(sec_x0 + dl_px - tr_px, sec_y0), (sec_x0 + dl_px, sec_y0 + dh_px)], fill='#1E293B', outline='#93C5FD', width=2)

# Inner Cavity (Lòng chứa thuốc - Màu tối sâu thẳm)
draw.rectangle([(sec_x0 + tf_px, sec_y0), (sec_x0 + dl_px - tr_px, sec_y0 + tin_d_px)], fill='#0F172A', outline='#38BDF8', width=2)

# Side Guide Rail Rib (Gân trượt dẫn hướng bên sườn khay - như trên ảnh)
rail_y = sec_y0 + dh_px // 2
draw.rectangle([(sec_x0 + 15, rail_y - 8), (sec_x0 + dl_px - 15, rail_y + 8)], fill='#3B82F6', outline='#60A5FA', width=1)
draw.text((sec_x0 + dl_px // 2 - 120, rail_y - 30), 'GÂN TRƯỢT DẪN HƯỚNG BÊN HÔNG (1.0 × 0.8 mm)', fill='#60A5FA', font=font_dim_small)

# Rear Pull-out Stopper Tooth (Vấu cản chống rơi khay)
draw.rectangle([(sec_x0 + dl_px - tr_px, sec_y0 - 15), (sec_x0 + dl_px, sec_y0)], fill='#F59E0B')
draw.line([(sec_x0 + dl_px - 10, sec_y0 - 8), (sec_x0 + dl_px + 40, sec_y0 - 40)], fill='#FBBF24', width=2)
draw.text((sec_x0 + dl_px + 50, sec_y0 - 50), 'VẤU CẢN CHỐNG RƠI (Cao 1.2 mm)', fill='#FDE047', font=font_bold)

# Front Finger Scoop (Hốc tì ngón tay âm ở mặt trước)
draw.rectangle([(sec_x0, sec_y0 + dh_px//2 - 40), (sec_x0 + 18, sec_y0 + dh_px//2 + 40)], fill='#0B132B', outline='#FBBF24', width=2)
draw.line([(sec_x0 + 8, sec_y0 + dh_px//2), (sec_x0 - 50, sec_y0 + dh_px//2)], fill='#FBBF24', width=2)
draw.text((sec_x0 - 230, sec_y0 + dh_px//2 - 25), 'HỐC TÌ NGÓN TAY', fill='#FDE047', font=font_bold)
draw.text((sec_x0 - 230, sec_y0 + dh_px//2), 'SÂU 1.8 mm (ÂM MẶT)', fill='#FDE047', font=font_dim_small)

# Draw Colorful Medical Pills Inside (Mô phỏng thuốc bên trong như trên ảnh)
# Capsule 1 (Blue/Red)
c1_x = sec_x0 + tf_px + 80
c1_y = sec_y0 + tin_d_px - 45
draw.rounded_rectangle([(c1_x, c1_y), (c1_x + 90, c1_y + 40)], radius=20, fill='#3B82F6', outline='#93C5FD')
draw.rounded_rectangle([(c1_x + 45, c1_y), (c1_x + 90, c1_y + 40)], radius=20, fill='#EF4444', outline='#FCA5A5')

# Capsule 2 (Yellow/Green)
c2_x = sec_x0 + tf_px + 230
c2_y = sec_y0 + tin_d_px - 45
draw.rounded_rectangle([(c2_x, c2_y), (c2_x + 90, c2_y + 40)], radius=20, fill='#FBBF24', outline='#FDE047')
draw.rounded_rectangle([(c2_x + 45, c2_y), (c2_x + 90, c2_y + 40)], radius=20, fill='#10B981', outline='#6EE7B7')

# Round Tablets
t1_x = sec_x0 + tf_px + 380
t1_y = sec_y0 + tin_d_px - 45
draw.ellipse([(t1_x, t1_y), (t1_x + 45, t1_y + 45)], fill='#FFFFFF', outline='#E2E8F0')
draw.text((t1_x + 10, t1_y + 12), 'D+', fill='#1E40AF', font=font_pill)

t2_x = sec_x0 + tf_px + 460
t2_y = sec_y0 + tin_d_px - 45
draw.ellipse([(t2_x, t2_y), (t2_x + 45, t2_y + 45)], fill='#EC4899', outline='#F472B6')

# --- 4 KEY DIMENSION CALLOUTS ---
# 1. Chiều sâu / Dài phủ bì: L = 48.0 mm
draw_dim_h(sec_x0, sec_x0 + dl_px, sec_y0 + dh_px + 50, 'CHIỀU SÂU / DÀI PHỦ BÌ KHAY: L = 48.0 mm (TRƯỢT TRONG HỘC 50mm)', offset_text=8)

# 2. Chiều sâu / Dài lọt lòng: L_in = 42.0 mm
draw_dim_h(sec_x0 + tf_px, sec_x0 + dl_px - tr_px, sec_y0 - 25, 'CHIỀU DÀI LÒNG CHỨA THUỐC: L_lòng = 42.0 mm', offset_text=8, color='#34D399')

# 3. Chiều sâu từ miệng xuống đáy: H_in = 16.5 mm
draw_dim_v(sec_x0 + dl_px + 35, sec_y0, sec_y0 + tin_d_px, 'ĐỘ SÂU LÒNG KHAY H_lòng = 16.5 mm', offset_text=10, color='#FBBF24')

# 4. Chiều cao phủ bì khay: H = 20.0 mm
draw_dim_v(sec_x0 + dl_px + 170, sec_y0, sec_y0 + dh_px, 'CAO PHỦ BÌ H = 20.0 mm')

# ==================== PANEL 2: HÀNH TRÌNH THÒ RA & MẶT CẮT NGANG ====================
p2_x, p2_y, p2_w, p2_h = 1350, 165, 990, 830
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+p2_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p2_x, p2_y), (p2_x+p2_w, p2_y+55)], fill='#1E3A8A')
draw.text((p2_x+25, p2_y+14), '2. HÀNH TRÌNH THÒ RA (25mm) & CHIỀU RỘNG HỘC (26mm)', fill='#FFFFFF', font=font_heading)

# Diagram of Drawer Pulled out from Console Face (Mô phỏng thò ra ngoài 25.0 mm như trên ảnh)
diag_x0 = p2_x + 90
diag_y0 = p2_y + 110
draw.text((diag_x0, diag_y0 - 25), 'A. KHOẢNG CÁCH THÒ RA NGOÀI KHI KÉO (NHƯ TRÊN ẢNH):', fill='#38BDF8', font=font_subheading)

# Console face line (Vạch mặt phẳng vỏ máy)
face_x = diag_x0 + 350
draw.line([(face_x, diag_y0 + 10), (face_x, diag_y0 + 260)], fill='#EF4444', width=4)
draw.text((face_x - 120, diag_y0 + 20), 'MẶT TRƯỚC VỎ MÁY', fill='#EF4444', font=font_bold)

# Drawer: 25.0 mm extruded outside, 23.0 mm still inside (Total 48.0 mm)
# Scale: 12 px / mm
ext_scale = 12.0
ext_px = 25.0 * ext_scale # 300 px
ins_px = 23.0 * ext_scale # 276 px
drw_h = 16.0 * ext_scale  # 192 px

# Part outside
draw.rectangle([(face_x - ext_px, diag_y0 + 50), (face_x, diag_y0 + 50 + drw_h)], fill='#1E293B', outline='#60A5FA', width=3)
# Part inside pocket
draw.rectangle([(face_x, diag_y0 + 50), (face_x + ins_px, diag_y0 + 50 + drw_h)], fill='#0F172A', outline='#475569', width=2)

# Pills visible in the outside part
draw.text((face_x - ext_px + 40, diag_y0 + 90), 'THÒ RA NGOÀI: 25.0 mm', fill='#FDE047', font=font_bold)
draw.text((face_x - ext_px + 30, diag_y0 + 120), '(Lộ 52% lòng khay, thò', fill='#CBD5E1', font=font_dim_small)
draw.text((face_x - ext_px + 30, diag_y0 + 145), 'ngón tay nhón thuốc dễ dàng)', fill='#CBD5E1', font=font_dim_small)

# Dimension for 25.0 mm Extension
draw_dim_h(face_x - ext_px, face_x, diag_y0 + 50 + drw_h + 30, 'THÒ RA = 25.0 mm', offset_text=8, color='#FBBF24')
draw_dim_h(face_x, face_x + ins_px, diag_y0 + 50 + drw_h + 30, 'CÒN TRONG = 23.0 mm', offset_text=8, color='#64748B')

# --- B. MẶT CẮT NGANG KHAY (TRANSVERSE CROSS-SECTION) ---
diag2_y0 = p2_y + 450
draw.text((diag_x0, diag2_y0 - 25), 'B. MẶT CẮT NGANG: CHIỀU RỘNG PHỦ BÌ & LỌT LÒNG:', fill='#34D399', font=font_subheading)

# Transverse: Outer Width W = 26.0 mm, Inner Width W_in = 22.4 mm, Height H = 20.0 mm
tx_scale = 16.0
tw_out = 26.0 * tx_scale # 416 px
th_out = 20.0 * tx_scale # 320 px
tw_in = 22.4 * tx_scale  # 358.4 px
th_in = 16.5 * tx_scale  # 264 px
tx_start = diag_x0 + 160

# Honeycomb sleeve pocket outline (26.5 x 20.5 mm)
draw.rectangle([(tx_start - 12, diag2_y0 + 10), (tx_start + tw_out + 12, diag2_y0 + 10 + th_out + 12)], outline='#475569', width=2)
draw.text((tx_start + tw_out + 25, diag2_y0 + 10), 'HỐC TỔ ONG: 26.5 × 20.5 mm', fill='#64748B', font=font_dim_small)

# Drawer outer box
draw.rectangle([(tx_start, diag2_y0 + 16), (tx_start + tw_out, diag2_y0 + 16 + th_out)], fill='#1E293B', outline='#93C5FD', width=3)

# Drawer inner cavity
in_pad_x = (tw_out - tw_in) / 2
draw.rectangle([(tx_start + in_pad_x, diag2_y0 + 16), (tx_start + in_pad_x + tw_in, diag2_y0 + 16 + th_in)], fill='#0F172A', outline='#34D399', width=2)

# 2 Side Guide Rails (Gân trượt 2 bên)
draw.rectangle([(tx_start - 8, diag2_y0 + 16 + th_out//2 - 12), (tx_start, diag2_y0 + 16 + th_out//2 + 12)], fill='#38BDF8')
draw.rectangle([(tx_start + tw_out, diag2_y0 + 16 + th_out//2 - 12), (tx_start + tw_out + 8, diag2_y0 + 16 + th_out//2 + 12)], fill='#38BDF8')

# Dimensions for Cross-section
draw_dim_h(tx_start, tx_start + tw_out, diag2_y0 + 16 + th_out + 35, 'RỘNG PHỦ BÌ W = 26.0 mm', offset_text=8)
draw_dim_h(tx_start + in_pad_x, tx_start + in_pad_x + tw_in, diag2_y0 - 2, 'RỘNG LÒNG = 22.4 mm', offset_text=8, color='#34D399')
draw_dim_v(tx_start + tw_out + 50, diag2_y0 + 16, diag2_y0 + 16 + th_in, 'SÂU LÒNG = 16.5 mm', color='#FBBF24')

# ==================== PANEL 3: BẢNG TỔNG HỢP 4 THÔNG SỐ ĐỘ SÂU ====================
p3_x, p3_y, p3_w, p3_h = 60, 1020, W - 120, 460
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+p3_h)], fill='#101C36', outline='#2563EB', width=2)
draw.rectangle([(p3_x, p3_y), (p3_x+p3_w, p3_y+55)], fill='#1E3A8A')
draw.text((p3_x+25, p3_y+14), '3. BẢNG GIẢI THÍCH CHI TIẾT 4 KHÁI NIỆM \"ĐỘ SÂU\" CỦA HỘC THUỐC TRÊN ẢNH', fill='#FFFFFF', font=font_heading)

t_cols = [p3_x+30, p3_x+480, p3_x+780, p3_x+1080, p3_x+1520]
t_y = p3_y + 75
draw.rectangle([(p3_x+20, t_y), (p3_x+p3_w-20, t_y+45)], fill='#1E293B')
draw.text((t_cols[0], t_y+10), 'THÔNG SỐ ĐỘ SÂU', fill='#38BDF8', font=font_bold)
draw.text((t_cols[1], t_y+10), 'KÍCH THƯỚC CHUẨN', fill='#38BDF8', font=font_bold)
draw.text((t_cols[2], t_y+10), 'DUNG SAI GIA CÔNG', fill='#38BDF8', font=font_bold)
draw.text((t_cols[3], t_y+10), 'Ý NGHĨA KỸ THUẬT', fill='#38BDF8', font=font_bold)
draw.text((t_cols[4], t_y+10), 'KHẢ NĂNG CHỨA THỰC TẾ', fill='#38BDF8', font=font_bold)

table_data = [
    ('1. Chiều sâu / Dài trượt phủ bì', 'L = 48.0 mm', '± 0.15 mm', 'Chiều dài trọn vẹn của khay từ mặt trước đến đáy sau', 'Trượt trọn trong hộc tổ ong sâu 50.0 mm'),
    ('2. Chiều sâu / Dài lọt lòng khoang', 'L_lòng = 42.0 mm', '+ 0.2 / - 0.0 mm', 'Độ dài lòng chứa thuốc (trừ thành trước 2.5mm, sau 2mm)', 'Xếp vừa 2 hàng viên nang dài 20mm'),
    ('3. Chiều sâu lòng từ miệng xuống đáy', 'H_lòng = 16.5 mm', '+ 0.2 / - 0.0 mm', 'Độ sâu đo từ mép miệng khay xuống sàn đáy nhựa', 'Chứa thoải mái 6 - 8 viên thuốc nang lớn'),
    ('4. Độ sâu hốc tì ngón tay (Mặt trước)', 'Sâu = 1.8 mm', '± 0.10 mm', 'Hốc lõm hình viên thuốc 14×6mm để tì ngón tay kéo khay', 'Tạo điểm tì êm ái, kéo nhẹ nhàng không trượt'),
    ('5. Khoảng cách thò ra khi mở (Ảnh)', 'Thò ra = 25.0 mm', '± 1.0 mm', 'Độ dài phần thò ra ngoài khi người dùng rút mở khay', 'Lộ 52% khoang thuốc, ngón tay nhón lấy dễ'),
    ('6. Hành trình kéo tối đa (Max Stroke)', 'Hành trình = 32.0 mm', 'Cản bởi vấu chặn', 'Chừa lại 16.0mm nằm trong hộc có ngàm chặn', 'CHỐNG TUỘT RƠI KHAY THUỐC RA SÀN NHÀ'),
    ('7. Thể tích lòng chứa thuốc thực tế', 'V = 15.5 cm³ (15.5 ml)', 'Chuẩn y tế', 'Rộng 22.4 × Dài 42.0 × Sâu 16.5 mm', 'Đủ liều thuốc 1 buổi cho bệnh nhân tiểu đường')
]

curr_y = t_y + 55
for row in table_data:
    draw.rectangle([(p3_x+20, curr_y), (p3_x+p3_w-20, curr_y+43)], fill='#152238' if table_data.index(row)%2==0 else '#101C36')
    draw.text((t_cols[0], curr_y+10), row[0], fill='#FFFFFF', font=font_label)
    draw.text((t_cols[1], curr_y+10), row[1], fill='#FDE047', font=font_bold)
    draw.text((t_cols[2], curr_y+10), row[2], fill='#6EE7B7', font=font_label)
    draw.text((t_cols[3], curr_y+10), row[3], fill='#CBD5E1', font=font_label)
    draw.text((t_cols[4], curr_y+10), row[4], fill='#38BDF8', font=font_dim_small)
    curr_y += 46

# Output Path
out_path = 'd:/DIA+/ban_ve_chi_tiet_chieu_sau_hoc_thuoc_cad.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
