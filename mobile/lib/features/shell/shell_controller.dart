import 'package:flutter/foundation.dart';

/// Quản lý tab đang chọn trong AppShell, cho phép các trang con (vd Dashboard)
/// chuyển tab qua context.read<ShellController>().
class ShellController extends ChangeNotifier {
  int _index = 0;
  int get index => _index;

  void setIndex(int value) {
    if (_index == value) return;
    _index = value;
    notifyListeners();
  }
}
