import 'package:flutter/material.dart';

import '../../../core/theme/app_palette.dart';

/// Tương đương CuteCatWidget.jsx — thẻ mèo dễ thương + đường nhịp tim.
/// Tự vẽ hoàn toàn (không cần ảnh mạng) để hoạt động offline.
class CuteCatWidget extends StatefulWidget {
  const CuteCatWidget({super.key});

  @override
  State<CuteCatWidget> createState() => _CuteCatWidgetState();
}

class _CuteCatWidgetState extends State<CuteCatWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF5D0FE), Color(0xFFDDD6FE)],
        ),
        borderRadius: BorderRadius.circular(p.radiusLg + 6),
        boxShadow: [
          BoxShadow(
            color: p.primary.withValues(alpha: 0.18),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          // Mèo
          ScaleTransition(
            scale: Tween<double>(begin: 0.95, end: 1.05).animate(
              CurvedAnimation(parent: _c, curve: Curves.easeInOut),
            ),
            child: Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Text('🐱', style: TextStyle(fontSize: 34)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bé Mèo nhắc bạn',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: p.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Nhớ đo đường huyết & uống thuốc đúng giờ nhé! 💜',
                  style: TextStyle(
                    color: p.textPrimary.withValues(alpha: 0.7),
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 10),
                // Nhịp tim
                SizedBox(
                  height: 26,
                  child: AnimatedBuilder(
                    animation: _c,
                    builder: (_, __) => CustomPaint(
                      painter: _HeartbeatPainter(_c.value, p.primary),
                      size: const Size(double.infinity, 26),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeartbeatPainter extends CustomPainter {
  final double t;
  final Color color;
  _HeartbeatPainter(this.t, this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final h = size.height;
    final w = size.width;
    final mid = h / 2;
    path.moveTo(0, mid);
    // Một nhịp ECG đơn giản lặp lại
    final seg = w / 6;
    for (int i = 0; i < 6; i++) {
      final x = seg * i;
      switch (i % 6) {
        case 1:
          path.lineTo(x, mid);
          path.lineTo(x + seg * 0.2, mid - h * 0.1);
          break;
        case 2:
          path.lineTo(x, mid - h * 0.45);
          path.lineTo(x + seg * 0.25, mid + h * 0.45);
          path.lineTo(x + seg * 0.45, mid);
          break;
        default:
          path.lineTo(x + seg, mid);
      }
    }
    path.lineTo(w, mid);

    canvas.drawPath(path, paint);

    // Chấm sáng chạy dọc theo đường
    final dotX = (t * w);
    final glow = Paint()..color = color.withValues(alpha: 0.9);
    canvas.drawCircle(Offset(dotX, mid), 3, glow);
  }

  @override
  bool shouldRepaint(covariant _HeartbeatPainter old) => old.t != t;
}
