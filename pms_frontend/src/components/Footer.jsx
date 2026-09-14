import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '3px solid var(--color-gray)',
      padding: '24px',
      marginTop: '64px',
      display: 'flex',
      justifyContent: 'center',
      gap: '32px',
      backgroundColor: '#ffffff',
      fontSize: '0.9rem'
    }}>
      <Link to="/privacy" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Privacy Policy</Link>
      <Link to="/terms" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Terms & Conditions</Link>
    </footer>
  );
}
