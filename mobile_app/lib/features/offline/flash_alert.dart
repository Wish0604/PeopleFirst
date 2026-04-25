import 'dart:async';

import 'package:torch_light/torch_light.dart';

class FlashAlert {
  static final FlashAlert _instance = FlashAlert._internal();
  bool _isFlashing = false;
  Timer? _timer;
  bool _torchAvailable = false;
  bool _isInitialized = false;

  factory FlashAlert() {
    return _instance;
  }

  FlashAlert._internal();

  bool get isFlashing => _isFlashing;

  /// Initialize flash alert with torch availability check
  Future<void> initialize() async {
    if (_isInitialized) return;
    try {
      _torchAvailable = await TorchLight.isTorchAvailable();
      _isInitialized = true;
    } catch (e) {
      // ignore: avoid_print
      print('FlashAlert initialization warning: $e');
      _torchAvailable = false;
      _isInitialized = true; // Mark as initialized even if torch unavailable
    }
  }

  /// Start emergency flash alert with proper error handling
  Future<void> startFlashing() async {
    if (_isFlashing) return;

    try {
      // Ensure initialization
      if (!_isInitialized) {
        await initialize();
      }

      if (!_torchAvailable) {
        // ignore: avoid_print
        print(
            'Torch is not available on this device - flash alert unavailable');
        return;
      }

      _isFlashing = true;
      var isOn = false;

      _timer = Timer.periodic(const Duration(milliseconds: 500), (_) async {
        try {
          if (isOn) {
            await TorchLight.disableTorch();
          } else {
            await TorchLight.enableTorch();
          }
          isOn = !isOn;
        } catch (e) {
          // ignore: avoid_print
          print('Error in flash loop: $e');
          await stopFlashing();
        }
      });
    } catch (e) {
      _isFlashing = false;
      _timer?.cancel();
      _timer = null;
      // ignore: avoid_print
      print('Error starting flash alert: $e');
      rethrow;
    }
  }

  /// Stop emergency flash alert with cleanup
  Future<void> stopFlashing() async {
    _isFlashing = false;
    _timer?.cancel();
    _timer = null;
    try {
      if (_torchAvailable) {
        await TorchLight.disableTorch();
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error disabling torch: $e');
    }
  }

  /// Clean up resources
  Future<void> dispose() async {
    try {
      await stopFlashing();
    } catch (e) {
      // ignore: avoid_print
      print('Error disposing FlashAlert: $e');
    }
  }
}
