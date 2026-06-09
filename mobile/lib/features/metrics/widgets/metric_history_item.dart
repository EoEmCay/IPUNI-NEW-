import 'package:flutter/material.dart';

import '../../../core/theme/app_palette.dart';
import '../../../core/utils/date_format.dart';
import '../../../data/models/metric.dart';
import '../../../widgets/common/app_card.dart';

/// Một dòng lịch sử chỉ số — tương đương MetricHistoryItem.jsx.
class MetricHistoryItem extends StatelessWidget {
  final Metric metric;
  final VoidCallback? onDelete;

  const MetricHistoryItem({super.key, required this.metric, this.onDelete});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final statusColor = p.statusColor(metric.status);

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  metric.typeLabel,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: p.textPrimary,
                    fontSize: 14.5,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  metric.measuredAt != null
                      ? AppDate.relativeWithTime(metric.measuredAt!)
                      : '',
                  style: TextStyle(color: p.textSecondary, fontSize: 12.5),
                ),
                if (metric.note != null && metric.note!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    metric.note!,
                    style: TextStyle(
                        color: p.textSecondary,
                        fontSize: 12.5,
                        fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: metric.valueText,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                    TextSpan(
                      text: ' mmol/L',
                      style: TextStyle(color: p.textSecondary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  metric.statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          if (onDelete != null)
            IconButton(
              icon: Icon(Icons.delete_outline_rounded,
                  color: p.textSecondary, size: 20),
              onPressed: onDelete,
            ),
        ],
      ),
    );
  }
}
