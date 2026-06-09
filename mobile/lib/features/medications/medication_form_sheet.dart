import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../data/models/medication.dart';
import '../../state/medications_controller.dart';
import '../../widgets/common/app_bottom_sheet.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_text_field.dart';

/// Mở form thêm/sửa thuốc. Trả về true nếu lưu thành công.
Future<bool> showMedicationFormSheet(BuildContext context,
    {Medication? medication}) async {
  final result = await showAppSheet<bool>(
    context,
    title: medication == null ? 'Thêm thuốc' : 'Sửa thuốc',
    child: _MedicationForm(medication: medication),
  );
  return result ?? false;
}

class _MedicationForm extends StatefulWidget {
  final Medication? medication;
  const _MedicationForm({this.medication});

  @override
  State<_MedicationForm> createState() => _MedicationFormState();
}

class _MedicationFormState extends State<_MedicationForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _dosage;
  late final TextEditingController _frequency;
  late final TextEditingController _instructions;
  late final TextEditingController _doctor;
  late List<String> _times;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final m = widget.medication;
    _name = TextEditingController(text: m?.name ?? '');
    _dosage = TextEditingController(text: m?.dosage ?? '');
    _frequency = TextEditingController(text: m?.frequency ?? '');
    _instructions = TextEditingController(text: m?.instructions ?? '');
    _doctor = TextEditingController(text: m?.doctorName ?? '');
    _times = [...?m?.times];
    if (_times.isEmpty) _times = ['08:00'];
  }

  @override
  void dispose() {
    _name.dispose();
    _dosage.dispose();
    _frequency.dispose();
    _instructions.dispose();
    _doctor.dispose();
    super.dispose();
  }

  Future<void> _addTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 8, minute: 0),
    );
    if (picked == null) return;
    final str =
        '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    if (!_times.contains(str)) {
      setState(() {
        _times.add(str);
        _times.sort();
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_times.isEmpty) {
      AppToast.error(context, 'Cần ít nhất 1 thời điểm uống');
      return;
    }
    setState(() => _submitting = true);
    final payload = {
      'name': _name.text.trim(),
      'dosage': _dosage.text.trim(),
      'frequency': _frequency.text.trim(),
      'times': _times,
      'instructions': _instructions.text.trim(),
      'doctor_name': _doctor.text.trim(),
    };
    final ctrl = context.read<MedicationsController>();
    final ok = widget.medication == null
        ? await ctrl.addMedication(payload)
        : await ctrl.updateMedication(widget.medication!.id, payload);
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
            label: 'Tên thuốc',
            hint: 'VD: Metformin',
            controller: _name,
            prefixIcon: Icons.medication_outlined,
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Nhập tên thuốc' : null,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Liều lượng',
            hint: 'VD: 500mg',
            controller: _dosage,
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Nhập liều lượng' : null,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Tần suất',
            hint: 'VD: 2 lần/ngày',
            controller: _frequency,
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Nhập tần suất' : null,
          ),
          const SizedBox(height: 16),
          Text('Thời điểm uống',
              style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: p.textSecondary)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final t in _times) _timeChip(p, t),
              GestureDetector(
                onTap: _addTime,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: p.primaryLight,
                    borderRadius: BorderRadius.circular(p.radiusMd),
                    border: Border.all(color: p.primary),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_rounded, size: 16, color: p.primary),
                      const SizedBox(width: 4),
                      Text('Thêm giờ',
                          style: TextStyle(
                              color: p.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Hướng dẫn (tuỳ chọn)',
            hint: 'VD: uống sau ăn',
            controller: _instructions,
            maxLines: 2,
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Bác sĩ kê đơn (tuỳ chọn)',
            controller: _doctor,
            prefixIcon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 24),
          AppButton(
            label: widget.medication == null ? 'Thêm thuốc' : 'Lưu thay đổi',
            loading: _submitting,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }

  Widget _timeChip(AppPalette p, String t) {
    return Container(
      padding: const EdgeInsets.only(left: 14, right: 6, top: 6, bottom: 6),
      decoration: BoxDecoration(
        color: p.primary,
        borderRadius: BorderRadius.circular(p.radiusMd),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(t,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13)),
          GestureDetector(
            onTap: () => setState(() => _times.remove(t)),
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.close_rounded, color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}
