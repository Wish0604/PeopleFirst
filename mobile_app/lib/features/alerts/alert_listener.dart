import '../../core/services/connectivity_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/services/offline_alert_service.dart';
import '../../core/services/sms_service.dart';
import '../offline/emergency_actions.dart';
import '../offline/local_rules_engine.dart';

class AlertListener {
  AlertListener._();

  static bool _isCriticalAlert(Map<String, dynamic>? payload) {
    final riskLevel = payload?['riskLevel']?.toString().toUpperCase();
    final riskPriority = payload?['riskPriority']?.toString().toUpperCase();
    return riskLevel == 'HIGH' ||
        riskLevel == 'CRITICAL' ||
        riskPriority == 'WARNING' ||
        riskPriority == 'EMERGENCY';
  }

  static bool _isHighPriorityAlert(Map<String, dynamic>? payload) {
    final riskLevel = payload?['riskLevel']?.toString().toUpperCase();
    final riskPriority = payload?['riskPriority']?.toString().toUpperCase();
    return riskLevel == 'HIGH' ||
        riskLevel == 'CRITICAL' ||
        riskLevel == 'MEDIUM' ||
        riskPriority == 'WATCH' ||
        riskPriority == 'WARNING' ||
        riskPriority == 'EMERGENCY';
  }

  /// Handle incoming alert with offline-first approach
  static Future<void> handle(
    String message, {
    Map<String, dynamic>? payload,
  }) async {
    // Always cache the alert for offline availability
    await LocalStorageService.instance.saveAlert({
      'message': message,
      'payload': payload ?? <String, dynamic>{},
      'mode': 'received',
      'timestamp': DateTime.now().toIso8601String(),
    });

    final hasInternet = await ConnectivityService.instance.hasInternet;
    final isCritical = _isCriticalAlert(payload);
    final isHighPriority = _isHighPriorityAlert(payload);

    // Offline-first: evaluate local rules and trigger appropriate response
    if (!hasInternet && isHighPriority) {
      await _handleOfflineAlert(message, payload);
      return;
    }

    // Online: determine best channel for delivery
    if (hasInternet && isCritical) {
      // For critical alerts, use emergency actions immediately
      await EmergencyActions().activateCriticalEmergency();
      // ignore: avoid_print
      print('Critical alert received - Emergency actions activated');
      return;
    }

    // Online but not critical: log and prepare for fallback if needed
    if (hasInternet && !isCritical) {
      // ignore: avoid_print
      print('Alert received over online channel: $message');
      return;
    }

    // Fallback: handle as offline emergency
    if (!hasInternet && isCritical) {
      await _handleOfflineAlert(message, payload);
      return;
    }
  }

  /// Handle alert in offline mode with local rules evaluation
  static Future<void> _handleOfflineAlert(
    String message,
    Map<String, dynamic>? payload,
  ) async {
    try {
      // Trigger offline alert service with emergency handling
      await OfflineAlertService.trigger(message, payload: payload);

      // Try SMS fallback for high-priority alerts
      if (_isHighPriorityAlert(payload)) {
        await SmsService.sendFallback(
          'EMERGENCY: $message - ${DateTime.now().toLocal()}',
        );
      }

      // Evaluate and log local recommendations
      final rulesEngine = LocalRulesEngine();
      if (rulesEngine.isValidAlertPayload(payload)) {
        final recommendations = rulesEngine.evaluateEmergencyActions(payload!);
        // ignore: avoid_print
        print('Local emergency recommendations: $recommendations');
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error handling offline alert: $e');
    }
  }
}
