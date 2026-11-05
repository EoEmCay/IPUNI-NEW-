file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part2 = """### PART [2]: 28 Ngăn Kéo Đựng Thuốc Kín Khít (Đã Hiệu Chỉnh Chiều Cao Chuẩn 30.0 mm Theo Ảnh)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết Chiều Cao Chuẩn:
![Bản vẽ 3D Ngăn kéo hiệu chỉnh chiều cao 30mm CalenDIA+](calendia_medicine_drawer_corrected_30mm_cad_render.jpg)
*(Mô hình 3D CAD Cận cảnh ngăn kéo CalenDIA+ đã được hiệu chỉnh chiều cao chuẩn 30.0 mm hình chữ nhật đứng 1:1.15 theo đúng ảnh mẫu, lòng sâu 26.5 mm chứa 12-15 viên thuốc)*

![Bản vẽ kỹ thuật hiệu chỉnh chiều cao hộc thuốc](ban_ve_hieu_chinh_chieu_cao_hoc_thuoc_cad.png)
*(Bản vẽ bóc tách so sánh bản cũ 20mm bị lùn vs bản chuẩn 30mm, chứng minh toán học khớp 4 hàng trên khung 180mm và mặt cắt sâu lòng 26.5mm)*

---

### Phân Tích & Hiệu Chỉnh: Khắc Phục Lỗi "Hộc Bị Thấp / Lùn" So Với Ảnh Mẫu

Nhận xét của bạn hoàn toàn chính xác! Trong các bản phác thảo sơ bộ trước đây, hộc thuốc được gán chiều cao $20.0\text{ mm}$ và chiều rộng $26.0\text{ mm}$ (khiến khay trở thành hình chữ nhật nằm ngang dẹt, tỷ lệ $H/W = 0.77$ nên nhìn bị lùn và thấp hơn nhiều so với ảnh thực tế).

Khi phân tích tỷ lệ giải phẫu trên ảnh console CalenDIA+ kích thước **Rộng 230 mm × Cao 180 mm**:
* **Tổng chiều cao vỏ máy:** $180.0\text{ mm}$.
* Trừ cụm màn hình đỉnh & hàng chữ thứ: $\sim 38.0\text{ mm}$.
* Trừ phần chân đế vát logo D+ ở đáy: $\sim 14.5\text{ mm}$.
* Trừ 3 gân ngăn cách giữa 4 hàng ($3 \times 2.5\text{ mm}$): $7.5\text{ mm}$.
* **Khoảng chiều cao thực tế dành cho 4 hàng hộc thuốc:** $180 - 38 - 14.5 - 7.5 = 120.0\text{ mm}$!
* **Do đó, chiều cao chuẩn xác của mỗi hộc thuốc bắt buộc phải là:** **$120.0\text{ mm} / 4\text{ hàng} = 30.0\text{ mm}$**!

---

### Bảng Kích Thước Hình Học Đã Hiệu Chỉnh Chuẩn Xác 100% Theo Ảnh

| Thông số hình học | Bản cũ (Bị thấp) | **BẢN HIỆU CHỈNH CHUẨN MỚI** | Ý nghĩa công thái học & Thẩm mỹ |
| :--- | :---: | :---: | :--- |
| **1. Chiều Cao phủ bì khay (H)** | $20.0\text{ mm}$ | **$H = 30.0\text{ mm}$** *(Tăng $+10\text{ mm}$)* | **Đúng chuẩn hình chữ nhật đứng $1:1.15$ y hệt ảnh mẫu.** |
| **2. Chiều Sâu lòng từ miệng xuống đáy** | $16.5\text{ mm}$ | **$H_{\text{lòng}} = 26.5\text{ mm}$** *(Tăng $+10\text{ mm}$)* | **Khoang thuốc cực sâu, chứa được 2 tầng thuốc (12-15 viên lớn).** |
| **3. Chiều Rộng phủ bì khay (W)** | $26.0\text{ mm}$ | **$W = 26.0\text{ mm}$** *(Giữ nguyên)* | Khớp hoàn hảo với 7 cột (Thứ Hai – Chủ Nhật) trên chiều rộng 230mm. |
| **4. Chiều Rộng lọt lòng trong (W_in)** | $22.4\text{ mm}$ | **$W_{\text{lòng}} = 22.0\text{ mm}$** | Thành khay dày $2.0\text{ mm}$ cứng cáp, chịu va đập tốt. |
| **5. Chiều Dài / Sâu trượt phủ bì (L)** | $48.0\text{ mm}$ | **$L = 48.0\text{ mm}$** *(Giữ nguyên)* | Trượt trọn vẹn trong hộc tổ ong sâu $50.0\text{ mm}$. |
| **6. Chiều Dài lọt lòng trong (L_in)** | $42.0\text{ mm}$ | **$L_{\text{lòng}} = 43.0\text{ mm}$** | Xếp vừa 2 hàng viên nang dài $21\text{ mm}$ nối đuôi nhau. |
| **7. Hốc tì ngón tay mặt trước** | Sâu $1.8\text{ mm}$ | **$14.0 \times 6.0\text{ mm} \times$ sâu $1.8\text{ mm}$** | Hốc lõm hình con nhộng âm mặt, tì ngón tay rút khay nhẹ nhàng. |
| **8. Khoảng cách thò ra khi mở (Ảnh)** | $25.0\text{ mm}$ | **$25.0\text{ mm}$** *(~52% chiều dài)* | Thò ra $25\text{ mm}$, ngậm lại trong hộc $23\text{ mm}$ chống xệ khay. |
| **9. Thể tích lòng chứa thuốc thực tế** | $15.5\text{ cm}^3$ | **$25.0\text{ cm}^3$ (Tăng +61%)** | Chứa thoải mái cả viên sủi C hoặc vỉ thuốc cắt nhỏ. |"""

start_tag = "### PART [2]:"
end_tag = "### PART [3]:"

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_part2 + "\n\n---\n\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print(f"Error: indices {start_idx}, {end_idx}")
