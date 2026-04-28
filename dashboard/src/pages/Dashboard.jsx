import React from 'react';

import AlertList from '../components/AlertList';
import CoordinationMap from '../components/CoordinationMap';
import ResponseList from '../components/ResponseList';
import SummaryCards from '../components/SummaryCards';
import AlertManager from '../features/alerts/AlertManager';
import AlertStatus from '../features/alerts/AlertStatus';
import DeliveryLogs from '../features/monitoring/DeliveryLogs';
import LogisticsDispatch from '../features/monitoring/LogisticsDispatch';
import TaskBoard from '../features/monitoring/TaskBoard';
import VolunteerManagement from '../features/monitoring/VolunteerManagement';
import { getRoleLabel } from '../constants/authorityRoles';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { profile, user, signOut } = useAuth();
  const roleLabel = getRoleLabel(profile?.role);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="auth-kicker">Authority dashboard</p>
          <h1>PeopleFirst Control System</h1>
          <p className="muted">Real-time alerts, responses, and logistics from Firestore</p>
        </div>

        <div className="dashboard-identity">
          <div className="dashboard-identity-copy">
            <span className="role-pill">{roleLabel}</span>
            <p className="muted">{profile?.email || user?.email || 'Signed in authority'}</p>
          </div>
          <button className="auth-link-button" type="button" onClick={signOut}>
            Sign out
          </button>
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
        <VolunteerManagement />
        <LogisticsDispatch />
        <TaskBoard />
      </main>
    </div>
  );
}