# DIA+ — Tích hợp App Native (iOS + Android, Capacitor 8)

Nhánh: `feat/native-utils` (rẽ từ `origin/master` `442f550`).
Bổ sung tiện ích native lên bản PROD, **không đụng** file nghiệp vụ hiện có.

## Đã thêm

| File | Vai trò | Web (no-op?) |
|---|---|---|
| `frontend/src/lib/native.js` | `initNative()` (status bar, splash, keyboard, nút back Android); `copyText()` (Clipboard plugin) | `isNative=false` → không làm gì |
| `frontend/src/lib/medReminders.js` | `syncMedicationReminders()` / `clearMedicationReminders()` — Local Notification nhắc uống thuốc, chạy **cả khi app đóng** | no-op |
| `frontend/src/utils/saveFile.js` | `saveOrShareFile()` — WKWebView chặn `<a download>` → ghi Filesystem + mở Share sheet | dùng `<a download>` như cũ |
| `medicalReport.js`, `calendar.js` | Xuất PDF / CSV / ICS qua `saveOrShareFile` | không đổi hành vi web |
| `ScanCamera.jsx` | Native: `@capacitor/camera` `getPhoto()`; Web: `getUserMedia` như cũ | không đổi |
| `App.jsx` | Native: sync nhắc thuốc khi login + khi app `resume` | guard `Capacitor.isNativePlatform()` |
| `useAuth.js` | Huỷ nhắc thuốc khi logout | no-op |
| `main.jsx` | Gọi `initNative()` | no-op |
| BE `GET /medications/upcoming-doses` | Cấp danh sách liều sắp tới (dùng engine lịch thuốc TZ-safe) cho Local Notification | — |

## Plugin Capacitor 8 đã cài

`@capacitor/camera` `@capacitor/local-notifications` `@capacitor/filesystem` `@capacitor/share`
`@capacitor/clipboard` `@capacitor/keyboard` `@capacitor/splash-screen`
(cộng với `app`, `status-bar` đã có sẵn — tổng 9 plugin)

## Cấu hình native

- `frontend/.env.production` → `VITE_API_BASE_URL=https://dia-5hzu.onrender.com/api/v1` (backend cloud, đã verify `/health`=200)
- `capacitor.config.json`: `androidScheme/iosScheme: https`; config SplashScreen / Keyboard / LocalNotifications
- `ios/App/App/Info.plist`: `NSCameraUsageDescription`, `NSPhotoLibrary*`, `NSMicrophoneUsageDescription`, `ITSAppUsesNonExemptEncryption=false`
- `ios/App/App/PrivacyInfo.xcprivacy`: khai Health/Name/Email/Phone/Photos = App Functionality, không tracking
- `android/app/src/main/AndroidManifest.xml`: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECORD_AUDIO`
- Icon + splash tự sinh từ `frontend/assets/{icon,splash}.png` cho cả 2 nền tảng

## Lệnh

```bash
cd frontend
npm run build          # web build (dùng .env.production)
npx cap sync ios
npx cap sync android
npx cap open ios       # / npx cap open android
```

## Kiểm chứng (28/08/2026)

| | |
|---|---|
| `npm run build` (frontend) | ✅ EXIT 0 |
| `npm test` (backend) | ✅ 11/11 test lịch thuốc |
| `npx cap sync ios` / `android` | ✅ 9 plugin mỗi bên |
| `xcodebuild` iOS Simulator | ✅ **BUILD SUCCEEDED**; app mở đúng màn Đăng nhập PROD (Google OAuth / Quên MK / Demo / bypass Landing), keyboard native, trỏ backend cloud thật |
| Login cloud `khoi@example.com` / `admin@example.com` | ✅ HTTP 200 |
| `/auth/me`, `/dashboard/summary` trên cloud | ✅ |

## ⚠️ Cần làm

1. **Deploy lại backend** với commit này — cloud hiện trả `404` cho `/medications/upcoming-doses`
   (endpoint mới). `medReminders.js` tự xử lý lỗi (không crash), nhưng nhắc thuốc chỉ chạy sau khi
   backend được deploy lại.
2. **Xcode**: kéo `PrivacyInfo.xcprivacy` vào target App (Add Files → tick target App) — Apple bắt buộc.
3. **Signing**: set Team ở *Signing & Capabilities* để chạy trên thiết bị / archive.
4. **Android build**: máy dev cần Android SDK (`ANDROID_HOME`). `cap sync` OK; `gradlew assembleDebug`
   chưa test được ở đây (thiếu SDK).

## Ngoài phạm vi (đề xuất, chưa sửa)

- `backend/knexfile.js` còn `PRAGMA foreign_keys = ON` → migration SQLite local (Node 26) bị treo.
  Production dùng `client: pg` nên KHÔNG ảnh hưởng deploy.
- UI "Mã liên kết gia đình" (`CaregiverManager`, trường `familyCode` ở Register) chưa có trên PROD —
  chỉ phần backend "caregiver alert". Cherry-pick từ tag `backup/ios-capacitor-work` nếu cần.
- `vite.config.js` PROD chưa code-split → `index.js` ~1.2MB (373KB gzip).
