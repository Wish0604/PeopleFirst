import 'package:flutter/material.dart';

import '../offline/emergency_actions.dart';
import 'alert_listener.dart';

/// Alert state for UI updates
class AlertControllerState {
  final String messageId;
  final String message;
  final String? title;
  final String riskLevel;
  final bool isOffline;
  final DateTime receivedAt;
  final bool isProcessed;
  final String? errorMessage;

  AlertControllerState({
    required this.messageId,
    required this.message,
    this.title,
    required this.riskLevel,
    required this.isOffline,
    required this.receivedAt,
    this.isProcessed = false,
    this.errorMessage,
  });

  AlertControllerState copyWith({
    String? messageId,
    String? message,
    String? title,
    String? riskLevel,
    bool? isOffline,
    DateTime? receivedAt,
    bool? isProcessed,
    String? errorMessage,
  }) {
    return AlertControllerState(
      messageId: messageId ?? this.messageId,
      message: message ?? this.message,
      title: title ?? this.title,
      riskLevel: riskLevel ?? this.riskLevel,
      isOffline: isOffline ?? this.isOffline,
      receivedAt: receivedAt ?? this.receivedAt,
      isProcessed: isProcessed ?? this.isProcessed,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class AlertController {
  AlertController._();

  static final ValueNotifier<AlertControllerState?> _currentAlert =
      ValueNotifier(null);
  static final ValueNotifier<List<AlertControllerState>> _alertHistory =
      ValueNotifier([]);
  static int _alertCounter = 0;

  static ValueNotifier<AlertControllerState?> get currentAlertNotifier =>
      _currentAlert;
  static ValueNotifier<List<AlertControllerState>> get alertHistoryNotifier =>
      _alertHistory;

  /// Process incoming alert with enhanced offline UX
  static Future<void> processIncomingAlert(
    String message, {
    Map<String, dynamic>? payload,
  }) async {
    final messageId =
        'alert_${++_alertCounter}_${DateTime.now().millisecondsSinceEpoch}';
    final riskLevel = (payload?['riskLevel'] as String?) ?? 'MEDIUM';
    final title = payload?['alertTitle'] as String?;

    // Update UI immediately with alert state
    final alertState = AlertControllerState(
      messageId: messageId,
      message: message,
      title: title,
      riskLevel: riskLevel,
      isOffline: false,
      receivedAt: DateTime.now(),
      isProcessed: false,
    );

    _currentAlert.value = alertState;
    _addToHistory(alertState);

    try {
      // Process the alert through the alert listener (emergency actions, storage, etc.)
      await AlertListener.handle(message, payload: payload);

      // Mark as processed
      _currentAlert.value = alertState.copyWith(isProcessed: true);
      _updateInHistory(messageId, alertState.copyWith(isProcessed: true));
    } catch (e) {
      final errorMsg =
          e is Exception ? e.toString() : 'Unknown error processing alert';
      _currentAlert.value = alertState.copyWith(
        errorMessage: errorMsg,
        isOffline: true,
      );
      _updateInHistory(
        messageId,
        alertState.copyWith(
          errorMessage: errorMsg,
          isOffline: true,
        ),
      );
      // ignore: avoid_print
      print('Error processing alert: $errorMsg');
    }
  }

  /// Add alert to history
  static void _addToHistory(AlertControllerState alertState) {
    final currentHistory = _alertHistory.value;
    _alertHistory.value = [alertState, ...currentHistory.take(50)].toList();
  }

  /// Update existing alert in history
  static void _updateInHistory(
      String messageId, AlertControllerState updatedState) {
    final currentHistory = _alertHistory.value;
    final updatedHistory = currentHistory.map((alert) {
      if (alert.messageId == messageId) {
        return updatedState;
      }
      return alert;
    }).toList();
    _alertHistory.value = updatedHistory;
  }

  /// Clear current alert (typically after user dismisses it)
  static void clearCurrentAlert() {
    _currentAlert.value = null;
  }

  /// Get alert history (for showing past alerts in UI)
  static List<AlertControllerState> getAlertHistory() {
    return _alertHistory.value;
  }

  /// Deactivate emergency actions (siren/flash)
  static Future<void> acknowledgeAlert() async {
    try {
      await EmergencyActions().deactivateCriticalEmergency();
    } catch (e) {
      // ignore: avoid_print
      print('Error deactivating emergency actions: $e');
    }
  }
}
