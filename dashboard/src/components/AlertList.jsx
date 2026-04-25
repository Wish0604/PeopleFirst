import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending time';
  }

  return timestamp.toDate().toLocaleString();
}

export default function AlertList() {
  const [alerts, setAlerts] = useState([]);
  const [deliveryByAlert, setDeliveryByAlert] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      setAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'deliveryLogs'), (snapshot) => {
      const nextMap = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const alertId = data.alertId;
        if (!alertId) {
          return;
        }

        const previous = nextMap[alertId];
        const previousMillis = previous?.createdAt?.toMillis?.() || 0;
        const currentMillis = data.createdAt?.toMillis?.() || 0;

        if (!previous || currentMillis >= previousMillis) {
          nextMap[alertId] = data;
        }
      });

      setDeliveryByAlert(nextMap);
    });

    return unsubscribe;
  }, []);

  return (
    <section className="panel">
      <h2>Alerts</h2>
      <ul className="list">
        {alerts.map((alert) => (
          <li key={alert.id} className="list-item">
            <div>{alert.message || 'Alert'}</div>
            <div className="muted">Risk level: {alert.riskLevel || 'UNKNOWN'}</div>
            <div className="muted">Created: {formatTime(alert.createdAt)}</div>
            <div className="row-inline">
              <span className="muted">Delivery:</span>
              <span className={`status-badge ${(deliveryByAlert[alert.id]?.status || 'PENDING').toLowerCase()}`}>
                {deliveryByAlert[alert.id]?.status || 'PENDING'}
              </span>
            </div>
          </li>
        ))}
        {alerts.length === 0 && <li className="muted">No alerts available</li>}
      </ul>
    </section>
  );
}