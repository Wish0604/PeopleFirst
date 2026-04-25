import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static final LocalStorageService instance = LocalStorageService._();

  LocalStorageService._();

  static const String _alertKey = 'cached_alerts';
  static const String _userStatusKey = 'user_status';
  static const String _lastSyncKey = 'last_sync_time';
  static const String _offlineCounterKey = 'offline_counter';
  static const int _maxCachedAlerts = 50;

  /// Save alert to local cache with timestamp
  Future<void> saveAlert(Map<String, dynamic> alert) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> alerts = prefs.getStringList(_alertKey) ?? [];

      alerts.add(jsonEncode({
        ...alert,
        'cachedAt': DateTime.now().toIso8601String(),
      }));

      // Maintain max cache size by removing oldest
      if (alerts.length > _maxCachedAlerts) {
        alerts = alerts.sublist(alerts.length - _maxCachedAlerts);
      }

      await prefs.setStringList(_alertKey, alerts);
    } catch (e) {
      // ignore: avoid_print
      print('Error saving alert to local storage: $e');
      rethrow;
    }
  }

  /// Retrieve all cached alerts
  Future<List<Map<String, dynamic>>> getCachedAlerts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedAlerts = prefs.getStringList(_alertKey) ?? [];

      return cachedAlerts.map<Map<String, dynamic>>((entry) {
        try {
          final decoded = jsonDecode(entry);
          if (decoded is Map<String, dynamic>) {
            return decoded;
          }
        } catch (e) {
          // ignore: avoid_print
          print('Error decoding cached alert: $e');
        }
        return <String, dynamic>{'message': entry, 'corruptedCache': true};
      }).toList(growable: false);
    } catch (e) {
      // ignore: avoid_print
      print('Error retrieving cached alerts: $e');
      return <Map<String, dynamic>>[];
    }
  }

  /// Save user status (e.g., 'SAFE', 'NEED_HELP', 'OFFLINE')
  Future<void> saveUserStatus(String status) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userStatusKey, status);
    } catch (e) {
      // ignore: avoid_print
      print('Error saving user status: $e');
      rethrow;
    }
  }

  /// Retrieve saved user status
  Future<String?> getUserStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_userStatusKey);
    } catch (e) {
      // ignore: avoid_print
      print('Error retrieving user status: $e');
      return null;
    }
  }

  /// Save last successful sync timestamp
  Future<void> updateLastSyncTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastSyncKey, DateTime.now().toIso8601String());
    } catch (e) {
      // ignore: avoid_print
      print('Error updating last sync time: $e');
    }
  }

  /// Get last sync time to determine if offline cache is stale
  Future<DateTime?> getLastSyncTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final syncTimeStr = prefs.getString(_lastSyncKey);
      if (syncTimeStr != null) {
        return DateTime.parse(syncTimeStr);
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error retrieving last sync time: $e');
    }
    return null;
  }

  /// Increment offline counter (for analytics)
  Future<int> incrementOfflineCounter() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentCount = prefs.getInt(_offlineCounterKey) ?? 0;
      final newCount = currentCount + 1;
      await prefs.setInt(_offlineCounterKey, newCount);
      return newCount;
    } catch (e) {
      // ignore: avoid_print
      print('Error incrementing offline counter: $e');
      return -1;
    }
  }

  /// Get offline counter value
  Future<int> getOfflineCounter() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getInt(_offlineCounterKey) ?? 0;
    } catch (e) {
      // ignore: avoid_print
      print('Error retrieving offline counter: $e');
      return -1;
    }
  }

  /// Check if local cache has any data
  Future<bool> hasCachedData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final alerts = prefs.getStringList(_alertKey) ?? [];
      return alerts.isNotEmpty;
    } catch (e) {
      // ignore: avoid_print
      print('Error checking for cached data: $e');
      return false;
    }
  }

  /// Clear all local data with error handling
  Future<void> clearLocalData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    } catch (e) {
      // ignore: avoid_print
      print('Error clearing local data: $e');
      rethrow;
    }
  }

  /// Clear only cached alerts (keep user status and other preferences)
  Future<void> clearCachedAlerts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_alertKey);
    } catch (e) {
      // ignore: avoid_print
      print('Error clearing cached alerts: $e');
      rethrow;
    }
  }
}
