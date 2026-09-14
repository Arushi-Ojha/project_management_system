import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-color)',
      borderTop: '3px solid var(--color-gray)',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 9999,
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        <p style={{ marginBottom: '4px' }}><strong>We value your privacy.</strong></p>
        <p style={{ fontSize: '0.9rem' }}>
          We use cookies to enhance your browsing experience, serve personalized features, and analyze our traffic. 
          By clicking "Accept All", you consent to our use of cookies. Read our <Link to="/privacy">Privacy Policy</Link> for more details.
        </p>
      </div>
      <div>
        <button onClick={acceptCookies} className="primary-button">Accept All</button>
      </div>
    </div>
  );
}
