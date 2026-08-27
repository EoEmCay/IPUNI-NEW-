# Nâng cấp: Audit bảo mật · Hiệu năng/Chi phí · Tầng lâm sàng

Nhánh: `feat/audit-perf-clinical` · 3 commit (`6782792`, `b49a9ce`, `6f53947`)

> Môi trường máy hiện tại chạy **Node 26** → `sqlite3` native + `rolldown` (Vite 8) không build/run được ở đây.
> Toàn bộ code đã qua `node --check` và engine lịch thuốc có **11 test pass**. Việc build/migrate/chạy phải thực hiện trên môi trường Node 20 (Docker/Render).

---

## 1. Bảo mật (Request 1)

| File | Thay đổi |
|---|---|
| `backend/src/config/constants.js` | `throw` khi `JWT_SECRET`/`ADMIN_DASHBOARD_KEY` yếu ở `NODE_ENV=production` |
| `backend/src/middlewares/adminAuth.middleware.js` | Bỏ nhận key qua `?key=`; so sánh `crypto.timingSafeEqual` |
| `backend/src/middlewares/error.middleware.js` | Không trả `err.stack` cho client; log 5xx dạng chung |
| `backend/server.js` | `trust proxy`; CORS whitelist chính xác (bỏ `*.vercel.app`); `express.json({limit:'1mb'})`; log `req.path` (không kèm query); `authLimiter` 1000→40; `process.exit(1)` khi migration lỗi; bắt `unhandledRejection` |
| `backend/src/modules/auth/auth.service.js` | Đăng nhập bằng **email HOẶC CCCD HOẶC SĐT**; thêm `role` vào JWT + payload user |
| `backend/src/modules/appointments/*` | Sửa **mass-assignment** `PUT /:id` (whitelist field + `updateAppointmentSchema`) |
| `backend/src/modules/medications/*` | Sửa **mass-assignment** `PUT /:id`; `parseMed` an toàn với JSON lỗi |
| `.gitignore` | thêm `*.sqlite`, `*.db`, `*.bak`, `token.txt`, `backend/logs/`; gỡ `token.txt` + `.bak` khỏi tracking |

---

## 2. Hiệu năng & Chi phí (Request 2)

| Hạng mục | File | Thay đổi |
|---|---|---|
| Code-splitting | `frontend/src/App.jsx` | `lazy()` + `<Suspense>` cho toàn bộ 10 route sau đăng nhập; Landing/Login/Register vẫn eager |
| Bundle | `frontend/vite.config.js` | `manualChunks` (react-vendor / charts / tour / pdf / storage); `esbuild.drop:['console']`; **bỏ `selfDestroying`** → PWA runtime caching (SWR advice, NetworkFirst API, CacheFirst ảnh/font) |
| Font | `frontend/index.html` | Quicksand tải async (`onload` trick), 5→3 weight; preload logo |
| Cache client | `frontend/src/services/httpCache.js` (mới) | TTL cache + in-flight dedupe; áp vào `medications.service`, `clinic.service` |
| Gộp request | `backend/src/modules/dashboard/dashboard.routes.js` (mới) | `GET /dashboard/summary` = 3 truy vấn song song thay 3 request |
| N+1 | `backend/src/modules/metrics/metrics.service.js` | `getLatestByType`: 5 query → 1 (`ROW_NUMBER() OVER (PARTITION BY ...)`) |
| getMe trùng | `App.jsx` + `hooks/useAuth.js` | Gọi `/auth/me` 1 lần (trước đây 2) |
| DB | `backend/knexfile.js` | WAL + `synchronous=NORMAL` + `cache_size` + `mmap_size` qua `pool.afterCreate`; hỗ trợ `DB_CLIENT=better-sqlite3` / `libsql` qua env |
| DB env | `backend/src/config/database.js` | Chọn config theo `NODE_ENV` (trước đây **luôn** dùng `development`) |
| Hosting $0 | `render.yaml` | `plan: free` + persistent disk 1GB cho SQLite; `JWT_SECRET: generateValue`; `SQLITE_PATH=/var/data/diaplus.db` |
| Container | `backend/Dockerfile` | `npm ci --omit=dev`; **bỏ `npm run seed`** khỏi CMD prod; thêm build tool native |
| Dọn deps | `backend/package.json` | gỡ `vite-plugin-pwa`, `workbox-*` (rác FE); `better-sqlite3` → `optionalDependencies` |

### Chuyển sang Turso (tuỳ chọn, khi cần)
```bash
npm i @libsql/knex            # backend
export DB_CLIENT=libsql TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=...
sqlite3 backend/database/diaplus.db .dump | turso db shell diaplus
```

---

## 3. Tầng lâm sàng (Request 4)

### 3.1 Engine lịch uống thuốc — `backend/src/modules/medications/medicationSchedule.js`
- `daily` / `every_n_days` (cách ngày, GLP-1 hàng tuần) / `days_of_week` / `as_needed`
- Cữ `Sáng/Trưa/Chiều/Tối/Trước ngủ` qua `slots`
- Chuẩn qua **giao thừa, đổi tháng, năm nhuận, lệch múi giờ** (offset VN cố định +7, tính trên `Date.UTC`)
- Suy luận ngược từ `frequency` text cũ (tương thích 100%)
- **11 test**: `npm run test:schedule`

