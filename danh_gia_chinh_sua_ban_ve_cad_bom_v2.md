# TÀI LIỆU KỸ THUẬT & ĐÁNH GIÁ KHẢ THI DỰ ÁN DIA+ V2.0
## (Hiệu Chỉnh Cơ Khí • Hệ Thống Nguồn 3.3V • Cấu Trúc 14 Ô • Bài Học Lâm Sàng & Mô Hình Tài Chính Thực Tế)

---

## 1. Tổng Hợp Các Điểm Cần Hiệu Chỉnh Kỹ Thuật Trước Khi Chế Tạo Bản Mẫu

Dựa trên phân tích kỹ thuật thực tế và phản biện chuyên môn, dự án DIA+ V2.0 thực hiện rà soát và điều chỉnh triệt để các điểm then chốt sau:

| Hạng mục kỹ thuật | Vấn đề phát hiện | Giải pháp hiệu chỉnh kỹ thuật chuẩn xác |
| :--- | :--- | :--- |
| **1. Tính chất hình ảnh minh họa** | Bản vẽ trước đây là ảnh AI tạo sinh (có lỗi ký tự biến dạng), không thể dùng làm file gia công chế tạo. | Phải dựng mô hình 3D tham số thực tế trên phần mềm CAD chuyên dụng (**Fusion 360 / Onshape / FreeCAD**) và xuất file chuẩn **STEP/STL** trước khi gửi xưởng gia công. |
| **2. Số lượng ô thuốc & Chu kỳ** | Thiết kế 12 ô không khớp với chu kỳ "7–14 ngày" (14 ngày × 1 cữ = 14 ô; 7 ngày × 2 cữ = 14 ô). | **Chuẩn hóa cấu trúc thành 14 ô độc lập** (2 cột × 7 tầng). Mỗi ô kích thước tối thiểu 26 × 20 × 18 mm để chứa vừa 3 - 5 viên nang tiêu chuẩn cỡ 00 (dài ≈ 23.3 mm). |
| **3. Mâu thuẫn cơ khí (Khay trượt vs Cảm biến)** | Bản vẽ cũ có servo/solenoid "kích xả" và cảm biến IR "thuốc rơi", nhưng khay lại kéo tay; khay chung không thể biết người dùng lấy chính xác ô nào. | **Chọn giải pháp Cơ Học Thông Minh (Smart Manual):** Bỏ servo và cảm biến IR phức tạp. Khay chia 14 nắp/lẫy riêng biệt có tích hợp công tắc từ/cảm biến tiếp xúc. Ghi nhận nhật ký chính xác là **"Đã mở nắp ô số X"** (không tuyên bố khống là "đã uống"). |
| **4. Kích thước hình học & Túi balo Ø75mm** | Mặt cắt chữ nhật 72 × 52 mm có đường chéo ≈ 88.8 mm, không thể đút vừa ngăn balo tròn Ø 75 mm. | **Chuyển đổi tiết diện thân vỏ thành hình Oval / Trụ Elip** kích thước 68 mm × 44 mm (bán kính bo tròn lớn R ≥ 20 mm). Đường chéo thực tế giảm xuống ≈ 72 mm, đút vừa khít ngăn lưới balo Ø 75 mm. |
| **5. Nguồn điện & Tính tương thích linh kiện** | Cảm biến Hall A3144 cần điện áp > 4.5V, không chạy được ở 3.3V; Servo/LED WS2812 cần 5V và dòng đỉnh > 500mA gây sụt áp pin Li-Po 3.7V, làm khởi động lại ESP32. | **Chuẩn hóa toàn bộ hệ thống về điện áp 3.3V:** Dùng cảm biến Hall tiêu thụ siêu thấp dải rộng **TI DRV5032** (1.65 - 5.5V) hoặc công tắc lưỡi gà (Reed Switch); bỏ servo; dùng LED báo trạng thái 3.3V; cấp nguồn qua LDO ME6211. |
| **6. Vật liệu & Quy trình gia công** | Polycarbonate cắt laser CO2 dễ cháy xém/ám vàng; sơn tĩnh điện nung 180°C làm chảy biến dạng nhựa in SLA; nhựa SLA thông thường giòn và không an toàn tiếp xúc thuốc. | • **Cửa sổ demo:** Dùng **Mica (Acrylic) mờ khói cắt laser** (ghi rõ là Mica, không tuyên bố là PC cản UV).<br>• **Sơn hoàn thiện:** Dùng **sơn phủ mờ gốc PU hoặc Acrylic 2 thành phần sấy nguội**.<br>• **Nhựa in:** Các khớp trượt/chốt dùng **Tough Resin** hoặc **Nylon PA12 (SLS)**, dung sai khe trượt 0.2 - 0.3 mm. Thân rỗng cần lỗ thoát nhựa lỏng ≥ Ø 3 mm. |
| **7. Quy trình in thử nghiệm (R&D)** | Đặt in SLA ngay từ đầu sẽ tốn kém và dễ phải in lại nhiều lần khi sai khớp trượt. | **Áp dụng quy trình in thử 2 bước:** In nhựa FDM (PLA/PETG) giá rẻ (100.000 - 300.000 đ) để kiểm tra lắp ghép với mạch thật và viên nang thật qua 2 - 3 vòng lặp; sau khi cơ cấu mượt mà mới in SLA bản đẹp. |

