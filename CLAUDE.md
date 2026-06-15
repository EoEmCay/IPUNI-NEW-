# CLAUDE.md — IPUNI Project Guide

> Tài liệu này dành cho Claude AI. Đọc kỹ trước khi làm bất kỳ thay đổi nào.

---

## 1. Tổng quan dự án

**IPUNI** là Progressive Web App (PWA) y tế dành cho bệnh nhân tiểu đường.
- Giao diện hoàn toàn **tiếng Việt**, mobile-first (max-width: 430px)
- Repo: https://github.com/EoEmCay/IPUNI-NEW-
- Stack: React 19 + Vite (frontend) / Express + SQLite + Knex (backend)

---

## 2. Cài đặt & Chạy

### Backend (cổng 3001)
```bash
cd backend
cp .env.example .env        # Tạo file .env
npm install
npm run migrate             # Tạo database schema
npm run seed                # Tạo dữ liệu mẫu
npm run dev                 # Chạy với hot-reload (node --watch)
```

### Frontend (cổng 5173)
```bash
cd frontend
npm install
npm run dev
```

### File `.env` (backend)
```
PORT=3001
JWT_SECRET=ipuni-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 3. Tài khoản mẫu
| CCCD / Email | Mật khẩu | Vai trò |
|---|---|---|
| `000000000001` hoặc `khoi@example.com` | admin | Bệnh nhân Plan Pro - Demo |
| `000000000002` hoặc `admin@example.com` | admin | Admin Plan Pro |

> Chạy `cd backend && npm run seed` để tạo tài khoản demo (sẽ **không xóa** dữ liệu người dùng thật).

Đăng nhập bằng email **hoặc** CCCD. Token lưu tại `localStorage['diaplus_token']`.

---

## 4. Kiến trúc thư mục

```
ipuni/
├── backend/
│   ├── server.js                   # Entry point Express
│   ├── knexfile.js                 # Cấu hình SQLite
│   ├── database/
│   │   ├── ipuni.db                # SQLite database file
│   │   ├── migrations/             # Schema migrations (Knex)
│   │   └── seeds/                  # Seed data
│   └── src/
│       ├── config/
│       │   ├── constants.js        # JWT_SECRET, JWT_EXPIRES_IN
│       │   └── database.js         # Knex instance
│       ├── middlewares/
│       │   ├── auth.middleware.js  # JWT verify → req.user
│       │   ├── error.middleware.js # Global error handler
│       │   └── validate.middleware.js # Zod validation
│       ├── modules/
│       │   ├── auth/               # Login, register, getMe, logout
│       │   ├── metrics/            # Chỉ số đường huyết
│       │   ├── medications/        # Đơn thuốc
│       │   ├── appointments/       # Lịch hẹn bác sĩ
│       │   ├── advice/             # Lời khuyên sức khỏe
│       │   └── users/              # Profile người dùng
│       └── utils/
│           ├── date.helper.js      # daysAgo()
│           └── response.helper.js  # sendSuccess(), sendError()
│
└── frontend/
    ├── index.html                  # Có Google Fonts Quicksand (cho Cute Mode)
    ├── vite.config.js              # Vite + PWA config
    └── src/
        ├── main.jsx                # Entry — import themeStore trước App
        ├── App.jsx                 # Router + ProtectedRoute
        ├── styles/
        │   ├── global.css          # CSS variables (2 themes), layout globals
        │   └── animations.css      # Keyframe animations dùng chung
        ├── store/                  # Zustand stores
        │   ├── authStore.js        # user, token, isAuthenticated
        │   ├── themeStore.js       # isCuteMode, toggleCuteMode
        │   ├── metricsStore.js
        │   ├── medicationsStore.js
        │   ├── appointmentsStore.js
        │   └── adviceStore.js
        ├── services/               # Axios calls → backend API
        │   ├── api.js              # Axios instance + interceptors
        │   ├── auth.service.js
        │   ├── metrics.service.js
        │   ├── medications.service.js
        │   ├── appointments.service.js
        │   └── advice.service.js
        ├── hooks/                  # Custom hooks bọc store + service
        │   ├── useAuth.js
        │   ├── useMetrics.js
        │   ├── useMedications.js
        │   ├── useAppointments.js
        │   └── useAdvice.js
        ├── constants/
        │   ├── metrics.js          # METRIC_TYPES, HYPOGLYCEMIA_THRESHOLD, getMetricStatus()
        │   └── routes.js
        ├── components/
        │   ├── common/             # Tái sử dụng toàn app
        │   │   ├── Modal.jsx       # Bottom sheet — dùng createPortal (quan trọng!)
        │   │   ├── Button.jsx
        │   │   ├── Input.jsx
        │   │   ├── Card.jsx
        │   │   ├── EmptyState.jsx
        │   │   ├── FilterPills.jsx
        │   │   └── SuccessToast.jsx  # Toast giữa màn hình sau khi lưu
        │   ├── layout/
        │   │   ├── AppLayout.jsx   # TopBar + page-content + BottomNav
        │   │   ├── TopBar.jsx      # Logo + Bell + UserMenu
        │   │   ├── BottomNav.jsx   # 5 tabs điều hướng
        │   │   ├── UserMenu.jsx    # Avatar → dropdown (Thông Tin / Cài Đặt / Đăng Xuất)
        │   │   ├── UserProfileModal.jsx  # Thẻ thông tin BHYT
        │   │   └── SettingsModal.jsx     # Toggle Cute Mode + các cài đặt
        │   ├── metrics/
        │   │   ├── MetricCard.jsx  # MetricCard + AddMetricCard
        │   │   ├── AddMetricModal.jsx  # Form nhập + SuccessToast
        │   │   ├── MetricHistoryItem.jsx
        │   │   └── BloodGlucoseChart.jsx  # Recharts
        │   ├── medications/
        │   │   └── MedicationCard.jsx
        │   ├── appointments/
        │   │   ├── AppointmentCard.jsx
        │   │   └── DoctorNoteCard.jsx
        │   ├── advice/
        │   │   ├── AdviceCard.jsx
        │   │   └── AlertBanner.jsx
        │   └── cute/               # Cute Mode illustrations
        │       ├── CuteBackground.jsx   # Nền thiên hà pastel + sao + hành tinh
        │       ├── CuteCatWidget.jsx    # Hình mèo + nhịp tim (dùng ảnh URL thật)
        │       └── CuteAstronautCat.jsx # Mèo phi hành gia SVG + viên thuốc
        └── pages/
            ├── Login/LoginPage.jsx
            ├── Register/RegisterPage.jsx
            ├── Dashboard/DashboardPage.jsx   # Trang chủ — tổng quan
            ├── Metrics/MetricsPage.jsx
            ├── Medications/MedicationsPage.jsx
            ├── Appointments/AppointmentsPage.jsx
            ├── Advice/AdvicePage.jsx
            └── ScanPrescriptionPage.jsx      # Camera scan đơn thuốc (WIP)
