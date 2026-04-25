import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../../firebase';

const allStatuses = 'ALL';

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending time';
  }

  return timestamp.toDate().toLocaleString();
}

export default function DeliveryLogs() {
  const [logs, setLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState(allStatuses);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'deliveryLogs'), (snapshot) => {
      const nextLogs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      nextLogs.sort((a, b) => {
        const aMillis = a.createdAt?.toMillis?.() || 0;
        const bMillis = b.createdAt?.toMillis?.() || 0;
        return bMillis - aMillis;
      });
      setLogs(nextLogs);
    });

    return unsubscribe;
  }, []);

  const filteredLogs = useMemo(() => {
    if (statusFilter === allStatuses) {
      return logs;
    }

    return logs.filter((log) => log.status === statusFilter);
  }, [logs, statusFilter]);

  return (
    <section className="panel">
      <div className="panel-row">
        <h2>Delivery Logs</h2>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value={allStatuses}>All</option>
          <option value="SENT">SENT</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      <ul className="list">
        {filteredLogs.map((log) => (
          <li key={log.id} className="list-item">
            <div>Alert: {log.alertId || 'Unknown'}</div>
            <div className="row-inline">
              <span className="muted">Status:</span>
              <span className={`status-badge ${(log.status || 'PENDING').toLowerCase()}`}>
                {log.status || 'PENDING'}
              </span>
            </div>
            <div className="muted">Channel: {log.channel || 'fcm'}</div>
            <div className="muted">Time: {formatTime(log.createdAt)}</div>
            {log.error ? <div className="muted">Error: {log.error}</div> : null}
          </li>
        ))}
        {filteredLogs.length === 0 ? <li className="muted">No delivery logs yet</li> : null}
      </ul>
    </section>
  );
}
