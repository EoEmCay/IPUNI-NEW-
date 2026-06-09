import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../core/theme/theme_controller.dart';
import '../../core/utils/app_toast.dart';
import '../../widgets/common/app_bottom_sheet.dart';

/// Tương đương SettingsModal.jsx — toggle Cute Mode + các cài đặt.
Future<void> showSettingsSheet(BuildContext context) {
  return showAppSheet(
    context,
    title: 'Cài Đặt',
    child: const _SettingsBody(),
  );
}

class _SettingsBody extends StatelessWidget {
  const _SettingsBody();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final theme = context.watch<ThemeController>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(p, 'Giao diện'),
        _SettingTile(
          icon: Icons.auto_awesome_rounded,
          title: 'Cute Mode',
          subtitle: 'Giao diện lavender dễ thương + font Quicksand',
          trailing: Switch(
            value: theme.isCuteMode,
            activeThumbColor: p.primary,
            onChanged: (v) => theme.setCuteMode(v),
          ),
        ),
        const SizedBox(height: 18),
        _sectionTitle(p, 'Nhắc nhở'),
        _SettingTile(
          icon: Icons.notifications_active_outlined,
          title: 'Nhắc đo đường huyết',
          subtitle: 'Sắp ra mắt',
          trailing: Switch(
            value: false,
            activeThumbColor: p.primary,
            onChanged: (_) =>
                AppToast.success(context, 'Tính năng sắp ra mắt'),
          ),
        ),
        _SettingTile(
          icon: Icons.medication_outlined,
          title: 'Nhắc uống thuốc',
          subtitle: 'Sắp ra mắt',
          trailing: Switch(
            value: false,
            activeThumbColor: p.primary,
            onChanged: (_) =>
                AppToast.success(context, 'Tính năng sắp ra mắt'),
          ),
        ),
        const SizedBox(height: 18),
        _sectionTitle(p, 'Khác'),
        _SettingTile(
          icon: Icons.privacy_tip_outlined,
          title: 'Quyền riêng tư',
          subtitle: 'Sắp ra mắt',
          onTap: () => AppToast.success(context, 'Tính năng sắp ra mắt'),
        ),
        const _SettingTile(
          icon: Icons.info_outline_rounded,
          title: 'Phiên bản',
          subtitle: 'IPUNI 1.0.0',
        ),
      ],
    );
  }

  Widget _sectionTitle(AppPalette p, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: p.textSecondary,
            letterSpacing: 0.3,
          ),
        ),
      );
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(p.radiusMd),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
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
                      Text(title,
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14.5,
                              color: p.textPrimary)),
                      Text(subtitle,
                          style: TextStyle(
                              color: p.textSecondary, fontSize: 12.5)),
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