---

## 2. Rà Soát & Chuẩn Hóa Toàn Diện Các Tuyên Bố Kỹ Thuật / Y Khoa

Để đảm bảo tính trung thực khoa học trước Hội đồng Giám khảo và các Nhà đầu tư, toàn bộ các tuyên bố trong hồ sơ dự án được chuẩn hóa lại như sau:

| Nội dung cũ trong hồ sơ | Vấn đề pháp lý & thực nghiệm | Nội dung chuẩn hóa trung thực |
| :--- | :--- | :--- |
| *"Đã phê duyệt", "Ban Kỹ thuật & Y sinh"* | Dự án đang ở giai đoạn tiền ươm tạo (Pre-seed), chưa có cơ quan y tế nào thẩm định hay phê duyệt. | **Xóa bỏ hoàn toàn các chức danh và con dấu tự phong.** |
| *"Giải quyết triệt để thử nghiệm REMIND"* | Thử nghiệm lâm sàng REMIND thử nghiệm các thiết bị nắp hẹn giờ và hộp chia thuốc điện tử nhưng kết quả **không cho thấy sự cải thiện tuân thủ có ý nghĩa lâm sàng**. | **Nêu trung thực:** Đây là bằng chứng thách thức lớn trong ngành MedTech. Cơ chế của DIA+ là một **giả thuyết thiết kế cần được chứng minh qua thử nghiệm lâm sàng thực tế (Pilot Study)**. |
| *"Duy nhất", "bất khả thay thế", "nâng tuân thủ từ 50% lên trên 90%"* | Không có số liệu thực nghiệm. Thử nghiệm HeartStrong (chai thuốc điện tử có thưởng tiền và hỗ trợ xã hội) cũng không cải thiện được biến cố tim mạch chính. | **Bỏ hoàn toàn con số 90% và các tính từ phóng đại.** Thay bằng mục tiêu định tính: *"Hỗ trợ giảm thiểu quên thuốc do đãng trí trong sinh hoạt thường nhật"*. |
| *"Khóa trẻ em ngăn chặn 100%, triệt tiêu nguy cơ ngộ độc"* | Tiêu chuẩn ISO 8317 quy định thử nghiệm trên hội đồng trẻ em thực tế (tỷ lệ mở không vượt quá ngưỡng cho phép), không có khái niệm "triệt tiêu 100%". | Sửa thành: **"Cơ chế khóa kép 2 bước được thiết kế định hướng theo nguyên lý an toàn trẻ em ISO 8317"** (chờ kiểm định lab). |
| *"Cản UV 99.9%, chống biến tính thuốc do đèn huỳnh quang"* | Chưa đo quang phổ; đa số thuốc thông thường không bị phá hủy tức thì bởi ánh sáng phòng làm việc. | Sửa thành: **"Cửa sổ vật liệu tối màu giúp hạn chế ánh sáng trực tiếp và tăng cường tính riêng tư cho người dùng"**. |
| *"Kháng ẩm IP54, duy trì RH < 40% trong nồm ẩm"* | Túi Silica Gel 1–2g bão hòa rất nhanh khi mở nắp hộp thường xuyên; chuẩn IP54 là kháng bụi/nước bắn, không phải chống xâm nhập hơi ẩm. | Sửa thành: **"Tích hợp ngăn chứa chất hút ẩm hỗ trợ làm chậm quá trình hút ẩm trong điều kiện bảo quản đóng kín"**. |
| *"Tự động log cả gói thuốc nước để ngoài"* | Hộp chỉ chứa thuốc viên, không có cảm biến đo gói nước để bên ngoài balo. | Sửa thành: **"Người dùng chủ động bấm xác nhận đã dùng gói thuốc nước trên giao diện ứng dụng"**. |
| *"Web App qua Chrome BLE thay thế hoàn toàn App Native"* | Web Bluetooth API **không hoạt động trên iOS (Safari và Chrome iOS đều không hỗ trợ)**; Web App không thể chạy dịch vụ nền tin cậy để đặt lịch nhắc khi tắt trình duyệt. | Ghi rõ: **"Web App BLE chỉ dùng cho mục đích trình diễn PoC trên Android/Laptop; phiên bản thương mại bắt buộc phát triển App Native (iOS & Android)"**. |
| *"Cảnh báo người thân sau 45 phút"* | Nếu điện thoại hết pin hoặc hộp mất kết nối BLE, hệ thống có thể báo nhầm là người bệnh "quên uống". | Bổ sung logic phần mềm: **"Hệ thống phân biệt rõ giữa trạng thái 'Mất tín hiệu kết nối thiết bị' và trạng thái 'Quá giờ chưa nhận thao tác mở hộp'"**. |
| *"Lưu trữ lịch sử bằng Flash RTC"* | ESP32-C3 không tích hợp thạch anh RTC và pin CMOS nuôi nguồn riêng, mất nguồn pin là mất mốc thời gian thực. | Giải pháp: **"Hệ thống dựa vào việc đồng bộ thời gian thực từ điện thoại mỗi khi kết nối Bluetooth, hoặc bổ sung IC RTC chuyên dụng (PCF8563) có pin phụ"**. |

