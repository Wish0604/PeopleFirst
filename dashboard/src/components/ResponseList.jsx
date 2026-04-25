import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending time';
  }

  return timestamp.toDate().toLocaleString();
}

export default function ResponseList() {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'responses'), (snapshot) => {
      const mapped = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      mapped.sort((a, b) => {
        const aMillis = a.createdAt?.toMillis?.() || 0;
        const bMillis = b.createdAt?.toMillis?.() || 0;
        return bMillis - aMillis;
      });
      setResponses(mapped);
    });

    return unsubscribe;
  }, []);

  const safeCount = responses.filter((response) => response.status === 'SAFE').length;
  const needHelpCount = responses.filter((response) => response.status === 'NEED_HELP').length;

  return (
    <section className="panel">
      <h2>Responses</h2>
      <p className="muted response-summary">Safe: {safeCount} | Need Help: {needHelpCount}</p>
      <ul className="list">
        {responses.map((response) => (
          <li key={response.id} className="list-item">
            <div>User: {response.userId || response.id}</div>
            <div className="row-inline">
              <span className="muted">Status:</span>
              <span className={`status-badge ${(response.status || 'UNKNOWN').toLowerCase()}`}>
                {response.status || 'UNKNOWN'}
              </span>
            </div>
            <div className="muted">Time: {formatTime(response.createdAt)}</div>
          </li>
        ))}
        {responses.length === 0 && <li className="muted">No responses available</li>}
      </ul>
    </section>
  );
}