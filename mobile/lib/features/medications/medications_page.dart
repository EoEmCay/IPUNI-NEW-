import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../data/models/medication.dart';
import '../../state/medications_controller.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import 'medication_form_sheet.dart';

class MedicationsPage extends StatefulWidget {
  const MedicationsPage({super.key});

  @override
  State<MedicationsPage> createState() => _MedicationsPageState();
}

class _MedicationsPageState extends State<MedicationsPage> {
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      WidgetsBinding.instance.addPostFrameCallback(
          (_) => context.read<MedicationsController>().fetchAll());
    }
  }

  Future<void> _add() async {
    final ok = await showMedicationFormSheet(context);
    if (ok && mounted) AppToast.success(context, 'Đã thêm thuốc');
  }

  Future<void> _edit(Medication med) async {
    final ok = await showMedicationFormSheet(context, medication: med);
    if (ok && mounted) AppToast.success(context, 'Đã cập nhật');
  }

  Future<void> _delete(Medication med) async {
    final p = context.palette;
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá thuốc?'),
        content: Text('Xoá "${med.name}" khỏi danh sách?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Huỷ')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Xoá', style: TextStyle(color: p.danger)),
          ),
        ],
      ),
    );
    if (yes == true && mounted) {
      await context.read<MedicationsController>().deleteMedication(med.id);
      if (mounted) AppToast.success(context, 'Đã xoá thuốc');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final ctrl = context.watch<MedicationsController>();

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        backgroundColor: p.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Thêm thuốc'),
      ),
      body: RefreshIndicator(
        color: p.primary,
        onRefresh: () => ctrl.fetchAll(),
        child: ctrl.loading && ctrl.all.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : ctrl.all.isEmpty
                ? ListView(
                    children: const [
                      SizedBox(height: 80),
                      EmptyState(
                        icon: Icons.medication_outlined,
                        title: 'Chưa có thuốc nào',
                        subtitle: 'Nhấn "Thêm thuốc" để thêm đơn thuốc.',
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.only(top: 16, bottom: 96),
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Đơn thuốc của tôi',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: p.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      for (final med in ctrl.all)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                          child: _MedicationCard(
                            med: med,
                            onEdit: () => _edit(med),
                            onDelete: () => _delete(med),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }
}

class _MedicationCard extends StatelessWidget {
  final Medication med;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _MedicationCard({
    required this.med,
    required this.onEdit,
    required this.onDelete,
  });

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
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: p.primaryLight,
                  borderRadius: BorderRadius.circular(p.radiusMd),
                ),
                child:
                    Icon(Icons.medication_rounded, color: p.primary, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      med.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: p.textPrimary,
                      ),
                    ),
                    if ((med.dosage ?? '').isNotEmpty ||
                        (med.frequency ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          [med.dosage, med.frequency]
                              .where((e) => (e ?? '').isNotEmpty)
                              .join(' · '),
                          style: TextStyle(
                              color: p.textSecondary, fontSize: 13),
                        ),
                      ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_vert_rounded, color: p.textSecondary),
                onSelected: (v) => v == 'edit' ? onEdit() : onDelete(),
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'edit', child: Text('Sửa')),
                  const PopupMenuItem(value: 'delete', child: Text('Xoá')),
                ],
              ),
            ],
          ),
          if (med.times.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final t in med.times)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: p.primaryLight,
                      borderRadius: BorderRadius.circular(p.radiusSm),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.access_time_rounded,
                            size: 14, color: p.primary),
                        const SizedBox(width: 5),
                        Text(t,
                            style: TextStyle(
                                color: p.primary,
                                fontWeight: FontWeight.w700,
                                fontSize: 12.5)),
                      ],
                    ),
                  ),
              ],
            ),
          ],
          if ((med.instructions ?? '').isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: p.bg,
                borderRadius: BorderRadius.circular(p.radiusSm),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded,
                      size: 16, color: p.textSecondary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      med.instructions!,
                      style:
                          TextStyle(color: p.textSecondary, fontSize: 12.5),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if ((med.doctorName ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'BS. ${med.doctorName}',
              style: TextStyle(
                  color: p.textSecondary,
                  fontSize: 12,
                  fontStyle: FontStyle.italic),
            ),
          ],
        ],
      ),
    );
  }
}
