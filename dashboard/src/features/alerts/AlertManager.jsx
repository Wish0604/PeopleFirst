import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase';

const initialForm = {
  title: 'Emergency Alert',
  message: '',
  riskLevel: 'HIGH',
  type: 'GENERAL',
};

export default function AlertManager() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key) => (event) => {
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
  };

  const createAlert = async (event) => {
    event.preventDefault();
    if (!form.message.trim()) {
      setStatus('Please enter an alert message.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Publishing alert...');

    try {
      await addDoc(collection(db, 'alerts'), {
        title: form.title.trim() || 'Emergency Alert',
        message: form.message.trim(),
        riskLevel: form.riskLevel,
        type: form.type,
        createdAt: serverTimestamp(),
      });

      setForm(initialForm);
      setStatus('Alert published successfully.');
    } catch (error) {
      setStatus(`Failed to publish alert: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h2>Publish Alert</h2>
      <form className="alert-form" onSubmit={createAlert}>
        <label>
          Title
          <input value={form.title} onChange={updateField('title')} maxLength={80} />
        </label>

        <label>
          Message
          <textarea value={form.message} onChange={updateField('message')} rows={4} maxLength={250} />
        </label>

        <label>
          Risk Level
          <select value={form.riskLevel} onChange={updateField('riskLevel')}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>

        <label>
          Type
          <select value={form.type} onChange={updateField('type')}>
            <option value="GENERAL">GENERAL</option>
            <option value="FLOOD">FLOOD</option>
            <option value="CYCLONE">CYCLONE</option>
            <option value="EARTHQUAKE">EARTHQUAKE</option>
            <option value="EVACUATION">EVACUATION</option>
          </select>
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Alert'}
        </button>
      </form>
      {status && <p className="muted">{status}</p>}
    </section>
  );
}
