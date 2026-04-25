const admin = require('firebase-admin');

// Initialize Firebase Admin with default credentials
// (Assumes you have run `firebase login` or have GOOGLE_APPLICATION_CREDENTIALS set)
admin.initializeApp();

const db = admin.firestore();

async function createCriticalAlert() {
  try {
    console.log('Adding critical alert to Firestore...');
    const docRef = await db.collection('alerts').add({
      message: 'TEST: Critical Flood Warning in Sector 4! Evacuate immediately.',
      type: 'FLOOD',
      riskLevel: 'CRITICAL',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'TestScript'
    });
    console.log('✅ Critical Alert added with ID:', docRef.id);
    console.log('Check your mobile app to see the Siren and Flashlight trigger!');
  } catch (error) {
    console.error('Error adding alert:', error);
  } finally {
    process.exit(0);
  }
}

createCriticalAlert();
