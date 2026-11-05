import math
from PIL import Image, ImageDraw, ImageFont

# Canvas Setup: 2200 x 1400
W, H = 2200, 1400
img = Image.new('RGB', (W, H), color='#0A1128') # Deep CAD Navy
draw = ImageDraw.Draw(img)

# Load fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 35)
font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)

# Drafting Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#101C38', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#101C38', width=1)

# Header Card
draw.rectangle([(40, 30), (W-40, 125)], fill='#131F37', outline='#38BDF8', width=2)
draw.text((70, 44), 'PHỐI CẢNH 3D CAD: HỘC THUỐC NGUYÊN KHỐI LIỀN MẠCH (SEAMLESS UNIBODY DRAWER)', fill='#FFFFFF', font=font_title)
draw.text((70, 90), 'Khắc phục triệt để lỗi giật cấp đuôi sau • Thành bên phẳng lì 100% • Đáy phẳng tắp • Gân trượt đúc liền suốt 48mm', fill='#34D399', font=font_sub)

# Camera / Axonometric Setup
ang = math.radians(24)
cos_a = math.cos(ang)
sin_a = math.sin(ang)

# Center of projection
ox, oy = 880, 1150
sc = 9.8

def pt(x, y, z):
    px = ox + (x * cos_a - y * cos_a) * sc * 1.55
    py = oy - (x * sin_a + y * sin_a) * sc * 1.55 - z * sc * 1.35
    return (px, py)

# 1. Soft Ground Shadow
shadow_pts = [
    pt(-3, -3, 0),
    pt(51, -3, 0),
    pt(51, 29, 0),
    pt(-3, 29, 0)
]
draw.polygon(shadow_pts, fill='#060C1B')

# ==================== STEP 1: INTERIOR CAVITY (BACK WALLS & FLOOR) ====================
c_fl = pt(2.5, 24.0, 3.5)
c_fr = pt(2.5, 2.0, 3.5)
c_rr = pt(46.0, 2.0, 3.5)
c_rl = pt(46.0, 24.0, 3.5)
draw.polygon([c_fl, c_fr, c_rr, c_rl], fill='#1E293B', outline='#334155')

far_in = [
    pt(2.5, 24.0, 3.5),
    pt(46.0, 24.0, 3.5),
    pt(46.0, 24.0, 30.0),
    pt(2.5, 24.0, 30.0)
]
draw.polygon(far_in, fill='#334155', outline='#475569')

rear_in = [
    pt(46.0, 2.0, 3.5),
    pt(46.0, 24.0, 3.5),
    pt(46.0, 24.0, 30.0),
    pt(46.0, 2.0, 30.0)
]
draw.polygon(rear_in, fill='#222E42', outline='#334155')


# ==================== STEP 2: REAR STOPPER LIP (AT X = 48) ====================
st_bl = pt(46.5, 0, 30.0)
st_br = pt(48.0, 0, 30.0)
st_tr = pt(48.0, 0, 31.2)
st_tl = pt(46.5, 0, 31.2)
draw.polygon([st_bl, st_br, st_tr, st_tl], fill='#F59E0B', outline='#FDE047', width=1)

st_top = [
    pt(46.5, 0, 31.2),
    pt(48.0, 0, 31.2),
    pt(48.0, 26.0, 31.2),
    pt(46.5, 26.0, 31.2)
]
draw.polygon(st_top, fill='#FDE047', outline='#FEF08A')


# ==================== STEP 3: TOP RIM (SOLID CONTINUOUS FRAME) ====================
rim_far = [pt(2.5, 24, 30), pt(46, 24, 30), pt(46, 26, 30), pt(2.5, 26, 30)]
draw.polygon(rim_far, fill='#E2E8F0', outline='#CBD5E1')

rim_rear = [pt(46, 0, 30), pt(48, 0, 30), pt(48, 26, 30), pt(46, 26, 30)]
draw.polygon(rim_rear, fill='#CBD5E1', outline='#94A3B8')

rim_near = [pt(0, 0, 30), pt(48, 0, 30), pt(46, 2, 30), pt(2.5, 2, 30)]
draw.polygon(rim_near, fill='#FFFFFF', outline='#E2E8F0')

rim_front = [pt(0, 0, 30), pt(0, 26, 30), pt(2.5, 24, 30), pt(2.5, 2, 30)]
draw.polygon(rim_front, fill='#FFFFFF', outline='#E2E8F0')


# ==================== STEP 4: FRONT FACE (X = 0, FACING FRONT-LEFT) ====================
v_f_bl = pt(0, 26, 0)
v_f_br = pt(0, 0, 0)
v_f_tr = pt(0, 0, 30)
v_f_tl = pt(0, 26, 30)

