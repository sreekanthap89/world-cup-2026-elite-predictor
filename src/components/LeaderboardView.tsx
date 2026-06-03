/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, TrendingUp, Sparkles, ChevronUp, ChevronDown, Gamepad2, Award } from 'lucide-react';
import { Profile } from '../types';

interface LeaderboardViewProps {
  profiles: Profile[];
}

const FALLBACK_PROFILES: Profile[] = [
  { id: 'user-rossi', fullName: 'Marco Rossi', email: 'marco.rossi@fifa.com', employee_id: 'FIFA-2026-0041', phone_number: '+1 (555) 012-0041', role: 'ANALYST', rank: 1, accuracy: 98, points: 9840 },
  { id: 'user-jenkins', fullName: 'Sarah Jenkins', email: 'sarah.j@predictor-net.org', employee_id: 'FIFA-2026-0129', phone_number: '+1 (555) 012-0129', role: 'ANALYST', rank: 2, accuracy: 95, points: 9510 },
  { id: 'user-khan', fullName: 'Ahmed Khan', email: 'ahmed_k@al-jazeera.com', employee_id: 'FIFA-2026-0331', phone_number: '+1 (555) 012-0331', role: 'ANALYST', rank: 3, accuracy: 91, points: 9120 },
  { id: 'user-predictor-alpha', fullName: 'Predictor_Alpha', email: 'sreekanthap90@gmail.com', employee_id: 'FIFA-2026-9901', phone_number: '+1 (555) 012-2026', role: 'ADMIN', rank: 4, accuracy: 94, points: 8420 }
];

