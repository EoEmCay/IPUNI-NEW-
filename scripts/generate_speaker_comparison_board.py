import os
from PIL import Image, ImageDraw, ImageFont

# Board Canvas: 2400 x 1400 High-Res Comparison Graphic
W, H = 2400, 1400
board = Image.new('RGB', (W, H), color='#0B132B')
draw = ImageDraw.Draw(board)

# Load Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 42)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
font_opt_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)
font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)
font_heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
font_body = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 17)
font_dim = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)

# Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

draw.rectangle([(25, 25), (W-25, H-25)], outline='#1E3A8A', width=2)

# Header
draw.rectangle([(50, 40), (W-50, 140)], fill='#152238', outline='#38BDF8', width=2)
draw.text((80, 52), 'SO SÁNH 3 PHƯƠNG ÁN THIẾT KẾ DẢI LOA ÂM THANH CALENDIA+', fill='#FFFFFF', font=font_title)
draw.text((80, 102), 'MỤC ĐÍCH: PHÁT LOA BÁO GIỜ UỐNG THUỐC (78 - 82 dB) • TẬN DỤNG VÙNG TRỐNG TRÁN TRÊN MÁY • CHUẨN IN 3D PETG FDM', fill='#FBBF24', font=font_subtitle)

# 3 Columns Setup
col_w = 720
gap = 40
start_x = 60
col_y = 165
col_h = 1190

options = [
    {
        'id': 'PHƯƠNG ÁN 1',
        'badge': 'KHUYÊN DÙNG NHẤT (RECOMMENDED)',
        'badge_bg': '#0284C7',
        'title': 'DẢI RÃNH ÂM THANH SÓNG ÂM GAUSS',
        'subtitle': 'Dynamic Waveform Slits (Phong cách Apple / Braun)',
        'full_img': 'd:/DIA+/calendia_3d_speaker_opt1_waveform_full.jpg',
        'crop_img': 'd:/DIA+/calendia_3d_speaker_opt1_waveform_closeup.jpg',
        'pros': [
            '33 rãnh âm đứng uốn lượn hình chuông sóng âm tuyệt đẹp.',
            'Tối ưu khí động học và âm học: buồng củ loa Ø28mm đặt tại tâm.',
            'In FDM siêu dễ: Miệng rãnh vát côn 45°, không cần Support.',
            'Rãnh sọc đứng chống bám bụi và dễ lau chùi vệ sinh y tế.'
        ],
        'specs': 'W: 160 mm • H: 26 mm • 33 Khe 2.2×(6-20) mm • PETG Trắng sứ'
    },
    {
        'id': 'PHƯƠNG ÁN 2',
        'badge': 'CHUẨN THIẾT BỊ Y TẾ (CLINICAL GRADE)',
        'badge_bg': '#0D9488',
        'title': 'MA TRẬN VI LỖ TỔ ONG CÔNG NGHỆ CAO',
        'subtitle': 'Precision Hexagonal Micro-Mesh Grille',
        'full_img': 'd:/DIA+/calendia_3d_speaker_opt2_micromesh_full.jpg',
        'crop_img': 'd:/DIA+/calendia_3d_speaker_opt2_micromesh_closeup.jpg',
        'pros': [
            'Hơn 280 vi lỗ tròn Ø 2.0 mm xếp so le tổ ong mật độ cao.',
            'Âm thanh khuếch tán đồng đều 360°, giọng nói tiếng Việt vang ấm.',
            'Có vòng tròn đồng tâm định vị củ loa và nhận diện DIA+ Sound.',
            'Phong cách thiết bị phòng khám chuyên sâu, nghiêm túc, tinh xảo.'
        ],
        'specs': 'W: 162 mm • H: 26 mm • 280 Lỗ Ø 2.0 mm • Khoang âm kín 16.5 cm³'
    },
    {
        'id': 'PHƯƠNG ÁN 3',
        'badge': 'ĐA GIÁC QUAN (AUDIO + SMART GLOW)',
        'badge_bg': '#7C3AED',
        'title': 'HORIZON SOUNDBAR NẸP CYAN & ĐÈN BÁO',
        'subtitle': 'Horizon Acoustic Soundbar with Smart Glow Indicator',
        'full_img': 'd:/DIA+/calendia_3d_speaker_opt3_soundbar_full.jpg',
        'crop_img': 'd:/DIA+/calendia_3d_speaker_opt3_soundbar_closeup.jpg',
        'pros': [
            'Thanh nẹp Cyan y tế (#0077D8) làm điểm nhấn sang trọng.',
            'Tích hợp dải đèn LED báo cữ thuốc nhấp nháy đồng bộ với tiếng chuông.',
            'Hỗ trợ đắc lực cho người cao tuổi nặng tai hoặc khi phòng ngủ ồn ào.',
            '3 tầng rãnh thoát âm nằm ngang phân tầng hiện đại.'
        ],
        'specs': 'W: 165 mm • H: 26 mm • 3 Hàng rãnh ngang • Dải LED Cyan đồng bộ'
    }
]

