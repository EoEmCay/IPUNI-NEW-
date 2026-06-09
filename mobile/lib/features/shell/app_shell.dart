import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_palette.dart';
import '../advice/advice_page.dart';
import '../appointments/appointments_page.dart';
import '../dashboard/dashboard_page.dart';
import '../medications/medications_page.dart';
import '../metrics/metrics_page.dart';
import 'shell_controller.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/top_bar.dart';
import '../../widgets/cute/cute_background.dart';

/// Khung chính: TopBar + nội dung tab + BottomNav. Tương đương AppLayout.jsx.
class AppShell extends StatelessWidget {
  const AppShell({super.key});

  static const _pages = [
    DashboardPage(),
    MetricsPage(),
    MedicationsPage(),
    AppointmentsPage(),
    AdvicePage(),
  ];

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return ChangeNotifierProvider(
      create: (_) => ShellController(),
      child: Consumer<ShellController>(
        builder: (context, shell, _) {
          return Scaffold(
            extendBody: true,
            backgroundColor: p.isCute ? Colors.transparent : p.bg,
            appBar: const TopBar(),
            body: Stack(
              children: [
                if (p.isCute) const Positioned.fill(child: CuteBackground()),
                Positioned.fill(
                  child: SafeArea(
                    top: false,
                    bottom: false,
                    child: IndexedStack(
                      index: shell.index,
                      children: _pages,
                    ),
                  ),
                ),
              ],
            ),
            bottomNavigationBar: BottomNav(
              currentIndex: shell.index,
              onTap: shell.setIndex,
            ),
          );
        },
      ),
    );
  }
}
