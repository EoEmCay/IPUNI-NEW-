import os

md_path = 'd:/DIA+/ban_ve_chi_tiet_cad_calendia_plus.md'
with open(md_path, 'r', encoding='utf-8') as f:
    text = f.read()

slim_section = """### Phương Án Cải Tiến Đột Phá: Thiết Kế Thân Vỏ Siêu Mỏng Slim Unibody (Triệt Tiêu Hoàn Toàn Lỗi Lồi Đuôi Sau)
*(Tối ưu chiều sâu hộc thuốc từ 48.0 mm xuống 24.0 mm, giảm độ dày máy từ 55 mm xuống 28 mm, mặt lưng phẳng lì 100%)*

#### 1. Bản Vẽ Kỹ Thuật CAD & Mô Hình 3D Đột Phá:
![Bản vẽ kỹ thuật giải pháp chống lồi lưng CAD](ban_ve_giai_phap_chong_loi_lung_cad.png)
*(Bản vẽ kỹ thuật bóc tách chi tiết: So sánh trực diện mặt bên Bản cũ 55mm bị lòi đuôi vs Bản mới 28mm siêu mỏng phẳng phiu 100%, hình chiếu bằng hộc thuốc dài 24mm chia 2 khoang vừa đủ cữ uống và bảng dung sai đối chiếu)*

![Phối cảnh 3D CAD CalenDIA+ Slim Unibody](calendia_slim_unibody_side_rear_cad_render.jpg)
*(Mô hình 3D CAD Phối cảnh góc nghiêng sau CalenDIA+ Slim Unibody: Mặt lưng phẳng phiu 100% không bậc giật cấp, độ dày vỏ chỉ 28 mm, chân đế hợp kim nhôm nghiêng 75° thanh lịch, hộc thuốc mở 12 mm lộ 2 ngăn thuốc)*

![Phối cảnh 3D Studio Dual Hero CalenDIA+ Slim](calendia_slim_unibody_dual_hero_cad_render.jpg)
*(Góc nhìn đối chiếu 3D Studio: Trực diện mặt trước với khay bật nảy 12 mm và góc nhìn mặt sau phẳng lì nguyên khối chuẩn phong cách Surface / iPad)*

#### 2. Phân Tích Nguyên Nhân & Bản Chất Cải Tiến:
* **Nguyên nhân bản cũ bị lòi đuôi (Hình 2 của người dùng):**
  * Trong thiết kế ban đầu, chiều dài trượt hộc thuốc được đặt là $L = 48.0\\text{ mm}$ (quá dài so với nhu cầu thực tế).
  * Cộng thêm $2.0\\text{ mm}$ vách đáy, $3.0\\text{ mm}$ hành trình khóa nảy lò xo và $4.5\\text{ mm}$ khay bo mạch LED $\\rightarrow$ Cụm khung tổ ong bắt buộc phải lòi ra phía sau mặt trước tới $+35.0\\text{ mm}$, khiến tổng độ dày máy bị đội lên tới **$55.0\\text{ mm}$**, làm máy gồ ghề, cồng kềnh và mất cân đối.
* **Bản chất giải pháp cải tiến "Vừa Đủ":**
  * **Cắt giảm 50% chiều dài hộc thuốc:** Rút ngắn $L$ từ $48.0\\text{ mm}$ xuống chỉ còn **$24.0\\text{ mm}$** ($L_{\\text{lòng}} = 20.0\\text{ mm}$).
  * **Khoang chứa vừa vặn 100% với thực tế y tế:** Bệnh nhân tiểu đường / cao tuổi uống 1 cữ từ $2 - 4$ viên thuốc (thể tích $\\sim 2.0 - 3.0\\text{ cm}^3$). Mỗi khoang mới đạt $22.0 \\times 9.5 \\times 26.5\\text{ mm}$ (thể tích **$5.5\\text{ cm}^3$**), đựng vừa vặn thoải mái $4 - 5$ viên nang lớn.
  * **Triệt tiêu 100% hiện tượng lồi:** Toàn bộ 28 hộc thuốc và khung tổ ong nằm **lọt thỏm 100% bên trong thân vỏ**.
  * **Mặt lưng phẳng phiu nguyên khối (Flat Flush Back):** Độ dày toàn bộ máy chỉ còn **$28.0\\text{ mm}$** (giảm $49\\%$, mỏng hơn một cuốn sách), nắp lưng liền lạc, kín bụi tuyệt đối và chân đế xếp gọn gàng.

#### 3. Bảng So Sánh Kích Thước Bản Cũ vs Bản Mới Slim Unibody

| Tiêu chí kỹ thuật | Bản cũ (Hình 2 & 3 - Bị lòi lưng) | **BẢN MỚI SLIM UNIBODY (CHỐNG LỒI)** | Lợi ích đạt được |
| :--- | :---: | :---: | :--- |
| **Chiều dài hộc thuốc ($L$)** | $48.0\\text{ mm}$ (Dư thừa quá mức) | **$24.0\\text{ mm}$ (Giảm 50%)** | Tiết kiệm chiều sâu máy |
| **Độ dày toàn bộ thân vỏ** | $55.0\\text{ mm}$ (Lòi ra sau $35\\text{ mm}$) | **$28.0\\text{ mm}$ (Giảm 49%)** | **Mặt lưng phẳng lì 100%, không lồi** |
| **Kích thước mỗi ngăn chia** | $22.0 \\times 20.8 \\times 26.5\\text{ mm}$ | **$22.0 \\times 9.5 \\times 26.5\\text{ mm}$** | Rộng rãi bề ngang $22\\text{ mm}$ |
| **Thể tích mỗi ngăn** | $12.1\\text{ cm}^3$ (Quá dư thừa) | **$5.5\\text{ cm}^3$ (Vừa vặn chuẩn y tế)** | Đựng thoải mái 4 - 5 viên/cữ |
| **Hành trình bật lò xo** | $25.0\\text{ mm}$ (Cần lò xo dài, nặng) | **$12.0\\text{ mm}$ (Lò xo ngắn, siêu êm)** | Bấm nhẹ nhàng, người già bấm dễ |
| **Trọng lượng thân máy** | $\\sim 620\\text{ g}$ | **$\\sim 380\\text{ g}$ (Giảm 38%)** | Nhẹ nhàng, tiết kiệm nhựa in 3D |

---

"""

target = '### PART [3]: Khung Xương Tổ Ong Dẫn Hướng Nguyên Khối'
if target in text:
    new_text = text.replace(target, slim_section + target)
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('Updated successfully!')
else:
    print('Target not found!')
