/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Profile, Match, Prediction, LedgerBlock, Player, TeamStats, Poll, PollVote } from './types';
import { ClientDBEngine } from './utils/dbEngine';

import MemberAccess from './components/MemberAccess';
import BracketView from './components/BracketView';
import LeaderboardView from './components/LeaderboardView';
import AdminConsole from './components/AdminConsole';
import MatchDetailModal from './components/MatchDetailModal';
import BackgroundVideo from './components/BackgroundVideo';
import PollsHubView from './components/PollsHubView';
import MyPredictionsView from './components/MyPredictionsView';

// @ts-expect-error - image asset loaded by Vite
import stadiumBg from './assets/images/stadium_background_1780500343243.png';

import { Trophy, ShieldAlert, Award, LogOut, Terminal, Users, Database, Globe } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const stored = sessionStorage.getItem('FWC2026_PREDICTOR_PROFILE');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [squads, setSquads] = useState<Record<string, Player[]>>({});
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({});
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [activeScreen, setActiveScreen] = useState<'BRACKET' | 'LEADERBOARD' | 'ADMIN_CONSOLE' | 'POLLS' | 'MY_PREDICTIONS'>('BRACKET');
  
  // Custom polls states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);

  // Selected match for prediction popup modal
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Database engine reference
  const dbRef = useRef<ClientDBEngine | null>(null);

  // Initialize and verify database on launch
  useEffect(() => {
    const initDB = async () => {
      const engine = new ClientDBEngine();
      await engine.initializeAndVerify();
      
      dbRef.current = engine;
      setMatches(engine.getMatches());
      setPredictions(engine.getPredictions());
      setLedger(engine.getLedger());
      setSquads(engine.getSquads());
      setTeamStats(engine.getTeamStats());
      setProfiles(engine.getProfiles());
      setPolls(engine.getPolls());
      setVotes(engine.getVotes());
      setIsTampered(engine.checkIsTampered());
    };
    initDB();
  }, []);

  const refreshLocalState = () => {
    if (!dbRef.current) return;
    setMatches([...dbRef.current.getMatches()]);
    setPredictions([...dbRef.current.getPredictions()]);
    setLedger([...dbRef.current.getLedger()]);
    setSquads({ ...dbRef.current.getSquads() });
    setTeamStats({ ...dbRef.current.getTeamStats() });
    setProfiles([...dbRef.current.getProfiles()]);
    setPolls([...dbRef.current.getPolls()]);
    setVotes([...dbRef.current.getVotes()]);
    setIsTampered(dbRef.current.checkIsTampered());
  };

  // Auth logins handler
  const handleAuthSuccess = (newProfile: Profile) => {
    setProfile(newProfile);
    sessionStorage.setItem('FWC2026_PREDICTOR_PROFILE', JSON.stringify(newProfile));
    
    // Automatically configure role actions in ledger
    if (dbRef.current) {
      dbRef.current.updateProfile(newProfile).then(() => {
        refreshLocalState();
      });
    }
  };

  const handleLogOut = () => {
    setProfile(null);
    sessionStorage.removeItem('FWC2026_PREDICTOR_PROFILE');
    localStorage.removeItem('FWC2026_PREDICTOR_PROFILE');
  };

  // Interactive Predictor submission
  const handleSubmitPrediction = async (matchId: string, selection: string, scoreA: number, scoreB: number) => {
    if (!dbRef.current) return { success: false, error: 'Database uninitialized.' };
    
    const res = await dbRef.current.submitPrediction(matchId, selection, scoreA, scoreB);
    if (res.success) {
      refreshLocalState();
    }
    return res;
  };

  // Admin Override
  const handleOverrideMatch = async (matchId: string, updates: Partial<Match>) => {
    if (!dbRef.current) return;
    await dbRef.current.overrideMatchStatus(matchId, updates);
    refreshLocalState();
  };

  // Tamper Simulation Trigger
  const handleSimulateTamper = async () => {
    if (!dbRef.current) return;
    await dbRef.current.simulateTampering();
    refreshLocalState();
  };

  // Reset database safely
  const handleResetDatabase = async () => {
    if (!dbRef.current) return;
    await dbRef.current.resetDatabaseToClean();
    refreshLocalState();
  };

  // If user session is not authenticated, render login access view
  if (!profile) {
    return <MemberAccess onSuccess={handleAuthSuccess} />;
  }

  return (
    <div 
      className="min-h-screen text-[#d1d4d1] font-sans flex flex-col relative pb-16 bg-[#08090a]"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(8, 9, 10, 0.2), rgba(8, 9, 10, 0.3)), url(${stadiumBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      
      {/* 📺 RESILIENT FULL-SCREEN AMBIENT STADIUM FOOTBALL VIDEO LOOP & LIGHT SHOW */}
      <BackgroundVideo opacity={0.85} brightness={0.85} />
      
      {/* Pitch tactical grid background design line markings */}
      <div className="absolute inset-0 opacity-[0.08] select-none pointer-events-none z-0 bg-[radial-gradient(#3cac3b_1.2px,transparent_1.2px)] [background-size:28px_28px]"></div>
      
      {/* ⚠️ SYSTEM RESYNC NOTIFICATION BAR */}
      {isTampered && profile.role === 'ADMIN' && (
        <div className="bg-[#e61d25] text-white py-2.5 px-4 font-mono text-xs text-center font-bold tracking-wider flex items-center justify-center gap-2 z-50 animate-pulse border-b border-white">
          <ShieldAlert className="w-4 h-4 shrink-0 fill-white text-[#e61d25]" />
          SYSTEM NOTIFICATION: DATABASE OUT OF SYNC. RESET THE DATA RECOVERY CLOCK IN ADMIN COCKPIT.
          <button
            onClick={() => setActiveScreen('ADMIN_CONSOLE')}
            className="underline ml-2 hover:text-[#d1d4d1] transition-colors"
          >
            Go To Recovery Desk
          </button>
        </div>
      )}

      {/* NAV BANNER BAR */}
      <header className="bg-[#1a1a1a] border-b border-[#d1d4d1]/10 z-40 sticky top-0">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Brand Brandings */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveScreen('BRACKET')}>
            <div className="w-10 h-10 bg-white flex items-center justify-center font-bold text-black rounded-sm">
              <span className="font-sans font-black text-xs">26</span>
            </div>
            <div>
              <span className="font-sans font-black text-lg tracking-tighter text-white uppercase block leading-none">
                FIFA World Cup
              </span>
              <span className="text-[10px] font-sans tracking-widest text-[#d1d4d1]/60 uppercase block mt-0.5">
                Prediction Engine v2.0.4
              </span>
            </div>
          </div>

          {/* Active Navigation anchor pads */}
          <nav className="flex gap-4 text-xs font-bold tracking-widest uppercase">
            <button
              onClick={() => setActiveScreen('BRACKET')}
              id="nav-to-bracket"
              className={`pb-1 transition-colors relative font-sans ${
                activeScreen === 'BRACKET' ? 'text-[#e61d25] border-b-2 border-[#e61d25]' : 'text-[#d1d4d1]/60 hover:text-white'
              }`}
            >
              Bracket
            </button>
            
            <button
              onClick={() => setActiveScreen('LEADERBOARD')}
              id="nav-to-leaderboard"
              className={`pb-1 transition-colors relative font-sans ${
                activeScreen === 'LEADERBOARD' ? 'text-[#e61d25] border-b-2 border-[#e61d25]' : 'text-[#d1d4d1]/60 hover:text-white'
              }`}
            >
              Leaderboard
            </button>

            <button
              onClick={() => setActiveScreen('MY_PREDICTIONS')}
              id="nav-to-my-predictions"
              className={`pb-1 transition-colors relative font-sans ${
                activeScreen === 'MY_PREDICTIONS' ? 'text-[#e61d25] border-b-2 border-[#e61d25]' : 'text-[#d1d4d1]/60 hover:text-white'
              }`}
            >
              My Predictions
            </button>

            <button
              onClick={() => setActiveScreen('POLLS')}
              id="nav-to-polls"
              className={`pb-1 transition-colors relative font-sans ${
                activeScreen === 'POLLS' ? 'text-[#e61d25] border-b-2 border-[#e61d25]' : 'text-[#d1d4d1]/60 hover:text-white'
              }`}
            >
              Fan Polls
            </button>

            {profile.role === 'ADMIN' && (
              <button
                onClick={() => setActiveScreen('ADMIN_CONSOLE')}
                id="nav-to-admin"
                className={`pb-1 transition-colors relative font-sans ${
                  activeScreen === 'ADMIN_CONSOLE' ? 'text-[#e61d25] border-b-2 border-[#e61d25]' : 'text-[#d1d4d1]/60 hover:text-white'
                }`}
              >
                Admin
              </button>
            )}
          </nav>

          {/* User badge container */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-sans font-extrabold text-[10px] text-[#3cac3b] uppercase">
                Security: Verified
              </div>
              <div className="font-mono text-xs text-white">
                ID: {profile.employee_id}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full border border-[#d1d4d1]/20 bg-[#474a4a] flex items-center justify-center text-sm font-bold text-white uppercase" title={profile.fullName}>
              {profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>

            <button
              onClick={handleLogOut}
              className="border border-[#d1d4d1]/10 hover:bg-white/5 p-2 text-[#d1d4d1]/60 hover:text-white transition-all cursor-pointer rounded-sm"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN SCREEN ROUTER */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 relative z-10">
        
        {/* VIEW 1: BRACKET VIEW PORTAL */}
        {activeScreen === 'BRACKET' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
              <div>
                <span className="font-mono text-[10px] text-[#3cac3b] uppercase tracking-widest font-bold">
                  2026 TOURNAMENT ROADMAP
                </span>
                <h2 className="font-sans text-2xl font-black italic uppercase text-white tracking-tighter">
                  Knockout Stage <span className="text-[#d1d4d1]/40 font-normal">/ Rounds 16 & 8</span>
                </h2>
                <p className="text-sm text-[#d1d4d1]/70 mt-1 max-w-2xl">
                  Select matches to view dynamic tournament trees, analyze current lineups, and save your prediction forecasts before runoff.
                </p>
              </div>

              {/* Host nations logo line bar */}
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#2a398d]/10 border border-[#2a398d]/20 px-3 py-1 text-[10px] font-mono text-blue-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2a398d]"></span> USA CORE
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#3cac3b]/10 border border-[#3cac3b]/20 px-3 py-1 text-[10px] font-mono text-emerald-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3cac3b]"></span> MEXICO CORE
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#e61d25]/10 border border-[#e61d25]/20 px-3 py-1 text-[10px] font-mono text-rose-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e61d25]"></span> CANADA CORE
                </span>
              </div>
            </div>

            {/* Bracket View Container */}
            <BracketView
              matches={matches}
              predictions={predictions}
              onMatchClick={(m) => setSelectedMatch(m)}
            />
          </section>
        )}

        {/* VIEW 2: GLOBAL LEADERBOARD */}
        {activeScreen === 'LEADERBOARD' && <LeaderboardView profiles={profiles} />}

        {/* VIEW 4: FAN POLL HUB */}
        {activeScreen === 'POLLS' && (
          <PollsHubView
            profile={profile}
            polls={polls}
            votes={votes}
            onSubmitVote={async (pollId, optionId) => {
              if (!dbRef.current) return { success: false, error: 'Database uninitialized' };
              const res = await dbRef.current.submitVote(pollId, optionId);
              if (res.success) {
                refreshLocalState();
              }
              return res;
            }}
          />
        )}

        {/* VIEW 5: MY PREDICTIONS */}
        {activeScreen === 'MY_PREDICTIONS' && (
          <MyPredictionsView
            matches={matches}
            predictions={predictions}
            currentUserId={profile.id}
            onMatchClick={(m) => setSelectedMatch(m)}
          />
        )}

        {/* VIEW 3: ADMIN INSTRUMENT CONSOLE */}
        {activeScreen === 'ADMIN_CONSOLE' && profile.role === 'ADMIN' && (
          <AdminConsole
            matches={matches}
            ledger={ledger}
            isTampered={isTampered}
            onOverrideMatch={handleOverrideMatch}
            onSimulateTamper={handleSimulateTamper}
            onResetDatabase={handleResetDatabase}
          />
        )}

      </main>

      {/* POPUP FORECAST DETAILS MODAL WINDOW */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          predictions={predictions}
          squads={squads}
          teamStats={teamStats}
          onClose={() => setSelectedMatch(null)}
          onSubmitPrediction={handleSubmitPrediction}
        />
      )}

      {/* SYSTEM STICKER */}
      <footer className="absolute bottom-4 left-0 right-0 px-4 md:px-8 text-center opacity-40 pointer-events-none select-none z-10">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center text-[10px] font-mono tracking-wider">
          <span>HOST CODES: CAN | MEX | USA</span>
          <span className="flex items-center gap-1.5 uppercase">
            <Globe className="w-3.5 h-3.5 text-[#3cac3b]" /> INTERNAL CORPORATE SYSTEM PLATFORM
          </span>
        </div>
      </footer>

    </div>
  );
}
