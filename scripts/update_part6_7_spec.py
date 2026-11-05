file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part6_7 = """### PART [6]: Vỏ Ốp Lưng Khoang Điện Tử (Rear Housing Chassis) & PART [7]: Chân Đế Nghiêng 75° Chống Lật (75° Desktop Stand)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết:
![Bản vẽ 3D Vỏ lưng và Chân đế nghiêng 75 độ CalenDIA+](calendia_rear_housing_base_cad_render.jpg)
*(Mô hình 3D CAD Vỏ lưng khoang máy và Chân đế nghiêng 75° CalenDIA+: Góc nhìn mặt sau và sườn máy, góc nghiêng 75°, footprint sâu 120 mm, cổng sạc Type-C, khe thoát âm loa, logo D+ dập chìm và 8 lỗ ốc bắt chìm M3)*

![Bản vẽ kỹ thuật chi tiết Vỏ lưng và Chân đế 75 độ](ban_ve_vo_lung_va_chan_de_75do_cad.png)
*(Bản vẽ bóc tách hình chiếu cạnh góc nghiêng 75°, hình chiếu mặt ngoài vỏ lưng, hình chiếu mặt trong khoang gá ESP32-C3 và bảng dung sai gia công)*

---

### Chi Tiết Kỹ Thuật PART [6]: Vỏ Ốp Lưng Khoang Điện Tử (Rear Housing)

* **Chức năng:** Đóng kín mặt sau toàn bộ thiết bị, che chắn an toàn cụm mạch điện tử vi điều khiển, tạo buồng âm cộng hưởng cho loa thông báo và liên kết chặt chẽ với Khung mặt trước Part 1 bằng 8 vít M3.
* **Kích thước ngoài phủ bì:** **Rộng 230.0 mm × Cao 180.0 mm × Sâu 28.0 mm** (Phom vuông vức 90° đồng bộ tuyệt đối với mặt trước Part 1, bo góc vi mô $R = 2.0\text{ mm}$).
* **Kết cấu mặt ngoài (Exterior Features):**
  * **8 Lỗ vít bắt chìm M3 (Countersunk Holes):** Phân bố dọc theo chu vi mép vỏ (3 lỗ trên, 3 lỗ dưới, 2 lỗ hông). Lỗ xuyên $\varnothing 3.5\text{ mm}$, vát miệng chìm $\varnothing 6.5\text{ mm} \times 90^\circ$ để đầu ốc M3 nằm phẳng lì ngang mặt vỏ, không cấn tay.
  * **Cổng sạc nguồn USB Type-C:** Khoét lỗ Oval $10.5\text{ mm} \times 5.0\text{ mm}$ ở mép dưới bên phải, có vát côn dẫn hướng giúp cắm cáp sạc 5V 2A trơn tru.
  * **Khe thoát âm & Tản nhiệt:** 5 rãnh ngang kích thước $30.0\text{ mm} \times 2.0\text{ mm}$ đối diện trực tiếp buồng loa, vừa khuếch đại âm thanh nhắc nhở, vừa thoát nhiệt đối lưu tự nhiên cho chip ESP32.
  * **Logo nhận diện DIAPLUS mặt sau:** Biểu tượng `D+` và dòng chữ `CalenDIA+` được dập chìm sâu $0.8\text{ mm}$ (Debossed) tinh xảo vào thân nhựa.
  * **4 Lỗ định vị gá chân đế:** 4 lỗ ren M3 bố trí ở nửa dưới để bắt cố định Chân đế Part 7 (hoặc đúc liền khối ngàm trượt).
* **Bố trí khoang gá linh kiện mặt trong (Internal Architecture):**
  * **Hốc gá vi điều khiển ESP32-C3-DevKitM-1:**
    * Vị trí: Góc trên bên trái, gần cổng Type-C và màn hình đỉnh.
    * Kết cấu gá: **4 Trụ bắt ốc M2** có khoảng cách tâm lỗ **$44.0\text{ mm} \times 20.0\text{ mm}$**, đường kính trụ $\varnothing 4.2\text{ mm}$, lỗ lõi $\varnothing 1.8\text{ mm}$ (bắt vít tự ren M2 dài 6mm).
  * **Buồng cộng hưởng âm thanh độc lập cho Loa:**
    * Hốc tròn $\varnothing 30.0\text{ mm} \times$ sâu $8.0\text{ mm}$ chứa vừa vặn loa mini $8\Omega$ 1W-2W.
    * Thành buồng loa có gờ chặn $1.2\text{ mm}$ để dán băng dính mút xốp EVA kín khí, giúp âm thanh dội ra ngoài trong trẻo, không bị rè hay vọng vào lòng máy.
  * **Rãnh kẹp giữ dây dẫn (Cable Clips):** Tích hợp sẵn các vấu kẹp dây nguồn 5V và cáp tín hiệu dải LED WS2812B, giữ hệ thống dây Dupont gọn gàng, chống kẹt khi đóng nắp máy.

---

### Chi Tiết Kỹ Thuật PART [7]: Chân Đế Để Bàn Nghiêng 75° Chống Lật (75° Desktop Stand)

* **Chức năng:** Giá đỡ chịu lực toàn bộ máy, định hình **góc nghiêng công thái học $75^\circ$ cố định**, triệt tiêu mô-men lật đổ khi người dùng dùng ngón tay ấn mở 28 khay thuốc.
* **Kích thước phủ bì:** **Rộng 210.0 mm × Sâu (Dài đáy) 120.0 mm × Dày 12.0 mm** (vuốt thon nhẹ về sau $6.0\text{ mm}$).
* **Phân tích cơ học chống lật (Anti-tipping Mechanical Stability):**
  * **Góc nghiêng $75^\circ$:** Góc nhìn lý tưởng nhất cho mắt người khi ngồi bàn làm việc ($70^\circ - 75^\circ$) hoặc nằm trên giường nhìn nghiêng lên kệ đầu giường.
  * **Chiều sâu chân đế $D = 120.0\text{ mm}$:** Trọng tâm toàn bộ thiết bị ($m \approx 450\text{g}$) rơi vào tọa độ $X = 42\text{ mm}$ tính từ mũi chân trước. Khi người dùng dùng lực ấn tay $F_{\text{push}} \approx 10 - 20\text{ N}$ vào bất kỳ ngăn kéo nào ở tầng trên cùng, vectơ hợp lực luôn nằm trọn trong khoảng đáy $0 - 120\text{ mm}$, **hoàn toàn không thể xảy ra hiện tượng bập bênh hay lật ngửa thiết bị ra sau**.
* **Mặt đáy tiếp xúc bàn (Under-base Grip):**
  * Gia công sẵn **6 hốc tròn $\varnothing 10.0\text{ mm} \times$ sâu $1.5\text{ mm}$** (4 hốc 4 góc và 2 hốc ở sống giữa).
  * Dán 6 đệm cao su silicon chống trượt chuẩn 3M (hoặc giác hút chân không), giúp máy bám chặt trên mọi mặt phẳng nhẵn như kính, gỗ ép, đá hoa cương.
* **Vật liệu & Thông số in 3D FDM:**
  * Vật liệu: **Nhựa PETG màu Trắng sứ** đồng bộ màu vỏ.
  * Mật độ ruột (*Infill*): **$40\%$ Gyroid** (khuyến khích in dày để tăng trọng lượng đầm chắc cho chân đế).
  * Số lớp thành (*Walls*): **5 lớp** ($2.0\text{ mm}$)."""

start_tag = "### PART [6]:"
end_tag = "### PART [8]:"

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_part6_7 + "\n\n---\n\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print(f"Error: indices {start_idx}, {end_idx}")
