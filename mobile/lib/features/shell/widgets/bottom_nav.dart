import 'package:flutter/material.dart';

import '../../../core/theme/app_palette.dart';

class BottomNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const BottomNavItem(this.icon, this.activeIcon, this.label);
}

const List<BottomNavItem> kNavItems = [
  BottomNavItem(Icons.home_outlined, Icons.home_rounded, 'Trang chủ'),
  BottomNavItem(Icons.water_drop_outlined, Icons.water_drop_rounded, 'Đường huyết'),
  BottomNavItem(Icons.medication_outlined, Icons.medication_rounded, 'Thuốc'),
  BottomNavItem(Icons.event_outlined, Icons.event_rounded, 'Lịch hẹn'),
  BottomNavItem(Icons.lightbulb_outline_rounded, Icons.lightbulb_rounded, 'Lời khuyên'),
];

/// Thanh điều hướng 5 tab — tương đương BottomNav.jsx.
class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(top: BorderSide(color: p.border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              for (int i = 0; i < kNavItems.length; i++)
                Expanded(child: _item(context, i, p)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _item(BuildContext context, int i, AppPalette p) {
    final item = kNavItems[i];
    final active = i == currentIndex;
    final color = active ? p.primary : p.textSecondary;
    return InkWell(
      onTap: () => onTap(i),
      borderRadius: BorderRadius.circular(p.radiusMd),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(active ? item.activeIcon : item.icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            item.label,
            style: TextStyle(
              color: color,
              fontSize: 10.5,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
