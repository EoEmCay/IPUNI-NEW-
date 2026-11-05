import os

cad_file = 'd:/DIA+/ban_ve_chi_tiet_cad_calendia_plus.md'

sec_9_5_content = """
---

### 9.5. Hiệu Chỉnh Thiết Kế Dải Loa 4 Tầng Rãnh Âm (Khắc Phục Triệt Để Lỗi CAD Bị Lơ Lửng Lên Trời)
*(Phân tích nguyên nhân lỗi phần mềm CAD & Bàn giao bản render 3D ốp phẳng lì trên hộp thuốc)*

#### 1. Hình Ảnh Đối Chiếu Trực Quan: Bản Bị Lỗi CAD vs Bản Đã Sửa Chuẩn Xác 100%:

![Đối Chiếu Lỗi CAD vs Bản Sửa Chuẩn](calendia_speaker_error_vs_fixed.png)
*(Hình ảnh so sánh trực tiếp: Bên trái là ảnh CAD bị lỗi đùn ngược lên trời của bạn vs Bên phải là bản thiết kế đã sửa chuẩn xác 100%, ốp phẳng lì chìm sâu 2.0 mm trên trán máy)*

#### 2. Hình Ảnh Render Mô Hình 3D Thực Tế Sau Khi Đã Khắc Phục Hoàn Toàn:

![Bản CAD Sửa Chuẩn - Phối Cảnh Toàn Máy](calendia_3d_speaker_user_fixed_full.jpg)
*(Mô hình CalenDIA+ hoàn thiện: Cụm lưới loa 4 tầng rãnh âm hình thang ngược + Logo CalenDIA+ nằm phẳng lì, cân đối tuyệt đối trên bề mặt nghiêng 75°)*

![Bản CAD Sửa Chuẩn - Cận Cảnh Trán Máy](calendia_3d_speaker_user_fixed_closeup.jpg)
*(Cận cảnh góc nhìn Ảnh 2 sau khi sửa: 4 tầng rãnh âm vát 45° sắc nét, màng loa đen tuyền phía sau, không còn hiện tượng lơ lửng)*

#### 3. Phân Tích Kỹ Thuật Nguyên Nhân Gây Lỗi Trong CAD & Hướng Dẫn Sửa 3 Bước:
* **Nguyên nhân cốt lõi:**
  1. Khi tạo Sketch trong phần mềm CAD (SolidWorks, Fusion 360, Inventor), bạn đã vô tình chọn **mép cạnh vát đỉnh (Top Chamfer)** hoặc mặt phẳng đứng **Top Plane / Front Plane** làm mặt phẳng phác thảo (Sketch Plane).
  2. Khi thực hiện lệnh tạo khối, bạn dùng lệnh **Extrude Boss / Base** (nhô thịt ra ngoài) thay vì **Extrude Cut** (cắt âm vào vỏ), đồng thời vectơ pháp tuyến (Normal Vector) bị đảo ngược khiến cả tấm lưới loa bị đùn bắn thẳng lên không trung phía sau.
* **Hướng dẫn thao tác 3 bước chuẩn xác trong phần mềm CAD:**
  * **Bước 1 (Chọn đúng mặt phẳng):** Nhấp chuột trái trực tiếp vào **mặt phẳng nghiêng $75^\circ$ của trán máy** (ngay trên hàng hộp thuốc) $\rightarrow$ Chọn **Create Sketch**.
  * **Bước 2 (Cắt âm tạo rãnh thoát âm):** Vẽ 4 hàng rãnh âm hình con nhộng theo kích thước chuẩn $\rightarrow$ Chọn lệnh **Extrude Cut** $\rightarrow$ Đặt chiều sâu `Depth = 2.0 mm - 2.5 mm` (hoặc `Through All` để cắt xuyên qua thành vỏ).
  * **Bước 3 (Vát mép chống sệ khi in FDM):** Chọn các cạnh mép miệng rãnh $\rightarrow$ Chọn lệnh **Chamfer** $\rightarrow$ Nhập `Distance = 0.8 mm`, góc `Angle = 45.0°`. Bề mặt in 3D FDM nhựa PETG sẽ cực kỳ phẳng mịn và không cần bất kỳ sợi Support nào!

---
"""

with open(cad_file, 'a', encoding='utf-8') as f:
    f.write(sec_9_5_content)

print("Appended section 9.5 to CAD document!")
