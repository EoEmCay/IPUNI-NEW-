import 'package:flutter/material.dart';

import '../../../core/theme/app_palette.dart';

/// Logo + tên app cho màn hình đăng nhập/đăng ký.
class BrandHeader extends StatelessWidget {
  final String subtitle;
  const BrandHeader({super.key, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Column(
      children: [
        Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [p.primary, p.primary.withValues(alpha: 0.7)],
            ),
            borderRadius: BorderRadius.circular(p.radiusLg + 6),
            boxShadow: [
              BoxShadow(
                color: p.primary.withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Icon(
            p.isCute ? Icons.auto_awesome_rounded : Icons.favorite_rounded,
            color: Colors.white,
            size: 38,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'IPUNI',
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: p.primary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: p.textSecondary),
        ),
      ],
    );
  }
}
