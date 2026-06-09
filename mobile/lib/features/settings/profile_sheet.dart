import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../data/models/user.dart';
import '../../state/auth_controller.dart';
import '../../widgets/common/app_bottom_sheet.dart';

/// Tương đương UserProfileModal.jsx — thẻ thông tin kiểu BHYT (chỉ hiển thị).
Future<void> showProfileSheet(BuildContext context) {
  return showAppSheet(
    context,
    title: 'Thông Tin',
    child: const _ProfileBody(),
  );
}

class _ProfileBody extends StatelessWidget {
  const _ProfileBody();

  String _diagnosisLabel(String? code) {
    switch (code) {
      case 'type1_diabetes':
        return 'Tiểu đường type 1';
      case 'type2_diabetes':
        return 'Tiểu đường type 2';
      case 'gestational_diabetes':
        return 'Tiểu đường thai kỳ';
      default:
        return 'Tiểu đường';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final User? user = context.watch<AuthController>().user;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Thẻ BHYT
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [p.primary, p.primary.withValues(alpha: 0.75)],
            ),
            borderRadius: BorderRadius.circular(p.radiusLg + 4),
            boxShadow: [
              BoxShadow(
                color: p.primary.withValues(alpha: 0.3),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.health_and_safety_rounded,
                      color: Colors.white, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'THẺ SỨC KHOẺ IPUNI',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                user?.displayName.toUpperCase() ?? 'BỆNH NHÂN',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 20,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _diagnosisLabel(user?.diagnosis),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'CCCD',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                user?.cccd ?? '—',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _infoRow(p, Icons.phone_outlined, 'Số điện thoại', user?.phone ?? '—'),
        _infoRow(p, Icons.email_outlined, 'Email', user?.email ?? '—'),
        _infoRow(p, Icons.badge_outlined, 'CCCD', user?.cccd ?? '—'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: p.primaryLight,
            borderRadius: BorderRadius.circular(p.radiusMd),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 18, color: p.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Chỉnh sửa thông tin cá nhân sẽ sớm được hỗ trợ.',
                  style: TextStyle(color: p.textSecondary, fontSize: 12.5),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _infoRow(AppPalette p, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: p.primaryLight,
              borderRadius: BorderRadius.circular(p.radiusMd),
            ),
            child: Icon(icon, color: p.primary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style:
                        TextStyle(color: p.textSecondary, fontSize: 12)),
                const SizedBox(height: 2),
                Text(value,
                    style: TextStyle(
                        color: p.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
