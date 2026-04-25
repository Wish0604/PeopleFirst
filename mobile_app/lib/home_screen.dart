import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'core/theme/app_colors.dart';
import 'core/services/local_storage_service.dart';
import 'features/offline/local_rules_engine.dart';
import 'features/offline/emergency_actions.dart';
import 'login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, this.onTabRequested});

  final ValueChanged<int>? onTabRequested;

  Future<Position?> _readCurrentLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 8),
      ),
    );
  }

  Future<void> _submitResponse({
    required String alertId,
    required String status,
    required BuildContext context,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please log in again to submit response.')),
        );
      }
      return;
    }

    Position? position;
    if (status == 'NEED_HELP') {
      try {
        position = await _readCurrentLocation();
      } catch (_) {}
    }

    final responseData = <String, dynamic>{
      'alertId': alertId,
      'userId': user.uid,
      'email': user.email,
      'status': status,
      'createdAt': FieldValue.serverTimestamp(),
    };

    if (position != null) {
      responseData['location'] =
          GeoPoint(position.latitude, position.longitude);
    }

    await FirebaseFirestore.instance.collection('responses').add(responseData);
    await LocalStorageService.instance.saveUserStatus(status);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            status == 'NEED_HELP' && position == null
                ? 'Response submitted: $status (location unavailable)'
                : 'Response submitted: $status',
          ),
          backgroundColor: AppColors.safeGreen,
        ),
      );
    }
  }

  Future<void> _signOut(BuildContext context) async {
    await FirebaseAuth.instance.signOut();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacementNamed(LoginScreen.routeName);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      children: [
        // Status Header
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.emergencyRed.withOpacity(0.2),
            border: const Border(
                left: BorderSide(color: AppColors.emergencyRed, width: 8)),
            borderRadius: BorderRadius.circular(4),
          ),
          padding: const EdgeInsets.all(24),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CURRENT SAFETY STATUS',
                style: TextStyle(
                  color: AppColors.emergencyRed,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'CURRENT STATUS: AT RISK',
                style: TextStyle(
                  color: AppColors.emergencyRed,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  height: 1.1,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Active Cyclone Warning for your area.',
                style: TextStyle(
                  color: AppColors.emergencyRed,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Zone Info & Weather Grid
        Row(
          children: [
            Expanded(
              child: _buildGridCard(
                title: 'Local Geofence',
                value: 'Zone B - Downtown',
                icon: LucideIcons.mapPin,
                color: AppColors.warnYellow,
                bottomText: 'Medium Risk Area',
                showPulse: true,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildGridCard(
                title: 'Real-time Weather',
                value: '24°C Heavy Rain',
                icon: LucideIcons.cloudRain,
                color: Colors.blue[400]!,
                bottomText: 'Flood Watch: Active until 21:00',
                bottomTextColor: AppColors.emergencyRed,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Action Tiles
        _buildActionTile(
          LucideIcons.navigation,
          'VIEW SAFE ROUTES',
          AppColors.safeGreen,
          AppColors.surfaceContainerHigh,
          onTap: () => onTabRequested?.call(1),
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          LucideIcons.home,
          'NEARBY SHELTERS',
          AppColors.warnYellow,
          AppColors.surfaceContainerHigh,
          onTap: () => onTabRequested?.call(1),
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          LucideIcons.users,
          'SWITCH TO VOLUNTEER MODE',
          Colors.white,
          AppColors.emergencyRed,
          onTap: () => onTabRequested?.call(3),
        ),
        const SizedBox(height: 24),

        // Stop Alarm (from original)
        Align(
          alignment: Alignment.centerRight,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextButton.icon(
                onPressed: () =>
                    EmergencyActions().deactivateCriticalEmergency(),
                icon: const Icon(Icons.volume_off, color: Colors.white70),
                label: const Text('Stop Alarm',
                    style: TextStyle(color: Colors.white70)),
              ),
              TextButton.icon(
                onPressed: () => _signOut(context),
                icon: const Icon(Icons.logout, color: Colors.white70),
                label: const Text('Logout',
                    style: TextStyle(color: Colors.white70)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Alerts Feed Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'RECENT ALERTS',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
            ),
            TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'VIEW ALL',
                style: TextStyle(
                  color: AppColors.emergencyRed,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Divider(color: Colors.white.withOpacity(0.1), height: 1),
        const SizedBox(height: 16),

        // Alerts Feed Content (StreamBuilder)
        StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance.collection('alerts').snapshots(),
          builder: (context, snapshot) {
            if (snapshot.hasError) return Text('Error: ${snapshot.error}');
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            final docs = snapshot.data?.docs ?? [];
            if (docs.isEmpty) {
              return const Text('No recent alerts',
                  style: TextStyle(color: Colors.white54));
            }

            return Column(
              children: docs.map((doc) {
                final data = doc.data();
                final alertId = doc.id;
                final message = (data['message'] ?? 'Alert') as String;
                final riskLevel = (data['riskLevel'] ?? 'UNKNOWN') as String;

                final rulesEngine = LocalRulesEngine();
                final suggestedActions =
                    rulesEngine.evaluateEmergencyActions(data);

                final isCritical = riskLevel == 'CRITICAL';
                final cardColor =
                    isCritical ? AppColors.emergencyRed : AppColors.warnYellow;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    border:
                        Border(left: BorderSide(color: cardColor, width: 4)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: cardColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Icon(LucideIcons.alertTriangle,
                            color: cardColor, size: 16),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(message,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(
                              suggestedActions.join(' • '),
                              style: TextStyle(
                                  color: Colors.white.withOpacity(0.5),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: FilledButton(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: AppColors.safeGreen,
                                      foregroundColor: Colors.black,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(4)),
                                    ),
                                    onPressed: () => _submitResponse(
                                        alertId: alertId,
                                        status: 'SAFE',
                                        context: context),
                                    child: const Text('I am Safe',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: FilledButton(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: AppColors.emergencyRed,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(4)),
                                    ),
                                    onPressed: () => _submitResponse(
                                        alertId: alertId,
                                        status: 'NEED_HELP',
                                        context: context),
                                    child: const Text('Need Help',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            );
          },
        ),

        const SizedBox(height: 24),
        // Map Preview
        Container(
          height: 250,
          decoration: BoxDecoration(
            color: AppColors.surfaceContainer,
            border: Border.all(color: Colors.white.withOpacity(0.1)),
            borderRadius: BorderRadius.circular(4),
            image: const DecorationImage(
              image: NetworkImage(
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuCEVsxzq93_YTFJYVAmqETXVNcWqhC027Z-hJu8nOV9F4WA0Hco37YKh5LD4bEDBgc3F_WNdSJ600I3isCLCJQqCdrgKx197RPNC3JTCUN1jxaVK1UlFLWr2UEmiNSgmoQBYKq4I_iDzREJX4up-_iNIJ3zqHGgKapNbmOhISkhY8LMtJdj_DR972uIatnTDhcizX-RZ9tMeWCbKdWYJk86tjih7BxmDNGn2nt5DGVnm9VvdSmLMlmzg8BbGe97h6WKlwSdGXENrH_O'),
              fit: BoxFit.cover,
              colorFilter: ColorFilter.mode(Colors.black54, BlendMode.darken),
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                bottom: 16,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'LIVE GRID ACTIVE',
                        style: TextStyle(
                          color: AppColors.safeGreen,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'OPTIMAL MESH SIGNAL',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 16,
                right: 16,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(LucideIcons.maximize2,
                      color: Colors.black, size: 20),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGridCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required String bottomText,
    Color? bottomTextColor,
    bool showPulse = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title.toUpperCase(),
                      style: TextStyle(
                        color: color,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(icon, color: color.withOpacity(0.5), size: 32),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              if (showPulse) ...[
                Container(
                  width: 10,
                  height: 10,
                  decoration:
                      BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  bottomText,
                  style: TextStyle(
                    color: bottomTextColor ?? Colors.white.withOpacity(0.7),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile(
    IconData icon,
    String label,
    Color iconColor,
    Color bgColor, {
    VoidCallback? onTap,
  }) {
    return Material(
      color: bgColor,
      child: InkWell(
        onTap: onTap,
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            color: bgColor,
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 16),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
