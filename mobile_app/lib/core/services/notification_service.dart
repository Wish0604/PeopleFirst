import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../features/alerts/alert_controller.dart';

class NotificationService {
  NotificationService._();

  static Future<void> initialize() async {
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission();

    if (!kIsWeb) {
      await messaging.subscribeToTopic('all_users');
    }

    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      final body = message.notification?.body ?? 'Emergency alert received';
      await AlertController.processIncomingAlert(
        body,
        payload: {
          ...message.data,
          'alertTitle': message.notification?.title,
          'alertBody': body,
        },
      );
      // ignore: avoid_print
      print('Received alert: $body');
    });

    try {
      final token = await messaging.getToken();
      // ignore: avoid_print
      print('FCM Token: $token');
    } catch (error) {
      // ignore: avoid_print
      print('Unable to fetch FCM token: $error');
    }
  }
}
