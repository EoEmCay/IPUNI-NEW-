import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import 'api_exception.dart';

/// Tương đương services/api.js (axios instance + interceptors).
///
/// - Tự gắn `Authorization: Bearer <token>` từ SharedPreferences.
/// - Bóc tách envelope `{ success, data, message }` của backend.
/// - Gặp 401 → xoá token + gọi [onUnauthorized] (app điều hướng về Login).
class ApiClient {
  final Dio _dio;
  final SharedPreferences _prefs;

  /// Callback app gán để xử lý khi token hết hạn / 401.
  void Function()? onUnauthorized;

  ApiClient(this._prefs)
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _prefs.getString(AppConfig.tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (e, handler) {
          if (e.response?.statusCode == 401) {
            _prefs.remove(AppConfig.tokenKey);
            onUnauthorized?.call();
          }
          handler.next(e);
        },
      ),
    );
  }

  // ---- HTTP verbs (trả về phần `data` đã bóc khỏi envelope) ----

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _request(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body}) =>
      _request(() => _dio.post(path, data: body));

  Future<dynamic> put(String path, {Object? body}) =>
      _request(() => _dio.put(path, data: body));

  Future<dynamic> delete(String path) => _request(() => _dio.delete(path));

  Future<dynamic> _request(Future<Response> Function() run) async {
    try {
      final res = await run();
      final data = res.data;
      // Backend luôn trả { success, data, message }.
      if (data is Map && data['success'] == false) {
        throw ApiException(
          (data['message'] ?? 'Có lỗi xảy ra').toString(),
          statusCode: res.statusCode,
        );
      }
      if (data is Map && data.containsKey('data')) return data['data'];
      return data;
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  ApiException _mapDioError(DioException e) {
    final resData = e.response?.data;
    if (resData is Map && resData['message'] != null) {
      return ApiException(resData['message'].toString(),
          statusCode: e.response?.statusCode);
    }
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return ApiException('Kết nối quá hạn. Kiểm tra mạng/máy chủ.');
      case DioExceptionType.connectionError:
        return ApiException(
            'Không kết nối được máy chủ. Kiểm tra backend đang chạy & địa chỉ API.');
      default:
        return ApiException('Có lỗi xảy ra, vui lòng thử lại.');
    }
  }
}
