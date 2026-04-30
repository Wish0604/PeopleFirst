# Multi-Disaster Detection Smoke Test Guide

## Prerequisites

You need **one** of:

1. **Firebase Emulator** (local testing, no credentials needed)
   - Requires Java 11+
   - Install: `https://firebase.google.com/docs/emulator-suite/install_and_configure`
   - Start: `npx firebase emulators:start --only firestore,functions,auth`

2. **Real Firebase Project** (test against live project)
   - Requires `serviceAccountKey.json` in backend/functions or `GOOGLE_APPLICATION_CREDENTIALS` env var
   - Project must have Functions deployed: `firebase deploy --only functions`

## Test Scenario

The smoke test injects a **compound disaster** (flood + cyclone + evacuation) and verifies:

1. ✓ Three signals from different sources (IMD, SATELLITE, SENSOR) are normalized and aggregated
2. ✓ Zone risk document includes `hazardProbabilities` field with per-hazard scores
3. ✓ Alert is created with correct `riskLevel` (HIGH/CRITICAL) and `hazardProbabilities`
4. ✓ Responses (SAFE and NEED_HELP) are aggregated on the alert
5. ✓ NEED_HELP response triggers rescue task creation

## Setup

### Option A: Firebase Emulator (Recommended for dev)

```powershell
# Terminal 1: Start emulator
Set-Location C:\Projects\PeopleFirst\backend\functions
npx firebase emulators:start --only firestore,functions,auth

# Terminal 2: Wait for "All emulators ready" then run smoke test
$Env:FIRESTORE_EMULATOR_HOST='localhost:8080'
node test_multi_disaster_scenario.js
```

### Option B: Real Firebase Project

```powershell
# Ensure credentials are available
# Option 1: Copy serviceAccountKey.json to backend/functions/
# Option 2: Set environment variable
$Env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\serviceAccountKey.json'

# Then run smoke test
Set-Location C:\Projects\PeopleFirst\backend\functions
node test_multi_disaster_scenario.js
```

## Expected Output

If everything works:

```
═══════════════════════════════════════════════════════════

🧪 MULTI-DISASTER SMOKE TEST

Scenario: Compound flood + cyclone + evacuation in Zone A

📡 STEP 1: Injecting synthetic multi-source signals...

✓ Injected 3 synthetic signals

⏳ Waiting 3 seconds for ingestion pipeline...

🔍 STEP 2: Verifying zone risk document...

✓ Zone document found:
  - riskLevel: HIGH
  - riskPriority: WARNING
  - riskScore: 84

  ✓ Hazard Probabilities:
    - flood: 85.3%
    - cyclone: 79.2%
    - earthquake: 0.0%
    - landslide: 38.5%
    - fire: 4.4%
  
  - externalSources: IMD, SATELLITE, SENSOR
  - externalSourceCount: 3
  - rainfallMm: 108.33
  - windSpeedKph: 70.00
  - floodRisk: true
  - cycloneWarning: true

🚨 STEP 3: Verifying alert creation...

✓ Alert found (ID: abc123xyz):
  - title: High risk conditions detected...
  - riskLevel: HIGH
  - riskPriority: WARNING

  ✓ Alert Hazard Probabilities:
    - flood: 85.3%
    - cyclone: 79.2%
    - earthquake: 0.0%
    - landslide: 38.5%
    - fire: 4.4%

💬 STEP 4: Testing response aggregation...

✓ Created SAFE response: resp_001
✓ Created NEED_HELP response: resp_002

⏳ Waiting 2 seconds for response aggregation...

✓ Alert response aggregation:
  - responseCount: 2
  - safeCount: 1
  - needHelpCount: 1
  - lastResponseStatus: NEED_HELP

📋 STEP 5: Verifying rescue task creation...

✓ Task found (ID: task_001):
  - title: Rescue request for help@test.local
  - status: OPEN
  - priority: HIGH
  - requesterUserId: user_test_002
  - riskLevel: HIGH

═══════════════════════════════════════════════════════════

✅ Smoke test complete!
```

## Troubleshooting

### "Could not spawn java -version"
- Emulator requires Java 11+
- Install from: https://www.oracle.com/java/technologies/downloads/
- Verify: `java -version`
- Add Java to PATH if not found

### "No alerts found"
- Triggers may take a few seconds to execute
- Check Cloud Functions logs in Firebase Console
- Verify ingestion trigger is deployed: `firebase deploy --only functions`

### "hazardProbabilities field not found"
- Functions may not be using the compiled JavaScript
- Rebuild: `npm run build`
- Redeploy: `firebase deploy --only functions`

### "No credentials file found"
- Set env var: `$Env:GOOGLE_APPLICATION_CREDENTIALS='path/to/serviceAccountKey.json'`
- Or copy serviceAccountKey.json to backend/functions directory

## Manual Verification (No Emulator)

If emulator fails, you can manually test via Firestore Console:

1. Open Firebase Console → Firestore Database
2. Create document in `externalSignals/` with:
   ```json
   {
     "source": "API",
     "sourceTimestamp": "2026-04-30T12:00:00Z",
     "zoneId": "zone_manual_test",
     "zoneName": "Manual Test Zone",
     "latitude": 28.5921,
     "longitude": 77.2099,
     "alertType": "FLOOD",
     "rainfallMm": 100,
     "windSpeedKph": 50,
     "floodRisk": true,
     "evacuationRequired": true,
     "confidence": 0.9
   }
   ```
3. Wait 3-5 seconds
4. Check `zones/zone_manual_test` for `hazardProbabilities`
5. Check `alerts/` for new alert document with `hazardProbabilities`

## Next Steps

- **Production Deploy:** `firebase deploy --only functions` from backend/
- **Dashboard Integration:** Update AlertStatus/AlertManager panels to display hazardProbabilities
- **ML Model:** Replace heuristics in `predictHazardProbs()` with trained model
- **Cross-Zone Correlation:** Add `backend/functions/src/modules/risk/crossZoneCorrelator.ts` for system-level event detection
