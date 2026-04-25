/// A comprehensive offline rules engine to evaluate disaster severity and suggest actions locally
class LocalRulesEngine {
  static const List<String> _supportedAlertTypes = [
    'FIRE',
    'FLOOD',
    'EARTHQUAKE',
    'TORNADO',
    'HURRICANE',
    'HAZMAT',
    'MEDICAL_EMERGENCY',
    'ACTIVE_THREAT'
  ];

  static const List<String> _supportedRiskLevels = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  ];

  /// Validates alert payload structure
  bool isValidAlertPayload(Map<String, dynamic>? alertPayload) {
    if (alertPayload == null) return false;
    return alertPayload.containsKey('riskLevel') &&
        alertPayload.containsKey('type');
  }

  /// Evaluates an alert payload offline to determine required actions
  List<String> evaluateEmergencyActions(Map<String, dynamic> alertPayload) {
    if (!isValidAlertPayload(alertPayload)) {
      return [
        'Invalid alert payload',
        'Stay calm and await further instructions'
      ];
    }

    List<String> suggestedActions = [];
    final String riskLevel =
        (alertPayload['riskLevel'] as String?)?.toUpperCase() ?? 'UNKNOWN';
    final String alertType =
        (alertPayload['type'] as String?)?.toUpperCase() ?? 'GENERAL';

    // Validate risk level
    if (!_supportedRiskLevels.contains(riskLevel)) {
      return [
        'Unknown alert severity level',
        'Stay calm and await official guidance'
      ];
    }

    // Critical risk response
    if (riskLevel == 'CRITICAL') {
      suggestedActions.addAll(_getCriticalActions(alertType));
    } else if (riskLevel == 'HIGH') {
      suggestedActions.addAll(_getHighRiskActions(alertType));
    } else if (riskLevel == 'MEDIUM') {
      suggestedActions.addAll(_getMediumRiskActions());
    } else if (riskLevel == 'LOW') {
      suggestedActions.addAll(_getLowRiskActions());
    }

    // Add universal emergency action
    if (suggestedActions.isEmpty) {
      suggestedActions.add('Stay calm and wait for official instructions');
    }

    return suggestedActions;
  }

  /// Get critical alert type-specific actions
  List<String> _getCriticalActions(String alertType) {
    final actions = [
      'Prepare for IMMEDIATE evacuation',
      'Gather emergency kit and documents',
      'Monitor this device for updates',
    ];

    switch (alertType) {
      case 'FIRE':
        actions.addAll([
          'Evacuate building immediately',
          'Use stairs, never elevators',
          'Close doors behind you to slow fire spread',
          'Meet at designated assembly point',
        ]);
        break;

      case 'FLOOD':
        actions.addAll([
          'Move to higher ground IMMEDIATELY',
          'Do NOT attempt to cross flooded areas',
          'Await rescue assistance',
        ]);
        break;

      case 'EARTHQUAKE':
        actions.addAll([
          'Drop, Cover, Hold On if still shaking',
          'Do NOT run outside during shaking',
          'Move away from windows and falling objects',
          'Check for injuries when shaking stops',
        ]);
        break;

      case 'TORNADO':
        actions.addAll([
          'Seek shelter in basement or interior room',
          'Stay away from windows',
          'Cover yourself with mattress or blankets if possible',
        ]);
        break;

      case 'HURRICANE':
        actions.addAll([
          'Secure your location immediately',
          'Board windows and secure loose items',
          'Stay indoors away from windows',
        ]);
        break;

      case 'HAZMAT':
        actions.addAll([
          'Evacuate upwind/uphill from hazard',
          'Seal windows and doors if shelter in place',
          'Listen for official instructions',
        ]);
        break;

      case 'ACTIVE_THREAT':
        actions.addAll([
          'Run to safe location away from threat',
          'Hide if escape impossible',
          'Call emergency services when safe',
        ]);
        break;

      default:
        actions.add('Follow all official emergency instructions');
    }

    return actions;
  }

  /// Get high-risk alert type-specific actions
  List<String> _getHighRiskActions(String alertType) {
    final actions = [
      'Prepare for potential evacuation',
      'Gather emergency kit and important documents',
      'Monitor alerts closely',
    ];

    switch (alertType) {
      case 'FIRE':
        actions.addAll([
          'Know evacuation routes',
          'Keep vehicle fueled and ready',
          'Pack go-bag with essentials',
        ]);
        break;

      case 'FLOOD':
        actions.addAll([
          'Identify high ground locations',
          'Move vehicles to higher elevation',
          'Have supplies ready for quick departure',
        ]);
        break;

      case 'EARTHQUAKE':
        actions.addAll([
          'Identify safe spots in each room',
          'Secure heavy furniture to walls',
          'Keep emergency supplies accessible',
        ]);
        break;

      default:
        actions.add('Stay alert and ready to act on official guidance');
    }

    return actions;
  }

  /// Get medium-risk actions
  List<String> _getMediumRiskActions() {
    return [
      'Stay indoors and monitor updates',
      'Check on neighbors and elderly',
      'Prepare emergency supplies',
      'Charge all devices',
      'Have a communication plan ready',
    ];
  }

  /// Get low-risk actions
  List<String> _getLowRiskActions() {
    return [
      'Stay informed about situation',
      'Reduce non-essential activities',
      'Keep emergency contact information ready',
      'Monitor official updates',
    ];
  }
}