export default function LeaderboardView({ profiles = [] }: LeaderboardViewProps) {
  const displayProfiles = profiles.length > 0 ? profiles : FALLBACK_PROFILES;
  
  // Sort by points descending
  const sortedProfiles = [...displayProfiles].sort((a, b) => b.points - a.points);

  // Setup actual top three spots (falling back gracefully)
  const p1 = sortedProfiles[0] || FALLBACK_PROFILES[0];
  const p2 = sortedProfiles[1] || FALLBACK_PROFILES[1];
  const p3 = sortedProfiles[2] || FALLBACK_PROFILES[2];

  // Dynamic calculations
  const totalAnalystsCount = 4820 + sortedProfiles.length;
  const avgAccuracy = Math.round(sortedProfiles.reduce((acc, p) => acc + p.accuracy, 0) / sortedProfiles.length) || 84;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans p-2 select-text">
      {/* Header section with brand metrics */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d1d4d1]/10 pb-6">
        <div>
          <span className="font-mono text-xs text-[#3cac3b] uppercase tracking-widest font-bold">PRESTIGE METRICS</span>
          <h2 className="font-sans text-4xl md:text-5xl uppercase font-black tracking-tighter text-white">
            Global Predictor Leaderboard
          </h2>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#252727] border border-[#d1d4d1]/10 px-4 py-2 rounded-sm">
            <span className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">TOTAL ANALYSTS</span>
            <span className="font-sans font-extrabold text-2xl text-white">{totalAnalystsCount}</span>
          </div>
          <div className="bg-[#252727] border border-[#d1d4d1]/10 px-4 py-2 rounded-sm">
            <span className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">AVERAGE ACCURACY</span>
            <span className="font-sans font-extrabold text-2xl text-[#3cac3b]">{avgAccuracy}%</span>
          </div>
        </div>
      </header>

      {/* 3D PODIUM VIEW */}
      <section className="bg-gradient-to-b from-[#252727] to-[#121414] border border-[#d1d4d1]/10 p-6 md:p-8 rounded-sm">
        <div className="flex items-center gap-2 mb-6 text-[#3cac3b]">
          <Trophy className="w-5 h-5 flex-shrink-0" />
          <span className="font-sans font-extrabold text-lg uppercase tracking-wider">CHAMPIONSHIP PODIUM</span>
        </div>

        <div className="grid grid-cols-3 items-end gap-2 md:gap-6 max-w-3xl mx-auto pt-10 pb-4">
          
          {/* 2nd Place Podium */}
          <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center mb-2">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-slate-300 bg-slate-800 flex items-center justify-center text-slate-300 font-sans text-lg font-bold uppercase">
                {p2.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <span className="absolute -top-3 bg-slate-300 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">2ND</span>
            </div>
            <div className="w-full text-center text-xs text-[#d1d4d1] truncate font-sans font-semibold mb-1">
              {p2.fullName}
            </div>
            <div className="w-full text-center text-[10px] text-[#3cac3b] font-mono mb-2">
              {p2.accuracy}% Acc / {p2.points.toLocaleString()} pts
            </div>
            <div className="w-full bg-[#1e2020] border-t-4 border-slate-300 py-6 md:py-10 text-center text-slate-300 font-sans text-2xl font-bold flex flex-col items-center justify-center rounded-b-sm">
              <span>{p2.accuracy}%</span>
              <span className="font-mono text-xs opacity-50 font-normal">SILVER</span>
            </div>
          </div>

          {/* 1st Place Podium */}
          <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center mb-2 scale-110 drop-shadow-[0_0_15px_rgba(60,172,59,0.25)]">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-3 border-[#3cac3b] bg-slate-800 flex items-center justify-center text-[#3cac3b] font-sans text-2xl font-bold uppercase">
                {p1.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <span className="absolute -top-3 bg-[#3cac3b] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 fill-white" /> 1ST
              </span>
            </div>
            <div className="w-full text-center text-sm text-white truncate font-sans font-extrabold mb-1 mt-2">
              {p1.fullName}
            </div>
            <div className="w-full text-center text-xs text-white font-mono mb-2">
              {p1.accuracy}% Acc / {p1.points.toLocaleString()} pts
            </div>
            <div className="w-full bg-[#2f3131] border-t-4 border-[#3cac3b] py-10 md:py-16 text-[#3cac3b] font-sans text-3xl font-extrabold flex flex-col items-center justify-center rounded-b-sm">
              <span>{p1.accuracy}%</span>
              <span className="font-mono text-xs text-white/70 font-normal">GOLD ACCENT</span>
            </div>
          </div>

          {/* 3rd Place Podium */}
          <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center mb-2">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-[#b57c50] bg-zinc-800 flex items-center justify-center text-[#b57c50] font-sans text-lg font-bold uppercase">
                {p3.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <span className="absolute -top-3 bg-[#b57c50] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3RD</span>
            </div>
            <div className="w-full text-center text-xs text-[#d1d4d1] truncate font-sans font-semibold mb-1">
              {p3.fullName}
            </div>
            <div className="w-full text-center text-[10px] text-[#3cac3b] font-mono mb-2">
              {p3.accuracy}% Acc / {p3.points.toLocaleString()} pts
            </div>
            <div className="w-full bg-[#1e2020] border-t-4 border-[#b57c50] py-4 md:py-8 text-center text-[#b57c50] font-sans text-xl font-bold flex flex-col items-center justify-center rounded-b-sm">
              <span>{p3.accuracy}%</span>
              <span className="font-mono text-xs opacity-50 font-normal">BRONZE</span>
            </div>
          </div>

        </div>
      </section>

      {/* DETAILED LEDGER RANKING LIST */}
      <section className="bg-[#252727] border border-[#d1d4d1]/10 p-4 rounded-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-[#d1d4d1]/10 text-[#d1d4d1]/50 uppercase tracking-wider font-mono">
                <th className="py-3 px-4 font-normal">Rank</th>
                <th className="py-3 px-4 font-normal">Analyst Name</th>
                <th className="py-3 px-4 font-normal text-right">Points Pool</th>
                <th className="py-3 px-4 font-normal text-right">Accuracy Rate</th>
                <th className="py-3 px-4 font-normal text-center">Identity</th>
                <th className="py-3 px-4 font-normal text-center">Trend Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d4d1]/10 text-white font-medium">
              {sortedProfiles.map((analyst, index) => {
                const isUser = analyst.email === 'sreekanthap90@gmail.com' || analyst.id === 'user-predictor-alpha';
                const rankNum = index + 1;
                
                // Assign deterministic trends based on ranks
                const trend = rankNum % 3 === 0 ? 'UP' : rankNum % 3 === 1 ? 'STABLE' : 'DOWN';

                return (
                  <tr
                    key={analyst.id}
                    className={`transition-colors hover:bg-white/5 ${isUser ? 'bg-[#3cac3b]/10 border-l-2 border-[#3cac3b]' : ''}`}
                  >
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#3cac3b]">
                      #{rankNum}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          {analyst.fullName}
                          {isUser && (
                            <span className="bg-[#3cac3b] text-white text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wide rounded-sm font-bold animate-pulse">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-[#d1d4d1]/50 font-mono">{analyst.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-yellow-400">
                      {analyst.points.toLocaleString()} <span className="text-[10px] opacity-75 font-normal text-white">PTS</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-black/40 border border-[#d1d4d1]/10 px-2 py-1 font-mono text-[#3cac3b] font-bold rounded-sm">
                        {analyst.accuracy}%
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-[10px] tracking-wider text-[#d1d4d1]/60">
                      {analyst.role === 'ADMIN' ? (
                        <span className="bg-red-500/15 border border-red-500/30 text-rose-300 font-bold px-2 py-0.5 rounded-sm">ADMIN</span>
                      ) : (
                        <span className="bg-blue-500/15 border border-blue-500/30 text-sky-300 px-2 py-0.5 rounded-sm">ANALYST</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        {trend === 'UP' && (
                          <span className="flex items-center text-xs text-emerald-400 gap-0.5" title="Climbing Standing">
                            <ChevronUp className="w-4 h-4 text-emerald-400" />
                          </span>
                        )}
                        {trend === 'DOWN' && (
                          <span className="flex items-center text-xs text-rose-500 gap-0.5" title="Slight Drop">
                            <ChevronDown className="w-4 h-4 text-rose-500" />
                          </span>
                        )}
                        {trend === 'STABLE' && (
                          <span className="text-[#d1d4d1]/30 font-bold" title="Maintained Rank">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