draw.polygon([v_f_bl, v_f_br, v_f_tr, v_f_tl], fill='#F1F5F9', outline='#94A3B8', width=2)

# Finger scoop on Front Face
fs_bl = pt(0, 19, 11)
fs_br = pt(0, 7, 11)
fs_tr = pt(0, 7, 19)
fs_tl = pt(0, 19, 19)
draw.polygon([fs_bl, fs_br, fs_tr, fs_tl], fill='#CBD5E1', outline='#94A3B8', width=2)

fs_in = [pt(1.5, 18, 12), pt(1.5, 8, 12), pt(1.5, 8, 18), pt(1.5, 18, 18)]
draw.polygon(fs_in, fill='#94A3B8')


# ==================== STEP 5: CONTINUOUS SEAMLESS SIDE WALL (Y = 0, FACING FRONT-RIGHT) ====================
v_r_br = pt(48, 0, 0)
v_r_tr = pt(48, 0, 30)

draw.polygon([v_f_br, v_r_br, v_r_tr, v_f_tr], fill='#E2E8F0', outline='#94A3B8', width=2)
draw.polygon([v_f_br, v_r_br, pt(48, 0, 14), pt(0, 0, 14)], fill='#CBD5E1')

# Guide Rail (Rib)
gr_bl = pt(2, -1.0, 14.6)
gr_br = pt(46, -1.0, 14.6)
gr_tr = pt(46, -1.0, 15.4)
gr_tl = pt(2, -1.0, 15.4)
draw.polygon([gr_bl, gr_br, gr_tr, gr_tl], fill='#0284C7', outline='#38BDF8', width=1)

gr_top = [
    pt(2, 0, 15.4),
    pt(46, 0, 15.4),
    pt(46, -1.0, 15.4),
    pt(2, -1.0, 15.4)
]
draw.polygon(gr_top, fill='#38BDF8', outline='#7DD3FC')

gr_front = [
    pt(2, 0, 14.6),
    pt(2, -1.0, 14.6),
    pt(2, -1.0, 15.4),
    pt(2, 0, 15.4)
]
draw.polygon(gr_front, fill='#0369A1')


# ==================== STEP 6: COLORFUL CAPSULES VISIBLE AT THE BRIM ====================
caps = [
    (10, 16, 21.0, '#3B82F6', '#EF4444'),
    (18, 10, 22.5, '#10B981', '#F59E0B'),
    (26, 17, 21.0, '#8B5CF6', '#EC4899'),
    (34, 11, 22.0, '#06B6D4', '#F97316'),
    (40, 18, 22.5, '#EF4444', '#FDE047'),
    (14, 12, 25.5, '#F59E0B', '#3B82F6'),
    (22, 18, 26.0, '#10B981', '#8B5CF6'),
    (30, 12, 25.5, '#EC4899', '#06B6D4'),
    (38, 16, 26.5, '#3B82F6', '#10B981'),
    (18, 15, 28.0, '#EF4444', '#FFFFFF'),
    (28, 14, 28.2, '#F59E0B', '#EF4444'),
]
for px, py, pz, c1, c2 in caps:
    cp = pt(px, py, pz)
    draw.ellipse([(cp[0]-16, cp[1]-7), (cp[0]+16, cp[1]+7)], fill=c1, outline='#FFFFFF', width=1)
    draw.ellipse([(cp[0]-2, cp[1]-7), (cp[0]+16, cp[1]+7)], fill=c2, outline='#FFFFFF', width=1)
    draw.line([(cp[0]-8, cp[1]-2), (cp[0]+8, cp[1]-2)], fill='#FFFFFF', width=1)


# ==================== STEP 7: CALLOUT ANNOTATIONS & LEADER LINES ====================

# 1. Seamless Side Wall Callout
sw_pt = pt(25, 0, 8)
draw.line([(sw_pt[0], sw_pt[1]), (sw_pt[0] + 160, sw_pt[1] + 50)], fill='#34D399', width=2)
draw.line([(sw_pt[0] + 160, sw_pt[1] + 50), (sw_pt[0] + 560, sw_pt[1] + 50)], fill='#34D399', width=2)
draw.ellipse([(sw_pt[0]-4, sw_pt[1]-4), (sw_pt[0]+4, sw_pt[1]+4)], fill='#34D399')
draw.text((sw_pt[0] + 170, sw_pt[1] + 15), 'THÀNH HÔNG PHẲNG TẮP LIỀN MẠCH (SEAMLESS)', fill='#34D399', font=font_bold)
draw.text((sw_pt[0] + 170, sw_pt[1] + 58), '✔ Đã xóa bỏ hoàn toàn bậc thang giật cấp xấu xí', fill='#FFFFFF', font=font_label)
draw.text((sw_pt[0] + 170, sw_pt[1] + 85), '✔ Thành phẳng phiu 100% từ mặt trước ra đuôi sau suốt 48mm', fill='#CBD5E1', font=font_label)

