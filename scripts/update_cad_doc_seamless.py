import os

file_path = 'd:/DIA+/ban_ve_chi_tiet_cad_calendia_plus.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '### PART [3]: Khung Xương Tổ Ong Dẫn Hướng Nguyên Khối (Monolithic Honeycomb Core Guide Grid)'

insertion = """### Hiệu Chỉnh Thiết Kế Liền Mạch Nguyên Khối (Seamless Unibody Drawer)
*(Khắc phục triệt để lỗi bậc thang giật cấp ở thành bên và đuôi sau theo yêu cầu người dùng)*

#### Bản Vẽ Kỹ Thuật & Phối Cảnh 3D CAD Hộc Thuốc Liền Mạch:
![Phối cảnh 3D CAD Hộc thuốc nguyên khối liền mạch](calendia_seamless_drawer_render.png)
*(Mô hình 3D CAD Hộc thuốc liền mạch nguyên khối CalenDIA+: Khắc phục triệt để lỗi giật cấp đuôi sau, thành bên phẳng lì 100% bằng phẳng, đáy phẳng suốt 48mm, gân trượt dẫn hướng đúc liền chạy thẳng tắp, vách sau vuông vức 90° tích hợp vấu cản 1.2mm)*

![Bản vẽ kỹ thuật chi tiết hộc thuốc nguyên khối liền mạch](ban_ve_hoc_thuoc_lien_mach_cad.png)
*(Bản vẽ bóc tách chi tiết: So sánh trực diện Bản cũ bị giật cấp vs Bản mới liền mạch, mặt cắt dọc lòng khay sâu 26.5mm, vách đuôi sau khép kín đón sáng LED và bảng thông số dung sai gia công)*

#### Các Điểm Cải Tiến Cốt Lõi Vùng Đuôi Sau & Thành Bên:
1. **Loại bỏ 100% bậc thang giật cấp ở mép trên thành bên:** Toàn bộ thành bên là một mặt phẳng đứng liên tục kích thước $48.0 \\times 30.0\\text{ mm}$, vuông thành sắc cạnh, không còn bất kỳ đường gấp khúc hay vết chắp vá nào.
2. **Mặt sàn đáy khay phẳng tắp 100%:** Đáy khay có độ dày đồng nhất $t = 2.0\\text{ mm}$, phẳng phiu từ mặt trước ra tận đuôi sau suốt chiều dài $48.0\\text{ mm}$, loại bỏ hoàn toàn các gờ giật cấp lồi lõm gây kẹt khi trượt.
3. **Gân trượt dẫn hướng đúc liền (Continuous Guide Rib):** Thanh mảnh $1.0\\text{ mm} \\times 0.8\\text{ mm}$ chạy thẳng suốt chiều dài hông khay tại cao độ tâm $Z = 15.0\\text{ mm}$, giúp khay trượt nhẹ nhàng, êm ái, định tâm tuyệt đối và chống rung lắc.
4. **Vách đuôi sau phẳng đứng khép kín $90^\\circ$:** Độ dày vách $t = 2.0\\text{ mm}$, vuông góc hoàn hảo, đóng kín đáy hộc và tán xạ ánh sáng LED WS2812B rọi đều vào lòng thuốc.
5. **Vấu cản chống rơi tích hợp tinh gọn (Integrated Pull-out Stopper):** Chiều cao $1.2\\text{ mm}$ được tích hợp liền mạch ở mép trên phía sau của khay, giữ khay dừng an toàn ở hành trình $25.0\\text{ mm}$ mà không làm xấu dáng tổng thể.
6. **Bảo toàn nguyên vẹn kích thước chuẩn:**
   * Chiều cao phủ bì: $H = 30.0\\text{ mm}$ (chuẩn tỷ lệ hình chữ nhật đứng $1:1.15$ theo ảnh mẫu).
   * Chiều rộng phủ bì: $W = 26.0\\text{ mm}$ (lọt lòng chứa thuốc $W_{\\text{lòng}} = 22.0\\text{ mm}$).
   * Chiều sâu trượt phủ bì: $L = 48.0\\text{ mm}$ (lọt lòng chiều dài $L_{\\text{lòng}} = 43.0\\text{ mm}$).
   * Độ sâu khoang lọt lòng: $H_{\\text{lòng}} = 26.5\\text{ mm}$ (chứa 12 - 15 viên nang).

---

"""

if target in content:
    if 'Hiệu Chỉnh Thiết Kế Liền Mạch Nguyên Khối' not in content:
        new_content = content.replace(target, insertion + target)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Successfully updated ban_ve_chi_tiet_cad_calendia_plus.md with seamless unibody specs!')
    else:
        print('Seamless unibody specs already present in markdown file.')
else:
    print('Target header not found!')