```

---

## 5. Database Schema (SQLite)

### `users`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | nullable (user tự cập nhật) |
| email | TEXT UNIQUE | nullable |
| cccd | TEXT(12) UNIQUE | nullable |
| phone | TEXT UNIQUE | nullable |
| password_hash | TEXT | bcrypt |
| diagnosis | TEXT | mặc định `type2_diabetes` |
| created_at / updated_at | DATETIME | |

### `metrics`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK → users | |
| type | TEXT | `fasting` / `post_meal_2h` / `pre_meal` / `pre_sleep` |
| value | FLOAT | mmol/L |
| measured_at | DATETIME | |
| note | TEXT | tùy chọn |

### `medications`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK → users | |
| name | TEXT | |
| dosage | TEXT | |
| frequency | TEXT | |
| times | TEXT | JSON array, e.g. `["07:00","19:00"]` |
| instructions | TEXT | |
| doctor_name | TEXT | |
| prescribed_at | DATE | |
| is_active | INTEGER | 0/1 |

### `appointments`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK → users | |
| doctor_name | TEXT | |
| department | TEXT | |
| scheduled_at | DATETIME | |
| location | TEXT | |
| note | TEXT | dùng làm ghi chú bác sĩ |
| status | TEXT | `upcoming` / `completed` / `cancelled` |

### `advice`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INTEGER PK | |
| category | TEXT | |
| title | TEXT | |
| content | TEXT | |
| sort_order | INTEGER | |
| is_active | INTEGER | |

---

## 6. API Endpoints

**Base URL:** `http://localhost:3001/api/v1`
**Auth:** Header `Authorization: Bearer <token>` (JWT, 7 ngày)