# 2. Guide Rail Callout
gr_pt = pt(24, -1.0, 15.4)
draw.line([(gr_pt[0], gr_pt[1]), (gr_pt[0] + 140, gr_pt[1] - 80)], fill='#38BDF8', width=2)
draw.line([(gr_pt[0] + 140, gr_pt[1] - 80), (gr_pt[0] + 520, gr_pt[1] - 80)], fill='#38BDF8', width=2)
draw.ellipse([(gr_pt[0]-4, gr_pt[1]-4), (gr_pt[0]+4, gr_pt[1]+4)], fill='#38BDF8')
draw.text((gr_pt[0] + 150, gr_pt[1] - 115), 'GÂN TRƯỢT DẪN HƯỚNG ĐÚC LIỀN (GUIDE RIB)', fill='#38BDF8', font=font_bold)
draw.text((gr_pt[0] + 150, gr_pt[1] - 72), '✔ Kích thước: Nhô 1.0mm × Cao 0.8mm (Chạy thẳng tắp)', fill='#FFFFFF', font=font_label)
draw.text((gr_pt[0] + 150, gr_pt[1] - 45), '✔ Giúp khay trượt nhẹ, vào ra thẳng trục, không rung lắc', fill='#CBD5E1', font=font_label)

# 3. Rear Wall Stopper Lip Callout
st_pt = pt(47.2, 0, 31.2)
draw.line([(st_pt[0], st_pt[1]), (st_pt[0] + 120, st_pt[1] - 100)], fill='#F59E0B', width=2)
draw.line([(st_pt[0] + 120, st_pt[1] - 100), (st_pt[0] + 480, st_pt[1] - 100)], fill='#F59E0B', width=2)
draw.ellipse([(st_pt[0]-4, st_pt[1]-4), (st_pt[0]+4, st_pt[1]+4)], fill='#F59E0B')
draw.text((st_pt[0] + 130, st_pt[1] - 135), 'VÁCH ĐUÔI VUÔNG & VẤU CẢN 1.2 mm', fill='#FBBF24', font=font_bold)
draw.text((st_pt[0] + 130, st_pt[1] - 92), '✔ Vách sau thẳng đứng vuông góc 90°, khép kín 100%', fill='#FFFFFF', font=font_label)
draw.text((st_pt[0] + 130, st_pt[1] - 65), '✔ Vấu cản tinh gọn ở mép trên, ngăn kéo tuột ra ngoài', fill='#CBD5E1', font=font_label)

# 4. Bottom Floor Callout (placed with generous vertical distance)
bf_pt = pt(35, 0, 0)
draw.line([(bf_pt[0], bf_pt[1]), (bf_pt[0] + 40, bf_pt[1] + 140)], fill='#FDE047', width=2)
draw.line([(bf_pt[0] + 40, bf_pt[1] + 140), (bf_pt[0] + 370, bf_pt[1] + 140)], fill='#FDE047', width=2)
draw.ellipse([(bf_pt[0]-4, bf_pt[1]-4), (bf_pt[0]+4, bf_pt[1]+4)], fill='#FDE047')
draw.text((bf_pt[0] + 50, bf_pt[1] + 105), 'MẶT SÀN ĐÁY PHẲNG TẮP 100%', fill='#FDE047', font=font_bold)
draw.text((bf_pt[0] + 50, bf_pt[1] + 148), '✔ Đáy dày 2.0mm phẳng phiu suốt chiều sâu 48mm', fill='#FFFFFF', font=font_label)
draw.text((bf_pt[0] + 50, bf_pt[1] + 175), '✔ Tuyệt đối không giật cấp thụt thò ở phần đuôi', fill='#CBD5E1', font=font_label)

