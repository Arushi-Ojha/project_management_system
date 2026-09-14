import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="container" style={{ marginTop: '40px', maxWidth: '800px' }}>
      <h1>Terms & Conditions</h1>
      <p style={{ marginBottom: '24px' }}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h3>1. Agreement to Terms</h3>
      <p style={{ marginBottom: '16px' }}>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the service.</p>
      
      <h3>2. Intellectual Property</h3>
      <p style={{ marginBottom: '16px' }}>The Service and its original content, features and functionality are and will remain the exclusive property of our company and its licensors. The Service is protected by copyright, trademark, and other laws.</p>
      
      <h3>3. Termination</h3>
      <p style={{ marginBottom: '16px' }}>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      
      <div style={{ marginTop: '40px' }}>
        <Link to="/" className="glass-button">Back to Home</Link>
      </div>
    </div>
  );
}