### Auth (`/auth`)
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | ✗ | identifier (email/cccd) + password |
| POST | `/auth/register` | ✗ | cccd + phone + password |
| GET | `/auth/me` | ✓ | Lấy thông tin user hiện tại |
| POST | `/auth/logout` | ✓ | Logout |

### Scan Prescription (`/scan`)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/scan/prescription` | Upload ảnh đơn thuốc, AI phân tích (Gemini/Anthropic) |

### Metrics (`/metrics`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/metrics/latest` | Chỉ số mới nhất theo từng type |
| GET | `/metrics?type=&days=7` | Lịch sử, lọc theo type và số ngày |
| POST | `/metrics` | Tạo chỉ số mới |
| DELETE | `/metrics/:id` | Xóa chỉ số |

### Medications (`/medications`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/medications/today` | Thuốc hôm nay |
| GET | `/medications` | Tất cả thuốc đang active |
| POST | `/medications` | Thêm thuốc |
| PUT | `/medications/:id` | Cập nhật |
| DELETE | `/medications/:id` | Xóa |

### Appointments (`/appointments`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/appointments/doctor-notes` | Lịch hẹn có ghi chú bác sĩ |
| GET | `/appointments?status=` | Tất cả lịch hẹn |
| POST | `/appointments` | Tạo lịch hẹn |
| PUT | `/appointments/:id` | Cập nhật |
| DELETE | `/appointments/:id` | Xóa |

### Advice (`/advice`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/advice?category=` | Lời khuyên, lọc theo category |

---

## 7. Ngưỡng đường huyết (mmol/L)

| Loại | Bình thường | Cảnh báo | Nguy hiểm |
|---|---|---|---|
| Lúc đói (fasting) | < 7 | 7–10 | > 10 |
| Sau ăn 2h (post_meal_2h) | < 7.8 | 7.8–11.1 | > 11.1 |
| Trước ăn (pre_meal) | 4.4–7.2 | — | > 10 |
| Trước ngủ (pre_sleep) | 5.0–8.3 | — | > 10 |
| **Hạ đường huyết** | — | — | **< 3.9** |

Hàm `getMetricStatus(type, value)` trả về: `'low'` / `'normal'` / `'warning'` / `'danger'`

---

## 8. Quy tắc CSS / Frontend

```
✅ Luôn dùng CSS Modules (*.module.css) cho mỗi component
✅ CSS variables định nghĩa trong src/styles/global.css
✅ Mobile-first: max-width container = 430px
❌ KHÔNG dùng inline styles (style={{ }})
❌ KHÔNG dùng Tailwind
❌ SVG presentation attributes (fill=, stroke=) là OK — không phải inline style
```

### CSS Variables chính
```css
/* Dùng var() để tự động hỗ trợ cả 2 theme */
var(--color-primary)        /* #1B5FA6 | #A855F7 cute */
var(--color-primary-light)  /* #EEF4FF | #F5F0FF cute */
var(--color-bg)             /* #F4F6F9 | #FDF8FF cute */
var(--color-surface)        /* #FFFFFF */
var(--color-text-primary)   /* #1A2332 | #2D1B69 cute */
var(--color-text-secondary) /* #6B7A8D | #7C6B8E cute */
var(--color-success)        /* #22C55E | #34D399 cute */
var(--color-danger)         /* #EF4444 | #F87171 cute */
var(--color-warning)        /* #F59E0B | #FBBF24 cute */
var(--color-border)         /* #E2E8F0 | #E9D5FF cute */
var(--radius-sm/md/lg)      /* 8/12/16px | 14/20/28px cute */
var(--font-body)            /* System UI | Quicksand cute */
```

