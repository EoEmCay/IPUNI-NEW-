file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part1 = """### PART [1]: Khung Vỏ Mặt Trước & Ma Trận Cửa Sổ (Front Bezel & Matrix Faceplate)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết:
![Bản vẽ 3D Khung vỏ mặt trước CalenDIA+](calendia_front_bezel_cad_render.jpg)
*(Mô hình 3D CAD Khung vỏ mặt trước CalenDIA+: Kích thước 230 × 180 × 18 mm, cửa sổ hiển thị OLED đỉnh, 28 cửa sổ ma trận 7×4, mặt vát chân đế in logo D+ CalenDIA+, mặt sau có 8 trụ ren M3)*

![Bản vẽ kỹ thuật chi tiết Khung vỏ mặt trước](ban_ve_khung_vo_mat_truoc_cad.png)
*(Bản vẽ bóc tách hình chiếu đứng, hình chiếu mặt sau với 8 trụ ren M3 và bảng thông số dung sai gia công cho Part 1)*

* **Chức năng:** Định hình diện mạo mặt trước thiết bị, định vị cửa sổ hiển thị OLED/dải đèn trạng thái đỉnh máy, tạo 28 cửa sổ bao bọc phẳng khít cho 28 ngăn kéo thuốc, khắc nhãn ngày/buổi công thái học, hiển thị nhận diện thương hiệu DIAPLUS duy nhất ở chân đế và liên kết toàn bộ khung máy.
* **Kích thước ngoài phủ bì:** **Rộng 230.0 mm × Cao 180.0 mm × Dày 18.0 mm** (Bo viền 4 góc ngoài bán kính cong mềm mại $R = 8.0\text{ mm}$, vừa khít bàn in 3D FDM phổ thông $235 \times 235\text{ mm}$).
* **Kết cấu chi tiết:**
  * **Cửa sổ hiển thị đỉnh máy:** Kích thước lọt lòng **$190.0\text{ mm} \times 24.0\text{ mm}$** (bo góc $R = 6.0\text{ mm}$), có gờ bậc chìm đón vừa tấm mica/PMMA đen khói bảo vệ màn hình OLED và đèn báo.
  * **Ma trận 28 cửa sổ ngăn kéo:**
    * 7 cột × 4 hàng. Kích thước lọt lòng mỗi cửa sổ: **Rộng 26.8 mm × Cao 20.8 mm** (khe hở $0.4\text{ mm}$ mỗi chiều so với ngăn kéo $26.0 \times 20.0\text{ mm}$ giúp khay trượt qua nhẹ nhàng).
    * Bề dày gân ngăn cách giữa các ô: **$3.5\text{ mm}$** cứng vững.
    * Chu vi mép trong từng cửa sổ có **gờ bậc chìm (Recess Step)** sâu $1.2\text{ mm}$, rộng $1.0\text{ mm}$ để đón mép bích chắn bụi của ngăn kéo Part 2 ép khít vào khi đóng, che kín 100% bụi bẩn.
  * **Chữ dập nổi / khắc chìm sắc nét:**
    * Tiêu đề thứ trong tuần: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun` (hoặc `T.HAI` ... `CN`) dập sâu $0.6\text{ mm}$.
    * Cột buổi trong ngày: `MORN`, `NOON`, `EVE`, `NIGHT` (hoặc `SÁNG`, `TRƯA`, `CHIỀU`, `TỐI`) dập sâu $0.6\text{ mm}$.
  * **Mặt vát chân đế (Front Stand Chin):** Mặt phẳng nghiêng $75^\circ$ đặt duy nhất biểu tượng Logo `D+` màu Royal Blue với dải lượn sóng Cyan và tên sản phẩm `CalenDIA+` sang trọng, trang nhã.
  * **Kết cấu liên kết mặt sau (Rear Architecture):**
    * Khoang rỗng âm đón vừa vặn cụm Khung tổ ong Part 3 kích thước $202.5 \times 93.0\text{ mm}$.
    * **8 Trụ ren M3 đúc nổi:** Đường kính ngoài $\varnothing 6.0\text{ mm}$, lỗ trong $\varnothing 4.1\text{ mm} \times$ sâu $5.5\text{ mm}$ cấy tán nhiệt đồng ren trong M3 để bắt vít siết chặt khung tổ ong và nắp lưng.
    * **4 Ngàm sập định vị (Snap-fit tabs):** Phân bố ở 4 cạnh để gài khớp nhanh với nắp lưng trước khi siết ốc.
* **Vật liệu & Hướng dẫn gia công:**
  * **In 3D FDM:** Nhựa **PETG màu Trắng sứ (Porcelain White)**. Đặt **mặt trước úp trực tiếp xuống bàn in PEI nhám mờ (Textured PEI)** để sau khi bóc ra, bề mặt đạt độ mịn satin mờ sang trọng, không lộ vân sợi, độ phẳng $<0.3\text{ mm}$.
  * **Đúc phun hàng loạt:** Nhựa **ABS màu trắng ngọc trai** bóng nhẹ hoặc mờ mịn."""

start_tag = "### PART [1]:"
end_tag = "### PART [2]:"

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_part1 + "\n\n---\n\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print(f"Error: indices {start_idx}, {end_idx}")
