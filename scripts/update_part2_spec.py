file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part2 = """### PART [2]: 28 Ngăn Kéo Đựng Thuốc Kín Khít (Pill Drawers & Cavity Dimensions)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết Độ Sâu:
![Bản vẽ 3D Cận cảnh ngăn kéo thò ra ngoài CalenDIA+](calendia_medicine_drawer_depth_cad_render.jpg)
*(Mô hình 3D CAD Cận cảnh 1 ngăn kéo CalenDIA+ thò ra ngoài 25.0 mm chứa đầy viên nang thuốc, rãnh trượt bên hông, hốc tì ngón tay và các đường kích thước độ sâu chuẩn xác)*

![Bản vẽ kỹ thuật chi tiết độ sâu hộc thuốc](ban_ve_chi_tiet_chieu_sau_hoc_thuoc_cad.png)
*(Bản vẽ bóc tách mặt cắt dọc theo chiều sâu trượt, mặt cắt ngang, hành trình thò ra 25mm và bảng giải thích chi tiết 4 thông số độ sâu của hộc thuốc)*

---

### Giải Thích Rõ Ràng 4 Khái Niệm "Độ Sâu" Của Hộc Thuốc Trên Ảnh

Để sản xuất hoặc đi in 3D chuẩn xác 100% theo đúng ảnh mẫu, hộc thuốc bao gồm 4 thông số độ sâu hình học tách biệt:

1. **Chiều sâu / Chiều dài trượt phủ bì của ngăn kéo:** **$L = 48.0\text{ mm}$**
   * Đây là tổng chiều dài toàn bộ khay tính từ mặt trước phẳng đến thành đuôi sau.
   * Khay dài $48.0\text{ mm}$ trượt lọt trọn vẹn trong hộc tổ ong sâu $50.0\text{ mm}$ của thân máy (chừa $2.0\text{ mm}$ khe hở đáy cho lò xo nén hoặc ánh sáng LED).
2. **Chiều sâu / Chiều dài lọt lòng khoang chứa thuốc (từ trước ra sau):** **$L_{\text{lòng}} = 42.0\text{ mm}$**
   * Trừ đi thành nhựa mặt trước dày $2.5\text{ mm}$ và thành đuôi dày $2.0\text{ mm}$, lòng chứa thuốc dài $42.0\text{ mm}$, đủ xếp vừa 2 hàng viên nang dài $20\text{ mm}$ nối đuôi nhau.
3. **Chiều sâu lòng khay tính từ trên miệng xuống đáy:** **$H_{\text{lòng}} = 16.5\text{ mm}$**
   * Chiều cao phủ bì khay là $20.0\text{ mm}$, đáy khay dày $2.0\text{ mm}$ và mép miệng vát $1.5\text{ mm}$.
   * Độ sâu lòng $16.5\text{ mm}$ kết hợp chiều rộng lòng $22.4\text{ mm}$ tạo thể tích chứa **$15.5\text{ cm}^3$**, chứa thoải mái **6 – 8 viên thuốc nang lớn cỡ 00** (đủ liều thuốc 1 buổi cho bệnh nhân cao huyết áp, tiểu đường).
4. **Chiều sâu của hốc tì ngón tay (Finger Scoop) ở mặt trước:** **Sâu $1.8\text{ mm}$ (Âm mặt)**
   * Kích thước hốc: Dài $14.0\text{ mm} \times$ Rộng $6.0\text{ mm} \times$ **sâu $1.8\text{ mm}$** hình viên thuốc con nhộng.
   * Tạo điểm tì êm ái, bám vân tay chắc chắn giúp người cao tuổi rút khay ra nhẹ nhàng mà không cần dùng móng tay.

---

### Thông Số Hành Trình Kéo Mở Trên Ảnh

* **Khoảng cách thò ra ngoài khi mở (như trên ảnh người dùng cung cấp):** **$25.0\text{ mm}$**
  * Khi người dùng kéo hoặc ấn búng mở, ngăn kéo thò ra ngoài đúng **$25.0\text{ mm}$** (khoảng $52\%$ chiều dài khay), vừa vặn lộ toàn bộ khoang chứa thuốc để ngón tay nhón lấy viên thuốc dễ dàng nhất.
  * Phần còn lại nằm trong hộc: **$23.0\text{ mm}$** ngậm chặt trong ray dẫn hướng, giữ khay thăng bằng ngang, không bị xệ chúc đầu xuống dưới.
* **Hành trình kéo tối đa (Max Pull-out Stroke):** **$32.0\text{ mm}$**
  * Đuôi khay có **vấu cản nhô cao $1.2\text{ mm}$** chạm gờ chặn của khung tổ ong Part 3, **chống tuột rơi khay thuốc ra sàn nhà** nếu người dùng lỡ tay kéo quá mạnh."""

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
