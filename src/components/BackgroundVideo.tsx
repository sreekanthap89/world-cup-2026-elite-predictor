/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
// @ts-expect-error - image asset loaded by Vite
import stadiumBg from '../assets/images/stadium_background_1780500343243.png';

interface BackgroundVideoProps {
  opacity?: number;
  brightness?: number;
  isLogin?: boolean;
}

export default function BackgroundVideo({ opacity = 0.50, brightness = 0.40, isLogin = false }: BackgroundVideoProps) {
  // Primary YouTube background video for the login page
  const loginYoutubeId = 'DQtvjqm-xxI';
  // YouTube video for the landing/main page
  const landingYoutubeId = 'ejuiCkS7xXE';

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
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(8, 9, 10, 0.45), rgba(8, 9, 10, 0.70)), url(${stadiumBg})`,
      }}
    >

      {/* LAYER 1: MULTILAYER COATING OVERLAYS FOR OPTIMAL UI CONTRAST */}
      {/* High-fidelity color match filters & glassmorphic depth effects */}
      <div className={`absolute inset-0 z-10 ${isLogin ? 'bg-[#070809]/30' : 'bg-[#070809]/20'}`} />
      {!isLogin && <div className="absolute inset-0 bg-[#08090a]/10 z-15 mix-blend-multiply" />}
      <div className={`absolute inset-0 z-20 ${isLogin ? 'bg-gradient-to-b from-[#08090a]/40 via-transparent to-[#08090a]/50' : 'bg-gradient-to-tr from-[#08090a]/10 via-transparent to-[#08090a]/20'}`} />

      {/* LAYER 1.5: OFFICIAL FIFA 2026 COLOR BRAND BAND ARCHES (REMOVED) */}

      {/* LAYER 1.7: AMAZING HIGH-FIDELITY IMMERSIVE FIFA 2026 GRAPHICAL STAGE (REMOVED) */}

      {/* LAYER 3: MEDIA PLAYBACK CONTROLLER */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {/* YouTube iframe background for both login and landing pages */}
          <div className="absolute top-1/2 left-1/2 w-[125vw] h-[125vh] aspect-video -translate-x-1/2 -translate-y-1/2 scale-[1.7] min-w-[177.77vh] min-h-[56.25vw] flex items-center justify-center">
            <iframe
              id="bg-video-iframe"
              onLoad={() => {
                const iframe = document.getElementById('bg-video-iframe') as HTMLIFrameElement;
                try {
                  iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                } catch (e) {
                  // ignore cross-origin errors
                }
              }}
              className="w-full h-full object-cover pointer-events-none"
              style={{
                filter: `brightness(${brightness}) contrast(1.10) saturate(0.85)`,
                border: 'none',
              }}
              src={`https://www.youtube.com/embed/${isLogin ? loginYoutubeId : landingYoutubeId}?autoplay=1&mute=1&loop=1&playlist=${isLogin ? loginYoutubeId : landingYoutubeId}&controls=0&disablekb=1&playsinline=1&rel=0&modestbranding=1&showinfo=0&fs=0&iv_load_policy=3&autohide=1&enablejsapi=1&origin=${window.location.origin}`}
              title="FIFA World Cup 2026 Background"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen={false}
              frameBorder="0"
            />
            {/* Transparent overlay to hide YouTube play/pause controls */}
            <div className="absolute inset-0 z-10" />
          </div>
      </div>
    </div>
  );
}
