import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../features/volunteers/volunteer_repository.dart';
import 'volunteer_registration_screen.dart';

class VolunteerProfileScreen extends StatelessWidget {
  const VolunteerProfileScreen({super.key});

  Future<void> _toggleAvailability(
      BuildContext context, bool currentValue) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    await VolunteerRepository.instance.updateAvailability(
      volunteerId: user.uid,
      available: !currentValue,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const VolunteerRegistrationScreen();
    }

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: VolunteerRepository.instance.watchVolunteer(user.uid),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: Text(
              'Unable to load volunteer profile.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          );
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final data = snapshot.data?.data();
        if (data == null) {
          return const VolunteerRegistrationScreen();
        }

        final skills =
            (data['skills'] as List<dynamic>? ?? const []).cast<String>();
        final available = data['available'] as bool? ?? false;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  border: Border.all(color: AppColors.safeGreen, width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'VOLUNTEER PROFILE',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      data['name']?.toString() ?? 'Volunteer',
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 8),
                    Text('Phone: ${data['phone'] ?? 'N/A'}',
                        style: const TextStyle(color: Colors.white70)),
                    Text('District: ${data['district'] ?? 'N/A'}',
                        style: const TextStyle(color: Colors.white70)),
                    Text('Area: ${data['area'] ?? 'N/A'}',
                        style: const TextStyle(color: Colors.white70)),
                    Text('Vehicle: ${data['vehicle'] ?? 'None'}',
                        style: const TextStyle(color: Colors.white70)),
                    Text(
                        'Verified: ${data['verified'] == true ? 'Yes' : 'Pending'}',
                        style: const TextStyle(color: Colors.white70)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: skills
                          .map(
                            (skill) => Chip(
                              label: Text(skill),
                              backgroundColor: AppColors.surfaceContainer,
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 14),
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Availability'),
                      subtitle:
                          Text(available ? 'Available now' : 'Not available'),
                      value: available,
                      onChanged: (_) => _toggleAvailability(context, available),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  border: Border.all(color: Colors.white12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'ASSIGNED TASKS',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Assigned tasks will appear here once the authority dispatch panel is connected.',
                      style: TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const VolunteerRegistrationScreen(),
                      ),
                    );
                  },
                  child: const Text('Edit Registration'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
