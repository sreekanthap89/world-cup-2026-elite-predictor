/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, TrendingUp, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  points: number;
  accuracy: number;
  correct: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'Marco Rossi', email: 'marco.rossi@fifa.com', points: 9840, accuracy: 98, correct: 28, trend: 'UP' },
  { rank: 2, name: 'Sarah Jenkins', email: 'sarah.j@predictor-net.org', points: 9510, accuracy: 95, correct: 26, trend: 'UP' },
  { rank: 3, name: 'Ahmed Khan', email: 'ahmed_k@al-jazeera.com', points: 9120, accuracy: 91, correct: 25, trend: 'STABLE' },
  { rank: 4, name: 'Sreekanth P', email: 'sreekanthap90@gmail.com', points: 8420, accuracy: 94, correct: 23, trend: 'UP' },
  { rank: 5, name: 'Katarina Vesterqvist', email: 'katie@stockholm-analytics.se', points: 8190, accuracy: 88, correct: 22, trend: 'DOWN' },
  { rank: 6, name: 'Yuki Sato', email: 'ysato@tokyo-fever.co.jp', points: 7920, accuracy: 85, correct: 21, trend: 'STABLE' },
  { rank: 7, name: 'Jean Dupont', email: 'j Dupont@lequipe.fr', points: 7450, accuracy: 82, correct: 19, trend: 'DOWN' }
];

export default function LeaderboardView() {
  const topThree = [
    LEADERBOARD_DATA[1], // 2nd place
    LEADERBOARD_DATA[0], // 1st place
    LEADERBOARD_DATA[2]  // 3rd place
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans p-2">
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
            <span className="font-sans font-extrabold text-2xl text-white">4,821</span>
          </div>
          <div className="bg-[#252727] border border-[#d1d4d1]/10 px-4 py-2 rounded-sm">
            <span className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">AVERAGE ACCURACY</span>
            <span className="font-sans font-extrabold text-2xl text-[#3cac3b]">78.4%</span>
          </div>
        </div>
      </header>

      {/* 3D PODIUM VIEW */}
      <section className="bg-gradient-to-b from-[#252727] to-[#121414] border border-[#d1d4d1]/10 p-6 md:p-8 rounded-sm">
        <div className="flex items-center gap-2 mb-6 text-[#3cac3b]">
          <Trophy className="w-5 h-5" />
          <span className="font-sans font-extrabold text-lg uppercase tracking-wider">CHAMPIONSHIP PODIUM</span>
        </div>

        <div className="grid grid-cols-3 items-end gap-2 md:gap-6 max-w-3xl mx-auto pt-10 pb-4">
          {/* 2nd Place Podium */}
          <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center mb-2">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-slate-300 bg-slate-800 flex items-center justify-center text-slate-300 font-sans text-xl font-bold">
                SJ
              </div>
              <span className="absolute -top-3 bg-slate-300 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">2ND</span>
            </div>
            <div className="w-full text-center text-xs text-[#d1d4d1] truncate font-sans font-semibold mb-1">
              Sarah Jenkins
            </div>
            <div className="w-full text-center text-[10px] text-[#3cac3b] font-mono mb-2">
              {topThree[0].accuracy}% Acc / {topThree[0].points} pts
            </div>
            <div className="w-full bg-[#1e2020] border-t-4 border-slate-300 py-6 md:py-10 text-center text-slate-300 font-sans text-2xl font-bold flex flex-col items-center justify-center rounded-b-sm">
              <span>95%</span>
              <span className="font-mono text-xs opacity-50 font-normal">SILVER</span>
            </div>
          </div>

          {/* 1st Place Podium */}
          <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center mb-2 scale-110 drop-shadow-[0_0_15px_rgba(60,172,59,0.25)]">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-3 border-[#3cac3b] bg-slate-800 flex items-center justify-center text-[#3cac3b] font-sans text-2xl font-bold">
                MR
              </div>
              <span className="absolute -top-3 bg-[#3cac3b] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 fill-white" /> 1ST
              </span>
            </div>
            <div className="w-full text-center text-sm text-white truncate font-sans font-extrabold mb-1 mt-2">
              Marco Rossi
            </div>
            <div className="w-full text-center text-xs text-white font-mono mb-2">
              {topThree[1].accuracy}% Acc / {topThree[1].points} pts
            </div>
            <div className="w-full bg-[#2f3131] border-t-4 border-[#3cac3b] py-10 md:py-16 text-[#3cac3b] font-sans text-3xl font-extrabold flex flex-col items-center justify-center rounded-b-sm">
              <span>98%</span>
              <span className="font-mono text-xs text-white/70 font-normal">GOLD ACCENT</span>
            </div>
          </div>

          {/* 3rd Place Podium */}
          <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center mb-2">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-[#b57c50] bg-zinc-800 flex items-center justify-center text-[#b57c50] font-sans text-xl font-bold">
                AK
              </div>
              <span className="absolute -top-3 bg-[#b57c50] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3RD</span>
            </div>
            <div className="w-full text-center text-xs text-[#d1d4d1] truncate font-sans font-semibold mb-1">
              Ahmed Khan
            </div>
            <div className="w-full text-center text-[10px] text-[#3cac3b] font-mono mb-2">
              {topThree[2].accuracy}% Acc / {topThree[2].points} pts
            </div>
            <div className="w-full bg-[#1e2020] border-t-4 border-[#b57c50] py-4 md:py-8 text-center text-[#b57c50] font-sans text-xl font-bold flex flex-col items-center justify-center rounded-b-sm">
              <span>91%</span>
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
                <th className="py-3 px-4 font-normal">Analyst</th>
                <th className="py-3 px-4 font-normal text-right">Points</th>
                <th className="py-3 px-4 font-normal text-right">Accuracy</th>
                <th className="py-3 px-4 font-normal text-right">Correct Predictions</th>
                <th className="py-3 px-4 font-normal text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d4d1]/10 text-white font-medium">
              {LEADERBOARD_DATA.map((analyst) => {
                const isUser = analyst.email === 'sreekanthap90@gmail.com';
                return (
                  <tr
                    key={analyst.rank}
                    className={`transition-colors hover:bg-white/5 ${isUser ? 'bg-[#3cac3b]/10 border-l-2 border-[#3cac3b]' : ''}`}
                  >
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#3cac3b]">
                      #{analyst.rank}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          {analyst.name}
                          {isUser && (
                            <span className="bg-[#3cac3b] text-white text-[9px] font-mono px-1 py-0.5 uppercase tracking-wide rounded-sm">
                              YOU / ADMIN
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-[#d1d4d1]/50 font-mono">{analyst.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {analyst.points.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-black/40 border border-[#d1d4d1]/10 px-2 py-0.5 font-mono text-[#3cac3b] font-bold rounded-sm">
                        {analyst.accuracy}%
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      {analyst.correct} / 32
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        {analyst.trend === 'UP' && (
                          <span className="flex items-center text-xs text-emerald-400 gap-0.5">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {analyst.trend === 'DOWN' && (
                          <span className="flex items-center text-xs text-rose-500 gap-0.5">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {analyst.trend === 'STABLE' && (
                          <span className="text-[#d1d4d1]/30 font-bold">—</span>
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
