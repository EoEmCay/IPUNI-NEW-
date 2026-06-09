import 'package:flutter/material.dart';

import '../../core/theme/app_palette.dart';

class FilterPill {
  final String value;
  final String label;
  const FilterPill(this.value, this.label);
}

/// Tương đương FilterPills.jsx — hàng pill cuộn ngang để lọc.
class FilterPills extends StatelessWidget {
  final List<FilterPill> pills;
  final String selected;
  final ValueChanged<String> onSelected;

  const FilterPills({
    super.key,
    required this.pills,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: pills.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final pill = pills[i];
          final active = pill.value == selected;
          return GestureDetector(
            onTap: () => onSelected(pill.value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: active ? p.primary : p.surface,
                borderRadius: BorderRadius.circular(p.radiusLg),
                border: Border.all(color: active ? p.primary : p.border),
              ),
              child: Text(
                pill.label,
                style: TextStyle(
                  color: active ? Colors.white : p.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