---

## 3. Kiến Trúc Cơ Học Thông Minh 14 Ô (Smart Manual Architecture)

Thay vì cố gắng nhồi nhét motor và cảm biến quang học gây phức tạp và hao pin, phiên bản DIA+ V2.0 chuyển sang mô hình **Hộp Chia Thuốc Bán Tự Động 14 Ô**:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │         CẤU TRÚC HÌNH HỌC OVAL DIA+ V2.0 (TIẾT DIỆN 68 x 44 mm)        │
  ├────────────────────────────────────────────────────────────────────────┤
  │  • Thân máy: Tiết diện Elip 68 x 44mm, cao 180mm (Đường chéo ~72mm)    │
  │  • Bố trí: 2 Cột x 7 Tầng = 14 Ngăn độc lập (Đủ 14 ngày hoặc 7 ngày x 2)│
  │  • Nắp từng ô: Mỗi ô có nắp lò xo riêng biệt kèm nam châm mini         │
  │  • Cảm biến: Thanh quét từ tính đọc trạng thái mở nắp của từng ô        │
  │  • Khóa an toàn: Chốt trượt cơ học 2 bước bảo vệ toàn bộ dãy nắp       │
  │  • Nguồn điện: Hoạt động thuần 3.3V, dòng nghỉ < 15µA (Pin dùng > 90 ngày)│
  └────────────────────────────────────────────────────────────────────────┘
```

```
 [LỊCH TRÌNH ĐIỆN THOẠI NHẮC] ──► [NGƯỜI DÙNG BẬT CHỐT KHÓA] ──► [MỞ NẮP Ô CẦN LẤY]
 (Local Notification chạy ngầm)     (Thao tác an toàn 2 bước)     (Công tắc từ nhận diện)
                                                                            │
                                                                   [GHI NHẬN SỰ KIỆN]
                                                                "Đã mở nắp ô số 04 lúc 12:02"
