import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_palette.dart';

/// Tương đương Input.jsx — ô nhập có nhãn, viền theo theme.
class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final IconData? prefixIcon;
  final Widget? suffix;
  final int maxLines;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final VoidCallback? onTap;
  final bool readOnly;

  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.prefixIcon,
    this.suffix,
    this.maxLines = 1,
    this.validator,
    this.inputFormatters,
    this.onChanged,
    this.enabled = true,
    this.onTap,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final radius = BorderRadius.circular(p.radiusMd);

    OutlineInputBorder borderWith(Color c) => OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: c, width: 1.4),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
            color: p.textSecondary,
          ),
        ),
        const SizedBox(height: 7),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          maxLines: obscureText ? 1 : maxLines,
          validator: validator,
          inputFormatters: inputFormatters,
          onChanged: onChanged,
          enabled: enabled,
          readOnly: readOnly,
          onTap: onTap,
          style: TextStyle(color: p.textPrimary, fontSize: 15.5),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: p.textSecondary.withValues(alpha: 0.6)),
            filled: true,
            fillColor: p.surface,
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            prefixIcon: prefixIcon == null
                ? null
                : Icon(prefixIcon, color: p.textSecondary, size: 20),
            suffixIcon: suffix,
            enabledBorder: borderWith(p.border),
            focusedBorder: borderWith(p.primary),
            errorBorder: borderWith(p.danger),
            focusedErrorBorder: borderWith(p.danger),
          ),
        ),
      ],
    );
  }
}
