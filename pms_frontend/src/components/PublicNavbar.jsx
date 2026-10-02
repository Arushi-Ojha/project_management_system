import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between py-6 max-w-[1240px] mx-auto px-6 md:px-10 lg:px-12 w-full">
        {/* Brand Logo: Favicon image + WAYMARK */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <img
            src="/favicon.png"
            alt="WAYMARK"
            className="w-9 h-9 object-contain rounded-lg"
          />
          <span className="text-3xl font-bold tracking-tight text-[#000000]">WAYMARK</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[16px] font-medium text-[#000000]">
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="hover:underline hover:text-[#0284c7] underline-offset-4 cursor-pointer transition-all bg-transparent border-none p-0 text-[#000000] font-medium text-[16px]"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="hover:underline hover:text-[#0284c7] underline-offset-4 cursor-pointer transition-all bg-transparent border-none p-0 text-[#000000] font-medium text-[16px]"
          >
            Terms and Conditions
          </button>

          {/* Contextual Action Button */}
          {isLoginPage ? (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="border border-[#000000] rounded-2xl px-7 py-3 text-[16px] font-medium text-[#000000] hover:bg-[#38bdf8] hover:border-[#38bdf8] transition-all duration-200 shadow-[0_3px_0_0_#000000] hover:shadow-none hover:translate-y-[2px]"
            >
              Home
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login', { state: { mode: 'signup' } })}
              className="border border-[#000000] rounded-2xl px-7 py-3 text-[16px] font-medium text-[#000000] hover:bg-[#38bdf8] hover:border-[#38bdf8] transition-all duration-200 shadow-[0_3px_0_0_#000000] hover:shadow-none hover:translate-y-[2px]"
            >
              Get started
            </button>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-[#000000] cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-[1240px] mx-auto px-6 mb-6">
          <div className="border-2 border-[#000000] rounded-2xl p-6 bg-white flex flex-col gap-4 text-center shadow-[0_5px_0_0_#000000]">
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setShowPrivacyModal(true); }}
              className="text-lg font-medium py-2 hover:bg-[#e0f2fe] rounded-xl text-[#000000]"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setShowTermsModal(true); }}
              className="text-lg font-medium py-2 hover:bg-[#e0f2fe] rounded-xl text-[#000000]"
            >
              Terms and Conditions
            </button>
            {isLoginPage ? (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
                className="border border-[#000000] rounded-xl py-3.5 text-base font-medium mt-2 bg-[#000000] text-white hover:bg-[#38bdf8] hover:text-[#000000] transition-colors"
              >
                Home
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigate('/login', { state: { mode: 'signup' } }); }}
                className="border border-[#000000] rounded-xl py-3.5 text-base font-medium mt-2 bg-[#000000] text-white hover:bg-[#38bdf8] hover:text-[#000000] transition-colors"
              >
                Get started
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRIVACY POLICY MODAL                                      */}
      {/* ========================================================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-[#000000] rounded-3xl p-8 sm:p-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_10px_0_0_#0284c7]">
            <div className="flex items-center justify-between border-b-2 border-[#000000] pb-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#000000] m-0">WAYMARK Privacy Policy</h2>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-10 h-10 rounded-full border border-[#000000] flex items-center justify-center font-bold text-xl hover:bg-[#38bdf8] hover:text-[#000000] transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4 text-base text-[#000000] leading-relaxed">
              <p>
                <strong>Effective Date:</strong> October 2, 2026
              </p>
              <h3 className="text-xl font-bold text-[#0284c7] pt-2">1. Organization Workspace & Account Data</h3>
              <p>
                WAYMARK collects organization names, administrator emails, project manager profiles, and employee records strictly for providing workspace access, role authorization, and notification delivery.
              </p>

              <h3 className="text-xl font-bold text-[#0284c7] pt-2">2. Strict Role Boundary Isolation</h3>
              <p>
                Our multi-tenant architecture strictly enforces privacy boundaries: Administrator accounts remain completely invisible to employees and general workspace members. Employee rosters, positions, and email addresses are scoped exclusively to your organization.
              </p>

              <h3 className="text-xl font-bold text-[#0284c7] pt-2">3. Terminal Logs & Audit Trails</h3>
              <p>
                All API interactions, HTTP requests, and system events recorded in the live terminal console are saved with timestamps and automatically purged every 24 hours via database TTL expiration indexes.
              </p>

              <h3 className="text-xl font-bold text-[#0284c7] pt-2">4. Code Deliverables & Integrations</h3>
              <p>
                Project deliverables submitted by staff (including PR summaries, GitHub repository URLs, and Dockerfile links) are encrypted in transit and at rest, and accessible solely to authorized Project Managers within your assigned project.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[#bae6fd]/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="bg-[#000000] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#38bdf8] hover:text-[#000000] transition-colors cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TERMS AND CONDITIONS MODAL                                */}
      {/* ========================================================= */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-[#000000] rounded-3xl p-8 sm:p-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_10px_0_0_#0284c7]">
            <div className="flex items-center justify-between border-b-2 border-[#000000] pb-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#000000] m-0">WAYMARK Terms and Conditions</h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-10 h-10 rounded-full border border-[#000000] flex items-center justify-center font-bold text-xl hover:bg-[#38bdf8] hover:text-[#000000] transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4 text-base text-[#000000] leading-relaxed">
              <p>
                <strong>Last Updated:</strong> October 2, 2026
              </p>
              <h3 className="text-xl font-bold text-[#0284c7] pt-2">1. Acceptance of Terms</h3>
              <p>
                By creating a workspace or signing in to WAYMARK, you agree to these Terms and Conditions. WAYMARK provides project management, Kanban pipelines, staffing metrics, and deliverable review tooling for professional teams.
              </p>

              <h3 className="text-xl font-bold text-[#0284c7] pt-2">2. Organization Workspace Administration</h3>
              <p>
                Administrators are responsible for managing member invitations, maintaining basic settings, and ensuring accurate position and contact data during single and bulk Excel onboarding.
              </p>

              <h3 className="text-xl font-bold text-[#0284c7] pt-2">3. Role Responsibilities</h3>
              <p>
                • <strong>Project Managers</strong> serve as default project heads, responsible for defining custom workflows, assigning tasks, and conducting deliverable reviews.<br />
                • <strong>Employees</strong> are responsible for submitting authentic code summaries, repository URLs, and maintaining accurate milestone statuses.
              </p>

              <h3 className="text-xl font-bold text-[#0284c7] pt-2">4. Service Availability & Security</h3>
              <p>
                WAYMARK implements rate limiting, two-factor OTP verification for workspace signups, and automated session expiry to protect your project assets and operational continuity.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[#bae6fd]/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="bg-[#000000] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#38bdf8] hover:text-[#000000] transition-colors cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
