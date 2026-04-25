import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';

class VolunteerScreen extends StatelessWidget {
  const VolunteerScreen({super.key});

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Expanded(
                  child: _StatCard(
                      label: 'Tasks Completed',
                      value: '04',
                      accent: AppColors.safeGreen)),
              SizedBox(width: 12),
              Expanded(
                  child: _StatCard(
                      label: 'Current Priority',
                      value: 'HIGH',
                      accent: AppColors.warnYellow)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('Priority Task',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
              _Badge(label: 'ASSIGNED NOW', color: AppColors.warnYellow),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                border: Border.all(color: AppColors.emergencyRed, width: 2)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Rescue 3 people at Area X',
                              style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  height: 1.0)),
                          SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(LucideIcons.wind,
                                  size: 14, color: Colors.blue),
                              SizedBox(width: 6),
                              Text('Residential Zone • Flash Flood Risk',
                                  style: TextStyle(
                                      color: Colors.white54,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 80,
                      padding: const EdgeInsets.all(10),
                      color: AppColors.emergencyRed,
                      child: const Column(
                        children: [
                          Text('Distance',
                              style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white70,
                                  letterSpacing: 1)),
                          SizedBox(height: 4),
                          Text('0.8km',
                              style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  height: 180,
                  decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      border: Border.all(color: Colors.white10)),
                  child: const Center(
                      child: Icon(LucideIcons.mapPin,
                          color: AppColors.emergencyRed, size: 40)),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _ActionButton(
                          label: 'Navigate',
                          icon: LucideIcons.navigation,
                          background: AppColors.surface,
                          foreground: Colors.white,
                          onPressed: () => _showMessage(context,
                              'Opening navigation for the assigned task...')),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ActionButton(
                          label: 'Complete',
                          icon: LucideIcons.checkCircle2,
                          background: AppColors.safeGreen,
                          foreground: Colors.black,
                          onPressed: () => _showMessage(
                              context, 'Task marked as completed locally.')),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 72,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emergencyRed,
                  foregroundColor: Colors.white,
                  shape: const RoundedRectangleBorder()),
              onPressed: () =>
                  _showMessage(context, 'Queued the next available task.'),
              icon: const Icon(LucideIcons.zap, size: 26),
              label: const Text('Accept Next Task',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ),
          ),
          const SizedBox(height: 20),
          const Text('Nearby Requests',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          const _TaskTile(
              tag: 'Urgent',
              title: 'Medical Supply Delivery',
              desc: 'Central Hospital Outpost • Logistics',
              dist: '1.2km',
              accent: AppColors.warnYellow),
          const SizedBox(height: 10),
          const _TaskTile(
              tag: 'Standard',
              title: 'Water Distribution',
              desc: 'Shelter 04 • Resource Support',
              dist: '2.4km',
              accent: Colors.white54),
          const SizedBox(height: 10),
          const _TaskTile(
              tag: 'Standard',
              title: 'Sandbag Reinforcement',
              desc: 'East River Wall • Infrastructure',
              dist: '3.1km',
              accent: Colors.white54),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(
      {required this.label, required this.value, required this.accent});

  final String label;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          border: Border(left: BorderSide(color: accent, width: 4))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label.toUpperCase(),
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white54,
                  letterSpacing: 2)),
          Text(value,
              style: TextStyle(
                  fontSize: 42, fontWeight: FontWeight.w900, color: accent)),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          border: Border.all(color: color.withOpacity(0.2))),
      child: Text(label,
          style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 1)),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton(
      {required this.label,
      required this.icon,
      required this.background,
      required this.foreground,
      required this.onPressed});

  final String label;
  final IconData icon;
  final Color background;
  final Color foreground;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
            backgroundColor: background,
            foregroundColor: foreground,
            shape: const RoundedRectangleBorder()),
        onPressed: onPressed,
        icon: Icon(icon, size: 18),
        label: Text(label,
            style: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile(
      {required this.tag,
      required this.title,
      required this.desc,
      required this.dist,
      required this.accent});

  final String tag;
  final String title;
  final String desc;
  final String dist;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          border: Border(
              left: BorderSide(
                  color:
                      tag == 'Urgent' ? AppColors.warnYellow : Colors.white10,
                  width: 4))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      color: tag == 'Urgent'
                          ? AppColors.warnYellow
                          : Colors.white10,
                      child: Text(tag.toUpperCase(),
                          style: TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: tag == 'Urgent'
                                  ? Colors.black
                                  : Colors.white70)),
                    ),
                    const SizedBox(width: 8),
                    Text('$dist Away',
                        style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.white30)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(title,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text(desc,
                    style:
                        const TextStyle(fontSize: 12, color: Colors.white54)),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronRight, color: Colors.white24),
        ],
      ),
    );
  }
}
