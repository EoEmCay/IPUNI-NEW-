/// Cấu hình toàn cục cho app.
///
/// Base URL backend đọc từ `--dart-define=API_BASE_URL=...` lúc chạy/build,
/// nếu không truyền thì mặc định trỏ tới host của Android emulator (10.0.2.2),
/// vì `localhost` trên thiết bị Android là chính thiết bị, không phải PC.
class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001/api/v1',
  );

  /// Key lưu trong SharedPreferences (≈ localStorage).
  static const String tokenKey = 'ipuni_token';
  static const String themeKey = 'ipuni-theme';
}
