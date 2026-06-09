import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/app_config.dart';
import '../data/models/user.dart';
import '../data/repositories/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Tương đương authStore.js (Zustand).
class AuthController extends ChangeNotifier {
  final AuthRepository _repo;
  final SharedPreferences _prefs;

  AuthController(this._repo, this._prefs);

  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  /// Gọi lúc khởi động: có token thì thử khôi phục phiên.
  Future<void> bootstrap() async {
    final token = _prefs.getString(AppConfig.tokenKey);
    if (token == null || token.isEmpty) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      _user = await _repo.getMe();
      _status = AuthStatus.authenticated;
    } catch (_) {
      await _prefs.remove(AppConfig.tokenKey);
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String identifier, String password) async {
    _error = null;
    try {
      final result = await _repo.login(identifier, password);
      await _persist(result.token, result.user);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String cccd, String phone, String password) async {
    _error = null;
    try {
      final result = await _repo.register(cccd, phone, password);
      await _persist(result.token, result.user);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    await _prefs.remove(AppConfig.tokenKey);
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  /// Gọi khi interceptor phát hiện 401.
  void forceLogout() {
    _prefs.remove(AppConfig.tokenKey);
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void setUser(User user) {
    _user = user;
    notifyListeners();
  }

  Future<void> _persist(String token, User user) async {
    await _prefs.setString(AppConfig.tokenKey, token);
    _user = user;
    _status = AuthStatus.authenticated;
    _error = null;
    notifyListeners();
  }
}
