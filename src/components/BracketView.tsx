/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { Match, Prediction } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, Trophy, HelpCircle, Lock } from 'lucide-react';
import GroupMatchesView from './GroupMatchesView';
import Round32View from './Round32View';
// @ts-expect-error - image asset loaded by Vite
import stadiumBg from '../assets/images/stadium_background_1780500343243.png';

interface BracketViewProps {
  matches: Match[];
  predictions: Prediction[];
  onMatchClick: (match: Match) => void;
}

export default function BracketView({
  matches,
  predictions,
  onMatchClick
}: BracketViewProps) {
  const [activeTab, setActiveTab] = useState<'KOs' | 'GROUPS' | 'GROUP_MATCHES' | 'R32'>('KOs');
  const [zoomScale, setZoomScale] = useState<number>(0.65);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating sub-modal overlay specifically for predicting from the Group Nodes on the tree
  const [selectedGroupLetter, setSelectedGroupLetter] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  // Dynamic Group Standing Calculation Memoized
  const allGroupStandings = useMemo(() => {
    const getGroupStandings = (groupName: string) => {
      const groupMatches = matches.filter(m => m.round === 'GROUP' && m.group === groupName);
      const standingsMap: Record<string, {
        team_id: string;
        team_name: string;
        flag: string;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        gf: number;
        ga: number;
        gd: number;
        points: number;
      }> = {};

      // First collect all participating teams in this group from list of matches
      groupMatches.forEach(m => {
        [
          { id: m.team_a_id, name: m.team_a_name, flag: m.team_a_flag },
          { id: m.team_b_id, name: m.team_b_name, flag: m.team_b_flag }
        ].forEach(t => {
          if (t.id && !standingsMap[t.id]) {
            standingsMap[t.id] = {
              team_id: t.id,
              team_name: t.name,
              flag: t.flag,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              gf: 0,
              ga: 0,
              gd: 0,
              points: 0
            };
          }
        });
      });

      // Now compute stats from completed scores
      groupMatches.forEach(m => {
        const isCompleted = m.status === 'COMPLETED' || (m.team_a_score !== null && m.team_b_score !== null);
        if (isCompleted) {
          const sa = m.team_a_score ?? 0;
          const sb = m.team_b_score ?? 0;
          const ta = standingsMap[m.team_a_id];
          const tb = standingsMap[m.team_b_id];

          if (ta && tb) {
            ta.played += 1;
            tb.played += 1;
            ta.gf += sa;
            ta.ga += sb;
            tb.gf += sb;
            tb.ga += sa;

            if (sa > sb) {
              ta.won += 1;
              ta.points += 3;
              tb.lost += 1;
            } else if (sa < sb) {
              tb.won += 1;
              tb.points += 3;
              ta.lost += 1;
            } else {
              ta.drawn += 1;
              tb.drawn += 1;
              ta.points += 1;
              tb.points += 1;
            }
          }
        } else {
          // Look up forecast predictions of users to show "Predicted Standings" when no actual results
          const pred = predictions.find(p => p.match_id === m.id);
          if (pred) {
            const sa = pred.team_a_pred_score;
            const sb = pred.team_b_pred_score;
            const ta = standingsMap[m.team_a_id];
            const tb = standingsMap[m.team_b_id];

            if (ta && tb) {
              ta.played += 1;
              tb.played += 1;
              ta.gf += sa;
              ta.ga += sb;
              tb.gf += sb;
              tb.ga += sa;

              if (pred.selection === m.team_a_id) {
                ta.won += 1;
                ta.points += 3;
                tb.lost += 1;
              } else if (pred.selection === m.team_b_id) {
                tb.won += 1;
                tb.points += 3;
                ta.lost += 1;
              } else {
                ta.drawn += 1;
                tb.drawn += 1;
                ta.points += 1;
                tb.points += 1;
              }
            }
          }
        }
      });

      return Object.values(standingsMap).map(s => ({
        ...s,
        gd: s.gf - s.ga
      })).sort((x, y) => {
        if (y.points !== x.points) return y.points - x.points;
        if (y.gd !== x.gd) return y.gd - x.gd;
        return y.gf - x.gf;
      });
    };

    const standings: Record<string, ReturnType<typeof getGroupStandings>> = {};
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(letter => {
      standings[`Group ${letter}`] = getGroupStandings(`Group ${letter}`);
    });
    return standings;
  }, [matches, predictions]);

  // Mouse wheel Zoom tracker
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.08;
    let nextScale = zoomScale + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    nextScale = Math.min(Math.max(nextScale, 0.35), 1.6);
    setZoomScale(nextScale);
  };

  // Mouse drag Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only track left click
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch drag Pan handlers (for mobile/tablet screens)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsPanning(true);
    const touch = e.touches[0];
    setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - panStart.x,
      y: touch.clientY - panStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleReset = () => {
    setZoomScale(0.65);
    setPanOffset({ x: 20, y: 20 });
  };

  // Find all 16 Round of 32 matches
  const r32_1 = matches.find(m => m.id === 'm-r32-1');
  const r32_2 = matches.find(m => m.id === 'm-r32-2');
  const r32_3 = matches.find(m => m.id === 'm-r32-3');
  const r32_4 = matches.find(m => m.id === 'm-r32-4');
  const r32_5 = matches.find(m => m.id === 'm-r32-5');
  const r32_6 = matches.find(m => m.id === 'm-r32-6');
  const r32_7 = matches.find(m => m.id === 'm-r32-7');
  const r32_8 = matches.find(m => m.id === 'm-r32-8');
  const r32_9 = matches.find(m => m.id === 'm-r32-9');
  const r32_10 = matches.find(m => m.id === 'm-r32-10');
  const r32_11 = matches.find(m => m.id === 'm-r32-11');
  const r32_12 = matches.find(m => m.id === 'm-r32-12');
  const r32_13 = matches.find(m => m.id === 'm-r32-13');
  const r32_14 = matches.find(m => m.id === 'm-r32-14');
  const r32_15 = matches.find(m => m.id === 'm-r32-15');
  const r32_16 = matches.find(m => m.id === 'm-r32-16');

  // Load left/right views
  const leftR16 = [
    matches.find(m => m.id === 'm-l-r16-1'),
    matches.find(m => m.id === 'm-l-r16-2'),
    matches.find(m => m.id === 'm-l-r16-3'),
    matches.find(m => m.id === 'm-l-r16-4')
  ].filter(Boolean) as Match[];

  const leftQf = [
    matches.find(m => m.id === 'm-l-qf-1'),
    matches.find(m => m.id === 'm-l-qf-2')
  ].filter(Boolean) as Match[];

  const leftSf = [
    matches.find(m => m.id === 'm-l-sf-1')
  ].filter(Boolean) as Match[];

  const finalMatch = matches.find(m => m.round === 'FINAL' || m.id === 'm-final-1');

  const rightSf = [
    matches.find(m => m.id === 'm-r-sf-1')
  ].filter(Boolean) as Match[];

  const rightQf = [
    matches.find(m => m.id === 'm-r-qf-1'),
    matches.find(m => m.id === 'm-r-qf-2')
  ].filter(Boolean) as Match[];

  const rightR16 = [
    matches.find(m => m.id === 'm-r-r16-1'),
    matches.find(m => m.id === 'm-r-r16-2'),
    matches.find(m => m.id === 'm-r-r16-3'),
    matches.find(m => m.id === 'm-r-r16-4')
  ].filter(Boolean) as Match[];

  // Fetch forecast highlights
  const getPredictionStatus = (matchId: string) => {
    return predictions.find(p => p.match_id === matchId);
  };

  // Render team flags cleanly
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
      GERMANY: 'de', BRAZIL: 'br', JAPAN: 'jp', MEXICO: 'mx', ECUADOR: 'ec',
      ARGENTINA: 'ar', DENMARK: 'dk', CANADA: 'ca', AUSTRALIA: 'au', SPAIN: 'es', ITALY: 'it'
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

    return (
      <span className="text-[10px] shrink-0" title={teamId}>⚽</span>
    );
  };

  // Styles active matching card bounds
  const getHostBorder = (match: Match) => {
    if (match.status === 'LIVE') return 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    if (match.status === 'COMPLETED') return 'border-zinc-800/80 opacity-75';
    if (match.bracket_wing === 'LEFT') {
      return 'border-[#3cac3b]/30 hover:border-[#3cac3b]/60';
    } else {
      return 'border-[#2563eb]/30 hover:border-[#2563eb]/60';
    }
  };

  // Orthogonal mathematical SVG tree connectors
  const getSvgPathLeft = (x1: number, y1: number, x2: number, y2: number) => {
    const startX = x1 + 200;
    const endX = x2;
    const midX = (startX + endX) / 2;
    const startY = y1 + 47.5;
    const endY = y2 + 47.5;
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  };

  const getSvgPathRight = (x1: number, y1: number, x2: number, y2: number) => {
    const startX = x1;
    const endX = x2 + 200;
    const midX = (startX + endX) / 2;
    const startY = y1 + 47.5;
    const endY = y2 + 47.5;
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  };

  return (
    <div className="w-full flex flex-col bg-transparent border border-[#d1d4d1]/10 rounded-sm overflow-hidden min-h-[700px] shadow-2xl">
      {/* Dynamic Navigation tabs - Commented out to only show the tree view */}
      {/* 
      <div className="flex bg-[#1c1d1d]/90 border-b border-[#d1d4d1]/10 px-4 py-3 gap-2 shrink-0 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('GROUPS')}
          className={`px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all shrink-0 ${
            activeTab === 'GROUPS'
              ? 'bg-[#3cac3b] text-white shadow-md'
              : 'text-[#d1d4d1]/40 hover:text-white'
          }`}
        >
          📊 Group Standings
        </button>
        <button
          onClick={() => setActiveTab('GROUP_MATCHES')}
          className={`px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all shrink-0 ${
            activeTab === 'GROUP_MATCHES'
              ? 'bg-[#3cac3b] text-white shadow-md'
              : 'text-[#d1d4d1]/40 hover:text-white'
          }`}
        >
          ⚽ Group Matches
        </button>
        <button
          onClick={() => setActiveTab('R32')}
          className={`px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all shrink-0 ${
            activeTab === 'R32'
              ? 'bg-[#3cac3b] text-white shadow-md'
              : 'text-[#d1d4d1]/40 hover:text-white'
          }`}
        >
          ⚡ Round of 32
        </button>
        <button
          onClick={() => setActiveTab('KOs')}
          className={`px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all shrink-0 ${
            activeTab === 'KOs'
              ? 'bg-[#3cac3b] text-white shadow-md'
              : 'text-[#d1d4d1]/40 hover:text-white'
          }`}
        >
          🏆 Full Tournament Tree
        </button>
      </div>
      */}

      {activeTab === 'GROUPS' && (
        <div className="p-6 overflow-y-auto h-[600px] custom-scrollbar bg-[#131414]">
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#d1d4d1]/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-sans uppercase tracking-wider text-white">World Cup 2026 Group Stage</h2>
                <p className="text-xs text-zinc-400 font-mono mt-1 font-semibold">Real-time standings computed dynamically. Click any match in the admin panel to update results.</p>
              </div>
              <div className="text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-sm font-mono text-zinc-300 mt-2 md:mt-0 uppercase">
                48 matches played | Top 2 + 8 best 3rd place advance
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(gChar => {
                const grpName = `Group ${gChar}`;
                const standings = allGroupStandings[grpName];

                return (
                  <div key={gChar} className="bg-[#1c1d1d] border border-[#d1d4d1]/10 rounded-sm overflow-hidden shadow-md flex flex-col justify-between">
                    <div className="bg-zinc-900 px-4 py-2.5 border-b border-[#d1d4d1]/10 flex justify-between items-center">
                      <span className="font-bold font-sans text-xs text-amber-400 tracking-wider uppercase">{grpName}</span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Matchday Standings</span>
                    </div>

                    <div className="p-3">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[#d1d4d1]/5 text-[#d1d4d1]/30 font-bold text-[9px] uppercase">
                            <th className="pb-1 w-6">#</th>
                            <th className="pb-1">Team</th>
                            <th className="pb-1 text-center w-6">Pl</th>
                            <th className="pb-1 text-center w-6">GD</th>
                            <th className="pb-1 text-right w-10">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d1d4d1]/5">
                          {standings.map((row, index) => (
                            <tr key={row.team_id || index} className="hover:bg-white/2 transition-colors">
                              <td className="py-2.5 font-mono text-[9px] font-bold text-zinc-500">{index + 1}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                                  {renderFlag(row.team_id, row.flag)}
                                  <span className="truncate max-w-[110px]" title={row.team_name}>{row.team_name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 text-center font-mono text-zinc-300">{row.played}</td>
                              <td className={`py-2.5 text-center font-mono font-semibold ${row.gd > 0 ? 'text-emerald-400' : row.gd < 0 ? 'text-[#eb5252]' : 'text-zinc-500'}`}>
                                {row.gd > 0 ? `+${row.gd}` : row.gd}
                              </td>
                              <td className="py-2.5 text-right font-mono font-black text-amber-500">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'GROUP_MATCHES' && (
        <GroupMatchesView
          matches={matches}
          predictions={predictions}
          onMatchClick={onMatchClick}
        />
      )}

      {activeTab === 'R32' && (
        <Round32View
          matches={matches}
          predictions={predictions}
          onMatchClick={onMatchClick}
        />
      )}

      {activeTab === 'KOs' && (
        <div className="w-full relative select-none font-sans bg-transparent border border-white/5 overflow-hidden h-[820px] shrink-0 rounded-sm shadow-inner">
          
          {/* Controls overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
            <div className="bg-black/90 backdrop-blur-md px-3 py-1.5 border border-[#d1d4d1]/10 text-[10px] text-zinc-300 font-mono tracking-wider uppercase flex items-center gap-1.5 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-[#3cac3b] animate-pulse"></span>
              Drag to Pan | Scroll to Zoom | Click any Card to Forecast
            </div>

            <button
              onClick={handleReset}
              className="bg-black/90 backdrop-blur-md px-3 py-1.5 border border-[#d1d4d1]/10 hover:bg-[#202222] text-[10px] text-white font-mono tracking-wider uppercase flex items-center gap-1.5 cursor-pointer rounded-sm hover:text-emerald-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Reset View
            </button>
          </div>

          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
            <button
              onClick={() => setZoomScale(Math.min(zoomScale + 0.1, 1.5))}
              className="w-12 h-12 md:w-10 md:h-10 bg-black/90 backdrop-blur-md border border-[#d1d4d1]/10 hover:bg-[#202222] text-white flex items-center justify-center font-bold rounded-sm cursor-pointer hover:text-emerald-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-emerald-400" />
            </button>
            <button
              onClick={() => setZoomScale(Math.max(zoomScale - 0.1, 0.35))}
              className="w-12 h-12 md:w-10 md:h-10 bg-black/90 backdrop-blur-md border border-[#d1d4d1]/10 hover:bg-[#202222] text-white flex items-center justify-center font-bold rounded-sm cursor-pointer hover:text-emerald-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-emerald-400" />
            </button>
          </div>

          {/* Quick Stage Key Indicator overlay */}
          <div className="absolute top-4 right-4 z-10 hidden lg:flex items-center gap-4 bg-black/85 backdrop-blur-md border border-[#d1d4d1]/10 px-4 py-2 text-[10px] font-mono rounded-sm text-zinc-400 uppercase">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#3cac3b] rounded-full"></span> Left Wing (USA Nodes)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#2563eb] rounded-full"></span> Right Wing (CAN/MEX Nodes)
            </div>
          </div>

          {/* Pan / Zoom Viewport Wrapper */}
          <div
            ref={viewportRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full h-full cursor-grab ${isPanning ? 'cursor-grabbing' : ''}`}
          >
            {/* The Pitch zone: Green football turf with grass lines and white boundaries inside the ground */}
            <div
              className="absolute origin-top-left transition-transform duration-75 ease-out relative shadow-2xl rounded-sm"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                width: '2680px',
                height: '840px',
                backgroundColor: 'rgba(27, 77, 34, 0.4)',
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(27, 77, 34, 0.4), rgba(27, 77, 34, 0.4) 100px, rgba(20, 62, 26, 0.4) 100px, rgba(20, 62, 26, 0.4) 200px)'
              }}
            >
              
              {/* Soccer Field Graphics Layer */}
              <div className="absolute inset-4 border-2 border-white/20 pointer-events-none rounded-sm">
                {/* Halfway line */}
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2"></div>
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-80 h-80 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                {/* Penalty Area Left */}
                <div className="absolute left-0 top-1/2 w-52 h-[380px] border-2 border-white/20 -translate-y-1/2">
                  <div className="absolute right-0 top-1/2 w-16 h-40 border-2 border-white/20 -translate-y-1/2"></div>
                </div>
                {/* Penalty Area Right */}
                <div className="absolute right-0 top-1/2 w-52 h-[380px] border-2 border-white/20 -translate-y-1/2">
                  <div className="absolute left-0 top-1/2 w-16 h-40 border-2 border-white/20 -translate-y-1/2"></div>
                </div>
              </div>

              {/* SVG Connector Lines Layer */}
              <svg className="absolute inset-0 z-0 w-full h-full opacity-40 pointer-events-none">
                <defs>
                  <linearGradient id="lGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3cac3b" />
                    <stop offset="100%" stopColor="#a3e635" />
                  </linearGradient>
                  <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>

                {/* Left Wing connection line trees paths */}
                {/* Col 0 (Group L, x:40px) -> Col 1 (R32 L, x:280px) */}
                <path d={getSvgPathLeft(40, 30, 280, 30)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 30, 280, 130)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 160, 280, 230)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 160, 280, 330)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 290, 280, 430)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 420, 280, 530)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 550, 280, 630)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />
                <path d={getSvgPathLeft(40, 680, 280, 730)} fill="none" stroke="url(#lGrad)" strokeWidth="1.5" />

                {/* Col 1 (R32 L, x:280px) -> Col 2 (R16 L, x:520px) */}
                <path d={getSvgPathLeft(280, 30, 520, 80)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 130, 520, 80)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 230, 520, 280)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 330, 520, 280)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 430, 520, 480)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 530, 520, 480)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 630, 520, 680)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />
                <path d={getSvgPathLeft(280, 730, 520, 680)} fill="none" stroke="url(#lGrad)" strokeWidth="2" />

                {/* Col 2 (R16 L, x:520px) -> Col 3 (QF L, x:760px) */}
                <path d={getSvgPathLeft(520, 80, 760, 180)} fill="none" stroke="url(#lGrad)" strokeWidth="2.5" />
                <path d={getSvgPathLeft(520, 280, 760, 180)} fill="none" stroke="url(#lGrad)" strokeWidth="2.5" />
                <path d={getSvgPathLeft(520, 480, 760, 580)} fill="none" stroke="url(#lGrad)" strokeWidth="2.5" />
                <path d={getSvgPathLeft(520, 680, 760, 580)} fill="none" stroke="url(#lGrad)" strokeWidth="2.5" />

                {/* Col 3 (QF L, x:760px) -> Col 4 (SF L, x:1000px) */}
                <path d={getSvgPathLeft(760, 180, 1000, 380)} fill="none" stroke="url(#lGrad)" strokeWidth="3" />
                <path d={getSvgPathLeft(760, 580, 1000, 380)} fill="none" stroke="url(#lGrad)" strokeWidth="3" />

                {/* Col 4 (SF L, x:1000px) -> Col 5 (Final, x:1240px) */}
                <path d={getSvgPathLeft(1000, 380, 1240, 365)} fill="none" stroke="url(#lGrad)" strokeWidth="3.5" />


                {/* Right Wing connection line trees paths */}
                {/* Col 10 (Group R, x:2440px) -> Col 9 (R32 R, x:2200px) */}
                <path d={getSvgPathRight(2440, 30, 2200, 30)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 30, 2200, 130)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 160, 2200, 230)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 160, 2200, 330)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 290, 2200, 430)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 420, 2200, 530)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 550, 2200, 630)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />
                <path d={getSvgPathRight(2440, 680, 2200, 730)} fill="none" stroke="url(#rGrad)" strokeWidth="1.5" />

                {/* Col 9 (R32 R, x:2200px) -> Col 8 (R16 R, x:1960px) */}
                <path d={getSvgPathRight(2200, 30, 1960, 80)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 130, 1960, 80)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 230, 1960, 280)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 330, 1960, 280)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 430, 1960, 480)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 530, 1960, 480)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 630, 1960, 680)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />
                <path d={getSvgPathRight(2200, 730, 1960, 680)} fill="none" stroke="url(#rGrad)" strokeWidth="2" />

                {/* Col 8 (R16 R, x:1960px) -> Col 7 (QF R, x:1720px) */}
                <path d={getSvgPathRight(1960, 80, 1720, 180)} fill="none" stroke="url(#rGrad)" strokeWidth="2.5" />
                <path d={getSvgPathRight(1960, 280, 1720, 180)} fill="none" stroke="url(#rGrad)" strokeWidth="2.5" />
                <path d={getSvgPathRight(1960, 480, 1720, 580)} fill="none" stroke="url(#rGrad)" strokeWidth="2.5" />
                <path d={getSvgPathRight(1960, 680, 1720, 580)} fill="none" stroke="url(#rGrad)" strokeWidth="2.5" />

                {/* Col 7 (QF R, x:1720px) -> Col 6 (SF R, x:1480px) */}
                <path d={getSvgPathRight(1720, 180, 1480, 380)} fill="none" stroke="url(#rGrad)" strokeWidth="3" />
                <path d={getSvgPathRight(1720, 580, 1480, 380)} fill="none" stroke="url(#rGrad)" strokeWidth="3" />

                {/* Col 6 (SF R, x:1480px) -> Col 5 (Final, x:1240px) */}
                <path d={getSvgPathRight(1480, 380, 1240, 365)} fill="none" stroke="url(#rGrad)" strokeWidth="3.5" />
              </svg>

              {/* Card placements layout */}
              <div className="relative z-10 w-full h-full pointer-events-none text-white">
                
                {/* MATCH CARD RENDER INTERFACE FUNCTION */}
                {(() => {
                  const renderMatchCard = (match: Match, leftPos: number, topPos: number, headerText: string) => {
                    const pred = getPredictionStatus(match.id);
                    const isTbd = match.team_a_id.startsWith('TBD') || match.team_b_id.startsWith('TBD') || match.team_a_name.includes('Winner') || match.team_b_name.includes('Winner');

                    return (
                      <article
                        key={match.id}
                        style={{ left: `${leftPos}px`, top: `${topPos}px`, position: 'absolute' }}
                        onClick={() => onMatchClick(match)}
                        className={`w-[200px] h-[95px] bg-[#1e2020]/95 backdrop-blur-sm hover:bg-[#232525] border transition-all duration-150 rounded-sm p-2 cursor-pointer flex flex-col justify-between pointer-events-auto group ${getHostBorder(match)}`}
                      >
                        {/* Header bar */}
                        <div className="flex justify-between items-center text-[8px] font-mono text-[#d1d4d1]/40 border-b border-[#d1d4d1]/5 pb-1">
                          <span className="truncate max-w-[130px]">{headerText}</span>
                          <span className={`font-black ${match.status === 'LIVE' ? 'text-amber-400 animate-pulse' : match.status === 'COMPLETED' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {match.status}
                          </span>
                        </div>

                        {/* Teams Info */}
                        <div className="space-y-0.5">
                          {/* Team A */}
                          <div className="flex items-center justify-between gap-1.5 h-4">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {renderFlag(match.team_a_id, match.team_a_flag)}
                              <span className={`text-[10px] font-bold truncate leading-none ${isTbd ? 'text-zinc-500 font-semibold' : 'text-zinc-100 group-hover:text-white'}`}>
                                {match.team_a_name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-black text-zinc-300">
                              {match.team_a_score ?? '—'}
                            </span>
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-between gap-1.5 h-4">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {renderFlag(match.team_b_id, match.team_b_flag)}
                              <span className={`text-[10px] font-bold truncate leading-none ${isTbd ? 'text-zinc-500 font-semibold' : 'text-zinc-100 group-hover:text-white'}`}>
                                {match.team_b_name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-black text-zinc-300">
                              {match.team_b_score ?? '—'}
                            </span>
                          </div>
                        </div>

                        {/* Prediction bar highlight footer */}
                        <div className="flex items-center justify-between text-[8px] font-mono pt-1 border-t border-[#d1d4d1]/5">
                          {pred ? (
                            <>
                              <span className="text-emerald-400 flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                <Lock className="w-2 h-2" /> forecast Secured
                              </span>
                              <span className="bg-emerald-500/10 text-emerald-300 px-1 border border-emerald-500/20 rounded-xs">
                                {pred.selection} ({pred.team_a_pred_score}-{pred.team_b_pred_score})
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[#d1d4d1]/30">Open window</span>
                              {isTbd ? (
                                <span className="text-amber-500/60 lowercase italic">Awaiting outcomes</span>
                              ) : (
                                <span className="text-emerald-400/80 font-bold group-hover:underline">Predict</span>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    );
                  };

                  // RENDER GROUP NODES DYNAMIC STANDINGS WIDGETS
                  const renderGroupNode = (letter: string, leftPos: number, topPos: number) => {
                    const standings = allGroupStandings[`Group ${letter}`];
                    return (
                      <div
                        key={`group-node-${letter}`}
                        style={{ left: `${leftPos}px`, top: `${topPos}px`, position: 'absolute' }}
                        className="w-[200px] h-[95px] bg-[#1a1c1a]/95 backdrop-blur-sm border border-emerald-500/20 hover:border-emerald-500/60 rounded-sm p-1.5 cursor-pointer flex flex-col justify-between pointer-events-auto shadow-md hover:shadow-emerald-500/5 group transition-all duration-150"
                        onClick={() => {
                          setSelectedGroupLetter(letter);
                        }}
                      >
                        <div className="flex justify-between items-center text-[8px] font-mono font-bold text-[#3cac3b] border-b border-white/5 pb-1 select-none">
                          <span>GROUP {letter} STANDINGS</span>
                          <span className="text-zinc-500 group-hover:text-amber-400 transition-colors">Predict Matches →</span>
                        </div>
                        
                        <div className="space-y-0.5 flex-1 flex flex-col justify-center">
                          {standings.slice(0, 4).map((team, idx) => (
                            <div key={team.team_id || idx} className="flex items-center justify-between text-[8.5px] font-sans h-3.5">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="font-mono text-[7px] text-zinc-500 w-2 shrink-0">{idx + 1}</span>
                                {renderFlag(team.team_id, team.flag)}
                                <span className="font-bold text-zinc-300 truncate max-w-[110px] block leading-none">{team.team_name}</span>
                              </div>
                              <span className="font-mono text-zinc-400 font-bold text-[8px] shrink-0">
                                {team.points} <span className="text-[6.5px] text-zinc-500 font-normal">pts</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {/* COLUMN 0: GROUPS LEFT (x: 40px) */}
                      <div className="text-[10px] font-mono font-bold text-[#3cac3b] absolute left-[40px] top-[10px] uppercase tracking-wider">Group Stage Left</div>
                      {renderGroupNode('A', 40, 30)}
                      {renderGroupNode('B', 40, 160)}
                      {renderGroupNode('C', 40, 290)}
                      {renderGroupNode('D', 40, 420)}
                      {renderGroupNode('E', 40, 550)}
                      {renderGroupNode('F', 40, 680)}

                      {/* COLUMN 1: LEFT ROUND OF 32 (x: 280px) */}
                      <div className="text-[10px] font-mono font-bold text-emerald-400/85 absolute left-[280px] top-[10px] uppercase tracking-wider">Round of 32 Left</div>
                      {r32_2 && renderMatchCard(r32_2, 280, 30, 'MATCH 74 (R32)')}
                      {r32_5 && renderMatchCard(r32_5, 280, 130, 'MATCH 77 (R32)')}
                      {r32_1 && renderMatchCard(r32_1, 280, 230, 'MATCH 73 (R32)')}
                      {r32_3 && renderMatchCard(r32_3, 280, 330, 'MATCH 75 (R32)')}
                      {r32_11 && renderMatchCard(r32_11, 280, 430, 'MATCH 83 (R32)')}
                      {r32_12 && renderMatchCard(r32_12, 280, 530, 'MATCH 84 (R32)')}
                      {r32_9 && renderMatchCard(r32_9, 280, 630, 'MATCH 81 (R32)')}
                      {r32_10 && renderMatchCard(r32_10, 280, 730, 'MATCH 82 (R32)')}

                      {/* COLUMN 2: LEFT ROUND OF 16 (x: 520px) */}
                      <div className="text-[10px] font-mono font-bold text-emerald-400/80 absolute left-[520px] top-[10px] uppercase tracking-wider">Round of 16 Left</div>
                      {leftR16[0] && renderMatchCard(leftR16[0], 520, 80, 'R16 LEFT #1')}
                      {leftR16[1] && renderMatchCard(leftR16[1], 520, 280, 'R16 LEFT #2')}
                      {leftR16[2] && renderMatchCard(leftR16[2], 520, 480, 'R16 LEFT #3')}
                      {leftR16[3] && renderMatchCard(leftR16[3], 520, 680, 'R16 LEFT #4')}

                      {/* COLUMN 3: LEFT QUARTERFINALS (x: 760px) */}
                      <div className="text-[10px] font-mono font-bold text-emerald-500/85 absolute left-[760px] top-[10px] uppercase tracking-wider">Quarterfinals Left</div>
                      {leftQf[0] && renderMatchCard(leftQf[0], 760, 180, 'QF LEFT #1')}
                      {leftQf[1] && renderMatchCard(leftQf[1], 760, 580, 'QF LEFT #2')}

                      {/* COLUMN 4: LEFT SEMIFINAL (x: 1000px) */}
                      <div className="text-[10px] font-mono font-bold text-emerald-500 absolute left-[1000px] top-[10px] uppercase tracking-wider">Semifinal Left</div>
                      {leftSf[0] && renderMatchCard(leftSf[0], 1000, 380, 'SEMIFINAL LEFT')}


                      {/* COLUMN 5: SHOWCASE GOLD CENTERED GRAND FINAL (x: 1240px) */}
                      <div className="text-[10px] font-mono font-bold text-amber-400 absolute left-[1240px] top-[335px] uppercase tracking-widest text-center w-[200px] flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> World Cup Final
                      </div>
                      {finalMatch && (
                        <article
                          style={{ left: '1240px', top: '365px', position: 'absolute' }}
                          onClick={() => onMatchClick(finalMatch)}
                          className="w-[200px] h-[120px] bg-[#221c0f]/95 backdrop-blur-sm border-2 border-amber-500 hover:border-amber-400 p-2.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] flex flex-col justify-between rounded-sm pointer-events-auto hover:bg-[#2e2614] relative overflow-hidden group select-none"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>

                          <div className="flex justify-between items-center text-[8px] font-mono text-amber-400/80 uppercase tracking-wider pb-1 border-b border-white/5">
                            <span className="font-bold flex items-center gap-1"><Trophy className="w-2.5 h-2.5" /> METLIFE ARENA</span>
                            <span className="font-bold text-white bg-amber-600/30 px-1 py-0.2 rounded-xs select-none uppercase">
                              {finalMatch.status}
                            </span>
                          </div>

                          <div className="space-y-1.5 my-1">
                            {/* Team A */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {renderFlag(finalMatch.team_a_id, finalMatch.team_a_flag)}
                                <span className="font-sans font-black text-white text-[11px] truncate leading-none select-none">
                                  {finalMatch.team_a_name}
                                </span>
                              </div>
                              <span className="font-mono text-amber-500 text-[11px] font-black">
                                {finalMatch.team_a_score ?? '—'}
                              </span>
                            </div>

                            {/* Team B */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {renderFlag(finalMatch.team_b_id, finalMatch.team_b_flag)}
                                <span className="font-sans font-black text-white text-[11px] truncate leading-none select-none">
                                  {finalMatch.team_b_name}
                                </span>
                              </div>
                              <span className="font-mono text-amber-500 text-[11px] font-black">
                                {finalMatch.team_b_score ?? '—'}
                              </span>
                            </div>
                          </div>

                          {/* Prediction Footer */}
                          <div className="text-[8px] pt-1 border-t border-white/5 font-mono flex justify-between items-center bg-transparent mt-0.5">
                            {getPredictionStatus(finalMatch.id) ? (
                              <>
                                <span className="text-amber-400 font-bold uppercase flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Forecast Secured</span>
                                <span className="text-white font-mono bg-amber-500/20 px-1 py-0.2 border border-amber-500/30 rounded-xs">
                                  {getPredictionStatus(finalMatch.id)?.selection}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-zinc-500">Unplayed Match</span>
                                <span className="text-amber-400 font-black tracking-wide uppercase px-1.5 py-0.5 border border-amber-500/30 animate-pulse text-[7px] rounded-xs bg-amber-500/10">
                                  PREDICT
                                </span>
                              </>
                            )}
                          </div>
                        </article>
                      )}


                      {/* COLUMN 6: RIGHT SEMIFINAL (x: 1480px) */}
                      <div className="text-[10px] font-mono font-bold text-blue-500 absolute left-[1480px] top-[10px] uppercase tracking-wider">Semifinal Right</div>
                      {rightSf[0] && renderMatchCard(rightSf[0], 1480, 380, 'SEMIFINAL RIGHT')}

                      {/* COLUMN 7: RIGHT QUARTERFINALS (x: 1720px) */}
                      <div className="text-[10px] font-mono font-bold text-blue-500/85 absolute left-[1720px] top-[10px] uppercase tracking-wider">Quarterfinals Right</div>
                      {rightQf[0] && renderMatchCard(rightQf[0], 1720, 180, 'QF RIGHT #1')}
                      {rightQf[1] && renderMatchCard(rightQf[1], 1720, 580, 'QF RIGHT #2')}

                      {/* COLUMN 8: RIGHT ROUND OF 16 (x: 1960px) */}
                      <div className="text-[10px] font-mono font-bold text-blue-400/80 absolute left-[1960px] top-[10px] uppercase tracking-wider">Round of 16 Right</div>
                      {rightR16[0] && renderMatchCard(rightR16[0], 1960, 80, 'R16 RIGHT #1')}
                      {rightR16[1] && renderMatchCard(rightR16[1], 1960, 280, 'R16 RIGHT #2')}
                      {rightR16[2] && renderMatchCard(rightR16[2], 1960, 480, 'R16 RIGHT #3')}
                      {rightR16[3] && renderMatchCard(rightR16[3], 1960, 680, 'R16 RIGHT #4')}

                      {/* COLUMN 9: RIGHT ROUND OF 32 (x: 2200px) */}
                      <div className="text-[10px] font-mono font-bold text-blue-400/85 absolute left-[2200px] top-[10px] uppercase tracking-wider">Round of 32 Right</div>
                      {r32_4 && renderMatchCard(r32_4, 2200, 30, 'MATCH 76 (R32)')}
                      {r32_6 && renderMatchCard(r32_6, 2200, 130, 'MATCH 78 (R32)')}
                      {r32_7 && renderMatchCard(r32_7, 2200, 230, 'MATCH 79 (R32)')}
                      {r32_8 && renderMatchCard(r32_8, 2200, 330, 'MATCH 80 (R32)')}
                      {r32_14 && renderMatchCard(r32_14, 2200, 430, 'MATCH 86 (R32)')}
                      {r32_16 && renderMatchCard(r32_16, 2200, 530, 'MATCH 88 (R32)')}
                      {r32_13 && renderMatchCard(r32_13, 2200, 630, 'MATCH 85 (R32)')}
                      {r32_15 && renderMatchCard(r32_15, 2200, 730, 'MATCH 87 (R32)')}

                      {/* COLUMN 10: GROUPS RIGHT (x: 2440px) */}
                      <div className="text-[10px] font-mono font-bold text-[#2563eb] absolute left-[2440px] top-[10px] uppercase tracking-wider">Group Stage Right</div>
                      {renderGroupNode('G', 2440, 30)}
                      {renderGroupNode('H', 2440, 160)}
                      {renderGroupNode('I', 2440, 290)}
                      {renderGroupNode('J', 2440, 420)}
                      {renderGroupNode('K', 2440, 550)}
                      {renderGroupNode('L', 2440, 680)}
                    </>
                  );
                })()}

              </div>
            </div>
          </div>

          {/* DYNAMIC PITCH GROUP OVERLAY: CHERRY ON TOP CHRONOS BOX */}
          {selectedGroupLetter && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-[#1c1d1d] border border-[#d1d4d1]/20 rounded-sm w-full max-w-xl shadow-2xl flex flex-col max-h-[85%] select-none">
                
                {/* Overlay Header */}
                <div className="bg-zinc-900 border-b border-[#d1d4d1]/10 px-6 py-4 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[10px] font-mono text-[#3cac3b] font-bold tracking-widest uppercase">GROUP FIXTURES MODIFIER</span>
                    <h3 className="font-sans font-black italic uppercase text-white text-lg tracking-tight mt-0.5">Group {selectedGroupLetter} Roster Matches</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">Select a fixture to update values or save predictions.</p>
                  </div>
                  <button
                    onClick={() => setSelectedGroupLetter(null)}
                    className="text-zinc-500 hover:text-white font-sans text-xl font-bold p-1 cursor-pointer transition-colors focus:outline-none"
                  >
                    ×
                  </button>
                </div>

                {/* Fixtures layout */}
                <div className="p-4 overflow-y-auto max-h-[480px] space-y-2.5 custom-scrollbar bg-[#131414]">
                  {matches
                    .filter(m => m.round === 'GROUP' && m.group === `Group ${selectedGroupLetter}`)
                    .map(match => {
                      const pred = getPredictionStatus(match.id);
                      return (
                        <div
                          key={match.id}
                          onClick={() => {
                            setSelectedGroupLetter(null); // safely close and trigger
                            onMatchClick(match);
                          }}
                          className={`bg-[#1c1d1d] hover:bg-[#202222] border rounded-sm p-3 flex justify-between items-center cursor-pointer transition-all ${getHostBorder(match)}`}
                        >
                          <div className="flex-1">
                            <div className="flex gap-4 items-center">
                              {/* Team A */}
                              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                <span className="font-bold text-zinc-100 text-[11px] truncate">{match.team_a_name}</span>
                                {renderFlag(match.team_a_id, match.team_a_flag)}
                              </div>
                              {/* Score Spacer */}
                              <div className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 font-mono text-[10px] font-bold text-[#fafafa] rounded-xs shrink-0 min-w-[55px] text-center">
                                {match.team_a_score !== null ? `${match.team_a_score} - ${match.team_b_score}` : 'vs'}
                              </div>
                              {/* Team B */}
                              <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
                                {renderFlag(match.team_b_id, match.team_b_flag)}
                                <span className="font-bold text-zinc-100 text-[11px] truncate">{match.team_b_name}</span>
                              </div>
                            </div>
                            <div className="text-[8px] font-mono text-zinc-500 mt-1.5 text-center truncate">
                              {match.venue} • {new Date(match.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <div className="ml-4 pl-4 border-l border-[#d1d4d1]/5 shrink-0 select-none">
                            {pred ? (
                              <div className="text-right">
                                <span className="text-emerald-400 font-bold block text-[8px] uppercase tracking-wider">Forecast</span>
                                <span className="font-mono text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1 rounded-xs block mt-0.5">
                                  {pred.selection} ({pred.team_a_pred_score}-{pred.team_b_pred_score})
                                </span>
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[8px] uppercase tracking-wider block bg-emerald-500/10 border border-emerald-500/20 rounded-xs px-2 py-1 hover:bg-emerald-500/20">PREDICT</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Footer panel overlay button */}
                <div className="bg-[#1c1d1d] border-t border-[#d1d4d1]/10 px-6 py-3 flex justify-end shrink-0">
                  <button
                    onClick={() => setSelectedGroupLetter(null)}
                    className="bg-zinc-800 hover:bg-zinc-750 text-white font-sans text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-xs cursor-pointer transition-colors"
                  >
                    Close Group
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
