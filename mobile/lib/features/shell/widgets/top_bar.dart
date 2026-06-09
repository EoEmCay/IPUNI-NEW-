import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../state/auth_controller.dart';
import 'user_menu.dart';

/// TopBar — logo + chuông + avatar (UserMenu). Tương đương TopBar.jsx.
class TopBar extends StatelessWidget implements PreferredSizeWidget {
  const TopBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final user = context.watch<AuthController>().user;

    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(bottom: BorderSide(color: p.border)),
      ),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 56,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                // Logo
                Icon(
                  p.isCute ? Icons.auto_awesome_rounded : Icons.favorite_rounded,
                  color: p.primary,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'IPUNI',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                    color: p.primary,
                  ),
                ),
                if (p.isCute) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: p.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'cute',
                      style: TextStyle(
                        color: p.primary,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                // Chuông
                IconButton(
                  icon: Icon(Icons.notifications_none_rounded,
                      color: p.textSecondary),
                  onPressed: () =>
                      AppToast.success(context, 'Chưa có thông báo mới'),
                ),
                // Avatar
                GestureDetector(
                  onTap: () => showUserMenu(context),
                  child: Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [p.primary, p.primary.withValues(alpha: 0.7)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      user?.initials ?? 'B',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
