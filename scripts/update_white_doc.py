import os

doc_path = 'd:/DIA+/ban_ve_chi_tiet_cad_calendia_plus.md'
with open(doc_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add White Edition details to Section 2
marker = '### Bản Vẽ Mô Hình 3D In PETG Cơ Chế Nhấn-Nhả (Push-to-Open) & Bộ Nhận Diện CalenDIA+:'
if marker in text:
    start = text.find(marker)
    end = text.find('![CalenDIA+ Tích Hợp Logo DIAPLUS]', start)
    if start != -1 and end != -1:
        new_content = """### Bản Vẽ Mô Hình 3D In PETG Cơ Chế Nhấn-Nhả (Push-to-Open) & Bộ Nhận Diện CalenDIA+:
#### Phiên Bản Phương Án 2 Màu Trắng (CalenDIA+ Porcelain White Edition):
![CalenDIA+ All-White Porcelain Edition](calendia_3d_decor_opt2_all_white_porcelain.jpg)
*(Phương án 2 Màu Trắng: Thân vỏ nhựa PETG trắng sứ y tế, logo CalenDIA+ dập nổi 3D cùng màu trắng tinh tế, nhãn ngày T2-CN bạch kim)*

![CalenDIA+ All-White Hero LED](calendia_3d_decor_opt2_all_white_hero_led.jpg)
*(Phương án 2 Màu Trắng tích hợp đèn LED báo liều cữ uống Thứ 5 - Sáng)*

![CalenDIA+ Porcelain White Studio Photography](calendia_porcelain_white_studio_render.jpg)
*(Ảnh chụp Studio Render sản phẩm thực tế CalenDIA+ phiên bản Trắng Sứ cao cấp)*

#### Các Phương Án Màu Khác:
![CalenDIA+ Hero Masterpiece](calendia_3d_decor_opt4_complete_hero.jpg)
*(Mô hình 3D CalenDIA+ hoàn thiện trang trí: Logo CalenDIA+ dập nổi 3D, hàng nhãn T2-CN, LED chỉ báo cữ thuốc)*

![CalenDIA+ Smart OLED Console](calendia_3d_decor_opt3_smart_oled.jpg)
*(Phương án trang trí Bảng điều khiển OLED thông minh: Logo phát sáng, đồng hồ kỹ thuật số và nhắc giờ uống)*

"""
        text = text[:start] + new_content + text[end:]
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Updated documentation with White Edition successfully!")
