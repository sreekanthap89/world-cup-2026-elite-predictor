/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
// @ts-expect-error - image asset loaded by Vite
import stadiumBg from '../assets/images/stadium_background_1780500343243.png';

interface BackgroundVideoProps {
  opacity?: number;
  brightness?: number;
  isLogin?: boolean;
}

export default function BackgroundVideo({ opacity = 0.50, brightness = 0.40, isLogin = false }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useBackupYoutube, setUseBackupYoutube] = useState(false);

  // Pool of high-speed, unblocked, uncopyrighted stadium visual clips on YouTube for robust fallback
  // ID 'v7Q13bE-sM4' is a generic CGI loop of a football stadium with flashing lights.
  // ID 'bB_v77j8cZk' is a generic ambient crowd & light transition.
  const backupYoutubeId = 'v7Q13bE-sM4';

  useEffect(() => {
    // Inject dynamic CSS style sheet for custom keyframes (guarantees sweeping stadium beams & FWC 2028 brand curves)
    const styleId = 'stadium-lights-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes sweep-left {
          0%, 100% { transform: rotate(-35deg) scaleX(0.8); opacity: 0.15; }
          50% { transform: rotate(15deg) scaleX(1.3); opacity: 0.35; }
        }
        @keyframes sweep-right {
          0%, 100% { transform: rotate(35deg) scaleX(0.8); opacity: 0.15; }
          50% { transform: rotate(-15deg) scaleX(1.3); opacity: 0.35; }
        }
        @keyframes crowd-flicker {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.45; }
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.9); opacity: 0.1; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes fwc-spin-slow {
          0% { transform: rotate(0deg) scale(1) translate(0, 0); }
          50% { transform: rotate(180deg) scale(1.05) translate(-10px, 15px); }
          100% { transform: rotate(360deg) scale(1) translate(0, 0); }
        }
        @keyframes fwc-spin-reverse {
          0% { transform: rotate(360deg) scale(1.05) translate(0, 0); }
          50% { transform: rotate(180deg) scale(0.98) translate(15px, -10px); }
          100% { transform: rotate(0deg) scale(1.05) translate(0, 0); }
        }
        @keyframes fwc-drift-flow {
          0%, 100% { transform: translate(0, 0) skew(0deg) scale(1); }
          33% { transform: translate(20px, -15px) skew(-2deg) scale(1.03); }
          66% { transform: translate(-15px, 20px) skew(3deg) scale(0.97); }
        }
        @keyframes pulse-intense {
          0%, 100% { opacity: 0.25; filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.2)); }
          50% { opacity: 0.55; filter: drop-shadow(0 0 35px rgba(239, 68, 68, 0.4)); }
        }
        @keyframes ball-drift-slow-1 {
          0% { transform: translate(-10vw, 90vh) rotate(0deg) scale(0.6); opacity: 0; }
          10% { opacity: 0.45; }
          90% { opacity: 0.45; }
          100% { transform: translate(95vw, 10vh) rotate(720deg) scale(1.1); opacity: 0; }
        }
        @keyframes ball-drift-slow-2 {
          0% { transform: translate(95vw, 80vh) rotate(360deg) scale(0.95); opacity: 0; }
          15% { opacity: 0.4; }
          85% { opacity: 0.4; }
          100% { transform: translate(-5vw, 20vh) rotate(0deg) scale(0.5); opacity: 0; }
        }
        @keyframes trophy-breathe {
          0%, 100% { transform: translateY(0) rotate(-3deg); filter: drop-shadow(0 0 30px rgba(245, 158, 11, 0.35)) brightness(1); }
          50% { transform: translateY(-20px) rotate(4deg); filter: drop-shadow(0 0 65px rgba(245, 158, 11, 0.75)) brightness(1.3); }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate(-25px, 35px) scale(1.2); opacity: 0.45; }
        }
        @keyframes line-glow {
          0%, 100% { opacity: 0.15; stroke-dashoffset: 0; }
          50% { opacity: 0.3; stroke-dashoffset: 50; }
        }
        @keyframes firework-burst {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const video = videoRef.current;
    if (video) {
      // Force direct programmatic settings for strict browser autoplay enforcement
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log('Autoplay deferred or blocked, arming global interaction handler:', error);
            // If native video gets blocked due to CORS or referer policy, we trigger backup Youtube embed
            if (error.name === 'NotSupportedError' || error.message?.includes('referrer')) {
              setUseBackupYoutube(true);
            }
          });
      }
    }

    // Capture user click or touch interaction anywhere on the page to trigger autoplay
    // This instantly satisfies browser Autoplay Policies for all HTML elements
    const handleUserInteraction = () => {
      if (videoRef.current && !isPlaying) {
        videoRef.current.muted = true;
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log('User gesture play attempt fail:', err);
            // On failure, load secure YouTube embed fallback immediately
            setUseBackupYoutube(true);
          });
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isPlaying]);

  const handleVideoError = () => {
    console.warn('Native MP4 background error (CORS or referer blocks). Activating backup YouTube stream.');
    setUseBackupYoutube(true);
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(8, 9, 10, 0.45), rgba(8, 9, 10, 0.70)), url(${stadiumBg})`,
      }}
    >
      
      {/* LAYER 1: MULTILAYER COATING OVERLAYS FOR OPTIMAL UI CONTRAST */}
      {/* High-fidelity color match filters & glassmorphic depth effects */}
      <div className="absolute inset-0 bg-[#070809]/88 md:bg-[#060708]/85 z-10 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-radial-at-c from-[#1e2020]/15 via-[#08090a]/80 to-[#030404]/98 z-15 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-[#08090a]/90 z-20" />
      
      {/* LAYER 1.5: OFFICIAL FIFA 2026 COLOR BRAND BAND ARCHES (CONCENTRIC TUNNEL AS REQUESTED) */}
      {(isLogin || true) && (
        <div className={`absolute inset-0 w-full h-full z-[8] overflow-hidden mix-blend-screen transition-opacity duration-1000 ${isLogin ? 'opacity-70' : 'opacity-[0.22]'}`}>
          {/* Cluster A: Bottom Left expanding concentric arcs representing official 2026 concentric curves */}
          <div 
            className="absolute -bottom-[25vw] -left-[25vw] w-[95vw] h-[95vw] md:w-[65vw] md:h-[65vw] rounded-full flex items-center justify-center pointer-events-none"
            style={{ animation: 'fwc-spin-slow 24s infinite linear' }}
          >
            <div className="absolute w-full h-full rounded-full border-[24px] border-indigo-600/15 blur-[2px]" />
            <div className="absolute w-[92%] h-[92%] rounded-full border-[22px] border-blue-500/20 blur-[1px]" />
            <div className="absolute w-[84%] h-[84%] rounded-full border-[20px] border-cyan-400/30 blur-[2px]" />
            <div className="absolute w-[76%] h-[76%] rounded-full border-[18px] border-emerald-500/35 blur-[1px]" />
            <div className="absolute w-[68%] h-[68%] rounded-full border-[16px] border-lime-400/40 blur-[2px]" />
            <div className="absolute w-[60%] h-[60%] rounded-full border-[14px] border-yellow-400/30 blur-[1px]" />
            <div className="absolute w-[52%] h-[52%] rounded-full border-[12px] border-orange-500/40 blur-[2px]" />
            <div className="absolute w-[44%] h-[44%] rounded-full border-[10px] border-rose-600/30 blur-[1px]" />
            <div className="absolute w-[36%] h-[36%] rounded-full border-[8px] border-red-700/40 blur-[2px]" />
          </div>

          {/* Cluster B: Top Right expanding concentric arches */}
          <div 
            className="absolute -top-[35vw] -right-[25vw] w-[100vw] h-[100vw] md:w-[70vw] md:h-[70vw] rounded-full flex items-center justify-center pointer-events-none"
            style={{ animation: 'fwc-spin-reverse 28s infinite linear' }}
          >
            <div className="absolute w-full h-full rounded-full border-[26px] border-red-700/15 blur-[2px]" />
            <div className="absolute w-[91%] h-[91%] rounded-full border-[22px] border-rose-600/20 blur-[1px]" />
            <div className="absolute w-[82%] h-[82%] rounded-full border-[19px] border-orange-500/25 blur-[2px]" />
            <div className="absolute w-[73%] h-[73%] rounded-full border-[16px] border-yellow-400/35 blur-[1px]" />
            <div className="absolute w-[64%] h-[64%] rounded-full border-[13px] border-lime-400/30 blur-[2px]" />
            <div className="absolute w-[55%] h-[55%] rounded-full border-[11px] border-emerald-500/40 blur-[1px]" />
            <div className="absolute w-[46%] h-[46%] rounded-full border-[9px] border-cyan-400/30 blur-[2px]" />
            <div className="absolute w-[37%] h-[37%] rounded-full border-[7px] border-blue-500/40 blur-[1px]" />
            <div className="absolute w-[28%] h-[28%] rounded-full border-[5px] border-indigo-600/50 blur-[2px]" />
          </div>

          {/* Dynamic sweeping background ribbon wave lines matching stadium television broadcast energy */}
          <div 
            className="absolute inset-x-0 top-1/4 h-[40vh] pointer-events-none mix-blend-screen opacity-[0.25] blur-[45px] md:blur-[70px]"
            style={{ animation: 'fwc-drift-flow 20s infinite ease-in-out' }}
          >
            <div className="absolute top-0 w-full h-8 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400" />
            <div className="absolute top-8 w-full h-8 bg-gradient-to-r from-orange-500 via-lime-400 to-emerald-500" />
            <div className="absolute top-16 w-full h-8 bg-gradient-to-r from-lime-400 via-cyan-400 to-blue-500" />
            <div className="absolute top-24 w-full h-8 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600" />
          </div>
        </div>
      )}

      {/* LAYER 1.7: AMAZING HIGH-FIDELITY IMMERSIVE FIFA 2026 GRAPHICAL STAGE (THE SOCCER FAN EMPIRE) */}
      <div className="absolute inset-0 w-full h-full z-[9] overflow-hidden pointer-events-none">
        
        {/* Futurist Football Pitch Tactical Grid (Blueprint markings that glow) */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-[0.14]" 
          xmlns="http://www.w3.org/2000/svg" 
          width="100%" 
          height="100%"
        >
          <defs>
            <radialGradient id="pitchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <pattern id="tacticalGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#10b981" opacity="0.3" />
            </pattern>
          </defs>
          
          {/* Tactical wireframe grid overlay */}
          <rect width="100%" height="100%" fill="url(#tacticalGrid)" />
          
          {/* Main pitch boundary, center line and center circle */}
          <rect x="5%" y="8%" width="90%" height="84%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" rx="4" />
          <line x1="50%" y1="8%" x2="50%" y2="92%" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.3" />
          <circle cx="50%" cy="50%" r="120" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" style={{ animation: 'line-glow 8s infinite' }} />
          <circle cx="50%" cy="50%" r="6" fill="#10b981" opacity="0.6" />

          {/* Left Goal Area & Penalty Box */}
          <rect x="5%" y="30%" width="12%" height="40%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />
          <rect x="5%" y="40%" width="4%" height="20%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />
          <path d="M 17% 42% A 60 60 0 0 1 17% 58%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />

          {/* Right Goal Area & Penalty Box */}
          <rect x="83%" y="30%" width="12%" height="40%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />
          <rect x="91%" y="40%" width="4%" height="20%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />
          <path d="M 83% 42% A 60 60 0 0 0 83% 58%" fill="none" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />

          {/* Tactical dynamic offensive pass routes arrows */}
          <path d="M 28% 25% H 40% L 48% 38%" fill="none" stroke="rgba(251, 191, 36, 0.35)" strokeWidth="2" strokeDasharray="6,4" style={{ animation: 'line-glow 4s infinite' }} />
          <polygon points="48,38 45,33 43,36" fill="rgba(251, 191, 36, 0.45)" transform="translate(0, -2)" />

          <path d="M 72% 75% H 60% L 53% 58%" fill="none" stroke="rgba(14, 165, 233, 0.35)" strokeWidth="2" strokeDasharray="6,4" style={{ animation: 'line-glow 5s infinite' }} />
          <polygon points="53,58 56,63 58,60" fill="rgba(14, 165, 233, 0.45)" transform="translate(0, 2)" />
        </svg>

        {/* Dynamic Stadium Crowd Flash sparks blinking in rhythm */}
        <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] rounded-full bg-radial-at-c from-emerald-500/10 via-transparent to-transparent opacity-80" style={{ animation: 'orb-float 14s infinite ease-in-out' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-radial-at-c from-blue-500/5 via-transparent to-transparent opacity-60" style={{ animation: 'orb-float 18s infinite ease-in-out 2s' }} />

        {/* FIRST AMAZING FLOATING 3D-EFFECT SOCCER BALL (DRIFTING LEFT-TO-RIGHT) */}
        <div 
          className="absolute pointer-events-none drop-shadow-[0_15px_30px_rgba(16,185,129,0.35)]"
          style={{ 
            width: '100px', 
            height: '100px',
            animation: 'ball-drift-slow-1 28s infinite linear' 
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#dedede" />
                <stop offset="90%" stopColor="#4a4d52" />
                <stop offset="100%" stopColor="#15171a" />
              </radialGradient>
              <filter id="neonGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* outer sphere glowing rim */}
            <circle cx="50%" cy="50%" r="48" fill="url(#sphereGrad)" stroke="#10b981" strokeWidth="2.5" filter="url(#neonGlow)" />
            {/* Soccer hexagon lines overlay */}
            <path d="M 50 2 L 50 18 M 50 18 L 36 28 L 39 45 L 61 45 L 64 28 L 50 18 M 36 28 L 20 28 L 10 42 L 23 52 L 39 45 M 64 28 L 80 28 L 90 42 L 77 52 L 61 45 M 23 52 L 23 72 L 50 82 L 77 72 L 77 52 M 23 72 L 36 82 L 39 45 M 77 72 L 64 82 L 61 45 M 50 82 L 50 98" stroke="#15171a" strokeWidth="2.5" fill="none" opacity="0.85" />
            {/* Highlight overlay */}
            <ellipse cx="32" cy="25" rx="16" ry="8" fill="white" opacity="0.32" transform="rotate(-15 32 25)" />
          </svg>
        </div>

        {/* SECOND AMAZING FLOATING 3D NEON SOCCER BALL (DRIFTING RIGHT-TO-LEFT) */}
        <div 
          className="absolute pointer-events-none drop-shadow-[0_12px_25px_rgba(244,63,94,0.3)] opacity-75"
          style={{ 
            width: '75px', 
            height: '75px',
            animation: 'ball-drift-slow-2 36s infinite linear' 
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <radialGradient id="sphereGradRose" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffe4e6" />
                <stop offset="55%" stopColor="#fda4af" />
                <stop offset="90%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#4c0519" />
              </radialGradient>
            </defs>
            <circle cx="50%" cy="50%" r="48" fill="url(#sphereGradRose)" stroke="#ff007f" strokeWidth="2" />
            <path d="M 50 2 L 50 18 M 50 18 L 36 28 L 39 45 L 61 45 L 64 28 L 50 18 M 36 28 L 20 28 L 10 42 L 23 52 L 39 45 M 64 28 L 80 28 L 90 42 L 77 52 L 61 45 M 23 52 L 23 72 L 50 82 L 77 72 L 77 52 M 23 72 L 36 82 L 39 45 M 77 72 L 64 82 L 61 45 M 50 82 L 50 98" stroke="#4c0519" strokeWidth="2" fill="none" opacity="0.8" />
            <ellipse cx="32" cy="25" rx="14" ry="7" fill="white" opacity="0.25" transform="rotate(-15 32 25)" />
          </svg>
        </div>

        {/* THE GOLDEN FWC CHAMPIONSHIP TROPHY GLOW VISUAL CENTER PIECE (PLACED BOTTOM-LEFT BUT IN PORTAL MODE) */}
        <div 
          className="absolute bottom-24 left-10 md:left-14 w-32 h-56 hidden lg:flex items-center justify-center select-none pointer-events-none"
          style={{ animation: 'trophy-breathe 10s infinite ease-in-out' }}
        >
          {/* Concentric shining trophy sunburst background */}
          <div className="absolute w-44 h-44 bg-amber-500/10 rounded-full blur-[45px] -z-10 animate-pulse" />
          <div className="absolute w-28 h-28 bg-yellow-400/5 rounded-full blur-[25px] -z-10" />

          {/* Golden Trophy vector representation mapping the authentic gold curve design */}
          <svg viewBox="0 0 100 160" width="100%" height="100%">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="30%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            
            {/* Shimmering vertical laser lines around the trophy */}
            <line x1="50" y1="5" x2="50" y2="155" stroke="rgba(251, 191, 36, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="50" cy="80" r="45" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="0.8" />
            
            {/* The base of the Trophy */}
            <path d="M 32 150 L 68 150 L 64 135 L 36 135 Z" fill="url(#baseGrad)" stroke="#475569" strokeWidth="1" />
            <rect x="38" y="141" width="24" height="4" fill="#fbbf24" opacity="0.8" rx="0.5" />
            
            {/* The dual malachite gemstone green rings */}
            <rect x="34" y="146" width="32" height="2" fill="#10b981" />
            <rect x="35.5" y="137" width="29" height="2" fill="#10b981" />

            {/* The golden body sculpture wrapping upwards */}
            <path d="M 36 135 C 36 135, 42 120, 42 105 C 42 90, 31 75, 31 60 C 31 52, 36 45, 43 45 C 43 45, 38 60, 44 75 C 50 90, 50 110, 46 135 Z" fill="url(#goldGrad)" />
            <path d="M 64 135 C 64 135, 58 120, 58 105 C 58 90, 69 75, 69 60 C 69 52, 64 45, 57 45 C 57 45, 62 60, 56 75 C 50 90, 50 110, 54 135 Z" fill="url(#goldGrad)" opacity="0.9" />

            {/* The golden figure support hands holding the globe */}
            <path d="M 40 45 C 43 38, 47 35, 50 35 C 53 35, 57 38, 60 45 C 55 42, 45 42, 40 45 Z" fill="url(#goldGrad)" />

            {/* The earth globe at the top */}
            <circle cx="50" cy="28" r="14" fill="url(#globeGrad)" stroke="#fbbf24" strokeWidth="1" />
            {/* Golden abstract continents over globe */}
            <path d="M 42 22 Q 46 25 48 20 Q 52 25 48 32 Q 44 30 42 22 Z M 52 24 Q 57 20 62 26 Q 59 34 52 32 Z" fill="#fbbf24" opacity="0.85" />
            {/* Top crown victory ring */}
            <circle cx="50" cy="28" r="15" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,2" />
          </svg>
        </div>

        {/* Stadium Floating Fireworks celebratory sparkles over header areas */}
        <div className="absolute top-10 right-10 md:right-20 w-32 h-32 opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-dotted border-rose-500 rounded-full" style={{ animation: 'firework-burst 4.5s infinite ease-out' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border border-dotted border-amber-400 rounded-full" style={{ animation: 'firework-burst 4.5s infinite ease-out 1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 border border-dotted border-cyan-400 rounded-full" style={{ animation: 'firework-burst 4.5s infinite ease-out 3s' }} />
        </div>

      </div>

      {/* LAYER 2: CHOREOGRAPHED DYNAMIC CSS STADIUM LIGHTS (IMMUNE TO BLOCKS, ALWAYS 100% OPERATIONAL) */}
      <div className="absolute inset-0 w-full h-full z-5 opacity-40">
        {/* Dynamic sweeping laser beams representing high-end stadium projectors */}
        <div 
          className="absolute top-0 left-1/4 w-[15vw] h-[80vh] bg-gradient-to-b from-[#3cac3b]/30 to-transparent origin-top blur-[50px]"
          style={{ animation: 'sweep-left 12s infinite ease-in-out' }}
        />
        <div 
          className="absolute top-0 right-1/4 w-[15vw] h-[80vh] bg-gradient-to-b from-emerald-500/20 to-transparent origin-top blur-[60px]"
          style={{ animation: 'sweep-right 10s infinite ease-in-out' }}
        />
        
        {/* Flashing camera flashes simulating crowd spectators in stadium */}
        <div 
          className="absolute bottom-1/3 left-1/12 w-2 h-2 bg-white rounded-full blur-[2px]"
          style={{ animation: 'crowd-flicker 1.8s infinite ease-in-out' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px]"
          style={{ animation: 'crowd-flicker 2.4s infinite ease-in-out 0.4s' }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white rounded-full blur-[3px]"
          style={{ animation: 'crowd-flicker 1.5s infinite ease-in-out 0.8s' }}
        />
        <div 
          className="absolute bottom-1/5 right-1/12 w-2 h-2 bg-emerald-300 rounded-full blur-[2px]"
          style={{ animation: 'crowd-flicker 3s infinite ease-in-out 1.2s' }}
        />

        {/* High-tech pulsing tactical radar glow */}
        <div 
          className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 border border-[#3cac3b]/20 rounded-full"
          style={{ animation: 'radar-pulse 6s infinite linear' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 border border-emerald-500/10 rounded-full"
          style={{ animation: 'radar-pulse 6s infinite linear 2s' }}
        />
      </div>

      {/* LAYER 3: MEDIA PLAYBACK CONTROLLER */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {useBackupYoutube ? (
          /* Robust iframe fallback with standard YouTube player configuration */
          <div className="absolute top-1/2 left-1/2 w-[125vw] h-[125vh] aspect-video -translate-x-1/2 -translate-y-1/2 scale-[1.7] min-w-[177.77vh] min-h-[56.25vw] flex items-center justify-center">
            <iframe
              className="w-full h-full object-cover pointer-events-none brightness-[0.35] contrast-[1.10] saturate-[0.80]"
              src={`https://www.youtube.com/embed/${backupYoutubeId}?autoplay=1&mute=1&muted=1&loop=1&playlist=${backupYoutubeId}&controls=0&playsinline=1&rel=0&showinfo=0&modestbranding=1&enablejsapi=1`}
              title="FIFA World Cup Stadium Visualizer Loop"
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="no-referrer"
              frameBorder="0"
            />
          </div>
        ) : (
          /* Universal HTML5 Video tag with strict local CORS overrides and immediate safety error listener */
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={handleVideoError}
            poster={stadiumBg}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            style={{
              opacity: opacity,
              filter: `brightness(${brightness}) contrast(1.15) saturate(0.85)`,
            }}
          >
            {/* Native loop of live football match stadium lights. We ommit referrers using no-referrer attributes */}
            <source 
              src="https://assets.mixkit.co/videos/preview/mixkit-bright-lights-illuminating-a-stadium-at-night-42173-large.mp4" 
              type="video/mp4" 
            />
            {/* Tertiary sports match background loop backup */}
            <source 
              src="https://assets.mixkit.co/videos/preview/mixkit-stadium-lights-and-crowd-in-a-sports-match-34304-large.mp4" 
              type="video/mp4" 
            />
          </video>
        )}
      </div>
    </div>
  );
}
