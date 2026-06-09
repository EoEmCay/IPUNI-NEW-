import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

/// Tương đương themeStore.js (Zustand).
///
/// Giữ trạng thái Cute Mode, lưu vào SharedPreferences và notify để
/// MaterialApp đổi theme. Mọi widget chỉ cần dùng CSS-token qua AppPalette.
class ThemeController extends ChangeNotifier {
  final SharedPreferences _prefs;
  bool _isCuteMode;

  ThemeController(this._prefs)
      : _isCuteMode = _prefs.getString(AppConfig.themeKey) == 'cute';

  bool get isCuteMode => _isCuteMode;

  ThemeMode get themeMode => ThemeMode.light; // app chỉ dùng theme sáng

  void toggleCuteMode() => setCuteMode(!_isCuteMode);

  void setCuteMode(bool value) {
    if (_isCuteMode == value) return;
    _isCuteMode = value;
    _prefs.setString(AppConfig.themeKey, value ? 'cute' : 'default');
    notifyListeners();
  }
}
