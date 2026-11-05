file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part5 = """### PART [5]: Cụm Màn Hình Hiển Thị OLED Đỉnh Máy & Tấm Kính Mica Đen Khói (OLED Bezel & Smoked Acrylic Assembly)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết:
![Bản vẽ 3D Cụm Màn hình OLED đỉnh CalenDIA+](calendia_top_oled_acrylic_cad_render.jpg)
*(Mô hình 3D CAD Cụm màn hình OLED đỉnh CalenDIA+: Bóc tách 3 tầng - Kính mica đen khói 192×24×2.0mm, hộc khoét bậc chìm vỏ mặt trước và module OLED hiển thị thông số lâm sàng phát sáng rực rỡ)*

![Bản vẽ kỹ thuật chi tiết Cụm Màn hình OLED đỉnh](ban_ve_man_hinh_oled_dinh_cad.png)
*(Bản vẽ bóc tách kích thước 3 chiều: Ngang × Dọc × Cao, mặt cắt dọc C-C, chi tiết module OLED 0.96\" / 1.3\" và hiệu ứng quang học Hidden-Until-Lit)*

---

### Bảng Kích Thước 3 Chiều Chuẩn Xác (Ngang × Dọc × Cao/Dày)

| Thành phần cấu thành cụm | Chiều Ngang (Width) | Chiều Dọc (Height) | Chiều Cao / Độ Dày (Depth/Thk) | Vật liệu / Chức năng cơ học |
| :--- | :---: | :---: | :---: | :--- |
| **1. Tấm mặt nạ kính Mica đen khói (Mặt ngoài)** | **$192.0\text{ mm}$** | **$24.0\text{ mm}$** | **$2.0\text{ mm}$** | Mica/PMMA đen khói xuyên quang 40%, bo 4 góc $R = 5.0\text{ mm}$, phẳng lì ngang vỏ. |
| **2. Hộc khoét bậc chìm trên vỏ Part 1** | **$192.4\text{ mm}$** | **$24.4\text{ mm}$** | **$2.0\text{ mm}$** *(độ sâu bậc)* | Khe hở trơn $\Delta = 0.4\text{ mm}$, gờ đỡ viền rộng $3.0\text{ mm}$ dán keo 3M 300LSE kín nước, chống bụi. |
| **3. Lỗ khoét xuyên sáng vào lòng máy** | **$186.0\text{ mm}$** | **$18.0\text{ mm}$** | Xuyên thủng vỏ ($2.5\text{ mm}$) | Cho phép ánh sáng từ màn hình OLED và LED trạng thái chiếu qua. |
| **4. Khung gá giữ màn hình Part 5** | **$190.0\text{ mm}$** | **$28.0\text{ mm}$** | **$5.0\text{ mm}$** | In 3D nhựa PETG đen, có 4 trụ vít M2 bắt vào mặt sau vỏ mặt trước Part 1. |
| **5. Module Màn hình OLED 0.96\" I2C (Chuẩn)** | **$27.0\text{ mm}$** *(PCB)* | **$27.5\text{ mm}$** *(PCB)* | **$4.1\text{ mm}$** *(Cả IC & kính)* | Vùng hiển thị $21.74 \times 10.86\text{ mm}$ ($128 \times 64$ điểm ảnh), hiển thị đường huyết và giờ uống. |
| **6. Module Màn hình OLED 1.3\" I2C (Bản to)** | **$35.4\text{ mm}$** *(PCB)* | **$33.5\text{ mm}$** *(PCB)* | **$4.3\text{ mm}$** | Vùng hiển thị $29.42 \times 14.70\text{ mm}$, chữ số to hơn $35\%$ cho người cao tuổi dễ đọc. |
| **TỔNG CỤM LẮP RÁP HOÀN THIỆN** | **$192.0\text{ mm}$** | **$28.0\text{ mm}$** | **$7.5\text{ mm}$ (Tổng chiều sâu)** | Nằm lọt gọn gàng trong khoang rỗng $18.0\text{ mm}$ của đỉnh máy CalenDIA+. |

---

### Nguyên Lý Quang Học & Kết Cấu Cơ Khí

1. **Hiệu ứng "Ẩn mình khi tắt - Sáng bừng khi bật" (Hidden-Until-Lit):**
   * Sử dụng tấm Mica Acrylic màu **đen khói (Smoked Black) có độ truyền dẫn quang học $35\% - 40\%$**.
   * Khi thiết bị ở trạng thái nghỉ, toàn bộ thanh ngang đỉnh máy là một khối đen bóng liền mạch, sang trọng, che giấu hoàn toàn các viền bo mạch và chip điện tử bên trong.
   * Khi đến giờ nhắc uống thuốc, màn hình OLED tự động bật sáng, các dòng chữ màu xanh ngọc Cyan (`#38BDF8`) hoặc trắng sáng xuyên qua lớp kính đen cực kỳ sắc nét, tương phản cao và dịu mắt.
2. **Khung gá chống rung & Chống lọt bụi (Part 5 Bracket):**
   * Module OLED được cố định chặt vào Khung gá Part 5 bằng 4 vít M2.
   * Viền ngoài của tấm kính mica được dán kín vào gờ bích vỏ máy bằng dải băng keo chuyên dụng **3M 300LSE dày $0.15\text{ mm}$**, ngăn chặn tuyệt đối bụi mịn và hơi ẩm lọt vào màn hình theo thời gian.
3. **Đấu nối I2C tiết kiệm chân:**
   * Chỉ sử dụng 4 dây: `GND`, `VCC (3.3V)`, `SCL (GPIO 5)`, `SDA (GPIO 4)` cắm trực tiếp vào bo mạch ESP32-C3."""

start_tag = "### PART [5]:"
end_tag = "### PART [6]:"

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_part5 + "\n\n---\n\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print(f"Error: indices {start_idx}, {end_idx}")
