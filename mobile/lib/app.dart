import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/constants/app_routes.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_controller.dart';
import 'features/auth/login_page.dart';
import 'features/auth/register_page.dart';
import 'features/shell/app_shell.dart';
import 'features/splash/splash_page.dart';
import 'state/auth_controller.dart';

class IpuniApp extends StatefulWidget {
  final AuthController auth;
  const IpuniApp({super.key, required this.auth});

  @override
  State<IpuniApp> createState() => _IpuniAppState();
}

class _IpuniAppState extends State<IpuniApp> {
  late final GoRouter _router = _buildRouter(widget.auth);

  GoRouter _buildRouter(AuthController auth) {
    return GoRouter(
      initialLocation: '/splash',
      refreshListenable: auth,
      routes: [
        GoRoute(
          path: '/splash',
          builder: (_, __) => const SplashPage(),
        ),
        GoRoute(
          path: AppRoutes.login,
          builder: (_, __) => const LoginPage(),
        ),
        GoRoute(
          path: AppRoutes.register,
          builder: (_, __) => const RegisterPage(),
        ),
        GoRoute(
          path: AppRoutes.dashboard,
          builder: (_, __) => const AppShell(),
        ),
      ],
      redirect: (context, state) {
        final status = auth.status;
        final loc = state.matchedLocation;
        final atSplash = loc == '/splash';
        final atAuth = loc == AppRoutes.login || loc == AppRoutes.register;

        if (status == AuthStatus.unknown) {
          return atSplash ? null : '/splash';
        }
        if (status == AuthStatus.unauthenticated) {
          return atAuth ? null : AppRoutes.login;
        }
        // authenticated
        if (atAuth || atSplash) return AppRoutes.dashboard;
        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCute = context.watch<ThemeController>().isCuteMode;
    return MaterialApp.router(
      title: 'IPUNI',
      debugShowCheckedModeBanner: false,
      theme: isCute ? AppTheme.cute() : AppTheme.light(),
      routerConfig: _router,
    );
  }
}
