import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending time';
  }

  return timestamp.toDate().toLocaleString();
}

function getPriorityBadgeClass(priority) {
  const normalized = (priority || 'ROUTINE').toLowerCase();
  return `status-badge ${normalized}`;
}

function getIntelligenceBand(scoreValue) {
  const score = Number(scoreValue);
  if (!Number.isFinite(score)) {
    return { label: 'INTEL N/A', className: 'status-badge unknown' };
  }

  if (score >= 85) {
    return { label: 'INTEL CRITICAL', className: 'status-badge critical' };
  }

  if (score >= 65) {
    return { label: 'INTEL HIGH', className: 'status-badge high' };
  }

  if (score >= 35) {
    return { label: 'INTEL MEDIUM', className: 'status-badge medium' };
  }

  return { label: 'INTEL LOW', className: 'status-badge low' };
}

export default function AlertList() {
  const [alerts, setAlerts] = useState([]);
  const [deliveryByAlert, setDeliveryByAlert] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortMode, setSortMode] = useState('NEWEST');

  const filteredSortedAlerts = useMemo(() => {
    const priorityWeight = {
      ROUTINE: 1,
      WATCH: 2,
      WARNING: 3,
      EMERGENCY: 4,
    };

    const getPriority = (alert) => (alert.riskPriority || 'ROUTINE').toUpperCase();
    const getCreatedAtMillis = (alert) => alert.createdAt?.toMillis?.() || 0;
    const getIntelligenceScore = (alert) => {
      const value = Number(alert.riskIntelligenceScore ?? alert.riskScore);
      return Number.isFinite(value) ? value : -1;
    };

    const nextAlerts = alerts.filter((alert) => {
      if (priorityFilter === 'ALL') {
        return true;
      }

      return getPriority(alert) === priorityFilter;
    });

    nextAlerts.sort((a, b) => {
      if (sortMode === 'PRIORITY') {
        return (
          (priorityWeight[getPriority(b)] || 0) - (priorityWeight[getPriority(a)] || 0) ||
          getCreatedAtMillis(b) - getCreatedAtMillis(a)
        );
      }

      if (sortMode === 'INTELLIGENCE') {
        return (
          getIntelligenceScore(b) - getIntelligenceScore(a) ||
          getCreatedAtMillis(b) - getCreatedAtMillis(a)
        );
      }

      return getCreatedAtMillis(b) - getCreatedAtMillis(a);
    });

    return nextAlerts;
  }, [alerts, priorityFilter, sortMode]);

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
      <div className="panel-row" style={{ marginBottom: 12 }}>
        <h2>Alerts</h2>
        <div className="row-inline" style={{ gap: 8 }}>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="ALL">All priorities</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="WARNING">Warning</option>
            <option value="WATCH">Watch</option>
            <option value="ROUTINE">Routine</option>
          </select>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="NEWEST">Sort: Newest</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="INTELLIGENCE">Sort: Intelligence</option>
          </select>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Showing {filteredSortedAlerts.length} of {alerts.length} alerts
      </p>
      <ul className="list">
        {filteredSortedAlerts.map((alert) => (
          <li key={alert.id} className="list-item">
            <div>{alert.message || 'Alert'}</div>
            <div className="muted">Risk level: {alert.riskLevel || 'UNKNOWN'}</div>
            <div className="row-inline">
              <span className="muted">Priority:</span>
              <span className={getPriorityBadgeClass(alert.riskPriority)}>
                {(alert.riskPriority || 'ROUTINE').toUpperCase()}
              </span>
            </div>
            <div className="muted">
              Intelligence score: {alert.riskIntelligenceScore ?? alert.riskScore ?? 'N/A'}
            </div>
            <div className="row-inline">
              <span className={getIntelligenceBand(alert.riskIntelligenceScore ?? alert.riskScore).className}>
                {getIntelligenceBand(alert.riskIntelligenceScore ?? alert.riskScore).label}
              </span>
            </div>
            <div className="muted">Zone: {alert.sourceZoneName || alert.sourceZoneId || 'Unspecified'}</div>
            <div className="muted">
              Intelligence reason: {alert.riskIntelligenceReason || alert.riskReason || 'N/A'}
            </div>
            <div className="muted">Created: {formatTime(alert.createdAt)}</div>
            <div className="row-inline">
              <span className="muted">Delivery:</span>
              <span className={`status-badge ${(deliveryByAlert[alert.id]?.status || 'PENDING').toLowerCase()}`}>
                {deliveryByAlert[alert.id]?.status || 'PENDING'}
              </span>
            </div>
          </li>
        ))}
        {filteredSortedAlerts.length === 0 && <li className="muted">No alerts available for current filter</li>}
      </ul>
    </section>
  );
}