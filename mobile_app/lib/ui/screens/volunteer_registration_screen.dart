import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/services/local_storage_service.dart';
import '../../core/theme/app_colors.dart';
import '../../features/volunteers/volunteer_repository.dart';
import 'volunteer_success_screen.dart';

class VolunteerRegistrationScreen extends StatefulWidget {
  const VolunteerRegistrationScreen({super.key});

  @override
  State<VolunteerRegistrationScreen> createState() =>
      _VolunteerRegistrationScreenState();
}

class _VolunteerRegistrationScreenState
    extends State<VolunteerRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  final _districtController = TextEditingController();
  final _areaController = TextEditingController();
  final _idProofController = TextEditingController();
  final _vehicleOptions = const ['None', 'Bike', 'Car', 'Boat'];
  final _skillOptions = const [
    'First Aid',
    'Swimming',
    'Driving',
    'Medical',
    'Rescue Experience',
  ];

  String _gender = 'Female';
  String _vehicle = 'None';
  bool _availableNow = true;
  bool _saving = false;
  bool _capturingLocation = false;
  Position? _location;
  final Set<String> _skills = <String>{};

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _ageController.dispose();
    _districtController.dispose();
    _areaController.dispose();
    _idProofController.dispose();
    super.dispose();
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

  Future<User> _ensureUser() async {
    final existingUser = FirebaseAuth.instance.currentUser;
    if (existingUser != null) {
      return existingUser;
    }

    final credential = await FirebaseAuth.instance.signInAnonymously();
    final user = credential.user;
    if (user == null) {
      throw StateError('Unable to create volunteer session.');
    }
    return user;
  }

  void _toggleSkill(String skill) {
    setState(() {
      if (_skills.contains(skill)) {
        _skills.remove(skill);
      } else {
        _skills.add(skill);
      }
    });
  }

  Future<void> _captureLocation() async {
    setState(() {
      _capturingLocation = true;
    });

    try {
      final position = await _readCurrentLocation();
      if (!mounted) return;

      setState(() {
        _location = position;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            position == null
                ? 'Location permission unavailable. You can continue and try again later.'
                : 'Current location captured successfully.',
          ),
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Unable to capture location right now.')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _capturingLocation = false;
        });
      }
    }
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_skills.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one volunteer skill.')),
      );
      return;
    }

    setState(() {
      _saving = true;
    });

    try {
      final user = await _ensureUser();

      Position? location = _location;
      if (location == null) {
        location = await _readCurrentLocation();
      }

      final volunteerData = <String, dynamic>{
        'uid': user.uid,
        'name': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'age': int.parse(_ageController.text.trim()),
        'gender': _gender,
        'district': _districtController.text.trim(),
        'area': _areaController.text.trim(),
        'skills': _skills.toList()..sort(),
        'available': _availableNow,
        'vehicle': _vehicle,
        'idProof': _idProofController.text.trim(),
        'verified': false,
        'location': location == null
            ? null
            : GeoPoint(location.latitude, location.longitude),
        'locationCapturedAt':
            location == null ? null : FieldValue.serverTimestamp(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      }..removeWhere((key, value) => value == null);

      await VolunteerRepository.instance.saveVolunteerProfile(
        volunteerId: user.uid,
        profile: volunteerData,
      );

      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'email': user.email,
        'role': 'VOLUNTEER',
        'volunteerProfileComplete': true,
        'volunteerId': user.uid,
        'lastLoginAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      await LocalStorageService.instance.saveUserStatus('VOLUNTEER_REGISTERED');

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => VolunteerSuccessScreen(volunteerId: user.uid),
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionHeader(
              title: 'Volunteer Registration',
              subtitle:
                  'Create a verified ground-support profile for disaster response.',
            ),
            const SizedBox(height: 16),
            _FieldLabel(
              label: 'Full Name',
              child: TextFormField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(hintText: 'Enter full name'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter full name'
                    : null,
              ),
            ),
            const SizedBox(height: 12),
            _FieldLabel(
              label: 'Phone Number',
              child: TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration:
                    const InputDecoration(hintText: 'Enter phone number'),
                validator: (value) {
                  final text = value?.trim() ?? '';
                  if (text.isEmpty) return 'Enter phone number';
                  if (text.length < 8) return 'Enter a valid phone number';
                  return null;
                },
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _FieldLabel(
                    label: 'Age',
                    child: TextFormField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(hintText: 'Age'),
                      validator: (value) {
                        final parsed = int.tryParse(value?.trim() ?? '');
                        if (parsed == null) return 'Enter age';
                        if (parsed < 16) return 'Volunteer must be at least 16';
                        return null;
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _FieldLabel(
                    label: 'Gender',
                    child: DropdownButtonFormField<String>(
                      value: _gender,
                      items: const [
                        DropdownMenuItem(
                            value: 'Female', child: Text('Female')),
                        DropdownMenuItem(value: 'Male', child: Text('Male')),
                        DropdownMenuItem(value: 'Other', child: Text('Other')),
                        DropdownMenuItem(
                            value: 'Prefer not to say',
                            child: Text('Prefer not to say')),
                      ],
                      onChanged: (value) =>
                          setState(() => _gender = value ?? 'Female'),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _FieldLabel(
                    label: 'District',
                    child: TextFormField(
                      controller: _districtController,
                      textCapitalization: TextCapitalization.words,
                      decoration:
                          const InputDecoration(hintText: 'District / city'),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                              ? 'Enter district'
                              : null,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _FieldLabel(
                    label: 'Area',
                    child: TextFormField(
                      controller: _areaController,
                      textCapitalization: TextCapitalization.words,
                      decoration:
                          const InputDecoration(hintText: 'Area / locality'),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                              ? 'Enter area'
                              : null,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _FieldLabel(
              label: 'Skills',
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _skillOptions
                    .map(
                      (skill) => FilterChip(
                        label: Text(skill),
                        selected: _skills.contains(skill),
                        onSelected: (_) => _toggleSkill(skill),
                      ),
                    )
                    .toList(),
              ),
            ),
            const SizedBox(height: 12),
            _FieldLabel(
              label: 'Availability',
              child: SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: Text(_availableNow
                    ? 'Available now'
                    : 'Not available right now'),
                subtitle: const Text(
                    'Authorities can assign tasks based on your status.'),
                value: _availableNow,
                onChanged: (value) => setState(() => _availableNow = value),
              ),
            ),
            const SizedBox(height: 12),
            _FieldLabel(
              label: 'Vehicle',
              child: DropdownButtonFormField<String>(
                value: _vehicle,
                items: _vehicleOptions
                    .map((vehicle) =>
                        DropdownMenuItem(value: vehicle, child: Text(vehicle)))
                    .toList(),
                onChanged: (value) =>
                    setState(() => _vehicle = value ?? 'None'),
              ),
            ),
            const SizedBox(height: 12),
            _FieldLabel(
              label: 'ID Proof / Notes',
              child: TextFormField(
                controller: _idProofController,
                decoration: const InputDecoration(
                    hintText: 'Optional for demo, required in production'),
                maxLines: 2,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Location',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _location == null
                        ? 'No GPS fix yet'
                        : 'Lat ${_location!.latitude.toStringAsFixed(5)}, Lng ${_location!.longitude.toStringAsFixed(5)}',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _capturingLocation ? null : _captureLocation,
                      child: Text(_capturingLocation
                          ? 'Capturing...'
                          : 'Capture Current Location'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _submitRegistration,
                child: Text(_saving ? 'Submitting...' : 'Submit Registration'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        border: Border.all(color: AppColors.safeGreen.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'VOLUNTEER MODE',
            style: TextStyle(
                fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
              fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
