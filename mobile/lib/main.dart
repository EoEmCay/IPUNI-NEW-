import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/api/api_client.dart';
import 'core/theme/theme_controller.dart';
import 'data/repositories/advice_repository.dart';
import 'data/repositories/appointments_repository.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/medications_repository.dart';
import 'data/repositories/metrics_repository.dart';
import 'state/advice_controller.dart';
import 'state/appointments_controller.dart';
import 'state/auth_controller.dart';
import 'state/medications_controller.dart';
import 'state/metrics_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();

  // ----- HTTP + repositories -----
  final apiClient = ApiClient(prefs);
  final authRepo = AuthRepository(apiClient);
  final metricsRepo = MetricsRepository(apiClient);
  final medsRepo = MedicationsRepository(apiClient);
  final apptRepo = AppointmentsRepository(apiClient);
  final adviceRepo = AdviceRepository(apiClient);

  // ----- controllers (stores) -----
  final theme = ThemeController(prefs);
  final auth = AuthController(authRepo, prefs);
  // Token hết hạn / 401 → tự đăng xuất, router đưa về Login.
  apiClient.onUnauthorized = auth.forceLogout;

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: theme),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider(create: (_) => MetricsController(metricsRepo)),
        ChangeNotifierProvider(
            create: (_) => MedicationsController(medsRepo)),
        ChangeNotifierProvider(
            create: (_) => AppointmentsController(apptRepo)),
        ChangeNotifierProvider(create: (_) => AdviceController(adviceRepo)),
      ],
      child: IpuniApp(auth: auth),
    ),
  );

  // Khôi phục phiên (chạy sau khi splash hiển thị).
  auth.bootstrap();
}
