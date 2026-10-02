import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="font-space min-h-screen bg-white text-[#000000] selection:bg-[#38bdf8] selection:text-[#000000]">
      {/* ========================================================= */}
      {/* 1. PUBLIC NAVIGATION BAR (Shared on Home, Login, Signup)  */}
      {/* ========================================================= */}
      <PublicNavbar />

      <div className="max-w-[1240px] mx-auto px-6 md:px-10 lg:px-12">

        {/* ========================================================= */}
        {/* 2. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-6 pb-16">
          {/* Left Column Text */}
          <div className="flex flex-col items-start max-w-xl">
            <h1 className="text-5xl sm:text-6xl lg:text-[60px] font-medium leading-[1.12] text-[#000000] tracking-tight mb-8">
              Navigating modern<br />project workflows<br />for success
            </h1>
            <p className="text-lg sm:text-xl text-[#0f172a] leading-relaxed font-normal mb-10 max-w-[500px]">
              WAYMARK is an agile, team-centric project management system engineered for high-performance organizations. Orchestrate dynamic Kanban pipelines, balance smart staffing capacity, review code deliverables, and monitor live IST deadline velocity.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                className="bg-[#000000] text-white px-9 py-5 rounded-2xl text-xl font-normal hover:bg-[#38bdf8] hover:text-[#000000] transition-all duration-200 shadow-[0_5px_0_0_#0284c7]"
              >
                Get started free
              </button>
              <button
                type="button"
                onClick={() => navigate('/login', { state: { mode: 'login' } })}
                className="border border-[#000000] text-[#000000] px-8 py-5 rounded-2xl text-xl font-normal hover:bg-[#e0f2fe] transition-all duration-200"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right Column: Earth Image from public folder */}
          <div className="flex justify-center items-center">
            <div className="relative group p-2">
              <img
                src="/earth.jpg"
                alt="Earth - Global Project Management"
                className="w-full max-w-[480px] h-auto rounded-[38px] border-2 border-[#000000] shadow-[0_8px_0_0_#38bdf8] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. INTEGRATIONS & ECOSYSTEM LOGOS BAR (Zero Emojis)       */}
        {/* ========================================================= */}
        <section className="py-10 border-t border-b border-[#bae6fd]/40">
          <div className="flex items-center justify-between gap-8 flex-wrap">
            {/* GitHub */}
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000] flex items-center gap-2">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </span>

            {/* Docker (Clean SVG Icon, No Emoji) */}
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000] flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.98 10.02h2.24v2.24h-2.24zm-2.8 0h2.24v2.24h-2.24zm-2.8 0h2.24v2.24H8.38zm-2.8 0h2.24v2.24H5.58zm5.6-2.8h2.24v2.24h-2.24zm-2.8 0h2.24v2.24H8.38zm5.6 0h2.24v2.24h-2.24zm-2.8-2.8h2.24v2.24h-2.24zM23.9 11.8c-.46-.35-1.5-.54-2.58-.29-.2-.7-.64-1.25-.79-1.42l-.24-.26-.2.3c-.7 1.04-.63 2.23-.27 3.03-.4.23-.88.46-1.44.66-1.12.4-2.9.72-5.06.72H1.42c-.22 0-.41.13-.5.33-.52 1.25-.46 3.96 1.34 6.2 1.63 2.03 4.14 3.07 7.46 3.07 7.02 0 12.08-4.14 13.3-10.42.06-.32.55-2.07.88-1.92z"/>
              </svg>
              Docker
            </span>

            {/* Google Meet */}
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000] flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7] inline-block"></span> Google Meet
            </span>

            {/* Notion */}
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000] flex items-center gap-2">
              <span className="border-2 border-[#000000] rounded-md px-1.5 py-0.5 text-lg font-black">N</span> Notion
            </span>

            {/* Jira */}
            <span className="text-2xl sm:text-3xl font-black tracking-wider text-[#000000] uppercase">
              JIRA
            </span>

            {/* Slack */}
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000] flex items-center gap-1">
              # slack
            </span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. SERVICES / PMS MODULES SECTION (Sky Blue Pills)        */}
        {/* ========================================================= */}
        <section id="services" className="pt-20 pb-16">
          {/* Header Pill & Paragraph */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 mb-14">
            <span className="bg-[#38bdf8] text-[#000000] font-medium text-3xl sm:text-4xl px-4 py-1 rounded-lg select-none">
              Services
            </span>
            <p className="text-base sm:text-lg text-[#0f172a] max-w-xl font-normal leading-relaxed">
              At WAYMARK, we provide an integrated suite of project execution tools engineered to maximize team throughput and keep every deliverable on track.
            </p>
          </div>

          {/* 2x2 Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* CARD 1: Kanban & Workflow pipelines */}
            <div className="bg-[#f0f9ff] border border-[#000000] rounded-[42px] p-10 sm:p-12 shadow-[0_5px_0_0_#0284c7] flex flex-col justify-between min-h-[310px] relative overflow-hidden">
              <div className="flex flex-col items-start gap-1 z-10">
                <span className="bg-[#38bdf8] text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Kanban &
                </span>
                <span className="bg-[#38bdf8] text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Workflow pipelines
                </span>
                <p className="text-sm sm:text-base text-[#0f172a] mt-3 max-w-xs leading-snug">
                  Native drag-and-drop project progression across custom stages with automated IST completion engine.
                </p>
              </div>

              <div className="flex items-end justify-between mt-10 z-10">
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#000000] text-[#38bdf8] flex items-center justify-center text-xl font-bold group-hover:bg-[#38bdf8] group-hover:text-[#000000] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </div>
                  <span className="text-xl font-normal text-[#000000] group-hover:text-[#0284c7] group-hover:underline">
                    Learn more
                  </span>
                </div>
              </div>

              {/* Graphic on right: Magnifying glass & workflow UI */}
              <div className="absolute right-6 bottom-6 sm:bottom-8 w-44 h-40 pointer-events-none flex items-center justify-center">
                <svg width="170" height="150" viewBox="0 0 170 150" fill="none">
                  <line x1="20" y1="80" x2="150" y2="80" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="85" y1="20" x2="85" y2="140" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
                  <rect x="50" y="30" width="70" height="50" rx="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
                  <line x1="60" y1="42" x2="90" y2="42" stroke="#000000" strokeWidth="2" />
                  <line x1="60" y1="52" x2="105" y2="52" stroke="#000000" strokeWidth="1.5" />
                  <circle cx="80" cy="65" r="28" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
                  <line x1="100" y1="85" x2="125" y2="110" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                  <path d="M40 45 L42 50 L47 52 L42 54 L40 59 L38 54 L33 52 L38 50 Z" fill="#000000" />
                  <circle cx="125" cy="40" r="3" fill="#38bdf8" stroke="#000000" />
                </svg>
              </div>
            </div>

            {/* CARD 2: Smart staffing & Capacity engine */}
            <div className="bg-[#0f172a] border border-[#000000] rounded-[42px] p-10 sm:p-12 shadow-[0_5px_0_0_#38bdf8] flex flex-col justify-between min-h-[310px] relative overflow-hidden text-white">
              <div className="flex flex-col items-start gap-1 z-10">
                <span className="bg-white text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Smart staffing &
                </span>
                <span className="bg-white text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Capacity engine
                </span>
                <p className="text-sm sm:text-base text-[#e0f2fe] mt-3 max-w-xs leading-snug">
                  Proactive workload balancing preventing burnout by tracking active task load and staff availability.
                </p>
              </div>

              <div className="flex items-end justify-between mt-10 z-10">
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-[#000000] flex items-center justify-center text-xl font-bold group-hover:bg-[#38bdf8] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </div>
                  <span className="text-xl font-normal text-white group-hover:text-[#38bdf8] group-hover:underline">
                    Learn more
                  </span>
                </div>
              </div>

              {/* Graphic on right: Browser & smart click */}
              <div className="absolute right-6 bottom-6 sm:bottom-8 w-44 h-40 pointer-events-none flex items-center justify-center">
                <svg width="170" height="150" viewBox="0 0 170 150" fill="none">
                  <rect x="35" y="30" width="100" height="70" rx="8" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="35" y="30" width="100" height="18" rx="8" fill="#0284c7" />
                  <circle cx="45" cy="39" r="2.5" fill="#FFFFFF" />
                  <circle cx="53" cy="39" r="2.5" fill="#FFFFFF" />
                  <circle cx="61" cy="39" r="2.5" fill="#FFFFFF" />
                  <path d="M85 70 L95 90 L88 92 L94 105 L87 108 L81 95 L75 100 Z" fill="#000000" stroke="#000000" strokeWidth="1.5" />
                  <path d="M80 60 L78 54 M86 58 L90 52 M73 68 L67 68" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* CARD 3: Deliverables & Code workstation */}
            <div className="bg-[#0f172a] border border-[#000000] rounded-[42px] p-10 sm:p-12 shadow-[0_5px_0_0_#38bdf8] flex flex-col justify-between min-h-[310px] relative overflow-hidden text-white">
              <div className="flex flex-col items-start gap-1 z-10">
                <span className="bg-white text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Deliverables &
                </span>
                <span className="bg-white text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Code workstation
                </span>
                <p className="text-sm sm:text-base text-[#e0f2fe] mt-3 max-w-xs leading-snug">
                  Integrated engineer portal for submitting PR summaries, GitHub repositories, and Dockerfiles for review.
                </p>
              </div>

              <div className="flex items-end justify-between mt-10 z-10">
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-[#000000] flex items-center justify-center text-xl font-bold group-hover:bg-[#38bdf8] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </div>
                  <span className="text-xl font-normal text-white group-hover:text-[#38bdf8] group-hover:underline">
                    Learn more
                  </span>
                </div>
              </div>

              {/* Graphic on right: Social reaction cards */}
              <div className="absolute right-6 bottom-6 sm:bottom-8 w-44 h-40 pointer-events-none flex items-center justify-center">
                <svg width="170" height="150" viewBox="0 0 170 150" fill="none">
                  <rect x="55" y="45" width="60" height="55" rx="8" fill="#FFFFFF" />
                  <circle cx="75" cy="65" r="3" fill="#000000" />
                  <circle cx="95" cy="65" r="3" fill="#000000" />
                  <path d="M78 77 C82 82 88 82 92 77" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="35" y="30" width="22" height="20" rx="4" fill="#38bdf8" />
                  <path d="M46 43 L42 39 C40 37 43 35 46 38 C49 35 52 37 50 39 Z" fill="#000000" />
                  <rect x="110" y="25" width="22" height="20" rx="4" fill="#38bdf8" />
                  <path d="M121 38 L117 34 C115 32 118 30 121 33 C124 30 127 32 125 34 Z" fill="#000000" />
                  <rect x="55" y="106" width="60" height="12" rx="3" fill="#FFFFFF" />
                  <circle cx="63" cy="112" r="2" fill="#0284c7" />
                  <circle cx="71" cy="112" r="2" fill="#0284c7" />
                  <circle cx="79" cy="112" r="2" fill="#0284c7" />
                </svg>
              </div>
            </div>

            {/* CARD 4: Role governance & Terminal logs */}
            <div className="bg-[#f0f9ff] border border-[#000000] rounded-[42px] p-10 sm:p-12 shadow-[0_5px_0_0_#0284c7] flex flex-col justify-between min-h-[310px] relative overflow-hidden">
              <div className="flex flex-col items-start gap-1 z-10">
                <span className="bg-[#38bdf8] text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Role governance &
                </span>
                <span className="bg-[#38bdf8] text-[#000000] font-medium text-2xl sm:text-3xl px-2.5 py-0.5 rounded-md">
                  Terminal audit logs
                </span>
                <p className="text-sm sm:text-base text-[#0f172a] mt-3 max-w-xs leading-snug">
                  Strict Admin/PM/Staff boundaries with bulk Excel onboarding and 24h auto-purged terminal system logs.
                </p>
              </div>

              <div className="flex items-end justify-between mt-10 z-10">
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#000000] text-[#38bdf8] flex items-center justify-center text-xl font-bold group-hover:bg-[#38bdf8] group-hover:text-[#000000] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </div>
                  <span className="text-xl font-normal text-[#000000] group-hover:text-[#0284c7] group-hover:underline">
                    Learn more
                  </span>
                </div>
              </div>

              {/* Graphic on right: Envelopes stream */}
              <div className="absolute right-6 bottom-6 sm:bottom-8 w-44 h-40 pointer-events-none flex items-center justify-center">
                <svg width="170" height="150" viewBox="0 0 170 150" fill="none">
                  <path d="M40 120 C70 120 120 100 135 45" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
                  <g transform="rotate(-15 65 105)">
                    <rect x="35" y="80" width="55" height="38" rx="4" fill="#000000" stroke="#000000" strokeWidth="2" />
                    <path d="M35 80 L62 100 L90 80" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                  <g transform="rotate(20 125 55)">
                    <rect x="105" y="35" width="45" height="30" rx="3" fill="#38bdf8" stroke="#000000" strokeWidth="2" />
                    <path d="M105 35 L127 50 L150 35" stroke="#000000" strokeWidth="2" />
                  </g>
                </svg>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. CALL TO ACTION BANNER                                  */}
        {/* ========================================================= */}
        <section className="my-16">
          <div className="bg-[#f0f9ff] rounded-[42px] p-10 sm:p-14 lg:p-16 grid grid-cols-1 md:grid-cols-2 items-center gap-10 relative overflow-hidden border border-[#000000] shadow-[0_6px_0_0_#0284c7]">
            {/* Left Content */}
            <div className="flex flex-col items-start z-10">
              <h2 className="text-3xl sm:text-4xl font-medium text-[#000000] mb-5">
                Let's make things happen
              </h2>
              <p className="text-base sm:text-lg text-[#0f172a] leading-relaxed font-normal mb-8 max-w-md">
                Launch your organization workspace with WAYMARK today. Establish custom Kanban pipelines, invite your staff, and achieve unparalleled delivery momentum.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                className="bg-[#000000] text-white px-9 py-5 rounded-2xl text-xl font-normal hover:bg-[#38bdf8] hover:text-[#000000] transition-all duration-200 shadow-[0_4px_0_0_#0284c7]"
              >
                Create your workspace
              </button>
            </div>

            {/* Right Mascot Illustration */}
            <div className="flex justify-center md:justify-end items-center relative">
              <div className="w-64 h-64 relative flex items-center justify-center">
                {/* Orbiting Rings */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240" fill="none">
                  <ellipse cx="120" cy="140" rx="100" ry="38" transform="rotate(-15 120 140)" stroke="#000000" strokeWidth="1.5" />
                  <ellipse cx="120" cy="140" rx="80" ry="28" transform="rotate(-15 120 140)" stroke="#000000" strokeWidth="1.5" />
                </svg>

                {/* Mascot Face */}
                <div className="w-24 h-24 rounded-full bg-[#000000] relative z-10 flex items-center justify-center gap-2 shadow-lg">
                  <div className="w-3 h-6 rounded-full bg-white"></div>
                  <div className="w-3 h-6 rounded-full bg-white"></div>
                </div>

                {/* Floating Sky Blue Star */}
                <div className="absolute bottom-4 right-16 z-20">
                  <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                    <path d="M21 0 L25 16 L42 21 L25 26 L21 42 L17 26 L0 21 L17 16 Z" fill="#38bdf8" />
                  </svg>
                </div>

                {/* Floating Light Sky Blue Star */}
                <div className="absolute top-12 right-6 z-10">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 0 L19 12 L32 16 L19 20 L16 32 L13 20 L0 16 L13 12 Z" fill="#bae6fd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. CASE STUDY SECTION                                     */}
        {/* ========================================================= */}
        <section id="use-cases" className="pt-8 pb-20">
          {/* Header Pill & Paragraph */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 mb-14">
            <span className="bg-[#38bdf8] text-[#000000] font-medium text-3xl sm:text-4xl px-4 py-1 rounded-lg select-none">
              Case study
            </span>
            <p className="text-base sm:text-lg text-[#0f172a] max-w-xl font-normal leading-relaxed">
              Explore Real-World Impact and Measurable Delivery Velocity with WAYMARK Project Management
            </p>
          </div>

          {/* Dark Case Study Container Card */}
          <div className="bg-[#0f172a] rounded-[42px] p-10 sm:p-14 lg:p-16 text-white shadow-xl border border-[#000000]">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#0284c7]/30 gap-10 md:gap-0">

              {/* Column 1 */}
              <div className="md:pr-10 lg:pr-12 pt-6 md:pt-0 flex flex-col justify-between">
                <p className="text-base sm:text-lg text-white leading-relaxed font-normal mb-6">
                  For a distributed cloud infrastructure team, WAYMARK automated pipeline stage handoffs, reducing project cycle times by 38% and eliminating deadline misses.
                </p>
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-2.5 text-[#38bdf8] text-lg font-medium cursor-pointer hover:underline group"
                >
                  <span>Learn more</span>
                  <span className="text-xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="md:px-10 lg:px-12 pt-10 md:pt-0 flex flex-col justify-between">
                <p className="text-base sm:text-lg text-white leading-relaxed font-normal mb-6">
                  For a high-growth SaaS engineering unit, WAYMARK's smart staffing engine balanced workload across 50+ developers with a 99.4% on-time sprint completion rate.
                </p>
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-2.5 text-[#38bdf8] text-lg font-medium cursor-pointer hover:underline group"
                >
                  <span>Learn more</span>
                  <span className="text-xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </span>
                </div>
              </div>

              {/* Column 3 */}
              <div className="md:pl-10 lg:pl-12 pt-10 md:pt-0 flex flex-col justify-between">
                <p className="text-base sm:text-lg text-white leading-relaxed font-normal mb-6">
                  For an enterprise client services group, WAYMARK unified PR deliverables, Docker container submissions, and live Google Meet syncs into one seamless flow.
                </p>
                <div
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="flex items-center gap-2.5 text-[#38bdf8] text-lg font-medium cursor-pointer hover:underline group"
                >
                  <span>Learn more</span>
                  <span className="text-xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FOOTER                                                 */}
        {/* ========================================================= */}
        <footer className="border-t border-[#bae6fd]/50 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="WAYMARK" className="w-6 h-6 object-contain rounded" />
            <span className="font-bold text-[#000000] text-lg">WAYMARK</span>
            <span>© 2026 Project Management System. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[#0f172a]">Next-Gen Agile Delivery</span>
          </div>
        </footer>

      </div>
    </div>
  );
}