for idx, opt in enumerate(options):
    cx = start_x + idx * (col_w + gap)
    
    # Outer Column Card
    draw.rectangle([(cx, col_y), (cx + col_w, col_y + col_h)], fill='#101C36', outline='#2563EB', width=2)
    # Header bar
    draw.rectangle([(cx, col_y), (cx + col_w, col_y + 80)], fill='#162544')
    
    # Badge
    draw.rectangle([(cx + 25, col_y + 14), (cx + 360, col_y + 40)], fill=opt['badge_bg'])
    draw.text((cx + 35, col_y + 17), opt['badge'], fill='#FFFFFF', font=font_badge)
    
    # Title
    draw.text((cx + 25, col_y + 46), opt['title'], fill='#FFFFFF', font=font_opt_title)
    
    # Image 1: Close-up matching user's Image 2 (Zoomed on the forehead)
    crop_im = Image.open(opt['crop_img'])
    # Resize to display nicely: original is 433 x 281 -> display at 670 x 435
    crop_disp = crop_im.resize((670, 435), Image.LANCZOS)
    board.paste(crop_disp, (cx + 25, col_y + 95))
    draw.rectangle([(cx + 25, col_y + 95), (cx + 25 + 670, col_y + 95 + 435)], outline='#38BDF8', width=2)
    draw.text((cx + 35, col_y + 105), 'ẢNH CẬN CẢNH (GÓC NHÌN ẢNH 2 BẠN GỬI)', fill='#38BDF8', font=font_badge)
    
    # Image 2: Full Machine Context
    full_im = Image.open(opt['full_img'])
    full_disp = full_im.resize((670, 360), Image.LANCZOS)
    board.paste(full_disp, (cx + 25, col_y + 545))
    draw.rectangle([(cx + 25, col_y + 545), (cx + 25 + 670, col_y + 545 + 360)], outline='#64748B', width=2)
    draw.text((cx + 35, col_y + 555), 'PHỐI CẢNH TOÀN THỂ MÁY TRONG KHÔNG GIAN 3D', fill='#E2E8F0', font=font_badge)
    
    # Pros & Highlights box
    draw.rectangle([(cx + 25, col_y + 920), (cx + col_w - 25, col_y + 1120)], fill='#152238', outline='#334155', width=1)
    draw.text((cx + 40, col_y + 932), 'ĐẶC TÍNH CƠ HỌC & ÂM HỌC NỔI BẬT:', fill='#FBBF24', font=font_heading)
    for p_idx, pro in enumerate(opt['pros']):
        draw.text((cx + 40, col_y + 965 + p_idx * 35), f'✔  {pro}', fill='#CBD5E1', font=font_body)
    
    # Spec footer bar
    draw.rectangle([(cx + 25, col_y + 1130), (cx + col_w - 25, col_y + 1175)], fill='#1E293B', outline='#38BDF8', width=1)
    draw.text((cx + 40, col_y + 1142), opt['specs'], fill='#38BDF8', font=font_dim)

out_comp = 'd:/DIA+/calendia_speaker_options_comparison.png'
board.save(out_comp, quality=95)
print(f"Comparison board saved to {out_comp}!")
