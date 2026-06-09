import 'package:flutter/material.dart';

/// Toàn bộ design token (tương đương CSS variables trong global.css).
///
/// Đặt trong [ThemeExtension] để mọi widget lấy qua
/// `Theme.of(context).extension<AppPalette>()!` và tự đổi theo theme,
/// y như cách web dùng `var(--color-...)`.
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
  final Color primary;
  final Color primaryLight;
  final Color bg;
  final Color surface;
  final Color textPrimary;
  final Color textSecondary;
  final Color success;
  final Color danger;
  final Color warning;
  final Color border;

  final double radiusSm;
  final double radiusMd;
  final double radiusLg;

  /// true khi đang ở Cute Mode — dùng để bật/tắt các hiệu ứng cute.
  final bool isCute;

  const AppPalette({
    required this.primary,
    required this.primaryLight,
    required this.bg,
    required this.surface,
    required this.textPrimary,
    required this.textSecondary,
    required this.success,
    required this.danger,
    required this.warning,
    required this.border,
    required this.radiusSm,
    required this.radiusMd,
    required this.radiusLg,
    required this.isCute,
  });

  /// Theme mặc định — navy blue.
  static const AppPalette light = AppPalette(
    primary: Color(0xFF1B5FA6),
    primaryLight: Color(0xFFEEF4FF),
    bg: Color(0xFFF4F6F9),
    surface: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF1A2332),
    textSecondary: Color(0xFF6B7A8D),
    success: Color(0xFF22C55E),
    danger: Color(0xFFEF4444),
    warning: Color(0xFFF59E0B),
    border: Color(0xFFE2E8F0),
    radiusSm: 8,
    radiusMd: 12,
    radiusLg: 16,
    isCute: false,
  );

  /// Cute Mode — lavender.
  static const AppPalette cute = AppPalette(
    primary: Color(0xFFA855F7),
    primaryLight: Color(0xFFF5F0FF),
    bg: Color(0xFFFDF8FF),
    surface: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF2D1B69),
    textSecondary: Color(0xFF7C6B8E),
    success: Color(0xFF34D399),
    danger: Color(0xFFF87171),
    warning: Color(0xFFFBBF24),
    border: Color(0xFFE9D5FF),
    radiusSm: 14,
    radiusMd: 20,
    radiusLg: 28,
    isCute: true,
  );

  /// Màu cho 4 trạng thái đường huyết.
  Color statusColor(String status) {
    switch (status) {
      case 'low':
        return primary; // hạ đường huyết — nhấn bằng màu chủ
      case 'warning':
        return warning;
      case 'danger':
        return danger;
      case 'normal':
      default:
        return success;
    }
  }

  @override
  AppPalette copyWith({
    Color? primary,
    Color? primaryLight,
    Color? bg,
    Color? surface,
    Color? textPrimary,
    Color? textSecondary,
    Color? success,
    Color? danger,
    Color? warning,
    Color? border,
    double? radiusSm,
    double? radiusMd,
    double? radiusLg,
    bool? isCute,
  }) {
    return AppPalette(
      primary: primary ?? this.primary,
      primaryLight: primaryLight ?? this.primaryLight,
      bg: bg ?? this.bg,
      surface: surface ?? this.surface,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      success: success ?? this.success,
      danger: danger ?? this.danger,
      warning: warning ?? this.warning,
      border: border ?? this.border,
      radiusSm: radiusSm ?? this.radiusSm,
      radiusMd: radiusMd ?? this.radiusMd,
      radiusLg: radiusLg ?? this.radiusLg,
      isCute: isCute ?? this.isCute,
    );
  }

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    return AppPalette(
      primary: Color.lerp(primary, other.primary, t)!,
      primaryLight: Color.lerp(primaryLight, other.primaryLight, t)!,
      bg: Color.lerp(bg, other.bg, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      success: Color.lerp(success, other.success, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      border: Color.lerp(border, other.border, t)!,
      radiusSm: lerpDouble(radiusSm, other.radiusSm, t),
      radiusMd: lerpDouble(radiusMd, other.radiusMd, t),
      radiusLg: lerpDouble(radiusLg, other.radiusLg, t),
      isCute: t < 0.5 ? isCute : other.isCute,
    );
  }

  static double lerpDouble(double a, double b, double t) => a + (b - a) * t;
}

/// Shortcut: `context.palette` thay cho `Theme.of(context).extension<AppPalette>()!`.
extension AppPaletteX on BuildContext {
  AppPalette get palette => Theme.of(this).extension<AppPalette>()!;
}
