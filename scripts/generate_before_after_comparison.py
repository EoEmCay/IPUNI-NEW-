import os
from PIL import Image, ImageDraw, ImageFont

# Canvas Setup: 1800 x 950
W, H = 1800, 950
canvas = Image.new('RGB', (W, H), color='#0B132B')
draw = ImageDraw.Draw(canvas)

# Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 36)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
font_card_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 16)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 17)

# Grid
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#132038', width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#132038', width=1)

draw.rectangle([(25, 25), (W-25, H-25)], outline='#1E3A8A', width=2)

# Header
draw.rectangle([(50, 40), (W-50, 130)], fill='#152238', outline='#38BDF8', width=2)
draw.text((75, 50), 'ĐỐI CHIẾU KHẮC PHỤC LỖI CAD: DẢI LOA ÂM THANH TRÊN HỘP THUỐC CALENDIA+', fill='#FFFFFF', font=font_title)
draw.text((75, 95), 'SỬA LỖI ĐÙN NHÔ LƠ LỬNG LÊN TRỜI ➔ ĐƯA DẢI LOA 4 TẦNG RÃNH ÂM ỐP PHẲNG LÌ TRÊN THÂN MÁY', fill='#FBBF24', font=font_subtitle)

# Two Panels: Left (Error), Right (Fixed)
card_w = 810
card_h = 760
card_y = 155

# Left Card: ERROR (Bị lỗi trong CAD)
cx1 = 60
draw.rectangle([(cx1, card_y), (cx1 + card_w, card_y + card_h)], fill='#101C36', outline='#EF4444', width=2)
draw.rectangle([(cx1, card_y), (cx1 + card_w, card_y + 60)], fill='#7F1D1D')
draw.text((cx1 + 25, card_y + 16), '❌ ẢNH BỊ LỖI TRONG CAD (TẤM LOA BỊ BẮN LÊN TRỜI)', fill='#FCA5A5', font=font_card_title)

# Load user error image
err_im = Image.open('C:/Users/lekho/.gemini/antigravity/brain/2656d953-bd81-4a95-979a-d68f457ab300/.user_uploaded/media_1793891386171_fd7034ca.jpg')
err_disp = err_im.resize((760, 520), Image.LANCZOS)
canvas.paste(err_disp, (cx1 + 25, card_y + 80))
draw.rectangle([(cx1 + 25, card_y + 80), (cx1 + 25 + 760, card_y + 80 + 520)], outline='#DC2626', width=2)

# Error Explanation Box
draw.rectangle([(cx1 + 25, card_y + 615), (cx1 + card_w - 25, card_y + card_h - 20)], fill='#1A1528', outline='#EF4444', width=1)
draw.text((cx1 + 40, card_y + 625), 'NGUYÊN NHÂN GÂY LỖI TRONG PHẦN MỀM CAD:', fill='#F87171', font=font_bold)
draw.text((cx1 + 40, card_y + 655), '• Chọn nhầm Sketch Plane ở cạnh vát đỉnh hoặc mặt phẳng đứng (Top/Front Plane).\n• Dùng lệnh Extrude Boss nhô ra ngoài thay vì lệnh Extrude Cut cắt âm vào vỏ.\n• Màng loa bị đùn bay lơ lửng ngoài không gian, bỏ trống vùng trán trên hộp thuốc.', fill='#E2E8F0', font=font_label)

# Right Card: FIXED (Đã sửa chuẩn 100%)
cx2 = 930
draw.rectangle([(cx2, card_y), (cx2 + card_w, card_y + card_h)], fill='#101C36', outline='#10B981', width=2)
draw.rectangle([(cx2, card_y), (cx2 + card_w, card_y + 60)], fill='#064E3B')
draw.text((cx2 + 25, card_y + 16), '✔ BẢN CAD ĐÃ SỬA CHUẨN XÁC 100% (ỐP PHẲNG LÌ TRÊN HỘP THUỐC)', fill='#6EE7B7', font=font_card_title)

# Load fixed image (crop matching Image 2)
fix_im = Image.open('d:/DIA+/calendia_3d_speaker_user_fixed_closeup.jpg')
fix_disp = fix_im.resize((760, 520), Image.LANCZOS)
canvas.paste(fix_disp, (cx2 + 25, card_y + 80))
draw.rectangle([(cx2 + 25, card_y + 80), (cx2 + 25 + 760, card_y + 80 + 520)], outline='#10B981', width=2)

# Fix Explanation Box
draw.rectangle([(cx2 + 25, card_y + 615), (cx2 + card_w - 25, card_y + card_h - 20)], fill='#132822', outline='#10B981', width=1)
draw.text((cx2 + 40, card_y + 625), 'GIẢI PHÁP KHẮC PHỤC CHUẨN KỸ THUẬT CAD & IN 3D:', fill='#34D399', font=font_bold)
draw.text((cx2 + 40, card_y + 655), '• Chọn trực tiếp bề mặt nghiêng 75° trán máy làm mặt phẳng phác thảo (Sketch Plane).\n• Dùng lệnh Extrude Cut âm sâu 2.0 mm để tạo rãnh thoát âm thực tế cho củ loa bên trong.\n• 4 tầng rãnh âm hình thang ngược + Logo CalenDIA+ ôm khít thân máy, thẩm mỹ hoàn hảo.', fill='#E2E8F0', font=font_label)

out_comp = 'd:/DIA+/calendia_speaker_error_vs_fixed.png'
canvas.save(out_comp, quality=95)
print(f"Comparison saved to {out_comp}!")
