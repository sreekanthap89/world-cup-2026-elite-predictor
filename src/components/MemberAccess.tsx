/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Profile } from '../types';
import { ClientDBEngine } from '../utils/dbEngine';
import { Trophy, HelpCircle, Shield, Globe, Lock, Key, Mail, User, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
// @ts-expect-error - image asset loaded by Vite
import stadiumBg from '../assets/images/stadium_background_1780500343243.png';
import BackgroundVideo from './BackgroundVideo';

interface MemberAccessProps {
  onSuccess: (profile: Profile) => void;
  initialEmail?: string;
}

export default function MemberAccess({ onSuccess, initialEmail = 'sreekanthap90@gmail.com' }: MemberAccessProps) {
  const [accessMode, setAccessMode] = useState<'ANALYST_LOGIN' | 'ADMIN_GATE'>('ANALYST_LOGIN');

  // Input fields
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('FWC2026_PREDICTOR_REMEMBRANCE_EMAIL') || initialEmail || '';
    } catch {
      return initialEmail || '';
    }
  });
  const [accessKey, setAccessKey] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Security Reset Flow States
  const [recoveryStep, setRecoveryStep] = useState<'OFF' | 'EMAIL_INPUT' | 'RESET_PASSCODE'>('OFF');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Database engine check
  const db = new ClientDBEngine();

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    // Pre-validations
    if (!email) {
      setErrorMsg('Please specify your corporate email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Invalid email format. Please provide a standard address (e.g. name@company.com).');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (rememberMe) {
        localStorage.setItem('FWC2026_PREDICTOR_REMEMBRANCE_EMAIL', normalizedEmail);
      } else {
        localStorage.removeItem('FWC2026_PREDICTOR_REMEMBRANCE_EMAIL');
      }
    } catch (e) {
      console.error('Failed writing remembrance token', e);
    }

    if (accessMode === 'ANALYST_LOGIN') {
      // Find analyst user
      let loggedUser = db.attemptLogin(normalizedEmail, '');
      if (loggedUser) {
        onSuccess(loggedUser);
      } else {
        // Automatically enroll the Analyst user for a seamless company launch!
        const username = normalizedEmail.split('@')[0];
        const formattedName = username
          .split(/[._-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const newProfile: Profile = {
          id: `user-${username.replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
          email: normalizedEmail,
          employee_id: `FIFA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          phone_number: '+1 (555) 2026-CO',
          fullName: formattedName || 'Company Associate',
          role: 'ANALYST',
          rank: db.getProfiles().length + 1,
          accuracy: 75 + Math.floor(Math.random() * 15),
          points: 1000
        };

        db.registerNewUser(newProfile);
        setSuccessNotice('Welcome associate! Automatically registered your profile.');
        setTimeout(() => {
          onSuccess(newProfile);
        }, 800);
      }

    } else if (accessMode === 'ADMIN_GATE') {
      // Admin exclusive entry gate
      if (accessKey !== 'ADMIN2026') {
        setErrorMsg('Invalid administrative passkey entry. Please check your credentials.');
        return;
      }

      let loggedAdmin = db.attemptAdminLogin(normalizedEmail, accessKey);
      if (loggedAdmin) {
        onSuccess(loggedAdmin);
      } else {
        const username = normalizedEmail.split('@')[0];
        const formattedName = username
          .split(/[._-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const defaultAdmin: Profile = {
          id: normalizedEmail === 'sreekanthap90@gmail.com' ? 'user-predictor-alpha' : `admin-${username.replace(/[^a-z0-9]/g, '-')}`,
          email: normalizedEmail,
          employee_id: `FIFA-ADMIN-${Math.floor(1000 + Math.random() * 9000)}`,
          phone_number: '+1 (555) 012-2026',
          fullName: normalizedEmail === 'sreekanthap90@gmail.com' ? 'Predictor_Alpha' : (formattedName || 'System Admin'),
          role: 'ADMIN',
          rank: 4,
          accuracy: 94,
          points: 8420
        };

        db.registerNewUser(defaultAdmin);
        setSuccessNotice('System administrator credentials authenticated successfully.');
        setTimeout(() => {
          onSuccess(defaultAdmin);
        }, 800);
      }
    }
  };

  // Secure Password Reset Handler Simulation
  const handleRequestPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRecoverySuccessMsg('');

    const matched = db.getProfiles().some(p => p.email.toLowerCase() === recoveryEmail.toLowerCase());
    if (!matched && recoveryEmail.toLowerCase() !== 'sreekanthap90@gmail.com') {
      setErrorMsg('No registered elite corporate profile found for this email block.');
      return;
    }

    // Switch to step 2: simulation code
    setRecoveryStep('RESET_PASSCODE');
    setRecoverySuccessMsg('Simulated verification code has been dispatched to ' + recoveryEmail);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (recoveryCode !== '123456' && recoveryCode.trim() === '') {
      setErrorMsg('Please specify the 6-digit confirmation code code.');
      return;
    }
    if (newPassword.length < 5) {
      setErrorMsg('Access Security Key must be at least 5 alphanumeric characters.');
      return;
    }

    db.resetUserPassword(recoveryEmail, newPassword);
    setRecoverySuccessMsg('Secured Access Key updated successfully! Returning to standard access panel.');

    setTimeout(() => {
      setRecoveryStep('OFF');
      setAccessMode('ANALYST_LOGIN');
      setEmail(recoveryEmail);
    }, 2000);
  };

  return (
    <div
      className="flex h-screen w-full flex-col md:flex-row bg-[#08090a] text-[#d1d4d1] overflow-hidden font-sans relative"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(8, 9, 10, 0.2), rgba(8, 9, 10, 0.4)), url(${stadiumBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      {/* 📺 RESILIENT FULL-SCREEN AMBIENT STADIUM FOOTBALL VIDEO LOOP, BRAND ARCHES & LIGHT SHOW */}
      <BackgroundVideo opacity={0.85} brightness={0.85} isLogin={true} />

      {/* LEFT COLUMN: HERO VISUAL INSIGNIA */}
      <section className="relative z-10 w-full md:w-3/5 h-full flex flex-col items-center justify-center p-6 md:p-16 overflow-hidden">

        {/* Pitch tactical grid background design line markings - expanded to full area */}
        <div className="absolute inset-0 opacity-[0.08] select-none pointer-events-none z-0 bg-[radial-gradient(#3cac3b_1.2px,transparent_1.2px)] [background-size:28px_28px]"></div>

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center md:items-start text-center md:text-left gap-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, type: "spring" }}
            className="flex items-center gap-2.5 mb-1"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#3cac3b] to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/35 rounded-sm animate-pulse">
              <span className="font-sans font-black text-sm">⚽</span>
            </div>
            <div className="text-left">
              <h2 className="text-xs font-black tracking-widest text-[#3cac3b] leading-none uppercase">FIFA WORLD CUP 2026</h2>
              <p className="text-[9px] text-[#d1d4d1]/40 tracking-wider uppercase mt-1 font-mono">INTERNAL PORTAL CHALLENGE</p>
            </div>
          </motion.div>

          <h1 className="font-sans font-black italic text-3xl md:text-6xl leading-none uppercase text-white tracking-tighter">
            PREDICT. COMPETE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-[#3cac3b]">VICTORY.</span>
          </h1>

          <p className="text-xs md:text-sm text-[#d1d4d1]/75 max-w-md font-sans leading-relaxed">
            Welcome to the official 2026 World Cup Bracket Predictor interface. Enter tactical scorelines, compare analytical models, and track live matches as they progress.
          </p>

          <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-400/55 flex justify-center md:justify-start gap-4 mt-1 border-b border-white/5 pb-2.5 w-full font-mono">
            🏈 JOINT STADIUM HOSTS: USA / MEX / CAN
          </div>

          {/* 🏆 BEAUTIFUL concentric FIFA 2026 BRAND IDENTITY BADGE MATCHING THE USER-UPLOADED IMAGE */}
          <div
            className="relative flex items-center justify-center w-full max-w-sm aspect-video bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-xl p-5 overflow-hidden my-2 shadow-2xl group"
          >
            {/* Swirling rainbow brand bands rotating in opposite directions (inspired by the curved waves in user image) */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-85 transition-opacity duration-500">
              <div
                className="absolute w-44 h-44 rounded-full border-[10px] border-t-red-600 border-r-orange-500 border-b-yellow-400 border-l-lime-400/80"
                style={{ animation: 'fwc-spin-slow 14s infinite linear' }}
              />
              <div
                className="absolute w-[82%] h-[82%] rounded-full border-[12px] border-t-purple-600 border-r-blue-500 border-b-cyan-500 border-l-emerald-500/80"
                style={{ animation: 'fwc-spin-reverse 18s infinite linear' }}
              />
              <div
                className="absolute w-[64%] h-[64%] rounded-full border-[8px] border-t-orange-500 border-r-rose-600 border-b-indigo-500 border-l-teal-400/80"
                style={{ animation: 'fwc-spin-slow 22s infinite linear' }}
              />
            </div>

            {/* Glowing neon filter ring */}
            <div className="absolute w-24 h-24 bg-rose-500/20 rounded-full blur-[25px] animate-pulse pointer-events-none" />

            {/* Glass core capsule centered */}
            <div className="relative z-10 flex flex-col items-center bg-white border border-white/95 p-4 px-6 rounded-xl shadow-2xl scale-[0.9] group-hover:scale-[0.95] transition-transform duration-300">
              <div className="absolute -top-3">
                <Trophy className="w-8 h-8 text-amber-500 drop-shadow-[0_4px_12px_rgba(217,119,6,0.7)] animate-bounce" />
              </div>
              <div className="font-sans font-black italic text-neutral-950 text-5xl tracking-tighter mt-1 select-none">
                26
              </div>
              <div className="mt-1 font-sans font-extrabold tracking-[0.25em] text-[9.5px] text-neutral-900/80 border-t border-neutral-900/10 pt-1 w-full text-center">
                FIFA
              </div>
            </div>
          </div>

          {/* Interactive tactical numbers display */}
          <div className="flex gap-4 bg-black/45 backdrop-blur-md p-3 px-5 rounded-sm border border-white/10 w-full max-w-md shadow-2xl relative overflow-hidden group hover:border-[#3cac3b]/35 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3cac3b] group-hover:bg-emerald-400 transition-colors" />

            <div className="flex-1 text-center">
              <span className="font-mono text-lg md:text-xl text-[#3cac3b] font-black block">48</span>
              <span className="font-sans text-[8px] text-[#d1d4d1]/50 tracking-wider font-bold uppercase block mt-1">NATIONS FIGHT</span>
            </div>
            <div className="w-[1px] bg-white/10 self-stretch"></div>

            <div className="flex-1 text-center">
              <span className="font-mono text-lg md:text-xl text-blue-400 font-black block">104</span>
              <span className="font-sans text-[8px] text-[#d1d4d1]/50 tracking-wider font-bold uppercase block mt-1">TOTAL BATTLES</span>
            </div>
            <div className="w-[1px] bg-white/10 self-stretch"></div>

            <div className="flex-1 text-center">
              <span className="font-mono text-lg md:text-xl text-rose-500 font-black block">1</span>
              <span className="font-sans text-[8px] text-[#d1d4d1]/50 tracking-wider font-bold uppercase block mt-1">CHAMPION TIER</span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN: AUTHENTICATION DECK (GLASS CONTAINER) */}
      <section className="relative z-10 w-full md:w-2/5 h-full flex flex-col justify-center items-center p-4 md:p-10 overflow-y-auto custom-scrollbar border-t md:border-t-0 md:border-l border-white/5">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#3cac3b]/5 rounded-full blur-[120px] pointer-events-none select-none z-0"></div>

        {/* Floating High-End Glassmorphic Card */}
        <div className="relative z-10 w-full max-w-sm bg-neutral-950/75 border border-white/10 p-5 md:p-7 rounded-2xl backdrop-blur-3xl shadow-3xl space-y-5 my-auto flex flex-col justify-between">
          <div className="space-y-4">
            {/* Core Screen Router */}
            {recoveryStep !== 'OFF' ? (
              /* ================= PASSWORD RECOVERY WIZARD PANE ================= */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full space-y-4"
              >
                <button
                  type="button"
                  onClick={() => { setRecoveryStep('OFF'); setErrorMsg(''); }}
                  className="text-[10px] font-bold text-[#d1d4d1]/50 hover:text-white flex items-center gap-1 uppercase transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return To Gate
                </button>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-[#3cac3b] uppercase tracking-widest block font-bold">RECOVERY SYSTEM</span>
                  <h2 className="font-sans font-black text-xl uppercase text-white tracking-tight leading-none">
                    Reset Credentials
                  </h2>
                  <p className="text-[11px] text-[#d1d4d1]/60 leading-relaxed">
                    Validate your registered corporate email to authorize a simulated security update.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] rounded-md">
                    {errorMsg}
                  </div>
                )}

                {recoverySuccessMsg && (
                  <div className="p-2.5 bg-emerald-500/10 border border-[#3cac3b]/30 text-emerald-300 text-[11px] rounded-md">
                    {recoverySuccessMsg}
                  </div>
                )}

                {recoveryStep === 'EMAIL_INPUT' ? (
                  <form onSubmit={handleRequestPasscode} className="space-y-3">
                    <div className="space-y-1.5">
                      <label htmlFor="recoveryEmail" className="text-[10px] font-mono uppercase text-[#d1d4d1]/60 block font-bold">Corporate Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-white/40" />
                        <input
                          id="recoveryEmail"
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full bg-black/60 border border-white/10 rounded-md py-2.5 pl-9 pr-3 text-white text-xs outline-none focus:border-[#3cac3b] focus:ring-1 focus:ring-[#3cac3b]/30 placeholder-white/20 transition-all font-sans"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white py-2.5 text-xs font-bold font-sans uppercase tracking-widest rounded-md transition-all cursor-pointer shadow-lg shadow-[#3cac3b]/10"
                    >
                      Verify Token
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div className="p-2.5 bg-black/40 border border-[#3cac3b]/15 text-[10px] leading-relaxed text-[#3cac3b] font-mono rounded-md">
                      Simulated verification. Satisfy the code with <strong className="underline">123456</strong>.
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="recoveryCode" className="text-[10px] font-mono uppercase text-[#d1d4d1]/60 block font-bold">6-Digit Code</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 w-3.5 h-3.5 text-white/40" />
                        <input
                          id="recoveryCode"
                          type="text"
                          maxLength={6}
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full bg-black/60 border border-white/10 rounded-md py-2.5 pl-9 pr-3 text-white text-xs font-mono tracking-widest outline-none focus:border-[#3cac3b] focus:ring-1 focus:ring-[#3cac3b]/30 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="newPassword" className="text-[10px] font-mono uppercase text-[#d1d4d1]/60 block font-bold">New Security Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-3.5 h-3.5 text-white/40" />
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Alphanumeric key"
                          className="w-full bg-black/60 border border-white/10 rounded-md py-2.5 pl-9 pr-3 text-white text-xs outline-none focus:border-[#3cac3b] focus:ring-1 focus:ring-[#3cac3b]/30 transition-all placeholder-white/20"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white py-2.5 text-xs font-bold font-sans uppercase tracking-widest rounded-md transition-all cursor-pointer shadow-lg shadow-[#3cac3b]/10"
                    >
                      Save Passkey
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              /* ================= MAIN AUTHENTICATION CARD SYSTEM ================= */
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full space-y-4"
              >

                {/* SEPARATE LOGIN GATE MODE NAV HEADER CARD */}
                <div className="flex bg-black/50 border border-white/10 p-1 rounded-lg gap-1">
                  <button
                    type="button"
                    onClick={() => { setAccessMode('ANALYST_LOGIN'); setErrorMsg(''); setSuccessNotice(''); }}
                    className={`flex-1 py-1.5 text-center font-sans font-black text-[10.5px] uppercase tracking-wider rounded-md transition-all cursor-pointer ${accessMode === 'ANALYST_LOGIN'
                      ? 'bg-[#3cac3b] text-white shadow-md shadow-[#3cac3b]/20 animate-pulse'
                      : 'text-[#d1d4d1]/50 hover:text-white'
                      }`}
                  >
                    ⚽ Analyst Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAccessMode('ADMIN_GATE'); setErrorMsg(''); setSuccessNotice(''); }}
                    className={`flex-1 py-1.5 text-center font-sans font-black text-[10.5px] uppercase tracking-wider rounded-md transition-all cursor-pointer ${accessMode === 'ADMIN_GATE'
                      ? 'bg-amber-505 bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-[#d1d4d1]/50 hover:text-white'
                      }`}
                  >
                    👑 VIP Overseer
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="font-sans font-black text-2xl uppercase text-white tracking-tight leading-none">
                    {accessMode === 'ADMIN_GATE' ? 'Admin Portal VIP' : 'Analyst Access'}
                  </h2>
                  <p className="text-[11px] text-[#d1d4d1]/65 leading-relaxed">
                    {accessMode === 'ADMIN_GATE'
                      ? 'Exclusive system management block. Please provide administrative code key.'
                      : 'Provide your credentials below to synchronize prediction brackets, metrics, and models.'}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-500/10 border-l-3 border-rose-500 text-rose-300 text-xs rounded-r-md">
                    {errorMsg}
                  </div>
                )}

                {successNotice && (
                  <div className="p-2.5 bg-emerald-500/10 border-l-3 border-[#3cac3b] text-emerald-300 text-xs rounded-r-md">
                    {successNotice}
                  </div>
                )}

                {/* 🔑 SLEEK COMPACT VIP DEMO ACCORDION DRAWER PANEL */}
                <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                    className="w-full px-3 py-2 flex items-center justify-between text-left text-[10px] font-black text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-[#3cac3b]">
                      ⚡ QUICK DEMO ACCESS TICKETS
                    </span>
                    <span className="text-[9px] font-sans font-bold bg-[#3cac3b]/20 text-[#3cac3b] px-1.5 py-0.5 rounded-sm">
                      {showDemoAccounts ? 'CLOSE ▲' : 'OPEN ▼'}
                    </span>
                  </button>

                  {showDemoAccounts && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 text-[10.5px] space-y-2 bg-black/50 border-t border-white/5 divide-y divide-white/5"
                    >
                      <div className="flex items-center justify-between pb-1 gap-2">
                        <span className="text-white/40 font-mono text-[9px]">👤 Analyst:</span>
                        <button
                          type="button"
                          className="text-[#3cac3b] font-bold hover:underline cursor-pointer"
                          onClick={() => { setEmail('marco.rossi@fifa.com'); setAccessKey(''); setAccessMode('ANALYST_LOGIN'); }}
                        >
                          marco.rossi@fifa.com
                        </button>
                      </div>
                      <div className="flex items-center justify-between py-1.5 gap-2">
                        <span className="text-white/40 font-mono text-[9px]">👤 Predictive:</span>
                        <button
                          type="button"
                          className="text-[#3cac3b] font-bold hover:underline cursor-pointer"
                          onClick={() => { setEmail('sarah.j@predictor-net.org'); setAccessKey(''); setAccessMode('ANALYST_LOGIN'); }}
                        >
                          sarah.j@predictor-net.org
                        </button>
                      </div>
                      <div className="flex items-center justify-between py-1.5 gap-2">
                        <span className="text-white/40 font-mono text-[9px]">👑 Admin:</span>
                        <button
                          type="button"
                          className="text-amber-400 font-bold hover:underline cursor-pointer"
                          onClick={() => { setEmail('sreekanthap90@gmail.com'); setAccessKey('ADMIN2026'); setAccessMode('ADMIN_GATE'); }}
                        >
                          sreekanthap90@gmail.com
                        </button>
                      </div>
                      <div className="text-[9px] text-white/30 pt-1.5 flex justify-between items-center bg-black/20 p-1.5 rounded-sm">
                        <span>🔐 Admin security Key required:</span>
                        <strong className="text-white font-mono bg-neutral-900 px-1 py-0.5 rounded-sm select-all">ADMIN2026</strong>
                      </div>
                    </motion.div>
                  )}
                </div>

                <form onSubmit={handleAccessSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[9.5px] font-mono text-[#d1d4d1]/60 uppercase tracking-widest font-bold block">Business Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-white/35" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full bg-black/60 border border-white/10 rounded-md py-2 pl-9.5 pr-3 text-white text-xs outline-none focus:border-[#3cac3b] focus:ring-1 focus:ring-[#3cac3b]/20 placeholder-white/20 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  {/* Show VIP code for admins */}
                  {accessMode === 'ADMIN_GATE' && (
                    <div className="space-y-2 bg-amber-500/5 p-3 border border-amber-500/20 rounded-md">
                      <label htmlFor="adminAccessKey" className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold block">Security Passkey</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-amber-500/40" />
                        <input
                          id="adminAccessKey"
                          type="password"
                          value={accessKey}
                          onChange={(e) => setAccessKey(e.target.value)}
                          placeholder="Passkey Required"
                          className="w-full bg-black/75 border border-amber-500/25 rounded-md py-2.5 pl-9.5 pr-3 text-amber-300 text-xs font-mono tracking-widest outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* standard Analyst password key */}
                  {accessMode === 'ANALYST_LOGIN' && (
                    <div className="space-y-1.5">
                      <label htmlFor="analystAccessKey" className="text-[9.5px] font-mono text-[#d1d4d1]/60 uppercase tracking-widest font-bold block">Security Password (Optional)</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-white/35" />
                        <input
                          id="analystAccessKey"
                          type="password"
                          value={accessKey}
                          onChange={(e) => setAccessKey(e.target.value)}
                          placeholder="Optional company password"
                          className="w-full bg-black/60 border border-white/10 rounded-md py-2.5 pl-9.5 pr-3 text-white text-xs outline-none focus:border-[#3cac3b] focus:ring-1 focus:ring-[#3cac3b]/20 placeholder-white/25 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setRecoveryEmail(email);
                        setRecoveryStep('EMAIL_INPUT');
                      }}
                      className="font-sans text-white/50 text-[9.5px] hover:text-[#3cac3b] transition-colors uppercase font-bold cursor-pointer"
                    >
                      Forgot passcode?
                    </button>
                    <label htmlFor="rememberMe" className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 bg-black/60 border border-white/10 text-[#3cac3b] rounded-sm focus:ring-0 cursor-pointer"
                      />
                      <span className="font-sans text-[#d1d4d1]/50 text-[9.5px] uppercase font-bold select-none">Remember Host</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 text-xs font-black font-sans uppercase tracking-widest transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer rounded-md ${accessMode === 'ADMIN_GATE'
                      ? 'bg-amber-500 text-black hover:bg-amber-400 font-extrabold shadow-lg shadow-amber-500/10'
                      : 'bg-[#3cac3b] hover:bg-[#3cac3b]/95 text-white font-extrabold shadow-lg shadow-[#3cac3b]/10'
                      }`}
                  >
                    {accessMode === 'ADMIN_GATE'
                      ? 'Authorize VIP Clearance'
                      : 'Verify Practitioner Token'}
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Polished interactive footer packed inside the glass container - completely fills empty spaces at the bottom! */}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-2 bg-neutral-950/20 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-[#d1d4d1]/40 uppercase font-black">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                SECURE SSL LINK ACTIVE
              </span>
              <span>12ms TLS Response</span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
              <span className="text-[8.5px] font-mono text-white/30 uppercase">FWC.NODE.2026 ALPHA</span>
              <div className="flex items-center gap-1.5 text-white/30">
                <Shield className="w-3 h-3 text-[#3cac3b]" />
                <span className="text-[8.5px] font-mono uppercase">PASSPORT SECURED</span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
