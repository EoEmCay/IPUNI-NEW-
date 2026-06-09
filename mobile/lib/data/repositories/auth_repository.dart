import '../../core/api/api_client.dart';
import '../models/user.dart';

class AuthResult {
  final String token;
  final User user;
  const AuthResult(this.token, this.user);
}

/// Tương đương auth.service.js (frontend).
class AuthRepository {
  final ApiClient _api;
  AuthRepository(this._api);

  Future<AuthResult> login(String identifier, String password) async {
    final data = await _api.post('/auth/login', body: {
      'identifier': identifier,
      'password': password,
    });
    return _parse(data);
  }

  Future<AuthResult> register(
      String cccd, String phone, String password) async {
    final data = await _api.post('/auth/register', body: {
      'cccd': cccd,
      'phone': phone,
      'password': password,
    });
    return _parse(data);
  }

  Future<User> getMe() async {
    final data = await _api.get('/auth/me');
    return User.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Logout không được chặn bởi lỗi mạng.
    }
  }

  AuthResult _parse(dynamic data) {
    final map = Map<String, dynamic>.from(data as Map);
    return AuthResult(
      map['token'] as String,
      User.fromJson(Map<String, dynamic>.from(map['user'] as Map)),
    );
  }
}
