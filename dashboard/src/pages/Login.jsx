import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getRoleLabel, AUTHORITY_ROLES } from '../constants/authorityRoles';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, role, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && role && AUTHORITY_ROLES.includes(role)) {
      navigate('/', { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setStatus('');

    if (!email.trim()) {
      setError('Enter your email first to reset the password.');
      return;
    }

    try {
      await resetPassword(email.trim());
      setStatus('Password reset email sent.');
    } catch (resetError) {
      setError(resetError.message || 'Unable to send password reset email.');
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <p className="auth-kicker">Authority login</p>
        <h1>PeopleFirst Control System</h1>
        <p className="muted">
          Sign in with a verified Collector, NDRF, or Admin account to manage alerts,
          logistics, and response coordination.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="authority@example.gov"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="auth-actions">
          <button className="auth-link-button" type="button" onClick={handleResetPassword}>
            Forgot Password?
          </button>
        </div>

        {status ? <p className="auth-status auth-status--success">{status}</p> : null}
        {error ? <p className="auth-status auth-status--error">{error}</p> : null}

        <div className="auth-note">
          <span className="muted">Supported authority roles:</span>
          <div className="auth-role-list">
            {AUTHORITY_ROLES.map((authorityRole) => (
              <span key={authorityRole} className="role-pill">
                {getRoleLabel(authorityRole)}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}