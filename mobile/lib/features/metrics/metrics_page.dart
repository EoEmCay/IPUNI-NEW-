import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/metric_constants.dart';
import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../state/metrics_controller.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/filter_pills.dart';
import 'add_metric_sheet.dart';
import 'widgets/blood_glucose_chart.dart';
import 'widgets/metric_history_item.dart';

class MetricsPage extends StatefulWidget {
  const MetricsPage({super.key});

  @override
  State<MetricsPage> createState() => _MetricsPageState();
}

class _MetricsPageState extends State<MetricsPage> {
  String _type = 'all';
  int _days = 7;
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  Future<void> _load() {
    return context.read<MetricsController>().fetchHistory(
          type: _type == 'all' ? null : _type,
          days: _days,
        );
  }

  Future<void> _add() async {
    final ok = await showAddMetricSheet(
      context,
      initialType: _type == 'all' ? 'fasting' : _type,
    );
    if (ok && mounted) {
      AppToast.success(context, 'Đã lưu chỉ số');
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final ctrl = context.watch<MetricsController>();

    final typePills = [
      const FilterPill('all', 'Tất cả'),
      for (final key in kMetricTypeOrder)
        FilterPill(key, _shortLabel(key)),
    ];

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        backgroundColor: p.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Nhập chỉ số'),
      ),
      body: RefreshIndicator(
        color: p.primary,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.only(top: 16, bottom: 96),
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Đường huyết',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: p.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 14),
            FilterPills(
              pills: typePills,
              selected: _type,
              onSelected: (v) {
                setState(() => _type = v);
                _load();
              },
            ),
            const SizedBox(height: 10),
            _daysSelector(p),
            const SizedBox(height: 8),
            if (ctrl.loading && ctrl.history.isEmpty)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (ctrl.history.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: EmptyState(
                  icon: Icons.water_drop_outlined,
                  title: 'Chưa có chỉ số nào',
                  subtitle: 'Nhấn "Nhập chỉ số" để thêm lần đo đầu tiên.',
                ),
              )
            else ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Biểu đồ $_days ngày',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: p.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      BloodGlucoseChart(metrics: ctrl.history),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Lịch sử (${ctrl.history.length})',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: p.textPrimary,
                    fontSize: 15,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              for (final m in ctrl.history)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  child: MetricHistoryItem(
                    metric: m,
                    onDelete: () => _confirmDelete(m.id),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _daysSelector(AppPalette p) {
    const options = [7, 14, 30];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          for (final d in options) ...[
            GestureDetector(
              onTap: () {
                setState(() => _days = d);
                _load();
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: _days == d ? p.primaryLight : Colors.transparent,
                  borderRadius: BorderRadius.circular(p.radiusSm),
                  border: Border.all(
                      color: _days == d ? p.primary : p.border),
                ),
                child: Text(
                  '$d ngày',
                  style: TextStyle(
                    color: _days == d ? p.primary : p.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12.5,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _confirmDelete(int id) async {
    final p = context.palette;
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá chỉ số?'),
        content: const Text('Bạn có chắc muốn xoá lần đo này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Huỷ'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Xoá', style: TextStyle(color: p.danger)),
          ),
        ],
      ),
    );
    if (yes == true && mounted) {
      await context.read<MetricsController>().deleteMetric(id);
      if (mounted) AppToast.success(context, 'Đã xoá chỉ số');
    }
  }

  String _shortLabel(String key) {
    switch (key) {
      case 'fasting':
        return 'Lúc đói';
      case 'post_meal_2h':
        return 'Sau ăn 2h';
      case 'pre_meal':
        return 'Trước ăn';
      case 'pre_sleep':
        return 'Trước ngủ';
      default:
        return key;
    }
  }
}
