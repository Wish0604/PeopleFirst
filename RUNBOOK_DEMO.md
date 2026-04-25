# PeopleFirst Demo Runbook

## Scope
- Android mobile app (`mobile_app`)
- Web dashboard (`dashboard`)
- Firebase backend functions + Firestore rules (`backend`)
- Closed-loop flow: publish alert -> mobile receives -> user responds -> dashboard updates + delivery logs

## Prerequisites
- Firebase project: `peoplefirst-791ef`
- Android phone connected and authorized for Flutter
- Node.js + npm installed
- Flutter SDK installed
- Firebase CLI installed and authenticated

## Startup Order
1. Start dashboard:
   - `cd C:/Projects/PeopleFirst/dashboard`
   - `npm install` (if needed)
   - `npm start`
2. Start mobile app:
   - `cd C:/Projects/PeopleFirst/mobile_app`
   - `flutter pub get`
   - `flutter run -d RZ8RA0KG7ER`
   - If debug protocol disconnects, use: `flutter run --release -d RZ8RA0KG7ER`
3. Backend deployment (already done once, repeat only if code changed):
   - `cd C:/Projects/PeopleFirst/backend`
   - `firebase deploy --only functions,firestore:rules`

## Demo Script (Primary)
1. Open dashboard and publish alert from **Publish Alert** panel.
2. Confirm alert appears in **Alerts** panel.
3. Confirm delivery entry appears in **Delivery Logs** (`SENT` expected).
4. On mobile, open alert card and tap **Need Help**.
5. Confirm response appears in **Responses** panel with status `NEED_HELP`.

## Demo Script (Fallback if push is flaky)
1. Publish alert from dashboard.
2. Show alert appears in mobile alert list via Firestore stream.
3. Tap **I am Safe** or **Need Help**.
4. Show dashboard response updates in real-time.

## Smoke Checklist
- [ ] Dashboard loads without compile errors
- [ ] Mobile app launches on device
- [ ] Publish Alert creates Firestore alert doc
- [ ] Delivery log appears for alert (`SENT` or `FAILED`)
- [ ] Response action writes to Firestore responses
- [ ] Dashboard response list updates in real-time

## Known Limitations (for evaluator transparency)
- Push notification delivery can be impacted by device Play Services state; fallback real-time stream is available.
- Backend advanced orchestration modules in `backend/functions/src/**` are placeholders; active logic is in `backend/functions/index.js`.
- Offline siren/flash and advanced logistics/AI modules are not part of this demo slice.

## Recovery Commands
- If dashboard command was wrong: use `npm start` (not `npm run dev`).
- If Flutter run says no pubspec: run from `mobile_app` directory.
- Check devices: `flutter devices`.
- Re-run app on phone: `flutter run -d RZ8RA0KG7ER`.
