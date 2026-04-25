import React, { useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase';
import { useCollectionSnapshot } from '../../hooks/useCollectionSnapshot';

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending time';
  }

  return timestamp.toDate().toLocaleString();
}

const allPriorities = 'ALL';

export default function TaskBoard() {
  const tasks = useCollectionSnapshot('tasks');
  const [priorityFilter, setPriorityFilter] = useState(allPriorities);
  const [updatingTaskId, setUpdatingTaskId] = useState('');

  const filteredTasks = useMemo(() => {
    if (priorityFilter === allPriorities) {
      return tasks;
    }

    return tasks.filter((task) => (task.priority || '').toUpperCase() === priorityFilter);
  }, [tasks, priorityFilter]);

  const updateTaskStatus = async (taskId, status) => {
    setUpdatingTaskId(taskId);
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdatingTaskId('');
    }
  };

  return (
    <section className="panel">
      <div className="panel-row">
        <h2>Rescue Tasks</h2>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          <option value={allPriorities}>All priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <ul className="list">
        {filteredTasks.map((task) => (
          <li key={task.id} className="list-item">
            <div className="row-inline" style={{ justifyContent: 'space-between' }}>
              <strong>{task.title || 'Rescue task'}</strong>
              <span className={`status-badge ${(task.priority || 'unknown').toLowerCase()}`}>
                {task.priority || 'UNKNOWN'}
              </span>
            </div>
            <div className="muted">Status: {task.status || 'OPEN'}</div>
            <div className="muted">Requester: {task.requesterEmail || task.requesterUserId || 'Unknown'}</div>
            <div className="muted">Zone: {task.sourceZoneName || task.sourceZoneId || 'Unspecified'}</div>
            <div className="muted">Created: {formatTime(task.createdAt)}</div>
            <div className="task-actions">
              <button
                type="button"
                disabled={updatingTaskId === task.id}
                onClick={() => updateTaskStatus(task.id, 'ASSIGNED')}
              >
                Assign
              </button>
              <button
                type="button"
                disabled={updatingTaskId === task.id}
                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
              >
                In Progress
              </button>
              <button
                type="button"
                disabled={updatingTaskId === task.id}
                onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
              >
                Complete
              </button>
            </div>
          </li>
        ))}
        {filteredTasks.length === 0 ? <li className="muted">No rescue tasks yet</li> : null}
      </ul>
    </section>
  );
}
