const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'peoplefirst-791ef';
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyBAc6KkJ9de1KHjn4BFOFBQh_Mj0A6AFUY';
const AUTH_EMAIL = process.env.FIREBASE_AUTH_EMAIL || 'abc1@gmail.com';
const AUTH_PASSWORD = process.env.FIREBASE_AUTH_PASSWORD || '123456';
const COLLECTION_PREFIX = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function decodeTimestamp(value) {
  if (!value || typeof value !== 'object') return 0;
  if (value.timestampValue) return Date.parse(value.timestampValue) || 0;
  if (value.stringValue) return Date.parse(value.stringValue) || 0;
  return 0;
}

function toFirestoreFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return fields;
}

function fromFirestoreDocument(doc) {
  const data = {};
  for (const [key, value] of Object.entries(doc.fields || {})) {
    if (value.timestampValue) data[key] = value.timestampValue;
    else if (value.stringValue !== undefined) data[key] = value.stringValue;
    else if (value.booleanValue !== undefined) data[key] = value.booleanValue;
    else if (value.doubleValue !== undefined) data[key] = value.doubleValue;
    else if (value.integerValue !== undefined) data[key] = Number(value.integerValue);
    else if (value.mapValue?.fields) data[key] = fromFirestoreFields(value.mapValue.fields);
  }

  return {
    id: doc.name ? doc.name.split('/').pop() : undefined,
    ...data,
  };
}

function fromFirestoreFields(fields) {
  const data = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value.timestampValue) data[key] = value.timestampValue;
    else if (value.stringValue !== undefined) data[key] = value.stringValue;
    else if (value.booleanValue !== undefined) data[key] = value.booleanValue;
    else if (value.doubleValue !== undefined) data[key] = value.doubleValue;
    else if (value.integerValue !== undefined) data[key] = Number(value.integerValue);
    else if (value.mapValue?.fields) data[key] = fromFirestoreFields(value.mapValue.fields);
  }
  return data;
}

async function signIn() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
      returnSecureToken: true,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Auth failed: ${JSON.stringify(payload)}`);
  }

  return payload.idToken;
}

async function listCollection(token, collectionId) {
  const response = await fetch(`${COLLECTION_PREFIX}/${collectionId}?pageSize=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to read ${collectionId}: ${JSON.stringify(payload)}`);
  }

  return (payload.documents || []).map(fromFirestoreDocument);
}

async function createDocument(token, collectionId, data) {
  const response = await fetch(`${COLLECTION_PREFIX}/${collectionId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to create ${collectionId}: ${JSON.stringify(payload)}`);
  }

  return fromFirestoreDocument(payload);
}

async function updateDocument(token, collectionId, documentId, data) {
  const updateMask = Object.keys(data).map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join('&');
  const response = await fetch(`${COLLECTION_PREFIX}/${collectionId}/${documentId}?${updateMask}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to update ${collectionId}/${documentId}: ${JSON.stringify(payload)}`);
  }

  return fromFirestoreDocument(payload);
}

async function main() {
  try {
    const token = await signIn();

    const alerts = await listCollection(token, 'alerts');
    if (!alerts.length) {
      console.log('No alerts found');
      return;
    }

    const targetAlert = alerts.sort((left, right) => decodeTimestamp(right.createdAt) - decodeTimestamp(left.createdAt))[0];
    console.log('Target alert:', targetAlert.id);

    const resendLog = await createDocument(token, 'deliveryLogs', {
      alertId: targetAlert.id,
      channel: 'MANUAL_RESEND',
      status: 'RETRY',
      createdAt: new Date(),
      createdBy: 'script-trigger',
    });
    console.log('Created deliveryLogs doc:', resendLog.id);

    const resendAudit = await createDocument(token, 'auditLogs', {
      action: 'RESEND',
      alertId: targetAlert.id,
      actor: 'script-trigger',
      outcome: 'REQUESTED',
      createdAt: new Date(),
    });
    console.log('Audit log created:', resendAudit.id);

    await updateDocument(token, 'alerts', targetAlert.id, {
      riskPriority: 'CRITICAL',
      escalatedAt: new Date(),
      escalatedBy: 'script-trigger',
    });
    console.log('Alert escalated');

    const escalateAudit = await createDocument(token, 'auditLogs', {
      action: 'ESCALATE',
      alertId: targetAlert.id,
      actor: 'script-trigger',
      outcome: 'UPDATED_ALERT',
      createdAt: new Date(),
    });
    console.log('Audit log created:', escalateAudit.id);

    await updateDocument(token, 'alerts', targetAlert.id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: 'script-trigger',
    });
    console.log('Alert cancelled');

    const cancelAudit = await createDocument(token, 'auditLogs', {
      action: 'CANCEL',
      alertId: targetAlert.id,
      actor: 'script-trigger',
      outcome: 'UPDATED_ALERT',
      createdAt: new Date(),
    });
    console.log('Audit log created:', cancelAudit.id);

    console.log('All actions completed');
  } catch (err) {
    console.error('Error running trigger script', err);
    process.exitCode = 1;
  }
}

main();