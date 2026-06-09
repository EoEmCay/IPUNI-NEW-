import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_palette.dart';
import '../../../state/auth_controller.dart';
import '../../settings/profile_sheet.dart';
import '../../settings/settings_sheet.dart';

/// Avatar → menu: Thông Tin / Cài Đặt / Đăng Xuất. Tương đương UserMenu.jsx
/// (trên mobile dùng bottom-sheet thay cho dropdown).
Future<void> showUserMenu(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (ctx) => const _UserMenuSheet(),
  );
}

class _UserMenuSheet extends StatelessWidget {
  const _UserMenuSheet();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final user = context.read<AuthController>().user;

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: p.surface,
          borderRadius: BorderRadius.circular(p.radiusLg + 4),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header user
            Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [p.primary, p.primary.withValues(alpha: 0.7)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      user?.initials ?? 'B',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.displayName ?? 'Bệnh nhân',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: p.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? user?.phone ?? '',
                          style:
                              TextStyle(fontSize: 13, color: p.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: p.border),
            _tile(context, Icons.person_outline_rounded, 'Thông Tin', () {
              Navigator.of(context).pop();
              showProfileSheet(context);
            }),
            _tile(context, Icons.settings_outlined, 'Cài Đặt', () {
              Navigator.of(context).pop();
              showSettingsSheet(context);
            }),
            Divider(height: 1, color: p.border),
            _tile(
              context,
              Icons.logout_rounded,
              'Đăng Xuất',
              () {
                Navigator.of(context).pop();
                context.read<AuthController>().logout();
              },
              danger: true,
            ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String label,
    VoidCallback onTap, {
    bool danger = false,
  }) {
    final p = context.palette;
    final color = danger ? p.danger : p.textPrimary;
    return ListTile(
      leading: Icon(icon, color: danger ? p.danger : p.primary),
      title: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
      onTap: onTap,
    );
  }
}
