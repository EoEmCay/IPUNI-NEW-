import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../data/models/advice.dart';
import '../../state/advice_controller.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/filter_pills.dart';

class AdvicePage extends StatefulWidget {
  const AdvicePage({super.key});

  @override
  State<AdvicePage> createState() => _AdvicePageState();
}

class _AdvicePageState extends State<AdvicePage> {
  String _category = 'all';
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      WidgetsBinding.instance.addPostFrameCallback(
          (_) => context.read<AdviceController>().fetchAdvice());
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final ctrl = context.watch<AdviceController>();

    final pills = <FilterPill>[
      const FilterPill('all', 'Tất cả'),
      for (final c in ctrl.categories) FilterPill(c, _categoryLabel(c)),
    ];

    return RefreshIndicator(
      color: p.primary,
      onRefresh: () => ctrl.fetchAdvice(category: _category),
      child: ListView(
        padding: const EdgeInsets.only(top: 16, bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Lời khuyên sức khoẻ',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: p.textPrimary,
              ),
            ),
          ),
          const SizedBox(height: 14),
          if (pills.length > 1)
            FilterPills(
              pills: pills,
              selected: _category,
              onSelected: (v) {
                setState(() => _category = v);
                ctrl.fetchAdvice(category: v);
              },
            ),
          const SizedBox(height: 14),
          if (ctrl.loading && ctrl.items.isEmpty)
            const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (ctrl.items.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyState(
                icon: Icons.lightbulb_outline_rounded,
                title: 'Chưa có lời khuyên',
                subtitle: 'Lời khuyên sức khoẻ sẽ hiển thị ở đây.',
              ),
            )
          else
            for (final a in ctrl.items)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: _AdviceCard(advice: a),
              ),
        ],
      ),
    );
  }

  String _categoryLabel(String c) {
    switch (c) {
      case 'diet':
      case 'nutrition':
        return 'Dinh dưỡng';
      case 'exercise':
      case 'activity':
        return 'Vận động';
      case 'medication':
        return 'Dùng thuốc';
      case 'monitoring':
        return 'Theo dõi';
      case 'lifestyle':
        return 'Lối sống';
      case 'general':
        return 'Chung';
      default:
        return c;
    }
  }
}

class _AdviceCard extends StatelessWidget {
  final Advice advice;
  const _AdviceCard({required this.advice});

  IconData _icon(String c) {
    switch (c) {
      case 'diet':
      case 'nutrition':
        return Icons.restaurant_rounded;
      case 'exercise':
      case 'activity':
        return Icons.directions_run_rounded;
      case 'medication':
        return Icons.medication_rounded;
      case 'monitoring':
        return Icons.monitor_heart_rounded;
      case 'lifestyle':
        return Icons.self_improvement_rounded;
      default:
        return Icons.lightbulb_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: p.primaryLight,
                  borderRadius: BorderRadius.circular(p.radiusMd),
                ),
                child: Icon(_icon(advice.category), color: p.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  advice.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15.5,
                    color: p.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            advice.content,
            style: TextStyle(
              color: p.textSecondary,
              fontSize: 14,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
