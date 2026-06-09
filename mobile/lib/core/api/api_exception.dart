/// Lỗi chuẩn hoá từ API để UI hiển thị message tiếng Việt từ backend.
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}
