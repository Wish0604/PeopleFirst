import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:torch_light/torch_light.dart';

import '../../core/theme/app_colors.dart';
import '../../core/services/local_storage_service.dart';

class SosScreen extends StatefulWidget {
  const SosScreen({super.key});

  @override
  State<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends State<SosScreen> {
  String _view = 'alert';
  int _peopleCount = 3;
  String _injuryStatus = 'None';
  final TextEditingController _needsController = TextEditingController();

  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isEmergencySignalActive = false;

  @override
  void dispose() {
    _audioPlayer.dispose();
    try {
      TorchLight.disableTorch();
    } catch (_) {}
    _needsController.dispose();
    super.dispose();
  }

  Future<void> _toggleEmergencySignals() async {
    if (_isEmergencySignalActive) {
      await _audioPlayer.stop();
      try {
        await TorchLight.disableTorch();
      } catch (_) {}
      setState(() {
        _isEmergencySignalActive = false;
      });
    } else {
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('siren.wav'));
      try {
        final hasTorch = await TorchLight.isTorchAvailable();
        if (hasTorch) {
          await TorchLight.enableTorch();
        }
      } catch (_) {}
      setState(() {
        _isEmergencySignalActive = true;
      });
    }
  }

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

  Future<void> _submitStatus(String status) async {
    var user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      try {
        final credential = await FirebaseAuth.instance.signInAnonymously();
        user = credential.user;
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Unable to create session. Please try again.')),
          );
        }
        return;
      }
    }

    if (user == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Unable to create session. Please try again.')),
        );
      }
      return;
    }

    final payload = <String, dynamic>{
      'alertId': 'sos_${user.uid}_${DateTime.now().millisecondsSinceEpoch}',
      'userId': user.uid,
      'email': user.email,
      'status': status,
      'injuryStatus': _injuryStatus,
      'peopleCount': _peopleCount,
      'needs': _needsController.text.trim(),
      'source': 'sos_screen',
      'createdAt': FieldValue.serverTimestamp(),
    };

    if (status == 'NEED_HELP') {
      try {
        final position = await _readCurrentLocation();
        if (position != null) {
          payload['location'] = GeoPoint(position.latitude, position.longitude);
        }
      } catch (_) {}
    }

    await FirebaseFirestore.instance.collection('responses').add(payload);
    await LocalStorageService.instance.saveUserStatus(status);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Status submitted: $status')),
    );

    if (status == 'NEED_HELP') {
      setState(() => _view = 'offline');
    }
  }

  Future<void> _submitDistressSignal() async {
    await _submitStatus('NEED_HELP');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: AppColors.surfaceContainerHigh,
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: ['alert', 'form', 'offline']
                .map((value) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Text(value.toUpperCase(),
                            style: const TextStyle(
                                fontSize: 9, fontWeight: FontWeight.w900)),
                        selected: _view == value,
                        onSelected: (_) => setState(() => _view = value),
                        selectedColor: Colors.white,
                        backgroundColor: Colors.transparent,
                        labelStyle: TextStyle(
                            color:
                                _view == value ? Colors.black : Colors.white54),
                        side: const BorderSide(color: Colors.white12),
                      ),
                    ))
                .toList(),
          ),
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: _view == 'form'
                ? _buildForm()
                : _view == 'offline'
                    ? _buildOffline()
                    : _buildAlert(),
          ),
        ),
      ],
    );
  }

  Widget _buildAlert() {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('alerts')
          .orderBy('createdAt', descending: true)
          .limit(1)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint('Error loading alerts: ${snapshot.error}');
        }

        final latestAlert = snapshot.data?.docs.isNotEmpty == true
            ? snapshot.data!.docs.first.data()
            : null;

        final alertType = (latestAlert?['type'] ?? 'SYSTEM').toString();
        final alertMessage = (latestAlert?['message'] ?? 'No active emergency declared at this time.').toString();
        final zone = (latestAlert?['sourceZoneName'] ?? latestAlert?['sourceZoneId'] ?? 'Global Area').toString();
        final riskLevel = (latestAlert?['riskLevel'] ?? 'LOW').toString().toUpperCase();

        final isCritical = riskLevel == 'CRITICAL' || riskLevel == 'HIGH';
        final bgColor = isCritical ? AppColors.emergencyRed : AppColors.primaryBlue;
        final infoHeadline = isCritical ? 'IMMEDIATE' : 'MONITOR';
        final infoSubtitle = isCritical ? 'Action Required' : 'Stay Prepared';

        return SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                height: 360,
                color: bgColor,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Opacity(
                      opacity: 0.14,
                      child: Container(color: Colors.black),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const _SirenCircle(),
                        const SizedBox(height: 18),
                        Text('$alertType Warning',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                                color: Colors.white)),
                        const SizedBox(height: 8),
                        Text(zone,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Colors.white70,
                                letterSpacing: 1.5)),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(alertMessage,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(0, -24),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _InfoCard(
                              title: 'Urgent Action Required',
                              headline: infoHeadline,
                              subtitle: infoSubtitle,
                              accent: bgColor,
                              centered: true,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: InkWell(
                              onTap: _toggleEmergencySignals,
                              child: _ActionCard(
                                title: 'Emergency Signals',
                                headline: _isEmergencySignalActive ? 'Stop Siren' : 'Activate Siren',
                                icon: _isEmergencySignalActive ? LucideIcons.volumeX : LucideIcons.volume2,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _BannerRow(
                        icon: LucideIcons.wind,
                        label: 'Local Outdoor Sirens Active',
                        accent: bgColor,
                      ),
                      const SizedBox(height: 12),
                      _AlertExplainabilityPanel(),
                      const SizedBox(height: 16),
                      _PrimaryAction(
                          label: 'I Am Safe',
                          color: AppColors.safeGreen,
                          textColor: Colors.black,
                          icon: LucideIcons.checkCircle2,
                          onTap: () => _submitStatus('SAFE')),
                      const SizedBox(height: 12),
                      _PrimaryAction(
                          label: 'Need Help',
                          color: AppColors.emergencyRed,
                          textColor: Colors.white,
                          icon: LucideIcons.shieldAlert,
                          onTap: () => setState(() => _view = 'form')),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Request Emergency Assistance',
              style: TextStyle(
                  fontSize: 34, fontWeight: FontWeight.w900, height: 1.0)),
          const SizedBox(height: 16),
          _BannerRow(
              icon: LucideIcons.mapPin,
              label: 'Location Sharing Active',
              accent: AppColors.safeGreen),
          const SizedBox(height: 28),
          const Text('Number of people with you',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white54,
                  letterSpacing: 2)),
          const SizedBox(height: 10),
          Row(
            children: [1, 2, 3, 4, 5].map((groupSize) {
              final selected = _peopleCount == groupSize;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _peopleCount = groupSize),
                    child: Container(
                      height: 54,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.emergencyRed
                            : AppColors.surfaceContainer,
                        border: Border.all(
                            color:
                                selected ? Colors.transparent : Colors.white10),
                      ),
                      child: Text(groupSize == 5 ? '5+' : '$groupSize',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: selected ? Colors.white : Colors.white54)),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          const Text('Injury Status',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white54,
                  letterSpacing: 2)),
          const SizedBox(height: 10),
          _StatusButton(
              label: 'None',
              icon: LucideIcons.checkCircle2,
              color: AppColors.safeGreen,
              selected: _injuryStatus == 'None',
              onTap: () => setState(() => _injuryStatus = 'None')),
          const SizedBox(height: 10),
          _StatusButton(
              label: 'Minor',
              icon: LucideIcons.alertTriangle,
              color: AppColors.warnYellow,
              selected: _injuryStatus == 'Minor',
              onTap: () => setState(() => _injuryStatus = 'Minor')),
          const SizedBox(height: 10),
          _StatusButton(
              label: 'Critical',
              icon: LucideIcons.shieldAlert,
              color: AppColors.emergencyRed,
              selected: _injuryStatus == 'Critical',
              onTap: () => setState(() => _injuryStatus = 'Critical')),
          const SizedBox(height: 24),
          const Text('Specific needs (meds, accessibility)',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white54,
                  letterSpacing: 2)),
          const SizedBox(height: 10),
          TextField(
            controller: _needsController,
            maxLines: 5,
            decoration: const InputDecoration(
              hintText: 'OPTIONAL: TYPE URGENT REQUIREMENTS HERE...',
              filled: true,
              fillColor: AppColors.surfaceContainer,
              border: OutlineInputBorder(borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              border: Border.all(color: Colors.white10),
            ),
            child: const Center(
                child: Icon(LucideIcons.mapPin,
                    color: AppColors.emergencyRed, size: 40)),
          ),
          const SizedBox(height: 24),
          InkWell(
            onTap: _submitDistressSignal,
            child: Container(
              width: double.infinity,
              height: 72,
              color: AppColors.emergencyRed,
              alignment: Alignment.center,
              child: const Text('Send Distress Signal',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOffline() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            color: AppColors.emergencyRed,
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Offline Mode Active',
                    style: TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        height: 1.0)),
                SizedBox(height: 10),
                Text(
                    'Cellular and Wi-Fi signals lost. PeopleFirst Mesh Network is managing local data synchronization.',
                    style: TextStyle(fontSize: 14, color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            height: 240,
            decoration: BoxDecoration(
                color: AppColors.surfaceContainer,
                border: Border.all(color: Colors.white10)),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.network,
                      color: AppColors.safeGreen, size: 40),
                  SizedBox(height: 10),
                  Text('12 DEVICES',
                      style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: AppColors.safeGreen)),
                  Text('Connected to Cluster',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: Colors.white54,
                          letterSpacing: 2)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SirenCircle extends StatelessWidget {
  const _SirenCircle();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration:
          const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
      child:
          const Icon(LucideIcons.wind, color: AppColors.emergencyRed, size: 46),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard(
      {required this.title,
      required this.headline,
      required this.subtitle,
      required this.accent,
      this.centered = false});

  final String title;
  final String headline;
  final String subtitle;
  final Color accent;
  final bool centered;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          border: Border.all(color: accent, width: 2)),
      child: Column(
        crossAxisAlignment:
            centered ? CrossAxisAlignment.center : CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(),
              textAlign: centered ? TextAlign.center : TextAlign.start,
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white54,
                  letterSpacing: 2)),
          const SizedBox(height: 14),
          Text(headline,
              textAlign: centered ? TextAlign.center : TextAlign.start,
              style: TextStyle(
                  fontSize: 30, fontWeight: FontWeight.w900, color: accent)),
          const SizedBox(height: 4),
          Text(subtitle.toUpperCase(),
              textAlign: centered ? TextAlign.center : TextAlign.start,
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Colors.white70,
                  letterSpacing: 1.5)),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard(
      {required this.title, required this.headline, required this.icon});

  final String title;
  final String headline;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 170,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          border: Border.all(color: Colors.white10)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title.toUpperCase(),
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white54,
                  letterSpacing: 2)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                  child: Text(headline,
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w900))),
              Container(
                  width: 52,
                  height: 52,
                  color: AppColors.emergencyRed,
                  child: Icon(icon, color: Colors.white, size: 28)),
            ],
          ),
        ],
      ),
    );
  }
}

