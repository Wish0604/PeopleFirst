#!/usr/bin/env node

/**
 * Firestore State Verification Script
 * Reads the actual final state from Firestore and displays structured output
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
let app;
let db;

// Try to find and use credentials
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
  console.log('⚠️  No credentials file found. Using Application Default Credentials...\n');
  app = admin.initializeApp();
}

db = admin.firestore();

async function verifyFirestoreState() {
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('🔍 FIRESTORE FINAL STATE VERIFICATION\n');

  try {
    // Verify Alerts collection
    console.log('📋 ALERTS Collection:\n');
    const alertsSnap = await db.collection('alerts').get();
    if (alertsSnap.empty) {
      console.log('  ⓘ No alerts found');
    } else {
      console.log(`  ✓ Found ${alertsSnap.size} alert(s):`);
      alertsSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  Status: ${data.status || 'N/A'}`);
        console.log(`  Type: ${data.type || 'N/A'}`);
        console.log(`  Zone: ${data.zone || 'N/A'}`);
        console.log(`  Created: ${data.createdAt || 'N/A'}`);
        console.log(`  Priority: ${data.priority || 'N/A'}`);
      });
    }

    // Verify Tasks collection
    console.log('\n\n📝 TASKS Collection:\n');
    const tasksSnap = await db.collection('tasks').get();
    if (tasksSnap.empty) {
      console.log('  ⓘ No tasks found');
    } else {
      console.log(`  ✓ Found ${tasksSnap.size} task(s):`);
      tasksSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  Title: ${data.title || 'N/A'}`);
        console.log(`  Status: ${data.status || 'N/A'}`);
        console.log(`  AssignedTo: ${data.assignedTo || 'Unassigned'}`);
        console.log(`  RelatedAlert: ${data.relatedAlert || 'N/A'}`);
      });
    }

    // Verify Responses collection
    console.log('\n\n💬 RESPONSES Collection:\n');
    const responsesSnap = await db.collection('responses').get();
    if (responsesSnap.empty) {
      console.log('  ⓘ No responses found');
    } else {
      console.log(`  ✓ Found ${responsesSnap.size} response(s):`);
      responsesSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  AlertID: ${data.alertId || 'N/A'}`);
        console.log(`  ResponderId: ${data.responderId || 'N/A'}`);
        console.log(`  Action: ${data.action || 'N/A'}`);
        console.log(`  Timestamp: ${data.timestamp || 'N/A'}`);
      });
    }

    // Verify Users collection
    console.log('\n\n👥 USERS Collection:\n');
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
      console.log('  ⓘ No users found');
    } else {
      console.log(`  ✓ Found ${usersSnap.size} user(s):`);
      usersSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  Email: ${data.email || 'N/A'}`);
        console.log(`  Role: ${data.role || 'N/A'}`);
        console.log(`  Zone: ${data.zone || 'N/A'}`);
      });
    }

    // Verify Zones collection
    console.log('\n\n🗺️  ZONES Collection:\n');
    const zonesSnap = await db.collection('zones').get();
    if (zonesSnap.empty) {
      console.log('  ⓘ No zones found');
    } else {
      console.log(`  ✓ Found ${zonesSnap.size} zone(s):`);
      zonesSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  Name: ${data.name || 'N/A'}`);
        console.log(`  RiskLevel: ${data.riskLevel || 'N/A'}`);
        console.log(`  LastUpdated: ${data.lastUpdated || 'N/A'}`);
      });
    }

    // Verify Shelters collection
    console.log('\n\n🏠 SHELTERS Collection:\n');
    const sheltersSnap = await db.collection('shelters').get();
    if (sheltersSnap.empty) {
      console.log('  ⓘ No shelters found');
    } else {
      console.log(`  ✓ Found ${sheltersSnap.size} shelter(s):`);
      sheltersSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  Name: ${data.name || 'N/A'}`);
        console.log(`  Capacity: ${data.capacity || 'N/A'}`);
        console.log(`  Zone: ${data.zone || 'N/A'}`);
      });
    }

    console.log('\n\n═══════════════════════════════════════════════════════════\n');
    console.log('✅ Firestore state verification complete!\n');

  } catch (error) {
    console.error('\n❌ Error verifying Firestore state:');
    console.error(error.message);
    console.error('\n📌 To verify Firestore state, you need to:');
    console.error('   1. Run: firebase auth:import credentials or firebase login');
    console.error('   2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('   3. Or use: firebase emulators:start to run local Firestore\n');
    process.exit(1);
  } finally {
    if (app) await app.delete();
  }
}

verifyFirestoreState();
