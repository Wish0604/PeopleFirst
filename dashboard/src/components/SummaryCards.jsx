import React, { useMemo } from 'react';

import { useCollectionSnapshot } from '../hooks/useCollectionSnapshot';

export default function SummaryCards() {
  const alerts = useCollectionSnapshot('alerts');
  const responses = useCollectionSnapshot('responses');
  const deliveryLogs = useCollectionSnapshot('deliveryLogs');

  const metrics = useMemo(() => {
    const sentCount = deliveryLogs.filter((log) => log.status === 'SENT').length;
    const failedCount = deliveryLogs.filter((log) => log.status === 'FAILED').length;
    const safeCount = responses.filter((response) => response.status === 'SAFE').length;
    const needHelpCount = responses.filter((response) => response.status === 'NEED_HELP').length;

    return [
      { label: 'Total Alerts', value: alerts.length },
      { label: 'Delivered', value: sentCount },
      { label: 'Failed', value: failedCount },
      { label: 'Safe', value: safeCount },
      { label: 'Need Help', value: needHelpCount },
    ];
  }, [alerts, responses, deliveryLogs]);

  return (
    <section className="summary-grid" aria-label="Operations summary">
      {metrics.map((metric) => (
        <article key={metric.label} className="summary-card">
          <p className="summary-label">{metric.label}</p>
          <p className="summary-value">{metric.value}</p>
        </article>
      ))}
    </section>
  );
}