class _BannerRow extends StatelessWidget {
  const _BannerRow(
      {required this.icon, required this.label, required this.accent});

  final IconData icon;
  final String label;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          border: Border(left: BorderSide(color: accent, width: 4))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: accent, size: 16),
          const SizedBox(width: 8),
          Text(label.toUpperCase(),
              style: TextStyle(
                  color: accent,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
        ],
      ),
    );
  }
}

class _AlertExplainabilityPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('alerts')
          .orderBy('createdAt', descending: true)
          .limit(1)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return const SizedBox.shrink();
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox.shrink();
        }

        final latest = snapshot.data?.docs.isNotEmpty == true
            ? snapshot.data!.docs.first.data()
            : null;

        final priority =
            (latest?['riskPriority'] ?? latest?['riskLevel'] ?? 'ROUTINE')
                .toString();
        final intelligenceScore =
            (latest?['riskIntelligenceScore'] ?? latest?['riskScore'] ?? 'N/A')
                .toString();
        final intelligenceReason =
            (latest?['riskIntelligenceReason'] ?? latest?['riskReason'] ?? '')
                .toString();
        final zone = (latest?['sourceZoneName'] ??
                latest?['sourceZoneId'] ??
                'Unspecified')
            .toString();

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              border: Border.all(color: Colors.white12)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('INTELLIGENT RISK CONTEXT',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Colors.white54,
                      letterSpacing: 2)),
              const SizedBox(height: 10),
              Text('Priority: ${priority.toUpperCase()}',
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Colors.white)),
              const SizedBox(height: 4),
              Text('Intelligence Score: $intelligenceScore',
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white70)),
              const SizedBox(height: 4),
              Text('Zone: $zone',
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white70)),
              if (intelligenceReason.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(intelligenceReason,
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white60,
                        height: 1.3)),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _PrimaryAction extends StatelessWidget {
  const _PrimaryAction(
      {required this.label,
      required this.color,
      required this.textColor,
      required this.icon,
      this.onTap});

  final String label;
  final Color color;
  final Color textColor;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 72,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: textColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        ),
        onPressed: onTap,
        icon: Icon(icon, size: 24),
        label: Text(label,
            style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 2)),
      ),
    );
  }
}

class _StatusButton extends StatelessWidget {
  const _StatusButton(
      {required this.label,
      required this.icon,
      required this.color,
      required this.selected,
      required this.onTap});

  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
            color: selected
                ? color.withValues(alpha: 0.18)
                : AppColors.surfaceContainer,
            border: Border.all(color: color)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w900, color: color)),
            Icon(icon, color: color, size: 22),
          ],
        ),
      ),
    );
  }
}
