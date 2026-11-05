file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part3 = """### PART [3]: Khung Xương Tổ Ong Dẫn Hướng Nguyên Khối (Monolithic Honeycomb Core Guide Grid)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết:
![Bản vẽ 3D Khung tổ ong dẫn hướng CalenDIA+](calendia_monolithic_honeycomb_core_render.jpg)
*(Mô hình 3D CAD Khung xương tổ ong nguyên khối 7x4 = 28 hộc dẫn hướng, kích thước 222 × 102 × 46 mm, tích hợp rãnh trượt âm, vách chắn sáng quang học và cửa sổ xuyên sáng LED)*

![Bản vẽ kỹ thuật chi tiết Khung tổ ong dẫn hướng](ban_ve_chi_tiet_khung_to_ong_cad.png)
*(Bản vẽ bóc tách hình chiếu đứng, mặt cắt dọc A-A và bảng dung sai lắp ghép chi tiết của Khung tổ ong Part 3)*

* **Chức năng:** Khung xương chịu lực trung tâm (Core Backbone), tích hợp liền khối ma trận 28 hộc dẫn hướng trượt độc lập cho 28 ngăn kéo, cách ly quang học chống lem sáng giữa các ngăn, chịu lực ấn tì tay từ mặt trước và liên kết vững chắc vỏ máy.
* **Kích thước ngoài phủ bì:** **Rộng 222.0 mm × Cao 102.0 mm × Sâu 46.0 mm** (Phù hợp hoàn hảo với bàn in 3D FDM $235 \\times 235\\text{ mm}$ phổ thông).
* **Kết cấu chi tiết:**
  * **28 Khoang trượt chữ nhật lọt lòng:** **Rộng 26.5 mm × Cao 20.5 mm × Sâu 46.0 mm** (khe hở trượt $\\Delta = 0.5\\text{ mm}$, mỗi bên $0.25\\text{ mm}$ so với ngăn kéo $26.0 \\times 20.0\\text{ mm}$, trượt siêu êm không rung lắc).
  * **Vách ngăn quang học tổ ong (Optical Isolation Ribs):** Độ dày **$t = 2.0\\text{ mm}$** (vách trong) và **$t = 2.5\\text{ mm}$** (thành ngoài). Vách kín đặc 100% giúp triệt tiêu hiện tượng lem sáng (*Optical Crosstalk*), đảm bảo khi 1 ngăn bật đèn LED báo uống thuốc thì các ô bên cạnh hoàn toàn tối đen.
  * **Cửa sổ xuyên quang sau lưng:** 28 lỗ vuông kích thước **$14.0\\text{ mm} \\times 14.0\\text{ mm}$** ở đáy mỗi hộc, cho phép luồng ánh sáng LED WS2812B chiếu thẳng trực tiếp vào đuôi ngăn kéo PP mờ.
  * **Ray dẫn hướng trượt âm & Gờ chặn hành trình (Pull-out Stopper):**
    * 2 ray dẫn hướng dày $0.8\\text{ mm} \\times 1.0\\text{ mm}$ chạy dọc chiều sâu thành bên của từng hộc.
    * Gờ chặn nhô cao $1.2\\text{ mm}$ ở mép trước phía trên đón đầu vấu cản của ngăn kéo, ngăn khay thuốc bị tuột rơi ra ngoài khi người dùng rút nhanh.
  * **Tai gá định vị (Mounting Flanges):** 6 tai bắt ốc gia cường với lỗ xuyên **$\\varnothing 3.2\\text{ mm}$** (bắt vít Inox M3) liên kết chặt chẽ vào các trụ ren đồng của mặt trước Part 1.
* **Vật liệu gia công:**
  * **In 3D FDM làm mẫu:** Nhựa **PETG** màu Trắng sứ hoặc Xám kỹ thuật (Độ co ngót $<0.4\\%$, chịu lực nén $>50\\text{ kg}$, không cong vênh).
  * **Sản xuất khuôn đúc hàng loạt:** Nhựa **ABS/HIPS** nguyên sinh gia cường (Chi phí ép đúc chỉ ~12.000đ/khung).
* **Thông số Slicer in 3D FDM:** Chiều cao lớp $0.20\\text{ mm}$, 4 lớp thành vỏ (Perimeters), ruột in $25\\%\\text{ Gyroid}$, đặt nằm phẳng úp mặt đáy xuống bàn in PEI nhám, **hoàn toàn không cần tạo Support**."""

start_tag = "### PART [3]:"
end_tag = "### PART [4]:"

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_part3 + "\n\n---\n\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print(f"Error: indices {start_idx}, {end_idx}")
