import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/metric_constants.dart';
import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../core/utils/date_format.dart';
import '../../data/models/metric.dart';
import '../../state/auth_controller.dart';
import '../../state/medications_controller.dart';
import '../../state/metrics_controller.dart';
import '../../widgets/common/app_card.dart';
import '../metrics/add_metric_sheet.dart';
import '../shell/shell_controller.dart';
import 'widgets/cute_cat_widget.dart';
import 'widgets/section_header.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  Future<void> _load() async {
    await Future.wait([
      context.read<MetricsController>().fetchLatest(),
      context.read<MedicationsController>().fetchToday(),
    ]);
  }

  Future<void> _addMetric(String type) async {
    final ok = await showAddMetricSheet(context, initialType: type);
    if (ok && mounted) {
      AppToast.success(context, 'Đã lưu chỉ số');
      context.read<MetricsController>().fetchLatest();
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final user = context.watch<AuthController>().user;
    final latest = context.watch<MetricsController>().latest;
    final todayMeds = context.watch<MedicationsController>().today;

    return RefreshIndicator(
      color: p.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.only(top: 16, bottom: 24),
        children: [
          // Lời chào
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Xin chào,',
                  style: TextStyle(color: p.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.displayName ?? 'Bạn',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: p.textPrimary,
                  ),
                ),
                Text(
                  AppDate.date(DateTime.now()),
                  style: TextStyle(color: p.textSecondary, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Cute Mode: widget mèo dễ thương
          if (p.isCute)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: CuteCatWidget(),
            ),
          if (p.isCute) const SizedBox(height: 16),

          // Chỉ số gần nhất
          SectionHeader(
            title: 'Chỉ số gần nhất',
            actionLabel: 'Xem tất cả',
            onAction: () => context.read<ShellController>().setIndex(1),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.55,
              children: [
                for (final key in kMetricTypeOrder)
                  _MetricSummaryTile(
                    type: key,
                    metric: latest[key],
                    onTap: () => _addMetric(key),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Thuốc hôm nay
          SectionHeader(
            title: 'Thuốc hôm nay',
            actionLabel: 'Xem tất cả',
            onAction: () => context.read<ShellController>().setIndex(2),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: todayMeds.isEmpty
                ? AppCard(
                    child: Row(
                      children: [
                        Icon(Icons.medication_outlined,
                            color: p.textSecondary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Chưa có thuốc nào cho hôm nay',
                            style: TextStyle(color: p.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  )
                : Column(
                    children: [
                      for (final med in todayMeds)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _TodayMedTile(
                            name: med.name,
                            dosage: med.dosage ?? '',
                            times: med.times,
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _MetricSummaryTile extends StatelessWidget {
  final String type;
  final Metric? metric;
  final VoidCallback onTap;

  const _MetricSummaryTile({
    required this.type,
    required this.metric,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final meta = kMetricTypes[type];
    final hasValue = metric != null;
    final statusColor =
        hasValue ? p.statusColor(metric!.status) : p.textSecondary;

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration:
                    BoxDecoration(color: statusColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _shortLabel(type),
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: p.textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          if (hasValue)
            RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: metric!.valueText,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w800,
                      fontSize: 26,
                    ),
                  ),
                  TextSpan(
                    text: ' mmol/L',
                    style: TextStyle(color: p.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            )
          else
            Row(
              children: [
                Icon(Icons.add_circle_outline_rounded,
                    color: p.primary, size: 18),
                const SizedBox(width: 6),
                Text(
                  'Nhập ngay',
                  style: TextStyle(
                    color: p.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          Text(
            hasValue && metric!.measuredAt != null
                ? AppDate.relativeWithTime(metric!.measuredAt!)
                : (meta?.normal ?? ''),
            style: TextStyle(color: p.textSecondary, fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
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

class _TodayMedTile extends StatelessWidget {
  final String name;
  final String dosage;
  final List<String> times;

  const _TodayMedTile({
    required this.name,
    required this.dosage,
    required this.times,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: p.primaryLight,
              borderRadius: BorderRadius.circular(p.radiusMd),
            ),
            child: Icon(Icons.medication_rounded, color: p.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: p.textPrimary,
                    fontSize: 14.5,
                  ),
                ),
                if (dosage.isNotEmpty)
                  Text(dosage,
                      style:
                          TextStyle(color: p.textSecondary, fontSize: 12.5)),
              ],
            ),
          ),
          if (times.isNotEmpty)
            Wrap(
              spacing: 6,
              children: [
                for (final t in times.take(3))
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: p.primaryLight,
                      borderRadius: BorderRadius.circular(p.radiusSm),
                    ),
                    child: Text(
                      t,
                      style: TextStyle(
                        color: p.primary,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}
