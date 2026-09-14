import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '8px' }}>404</h1>
      <h2 style={{ marginBottom: '24px' }}>Page Not Found</h2>
      <p style={{ marginBottom: '32px' }}>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="primary-button">Return to Dashboard</Link>
    </div>
  );
}
