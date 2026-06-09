import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/constants/metric_constants.dart';
import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../core/utils/date_format.dart';
import '../../state/metrics_controller.dart';
import '../../widgets/common/app_bottom_sheet.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_text_field.dart';

/// Mở form nhập chỉ số. Trả về true nếu lưu thành công.
Future<bool> showAddMetricSheet(BuildContext context, {String? initialType}) async {
  final result = await showAppSheet<bool>(
    context,
    title: 'Nhập chỉ số đường huyết',
    child: _AddMetricForm(initialType: initialType ?? 'fasting'),
  );
  return result ?? false;
}

class _AddMetricForm extends StatefulWidget {
  final String initialType;
  const _AddMetricForm({required this.initialType});

  @override
  State<_AddMetricForm> createState() => _AddMetricFormState();
}

class _AddMetricFormState extends State<_AddMetricForm> {
  final _formKey = GlobalKey<FormState>();
  final _value = TextEditingController();
  final _note = TextEditingController();
  late String _type = widget.initialType;
  DateTime _measuredAt = DateTime.now();
  bool _submitting = false;

  @override
  void dispose() {
    _value.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _measuredAt,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_measuredAt),
    );
    if (!mounted) return;
    setState(() {
      _measuredAt = DateTime(
        date.year,
        date.month,
        date.day,
        time?.hour ?? _measuredAt.hour,
        time?.minute ?? _measuredAt.minute,
      );
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final value = double.parse(_value.text.replaceAll(',', '.'));
    final ok = await context.read<MetricsController>().addMetric(
          type: _type,
          value: value,
          measuredAt: _measuredAt,
          note: _note.text.trim(),
        );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      AppToast.error(context, 'Không lưu được chỉ số, thử lại');
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
          Text('Loại chỉ số',
              style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: p.textSecondary)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final key in kMetricTypeOrder)
                _typeChip(p, key, kMetricTypes[key]!.label),
            ],
          ),
          const SizedBox(height: 18),
          AppTextField(
            label: 'Giá trị (mmol/L)',
            hint: 'VD: 5.6',
            controller: _value,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            prefixIcon: Icons.water_drop_outlined,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
            validator: (v) {
              final parsed = double.tryParse((v ?? '').replaceAll(',', '.'));
              if (parsed == null) return 'Nhập số hợp lệ';
              if (parsed <= 0 || parsed > 50) return 'Giá trị 0.1 – 50 mmol/L';
              return null;
            },
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Thời điểm đo',
            controller: TextEditingController(text: AppDate.dateTime(_measuredAt)),
            readOnly: true,
            prefixIcon: Icons.schedule_rounded,
            onTap: _pickDateTime,
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Ghi chú (tuỳ chọn)',
            hint: 'VD: sau khi tập thể dục',
            controller: _note,
            maxLines: 2,
          ),
          const SizedBox(height: 24),
          AppButton(
            label: 'Lưu chỉ số',
            loading: _submitting,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }

  Widget _typeChip(AppPalette p, String key, String label) {
    final active = _type == key;
    return GestureDetector(
      onTap: () => setState(() => _type = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: active ? p.primary : p.primaryLight,
          borderRadius: BorderRadius.circular(p.radiusMd),
          border: Border.all(color: active ? p.primary : p.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : p.primary,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
