import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
	ConnectivityService._();

	static final ConnectivityService instance = ConnectivityService._();
	final Connectivity _connectivity = Connectivity();

	Future<bool> get hasInternet async {
		final List<ConnectivityResult> result = await _connectivity.checkConnectivity();
		return result.any((entry) => entry != ConnectivityResult.none);
	}
}
