import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../core/utils/date_format.dart';
import '../../data/models/appointment.dart';
import '../../state/appointments_controller.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/filter_pills.dart';
import 'appointment_form_sheet.dart';

class AppointmentsPage extends StatefulWidget {
  const AppointmentsPage({super.key});

  @override
  State<AppointmentsPage> createState() => _AppointmentsPageState();
}

class _AppointmentsPageState extends State<AppointmentsPage> {
  String _status = 'all';
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loaded) {
      _loaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  Future<void> _load() => context
      .read<AppointmentsController>()
      .fetchAll(status: _status == 'all' ? null : _status);

  Future<void> _add() async {
    final ok = await showAppointmentFormSheet(context);
    if (ok && mounted) AppToast.success(context, 'Đã thêm lịch hẹn');
  }

  Future<void> _edit(Appointment a) async {
    final ok = await showAppointmentFormSheet(context, appointment: a);
    if (ok && mounted) AppToast.success(context, 'Đã cập nhật');
  }

  Future<void> _delete(Appointment a) async {
    final p = context.palette;
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá lịch hẹn?'),
        content: Text('Xoá lịch hẹn với ${a.doctorName}?'),
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
      await context.read<AppointmentsController>().deleteAppointment(a.id);
      if (mounted) AppToast.success(context, 'Đã xoá lịch hẹn');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final ctrl = context.watch<AppointmentsController>();

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        backgroundColor: p.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Thêm lịch hẹn'),
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
                'Lịch hẹn bác sĩ',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: p.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 14),
            FilterPills(
              pills: const [
                FilterPill('all', 'Tất cả'),
                FilterPill('upcoming', 'Sắp tới'),
                FilterPill('completed', 'Đã khám'),
                FilterPill('cancelled', 'Đã huỷ'),
              ],
              selected: _status,
              onSelected: (v) {
                setState(() => _status = v);
                _load();
              },
            ),
            const SizedBox(height: 14),
            if (ctrl.loading && ctrl.all.isEmpty)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (ctrl.all.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: EmptyState(
                  icon: Icons.event_outlined,
                  title: 'Chưa có lịch hẹn',
                  subtitle: 'Nhấn "Thêm lịch hẹn" để tạo lịch khám.',
                ),
              )
            else
              for (final a in ctrl.all)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: _AppointmentCard(
                    appt: a,
                    onEdit: () => _edit(a),
                    onDelete: () => _delete(a),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final Appointment appt;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _AppointmentCard({
    required this.appt,
    required this.onEdit,
    required this.onDelete,
  });

  Color _statusColor(AppPalette p) {
    switch (appt.status) {
      case 'completed':
        return p.success;
      case 'cancelled':
        return p.danger;
      default:
        return p.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final statusColor = _statusColor(p);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(p.radiusMd),
                ),
                child: Icon(Icons.event_rounded, color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appt.doctorName,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15.5,
                        color: p.textPrimary,
                      ),
                    ),
                    if ((appt.department ?? '').isNotEmpty)
                      Text(appt.department!,
                          style: TextStyle(
                              color: p.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  appt.statusLabel,
                  style: TextStyle(
                      color: statusColor,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _infoRow(p, Icons.schedule_rounded,
              appt.scheduledAt != null ? AppDate.dateTime(appt.scheduledAt!) : '—'),
          if ((appt.location ?? '').isNotEmpty)
            _infoRow(p, Icons.location_on_outlined, appt.location!),
          if (appt.hasNote) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: p.primaryLight,
                borderRadius: BorderRadius.circular(p.radiusSm),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.sticky_note_2_outlined,
                      size: 16, color: p.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      appt.note!,
                      style: TextStyle(color: p.textPrimary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: onEdit,
                icon: Icon(Icons.edit_outlined, size: 18, color: p.primary),
                label: Text('Sửa', style: TextStyle(color: p.primary)),
              ),
              TextButton.icon(
                onPressed: onDelete,
                icon: Icon(Icons.delete_outline_rounded,
                    size: 18, color: p.danger),
                label: Text('Xoá', style: TextStyle(color: p.danger)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoRow(AppPalette p, IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: p.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: TextStyle(color: p.textSecondary, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
