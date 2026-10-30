# DIA+ - Ứng dụng Theo dõi Tiểu Đường

## 📋 Thông tin Dự án

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên** | DIA+ (formerly IPUNI) |
| **Mô tả** | Progressive Web App (PWA) theo dõi sức khỏe cho bệnh nhân tiểu đường |
| **Ngôn ngữ** | Tiếng Việt (hỗ trợ EN, LO) |
| **Repository** | https://github.com/EoEmCay/IPUNI-NEW- |
| **Version** | 1.1.0 |
| **Trạng thái** | Active Development |

---

## 🏗️ Kiến Trúc Kỹ Thuật

### Stack Công Nghệ

#### Frontend
- **Framework:** React 19 + Vite 8
- **State Management:** Zustand
- **Styling:** CSS Modules (Mobile-first, max-width: 430px)
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v7
- **PWA:** vite-plugin-pwa
- **Font:** Google Fonts Quicksand (Cute Mode)

#### Backend
- **Runtime:** Node.js v24
- **Framework:** Express.js
- **Database:** SQLite3 (Dev) | PostgreSQL (Prod ready)
- **ORM/Query Builder:** Knex.js
- **Authentication:** JWT (7 days)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer (Memory storage)
- **Validation:** Zod
- **AI Integration:** Gemini API + Anthropic SDK (Prescription scanning)
- **CORS:** Enabled for all origins

---

## 📁 Cấu Trúc Thư Mục

```
ipuni/
├── backend/
│   ├── server.js                           # Entry point Express
│   ├── knexfile.js                         # Knex config
│   ├── database/
│   │   ├── ipuni.db                        # SQLite DB
│   │   ├── migrations/                     # 6 migrations
│   │   └── seeds/
│   └── src/
│       ├── config/                         # JWT, DB config
│       ├── middlewares/                    # Auth, error, validate
│       ├── modules/
│       │   ├── auth/                       # Login/Register
│       │   ├── metrics/                    # Blood glucose data
│       │   ├── medications/                # Medicine management
│       │   ├── appointments/               # Doctor appointments
│       │   ├── advice/                     # Health tips
│       │   ├── users/                      # User profile
│       │   └── scan/                       # AI prescription scanning
│       └── utils/
│
└── frontend/
    ├── index.html                          # Title: "DIA+", Favicon: dia.jpg
    ├── vite.config.js                      # Vite + PWA + Chrome auto-open
    └── src/
        ├── main.jsx                        # Entry point
        ├── App.jsx                         # Router setup
        ├── styles/                         # Global CSS + animations
        ├── store/                          # Zustand stores
        ├── services/                       # Axios API calls
        ├── hooks/                          # Custom hooks
        ├── constants/                      # Metrics thresholds, routes
        ├── components/
        │   ├── common/                     # Reusable components
        │   ├── layout/                     # TopBar, BottomNav, AppLayout
        │   ├── cute/                       # Cute Mode illustrations
        │   ├── metrics/                    # Blood glucose UI
        │   ├── medications/                # Medicine UI
        │   ├── appointments/               # Appointment UI
        │   ├── advice/                     # Health tips UI
        │   └── scan/                       # Camera scan UI
        ├── pages/                          # Page components
        ├── utils/                          # Helper functions
        └── i18n/                           # i18n translations (VI/EN/LO)
```

---

## 🗄️ Database Schema

### Users
```sql
id (PK), name, email (UNIQUE), cccd (UNIQUE), phone (UNIQUE), 
password_hash (bcrypt), diagnosis (default: type2_diabetes), 
created_at, updated_at
```

### Metrics (Blood Glucose)
```sql
id (PK), user_id (FK), type (fasting/post_meal_2h/pre_meal/pre_sleep),
value (mmol/L), measured_at, note
```

### Medications
```sql
id (PK), user_id (FK), name, dosage, frequency, times (JSON),
instructions, doctor_name, prescribed_at, is_active
```

### Appointments
```sql
id (PK), user_id (FK), doctor_name, department, scheduled_at,
location, note (doctor notes), status (upcoming/completed/cancelled)
```

### Advice
```sql
id (PK), category, title, content, sort_order, is_active
```

---

## 🔐 API Endpoints

**Base URL:** `http://localhost:3001/api/v1`
**Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

### Auth
- `POST /auth/login` — Login with email/CCCD + password
- `POST /auth/register` — Register with CCCD + phone + password
- `GET /auth/me` — Get current user
- `POST /auth/logout` — Logout

### Metrics
- `GET /metrics/latest` — Latest by type
- `GET /metrics?type=&days=7` — History
- `POST /metrics` — Add metric
- `DELETE /metrics/:id` — Delete metric

### Medications
- `GET /medications` — All active medications
- `GET /medications/today` — Today's medications
- `POST /medications` — Add medication
- `PUT /medications/:id` — Update
- `DELETE /medications/:id` — Delete

### Appointments
- `GET /appointments` — All appointments
- `GET /appointments/doctor-notes` — With doctor notes
- `POST /appointments` — Create
- `PUT /appointments/:id` — Update
- `DELETE /appointments/:id` — Delete

### Advice
- `GET /advice?category=` — Health tips by category

### Scan (AI)
- `POST /scan/prescription` — Upload prescription image, AI analyzes

---

## 🎨 UI/UX Features

