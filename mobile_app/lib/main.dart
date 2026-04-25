import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/services/notification_service.dart';
import 'firebase_options.dart';
import 'login_screen.dart';
import 'ui/main_navigation_screen.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
	await Firebase.initializeApp(
		options: DefaultFirebaseOptions.currentPlatform,
	);
}

Future<void> main() async {
	WidgetsFlutterBinding.ensureInitialized();
	await Firebase.initializeApp(
		options: DefaultFirebaseOptions.currentPlatform,
	);

	if (!kIsWeb) {
		FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
	}

	try {
		await NotificationService.initialize();
	} catch (error) {
		// ignore: avoid_print
		print('Notification setup failed: $error');
	}

	runApp(const PeopleFirstApp());
}

class PeopleFirstApp extends StatelessWidget {
	const PeopleFirstApp({super.key});

	@override
	Widget build(BuildContext context) {
		return MaterialApp(
			debugShowCheckedModeBanner: false,
			title: 'PeopleFirst',
			theme: ThemeData(
				colorScheme: ColorScheme.fromSeed(
				  seedColor: const Color(0xFFD32F2F),
				  brightness: Brightness.dark,
				),
				scaffoldBackgroundColor: const Color(0xFF131313),
				useMaterial3: true,
				textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
			),
			home: const LoginScreen(),
			routes: {
				MainNavigationScreen.routeName: (_) => const MainNavigationScreen(),
				LoginScreen.routeName: (_) => const LoginScreen(),
			},
		);
	}
}
