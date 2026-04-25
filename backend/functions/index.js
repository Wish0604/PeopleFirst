const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.sendAlert = onDocumentCreated("alerts/{alertId}", async (event) => {
  const alertId = event.params.alertId;
  const alert = event.data ? event.data.data() : {};
  const message = typeof alert.message === "string" ? alert.message : "Emergency alert";
  const title = typeof alert.title === "string" ? alert.title : "Emergency Alert";

  try {
    const fcmMessageId = await admin.messaging().send({
      topic: "all_users",
      notification: {
        title,
        body: message,
      },
      data: {
        alertId,
        riskLevel: String(alert.riskLevel || "UNKNOWN"),
        type: String(alert.type || "GENERAL"),
      },
    });

    await db.collection("deliveryLogs").add({
      alertId,
      channel: "fcm",
      status: "SENT",
      message,
      fcmMessageId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Alert sent", { alertId, fcmMessageId });
  } catch (error) {
    await db.collection("deliveryLogs").add({
      alertId,
      channel: "fcm",
      status: "FAILED",
      message,
      error: error instanceof Error ? error.message : String(error),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.error("Alert delivery failed", { alertId, error });
  }
});