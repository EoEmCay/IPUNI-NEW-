import 'package:flutter/material.dart';

import '../../core/theme/app_palette.dart';

enum AppButtonVariant { primary, secondary, danger }

/// Tương đương Button.jsx — có biến thể + trạng thái loading.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool loading;
  final bool fullWidth;
  final IconData? icon;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.loading = false,
    this.fullWidth = true,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final disabled = onPressed == null || loading;

    late final Color bg;
    late final Color fg;
    late final BoxBorder? border;
    switch (variant) {
      case AppButtonVariant.primary:
        bg = p.primary;
        fg = Colors.white;
        border = null;
        break;
      case AppButtonVariant.danger:
        bg = p.danger;
        fg = Colors.white;
        border = null;
        break;
      case AppButtonVariant.secondary:
        bg = p.primaryLight;
        fg = p.primary;
        border = Border.all(color: p.border);
        break;
    }

    final radius = BorderRadius.circular(p.radiusMd);

    return Opacity(
      opacity: disabled && !loading ? 0.55 : 1,
      child: Material(
        color: bg,
        borderRadius: radius,
        child: InkWell(
          borderRadius: radius,
          onTap: disabled ? null : onPressed,
          child: Container(
            width: fullWidth ? double.infinity : null,
            height: 52,
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(borderRadius: radius, border: border),
            child: loading
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation(fg),
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, color: fg, size: 20),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        label,
                        style: TextStyle(
                          color: fg,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