---

## 9. Hệ thống Theme (Cute Mode)

### Cách hoạt động
1. `themeStore.js` (Zustand) — khởi tạo ngay khi import trong `main.jsx`
2. Apply `data-theme="cute"` lên `<html>` element
3. Lưu preference vào `localStorage['ipuni-theme']`
4. Tất cả component dùng CSS variables → tự đổi màu không cần sửa thêm

### Toggle
- **Vị trí:** TopBar → Avatar icon → Cài Đặt → Toggle "Cute Mode"
- **Component:** `SettingsModal.jsx`

### Cute Mode visual differences
| Yếu tố | Default | Cute Mode |
|---|---|---|
| Màu chủ | Navy blue #1B5FA6 | Lavender #A855F7 |
| Font | System UI | Quicksand (Google Fonts) |
| Border-radius-md | 12px | 20px |
| Background | Cool gray | Light lavender |
| TopBar icon | Activity | Sparkles ✨ + badge "cute" |
| Dashboard | Giao diện chuẩn | CuteBackground + CuteCatWidget + CuteAstronautCat |

### Cute components (src/components/cute/)
- **CuteBackground** — Fixed layer z-index:0, pointer-events:none. 22 sao CSS nth-child, 4 cloud blur, 3 hành tinh với animation
- **CuteCatWidget** — Hình mèo thật (URL Google AIDA), heartbeat SVG gradient, animation pulseOpacity
- **CuteAstronautCat** — SVG thuần: mèo trong helmet + suit tím + 3 viên thuốc nổi. Có 2 variant: `size="icon"` (28px) và `size="full"` (140px)

---

## 10. Layout & Z-index

```
z-index: 9000  → Modal overlay (createPortal → document.body)
z-index: 8999  → UserMenu dropdown (createPortal → document.body)
z-index: 100   → TopBar, BottomNav
z-index: 1     → Page content
z-index: 0     → CuteBackground
```

### LỖI QUAN TRỌNG ĐÃ SỬA
> **TopBar có `transform: translateX(-50%)` → phá vỡ `position: fixed` của children.**
> Tất cả Modal và Dropdown PHẢI dùng `ReactDOM.createPortal(..., document.body)`
> để thoát khỏi stacking context của TopBar.

---

## 11. State Management (Zustand)

### `authStore`
```js
{ user, token, isAuthenticated, setAuth(token, user), setUser(user), logout() }
```

### `themeStore`
```js
{ isCuteMode, toggleCuteMode() }
// Tự apply data-theme và lưu localStorage
```

### Các store khác (`metricsStore`, `medicationsStore`, v.v.)
- Pattern: `{ data, loading, error, fetchXxx(), addXxx(), deleteXxx() }`
- Hooks bọc store: `useMetrics()`, `useMedications()`, v.v.

---

## 12. Các Component quan trọng

### Modal (common/Modal.jsx)
- Dùng `createPortal` — **bắt buộc** để tránh lỗi z-index với TopBar
- Bottom sheet animation, max-height 90vh, body scroll độc lập

### UserMenu (layout/UserMenu.jsx)
- Dropdown dùng `createPortal` + `getBoundingClientRect()` để tính vị trí tuyệt đối
- 3 mục: Thông Tin → `UserProfileModal`, Cài Đặt → `SettingsModal`, Đăng Xuất

### AddMetricModal (metrics/AddMetricModal.jsx)
- Sau khi lưu thành công: gọi `onSuccess()` callback → đóng modal → hiện `SuccessToast`
- SuccessToast: pill xanh lá, animation slideUp, tự ẩn sau 1.5s

### SuccessToast (common/SuccessToast.jsx)
- `position: fixed; top: 50%; left: 50%` — render từ DashboardPage (không bị ảnh hưởng transform)

---

## 13. Màu sắc & Design tokens

