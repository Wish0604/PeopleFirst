import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../core/theme/app_colors.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  LatLng? _currentLocation;
  LatLng? _nearestShelter;
  List<LatLng> _safeRoute = [];
  List<Marker> _markers = [];

  @override
  void initState() {
    super.initState();
    _fetchCurrentLocation();
    _listenToEmergencies();
  }

  Future<void> _fetchCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }
    
    if (permission == LocationPermission.deniedForever) return;

    final position = await Geolocator.getCurrentPosition();
    setState(() {
      _currentLocation = LatLng(position.latitude, position.longitude);
      _generateMockShelterAndRoute(_currentLocation!);
    });
    
    _mapController.move(_currentLocation!, 15.0);
  }

  void _generateMockShelterAndRoute(LatLng currentLoc) {
    // Generate a mock shelter approximately 1.2km away
    _nearestShelter = LatLng(currentLoc.latitude + 0.01, currentLoc.longitude + 0.01);
    
    // Create a mock staggered route to the shelter
    _safeRoute = [
      currentLoc,
      LatLng(currentLoc.latitude + 0.005, currentLoc.longitude),
      LatLng(currentLoc.latitude + 0.005, currentLoc.longitude + 0.005),
      LatLng(currentLoc.latitude + 0.01, currentLoc.longitude + 0.005),
      _nearestShelter!
    ];
  }

  void _listenToEmergencies() {
    FirebaseFirestore.instance.collection('responses').snapshots().listen((snapshot) {
      if (!mounted) return;
      
      final markers = <Marker>[];
      
      for (var doc in snapshot.docs) {
        final data = doc.data();
        if (data['location'] != null) {
          final lat = data['location'].latitude;
          final lng = data['location'].longitude;
          final isEmergency = data['status'] == 'NEED_HELP';
          
          markers.add(
            Marker(
              width: 40.0,
              height: 40.0,
              point: LatLng(lat, lng),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (isEmergency)
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.emergencyRed.withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                    ),
                  Icon(
                    Icons.location_on,
                    color: isEmergency ? AppColors.emergencyRed : AppColors.safeGreen,
                    size: isEmergency ? 30 : 24,
                  ),
                ],
              ),
            ),
          );
        }
      }
      
      setState(() {
        _markers = markers;
      });
    });
  }

  void _zoomIn() {
    _mapController.move(_mapController.camera.center, _mapController.camera.zoom + 1);
  }

  void _zoomOut() {
    _mapController.move(_mapController.camera.center, _mapController.camera.zoom - 1);
  }

  void _centerOnUser() {
    if (_currentLocation != null) {
      _mapController.move(_currentLocation!, 15.0);
    } else {
      _fetchCurrentLocation();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation ?? const LatLng(20.5937, 78.9629), // Default India
              initialZoom: 5.0,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                userAgentPackageName: 'com.peoplefirst.app',
              ),
              if (_currentLocation != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      width: 24.0,
                      height: 24.0,
                      point: _currentLocation!,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blue.withOpacity(0.5),
                              blurRadius: 10,
                              spreadRadius: 2,
                            )
                          ]
                        ),
                      ),
                    ),
                  ],
                ),
              if (_safeRoute.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _safeRoute,
                      color: AppColors.safeGreen,
                      strokeWidth: 5.0,
                    ),
                  ],
                ),
              if (_nearestShelter != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      width: 40.0,
                      height: 40.0,
                      point: _nearestShelter!,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 4,
                            )
                          ]
                        ),
                        child: const Icon(
                          Icons.home_work,
                          color: Colors.purple,
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                ),
              MarkerLayer(markers: _markers),
            ],
          ),
        ),
        Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: _BannerCard(
            icon: LucideIcons.mapPin,
            title: 'Live Coordination Active',
            subtitle: 'GPS Secured',
            accent: Colors.blue,
          ),
        ),
        Positioned(
          left: 20,
          top: 120,
          child: _LegendCard(),
        ),
        Positioned(
          right: 20,
          bottom: 140,
          child: Column(
            children: [
              _ControlButton(icon: Icons.add, onTap: _zoomIn),
              const SizedBox(height: 12),
              _ControlButton(icon: Icons.remove, onTap: _zoomOut),
              const SizedBox(height: 12),
              _ControlButton(icon: LucideIcons.locateFixed, isEmergency: true, onTap: _centerOnUser),
            ],
          ),
        ),
        Positioned(
          left: 20,
          right: 20,
          bottom: 24,
          child: _RouteCard(),
        ),
      ],
    );
  }
}

class _BannerCard extends StatelessWidget {
  const _BannerCard(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.accent});

  final IconData icon;
  final String title;
  final String subtitle;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.9),
        border: Border.all(color: accent, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: accent, size: 22),
              const SizedBox(width: 12),
              Text(title,
                  style: TextStyle(
                      color: accent,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 2)),
            ],
          ),
          Text(subtitle,
              style: TextStyle(
                  color: accent.withOpacity(0.6),
                  fontWeight: FontWeight.w900,
                  fontSize: 10)),
        ],
      ),
    );
  }
}

class _LegendCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    Widget row(Color color, String label, {bool outlined = false}) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: outlined ? color.withOpacity(0.2) : color,
                border: outlined ? Border.all(color: color) : null,
                shape: outlined ? BoxShape.rectangle : BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            Text(label,
                style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.92),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.black12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          row(Colors.blue, 'MY LOCATION'),
          row(Colors.purple, 'SHELTER'),
          row(AppColors.safeGreen, 'SAFE ROUTE'),
          row(AppColors.emergencyRed, 'DANGER ZONE', outlined: true),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({required this.icon, this.isEmergency = false, this.onTap});

  final IconData icon;
  final bool isEmergency;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: isEmergency ? AppColors.emergencyRed : AppColors.surface.withOpacity(0.9),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
              color: isEmergency ? Colors.red.shade900 : Colors.white10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            )
          ]
        ),
        child: Icon(icon,
            color: Colors.white.withOpacity(isEmergency ? 1 : 0.7), size: 24),
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
        border: const Border(left: BorderSide(color: AppColors.safeGreen, width: 8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          )
        ]
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nearest Shelter: Civic Center',
                    style: TextStyle(
                        color: AppColors.safeGreen,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2)),
                SizedBox(height: 6),
                Text('1.2 km  |  15 mins',
                    style:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            height: 56,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.safeGreen,
                foregroundColor: AppColors.surface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 18),
              ),
              onPressed: () {},
              icon: const Icon(LucideIcons.navigation, size: 18),
              label: const Text('START',
                  style: TextStyle(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}
