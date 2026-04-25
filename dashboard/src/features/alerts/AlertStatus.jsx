import React, { useMemo } from 'react';

import { useCollectionSnapshot } from '../../hooks/useCollectionSnapshot';

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending time';
  }

  return timestamp.toDate().toLocaleString();
}

export default function AlertStatus() {
  const alerts = useCollectionSnapshot('alerts');
  const responses = useCollectionSnapshot('responses');
  const deliveryLogs = useCollectionSnapshot('deliveryLogs');

  const status = useMemo(() => {
    const latestAlert = alerts[0];
    const latestResponse = responses[0];

    const latestDelivery = latestAlert
      ? deliveryLogs.find((log) => log.alertId === latestAlert.id)
      : null;

    const safeCount = responses.filter((entry) => entry.status === 'SAFE').length;
    const needHelpCount = responses.filter((entry) => entry.status === 'NEED_HELP').length;
    const sentCount = deliveryLogs.filter((entry) => entry.status === 'SENT').length;
    const failedCount = deliveryLogs.filter((entry) => entry.status === 'FAILED').length;
    const deliveryRate = alerts.length > 0 ? Math.round((sentCount / alerts.length) * 100) : 0;
    const currentState = !latestAlert
      ? 'No active alerts'
      : latestDelivery?.status === 'FAILED'
        ? 'Delivery issue'
        : latestAlert.riskLevel === 'CRITICAL'
          ? 'Critical response'
          : latestAlert.riskLevel === 'HIGH'
            ? 'High alert'
            : 'Monitoring';

    return {
      latestAlert,
      latestResponse,
      latestDelivery,
      safeCount,
      needHelpCount,
      sentCount,
      failedCount,
      deliveryRate,
      currentState,
    };
  }, [alerts, responses, deliveryLogs]);

  return (
    <section className="panel">
      <h2>Alert Status</h2>

      {!status.latestAlert ? (
        <p className="muted">No alerts have been published yet.</p>
      ) : (
        <>
          <div className="status-banner">
            <div>
              <p className="muted">Current operational state</p>
              <p className="status-title">{status.currentState}</p>
            </div>
            <div className="status-pill-group">
              <span className={`status-badge ${(status.latestDelivery?.status || 'PENDING').toLowerCase()}`}>
                {status.latestDelivery?.status || 'PENDING'}
              </span>
              <span className="status-badge pending">{status.deliveryRate}% delivered</span>
            </div>
          </div>

          <div className="status-block">
            <p className="muted">Latest alert</p>
            <p className="status-title">{status.latestAlert.title || 'Emergency Alert'}</p>
            <p>{status.latestAlert.message || 'No message'}</p>
            <p className="muted">Risk: {status.latestAlert.riskLevel || 'UNKNOWN'}</p>
            <p className="muted">Time: {formatTime(status.latestAlert.createdAt)}</p>
          </div>

          <div className="status-block">
            <p className="muted">Delivery state</p>
            <span className={`status-badge ${(status.latestDelivery?.status || 'PENDING').toLowerCase()}`}>
              {status.latestDelivery?.status || 'PENDING'}
            </span>
            <p className="muted">Channel: {status.latestDelivery?.channel || 'fcm'}</p>
            <p className="muted">Delivered: {status.sentCount} | Failed: {status.failedCount}</p>
          </div>

          <div className="status-block">
            <p className="muted">Citizen response summary</p>
            <p>Safe: {status.safeCount}</p>
            <p>Need Help: {status.needHelpCount}</p>
            <p className="muted">
              Last response: {status.latestResponse?.status || 'NONE'} at {formatTime(status.latestResponse?.createdAt)}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
