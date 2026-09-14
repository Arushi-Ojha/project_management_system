import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="container" style={{ marginTop: '40px', maxWidth: '800px' }}>
      <h1>Privacy Policy</h1>
      <p style={{ marginBottom: '24px' }}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h3>1. Information We Collect</h3>
      <p style={{ marginBottom: '16px' }}>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
      
      <h3>2. Use of Information</h3>
      <p style={{ marginBottom: '16px' }}>We may use the information we collect from you to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support, and send product updates.</p>
      
      <h3>3. Sharing of Information</h3>
      <p style={{ marginBottom: '16px' }}>We will not share your personal information with third parties except as described in this policy, such as with vendors, consultants, marketing partners, and other service providers who need access to such information to carry out work on our behalf.</p>
      
      <div style={{ marginTop: '40px' }}>
        <Link to="/" className="glass-button">Back to Home</Link>
      </div>
    </div>
  );
}