| Token | Hex | Dùng cho |
|---|---|---|
| Primary | #1B5FA6 | Buttons, links, icons, header |
| Success | #22C55E | Trạng thái bình thường, toast |
| Danger | #EF4444 | Ngưỡng nguy hiểm, đăng xuất |
| Warning | #F59E0B | Cảnh báo |
| Surface | #FFFFFF | Card backgrounds |
| BG | #F4F6F9 | Page background |

---

## 14. Các tính năng đã hoàn thành

- [x] Đăng nhập / Đăng ký (email hoặc CCCD)
- [x] Dashboard: chỉ số gần nhất + thuốc hôm nay
- [x] Nhập chỉ số đường huyết + SuccessToast animation
- [x] Lịch sử chỉ số + biểu đồ (Recharts)
- [x] Quản lý thuốc (CRUD)
- [x] Lịch hẹn bác sĩ + ghi chú bác sĩ
- [x] Lời khuyên sức khỏe theo category
- [x] UserMenu: Avatar → dropdown → Thông Tin / Cài Đặt / Đăng Xuất
- [x] Trang Thông Tin (BHYT card style)
- [x] Cute Mode (theme switching, persistent localStorage)
- [x] PWA manifest (installable)
- [x] AI Prescription Scanning (Gemini API + Anthropic SDK)
- [x] i18n support (VI/EN/LO)

## 15. Tính năng chưa hoàn thành / cần làm tiếp

- [ ] **Cài Đặt → Nhắc đo đường huyết** — UI có, logic notification chưa implement
- [ ] **Cài Đặt → Quyền riêng tư** — placeholder "Sắp ra mắt"
- [ ] **Profile update** — `UserProfileModal` chỉ hiển thị, chưa có form chỉnh sửa
- [ ] **BHYT fields** (insuranceNumber, bloodType, allergies) — chưa có trong DB schema
- [ ] **Push notification** — nhắc uống thuốc, nhắc đo đường huyết
- [ ] **Offline mode** — PWA đã cấu hình nhưng chưa test cache strategy

## 16. Hệ Thống 2 Plan (Pricing)

### Free Plan
- ✅ Theo dõi chỉ số đường huyết
- ✅ Quản lý thuốc cơ bản
- ✅ Lịch hẹn bác sĩ
- ✅ Lời khuyên sức khỏe
- ✅ Cute Mode
- **⚠️ Giới hạn:** Quét đơn thuốc tối đa **3 lần/tháng**

### Pro Plan (49.000đ/tháng)
- ✅ Tất cả tính năng Free
- ✅ Quét đơn thuốc **không giới hạn**
- ✅ Biểu đồ HbA1c & xu hướng
- ✅ Nhắc uống thuốc thông minh
- ✅ Tư vấn dinh dưỡng AI
- ✅ Đồng bộ thiết bị đo
- ✅ Chia sẻ với bác sĩ
- ✅ Hỗ trợ ưu tiên 24/7
- ✅ Mở khóa tất cả A-Styles (100+ giao diện & avatar)

### Implementation Details
- **Database:** Column `plan` trong `users` (default: 'free')
- **Tracking:** Table `scan_usages` ghi lại mỗi lần scan (user_id, scanned_at, result)
- **Backend Logic:** Controller check plan + count scans trong tháng hiện tại
- **Frontend UI:** Badge hiển thị "X lần còn lại", color warning khi ≤ 1 lần
- **Payment:** QR code Techcombank (STK: 30068889999), content: `<user_code> - NANG CAP DIA+ <plan_name>`

## 17. i18n Implementation Progress (v1.3.0)

### ✅ Hoàn thành
- [x] Metric status labels (low, normal, warning, danger)
- [x] Metric type labels & thresholds
- [x] Appointment status labels
- [x] Advice page category labels
- [x] Date formatting (days + months arrays)
- [x] MetricCard component → using i18n
- [x] AppointmentCard component → using i18n
- [x] Translation files: vi.js, en.js, lo.js

