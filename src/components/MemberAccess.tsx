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

interface MemberAccessProps {
  onSuccess: (profile: Profile) => void;
  initialEmail?: string;
}

export default function MemberAccess({ onSuccess, initialEmail = 'sreekanthap90@gmail.com' }: MemberAccessProps) {
  const [accessMode, setAccessMode] = useState<'ANALYST_LOGIN' | 'ADMIN_GATE'>('ANALYST_LOGIN');
  
  // Input fields
  const [email, setEmail] = useState('');
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
      className="flex min-h-screen w-full flex-col md:flex-row bg-[#08090a] text-[#d1d4d1] overflow-hidden font-sans relative"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(8, 9, 10, 0.75), rgba(8, 9, 10, 0.90)), url(${stadiumBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      
      {/* 📺 STUNNING FULL-SCREEN AMBIENT YOUTUBE BACKGROUND FOR HIGH-END FOOTBALL ATMOSPHERE */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Layer 1: High-fidelity blur & shadow overlay filter masks */}
        <div className="absolute inset-0 bg-[#070809]/80 md:bg-[#060708]/75 z-10 backdrop-blur-[2.5px]" />
        <div className="absolute inset-0 bg-radial-at-c from-[#1e2020]/25 via-[#08090a]/85 to-[#030404]/98 z-20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-neutral-900/40 z-30" />
        
        {/* Scale up video inside an absolute layout to hide player chrome and logo banners cleanly */}
        <div className="absolute top-1/2 left-1/2 w-[125vw] h-[125vh] aspect-video -translate-x-1/2 -translate-y-1/2 scale-[1.75] min-w-[177.77vh] min-h-[56.25vw] flex items-center justify-center">
          <iframe
            className="w-full h-full object-cover pointer-events-none brightness-[0.55] contrast-[1.10] saturate-[0.90]"
            src="https://www.youtube-nocookie.com/embed/UeTOW5exFmE?autoplay=1&mute=1&loop=1&playlist=UeTOW5exFmE&controls=0&playsinline=1&rel=0&showinfo=0&modestbranding=1"
            title="FIFA World Cup Stadium Ambient Loop"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="no-referrer"
            frameBorder="0"
          />
        </div>
      </div>

      {/* LEFT COLUMN: HERO VISUAL INSIGNIA */}
      <section className="relative z-10 w-full md:w-3/5 h-[40vh] md:h-full flex items-center justify-center p-8 md:p-16 overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
        
        {/* Pitch tactical grid background design line markings */}
        <div className="absolute inset-0 opacity-[0.22] select-none pointer-events-none z-0 bg-[radial-gradient(#3cac3b_1.2px,transparent_1.2px)] [background-size:28px_28px]"></div>
        
        {/* Tactical drifting football radar orb light effect */}
        <motion.div 
          animate={{
            x: ['-20%', '120%'],
            y: ['10%', '90%', '10%'],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute w-80 h-80 rounded-full bg-emerald-500/12 blur-[90px] pointer-events-none z-0"
        />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-start gap-5">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, type: "spring" }}
            className="flex items-center gap-2.5 mb-1"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#3cac3b] to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/35 rounded-sm animate-pulse">
              <span className="font-sans font-black text-sm">⚽</span>
            </div>
            <div>
              <h2 className="text-xs font-black tracking-widest text-[#3cac3b] leading-none uppercase">FIFA WORLD CUP 2026</h2>
              <p className="text-[9px] text-[#d1d4d1]/40 tracking-wider uppercase mt-1 font-mono">INTERNAL PORTAL CHALLENGE</p>
            </div>
          </motion.div>

          <h1 className="font-sans font-black italic text-4xl md:text-7xl leading-none uppercase text-white tracking-tighter">
            PREDICT. COMPETE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-[#3cac3b]">VICTORY.</span>
          </h1>

          <p className="text-sm md:text-base text-[#d1d4d1]/80 max-w-md font-sans leading-relaxed">
            Welcome to the official 2026 World Cup Bracket Predictor interface. Enter tactical scorelines, compare analytical models, and track live matches as they progress.
          </p>

          <div className="h-0.5 text-[9px] uppercase font-bold tracking-widest text-[#d1d4d1]/30 flex gap-4 mt-2 border-b border-white/5 pb-2 w-full font-mono">
            🏈 JOINT STADIUM HOST TERMINALS: USA / MEX / CAN
          </div>

          {/* Interactive tactical numbers display with framer motion animations */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="flex gap-6 mt-2 bg-black/45 backdrop-blur-md p-4 px-6 rounded-sm border border-white/10 w-full max-w-md shadow-2xl relative overflow-hidden group hover:border-[#3cac3b]/30 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3cac3b] group-hover:bg-emerald-400 transition-colors" />
            
            <div className="flex-1 text-center">
              <span className="font-mono text-xl md:text-2xl text-[#3cac3b] font-black block">48</span>
              <span className="font-sans text-[8px] text-[#d1d4d1]/50 tracking-wider font-bold uppercase block mt-1">NATIONS FIGHT</span>
            </div>
            <div className="w-[1px] bg-white/10 self-stretch"></div>
            
            <div className="flex-1 text-center">
              <span className="font-mono text-xl md:text-2xl text-blue-400 font-black block">104</span>
              <span className="font-sans text-[8px] text-[#d1d4d1]/50 tracking-wider font-bold uppercase block mt-1">TOTAL BATTLES</span>
            </div>
            <div className="w-[1px] bg-white/10 self-stretch"></div>
            
            <div className="flex-1 text-center">
              <span className="font-mono text-xl md:text-2xl text-rose-500 font-black block">1</span>
              <span className="font-sans text-[8px] text-[#d1d4d1]/50 tracking-wider font-bold uppercase block mt-1">CHAMPION TIER</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RIGHT COLUMN: AUTHENTICATION DECK (GLASS CONTAINER) */}
      <section className="relative z-10 w-full md:w-2/5 h-2/3 md:h-full bg-neutral-950/80 md:bg-black/45 backdrop-blur-md flex flex-col justify-center p-8 md:p-14 overflow-y-auto custom-scrollbar border-l border-white/5">
        <div className="absolute top-1/4 right-5 w-72 h-72 bg-[#3cac3b]/5 rounded-full blur-[100px] pointer-events-none select-none z-0"></div>
        <div className="relative z-10 w-full">
        
        {/* Core Screen Router */}
        {recoveryStep !== 'OFF' ? (
          /* ================= PASSWORD RECOVERY WIZARD PANE ================= */
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm mx-auto space-y-6"
          >
            <button
              onClick={() => { setRecoveryStep('OFF'); setErrorMsg(''); }}
              className="text-xs font-bold text-[#d1d4d1]/50 hover:text-white flex items-center gap-1 uppercase transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return To Gate
            </button>
            
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#3cac3b] uppercase tracking-widest block font-bold">RECOVERY OFFICE DIRECT</span>
              <h2 className="font-sans font-black text-2xl uppercase text-white tracking-tight">
                Reset Access Credentials
              </h2>
              <p className="text-xs text-[#d1d4d1]/60">
                Authorize a secure password update by validating your registered corporate email ledger profile.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-sm">
                {errorMsg}
              </div>
            )}

            {recoverySuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-[#3cac3b]/30 text-emerald-300 text-xs rounded-sm">
                {recoverySuccessMsg}
              </div>
            )}

            {recoveryStep === 'EMAIL_INPUT' ? (
              <form onSubmit={handleRequestPasscode} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#d1d4d1]/60 block font-bold">Corporate Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="name@fifa.com"
                      className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-[#3cac3b]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white py-2.5 text-xs font-bold font-sans uppercase tracking-widest rounded-sm transition-all"
                >
                  Verify Verification Token
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="p-3 bg-black/40 border border-[#3cac3b]/20 text-[11px] leading-relaxed text-[#3cac3b] font-mono rounded-sm">
                  Simulated verification active. For tests, satisfy verification code field with <strong className="underline">123456</strong> or enter your override key directly.
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#d1d4d1]/60 block font-bold">6-Digit Email Code</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-white text-xs font-mono tracking-widest outline-none focus:border-[#3cac3b]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#d1d4d1]/60 block font-bold">New Security Password / Passkey</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Alphanumeric access key"
                      className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-[#3cac3b]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white py-2.5 text-xs font-bold font-sans uppercase tracking-widest rounded-sm transition-all"
                >
                  Save New Security Credentials
                </button>
              </form>
            )}

          </motion.div>
        ) : (
          /* ================= MAIN AUTHENTICATION CARD SYSTEM ================= */
          <motion.div 
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm mx-auto space-y-6"
          >
            
            {/* SEPARATE LOGIN GATE MODE NAV HEADER CARD */}
            <div className="flex bg-black/50 border border-white/10 p-1 rounded-md gap-1">
              <button
                type="button"
                onClick={() => { setAccessMode('ANALYST_LOGIN'); setErrorMsg(''); setSuccessNotice(''); }}
                className={`flex-1 py-1.5 text-center font-sans font-extrabold text-[11px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                  accessMode === 'ANALYST_LOGIN' 
                    ? 'bg-[#3cac3b] text-white shadow-lg shadow-[#3cac3b]/25' 
                    : 'text-[#d1d4d1]/50 hover:text-white'
                }`}
              >
                ⚽ Analyst Portal
              </button>
              <button
                type="button"
                onClick={() => { setAccessMode('ADMIN_GATE'); setErrorMsg(''); setSuccessNotice(''); }}
                className={`flex-1 py-1.5 text-center font-sans font-extrabold text-[11px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                  accessMode === 'ADMIN_GATE' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black' 
                    : 'text-[#d1d4d1]/50 hover:text-white'
                }`}
              >
                👑 Security Admin
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="font-sans font-black text-3xl uppercase text-white tracking-tight">
                {accessMode === 'ADMIN_GATE' ? 'Admin Portal VIP' : 'Analyst Access'}
              </h2>
              <p className="text-xs text-[#d1d4d1]/60 leading-relaxed">
                {accessMode === 'ADMIN_GATE' 
                  ? 'Exclusive administrative console block. Specify administrative code key.' 
                  : 'Enter your company email below to access your live brackets, prediction sheets, and models instantly.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border-l-3 border-rose-500 text-rose-300 text-xs rounded-r-sm">
                {errorMsg}
              </div>
            )}

            {successNotice && (
              <div className="p-3 bg-emerald-500/10 border-l-3 border-[#3cac3b] text-emerald-300 text-xs rounded-r-sm">
                {successNotice}
              </div>
            )}

            {/* Office test login credentials panel */}
            <div className="bg-black/40 border border-white/5 p-3 rounded-md text-[11px] space-y-2">
              <span className="font-bold text-[#3cac3b] block uppercase tracking-wide font-sans">Office Test Accounts:</span>
              <div className="space-y-1.5 text-[10px] font-mono text-[#d1d4d1]/70">
                <div className="flex items-center justify-between border-b border-white/5 pb-1 gap-2 flex-wrap sm:flex-nowrap">
                  <span>👤 Employee Analyst login:</span>
                  <button 
                    type="button"
                    className="text-[#3cac3b] hover:underline cursor-pointer font-bold text-right" 
                    onClick={() => { setEmail('marco.rossi@fifa.com'); setAccessKey(''); setAccessMode('ANALYST_LOGIN'); }}
                  >
                    marco.rossi@fifa.com
                  </button>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1 gap-2 flex-wrap sm:flex-nowrap">
                  <span>👤 Another Employee Analyst:</span>
                  <button 
                    type="button"
                    className="text-[#3cac3b] hover:underline cursor-pointer font-bold text-right" 
                    onClick={() => { setEmail('sarah.j@predictor-net.org'); setAccessKey(''); setAccessMode('ANALYST_LOGIN'); }}
                  >
                    sarah.j@predictor-net.org
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <span>👑 Admin (Clearance console):</span>
                  <button 
                    type="button"
                    className="text-amber-400 hover:underline cursor-pointer font-bold text-right" 
                    onClick={() => { setEmail('sreekanthap90@gmail.com'); setAccessKey('ADMIN2026'); setAccessMode('ADMIN_GATE'); }}
                  >
                    sreekanthap90@gmail.com
                  </button>
                </div>
                <div className="text-[9px] text-[#d1d4d1]/40 border-t border-white/5 pt-1.5 flex justify-between items-center">
                  <span>🔐 Admin security Key required:</span>
                  <strong className="text-white select-all font-mono font-bold bg-neutral-900 px-1.5 py-0.5 rounded-sm">ADMIN2026</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleAccessSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#d1d4d1]/60 uppercase tracking-widest font-bold block">Business Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-[#3cac3b]"
                    required
                  />
                </div>
              </div>

              {/* Show VIP code for admins */}
              {accessMode === 'ADMIN_GATE' && (
                <div className="space-y-1 bg-amber-500/5 p-3.5 border border-amber-500/20 rounded-md mb-2">
                  <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block mb-1">Administrative security Key</label>
                  <p className="text-[10px] text-amber-200/50 mb-2 font-mono">Specify the executive key <strong className="text-white">ADMIN2026</strong> to enter admin panel.</p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-amber-500/40" />
                    <input
                      type="password"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-amber-500/30 rounded-sm py-2 pl-9 pr-4 text-amber-300 text-xs font-mono tracking-widest outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* standard Analyst password key */}
              {accessMode === 'ANALYST_LOGIN' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#d1d4d1]/60 uppercase tracking-widest font-bold block">Access Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="Optional company password"
                      className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-[#3cac3b]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setRecoveryEmail(email);
                    setRecoveryStep('EMAIL_INPUT');
                  }}
                  className="font-sans text-white/50 text-[10px] hover:text-[#3cac3b] transition-colors uppercase font-bold"
                >
                  Forgot passcode?
                </button>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 bg-transparent border-white/10 text-[#3cac3b] rounded-sm focus:ring-0 cursor-pointer"
                  />
                  <span className="font-sans text-[#d1d4d1]/50 text-[10px] uppercase font-bold">Keep Active</span>
                </label>
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-xs font-bold font-sans uppercase tracking-widest transition-all mt-3 flex items-center justify-center gap-2 cursor-pointer rounded-sm ${
                  accessMode === 'ADMIN_GATE' 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white'
                }`}
              >
                {accessMode === 'ADMIN_GATE' 
                  ? 'Authorize Admin Clearance' 
                  : 'Verify Analyst Credentials'}
              </button>
            </form>

          </motion.div>
        )}
        </div>

        {/* Global technical footer layout */}
        <div className="absolute bottom-4 left-0 right-0 px-8 flex justify-between items-center opacity-40">
          <span className="font-mono text-[9px] tracking-widest text-[#d1d4d1]/60 uppercase font-bold">FWC.NODE.2026</span>
          <div className="flex gap-2 text-white">
            <Shield className="w-3.5 h-3.5 text-[#3cac3b]" />
            <Globe className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>
    </div>
  );
}
