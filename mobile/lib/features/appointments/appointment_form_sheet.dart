import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../core/utils/date_format.dart';
import '../../data/models/appointment.dart';
import '../../state/appointments_controller.dart';
import '../../widgets/common/app_bottom_sheet.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_text_field.dart';

Future<bool> showAppointmentFormSheet(BuildContext context,
    {Appointment? appointment}) async {
  final result = await showAppSheet<bool>(
    context,
    title: appointment == null ? 'Thêm lịch hẹn' : 'Sửa lịch hẹn',
    child: _AppointmentForm(appointment: appointment),
  );
  return result ?? false;
}

class _AppointmentForm extends StatefulWidget {
  final Appointment? appointment;
  const _AppointmentForm({this.appointment});

  @override
  State<_AppointmentForm> createState() => _AppointmentFormState();
}

class _AppointmentFormState extends State<_AppointmentForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _doctor;
  late final TextEditingController _department;
  late final TextEditingController _location;
  late final TextEditingController _note;
  late DateTime _scheduledAt;
  late String _status;
  bool _submitting = false;

  static const _statuses = {
    'upcoming': 'Sắp tới',
    'completed': 'Đã khám',
    'cancelled': 'Đã huỷ',
  };

  @override
  void initState() {
    super.initState();
    final a = widget.appointment;
    _doctor = TextEditingController(text: a?.doctorName ?? '');
    _department = TextEditingController(text: a?.department ?? '');
    _location = TextEditingController(text: a?.location ?? '');
    _note = TextEditingController(text: a?.note ?? '');
    _scheduledAt =
        a?.scheduledAt ?? DateTime.now().add(const Duration(days: 1));
    _status = a?.status ?? 'upcoming';
  }

  @override
  void dispose() {
    _doctor.dispose();
    _department.dispose();
    _location.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _scheduledAt,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_scheduledAt),
    );
    if (!mounted) return;
    setState(() {
      _scheduledAt = DateTime(date.year, date.month, date.day,
          time?.hour ?? _scheduledAt.hour, time?.minute ?? _scheduledAt.minute);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final payload = {
      'doctor_name': _doctor.text.trim(),
      'department': _department.text.trim(),
      'scheduled_at': AppDate.toApi(_scheduledAt),
      'location': _location.text.trim(),
      'note': _note.text.trim(),
      'status': _status,
    };
    final ctrl = context.read<AppointmentsController>();
    final ok = widget.appointment == null
        ? await ctrl.addAppointment(payload)
        : await ctrl.updateAppointment(widget.appointment!.id, payload);
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      AppToast.error(context, 'Không lưu được, thử lại');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppTextField(
            label: 'Bác sĩ',
            hint: 'VD: BS. Nguyễn Văn A',
            controller: _doctor,
            prefixIcon: Icons.person_outline_rounded,
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Nhập tên bác sĩ' : null,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Chuyên khoa (tuỳ chọn)',
            hint: 'VD: Nội tiết',
            controller: _department,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Thời gian hẹn',
            controller:
                TextEditingController(text: AppDate.dateTime(_scheduledAt)),
            readOnly: true,
            prefixIcon: Icons.event_rounded,
            onTap: _pickDateTime,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Địa điểm (tuỳ chọn)',
            hint: 'VD: Phòng khám 201',
            controller: _location,
            prefixIcon: Icons.location_on_outlined,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Ghi chú (tuỳ chọn)',
            controller: _note,
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          Text('Trạng thái',
              style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: p.textSecondary)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final entry in _statuses.entries)
                GestureDetector(
                  onTap: () => setState(() => _status = entry.key),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      color:
                          _status == entry.key ? p.primary : p.primaryLight,
                      borderRadius: BorderRadius.circular(p.radiusMd),
                      border: Border.all(
                          color:
                              _status == entry.key ? p.primary : p.border),
                    ),
                    child: Text(
                      entry.value,
                      style: TextStyle(
                        color: _status == entry.key
                            ? Colors.white
                            : p.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),
          AppButton(
            label: widget.appointment == null
                ? 'Thêm lịch hẹn'
                : 'Lưu thay đổi',
            loading: _submitting,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}