### 🔄 Đang tiến hành
- [ ] **PRIORITY 1** - Critical components:
  1. **BloodGlucoseChart.jsx** - Status labels, time labels ("7 ngày", "14 ngày", "30 ngày")
  2. **MetricHistoryItem.jsx** - Status labels + date formatting
  3. **ScanPrescriptionPage.jsx** - 20+ strings (detail labels, error messages, buttons)
  4. **AdvicePage.jsx** - Category filter labels

- [ ] **PRIORITY 2** - UI components:
  1. **UpgradeModal.jsx** - 40+ strings (features, payment UI, buttons)
  2. **UserProfileModal.jsx** - Form labels, section titles, placeholders
  3. **AlertBanner.jsx** - Alert status text
  4. **MedicationCard.jsx** - Button text ("Đã uống")
  5. **TopBar.jsx** - Tooltip text

- [ ] **PRIORITY 3** - Pages & modals:
  1. **ScanCamera.jsx** - Button labels, descriptions
  2. **SettingsModal.jsx** - Already using i18n (check for fallbacks)
  3. **RegisterPage.jsx** - Already using i18n (check for fallbacks)

### Remaining hardcoded Vietnamese text:
**Total: ~80+ strings** across 15+ files

### How to complete:
1. Use `useT()` hook: `const t = useT()`
2. Replace hardcoded strings: `"Tiếng Việt"` → `t.language?.vietnamese || 'Vietnamese'`
3. Add new translation keys to: `vi.js`, `en.js`, `lo.js`
4. Test by switching languages in Settings

---

## 18. Thay đổi gần đây (v1.1.0 & v1.2.0)

### Cập nhật Frontend (v1.1.0)
- ✅ Favicon: `dia.jpg` trên tab browser
- ✅ Title: Sửa từ "DIA+ - Theo dõi tiểu đường" → "DIA+"
- ✅ Package.json đã cài xong: Vite, React 19, Recharts, Zustand, axios

### Cập nhật Backend (v1.1.0)
- ✅ Module `scan` hoàn thành: POST `/api/v1/scan/prescription` dùng Gemini/Anthropic AI
- ✅ Module `users` support
- ✅ Token key: `diaplus_token` (thay vì `ipuni_token`)

### Cập nhật v1.2.0 — Pricing & Limits
- ✅ Backend: Migration `011_create_scan_usages.js` tracking scan usage
- ✅ Backend: Scan controller check `plan === 'free'` + count current month scans
- ✅ Backend: Trả về error 429 khi free user dùng hết 3 lần/tháng
- ✅ Frontend: Loại bỏ blocking page cho free users
- ✅ Frontend: Thêm badge counter "X lần còn lại" ở header
- ✅ Frontend: Show error + upgrade button khi hết limit
- ✅ Frontend: UpgradeModal đã hoàn thành (QR payment Techcombank)

---

## 16. Conventions quan trọng

### Đặt tên file
- Pages: `PascalCase/PascalCasePage.jsx` + `PascalCasePage.module.css`
- Components: `PascalCase.jsx` + `PascalCase.module.css`
- Hooks: `useCamelCase.js`
- Stores: `camelCaseStore.js`
- Services: `camelCase.service.js`

### API calls
```js
// Luôn dùng qua service + store/hook, không gọi api trực tiếp từ component
const { metrics, addMetric } = useMetrics(); // ✅
import api from '../services/api'; api.get(...) // ❌ trong component
```

### Thêm tính năng mới
1. Migration mới trong `backend/database/migrations/`
2. Service trong `backend/src/modules/xxx/`
3. Route trong `backend/src/modules/xxx/xxx.routes.js`
4. Service file frontend `frontend/src/services/xxx.service.js`
5. Store `frontend/src/store/xxxStore.js`
6. Hook `frontend/src/hooks/useXxx.js`
7. Component + CSS Module

---

## 17. Lưu ý khi deploy

- Thay `JWT_SECRET` trong `.env` thành key mạnh hơn
- `api.js` hardcode `http://localhost:3001` → cần đổi thành domain production
- SQLite phù hợp dev; production nên migrate sang PostgreSQL (Knex hỗ trợ)
- `cors({ origin: '*' })` → nên restrict origin khi production
