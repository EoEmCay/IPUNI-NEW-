import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_palette.dart';
import '../../../core/utils/date_format.dart';
import '../../../data/models/metric.dart';

/// Biểu đồ đường huyết — tương đương BloodGlucoseChart.jsx (Recharts → fl_chart).
class BloodGlucoseChart extends StatelessWidget {
  final List<Metric> metrics;
  const BloodGlucoseChart({super.key, required this.metrics});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    // Backend trả desc → đảo lại tăng dần theo thời gian để vẽ.
    final data = [...metrics.where((m) => m.measuredAt != null)]
      ..sort((a, b) => a.measuredAt!.compareTo(b.measuredAt!));

    if (data.length < 2) {
      return SizedBox(
        height: 200,
        child: Center(
          child: Text(
            'Cần ít nhất 2 lần đo để hiển thị biểu đồ',
            style: TextStyle(color: p.textSecondary, fontSize: 13),
          ),
        ),
      );
    }

    final spots = <FlSpot>[
      for (int i = 0; i < data.length; i++) FlSpot(i.toDouble(), data[i].value),
    ];
    final maxY = (data.map((e) => e.value).reduce((a, b) => a > b ? a : b)) + 2;

    return SizedBox(
      height: 220,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: maxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 4,
            getDrawingHorizontalLine: (_) =>
                FlLine(color: p.border, strokeWidth: 1),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 4,
                reservedSize: 30,
                getTitlesWidget: (value, _) => Text(
                  value.toInt().toString(),
                  style: TextStyle(color: p.textSecondary, fontSize: 10),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                interval: (data.length / 4).ceilToDouble().clamp(1, 999),
                getTitlesWidget: (value, _) {
                  final i = value.toInt();
                  if (i < 0 || i >= data.length) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      AppDate.dateShort(data[i].measuredAt!),
                      style: TextStyle(color: p.textSecondary, fontSize: 10),
                    ),
                  );
                },
              ),
            ),
          ),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => p.textPrimary,
              getTooltipItems: (items) => items
                  .map((it) => LineTooltipItem(
                        '${data[it.x.toInt()].valueText} mmol/L',
                        const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w700),
                      ))
                  .toList(),
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              curveSmoothness: 0.3,
              color: p.primary,
              barWidth: 3,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, _, __, ___) {
                  final status = data[spot.x.toInt()].status;
                  return FlDotCirclePainter(
                    radius: 4,
                    color: p.statusColor(status),
                    strokeWidth: 2,
                    strokeColor: p.surface,
                  );
                },
              ),
              belowBarData: BarAreaData(
                show: true,
                color: p.primary.withValues(alpha: 0.12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
