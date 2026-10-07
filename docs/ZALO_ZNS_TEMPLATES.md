# Mẫu tin Zalo ZNS của DIA+ — nội dung đăng ký với Zalo

Có 2 mẫu cần đăng ký. Đăng ký qua tài khoản eSMS hoặc trên ZBS Template Manager của Zalo. **Tên tham số phải giữ đúng như dưới đây**, vì code (`backend/src/services/zns.service.js`) gửi dữ liệu theo đúng các tên này.

Nguyên tắc soạn mẫu (để mẫu không bị Zalo từ chối):
- Viết tiếng Việt có dấu, không viết tắt, không dùng icon.
- Không chèn link hay số điện thoại vào nội dung; muốn dẫn link thì dùng nút bấm.
- **Không ghi tên thuốc.** Zalo xếp thuốc kê đơn vào nhóm nội dung hạn chế. Tên thuốc cụ thể người dùng xem trong app.
- Mỗi tin ứng với một "giao dịch" riêng là một cữ thuốc; mã bệnh nhân và giờ cữ chính là tham số định danh của giao dịch đó.

---

## Mẫu 1 — Nhắc uống thuốc (gửi cho bệnh nhân)

- **Loại mẫu / mục đích:** Chăm sóc khách hàng (Tag 2), dạng nhắc lịch.
- **Biến môi trường:** `ZNS_TEMPLATE_DOSE_REMINDER` = mã mẫu sau khi được duyệt.
- **Tiêu đề:** Nhắc lịch uống thuốc

**Nội dung:**
> Xin chào `<ten_khach_hang>`,
> Đã đến giờ uống thuốc buổi `<buoi>` theo lịch bạn đã thiết lập trên ứng dụng DIA+.
> Vui lòng mở ứng dụng để xem các thuốc cần dùng và xác nhận đã uống.

**Bảng thông tin:**

| Nhãn | Tham số | Ví dụ |
|---|---|---|
| Mã khách hàng | `<ma_khach_hang>` | DIA5CBQQG |
| Giờ uống | `<gio>` | 07:00 |
| Ngày | `<ngay>` | 07/10/2026 |

**Nút bấm:** "Mở DIA+", dẫn tới `https://diaplus.vn/dashboard` (đổi thành domain thật).

---

## Mẫu 2 — Báo người nhà: bệnh nhân quên uống thuốc

- **Loại mẫu / mục đích:** Chăm sóc khách hàng (Tag 2), dạng cảnh báo trạng thái.
- **Biến môi trường:** `ZNS_TEMPLATE_CAREGIVER_MISSED` = mã mẫu sau khi được duyệt.
- **Tiêu đề:** Thông báo lịch uống thuốc của người thân

**Nội dung:**
> Xin chào `<ten_nguoi_than>`,
> Người thân của bạn là `<ten_benh_nhan>` chưa xác nhận đã uống thuốc buổi `<buoi>` trên ứng dụng DIA+ sau hơn 15 phút.
> Vui lòng liên hệ để nhắc nhở. Đây là thông báo tự động, không thay thế tư vấn y tế.

**Bảng thông tin:**

| Nhãn | Tham số | Ví dụ |
|---|---|---|
| Mã bệnh nhân | `<ma_benh_nhan>` | DIA5CBQQG |
| Giờ uống | `<gio>` | 07:00 |
| Ngày | `<ngay>` | 07/10/2026 |

**Nút bấm:** "Xem trên DIA+", dẫn tới `https://diaplus.vn/dashboard`.

---

## Các bước bật tính năng

1. Xác thực Zalo OA "DIA+" dưới pháp nhân doanh nghiệp (giấy đăng ký kinh doanh, mã số thuế).
2. Liên kết OA với tài khoản eSMS và lấy **OAID** → `ESMS_ZALO_OAID`.
3. Đăng ký 2 mẫu trên, chờ duyệt, rồi điền mã mẫu vào 2 biến `ZNS_TEMPLATE_*`.
4. Kiểm tra `ESMS_API_KEY` / `ESMS_SECRET_KEY`. Lần test lưu trong `backend/testEsmsOut.txt` trả về "Authorize Failed".
5. Đặt `ESMS_ZNS_SANDBOX=1` để gửi thử, xong đổi về `0`.
6. Điền các biến trên vào môi trường của server Render rồi deploy lại. Công tắc "Nhắc uống thuốc qua Zalo" trong Cài đặt **chỉ hiện khi đã có `ZNS_TEMPLATE_DOSE_REMINDER`**.

## Ai nhận tin gì
- **Bệnh nhân:** nhận Mẫu 1 khi đến giờ cữ thuốc, chỉ khi đã tự bật công tắc trong Cài đặt và có số điện thoại. Cữ đã uống sớm thì không nhắc.
- **Người nhà:** nhận Mẫu 2 khi bệnh nhân quá giờ uống thuốc hơn 15 phút mà chưa xác nhận. Tin gửi tới:
  - SĐT người nhà mà bệnh nhân đã nhập trong liên kết người thân, hoặc
  - SĐT tài khoản của người nhà đã kết nối bằng mã gia đình, nhưng chỉ khi chính họ đã bật "Nhắc qua Zalo".

  Khi chưa cấu hình ZNS, hệ thống giữ cách cũ: email, cộng SMS nếu đã cấu hình webhook.
