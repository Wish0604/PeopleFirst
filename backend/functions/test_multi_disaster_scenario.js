#!/usr/bin/env node

/**
 * Multi-Disaster Smoke Test Scenario
 * Injects synthetic signals representing a compound disaster (flood + cyclone + evacuation)
 * and verifies that:
 * 1. Signals are normalized and aggregated
 * 2. Zone risk document includes hazard probabilities
 * 3. Alert is created with correct riskLevel and hazardProbabilities
 * 4. Response aggregation works and creates tasks on NEED_HELP
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
let app;
let db;

const credPaths = [
  path.join(__dirname, '../../backend/serviceAccountKey.json'),
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(process.env.HOME || process.env.USERPROFILE, '.config/gcloud/application_default_credentials.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
];

let credentials = null;
for (const credPath of credPaths) {
  if (credPath && fs.existsSync(credPath)) {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    console.log(`✓ Found credentials at: ${credPath}\n`);
    break;
  }
}

if (credentials) {
  app = admin.initializeApp({
    credential: admin.credential.cert(credentials)
  });
} else {
  console.log('⚠️  No credentials file found. Using Application Default Credentials or emulator...\n');
  app = admin.initializeApp();
}

db = admin.firestore();

// Check if emulator is running by trying to set the emulator host
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`✓ Using Firestore emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}\n`);
}

async function runSmokeTest() {
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🧪 MULTI-DISASTER SMOKE TEST\n');
  console.log('Scenario: Compound flood + cyclone + evacuation in Zone A\n');

  try {
    // ========== STEP 1: INJECT SYNTHETIC SIGNALS ==========
    console.log('📡 STEP 1: Injecting synthetic multi-source signals...\n');

    const signals = [
      {
        source: 'IMD',
        sourceTimestamp: new Date().toISOString(),
        zoneId: 'zone_A_flood_test',
        zoneName: 'Flood Test Zone A',
        latitude: 28.5921,
        longitude: 77.2099,
        alertType: 'FLOOD',
        rainfallMm: 110,
        windSpeedKph: 45,
        earthquakeMagnitude: 0,
        floodRisk: true,
        cycloneWarning: false,
        evacuationRequired: true,
        confidence: 0.95,
      },
      {
        source: 'SATELLITE',
        sourceTimestamp: new Date().toISOString(),
        zoneId: 'zone_A_flood_test',
        zoneName: 'Flood Test Zone A',
        latitude: 28.5921,
        longitude: 77.2099,
        alertType: 'CYCLONE',
        rainfallMm: 95,
        windSpeedKph: 115,
        earthquakeMagnitude: 0,
        floodRisk: true,
        cycloneWarning: true,
        evacuationRequired: true,
        confidence: 0.92,
      },
      {
        source: 'SENSOR',
        sourceTimestamp: new Date().toISOString(),
        zoneId: 'zone_A_flood_test',
        zoneName: 'Flood Test Zone A',
        latitude: 28.5921,
        longitude: 77.2099,
        alertType: 'FLOOD',
        rainfallMm: 120,
        windSpeedKph: 50,
        earthquakeMagnitude: 0,
        floodRisk: true,
        cycloneWarning: false,
        evacuationRequired: true,
        riskScore: 85,
        confidence: 0.88,
      },
    ];

    // Write signals to externalSignals collection (or trigger ingestion)
    for (const signal of signals) {
      await db.collection('externalSignals').add({
        ...signal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`✓ Injected ${signals.length} synthetic signals\n`);

    // ========== STEP 2: WAIT FOR AGGREGATION & RISK EVALUATION ==========
    console.log('⏳ Waiting 3 seconds for ingestion pipeline...\n');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // ========== STEP 3: VERIFY ZONE RISK DOCUMENT ==========
    console.log('🔍 STEP 2: Verifying zone risk document...\n');

    const zoneDoc = await db.collection('zones').doc('zone_A_flood_test').get();
    if (zoneDoc.exists) {
      const zoneData = zoneDoc.data();
      console.log(`✓ Zone document found:`);
      console.log(`  - riskLevel: ${zoneData.riskLevel || 'N/A'}`);
      console.log(`  - riskPriority: ${zoneData.riskPriority || 'N/A'}`);
      console.log(`  - riskScore: ${zoneData.riskScore || 'N/A'}`);
      console.log(`  - riskIntelligenceScore: ${zoneData.riskIntelligenceScore || 'N/A'}`);

      if (zoneData.hazardProbabilities) {
        console.log(`\n  ✓ Hazard Probabilities:`);
        Object.entries(zoneData.hazardProbabilities).forEach(([hazard, prob]) => {
          console.log(`    - ${hazard}: ${(prob * 100).toFixed(1)}%`);
        });
      } else {
        console.log('  ⚠️  hazardProbabilities field not found');
      }

      console.log(`  - externalSources: ${zoneData.externalSources?.join(', ') || 'N/A'}`);
      console.log(`  - externalSourceCount: ${zoneData.externalSourceCount || 'N/A'}`);
      console.log(`  - rainfallMm: ${zoneData.rainfallMm || 'N/A'}`);
      console.log(`  - windSpeedKph: ${zoneData.windSpeedKph || 'N/A'}`);
      console.log(`  - floodRisk: ${zoneData.floodRisk || 'N/A'}`);
      console.log(`  - cycloneWarning: ${zoneData.cycloneWarning || 'N/A'}`);
    } else {
      console.log('⚠️  Zone document not found. (Ingestion trigger may not have fired yet.)');
    }

    // ========== STEP 4: VERIFY ALERT CREATION ==========
    console.log('\n\n🚨 STEP 3: Verifying alert creation...\n');

    const alertsSnap = await db.collection('alerts')
      .where('sourceZoneId', '==', 'zone_A_flood_test')
      .get();

    if (!alertsSnap.empty) {
      alertsSnap.forEach((alertDoc) => {
        const alertData = alertDoc.data();
        console.log(`✓ Alert found (ID: ${alertDoc.id}):`);
        console.log(`  - title: ${alertData.title || 'N/A'}`);
        console.log(`  - message: ${alertData.message || 'N/A'}`);
        console.log(`  - riskLevel: ${alertData.riskLevel || 'N/A'}`);
        console.log(`  - riskPriority: ${alertData.riskPriority || 'N/A'}`);
        console.log(`  - type: ${alertData.type || 'N/A'}`);

        if (alertData.hazardProbabilities) {
          console.log(`\n  ✓ Alert Hazard Probabilities:`);
          Object.entries(alertData.hazardProbabilities).forEach(([hazard, prob]) => {
            console.log(`    - ${hazard}: ${(prob * 100).toFixed(1)}%`);
          });
        } else {
          console.log('  ⚠️  Alert hazardProbabilities field not found');
        }
      });
    } else {
      console.log('⚠️  No alerts found for this zone. (Alert trigger may not have fired yet.)');
    }

    // ========== STEP 5: TEST RESPONSE AGGREGATION ==========
    console.log('\n\n💬 STEP 4: Testing response aggregation...\n');

    // Get an alert ID if one exists
    const alertSnap = await db.collection('alerts')
      .where('sourceZoneId', '==', 'zone_A_flood_test')
      .limit(1)
      .get();

    if (!alertSnap.empty) {
      const alertId = alertSnap.docs[0].id;
      console.log(`Using alert ID: ${alertId}\n`);

      // Create a SAFE response
      const safeResponseRef = await db.collection('responses').add({
        alertId,
        userId: 'user_test_001',
        email: 'citizen@test.local',
        status: 'SAFE',
        location: { latitude: 28.5921, longitude: 77.2099 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created SAFE response: ${safeResponseRef.id}`);

      // Create a NEED_HELP response
      const helpResponseRef = await db.collection('responses').add({
        alertId,
        userId: 'user_test_002',
        email: 'help@test.local',
        status: 'NEED_HELP',
        location: { latitude: 28.5921, longitude: 77.2099 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created NEED_HELP response: ${helpResponseRef.id}`);

      // Wait for aggregation
      console.log('\n⏳ Waiting 2 seconds for response aggregation...\n');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify response counts on alert
      const updatedAlertDoc = await db.collection('alerts').doc(alertId).get();
      const updatedAlertData = updatedAlertDoc.data();

      if (updatedAlertData) {
        console.log(`✓ Alert response aggregation:`);
        console.log(`  - responseCount: ${updatedAlertData.responseCount || 0}`);
        console.log(`  - safeCount: ${updatedAlertData.safeCount || 0}`);
        console.log(`  - needHelpCount: ${updatedAlertData.needHelpCount || 0}`);
        console.log(`  - lastResponseStatus: ${updatedAlertData.lastResponseStatus || 'N/A'}`);
      }

      // ========== STEP 6: VERIFY TASK CREATION ==========
      console.log('\n\n📋 STEP 5: Verifying rescue task creation...\n');

      const tasksSnap = await db.collection('tasks')
        .where('alertId', '==', alertId)
        .get();

      if (!tasksSnap.empty) {
        tasksSnap.forEach((taskDoc) => {
          const taskData = taskDoc.data();
          console.log(`✓ Task found (ID: ${taskDoc.id}):`);
          console.log(`  - title: ${taskData.title || 'N/A'}`);
          console.log(`  - status: ${taskData.status || 'N/A'}`);
          console.log(`  - priority: ${taskData.priority || 'N/A'}`);
          console.log(`  - requesterUserId: ${taskData.requesterUserId || 'N/A'}`);
          console.log(`  - riskLevel: ${taskData.riskLevel || 'N/A'}`);
        });
      } else {
        console.log('⚠️  No tasks found. (onUserResponse trigger may not have fired yet.)');
      }
    } else {
      console.log('⚠️  No alert found to test responses.');
    }

    console.log('\n\n═══════════════════════════════════════════════════════════\n');
    console.log('✅ Smoke test complete!\n');
    console.log('Summary:');
    console.log('  - Signals injected: ✓');
    console.log('  - Zone risk document: Check for hazardProbabilities field');
    console.log('  - Alert creation: Check for riskLevel and hazardProbabilities');
    console.log('  - Response aggregation: Check counts on alert');
    console.log('  - Task creation: Check for NEED_HELP-triggered rescue tasks\n');

  } catch (error) {
    console.error('\n❌ Smoke test error:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (app) {
      await app.delete();
    }
  }
}

runSmokeTest();