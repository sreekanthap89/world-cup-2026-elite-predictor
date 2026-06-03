/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Match, Prediction } from '../types';
import { Calendar, Search, Lock } from 'lucide-react';

interface Round32ViewProps {
  matches: Match[];
  predictions: Prediction[];
  onMatchClick: (match: Match) => void;
}

export default function Round32View({
  matches,
  predictions,
  onMatchClick
}: Round32ViewProps) {
  const [r32MatchSearch, setR32MatchSearch] = useState('');

  const getPredictionStatus = (matchId: string) => {
    return predictions.find(p => p.match_id === matchId);
  };

  const getHostBorder = (match: Match) => {
    if (match.status === 'LIVE') return 'border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    if (match.status === 'COMPLETED') return 'border border-zinc-800 opacity-80';
    return 'border border-emerald-500/10 hover:border-emerald-500/30';
  };

  const renderFlag = (teamId: string, flagField: string) => {
    if (!flagField || flagField === 'TBD' || teamId.startsWith('TBD')) {
      return (
        <div className="w-5 h-3.5 bg-zinc-800 border border-zinc-700/60 rounded-xs flex items-center justify-center text-[8px] font-bold text-zinc-500 shrink-0 select-none">
          ?
        </div>
      );
    }
    if (flagField.startsWith('http') || flagField.includes('/') || flagField.includes('.')) {
      return (
        <img
          src={flagField}
          alt=""
          className="w-5 h-3.5 object-cover rounded-xs border border-white/10 shrink-0"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    const flagMap: Record<string, string> = {
      USA: 'us', COLOMBIA: 'co', FRANCE: 'fr', POLAND: 'pl', NETHERLANDS: 'nl',
      GERMANY: 'de', ARGENTINA: 'ar', SPAIN: 'es', ITALY: 'it', BRAZIL: 'br',
      JAPAN: 'jp', MEXICO: 'mx', ECUADOR: 'ec', DENMARK: 'dk', CANADA: 'ca', AUSTRALIA: 'au'
    };

    const iso = flagMap[teamId] || flagMap[flagField] || flagField.toLowerCase();
    if (iso && iso.length === 2) {
      return (
        <img
          src={`https://flagcdn.com/40x30/${iso}.png`}
          alt=""
          className="w-5 h-3.5 object-cover rounded-xs border border-white/10 shrink-0"
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span className="text-[10px] shrink-0" title={teamId}>⚽</span>;
  };

  const r32Fixtures = matches.filter(m => {
    if (m.round !== 'R32') return false;
    return !r32MatchSearch ||
      m.team_a_name.toLowerCase().includes(r32MatchSearch.toLowerCase()) ||
      m.team_b_name.toLowerCase().includes(r32MatchSearch.toLowerCase()) ||
      m.venue.toLowerCase().includes(r32MatchSearch.toLowerCase());
  });

  return (
    <div className="p-6 overflow-y-auto h-[580px] custom-scrollbar bg-[#131414]">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#d1d4d1]/10 pb-4">
          <div>
            <h2 className="text-xl font-bold font-sans uppercase tracking-wider text-white">Round of 32 Match Fixtures</h2>
            <p className="text-xs text-zinc-400 font-mono mt-1 font-semibold">
              Select and forecast any of the 16 Round of 32 matches. Winners automatically promote to the Round of 16 Bracket nodes!
            </p>
          </div>
          <div className="text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-sm font-mono text-zinc-300 mt-2 md:mt-0 uppercase font-semibold">
            16 Matches | Single Elimination
          </div>
        </header>

        {/* Filter toolbar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Round of 32 matches by team, venue..."
            value={r32MatchSearch}
            onChange={(e) => setR32MatchSearch(e.target.value)}
            className="w-full bg-[#1c1d1d] border border-[#d1d4d1]/10 py-1.5 pl-9 pr-8 text-xs text-white focus:border-[#3cac3b] outline-none rounded-sm placeholder-zinc-500 font-sans"
          />
          {r32MatchSearch && (
            <button
              onClick={() => setR32MatchSearch('')}
              className="text-zinc-400 hover:text-white absolute right-3 top-2 text-xs font-sans cursor-pointer focus:outline-none focus:ring-0 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Matches Grid */}
        {r32Fixtures.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 font-mono text-xs border border-dashed border-[#d1d4d1]/10 rounded-sm bg-[#1c1d1d]">
            No matches found matching the search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {r32Fixtures.map((m, index) => {
              const pred = getPredictionStatus(m.id);
              const isTbd = m.team_a_id.startsWith('TBD') || m.team_b_id.startsWith('TBD') || m.team_a_name.includes('Winner') || m.team_b_name.includes('Winner');

              return (
                <div
                  key={m.id}
                  onClick={() => onMatchClick(m)}
                  className={`bg-[#1c1d1d] hover:bg-[#202222] border transition-all duration-150 rounded-sm p-3.5 cursor-pointer flex flex-col justify-between select-none h-[155px] ${getHostBorder(m)}`}
                >
                  <div className="flex justify-between items-center text-[9px] font-mono border-b border-[#d1d4d1]/5 pb-1.5 mb-2 text-[#d1d4d1]/40">
                    <span className="font-bold text-amber-500 uppercase">Match {index + 1} • R32</span>
                    <span className={`px-1 rounded-sm uppercase font-bold text-[8px] ${
                      m.status === 'COMPLETED' ? 'bg-zinc-800 text-zinc-400' :
                      m.status === 'LIVE' ? 'bg-amber-600/20 text-amber-400 animate-pulse' : 'bg-zinc-900 text-[#3cac3b]'
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderFlag(m.team_a_id, m.team_a_flag)}
                        <span className={`text-xs font-bold truncate leading-none ${isTbd ? 'text-zinc-500 font-normal shadow-xs' : 'text-zinc-200'}`}>
                          {m.team_a_name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-white">{m.team_a_score ?? '—'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderFlag(m.team_b_id, m.team_b_flag)}
                        <span className={`text-xs font-bold truncate leading-none ${isTbd ? 'text-zinc-500 font-normal shadow-xs' : 'text-zinc-200'}`}>
                          {m.team_b_name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-white">{m.team_b_score ?? '—'}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#d1d4d1]/5 pt-2 mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[8.5px] font-mono text-zinc-500">
                      <Calendar className="w-3 h-3 shrink-0 text-[#3cac3b]" />
                      <span className="truncate">{new Date(m.start_time).toLocaleString()}</span>
                    </div>

                    <div className="text-[9px] font-mono flex items-center justify-between mt-1">
                      {pred ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-500/20">
                          <Lock className="w-2.5 h-2.5 shrink-0" /> {pred.selection}: {pred.team_a_pred_score}-{pred.team_b_pred_score}
                        </span>
                      ) : isTbd ? (
                        <span className="text-zinc-500 italic text-[10px]">Awaiting bracket advancement...</span>
                      ) : (
                        <span className="text-[#3cac3b] font-bold">✍️ Forecast Match</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