### 3.2 Tuân thủ thuốc — `adherence.service.js` + bảng `medication_logs`
- `POST /medications/:id/logs` (idempotent theo `medication_id + scheduled_for`)
- `GET /medications/adherence?days=30` → `{ adherencePercent, expected, taken, missed, isPoorAdherence }` (ngưỡng < 75%)
- `GET /medications/logs?days=30`
- FE: `store/medicationAdherenceStore.js` (thay Zustand in-memory cũ), `MedicationCard` ghi thẳng DB + optimistic

### 3.3 Đồng bộ 2 chiều + Dashboard phòng khám
- `backend/src/modules/clinic/` : `/clinic/patients` (bảng + cờ đỏ), `/clinic/patients/:id`, `/clinic/alerts/:id/ack`
- Cờ 🚨: ĐH < **3.9**, ĐH > **13.9** (72h gần nhất), tuân thủ < **75%**, không đo > 14 ngày
- Phân loại **BN ảo / thật**: `email LIKE demo_%@ipuni.com`; toggle "Hiện BN ảo"
- FE: `pages/Clinic/ClinicDashboardPage.jsx`, `ClinicPatientPage.jsx` — route `/clinic` gated `role ∈ {doctor, clinic_admin}`

### 3.4 Realtime (không cần F5) — SSE
- `backend/src/realtime/` : `eventBus.js` (in-process) + `sse.controller.js`
- `GET /clinic/stream?token=<jwt>` — chỉ bác sĩ, chỉ nhận sự kiện BN mình quản lý
- Phát tại: `metrics.controller` (nhập chỉ số), `scan.controller` (quét đơn), `medications.controller` (ghi liều), job quên liều
- FE: `hooks/useClinicStream.js` — SSE + **fallback polling 20s** khi lỗi

### 3.5 Cảnh báo Người nhà khi quên thuốc > 60 phút
- Bảng `care_links` (bác sĩ / người nhà, cờ `alert_on_missed_dose`, `alert_on_critical_glucose`)
- `backend/src/jobs/missedDoseChecker.js` — chạy mỗi 5 phút: liều quá giờ > 60' và chưa có log → tạo log `missed` + `clinical_alerts` + `caregiverNotify` (email Brevo)
- `backend/src/modules/clinic/alert.service.js` — đánh giá cờ ĐH critical sau mỗi lần nhập chỉ số

### 3.6 Xuất báo cáo y khoa — `frontend/src/utils/medicalReport.js`
- **PDF** (`jspdf` + `jspdf-autotable`, lazy-load): hành chính BN · thống kê (TB/SD/CV%/eA1c/HbA1c/TIR/số cơn hạ-tăng ĐH) · tuân thủ · danh sách thuốc · nhật ký ĐH tô màu · ô ký bác sĩ
- **Excel** (CSV UTF-8 BOM, 0 thư viện)
- `components/reports/ExportReportButton.jsx` — gắn ở trang **Chỉ số** (BN) và **hồ sơ bệnh nhân** (bác sĩ)

---

## 4. TRIỂN KHAI & KIỂM THỬ (bắt buộc trên Node 20)

```bash
# Backend
cd backend
npm ci                       # hoặc: npm install
npm run test:schedule        # 11 test lịch thuốc phải PASS
npm run migrate              # chạy migration 015 + 016
npm run seed                 # tạo bác sĩ bs.nam@diaplus.vn / doctor123
npm run dev

# Frontend
cd ../frontend
npm ci
npm run build                # kiểm tra chunk: react-vendor / charts / tour / pdf tách riêng
npm run dev
```

### Kịch bản kiểm thử chính
1. **Login CCCD**: đăng nhập bằng số CCCD của tài khoản demo → phải vào được (trước đây fail).
2. **Tuân thủ**: bấm "Đã uống" ở Dashboard → refresh trang → trạng thái vẫn giữ (đã lưu DB).
3. **Cờ đỏ**: đăng nhập BN, nhập chỉ số ĐH = 2.5 (hoặc 15) → mở `/clinic` bằng tài khoản bác sĩ → BN nhảy lên mục "🚨 Cần chú ý" **không cần F5**.
4. **Quên liều**: tạo thuốc có `times` là giờ đã qua > 60' hôm nay, không bấm "Đã uống" → chờ job (≤ 5') → `medication_logs` có bản ghi `missed` + (nếu có `care_links` + `BREVO_*`) email gửi người nhà.
5. **Cách ngày**: tạo thuốc `schedule_type='every_n_days', every_n_days=2, anchor_date=<hôm nay>` → chỉ hiện/nhắc vào ngày chẵn kể từ anchor.
6. **Xuất PDF**: trang Chỉ số → "Xuất PDF y khoa" → file có đủ 4 mục + thống kê.
7. **Migration rollback an toàn**: `npm run migrate:rollback` (2 lần) không mất dữ liệu bảng cũ.

### Lưu ý
- `care_links` hiện tạo qua seed / thủ công. **UI để bệnh nhân tự thêm người nhà** là việc tiếp theo.
- Email người nhà cần `BREVO_USER` + `BREVO_PASS` (hoặc `MAIL_USER/MAIL_PASS`).
- SSE cần reverse proxy không buffer (`X-Accel-Buffering: no` đã set); Render/Fly OK.
- Các file đang sửa dở từ trước (LandingPage, ScanPrescriptionPage, i18n...) **không** nằm trong nhánh này.