### Themes
1. **Default Theme**
   - Primary: Navy Blue (#1B5FA6)
   - Font: System UI
   - Border-radius: 12px
   - Background: Cool Gray

2. **Cute Mode**
   - Primary: Lavender (#A855F7)
   - Font: Quicksand
   - Border-radius: 20px
   - Background: Light Lavender
   - Special UI: CuteBackground + CuteCatWidget + CuteAstronautCat

### Key Components
- **Modal:** Bottom sheet (createPortal)
- **TopBar:** Logo + Bell + UserMenu (z-index: 100)
- **BottomNav:** 5 tabs (Metrics, Medications, Appointments, Advice, Menu)
- **SuccessToast:** Auto-hide after 1.5s (animation)
- **Charts:** Recharts for blood glucose trends
- **Responsive:** Mobile-first, max-width 430px

---

## 🩺 Blood Glucose Thresholds (mmol/L)

| Type | Normal | Warning | Danger |
|------|--------|---------|--------|
| Fasting | < 7 | 7–10 | > 10 |
| Post-meal 2h | < 7.8 | 7.8–11.1 | > 11.1 |
| Pre-meal | 4.4–7.2 | — | > 10 |
| Pre-sleep | 5.0–8.3 | — | > 10 |
| **Hypoglycemia** | — | — | **< 3.9** |

---

## 🔄 State Management (Zustand)

```javascript
// authStore
{ user, token, isAuthenticated, setAuth(), setUser(), logout() }

// themeStore
{ isCuteMode, toggleCuteMode() }  // Persists to localStorage

// metricsStore
{ data, loading, error, fetchMetrics(), addMetric(), deleteMetric() }

// medicationsStore, appointmentsStore, adviceStore
{ data, loading, error, fetch...(), add...(), delete...() }
```

---

## 🚀 Getting Started

### Installation
```bash
# Root directory
npm install                    # Install root dependencies
npm run install:all           # Install backend + frontend deps
npm run setup                 # Install + migrate + seed
```

### Development
```bash
# From root: Run backend + frontend concurrently
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

### Environment Setup
```bash
# backend/.env
PORT=3001
JWT_SECRET=ipuni-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Test Account
- **Email:** khoi@example.com
- **Password:** admin
- **Diagnosis:** type2_diabetes

---

## 📱 PWA Features
- ✅ Installable (manifest.json)
- ✅ Responsive design (mobile-first)
- ✅ Offline support (service workers configured)
- ✅ Icon set (192px, 512px)

---

## 🤖 AI Features
- **Prescription Scanning:** Upload image → Gemini/Anthropic API → Extract medicine info
- **Status:** Implemented (backend route: `/scan/prescription`)

---

## 🌐 Internationalization (i18n)
- ✅ Vietnamese (VI)
- ✅ English (EN)
- ✅ Lao (LO)
- Location: `frontend/src/i18n/`

---

## 📊 Recent Updates (v1.1.0)

### Frontend Changes
- ✅ Favicon: Set to `dia.jpg` (displayed on browser tab)
- ✅ Title: Updated from "DIA+ - Theo dõi tiểu đường" → "DIA+"
- ✅ Dependencies: All packages installed (Vite, React 19, etc.)

### Backend Changes
- ✅ Scan module: `/api/v1/scan/prescription` operational
- ✅ Users module: Added support
- ✅ Token key: Updated to `diaplus_token`

---

## ✅ Completed Features

- [x] Login/Register (email or CCCD)
- [x] Dashboard with latest metrics + today's medications
- [x] Blood glucose input with success animation
- [x] Metric history + Recharts visualization
- [x] Medicine management (CRUD)
- [x] Doctor appointments + notes
- [x] Health advice by category
- [x] User menu (Profile / Settings / Logout)
- [x] User profile (BHYT card style)
- [x] Theme switching (Cute Mode)
- [x] PWA installation
- [x] AI Prescription scanning
- [x] Multi-language support

---

## 🔄 TODO List

- [ ] Settings → Medication reminders (UI ready, notification logic pending)
- [ ] Settings → Privacy (placeholder)
- [ ] Profile update (display-only, needs edit form)
- [ ] BHYT fields: insuranceNumber, bloodType, allergies
- [ ] Push notifications (medicine reminders, glucose alerts)
- [ ] Offline mode (service worker optimization)

---

## 📝 Conventions

### File Naming
- Pages: `PascalCase/PascalCasePage.jsx`
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Stores: `camelCaseStore.js`
- Services: `camelCase.service.js`

### CSS
- ✅ CSS Modules for each component
- ✅ Variables in `global.css` (2 themes)
- ❌ No inline styles
- ❌ No Tailwind

### API
- Always use service + store/hook pattern
- Axios instance with interceptors
- Error handling centralized

---

## 🔒 Security Notes

### Current Status
- JWT authentication (7-day expiry)
- bcrypt password hashing
- CORS enabled (⚠️ set to '*' — restrict in production)
- Input validation (Zod)

### Production Checklist
- [ ] Change JWT_SECRET to strong key
- [ ] Restrict CORS origin (not '*')
- [ ] Migrate SQLite → PostgreSQL
- [ ] Enable HTTPS
- [ ] Set secure cookies
- [ ] Rate limiting on auth endpoints

---

## 📞 Contact & Support

**Repository:** https://github.com/EoEmCay/IPUNI-NEW-
**Issues:** Check GitHub issues for bugs/feature requests

---

**Last Updated:** June 10, 2025
**Maintained by:** IPUNI Dev Team
