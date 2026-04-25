class SmsService {
	SmsService._();

	static Future<void> sendFallback(String message) async {
		// ignore: avoid_print
		print('SMS fallback triggered: $message');
		// Integrate platform SMS or gateway fallback here.
	}
}
