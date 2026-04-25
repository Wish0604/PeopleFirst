import 'siren_player.dart';
import 'flash_alert.dart';

class EmergencyActions {
  static final EmergencyActions _instance = EmergencyActions._internal();
  final SirenPlayer _sirenPlayer = SirenPlayer();
  final FlashAlert _flashAlert = FlashAlert();
  bool _isActive = false;
  bool _isInitialized = false;

  factory EmergencyActions() {
    return _instance;
  }

  EmergencyActions._internal();

  bool get isActive => _isActive;

  /// Initialize emergency actions components
  Future<void> initialize() async {
    if (_isInitialized) return;
    try {
      await _sirenPlayer.initialize();
      await _flashAlert.initialize();
      _isInitialized = true;
    } catch (e) {
      // ignore: avoid_print
      print('EmergencyActions initialization warning: $e');
    }
  }

  /// Activate critical emergency response (siren + flash)
  Future<void> activateCriticalEmergency() async {
    if (_isActive) return;
    try {
      _isActive = true;

      // Ensure initialization
      if (!_isInitialized) {
        await initialize();
      }

      // Start both siren and flash concurrently
      await Future.wait([
        _sirenPlayer.play(),
        _flashAlert.startFlashing(),
      ], eagerError: true);
    } catch (e) {
      _isActive = false;
      // ignore: avoid_print
      print('Error activating critical emergency: $e');
      rethrow;
    }
  }

  /// Deactivate critical emergency response
  Future<void> deactivateCriticalEmergency() async {
    if (!_isActive) return;
    try {
      _isActive = false;

      // Stop both siren and flash concurrently
      await Future.wait([
        _sirenPlayer.stop(),
        _flashAlert.stopFlashing(),
      ]);
    } catch (e) {
      // ignore: avoid_print
      print('Error deactivating critical emergency: $e');
    }
  }

  /// Clean up all resources
  Future<void> dispose() async {
    try {
      await deactivateCriticalEmergency();
      await _sirenPlayer.dispose();
      await _flashAlert.dispose();
      _isInitialized = false;
    } catch (e) {
      // ignore: avoid_print
      print('Error disposing EmergencyActions: $e');
    }
  }
}
