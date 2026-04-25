import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';

class SirenPlayer {
  static final SirenPlayer _instance = SirenPlayer._internal();
  final AudioPlayer _audioPlayer = AudioPlayer();
  Timer? _timer;
  bool _isPlaying = false;
  bool _isInitialized = false;

  factory SirenPlayer() {
    return _instance;
  }

  SirenPlayer._internal();

  bool get isPlaying => _isPlaying;

  /// Initialize the siren player with proper error handling
  Future<void> initialize() async {
    if (_isInitialized) return;
    try {
      // Pre-load audio if available
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      _isInitialized = true;
    } catch (e) {
      // ignore: avoid_print
      print('SirenPlayer initialization warning: $e');
      _isInitialized = false;
    }
  }

  /// Start playing emergency siren with system alert sounds
  Future<void> play() async {
    if (_isPlaying) return;
    try {
      // Ensure initialization
      if (!_isInitialized) {
        await initialize();
      }

      _isPlaying = true;

      // Play system alert sound repeatedly
      _timer = Timer.periodic(const Duration(milliseconds: 850), (_) {
        try {
          SystemSound.play(SystemSoundType.alert);
        } catch (e) {
          // System sound failure shouldn't stop the timer
          // ignore: avoid_print
          print('SystemSound play failed: $e');
        }
      });

      // Also attempt to play audio siren if asset exists
      try {
        await _audioPlayer.play(AssetSource('siren.wav'));
      } catch (e) {
        // Siren asset may not exist, but SystemSound fallback continues
        // ignore: avoid_print
        print('Siren asset playback unavailable: $e');
      }
    } catch (e) {
      _isPlaying = false;
      _timer?.cancel();
      _timer = null;
      // ignore: avoid_print
      print('Error starting siren playback: $e');
      rethrow;
    }
  }

  /// Stop playing emergency siren with cleanup
  Future<void> stop() async {
    if (!_isPlaying) return;
    try {
      _isPlaying = false;
      _timer?.cancel();
      _timer = null;
      await _audioPlayer.stop();
    } catch (e) {
      // ignore: avoid_print
      print('Error stopping siren: $e');
    }
  }

  /// Clean up resources
  Future<void> dispose() async {
    try {
      await stop();
      await _audioPlayer.dispose();
      _isInitialized = false;
    } catch (e) {
      // ignore: avoid_print
      print('Error disposing SirenPlayer: $e');
    }
  }
}
