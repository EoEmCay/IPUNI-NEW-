import 'package:intl/intl.dart';

/// Helper định dạng ngày giờ tiếng Việt (tương đương date.helper.js + cách
/// web hiển thị ngày). Backend trả chuỗi datetime SQLite ("YYYY-MM-DD HH:mm:ss")
/// hoặc ISO 8601.
class AppDate {
  AppDate._();

  /// Parse an toàn chuỗi datetime từ backend.
  static DateTime? tryParse(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    final s = value.toString().trim();
    if (s.isEmpty) return null;
    // SQLite hay trả "2024-01-01 07:00:00" (thiếu T) → chuẩn hoá.
    final normalized = s.contains('T') ? s : s.replaceFirst(' ', 'T');
    return DateTime.tryParse(normalized)?.toLocal() ??
        DateTime.tryParse(s)?.toLocal();
  }

  static String time(DateTime d) => DateFormat('HH:mm').format(d);

  static String date(DateTime d) => DateFormat('dd/MM/yyyy').format(d);

  static String dateShort(DateTime d) => DateFormat('dd/MM').format(d);

  static String dateTime(DateTime d) => DateFormat('HH:mm · dd/MM/yyyy').format(d);

  /// "Hôm nay", "Hôm qua", hoặc dd/MM/yyyy.
  static String relativeDay(DateTime d) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final that = DateTime(d.year, d.month, d.day);
    final diff = today.difference(that).inDays;
    if (diff == 0) return 'Hôm nay';
    if (diff == 1) return 'Hôm qua';
    if (diff == -1) return 'Ngày mai';
    return date(d);
  }

  /// "Hôm nay · 07:30".
  static String relativeWithTime(DateTime d) => '${relativeDay(d)} · ${time(d)}';

  /// Chuỗi ISO để gửi lên backend.
  static String toApi(DateTime d) => d.toIso8601String();
}
