import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const seoPhrases = [
    "Initializing Open Source Jira Alternative sequence. Loading FastAPI Project Management Backend modules. Establishing secure connection to MongoDB Kanban Board Template...",
    "Executing Role-Based Access Control (RBAC) API verification. Compiling Agile Issue Tracking algorithms. Deploying Sprint Management subroutines to main server cluster...",
    "Booting Enterprise-grade SaaS Execution Engine. Synchronizing dynamic issue identifiers with organization-wide OKR tracking metrics. System optimization complete..."
  ];

  useEffect(() => {
    let timeout;
    const currentPhrase = seoPhrases[phraseIndex];

    if (isTyping) {
      if (displayText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 30); // Typing speed
      } else {
        timeout = setTimeout(() => setIsTyping(false), 3000); // Wait before untyping
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 15); // Untyping speed
      } else {
        setIsTyping(true);
        setPhraseIndex((prev) => (prev + 1) % seoPhrases.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, phraseIndex]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      fontFamily: '"Times New Roman", Times, serif',
      backgroundColor: '#ffffff',
      color: '#000000',
      minHeight: '100vh',
      lineHeight: '1.4'
    }}>

      {/* Navigation & Top Banner */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '24px 48px',
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        fontSize: '1.1rem',
        borderBottom: '2px solid #3F3F44',
        backgroundColor: scrolled ? 'rgba(204, 234, 187, 0.9)' : '#CCEABB',
        transition: 'background-color 0.3s ease',
        flexWrap: 'wrap'
      }}>
        <a href="#" style={{ textDecoration: 'none', color: '#000', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/orange.png" alt="Favicon" style={{ width: '24px', height: '24px' }} />
          Home
        </a>
        <a href="#features" style={{ textDecoration: 'none', color: '#000' }}>Features</a>
        <a href="#access" style={{ textDecoration: 'none', color: '#000' }}>Access</a>
        <a href="#automations" style={{ textDecoration: 'none', color: '#000' }}>Automations</a>
      </nav>

      <div style={{ backgroundColor: '#FDCB9E', padding: '12px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', borderBottom: '2px solid #3F3F44', flexWrap: 'wrap', gap: '16px' }}>
        <span>Manage your workflow and never get stuck in a loop</span>
        <Link to="/login" style={{ textDecoration: 'underline', color: '#000', fontWeight: 'bold', letterSpacing: '1px' }}>LOGIN</Link>
      </div>

      {/* Header Section */}
      <header style={{ textAlign: 'center', padding: '64px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '1rem', color: '#3F3F44', marginBottom: '24px' }}>Committed to all organisations in need</p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 'normal', margin: '0 0 32px 0', lineHeight: '1.1', letterSpacing: '-1px' }}>
          PROJECT MANAGEMENT SYSTEM:<br />ProMan
        </h1>
        <Link to="/login" style={{ fontSize: '1.1rem', color: '#000', textDecoration: 'underline' }}>Join us</Link>
      </header>

      {/* Hero Image */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <img
          src="/hero_keyboard.jpg"
          alt="Keyboard with plants"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', maxHeight: '70vh' }}
        />
      </div>

      {/* Intro Text */}
      <section style={{ textAlign: 'center', padding: '96px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 'normal', lineHeight: '1.2', margin: 0 }}>
          Accelerate your SaaS development with a scalable, project management backend. Features Domain-Driven Design, JWT auth, and customizable workflows.
        </h2>
      </section>

      {/* Features Grid 1 */}
      <section id="features" style={{ padding: '0 48px 96px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '1rem', color: '#3F3F44', marginBottom: '80px' }}>Agile Issue Tracking API | FastAPI & MongoDB Template</p>

        <div className="responsive-grid-2" style={{ marginBottom: '80px', gap: '80px' }}>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 'normal', marginBottom: '24px' }}>Agile issue tracker</h3>
            <p style={{ fontSize: '1.1rem', color: '#333' }}>FastAPI template, Project Management API, Domain-Driven Design, Python backend framework, MongoDB PMS</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 'normal', marginBottom: '24px' }}>Kanban API</h3>
            <p style={{ fontSize: '1.1rem', color: '#333' }}>FastAPI MongoDB project, Async Python API, Pydantic validation, Schemaless backend, Motor async API</p>
          </div>
        </div>

        <div className="responsive-grid-2" style={{ gap: '80px' }}>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 'normal', marginBottom: '24px' }}>Sprint management<br />backend</h3>
            <p style={{ fontSize: '1.1rem', color: '#333' }}>API webhooks, Workflow automation backend, Audit logging system, Developer-first PMS, Extensible API</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 'normal', marginBottom: '24px' }}>Issue tracking engine</h3>
            <p style={{ fontSize: '1.1rem', color: '#333' }}>Linear clone API, Dynamic issue identifiers, OKR tracking API, Modern PMS backend</p>
          </div>
        </div>
      </section>

      {/* Motherboard Image - Rotated and filled to remove blank space */}
      <div style={{ padding: '0 48px', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '280px', position: 'relative', overflow: 'hidden', border: '2px solid #3F3F44', borderRadius: '16px' }}>
          <img
            src="/motherboard_flowers.jpeg"
            alt="Motherboard with purple flowers"
            style={{ position: 'absolute', top: '50%', left: '50%', width: '280px', height: '100vw', objectFit: 'cover', transform: 'translate(-50%, -50%) rotate(90deg)' }}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '32px', textAlign: 'left' }}>
            <p style={{
              color: 'rgba(0, 255, 0, 0.7)',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 'clamp(1rem, 2vw, 1.3rem)',
              fontWeight: 'normal',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              lineHeight: '1.6',
              maxWidth: '800px',
              textShadow: '0 0 4px rgba(0, 255, 0, 0.5)'
            }}>
              {displayText}<span className="typing-cursor">|</span>
            </p>
          </div>
        </div>
      </div>

      <section id="access" style={{ textAlign: 'center', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 'normal', margin: 0 }}>OTP & Role-Based Access</h2>
      </section>

      {/* 2-Column Cards Section */}
      <section style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Top Row Cards */}
        <div className="responsive-grid-2">
          <div style={{ border: '2px solid #3F3F44', padding: '24px', backgroundColor: '#FDCB9E' }}>
            <img src="/crystal_leaf.jpeg" alt="Crystal leaf" style={{ width: '100%', height: 'auto', display: 'block', border: '2px solid #3F3F44' }} />
          </div>
          <div style={{ border: '2px solid #3F3F44', padding: '48px 24px', backgroundColor: '#CCEABB', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#3F3F44', marginBottom: '16px' }}>THE CHANGE</p>
            <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'normal', margin: '0 0 24px 0', lineHeight: '1.3' }}>Build Your Own Jira Alternative |<br />Enterprise API Template</h3>
            <p style={{ fontSize: '1rem', color: '#000' }}>Deploy a robust backend framework for modern agile teams. Features dynamic issue identifiers (e.g., ENG-142), custom fields, and organization-wide OKR tracking.</p>
          </div>
        </div>

        {/* Bottom Row Cards */}
        <div className="responsive-grid-2">
          <div style={{ border: '2px solid #3F3F44', padding: '48px 24px', backgroundColor: '#CCEABB', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#3F3F44', marginBottom: '16px' }}>IAM architecture, RBAC API, Tenant isolation</p>
            <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'normal', margin: '0 0 32px 0' }}>Collaboration software API</h3>
            <img src="/dna_water.jpeg" alt="Water DNA" style={{ width: '100%', maxWidth: '400px', height: 'auto', display: 'block', border: '2px solid #3F3F44' }} />
          </div>
          <div style={{ border: '2px solid #3F3F44', padding: '48px 24px', backgroundColor: '#FDCB9E', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#3F3F44', marginBottom: '32px' }}>DEVELOPER</p>
            <img src="/profile_arushi.jpg" alt="Arushi Ojha" style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', marginBottom: '32px', border: '2px solid #3F3F44' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: 'normal', margin: '0 0 8px 0' }}>Ms. Arushi Ojha</h3>
            <p style={{ fontSize: '1rem', color: '#000' }}>Associate Software Developer Intern</p>
          </div>
        </div>
      </section>

      {/* Webhooks Section */}
      <section id="automations" style={{ padding: '96px 24px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#CCEABB', borderTop: '2px solid #3F3F44', borderBottom: '2px solid #3F3F44', marginTop: '64px' }}>
        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 'normal', margin: '0 0 16px 0' }}>Webhooks & Automations</h2>
        <p style={{ fontSize: '1rem', color: '#3F3F44', marginBottom: '80px' }}>High-Performance Async Project Management Backend</p>

        <div className="responsive-grid-2" style={{ gap: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', borderLeft: '2px solid #3F3F44', paddingLeft: '24px' }}>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>Async API framework</div>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>Scalable project management</div>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>Enterprise execution engine</div>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>Agile process engine</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', borderLeft: '2px solid #3F3F44', paddingLeft: '24px' }}>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>High-performance backend</div>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>High-throughput API</div>
          </div>
        </div>
      </section>

      {/* Footer Hero with Terms & Privacy */}
      <div style={{ position: 'relative', width: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#fff', overflow: 'hidden', padding: '64px 24px' }}>
        <img
          src="/footer_recaord.jpeg"
          alt="Record with leaves"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2 }}></div>

        <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 'normal', margin: '0', lineHeight: '1.1' }}>
            Power your next productivity<br />tool.
          </h2>
          <Link to="/login" style={{ fontSize: '2.5rem', color: '#fff', textDecoration: 'underline', marginBottom: '48px' }}>Join us</Link>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '32px', width: '100%' }}>
            <Link to="/terms" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', letterSpacing: '1px' }}>Terms & Conditions</Link>
            <Link to="/privacy" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', letterSpacing: '1px' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