```

---

## 4. Dự Toán Chi Phí R&D Chế Tạo Bản Mẫu Thực Tế

Bảng ngân sách linh kiện và gia công trực tiếp cho 1 bản mẫu PoC hoạt động thực tế (đã rà soát phép tính chính xác):

| STT | Hạng mục vật tư chế tạo | Quy cách kỹ thuật | Đơn giá thực tế (VNĐ) |
| :---: | :--- | :--- | :---: |
| 1 | Bộ vỏ ngoài in 3D SLA | Nhựa Tough Resin / ABS-like, sơn phủ mờ PU (chỉ dùng demo cơ cấu) | 550.000 - 750.000 |
| 2 | Cửa sổ 14 ô cắt laser | Nhựa Mica (Acrylic) mờ khói kỹ thuật dày 2mm | 120.000 - 180.000 |
| 3 | Quai xách & gioăng làm kín | Silicon đúc khuôn mềm hoặc TPU in 3D dẻo | 150.000 - 220.000 |
| 4 | Cụm khay 14 ô & chốt khóa cơ | Nhựa kỹ thuật gia cường, dung sai lắp ghép 0.2 - 0.3 mm | 180.000 - 250.000 |
| 5 | Module vi điều khiển | ESP32-C3 SuperMini (dùng cho bản mẫu câu dây test mạch) | 48.000 - 55.000 |
| 6 | Mạch in PCB thử nghiệm | Bo mạch 2 lớp gắn gọn cổng Type-C và các cảm biến tiếp xúc | 250.000 - 350.000 |
| 7 | Cảm biến từ tính nhận diện ô | Cảm biến Hall điện áp thấp TI DRV5032 / Công tắc lưỡi gà Reed Switch | 25.000 - 45.000 |
| 8 | Hiển thị & Còi dự phòng | Màn hình LED 7 đoạn hiển thị giờ + Còi Piezo mini (mặc định tắt) | 40.000 - 55.000 |
| 9 | Cell pin Li-Po an toàn 3.7V | Pin Li-Polymer 700 mAh tích hợp bo mạch bảo vệ PCM | 55.000 - 75.000 |
| 10 | Mạch sạc Type-C tích hợp | Module sạc TP4056 tích hợp IC bảo vệ DW01A | 8.000 - 12.000 |
| 11 | Phụ kiện lò xo, ốc vít M2 | Lò xo nén inox + ốc lục giác chìm thép không gỉ | 25.000 - 40.000 |
| 12 | Công lắp ráp, cân chỉnh & code | Lắp ráp thủ công, cân chỉnh khe trượt, nạp firmware kiểm thử | 350.000 - 425.000 |
| | **TỔNG VẬT TƯ TRỰC TIẾP (1 BẢN MẪU)**| | **1.801.000 - 2.607.000 VNĐ** |

> [!NOTE]
> **Ngân sách R&D tổng thể (Giai đoạn Pre-seed 3–6 tháng):**
> Chi phí chế tạo 1 chiếc máy cuối cùng (1.8M - 2.6M đ) chỉ là một phần nhỏ. Tổng ngân sách R&D thực tế của dự án để trải qua 2 - 3 vòng in FDM thử nghiệm, 2 vòng in SLA hoàn thiện, chi phí server Cloud, linh kiện hỏng và công sức phát triển ứng dụng ước tính từ **20.000.000 - 35.000.000 VNĐ**.

---

## 5. Tái Cấu Trúc Mô Hình Tài Chính Sản Xuất Thương Mại Hàng Loạt

### 5.1. Phân Tích Chi Phí Giá Vốn Sản Xuất (COGS) Thực Tế (Quy mô 5.000 chiếc)
Một sai lầm phổ biến là chỉ tính tiền nhựa và chip mà quên mất chi phí khấu hao khuôn và các nghĩa vụ sau bán hàng:

| Khoản mục chi phí thực tế | Đơn giá phân bổ (VNĐ) | Diễn giải kỹ thuật & tài chính |
| :--- | :---: | :--- |
| **1. Khấu hao khuôn ép phun (Tooling)** | **55.000 - 65.000** | Bộ khuôn thép nhiều lòng giá khoảng 280 - 320 triệu VNĐ, phân bổ cho 5.000 sản phẩm đầu tiên |
| **2. Ép nhựa thân vỏ & nắp 14 ô** | 32.000 - 38.000 | Hạt nhựa nguyên sinh ABS/PC y tế, chu kỳ ép chu kỳ 25 giây |
| **3. Cửa sổ Acrylic & gioăng silicon** | 12.000 - 16.000 | Đúc ép cao su silicon và thấu kính nhựa kỹ thuật |
| **4. Bo mạch SMT & Module RF hợp quy** | 45.000 - 55.000 | Module ESP32-C3-MINI-1 có chứng nhận vô tuyến + gia công SMT dây chuyền |
| **5. Nguồn Pin Li-Po đạt chuẩn IEC 62133** | 25.000 - 30.000 | Nhập lô 5.000 cell pin từ nhà máy có chứng chỉ kiểm định |
| **6. Cảm biến, màn hình, phụ kiện cơ khí** | 20.000 - 28.000 | Màn hình LED, cảm biến từ tính, lò xo inox |
| **7. Nhân công lắp ráp, kiểm tra QC & đóng gói**| 18.000 - 25.000 | Dây chuyền lắp ráp bán tự động, kiểm tra chất lượng 100% |
| **8. Bao bì hộp giấy, túi hút ẩm, sách HDSD** | 12.000 - 15.000 | In offset cán mờ cao cấp |
| **9. Dự phòng bảo hành 12T & tỷ lệ lỗi (3–5%)** | 15.000 - 22.000 | Chi phí đổi trả sản phẩm lỗi kỹ thuật |
| **TỔNG GIÁ VỐN XUẤT XƯỞNG THỰC TẾ (COGS)** | **234.000 - 294.000 VNĐ** | *(Giá thành thực tế của một thiết bị IoT y tế đạt chuẩn)* |

---

### 5.2. Định Giá Bán Lẻ & Chiến Lược Kinh Doanh Bền Vững

Nếu giá thành sản xuất thực tế là **≈ 250.000 - 290.000 VNĐ**, việc bán sản phẩm với giá **349.000 VNĐ** sau khi trừ 10% phí sàn Shopee và 10% chi phí Marketing sẽ khiến doanh nghiệp **bị hòa vốn hoặc lỗ nặng**, không có dòng tiền duy trì hệ thống máy chủ Cloud và cập nhật ứng dụng lâu dài.

#### Chiến Lược Định Giá Thương Mại Đề Xuất:
1. **Giá Niêm Yết (MSRP):** **590.000 VNĐ**.
2. **Giá Bán Khuyến Mãi / Ra Mắt:** **449.000 - 489.000 VNĐ**.
   - Với mức giá bán 469.000 đ:
     - Giá vốn hàng bán (COGS): 260.000 đ (55.4%).
     - Thuế VAT (8%): 37.500 đ (8.0%).
     - Phí sàn thương mại điện tử (10%): 46.900 đ (10.0%).
     - Chi phí đóng gói & Marketing: 45.000 đ (9.6%).
     - **Lợi nhuận ròng trên sản phẩm:** **79.600 VNĐ** (17.0%).
3. **Mô hình kinh doanh mở rộng (Tránh bẫy bán phần cứng một lần):**
   - **Mô hình Dịch vụ Thuê bao (Software-as-a-Service - SaaS):** Ứng dụng cung cấp các tính năng nâng cao (Tự động gọi điện thoại khẩn cấp bằng giọng nói AI cho người thân khi người bệnh quên thuốc, xuất báo cáo tuân thủ chi tiết cho bác sĩ điều trị dạng PDF) với phí thuê bao **29.000 đ/tháng** hoặc **299.000 đ/năm**.
   - **Mô hình B2B2C (Hợp tác y tế):** Bán trọn gói thiết bị kèm hợp đồng dịch vụ cho các chuỗi nhà thuốc lớn, phòng khám điều trị bệnh mạn tính hoặc công ty bảo hiểm sức khỏe tài trợ thiết bị cho khách hàng nhằm giảm thiểu chi phí nhập viện do tái phát bệnh.
