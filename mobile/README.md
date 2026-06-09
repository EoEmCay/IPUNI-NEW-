# IPUNI Mobile (Flutter · Android)

App điện thoại Android cho IPUNI, viết bằng **Flutter**. Dùng chung backend Express/SQLite
hiện có trong `../backend` (không thay đổi gì ở backend).

App mirror đầy đủ phiên bản web: 2 theme (Default + Cute Mode), Dashboard, nhập/biểu đồ
đường huyết, quản lý thuốc, lịch hẹn, lời khuyên, thông tin & cài đặt.

---

## 0. Cài toolchain (chỉ làm 1 lần)

> Bắt buộc — chưa có Flutter thì không build được. Máy đang là Windows.

1. **JDK 17** (Flutter/Gradle hiện đại cần JDK 17, không dùng được JDK 1.8)
   - Tải Temurin 17: https://adoptium.net/temurin/releases/?version=17
   - Hoặc dùng JDK đi kèm Android Studio (mục dưới).

2. **Android Studio** (kèm Android SDK + platform-tools + emulator)
   - https://developer.android.com/studio
   - Mở → *More Actions* → *SDK Manager* → cài **Android SDK Platform 34** + **Android SDK Command-line Tools**.
   - Tạo một **Virtual Device** (Pixel) hoặc cắm điện thoại thật đã bật *USB debugging*.

3. **Flutter SDK**
   - Tải: https://docs.flutter.dev/get-started/install/windows
   - Giải nén vào `C:\src\flutter`, thêm `C:\src\flutter\bin` vào PATH.

4. Kiểm tra:
   ```powershell
   flutter doctor --android-licenses   # gõ y để chấp nhận license
   flutter doctor                       # mọi mục Android phải có dấu ✓
   ```

---

## 1. Sinh thư mục platform (android/) — chạy 1 lần

Code Dart trong `lib/` đã viết sẵn, nhưng cần Flutter sinh ra phần platform native:

```powershell
cd mobile
flutter create .                 # KHÔNG ghi đè lib/ có sẵn, chỉ thêm android/, ios/, ...
flutter pub get
```

Sau `flutter create .`, **áp các chỉnh sửa Android** (xem mục 3) rồi mới chạy.

---

## 2. Chạy app

```powershell
flutter devices                  # xem emulator/điện thoại đang nối
flutter run                      # chọn thiết bị, app sẽ build & cài
```

Backend phải đang chạy:
```powershell
cd ..\backend
npm run dev                      # http://localhost:3001
```

### Địa chỉ backend trên thiết bị
`localhost` trên điện thoại trỏ về chính nó, KHÔNG phải PC. App đọc base URL từ
`lib/core/config/app_config.dart`:

| Thiết bị | Base URL |
|---|---|
| Android Emulator | `http://10.0.2.2:3001/api/v1` (mặc định) |
| Điện thoại thật (cùng WiFi) | `http://<IP-LAN-của-PC>:3001/api/v1` |

Đổi nhanh khi chạy mà không sửa code:
```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3001/api/v1
```

---

## 3. Chỉnh Android sau khi `flutter create .`

### a) Cho phép HTTP cleartext (server dev dùng http, không https)
Mở `android/app/src/main/AndroidManifest.xml`, thêm vào thẻ `<application ...>`:
```xml
<application
    android:label="IPUNI"
    android:usesCleartextTraffic="true"
    ... >
```

### b) minSdk (fl_chart/google_fonts ok với 21+; để 23 cho chắc)
Mở `android/app/build.gradle`, trong `defaultConfig`:
```gradle
minSdkVersion 23
```

---

## 4. Build APK cài tay

```powershell
flutter build apk --release
# File: build/app/outputs/flutter-apk/app-release.apk
```

Copy file `.apk` vào điện thoại để cài (cần bật *Cài app từ nguồn không xác định*).

---

## 5. Tài khoản mẫu

| Email | Mật khẩu |
|---|---|
| khoi@example.com | 123456 |

Đăng nhập bằng email hoặc CCCD.

---

## Cấu trúc `lib/`

```
lib/
├── main.dart                     # Entry — khởi tạo prefs, theme, providers
├── app.dart                      # MaterialApp.router + theme + go_router
├── core/
│   ├── config/app_config.dart    # Base URL (đọc từ --dart-define)
│   ├── api/                      # dio client + interceptor token/401, ApiException
│   ├── theme/                    # 2 theme + AppPalette (ThemeExtension) + ThemeController
│   ├── constants/                # ngưỡng metric, getMetricStatus, routes
│   └── utils/                    # format ngày giờ, toast
├── data/
│   ├── models/                   # User, Metric, Medication, Appointment, Advice
│   └── repositories/             # gọi API qua dio
├── state/                        # ChangeNotifier controllers (≈ Zustand stores)
├── features/                     # màn hình theo tính năng + app shell
└── widgets/                      # common + cute
```
