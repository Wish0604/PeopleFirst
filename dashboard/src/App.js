import React from 'react';

import AlertList from './components/AlertList';
import ResponseList from './components/ResponseList';
import SummaryCards from './components/SummaryCards';
import CoordinationMap from './components/CoordinationMap';
import AlertManager from './features/alerts/AlertManager';
import AlertStatus from './features/alerts/AlertStatus';
import DeliveryLogs from './features/monitoring/DeliveryLogs';
import TaskBoard from './features/monitoring/TaskBoard';
import LogisticsDispatch from './features/monitoring/LogisticsDispatch';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>PeopleFirst Dashboard</h1>
          <p className="muted">Real-time alerts and responses from Firestore</p>
        </div>
      </header>

      <SummaryCards />

      <main className="grid">
        <AlertManager />
        <AlertStatus />
        <CoordinationMap />
        <AlertList />
        <DeliveryLogs />
        <ResponseList />
        <LogisticsDispatch />
        <TaskBoard />
      </main>
    </div>
  );
}