import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../core/theme/app_colors.dart';
import '../home_screen.dart';
import 'screens/map_screen.dart';
import 'screens/sos_screen.dart';
import 'screens/volunteer_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});
  static const routeName = '/main_nav';

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  StreamSubscription<QuerySnapshot>? _dispatchSubscription;

  @override
  void initState() {
    super.initState();
    _listenForDispatchSignals();
  }

  void _listenForDispatchSignals() {
    User? user;
    try {
      user = FirebaseAuth.instance.currentUser;
    } catch (_) {
      // Allow UI rendering in environments where Firebase is not initialized.
      return;
    }
    if (user == null) return;

    _dispatchSubscription = FirebaseFirestore.instance
        .collection('dispatch_logs')
        .where('targetUserId', isEqualTo: user.uid)
        .snapshots()
        .listen((snapshot) {
      for (var change in snapshot.docChanges) {
        if (change.type == DocumentChangeType.added) {
          final data = change.doc.data();
          if (data == null) continue;

          final message = data['message'] ?? 'No instruction provided';
          final resourceType = data['resourceType'] ?? 'RESOURCE';

          final createdAt = data['createdAt'];
          // Only show recent dispatches (last hour) to avoid old popups on startup
          if (createdAt is Timestamp) {
            final timeDiff = DateTime.now().difference(createdAt.toDate());
            if (timeDiff.inMinutes > 60) continue;
          }

          if (mounted) {
            _showDispatchDialog(resourceType, message);
          }
        }
      }
    });
  }

  void _showDispatchDialog(String resourceType, String message) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surfaceContainerHigh,
          title: Row(
            children: [
              const Icon(LucideIcons.truck, color: AppColors.safeGreen),
              const SizedBox(width: 8),
              const Text('DISPATCH SIGNAL',
                  style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Resource: $resourceType',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.white70)),
              const SizedBox(height: 12),
              Text(message, style: const TextStyle(color: Colors.white)),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('ACKNOWLEDGE',
                  style: TextStyle(color: AppColors.safeGreen)),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _dispatchSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.surfaceContainerLow,
            border: Border(
                bottom: BorderSide(color: AppColors.emergencyRed, width: 4)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.shieldAlert,
                        color: AppColors.emergencyRed.withValues(alpha: 0.8),
                        size: 32),
                    const SizedBox(width: 12),
                    const Text(
                      'PEOPLEFIRST',
                      style: TextStyle(
                        color: AppColors.emergencyRed,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: const Text(
                    'MESH ACTIVE',
                    style: TextStyle(
                      color: AppColors.emergencyRed,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomeScreen(
              onTabRequested: (index) => setState(() => _currentIndex = index)),
          const MapScreen(),
          const SosScreen(),
          const VolunteerScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        height: 80,
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          border: Border(
              top: BorderSide(
                  color: Colors.white.withValues(alpha: 0.05), width: 4)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(0, LucideIcons.home, 'HOME'),
            _buildNavItem(1, LucideIcons.map, 'MAPS'),
            _buildNavItem(2, LucideIcons.alertTriangle, 'SOS'),
            _buildNavItem(3, LucideIcons.users, 'VOLUNTEER'),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 80,
        color: isSelected ? AppColors.emergencyRed : Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                color: isSelected ? Colors.white : Colors.grey[600], size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey[600],
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
