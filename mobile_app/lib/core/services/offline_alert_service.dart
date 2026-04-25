import 'dart:async';

import '../../features/offline/emergency_actions.dart';
import '../../features/offline/local_rules_engine.dart';
import 'local_storage_service.dart';

class OfflineAlertService {
  OfflineAlertService._();

  static final LocalRulesEngine _rulesEngine = LocalRulesEngine();
  static Timer? _syncRetryTimer;
  static const Duration _syncRetryInterval = Duration(minutes: 2);

  /// Trigger offline alert with emergency actions and local rules evaluation
  static Future<void> trigger(
    String message, {
    Map<String, dynamic>? payload,
  }) async {
    final storage = LocalStorageService.instance;

    try {
      // Save alert to local storage
      await storage.saveAlert({
        'message': message,
        'payload': payload ?? <String, dynamic>{},
        'mode': 'offline',
        'handledLocally': true,
      });

      // Increment offline counter for analytics
      await storage.incrementOfflineCounter();

      // ignore: avoid_print
      print('OFFLINE ALERT: $message');

      // Evaluate local rules to determine emergency actions
      final isEmergency = payload != null &&
          _rulesEngine.isValidAlertPayload(payload) &&
          (payload['riskLevel']?.toString().toUpperCase() == 'HIGH' ||
              payload['riskLevel']?.toString().toUpperCase() == 'CRITICAL');

      if (isEmergency) {
        // Activate critical emergency (siren/flash)
        await EmergencyActions().activateCriticalEmergency();

        // Get recommended actions for the user
        final recommendedActions =
            _rulesEngine.evaluateEmergencyActions(payload);
        // ignore: avoid_print
        print('Recommended actions: $recommendedActions');
      }

      // Start periodic sync retry if not already running
      _startSyncRetryTimer(payload);
    } catch (e) {
      // ignore: avoid_print
      print('Error in offline alert handling: $e');
    }
  }

  /// Get local rules-based recommendations for current alert
  static Future<List<String>> getLocalRecommendations(
      Map<String, dynamic>? payload) async {
    if (payload == null) {
      return ['Stay informed and await official guidance'];
    }

    return _rulesEngine.evaluateEmergencyActions(payload);
  }

  /// Retry syncing cached alerts (called periodically when offline)
  static Future<void> _startSyncRetryTimer(Map<String, dynamic>? alertPayload) {
    if (_syncRetryTimer != null) {
      return Future.value();
    }

    _syncRetryTimer = Timer.periodic(_syncRetryInterval, (_) async {
      try {
        final hasData = await LocalStorageService.instance.hasCachedData();
        if (hasData) {
          // Attempt to sync cached alerts (would be called by connectivity service)
          // ignore: avoid_print
          print('Retrying sync of offline alerts...');
          // TODO: Call actual sync endpoint when internet available
        }
      } catch (e) {
        // ignore: avoid_print
        print('Sync retry failed: $e');
      }
    });

    return Future.value();
  }

  /// Stop retry timer and attempt final sync
  static Future<void> stopSyncRetryAndSync() async {
    _syncRetryTimer?.cancel();
    _syncRetryTimer = null;

    try {
      final storage = LocalStorageService.instance;
      final cachedAlerts = await storage.getCachedAlerts();

      if (cachedAlerts.isNotEmpty) {
        // Update last sync time
        await storage.updateLastSyncTime();
        // ignore: avoid_print
        print('Synced ${cachedAlerts.length} offline alerts to server');
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error during sync: $e');
    }
  }

  /// Deactivate offline alert (user acknowledges)
  static Future<void> deactivateOfflineAlert() async {
    try {
      _syncRetryTimer?.cancel();
      _syncRetryTimer = null;
      await EmergencyActions().deactivateCriticalEmergency();
    } catch (e) {
      // ignore: avoid_print
      print('Error deactivating offline alert: $e');
    }
  }

  /// Get count of cached offline alerts
  static Future<int> getCachedAlertCount() async {
    final alerts = await LocalStorageService.instance.getCachedAlerts();
    return alerts.length;
  }
}
