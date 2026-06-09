import 'package:flutter/material.dart';

import '../theme/app_palette.dart';

/// Tương đương SuccessToast.jsx — pill nổi giữa màn hình, tự ẩn sau 1.5s.
class AppToast {
  AppToast._();

  static void success(BuildContext context, String message) =>
      _show(context, message, isSuccess: true);

  static void error(BuildContext context, String message) =>
      _show(context, message, isSuccess: false);

  static void _show(BuildContext context, String message,
      {required bool isSuccess}) {
    final overlay = Overlay.maybeOf(context);
    if (overlay == null) return;
    final palette = context.palette;
    final color = isSuccess ? palette.success : palette.danger;

    final entry = OverlayEntry(
      builder: (_) => _ToastWidget(
        message: message,
        color: color,
        icon: isSuccess ? Icons.check_rounded : Icons.error_outline_rounded,
        radius: palette.radiusMd,
      ),
    );

    overlay.insert(entry);
    Future.delayed(const Duration(milliseconds: 1600), entry.remove);
  }
}

class _ToastWidget extends StatefulWidget {
  final String message;
  final Color color;
  final IconData icon;
  final double radius;

  const _ToastWidget({
    required this.message,
    required this.color,
    required this.icon,
    required this.radius,
  });

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 220),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final curved = CurvedAnimation(parent: _c, curve: Curves.easeOutBack);
    return IgnorePointer(
      child: Center(
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.7, end: 1).animate(curved),
          child: FadeTransition(
            opacity: _c,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                decoration: BoxDecoration(
                  color: widget.color,
                  borderRadius: BorderRadius.circular(widget.radius + 8),
                  boxShadow: [
                    BoxShadow(
                      color: widget.color.withValues(alpha: 0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(widget.icon, color: Colors.white, size: 22),
                    const SizedBox(width: 10),
                    Flexible(
                      child: Text(
                        widget.message,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
