/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Match, Prediction, Player, TeamStats } from '../types';
import { OFFICIAL_ROSTERS, OFFICIAL_TEAM_STATS } from '../data';
import { ShieldAlert, Users, Calendar, Award, CheckCircle, LineChart, MessageSquareCode } from 'lucide-react';

interface MatchDetailModalProps {
  match: Match;
  predictions: Prediction[];
  squads?: Record<string, Player[]>;
  teamStats?: Record<string, TeamStats>;
  onClose: () => void;
  onSubmitPrediction: (matchId: string, selection: string, scoreA: number, scoreB: number) => Promise<{ success: boolean; error?: string }>;
}

export default function MatchDetailModal({
  match,
  predictions,
  squads,
  teamStats,
  onClose,
  onSubmitPrediction
}: MatchDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'MATCH' | 'TEAM_SQUAD'>('MATCH');
  
  // Find current prediction for this match
  const existingPred = predictions.find(p => p.match_id === match.id);
  
  // Predictor inputs
  const [teamAScore, setTeamAScore] = useState<number>(existingPred ? existingPred.team_a_pred_score : 1);
  const [teamBScore, setTeamBScore] = useState<number>(existingPred ? existingPred.team_b_pred_score : 1);
  const [selection, setSelection] = useState<string>(existingPred ? existingPred.selection : match.team_a_id);
  
  // Roster profiles active team selection
  const [selectedTeamProfile, setSelectedTeamProfile] = useState<'A' | 'B'>('A');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Checks temporal lockout using customizable prediction locking deadline if available, otherwise kickoff start_time
  const deadlineStr = match.prediction_deadline || match.start_time;
  const isMatchStarted = new Date(deadlineStr).getTime() < Date.now();

  const renderFlag = (teamId: string, flagField: string) => {
    if (!flagField || flagField === 'TBD' || teamId.startsWith('TBD')) {
      return (
        <div className="w-8 h-5 bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-[9px] text-zinc-500 rounded-xs inline-block">
          ?
        </div>
      );
    }
    if (flagField.startsWith('http') || flagField.includes('/') || flagField.includes('.')) {
      return (
        <img
          src={flagField}
          alt={teamId}
          className="w-10 h-6.5 object-cover rounded-xs inline-block shadow-sm border border-white/10 mx-auto"
          referrerPolicy="no-referrer"
        />
      );
    }
    const flagMap: Record<string, string> = {
      "USA": "us", "MEX": "mx", "CAN": "ca", "ARG": "ar", "BRA": "br", "FRA": "fr", "ENG": "gb", "ESP": "es", "GER": "de", "ITA": "it", "POR": "pt", "BEL": "be", "NED": "nl", "CRO": "hr", "URU": "uy", "COL": "co", "SEN": "sn", "MAR": "ma", "JPN": "jp", "KOR": "kr", "AUS": "au", "NZL": "nz", "EGY": "eg", "NGA": "ng", "CMR": "cm", "RSA": "za", "MAR1": "ma", "ALG": "dz", "TUN": "tn", "KSA": "sa", "IRN": "ir", "IRQ": "iq", "UAE": "ae", "QAT": "qa", "UZB": "uz", "CHN": "cn", "IND": "in", "VIE": "vn", "THA": "th", "JAM": "jm", "CRC": "cr", "PAN": "pa", "HON": "hn", "SLV": "sv", "ECU": "ec", "PAR": "py", "CHI": "cl", "PER": "pe", "VEN": "ve", "BOL": "bo", "PAR1": "py", "SWE": "se", "SUI": "ch", "AUT": "at", "DEN": "dk", "NOR": "no", "POL": "pl", "UKR": "ua", "CZE": "cz", "ROU": "ro", "GRE": "gr", "TUR": "tr", "SCO": "gb-sct", "WAL": "gb-wls", "NIR": "gb-nir", "IRL": "ie", "FIN": "fi", "ISL": "is"
    };
    const iso = flagMap[teamId] || flagMap[flagField] || flagField.toLowerCase();
    return (
      <img
        src={`https://flagcdn.com/40x30/${iso}.png`}
        alt={teamId}
        className="w-10 h-6.5 object-cover rounded-xs inline-block shadow-sm border border-white/10 mx-auto"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatchStarted) {
      setErrorMsg(`This match prediction window is closed. Stopped on: ${new Date(deadlineStr).toLocaleString()}`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await onSubmitPrediction(match.id, selection, teamAScore, teamBScore);
      if (res.success) {
        setSuccessMsg('Prediction secured cryptographically to the local ledger! SHA-256 block updated.');
      } else {
        setErrorMsg(res.error || 'Submission failed.');
      }
    } catch (err: any) {
      setErrorMsg('Submission error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (code: string) => {
    if (code === match.team_a_id) return match.team_a_name;
    if (code === match.team_b_id) return match.team_b_name;
    return code;
  };

  // Dynamic database roster & profiles fetching
  const teamCode = selectedTeamProfile === 'A' ? match.team_a_id : match.team_b_id;
  const teamNameStr = selectedTeamProfile === 'A' ? match.team_a_name : match.team_b_name;
  const roster: Player[] = (squads && squads[teamCode]) || OFFICIAL_ROSTERS[teamCode] || [];
  const stats: TeamStats = (teamStats && teamStats[teamCode]) || OFFICIAL_TEAM_STATS[teamCode];

  // Helper flags representing hosting colors
  const hostColors: Record<string, string> = {
    USA: 'border-b-4 border-[#2a398d]',
    MEX: 'border-b-4 border-[#3cac3b]',
    CAN: 'border-b-4 border-[#e61d25]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#252727] border border-[#d1d4d1]/10 text-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh] rounded-sm">
        
        {/* Dynamic header country banner bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#3cac3b] via-[#242526] to-[#01a2e8]"></div>

        {/* Modal Header */}
        <header className="flex justify-between items-start p-6 bg-[#1f2020] border-b border-[#d1d4d1]/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] tracking-widest text-[#3cac3b] uppercase font-bold">
                ESTADIO VENUE WORKFLOW
              </span>
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded text-white font-bold tracking-wider ${
                match.status === 'LIVE' ? 'bg-[#3cac3b] animate-pulse text-white' :
                match.status === 'COMPLETED' ? 'bg-zinc-700' : 'bg-blue-900'
              }`}>
                {match.status}
              </span>
            </div>
            <h3 className="font-sans text-3xl text-white font-black uppercase tracking-tight">
              {match.team_a_name} vs {match.team_b_name}
            </h3>
            <p className="text-xs text-[#d1d4d1]/70 font-sans flex flex-wrap items-center gap-2 mt-1">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#3cac3b]" /> {new Date(match.start_time).toLocaleString()} | {match.venue}</span>
              {match.prediction_deadline && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase rounded-sm flex items-center gap-1">
                  <span>⏱️ Locks:</span>
                  <span>{new Date(match.prediction_deadline).toLocaleString()}</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#d1d4d1]/60 hover:text-white border border-[#d1d4d1]/10 p-2 hover:bg-white/5 cursor-pointer rounded-sm"
          >
            <span className="material-symbols-outlined block text-xl">close</span>
          </button>
        </header>

        {/* Modal Navigation Tabs */}
        <nav className="flex bg-[#1f2020] border-b border-[#d1d4d1]/10">
          <button
            onClick={() => setActiveTab('MATCH')}
            className={`flex-1 py-3 text-center font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'MATCH'
                ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
                : 'text-[#d1d4d1]/50 hover:bg-[#252727]/50'
            }`}
          >
            <Award className="w-4 h-4 text-[#3cac3b]" /> Match Forecast Hub
          </button>
          <button
            onClick={() => setActiveTab('TEAM_SQUAD')}
            className={`flex-1 py-3 text-center font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'TEAM_SQUAD'
                ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
                : 'text-[#d1d4d1]/50 hover:bg-[#252727]/50'
            }`}
          >
            <Users className="w-4 h-4 text-[#3cac3b]" /> Squad rosters & profiles
          </button>
        </nav>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#252727]">
          
          {/* TAB 1: MATCH DETAILS & PREDICTION submissions */}
          {activeTab === 'MATCH' && (
            <div className="space-y-6">
              
              {/* Score Display banner block */}
              <div className="bg-[#1f2020] border border-[#d1d4d1]/10 p-4 rounded-sm flex items-center justify-between text-center relative overflow-hidden">
                <div className="flex-1 flex flex-col items-center">
                  {renderFlag(match.team_a_id, match.team_a_flag)}
                  <span className="font-sans text-2xl font-black block text-white uppercase tracking-widest mt-1.5">{match.team_a_id}</span>
                  <span className="text-[10px] text-[#d1d4d1]/60 font-sans block">{match.team_a_name}</span>
                </div>
                
                {match.status !== 'SCHEDULED' ? (
                  <div className="flex flex-col items-center justify-center px-4">
                    <div className="font-mono text-4xl font-extrabold text-[#3cac3b]">
                      {match.team_a_score} — {match.team_b_score}
                    </div>
                    <span className="text-[9px] text-[#3cac3b] font-mono tracking-widest mt-1">OFFICIAL SCORE</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-x border-[#d1d4d1]/10 px-8">
                    <span className="text-xl font-bold font-mono tracking-widest text-[#d1d4d1]/40">VS</span>
                    <span className="text-[9px] text-[#d1d4d1]/50 font-sans mt-0.5">UNPLAYED</span>
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center">
                  {renderFlag(match.team_b_id, match.team_b_flag)}
                  <span className="font-sans text-2xl font-black block text-white uppercase tracking-widest mt-1.5">{match.team_b_id}</span>
                  <span className="text-[10px] text-[#d1d4d1]/60 font-sans block">{match.team_b_name}</span>
                </div>
              </div>

              {/* INTEGRITY / TEMPORAL WINDOW WARNING */}
              {isMatchStarted ? (
                <div className="p-4 bg-rose-500/10 border-l-4 border-rose-500 flex gap-3 text-xs leading-relaxed text-rose-300 rounded-sm">
                  <ShieldAlert className="w-6 h-6 shrink-0 text-rose-400" />
                  <div>
                    <span className="block font-bold uppercase tracking-wide text-white">TEMPORAL WINDOW LOCKED</span>
                    Match has kicked off. Prediction formulas are locked securely inside the ledger. No further edits are possible.
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border-l-4 border-[#3cac3b] flex gap-3 text-xs text-emerald-300 rounded-sm">
                  <CheckCircle className="w-5 h-5 shrink-0 text-[#3cac3b]" />
                  <div>
                    <span className="block font-bold uppercase tracking-wide text-white font-sans">WINDOW ELIGIBLE</span>
                    This prediction remains fully unlocked. Submit forecasts below to sync directly onto the tamper-proof ledger.
                  </div>
                </div>
              )}

              {/* Secure interactive input forecasts */}
              <form onSubmit={handlePredictSubmit} className="space-y-6">
                <div className="bg-[#1f2020] border border-[#d1d4d1]/10 p-4 space-y-4 rounded-sm">
                  <h4 className="font-sans text-lg font-bold uppercase tracking-wider text-[#3cac3b] flex items-center gap-2 border-b border-[#d1d4d1]/10 pb-2">
                    Enter Predicted Results
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Team A Predict input */}
                    <div className="space-y-1.5">
                      <label htmlFor="teamAGoals" className="text-xs text-[#d1d4d1]/70 block font-mono">
                        {match.team_a_name} Goals
                      </label>
                      <input
                        id="teamAGoals"
                        type="number"
                        min="0"
                        max="12"
                        value={teamAScore}
                        disabled={isMatchStarted}
                        onChange={(e) => setTeamAScore(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#252727] border border-[#d1d4d1]/20 text-white font-mono text-center py-2 text-xl focus:border-[#3cac3b] outline-none disabled:opacity-50 rounded-sm"
                      />
                    </div>

                    {/* Team B Predict input */}
                    <div className="space-y-1.5">
                      <label htmlFor="teamBGoals" className="text-xs text-[#d1d4d1]/70 block font-mono">
                        {match.team_b_name} Goals
                      </label>
                      <input
                        id="teamBGoals"
                        type="number"
                        min="0"
                        max="12"
                        value={teamBScore}
                        disabled={isMatchStarted}
                        onChange={(e) => setTeamBScore(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#252727] border border-[#d1d4d1]/20 text-white font-mono text-center py-2 text-xl focus:border-[#3cac3b] outline-none disabled:opacity-50 rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Who will win dropdown selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="forecastWinner" className="text-xs text-[#d1d4d1]/70 block font-mono">
                      Forecast Winner Selection (Advancement Track)
                    </label>
                    <select
                      id="forecastWinner"
                      value={selection}
                      disabled={isMatchStarted}
                      onChange={(e) => setSelection(e.target.value)}
                      className="w-full bg-[#252727] border border-[#d1d4d1]/20 text-white px-3 py-2 text-sm focus:border-[#3cac3b] focus:ring-0 outline-none disabled:opacity-50 rounded-sm"
                    >
                      <option value={match.team_a_id}>{match.team_a_name} ({match.team_a_id})</option>
                      <option value={match.team_b_id}>{match.team_b_name} ({match.team_b_id})</option>
                    </select>
                  </div>
                </div>

                {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/35 text-rose-400 text-xs font-mono rounded-sm">{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-emerald-500/10 border border-[#3cac3b]/30 border-l-4 border-l-[#3cac3b] text-xs text-white rounded-sm">{successMsg}</div>}

                {/* Submit button */}
                {!isMatchStarted && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white font-sans font-bold text-lg py-3 tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm"
                  >
                    {loading ? 'Securing Ledger block...' : 'Secure Predictions on Blockchain'}
                    <span className="material-symbols-outlined">gpp_maybe</span>
                  </button>
                )}
              </form>

              {/* Showing current user prediction state */}
              {existingPred && (
                <div className="p-4 bg-black/30 border border-[#d1d4d1]/10 text-[#d1d4d1] space-y-2 rounded-sm">
                  <div className="text-[10px] text-[#3cac3b] font-mono uppercase tracking-wider font-extrabold flex items-center gap-1">
                    <MessageSquareCode className="w-3.5 h-3.5 text-[#3cac3b]" /> ACTIVE LEDGER BLOCK PREDICT
                  </div>
                  <div className="grid grid-cols-2 text-xs divide-x divide-[#d1d4d1]/10">
                    <div className="p-1">
                      <span className="text-[#d1d4d1]/40 font-mono block">ADVANCING CRITICAL TRACK:</span>
                      <span className="text-white font-bold">{getTeamName(existingPred.selection)}</span>
                    </div>
                    <div className="p-1 pl-4">
                      <span className="text-[#d1d4d1]/40 font-mono block">PROJECTED SCORE:</span>
                      <span className="text-[#3cac3b] font-mono font-bold text-sm">
                        {existingPred.team_a_pred_score} — {existingPred.team_b_pred_score}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEAM PROFILES & SQUAD LISTS WRITTEN DYNAMICALLY */}
          {activeTab === 'TEAM_SQUAD' && (
            <div className="space-y-6">
              
              {/* Dynamic Profiles Switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTeamProfile('A')}
                  className={`flex-1 py-1.5 font-sans font-bold text-xs border uppercase tracking-wider transition-all cursor-pointer rounded-sm ${
                    selectedTeamProfile === 'A'
                      ? 'bg-[#3cac3b] text-white border-transparent'
                      : 'bg-transparent text-[#d1d4d1] border-[#d1d4d1]/20 hover:bg-[#1f2020]'
                  }`}
                >
                  {match.team_a_name} Details
                </button>
                <button
                  onClick={() => setSelectedTeamProfile('B')}
                  className={`flex-1 py-1.5 font-sans font-bold text-xs border uppercase tracking-wider transition-all cursor-pointer rounded-sm ${
                    selectedTeamProfile === 'B'
                      ? 'bg-[#3cac3b] text-white border-transparent'
                      : 'bg-transparent text-[#d1d4d1] border-[#d1d4d1]/20 hover:bg-[#1f2020]'
                  }`}
                >
                  {match.team_b_name} Details
                </button>
              </div>

              {/* Statistics Panel Overview */}
              {stats && (
                <section className="grid grid-cols-3 gap-2 bg-black/30 p-3 text-center border border-[#d1d4d1]/10 rounded-sm">
                  <div className="border-r border-[#d1d4d1]/10">
                    <span className="text-[9px] text-[#d1d4d1]/50 block font-mono">WIN PROBABILITY</span>
                    <span className="text-xl font-sans font-bold text-[#3cac3b]">{stats.winProbability}%</span>
                  </div>
                  <div className="border-r border-[#d1d4d1]/10">
                    <span className="text-[9px] text-[#d1d4d1]/50 block font-mono">AVG GOALS/GAME</span>
                    <span className="text-xl font-sans font-bold text-emerald-300">{stats.avgGoalsGame}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#d1d4d1]/50 block font-mono">CLEAN SHEETS</span>
                    <span className="text-xl font-sans font-bold text-white">{stats.cleanSheets}</span>
                  </div>
                </section>
              )}

              {/* MOMENTUM LINE CHART (Pure SVG rendering!) */}
              {stats && stats.momentum && (
                <section className="bg-[#1f2020] border border-[#d1d4d1]/10 p-4 space-y-2 rounded-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#d1d4d1]/70 flex items-center gap-1.5">
                      <LineChart className="w-3.5 h-3.5 text-[#3cac3b]" /> Recent Form Momentum Rating
                    </span>
                    <span className="font-mono text-[9px] text-[#3cac3b] font-bold">PAST 5 WORLD MATCHES</span>
                  </div>
                  
                  {/* Custom SVG line representing real momentum fluctuations */}
                  <div className="h-20 w-full relative flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradient-momentum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3cac3b" stopOpacity="0.3"></stop>
                          <stop offset="100%" stopColor="#3cac3b" stopOpacity="0.0"></stop>
                        </linearGradient>
                      </defs>
                      
                      {/* Area graph */}
                      <path
                        d={`M 0 100 
                            L 0 ${100 - stats.momentum[0]} 
                            L 25 ${100 - stats.momentum[1]} 
                            L 50 ${100 - stats.momentum[2]} 
                            L 75 ${100 - stats.momentum[3]} 
                            L 100 ${100 - stats.momentum[4]} 
                            L 100 100 Z`}
                        fill="url(#gradient-momentum)"
                      />

                      {/* Smooth polyline path mapping */}
                      <polyline
                        fill="none"
                        stroke="#3cac3b"
                        strokeWidth="3.5"
                        points={`0,${100 - stats.momentum[0]} 25,${100 - stats.momentum[1]} 50,${100 - stats.momentum[2]} 75,${100 - stats.momentum[3]} 100,${100 - stats.momentum[4]}`}
                        className="opacity-90"
                      />
                      
                      {/* Circular milestone nodes */}
                      <circle cx="0" cy={100 - stats.momentum[0]} r="3" fill="#ffffff" />
                      <circle cx="25" cy={100 - stats.momentum[1]} r="3" fill="#ffffff" />
                      <circle cx="50" cy={100 - stats.momentum[2]} r="3" fill="#ffffff" />
                      <circle cx="75" cy={100 - stats.momentum[3]} r="3" fill="#ffffff" />
                      <circle cx="100" cy={100 - stats.momentum[4]} r="3" fill="#ffffff" />
                    </svg>
                  </div>
                  
                  <div className="flex justify-between font-mono text-[9px] text-[#d1d4d1]/35 pt-1">
                    <span>M-1</span>
                    <span>M-2</span>
                    <span>M-3</span>
                    <span>M-4</span>
                    <span>LATEST</span>
                  </div>
                </section>
              )}

              {/* Roster Squad table list */}
              <section className="space-y-2">
                <span className="font-sans text-sm font-bold uppercase tracking-wider text-white">Full Squad Roster ({teamNameStr})</span>
                
                <div className="bg-[#1f2020] border border-[#d1d4d1]/10 overflow-hidden rounded-sm">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-[#d1d4d1]/10 text-[#d1d4d1]/40 font-mono text-[10px] bg-black/20">
                        <th className="py-2 px-3 font-normal">#</th>
                        <th className="py-2 px-3 font-normal">Name</th>
                        <th className="py-2 px-3 font-normal">Pos</th>
                        <th className="py-2 px-3 font-normal text-right">Goals</th>
                        <th className="py-2 px-3 font-normal text-right">Assists</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d1d4d1]/10 text-white/90">
                      {roster.length > 0 ? (
                        roster.map((player) => (
                           <tr key={player.jerseyNumber} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-[#3cac3b]">
                              #{player.jerseyNumber}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                {player.image ? (
                                  <img
                                    src={player.image}
                                    alt={player.name}
                                    referrerPolicy="no-referrer"
                                    className="w-7 h-7 rounded-full border border-white/10 object-cover shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#1e2620] border border-[#3cac3b]/25 flex items-center justify-center font-mono font-black text-[8px] text-[#3cac3b] shrink-0">
                                    {player.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold">{player.name}</div>
                                  <div className="text-[10px] text-[#d1d4d1]/40 font-mono">{player.club}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-emerald-300">
                              {player.position}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {player.goals}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {player.assists}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#d1d4d1]/50 font-mono">
                            No team profile fetched from database context.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="p-4 bg-[#1f2020] border-t border-[#d1d4d1]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 font-sans font-bold bg-[#252727] hover:bg-white/5 text-[#d1d4d1] border border-[#d1d4d1]/10 text-xs uppercase tracking-widest cursor-pointer rounded-sm"
          >
            Close Viewer
          </button>
        </footer>
      </div>
    </div>
  );
}
