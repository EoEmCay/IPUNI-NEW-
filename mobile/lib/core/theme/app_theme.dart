import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_palette.dart';

/// Dựng [ThemeData] cho 2 chế độ từ [AppPalette].
class AppTheme {
  AppTheme._();

  static ThemeData light() => _build(AppPalette.light);
  static ThemeData cute() => _build(AppPalette.cute);

  static ThemeData _build(AppPalette p) {
    // Cute Mode dùng Quicksand (Google Fonts), mặc định dùng font hệ thống.
    final TextTheme baseText = p.isCute
        ? GoogleFonts.quicksandTextTheme()
        : ThemeData.light().textTheme;

    final colorScheme = ColorScheme.fromSeed(
      seedColor: p.primary,
      primary: p.primary,
      surface: p.surface,
      error: p.danger,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: p.bg,
      colorScheme: colorScheme,
      textTheme: baseText.apply(
        bodyColor: p.textPrimary,
        displayColor: p.textPrimary,
      ),
      fontFamily: p.isCute ? GoogleFonts.quicksand().fontFamily : null,
      splashColor: p.primary.withValues(alpha: 0.08),
      highlightColor: p.primary.withValues(alpha: 0.04),
      dividerColor: p.border,
      iconTheme: IconThemeData(color: p.textPrimary),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: p.primary),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: p.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(p.radiusLg + 4)),
        ),
      ),
      extensions: <ThemeExtension<dynamic>>[p],
    );
  }
}
