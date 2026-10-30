# CLAUDE.md — DIA+ (cập nhật 30/10/2026)

Đọc hết file này trước khi sửa code. Bản cũ (có Cute Mode, 5 tab, tài khoản mẫu...) nằm ở `docs/archive/CLAUDE_OLD_2026-10.md`, chỉ để tra cứu lịch sử.

## 1. DIA+ là gì
Ứng dụng **nhắc uống thuốc cho người lớn tuổi (ưu tiên đái tháo đường) và báo cho người nhà khi bỏ liều**. Hướng đi đã chốt với mentor: **giữ hướng này**, KHÔNG chuyển sang "sổ thuốc đa nguồn + dược sĩ rà soát".

Ba người dùng: **người bệnh** (nhận nhắc, bấm đã uống), **người nhà** (nhận báo khi bỏ liều, xem dòng thời gian), **hộ lý** (tick liều hộ, ghi chú).
Lõi sản phẩm: quét đơn thuốc → lên lịch → nhắc đúng giờ → xác nhận đã uống → nếu quên thì báo người nhà → người nhà bấm "Đã biết".

**Không làm** (đã thử và gỡ, hoặc ngoài hướng): mô hình 3D / digital twin, Cute Mode, bán thuốc, dược sĩ duyệt đơn, thuốc đa nguồn.

## 2. Stack
- Frontend: React 19 + Vite, Zustand, CSS Modules, PWA + Capacitor (Android/iOS, appId `vn.diaplus.app.quy`), i18n vi/en/lo. Chạy `npm run dev` (cổng 5173).
- Backend: Express + Knex, SQLite (dev) / Postgres (prod), JWT, Zod, helmet, express-rate-limit. Chạy `npm run dev` (cổng 3001).
- Triển khai: Render (web `diaplus-backend` + cron `diaplus-missed-dose-cron` 5 phút/lần), Vercel (frontend).
- Quét đơn: Gemini → Claude → Tesseract. Chưa đo độ chính xác trên đơn thật (chỉ có benchmark chủ yếu ảnh tổng hợp, xem `BENCHMARK_REPORT.md`).

## 3. Vòng chăm sóc (nơi sản phẩm tạo ra giá trị)
- Nhắc: `backend/src/jobs/doseReminder.js` (Telegram, Zalo ZNS), nhắc trong app qua `frontend/src/components/common/VoiceAlertEngine.jsx` (chỉ chạy khi app mở).
- Quên liều: `jobs/missedDoseChecker.js` (ân hạn 15 phút) → `modules/alerts/alert.service.js` → `caregiverNotify.js` (Telegram, ZNS, SMS webhook, email).
- Xác nhận: `modules/medications/adherence.service.js#logDose` (mọi đường ghi liều đều đi qua đây).
- Người nhà: liên kết bằng mã `user_code` (`care_links`), bấm "Đã biết" ghi vào `alert_acks`.
- **Sự kiện đo lường** (`care_events`): `reminder_sent`, `dose_confirmed`, `caregiver_alert_sent`, `caregiver_alert_acked`. Ghi qua `services/careEvents.service.js` (không bao giờ throw, không lưu tên thuốc/SĐT). Xem phễu: `GET /api/v1/analytics/care-funnel` (header `X-Admin-Key`).

## 4. Quy tắc dữ liệu — QUAN TRỌNG
- **Không được bịa số liệu hay nội dung y tế** trong giao diện hoặc API. Chưa có dữ liệu thì hiện "Chưa cập nhật" / "—". Không dùng `|| 100`, `Math.random()`, tên người mẫu, phác đồ mẫu.
- Dữ liệu minh họa chỉ được nằm trong trang giới thiệu (`LandingPage`) và phải nhìn rõ là minh họa.
- Chế độ Hộ lý / Người giám sát hiện lưu **cục bộ trên máy** (`store/roleModeStore.js`, khóa `diaplus_caregiver_data_v2`), chưa đồng bộ server. Đừng mô tả nó là dữ liệu đồng bộ.
- Giọng người thân (`voiceAlert.service.js`) chỉ lưu trên máy ghi âm, chưa gửi sang máy người bệnh.
- Dữ liệu sức khỏe là dữ liệu nhạy cảm (PDPL 91/2025): không log tên thuốc, nội dung đơn, SĐT vào log hay bảng đo lường.
- Seed (`backend/database/seeds`) chứa tài khoản mẫu và tự từ chối chạy ở production.

## 5. Bảo mật — đã chốt, đừng nới lại
- CORS là danh sách trắng (`server.js`). Thêm domain mới qua `FRONTEND_URL` / `PREVIEW_FRONTEND_URL`, không mở đuôi `*.vercel.app`.
- Không có khóa mặc định. Production bắt buộc `JWT_SECRET` (≥32 ký tự, không phải giá trị đã lộ) và `ADMIN_DASHBOARD_KEY`; thiếu `CRON_SECRET` thì endpoint cron bị khóa.
- Rate limit chỉnh bằng biến môi trường `RATE_LIMIT_API_MAX` (600), `RATE_LIMIT_AUTH_MAX` (100), `RATE_LIMIT_TRACK_MAX` (120) trên 15 phút/IP.
- Body JSON 1MB (riêng `/advice/analyze-meal` 15MB). Quét đơn dùng multipart.
- `POST /analytics/wipe-data` bị khóa ở production (cần `ALLOW_ADMIN_WIPE=1` và `{"confirm":"XOA-TOAN-BO"}`).

## 6. Lệnh hay dùng
```bash
cd backend && cp .env.example .env && npm install && npm run migrate && npm run dev
cd backend && npm test          # toàn bộ test (không cần mạng, dùng SQLite tạm)
cd frontend && npm install && npm run dev
cd frontend && npm run build    # phải qua trước khi commit
```

## 7. Quy ước code
- Frontend: CSS Modules, không Tailwind. Gọi API qua `services/*.service.js`, trạng thái qua Zustand store. Chữ ≥14px (nội dung 16–18px), nút ≥48px.
- Tên file: trang `PascalCasePage.jsx`, component `PascalCase.jsx`, store `camelCaseStore.js`, service `camelCase.service.js`.
- Backend: mỗi module có `*.routes.js`, `*.controller.js`, `*.service.js`; lỗi ném `{ status, message }`. Migration mới đặt tên `YYYYMMDDHHMMSS_ten.js`.
- Thông báo lỗi và chữ hiển thị bằng tiếng Việt, đủ dấu. Ngưỡng đường huyết lấy từ `constants` / `insights.logic.js`, không chép số vào chỗ khác.
- Mỗi thay đổi hành vi phải kèm test chạy được bằng `npm test`. Khi nhắc/báo/xác nhận thay đổi, nhớ ghi sự kiện tương ứng.

## 8. Việc đang làm (theo thứ tự)
1. Giai đoạn 0 (xong ở bản này): bảo mật, bỏ dữ liệu mẫu, ghi sự kiện cốt lõi, dọn rác.
2. Giai đoạn 1: vòng xác nhận đã uống có leo thang (nhắc lại → báo người nhà → gọi) và đo bằng `care_events`.
3. Giai đoạn 2: giọng người thân đồng bộ qua server, bỏ TTS không chính thức của Google Translate.
4. Giai đoạn 3: đồng ý PDPL và phân quyền người chăm sóc. Giai đoạn 4: đo OCR trên 50–100 đơn thật. Giai đoạn 5: thu tiền gói Gia đình.
Chưa có thu tiền: nút "Nâng gói" chỉ mở giao diện Gold bằng mã; `users.plan='pro'` hiện do đặt tay.
