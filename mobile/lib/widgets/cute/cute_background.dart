import 'dart:math';

import 'package:flutter/material.dart';

/// Tương đương CuteBackground.jsx — nền thiên hà pastel: gradient, sao nhấp nháy,
/// và 2-3 "hành tinh" mờ. Là lớp trang trí phía sau, không nhận chạm.
class CuteBackground extends StatefulWidget {
  const CuteBackground({super.key});

  @override
  State<CuteBackground> createState() => _CuteBackgroundState();
}

class _CuteBackgroundState extends State<CuteBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 6),
  )..repeat(reverse: true);

  late final List<_Star> _stars = _generateStars(26);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  static List<_Star> _generateStars(int n) {
    final rnd = Random(7);
    return List.generate(
      n,
      (_) => _Star(
        dx: rnd.nextDouble(),
        dy: rnd.nextDouble(),
        radius: rnd.nextDouble() * 1.6 + 0.8,
        phase: rnd.nextDouble(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Gradient nền galaxy pastel
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFFDF8FF),
                  Color(0xFFF3E8FF),
                  Color(0xFFEDE9FE),
                ],
              ),
            ),
          ),
          // Hành tinh mờ
          _planet(const Alignment(-0.9, -0.7), 120,
              const [Color(0xFFFBCFE8), Color(0xFFF9A8D4)]),
          _planet(const Alignment(1.1, -0.3), 90,
              const [Color(0xFFC4B5FD), Color(0xFFA78BFA)]),
          _planet(const Alignment(0.8, 0.9), 140,
              const [Color(0xFFBAE6FD), Color(0xFF93C5FD)]),
          // Sao nhấp nháy
          AnimatedBuilder(
            animation: _c,
            builder: (_, __) => CustomPaint(
              painter: _StarPainter(_stars, _c.value),
              size: Size.infinite,
            ),
          ),
        ],
      ),
    );
  }

  Widget _planet(Alignment align, double size, List<Color> colors) {
    return Align(
      alignment: align,
      child: Opacity(
        opacity: 0.45,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: colors),
          ),
        ),
      ),
    );
  }
}

class _Star {
  final double dx;
  final double dy;
  final double radius;
  final double phase;
  const _Star({
    required this.dx,
    required this.dy,
    required this.radius,
    required this.phase,
  });
}

class _StarPainter extends CustomPainter {
  final List<_Star> stars;
  final double t;
  _StarPainter(this.stars, this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white;
    for (final s in stars) {
      final twinkle = (sin((t + s.phase) * 2 * pi) + 1) / 2; // 0..1
      paint.color = Colors.white.withValues(alpha: 0.4 + twinkle * 0.55);
      canvas.drawCircle(
        Offset(s.dx * size.width, s.dy * size.height),
        s.radius,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _StarPainter old) => old.t != t;
}
