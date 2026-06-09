import 'package:flutter/material.dart';

import '../../core/theme/app_palette.dart';

/// Màn hình chờ trong lúc khôi phục phiên đăng nhập (getMe).
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Scaffold(
      backgroundColor: p.bg,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [p.primary, p.primary.withValues(alpha: 0.7)],
                ),
                borderRadius: BorderRadius.circular(p.radiusLg + 8),
              ),
              child: Icon(
                p.isCute ? Icons.auto_awesome_rounded : Icons.favorite_rounded,
                color: Colors.white,
                size: 42,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'IPUNI',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                letterSpacing: 2,
                color: p.primary,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(strokeWidth: 2.6, color: p.primary),
            ),
          ],
        ),
      ),
    );
  }
}
