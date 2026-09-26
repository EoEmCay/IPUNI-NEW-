# DIA+ — Phiên bản Web thuần (không Dashboard/Clinic)

**Nhánh:** `web-pure-no-clinic`
**Tạo từ:** `master` @ `8a6a407` (đầy đủ tính năng mới nhất — không phải bản cũ trước khi có Clinic)
**Mục đích:** Cung cấp phiên bản web tiếng Việt "chỉ dành cho bệnh nhân", loại bỏ hoàn toàn Cổng thông tin Phòng khám (Clinic Portal / Dashboard bác sĩ), trong khi vẫn giữ nguyên toàn bộ tính năng khác của DIA+ (bao gồm cả các cải tiến mới nhất về nhắc thuốc, cảnh báo người thân, quét đơn thuốc AI...).

> **Lưu ý quan trọng về lịch sử nhánh:** Một phiên bản trước của nhánh này (do Antigravity tạo) đã branch từ commit `3f837c5` — một điểm nằm **trước** khi Clinic được thêm vào, nhưng cũng **trước 56 commit cải tiến khác** không liên quan gì đến Clinic (đăng nhập Google, rung/đèn flash cảnh báo native, gộp thông báo nhắc thuốc, tối ưu quét AI, các fix bảo mật gần đây...). Nhánh đó thực chất là "bản rất cũ", không phải "bản mới nhất trừ Clinic". Nhánh hiện tại đã được **tạo lại từ `master` mới nhất** rồi mới gỡ đúng phần Clinic ra.

---

## 1. Đã loại bỏ những gì

### Frontend
- Toàn bộ `frontend/src/pages/Clinic/` (Dashboard bác sĩ, trang đăng nhập Clinic, trang chi tiết bệnh nhân, modal QR check-in, dữ liệu demo...)
- `frontend/src/services/clinic.service.js`
- `frontend/src/hooks/useClinicStream.js` (kênh SSE cập nhật realtime cho Dashboard)
- `frontend/src/components/layout/ClinicActiveBadge.jsx`
- `frontend/src/components/scan/LiveQRScanner.jsx` (chỉ dùng để quét QR check-in vào phòng khám)
- 3 route `/clinic`, `/clinic/dashboard`, `/clinic/patients/:id` trong `App.jsx`
- Toàn bộ luồng "Check-in QR Phòng khám" nhúng trong `ScanPrescriptionPage.jsx` (tab chuyển đổi, quét mã QR, đồng bộ ảnh đơn thuốc sang Clinic Dashboard) — **đã phẫu thuật gỡ ra**, giữ nguyên phần quét AI đơn thuốc cốt lõi (bao gồm cả tính năng sửa liều lượng + cảnh báo lệch liều mới thêm)
- Luồng đăng nhập dành cho tài khoản Phòng khám (kiểm tra IP nội bộ, nút "Mở khóa truy cập") trong `LoginPage.jsx`
- Dependency `jsqr` (chỉ phục vụ quét QR check-in, không còn nơi nào dùng)

### Backend
- `backend/src/modules/clinic/clinic.routes.js`, `clinic.controller.js`, `clinic.service.js` (API Dashboard bác sĩ: danh sách bệnh nhân, chi tiết hồ sơ, xác nhận cảnh báo)
- `backend/src/realtime/sse.controller.js` (kênh SSE realtime, chỉ phục vụ Dashboard — không còn ai gọi tới)
- Route `/api/v1/clinic/*` trong `server.js`

### Đã **KHÔNG** xoá (dù nằm chung thư mục `clinic/` cũ) — vì đây là hạ tầng thật cho tính năng phía bệnh nhân
Có 3 file **không phải** code Dashboard bác sĩ, chỉ bị đặt nhầm chung thư mục — đã **di chuyển** (không xoá) sang `backend/src/modules/alerts/`:
- `alert.service.js` — hàng đợi cảnh báo hạ/tăng đường huyết + kích hoạt báo người thân
- `caregiverNotify.js` — gửi email cảnh báo cho người thân đã liên kết (bảng `care_links`)
- `clinic.constants.js` → đổi tên `alertThresholds.js` — ngưỡng đường huyết nguy hiểm (đã bỏ hàm `isVirtualPatient` vì chỉ Dashboard dùng)

Nhờ vậy, tính năng **"báo người thân khi bỏ thuốc/đường huyết nguy hiểm"** (đã xây trong các phiên gần đây) vẫn hoạt động đầy đủ trên nhánh này — đã kiểm thử trực tiếp bằng cách gọi API thật, xác nhận job `missed-dose-check` vẫn chạy đúng.

Bảng `care_links`, `medication_logs`, `clinical_alerts` trong database **giữ nguyên schema** — không xoá migration `017_clinical_care_layer.js` vì `care_links`/`medication_logs` vẫn được dùng cho tính năng liên kết người thân (`/api/v1/care-links`) và lịch sử tuân thủ thuốc phía bệnh nhân, không riêng gì Clinic.

---

## 2. Đã kiểm chứng thực tế trước khi commit

- ✅ `npm run build --prefix frontend` — build production thành công, không lỗi
- ✅ `eslint` trên các file đã sửa tay (`ScanPrescriptionPage.jsx`, `LoginPage.jsx`) — không phát sinh lỗi mới
- ✅ Backend khởi động thành công (`node server.js`), migrations chạy đúng
- ✅ `GET /api/v1/clinic/patients` → `404` (route đã biến mất hoàn toàn)
- ✅ `POST /api/v1/jobs/missed-dose-check` → `200` (tính năng báo người thân vẫn hoạt động)
- ✅ Grep toàn bộ `frontend/src` và `backend/src` xác nhận không còn import/route nào trỏ tới các file đã xoá

---

## 3. Cách chạy / build

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev          # http://localhost:3001

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # build production vào frontend/dist
```

## 4. Hướng dẫn triển khai production

- Deploy `backend/` như một Node service bình thường (xem `render.yaml` ở root — đã có sẵn khai báo service web + cron job kiểm tra bỏ thuốc).
- Deploy `frontend/dist/` (sau `npm run build`) lên bất kỳ static host nào (Vercel, Render Static Site...).
- Cấu hình biến môi trường bắt buộc: `JWT_SECRET`, `DATABASE_URL` (Postgres cho production), `CRON_SECRET` (khớp với cron job), các key AI (`GEMINI_API_KEY`/`ANTHROPIC_API_KEY`) cho tính năng quét đơn thuốc.
- Nhánh này **không cần** cấu hình gì thêm liên quan Clinic (không còn route/biến môi trường nào dành riêng cho Dashboard bác sĩ).

## 5. Việc tiếp theo (nếu cần)

- Nếu muốn merge các cải tiến mới hơn từ `master` vào nhánh này sau này: rebase/merge bình thường — vì nhánh này dựa trên `master` đầy đủ, xung đột (nếu có) sẽ chỉ xảy ra ở đúng các file Clinic đã xoá, dễ giải quyết (chọn giữ bản đã xoá).
- Nếu sau này thêm tính năng mới trên `master` mà lỡ tay import lại thứ gì đó từ `pages/Clinic/*`, build sẽ báo lỗi ngay (module not found) — đó là tín hiệu tốt để phát hiện sớm.
