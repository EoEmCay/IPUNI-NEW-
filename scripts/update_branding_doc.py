import os

doc_path = 'd:/DIA+/ban_ve_chi_tiet_cad_calendia_plus.md'
with open(doc_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace section 1 branding
old_needle = '* **Bộ nhận diện Logo thương hiệu:**'
if old_needle in text:
    # Find start and end of branding section
    start = text.find(old_needle)
    end = text.find('* **Mục tiêu công thái học (Ergonomics):**', start)
    if start != -1 and end != -1:
        new_branding = """* **Bộ nhận diện Logo thương hiệu CalenDIA+ & DIAPLUS:**
  * **Biểu tượng chính CalenDIA+:** Chữ `C` cách điệu dải sóng năng lượng xanh ngọc (Cyan `#0077D8` - `#38BDF8`) ôm trọn biểu tượng cuốn lịch số, kết hợp kiểu chữ typographic navy hoàng gia `alenDIA+`.
  * **Biểu tượng hệ sinh thái:** Chữ `D+` màu xanh dương hoàng gia (Royal Blue `#1E40AF`) với dải lượn sóng màu xanh ngọc (Cyan `#38BDF8`) vắt ngang thân chữ.
  * **Định vị trang trí trên sản phẩm (4 Phương án tối ưu hình học):**
    1. **Phương án A (In UV phẳng lì):** In UV trực diện trán máy kèm nhãn 7 ngày trong tuần `T2 - CN` (`calendia_3d_decor_opt1_uv_print.jpg`).
    2. **Phương án B (Dập nổi 3D Bevel & Emboss):** Khắc nổi đa khối cao 0.8 mm bắt sáng vật lý kèm nẹp chỉ Cyan (`calendia_3d_decor_opt2_3d_embossed.jpg`).
    3. **Phương án C (Kính OLED thông minh):** Dải kính đen tích hợp logo phát sáng, đồng hồ 08:00 AM và trạng thái cữ thuốc (`calendia_3d_decor_opt3_smart_oled.jpg`).
    4. **Phương án D (Hero Masterpiece):** Logo 3D nổi bật kết hợp vòng LED sáng hộc thuốc cữ uống hiện tại (`calendia_3d_decor_opt4_complete_hero.jpg`).
"""
        text = text[:start] + new_branding + text[end:]
        print("Replaced branding section!")

# Also update Section 2 with new images
old_sec2 = '### Bản Vẽ Mô Hình 3D In PETG Cơ Chế Nhấn-Nhả (Push-to-Open) & Bộ Nhận Diện DIAPLUS:'
if old_sec2 in text:
    start2 = text.find(old_sec2)
    end2 = text.find('```\n◄─────────────────────────── W = 230.0 mm', start2)
    if start2 != -1 and end2 != -1:
        new_gallery = """### Bản Vẽ Mô Hình 3D In PETG Cơ Chế Nhấn-Nhả (Push-to-Open) & Bộ Nhận Diện CalenDIA+:
![CalenDIA+ Hero Masterpiece](calendia_3d_decor_opt4_complete_hero.jpg)
*(Mô hình 3D CalenDIA+ hoàn thiện trang trí: Logo CalenDIA+ dập nổi 3D, hàng nhãn T2-CN, LED chỉ báo cữ thuốc)*

![CalenDIA+ Smart OLED Console](calendia_3d_decor_opt3_smart_oled.jpg)
*(Phương án trang trí Bảng điều khiển OLED thông minh: Logo phát sáng, đồng hồ kỹ thuật số và nhắc giờ uống)*

![CalenDIA+ Studio Photoreal Render](calendia_photoreal_studio_render.jpg)
*(Bản dựng Studio Product Render thực tế của CalenDIA+ đặt trên bàn làm việc)*

![CalenDIA+ Tích Hợp Logo DIAPLUS](calendia_plus_diaplus_brand_render.jpg)
*(Mô hình CalenDIA+ hoàn thiện nhận diện thương hiệu DIAPLUS: Logo D+ dập nổi chân đế, hiển thị OLED thông minh, 28 ngăn kéo nhấn-nhả phẳng lì)*
![Bản vẽ 3D PETG CalenDIA+ Nhấn-Nhả Push-to-Open](calendia_push_to_open_3d_render.jpg)
*(Mô hình CAD in 3D PETG CalenDIA+: Kích thước 230 mm × 180 mm, mặt trước phẳng lì không tay nắm, 1 ngăn kéo búng thò ra ngoài 20 mm sau khi nhấn nhẹ)*

"""
        text = text[:start2] + new_gallery + text[end2:]
        print("Replaced gallery section!")

with open(doc_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Documentation updated successfully!")