# 5. Front Pull Handle Callout
fp_pt = pt(0, 13, 15)
draw.line([(fp_pt[0], fp_pt[1]), (fp_pt[0] - 130, fp_pt[1] - 100)], fill='#A78BFA', width=2)
draw.line([(fp_pt[0] - 130, fp_pt[1] - 100), (fp_pt[0] - 440, fp_pt[1] - 100)], fill='#A78BFA', width=2)
draw.ellipse([(fp_pt[0]-4, fp_pt[1]-4), (fp_pt[0]+4, fp_pt[1]+4)], fill='#A78BFA')
draw.text((fp_pt[0] - 430, fp_pt[1] - 135), 'HỐC TÌ NGÓN TAY CÔNG THÁI HỌC', fill='#C4B5FD', font=font_bold)
draw.text((fp_pt[0] - 430, fp_pt[1] - 92), '✔ Khoét âm vào mặt trước, kéo rút nhẹ nhàng', fill='#FFFFFF', font=font_label)
draw.text((fp_pt[0] - 430, fp_pt[1] - 65), '✔ Chuẩn mặt ngoài: Rộng 26.0 × Cao 30.0 mm', fill='#CBD5E1', font=font_label)

# Dimensions on 3D model
dim_l1 = pt(0, -6, 0)
dim_l2 = pt(48, -6, 0)
draw.line([dim_l1, dim_l2], fill='#34D399', width=2)
draw.polygon([(dim_l1[0], dim_l1[1]), (dim_l1[0]+6, dim_l1[1]-3), (dim_l1[0]+6, dim_l1[1]+3)], fill='#34D399')
draw.polygon([(dim_l2[0], dim_l2[1]), (dim_l2[0]-6, dim_l2[1]-3), (dim_l2[0]-6, dim_l2[1]+3)], fill='#34D399')
draw.text(((dim_l1[0]+dim_l2[0])//2 - 50, (dim_l1[1]+dim_l2[1])//2 + 15), 'L = 48.0 mm', fill='#34D399', font=font_dim)

dim_w1 = pt(-6, 0, 0)
dim_w2 = pt(-6, 26, 0)
draw.line([dim_w1, dim_w2], fill='#38BDF8', width=2)
draw.polygon([(dim_w1[0], dim_w1[1]), (dim_w1[0]+3, dim_w1[1]-5), (dim_w1[0]-3, dim_w1[1]+5)], fill='#38BDF8')
draw.polygon([(dim_w2[0], dim_w2[1]), (dim_w2[0]+3, dim_w2[1]-5), (dim_w2[0]-3, dim_w2[1]+5)], fill='#38BDF8')
draw.text(((dim_w1[0]+dim_w2[0])//2 - 100, (dim_w1[1]+dim_w2[1])//2 + 10), 'W = 26.0 mm', fill='#38BDF8', font=font_dim)

# Vertical height dimension: placed clearly on the far left with clearance
dim_h1 = pt(0, 52, 0)
dim_h2 = pt(0, 52, 30)
draw.line([dim_h1, dim_h2], fill='#FDE047', width=2)
draw.polygon([(dim_h1[0], dim_h1[1]), (dim_h1[0]-3, dim_h1[1]-6), (dim_h1[0]+3, dim_h1[1]-6)], fill='#FDE047')
draw.polygon([(dim_h2[0], dim_h2[1]), (dim_h2[0]-3, dim_h2[1]+6), (dim_h2[0]+3, dim_h2[1]+6)], fill='#FDE047')
draw.text((dim_h1[0] - 130, (dim_h1[1]+dim_h2[1])//2 - 12), 'H = 30.0 mm', fill='#FDE047', font=font_dim)

# Summary Specs Card (Bottom Left)
draw.rectangle([(50, H - 240), (520, H - 40)], fill='#131F37', outline='#34D399', width=2)
draw.text((70, H - 225), 'THÔNG SỐ KHẮC PHỤC TRIỆT ĐỂ:', fill='#34D399', font=font_bold)
draw.text((70, H - 190), '• Thành hông: Phẳng lì 100%, không bậc thang', fill='#FFFFFF', font=font_badge)
draw.text((70, H - 160), '• Đáy khay: Phẳng tắp suốt chiều sâu 48mm', fill='#FFFFFF', font=font_badge)
draw.text((70, H - 130), '• Đuôi sau: Liền khối vuông vức, kín kẽ 90°', fill='#FFFFFF', font=font_badge)
draw.text((70, H - 100), '• Hành trình trượt: 25.0mm (Chống rơi 100%)', fill='#38BDF8', font=font_badge)
draw.text((70, H - 70), '• Dung tích: Chứa 12 - 15 viên nang con nhộng', fill='#FDE047', font=font_badge)

# Output Path
out_path = 'd:/DIA+/calendia_seamless_drawer_render.png'
img.save(out_path, quality=95)
print(f'Successfully generated: {out_path}')
