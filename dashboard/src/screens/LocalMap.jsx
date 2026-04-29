import React from 'react';
import CoordinationMap from '../components/CoordinationMap';

export default function LocalMap() {

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CoordinationMap />
    </div>
  );
}
