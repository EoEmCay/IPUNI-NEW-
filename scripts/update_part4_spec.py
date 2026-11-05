file_path = r'd:\DIA+\ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_part4 = """### PART [4]: Khay Bắt Bo Mạch ESP32 & Mảng 28 Đèn LED (ESP32 & LED Carrier Plate)

#### Bản Vẽ Mô Hình 3D CAD & Bản Vẽ Kỹ Thuật Bóc Tách Chi Tiết:
![Bản vẽ 3D Khay bắt bo mạch ESP32 và Mảng LED CalenDIA+](calendia_esp32_led_carrier_tray_cad_render.jpg)
*(Mô hình 3D CAD Khay gá điện tử nguyên khối Part 4: Mảng 28 hốc LED WS2812B với rãnh chạy dích dắc Serpentine, gờ chắn sáng 14×14mm, khoang gá vi điều khiển ESP32-C3 DevKit pitch 44×20mm, khe thoát sóng Antenna, gá loa Ø30mm và 6 tai bắt ốc M3)*

![Bản vẽ kỹ thuật chi tiết Khay gá ESP32 và Mảng LED](ban_ve_khay_esp32_led_tray_cad.png)
*(Bản vẽ bóc tách hình chiếu đứng mảng 28 LED, tọa độ bước Px=28.5mm, Py=22.5mm, chi tiết phóng đại 1 hốc LED 5050 và sơ đồ bus dữ liệu 3 dây)*

* **Chức năng:** Tấm vỉ trung tâm tích hợp toàn bộ hệ thống cơ điện (Opto-Electronic Backbone), định vị chuẩn xác tuyệt đối 28 mắt đèn LED WS2812B thẳng hàng tâm đuôi 28 ngăn kéo, cách ly quang học chống lem sáng, gá cố định vi điều khiển ESP32-C3-DevKitM-1 và dẫn hướng dây tín hiệu gọn gàng.
* **Kích thước ngoài phủ bì:** **Rộng 218.0 mm × Cao 142.0 mm × Dày 4.5 mm** (độ dày đế nền $3.0\text{ mm}$, gờ chắn sáng và trụ bắt ốc nhô cao từ $1.5\text{ mm} - 4.0\text{ mm}$).
* **Thông số tọa độ mảng 28 Đèn LED (7 Cột × 4 Hàng):**
  * **Bước ngang (Pitch X):** **$P_x = 28.5\text{ mm}$** (khoảng cách tâm giữa các cột: $6 \times 28.5 = 171.0\text{ mm}$).
  * **Bước dọc (Pitch Y):** **$P_y = 22.5\text{ mm}$** (khoảng cách tâm giữa các hàng: $3 \times 22.5 = 67.5\text{ mm}$).
  * *Độ trùng khớp:* Trục quang học của 28 mắt LED đồng tâm $100\%$ với tâm của 28 cửa sổ xuyên sáng sau lưng Khung tổ ong Part 3.
* **Kết cấu chi tiết 1 hốc đèn LED:**
  * **Gờ chắn sáng (Light Baffle Collar):** Khung viền vuông nhô cao **$14.0\text{ mm} \times 14.0\text{ mm} \times$ cao $1.5\text{ mm}$**, cắm khít vào cửa sổ sau lưng của Khung tổ ong Part 3, **triệt tiêu 100% ánh sáng lọt sang ngăn bên cạnh**.
  * **Lòng hốc LED:** Kích thước **$12.0\text{ mm} \times 12.0\text{ mm} \times$ sâu $2.0\text{ mm}$** chứa vừa vặn chip LED SMD 5050 RGB WS2812B ($5.0 \times 5.0\text{ mm}$) và tụ lọc nguồn dán $100\text{nF}$.
  * **Rãnh luồn dây nối tiếp (Serpentine Wire Tracks):** Rãnh âm **rộng $3.0\text{ mm} \times$ sâu $1.5\text{ mm}$** chạy liên tục dích dắc hình chữ Z: Hàng 1 (Trái $\rightarrow$ Phải), Hàng 2 (Phải $\rightarrow$ Trái), Hàng 3 (Trái $\rightarrow$ Phải), Hàng 4 (Phải $\rightarrow$ Trái), chứa vừa cáp dải FPC hoặc 3 dây điện mềm bọc silicon AWG28.
* **Khoang gá bo mạch ESP32-C3 DevKit (Top Electronics Bay):**
  * Vị trí: Đặt ở dải trên đỉnh, nằm ngay trên mảng LED hàng 1.
  * **4 Trụ ốc bắt vít M2:** Tâm lỗ cách nhau chuẩn tuyệt đối **$44.0\text{ mm} \times 20.0\text{ mm}$**. Đường kính trụ $\varnothing 4.5\text{ mm}$, lỗ lõi $\varnothing 1.8\text{ mm}$ để bắt vít tự ren M2 dài $6\text{ mm}$.
  * **Độ cao Standoff ($4.0\text{ mm}$):** Tạo khoảng hở cách điện an toàn cho các chân linh kiện xuyên lỗ dưới đáy bo mạch ESP32-C3.
  * **Vùng cấm Antenna (Antenna Keep-out Zone):** Khoét thủng một khe rỗng **$16.0\text{ mm} \times 8.0\text{ mm}$** ngay bên dưới ăng-ten PCB onboard của ESP32-C3, giúp sóng Wi-Fi/Bluetooth phát sóng tối đa, không bị suy hao tín hiệu.
* **Vật liệu in & Chỉ dẫn gia công:**
  * Bắt buộc dùng **Nhựa PETG MÀU ĐEN ĐẶC (Solid Black PETG)** để hấp thụ toàn bộ quang năng tản mát, ngăn chặn tuyệt đối hiện tượng phản xạ ánh sáng lem nhem bên trong thân máy.
  * Thông số in: Chiều cao lớp **$0.16\text{ mm} - 0.20\text{ mm}$**, 4 lớp vỏ ngoài (Walls), ruột in **$30\%$ Gyroid**."""

start_tag = "### PART [4]:"
end_tag = "### PART [5]:"

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_part4 + "\n\n---\n\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print(f"Error: indices {start_idx}, {end_idx}")
