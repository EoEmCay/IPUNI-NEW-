import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_palette.dart';
import '../../core/utils/app_toast.dart';
import '../../state/auth_controller.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_text_field.dart';
import 'widgets/brand_header.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _cccd = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _submitting = false;

  @override
  void dispose() {
    _cccd.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final auth = context.read<AuthController>();
    final ok = await auth.register(
      _cccd.text.trim(),
      _phone.text.trim(),
      _password.text,
    );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      AppToast.success(context, 'Đăng ký thành công');
      context.go(AppRoutes.dashboard);
    } else {
      AppToast.error(context, auth.error ?? 'Đăng ký thất bại');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: p.textPrimary),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const BrandHeader(subtitle: 'Tạo tài khoản mới'),
                    const SizedBox(height: 28),
                    AppTextField(
                      label: 'Số CCCD',
                      hint: '12 chữ số',
                      controller: _cccd,
                      prefixIcon: Icons.badge_outlined,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(12),
                      ],
                      validator: (v) {
                        if (v == null || v.trim().length != 12) {
                          return 'CCCD phải đủ 12 chữ số';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Số điện thoại',
                      hint: 'Nhập số điện thoại',
                      controller: _phone,
                      prefixIcon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(11),
                      ],
                      validator: (v) => (v == null || v.trim().length < 9)
                          ? 'Số điện thoại không hợp lệ'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Mật khẩu',
                      hint: 'Tối thiểu 6 ký tự',
                      controller: _password,
                      obscureText: _obscure,
                      prefixIcon: Icons.lock_outline_rounded,
                      validator: (v) => (v == null || v.length < 6)
                          ? 'Mật khẩu tối thiểu 6 ký tự'
                          : null,
                      suffix: IconButton(
                        icon: Icon(
                          _obscure
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: p.textSecondary,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Xác nhận mật khẩu',
                      hint: 'Nhập lại mật khẩu',
                      controller: _confirm,
                      obscureText: _obscure,
                      prefixIcon: Icons.lock_outline_rounded,
                      validator: (v) => (v != _password.text)
                          ? 'Mật khẩu xác nhận không khớp'
                          : null,
                    ),
                    const SizedBox(height: 28),
                    AppButton(
                      label: 'Đăng ký',
                      loading: _submitting,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Đã có tài khoản? ',
                            style: TextStyle(color: p.textSecondary)),
                        GestureDetector(
                          onTap: () => context.pop(),
                          child: Text(
                            'Đăng nhập',
                            style: TextStyle(
                              color: p.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
