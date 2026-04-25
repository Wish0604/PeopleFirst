import 'package:flutter_test/flutter_test.dart';

import 'package:peoplefirst_mobile/main.dart';

void main() {
  testWidgets('App shell renders', (WidgetTester tester) async {
    await tester.pumpWidget(const PeopleFirstApp());

    expect(find.text('PeopleFirst Login'), findsOneWidget);
  });
}
