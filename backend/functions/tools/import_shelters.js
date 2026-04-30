#!/usr/bin/env node

// Import script: loads JSON shelters into Firestore collection `/shelters/{id}`
// Usage:
// 1) With emulator:
//    $Env:FIRESTORE_EMULATOR_HOST='localhost:8080'
//    node tools/import_shelters.js
// 2) With real project (service account):
//    $Env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\serviceAccountKey.json'
//    node tools/import_shelters.js

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const dataPath = path.join(__dirname, '..', 'data', 'pune_shelters.json');
if (!fs.existsSync(dataPath)) {
  console.error('Shelters JSON not found at', dataPath);
  process.exit(1);
}

let credentialsPathCandidate = path.join(__dirname, '..', '..', 'backend', 'serviceAccountKey.json');
if (!fs.existsSync(credentialsPathCandidate)) {
  credentialsPathCandidate = path.join(__dirname, '..', 'serviceAccountKey.json');
}

let app;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || fs.existsSync(credentialsPathCandidate)) {
    const cred = process.env.GOOGLE_APPLICATION_CREDENTIALS || credentialsPathCandidate;
    console.log('Initializing admin SDK with credentials:', cred);
    app = admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.log('No service account found; initializing admin with default credentials (may use emulator).');
    app = admin.initializeApp();
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin:', err.message);
  process.exit(1);
}

const db = admin.firestore();

async function importShelters() {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const shelters = JSON.parse(raw);

  console.log(`Found ${shelters.length} shelters in JSON`);

  for (const s of shelters) {
    if (!s.id) {
      console.warn('Skipping shelter with missing id', s);
      continue;
    }

    const docRef = db.collection('shelters').doc(s.id);
    const payload = {
      name: s.name || null,
      type: s.type || null,
      location: s.lat && s.lng ? new admin.firestore.GeoPoint(Number(s.lat), Number(s.lng)) : null,
      capacity_total: s.capacity_total ?? null,
      capacity_available: s.capacity_available ?? null,
      facilities: s.facilities ?? [],
      risk_level: s.risk_level ?? 'unknown',
      accessibility: s.accessibility ?? 'unknown',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await docRef.set(payload, { merge: true });
      console.log(`✔ Imported ${s.id}`);
    } catch (err) {
      console.error(`Failed to import ${s.id}:`, err.message);
    }
  }

  console.log('Import complete.');
}

importShelters()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
