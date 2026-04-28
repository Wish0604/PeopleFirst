import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { AUTHORITY_ROLES, getRoleLabel } from '../constants/authorityRoles';
import { useAuth } from '../context/AuthContext';

function AccessDenied({ role, onSignOut }) {
  return (
    <div className="auth-shell">
      <section className="auth-card auth-card--compact">
        <p className="auth-kicker">Access restricted</p>
        <h1>Authority access required</h1>
        <p className="muted">
          This dashboard is reserved for Collector, NDRF, and Admin accounts.
          {role ? ` Current role: ${getRoleLabel(role)}.` : ''}
        </p>
        <button className="auth-button" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles = AUTHORITY_ROLES, children }) {
  const { user, role, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="auth-shell">
        <section className="auth-card auth-card--compact">
          <p className="auth-kicker">Loading</p>
          <h1>Checking access</h1>
          <p className="muted">Verifying dashboard credentials and role access.</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <AccessDenied role={role} onSignOut={signOut} />;
  }

  return children || <Outlet />;
}