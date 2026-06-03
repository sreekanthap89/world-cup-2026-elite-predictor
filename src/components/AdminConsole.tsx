/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, Profile, LedgerBlock, Prediction, Player, TeamStats, Poll, PollVote } from '../types';
import { ClientDBEngine } from '../utils/dbEngine';
import { 
  ShieldCheck, 
  ShieldX, 
  Database, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check, 
  Bolt, 
  Users, 
  AlertTriangle, 
  Trash2, 
  UserPlus, 
  Search, 
  Eye, 
  X, 
  Calendar, 
  MapPin, 
  UserCheck, 
  TrendingUp, 
  Award,
  Globe,
  Plus,
  Vote
} from 'lucide-react';

interface AdminConsoleProps {
  matches: Match[];
  ledger: LedgerBlock[];
  isTampered: boolean;
  onOverrideMatch: (matchId: string, updates: Partial<Match>) => Promise<void>;
  onSimulateTamper: () => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export default function AdminConsole({
  matches,
  ledger,
  isTampered,
  onOverrideMatch,
  onSimulateTamper,
  onResetDatabase
}: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'USERS' | 'LEDGER' | 'SYSTEM_SCHEMAS' | 'SQUADS' | 'POLLS' | 'ALL_PREDICTIONS'>('CONTROLS');
  
  // Database instance reference
  const [db] = useState(() => new ClientDBEngine());
  
  // Dynamic state loaded on mount/update
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [predictionsList, setPredictionsList] = useState<Prediction[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);

  // Custom new poll creation form state
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [newPollReward, setNewPollReward] = useState<number>(300);
  
  // Edit schedule state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [inputScoreA, setInputScoreA] = useState<number>(0);
  const [inputScoreB, setInputScoreB] = useState<number>(0);
  const [inputStatus, setInputStatus] = useState<'SCHEDULED' | 'LIVE' | 'COMPLETED'>('SCHEDULED');
  const [inputVenue, setInputVenue] = useState('');
  const [inputKickoff, setInputKickoff] = useState('');
  const [inputDeadline, setInputDeadline] = useState(''); // Prediction locking target deadline
  const [inputHost, setInputHost] = useState<'USA' | 'MEXICO' | 'CANADA'>('USA');
  const [inputTeamAName, setInputTeamAName] = useState('');
  const [inputTeamBName, setInputTeamBName] = useState('');
  const [inputTeamAFlag, setInputTeamAFlag] = useState('');
  const [inputTeamBFlag, setInputTeamBFlag] = useState('');
  const [inputTeamAID, setInputTeamAID] = useState('');
  const [inputTeamBID, setInputTeamBID] = useState('');

  // TEAM & SQUAD PROFILE EDITORS forms state
  const [selectedTeamCode, setSelectedTeamCode] = useState<string>('USA');
  const [teamWinProb, setTeamWinProb] = useState<number>(50);
  const [teamAvgGoals, setTeamAvgGoals] = useState<number>(1.5);
  const [teamCleanSheets, setTeamCleanSheets] = useState<string>('25%');
  const [teamMomentum, setTeamMomentum] = useState<string>('10,20,15,45,5');
  const [teamFlagUrl, setTeamFlagUrl] = useState<string>('');
  
  // Players roster list editors states
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [playerJersey, setPlayerJersey] = useState<number>(10);
  const [playerName, setPlayerName] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<string>('MID');
  const [playerClub, setPlayerClub] = useState<string>('');
  const [playerGoals, setPlayerGoals] = useState<number>(0);
  const [playerAssists, setPlayerAssists] = useState<number>(0);
  const [playerImage, setPlayerImage] = useState<string>('');
  const [isAddingPlayer, setIsAddingPlayer] = useState<boolean>(false);

  // Search/Filter users
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search/Filter matches
  const [matchSearch, setMatchSearch] = useState('');
  const [roundFilter, setRoundFilter] = useState<'ALL' | 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL'>('ALL');
  
  // View specific user's prediction sheets state
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedUserPreds, setSelectedUserPreds] = useState<Prediction[]>([]);

  // Simulation success messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add simulated user form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEmpId, setFormEmpId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'ANALYST' | 'ADMIN'>('ANALYST');

  const [copied, setCopied] = useState(false);

  // Sync profiles and predictions from local database on state change
  const reloadDbState = () => {
    setProfiles(db.getProfiles());
    setPredictionsList(db.getPredictions());
    setPolls(db.getPolls());
    setVotes(db.getVotes());
  };

  useEffect(() => {
    reloadDbState();
  }, []);

  const handleAddNewOptionField = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (newPollOptions.length <= 2) return;
    const cp = [...newPollOptions];
    cp.splice(idx, 1);
    setNewPollOptions(cp);
  };

  const handleUpdateOptionField = (idx: number, val: string) => {
    const cp = [...newPollOptions];
    cp[idx] = val;
    setNewPollOptions(cp);
  };

  const handleCreatePollOnServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) {
      alert("Poll question is required.");
      return;
    }
    const finalOptions = newPollOptions.filter(o => o.trim() !== '');
    if (finalOptions.length < 2) {
      alert("At least 2 valid options are required.");
      return;
    }

    const res = await db.createPoll(newPollQuestion, finalOptions, newPollReward);
    if (res.success) {
      setSuccessMsg("Custom FWC 2026 Poll published successfully to the database!");
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setNewPollReward(300);
      reloadDbState();
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert(res.error || "Failed to create poll.");
    }
  };

  const handleResolvePollOnServer = async (pollId: string, optionId: string) => {
    if (window.confirm("Are you sure you want to resolve this poll? Correct guesses will be immediately rewarded with points and standings will update.")) {
      const res = await db.resolvePoll(pollId, optionId);
      if (res.success) {
        setSuccessMsg("Poll closed and resolved successfully! Calculated rewards added to winning standings.");
        reloadDbState();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.error || "Failed to resolve poll.");
      }
    }
  };

  const teamsList = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { code: string; name: string; flag: string }[] = [];
    matches.forEach(m => {
      if (m.round === 'GROUP') {
        if (m.team_a_id && !seen.has(m.team_a_id)) {
          seen.add(m.team_a_id);
          list.push({ code: m.team_a_id, name: m.team_a_name, flag: m.team_a_flag });
        }
        if (m.team_b_id && !seen.has(m.team_b_id)) {
          seen.add(m.team_b_id);
          list.push({ code: m.team_b_id, name: m.team_b_name, flag: m.team_b_flag });
        }
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  // Load selected team statistics on select triggers
  useEffect(() => {
    const statsObj = db.getTeamStats();
    const stats = statsObj[selectedTeamCode] || { winProbability: 50, avgGoalsGame: 1.5, cleanSheets: '0%', momentum: [0,0,0,0,0], flagUrl: '' };
    setTeamWinProb(stats.winProbability);
    setTeamAvgGoals(stats.avgGoalsGame);
    setTeamCleanSheets(stats.cleanSheets);
    setTeamMomentum(stats.momentum ? stats.momentum.join(',') : '0,0,0,0,0');
    setTeamFlagUrl(stats.flagUrl || '');
    
    // Reset individual editors
    setEditingPlayerIndex(null);
    setIsAddingPlayer(false);
  }, [selectedTeamCode, profiles]); // profiles change re-triggers state syncs

  const handleUpdateTeamStatsProfile = async () => {
    try {
      const parsedMomentum = teamMomentum.split(',').map(n => parseInt(n.trim()) || 0);
      const newStats = {
        winProbability: Number(teamWinProb),
        avgGoalsGame: Number(teamAvgGoals),
        cleanSheets: teamCleanSheets.trim(),
        momentum: parsedMomentum,
        flagUrl: teamFlagUrl.trim() || undefined
      };
      await db.updateTeamStats(selectedTeamCode, newStats);
      setSuccessMsg(`Team stats profile for ${selectedTeamCode} updated successfully in database!`);
      reloadDbState();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg(`Failed to update team profile: ` + e.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleAddPlayerToRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const currentSquad: Player[] = db.getSquads()[selectedTeamCode] || [];
    const newPlayer: Player = {
      jerseyNumber: Number(playerJersey),
      name: playerName.trim(),
      position: playerPosition,
      club: playerClub.trim() || 'Free Agent',
      goals: Number(playerGoals),
      assists: Number(playerAssists),
      image: playerImage.trim() || undefined
    };

    const updatedSquad = [...currentSquad, newPlayer];
    await db.updateSquad(selectedTeamCode, updatedSquad);
    setSuccessMsg(`Player ${playerName} added directly to squad roster of ${selectedTeamCode}!`);
    
    setPlayerName('');
    setPlayerClub('');
    setPlayerGoals(0);
    setPlayerAssists(0);
    setPlayerImage('');
    setIsAddingPlayer(false);
    
    reloadDbState();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleStartEditPlayer = (p: Player, idx: number) => {
    setEditingPlayerIndex(idx);
    setIsAddingPlayer(false);
    setPlayerJersey(p.jerseyNumber);
    setPlayerName(p.name);
    setPlayerPosition(p.position);
    setPlayerClub(p.club);
    setPlayerGoals(p.goals);
    setPlayerAssists(p.assists);
    setPlayerImage(p.image || '');
  };

  const handleSaveEditedPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayerIndex === null) return;

    const currentSquad = [...(db.getSquads()[selectedTeamCode] || [])];
    if (editingPlayerIndex >= currentSquad.length) return;

    const updatedPlayer: Player = {
      jerseyNumber: Number(playerJersey),
      name: playerName.trim(),
      position: playerPosition,
      club: playerClub.trim(),
      goals: Number(playerGoals),
      assists: Number(playerAssists),
      image: playerImage.trim() || undefined
    };

    currentSquad[editingPlayerIndex] = updatedPlayer;
    await db.updateSquad(selectedTeamCode, currentSquad);
    setSuccessMsg(`Player ${playerName} updated in the ${selectedTeamCode} squad roster!`);
    
    setEditingPlayerIndex(null);
    reloadDbState();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeletePlayerFromRoster = async (idx: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove player ${name} from ${selectedTeamCode} roster?`)) {
      const currentSquad = [...(db.getSquads()[selectedTeamCode] || [])];
      currentSquad.splice(idx, 1);
      await db.updateSquad(selectedTeamCode, currentSquad);
      setSuccessMsg(`Removed player ${name} from ${selectedTeamCode} squad.`);
      
      setEditingPlayerIndex(null);
      reloadDbState();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredMatches = matches.filter(m => {
    const matchQuery = !matchSearch ||
      m.team_a_name.toLowerCase().includes(matchSearch.toLowerCase()) ||
      m.team_b_name.toLowerCase().includes(matchSearch.toLowerCase()) ||
      m.venue.toLowerCase().includes(matchSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(matchSearch.toLowerCase()) ||
      (m.team_a_id && m.team_a_id.toLowerCase().includes(matchSearch.toLowerCase())) ||
      (m.team_b_id && m.team_b_id.toLowerCase().includes(matchSearch.toLowerCase()));

    if (roundFilter === 'ALL') return matchQuery;
    return m.round === roundFilter && matchQuery;
  });

  const startEditMatch = (m: Match) => {
    setEditingMatchId(m.id);
    setInputScoreA(m.team_a_score ?? 0);
    setInputScoreB(m.team_b_score ?? 0);
    setInputStatus(m.status);
    setInputVenue(m.venue);
    setInputKickoff(m.start_time);
    setInputDeadline(m.prediction_deadline || m.start_time);
    setInputHost((m.host_country === 'USA' ? 'USA' : m.host_country === 'MEX' ? 'MEXICO' : 'CANADA') as any);
    setInputTeamAName(m.team_a_name);
    setInputTeamBName(m.team_b_name);
    setInputTeamAFlag(m.team_a_flag);
    setInputTeamBFlag(m.team_b_flag);
    setInputTeamAID(m.team_a_id || '');
    setInputTeamBID(m.team_b_id || '');
  };

  const saveEditMatch = async () => {
    if (!editingMatchId) return;

    const updates: Partial<Match> = {
      team_a_score: inputStatus === 'SCHEDULED' ? null : inputScoreA,
      team_b_score: inputStatus === 'SCHEDULED' ? null : inputScoreB,
      status: inputStatus,
      venue: inputVenue,
      start_time: inputKickoff,
      prediction_deadline: inputDeadline ? inputDeadline : undefined,
      host_country: inputHost === 'MEXICO' ? 'MEX' : inputHost === 'CANADA' ? 'CAN' : 'USA',
      team_a_id: inputTeamAID,
      team_b_id: inputTeamBID,
      team_a_name: inputTeamAName,
      team_b_name: inputTeamBName,
      team_a_flag: inputTeamAFlag,
      team_b_flag: inputTeamBFlag
    };

    await onOverrideMatch(editingMatchId, updates);

    setEditingMatchId(null);
    setSuccessMsg('Match overrides committed successfully to database.');
    reloadDbState();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // User Administration Handlers
  const handleToggleRole = async (target: Profile) => {
    const updatedRole: 'ANALYST' | 'ADMIN' = target.role === 'ADMIN' ? 'ANALYST' : 'ADMIN';
    const updatedProfile = { ...target, role: updatedRole };
    await db.saveOrUpdateProfileDirectly(updatedProfile);
    setSuccessMsg(`Role for ${target.fullName} updated to ${updatedRole}`);
    reloadDbState();
    if (selectedUser?.id === target.id) {
      setSelectedUser(updatedProfile);
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteUser = async (targetId: string) => {
    if (window.confirm('Wipe user and associated predictions from secured databases permanently?')) {
      await db.deleteProfileDirectly(targetId);
      setSuccessMsg(`Analyst removed successfully from roster registry.`);
      reloadDbState();
      if (selectedUser?.id === targetId) {
        setSelectedUser(null);
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleCreateCustomUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formEmail.includes('@')) {
      setErrorMsg('Invalid office email address.');
      return;
    }
    if (!formEmpId.startsWith('FIFA-')) {
      setErrorMsg('Corporate ID must start with "FIFA-" sequence prefix.');
      return;
    }

    const newAnalyst: Profile = {
      id: `user-${formEmpId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      email: formEmail.toLowerCase().trim(),
      employee_id: formEmpId.trim(),
      phone_number: formPhone.trim() || '+1 (555) 012-0000',
      fullName: formName.trim(),
      role: formRole,
      rank: profiles.length + 1,
      accuracy: 75,
      points: 1200
    };

    await db.registerNewUser(newAnalyst);
    setSuccessMsg(`Simulated user account registered for ${formName}!`);
    setShowAddUserModal(false);
    
    // Clear form
    setFormName('');
    setFormEmail('');
    setFormEmpId('');
    setFormPhone('');
    
    reloadDbState();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleInspectPredictions = (usr: Profile) => {
    setSelectedUser(usr);
    const userSpecificPreds = predictionsList.filter(p => p.user_id === usr.id);
    setSelectedUserPreds(userSpecificPreds);
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_TEMP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredProfiles = profiles.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Admin header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#d1d4d1]/10">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-[#3cac3b] font-extrabold uppercase">
            ADMIN COCKPIT CONTROL
          </span>
          <h2 className="font-sans text-4xl uppercase font-black tracking-tighter text-white">
            World Cup 2026 Admin Dashboard
          </h2>
        </div>

        <div className="flex gap-2">
          {/* Integrity status badge */}
          <div className={`flex items-center gap-2 border px-4 py-2 text-xs font-mono tracking-widest font-bold uppercase transition-all rounded-sm ${
            isTampered 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              : 'bg-[#152e18] border-[#3cac3b] text-emerald-400'
          }`}>
            {isTampered ? (
              <>
                <ShieldX className="w-4 h-4 text-rose-400" />
                DATA RESYNC REQUIRED
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                DATABASE STATE: OK
              </>
            )}
          </div>
        </div>
      </header>

      {/* Selector Tabs navigation */}
      <nav className="flex flex-wrap gap-1 border-b border-[#d1d4d1]/10">
        <button
          onClick={() => setActiveTab('CONTROLS')}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'CONTROLS'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Bolt className="w-3.5 h-3.5 text-[#3cac3b]" /> Schedule overriding
        </button>
        <button
          onClick={() => { setActiveTab('USERS'); reloadDbState(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#3cac3b]" /> User Management Center
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'LEDGER'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#3cac3b]" /> Employee Action Logs
        </button>
        <button
          onClick={() => setActiveTab('SYSTEM_SCHEMAS')}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'SYSTEM_SCHEMAS'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-[#3cac3b]" /> Supabase schema
        </button>
        <button
          onClick={() => { setActiveTab('SQUADS'); reloadDbState(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'SQUADS'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#3cac3b]" /> Team & Squads Roster
        </button>
        <button
          onClick={() => { setActiveTab('POLLS'); reloadDbState(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'POLLS'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#3cac3b]" /> Fan Polls control
        </button>
        <button
          onClick={() => { setActiveTab('ALL_PREDICTIONS'); reloadDbState(); }}
          className={`px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'ALL_PREDICTIONS'
              ? 'bg-[#252727] text-white border-b-2 border-[#3cac3b]'
              : 'text-[#d1d4d1]/40 hover:bg-[#252727]/50'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#3cac3b]" /> All Predictions
        </button>
      </nav>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400 text-xs font-mono rounded-r-sm">
          {successMsg}
        </div>
      )}

      {/* Controls tab - schedules overrides & edit sets */}
      {activeTab === 'CONTROLS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 rounded-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-2 border-b border-[#d1d4d1]/10">
                <h3 className="font-sans text-xl font-bold uppercase tracking-wider text-white">
                  Full Game Detail Control Override
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  Showing {filteredMatches.length} of {matches.length} matches
                </span>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search matches by team name, city, venue, or id..."
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    className="w-full bg-black/40 border border-[#d1d4d1]/10 py-1.5 pl-9 pr-8 text-xs text-white focus:border-[#3cac3b] outline-none rounded-sm placeholder-zinc-500 font-sans"
                  />
                  {matchSearch && (
                    <button
                      onClick={() => setMatchSearch('')}
                      className="text-zinc-400 hover:text-white absolute right-3 top-2 text-xs font-sans cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Round select filters */}
                <div className="flex flex-wrap gap-1">
                  {(['ALL', 'GROUP', 'R32', 'R16', 'QF', 'SF', 'FINAL'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoundFilter(r)}
                      className={`px-2.5 py-1 text-[10px] uppercase font-mono rounded-sm transition-all cursor-pointer ${
                        roundFilter === r
                          ? 'bg-[#3cac3b] text-white font-bold border border-[#3cac3b]'
                          : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-12 text-[#d1d4d1]/40 text-xs font-mono">
                    No matches found matching the search parameters.
                  </div>
                ) : (
                  filteredMatches.map((m) => {
                    const isEditing = editingMatchId === m.id;
                  return (
                    <div key={m.id} className="bg-black/30 border border-[#d1d4d1]/10 p-4 shrink-0 hover:bg-black/40 transition-all rounded-sm">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        
                        {/* Summary & description parameters */}
                        <div className="space-y-1 my-1">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <span className="font-mono text-[9px] bg-[#3cac3b] text-white font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              {m.round}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#3cac3b]">
                              <MapPin className="w-3 h-3 text-[#3cac3b]" /> {m.venue}
                            </span>
                            <span className="text-[9px] text-[#d1d4d1]/30 font-mono">({m.host_country})</span>
                          </div>
                          
                          <div className="font-sans text-base font-bold text-white flex items-center gap-2">
                            <span>{m.team_a_name || 'TBD'}</span>
                            <span className="text-[#3cac3b] text-xs font-black">VS</span>
                            <span>{m.team_b_name || 'TBD'}</span>
                          </div>
                          
                          <div className="text-[10px] text-[#d1d4d1]/50 font-mono">
                            Kickoff Date: {new Date(m.start_time).toLocaleString()} | Status: <strong className="text-white uppercase">{m.status}</strong>
                          </div>
                        </div>

                        {/* Scores & Buttons */}
                        {!isEditing && (
                          <div className="flex items-center justify-end gap-3 w-full md:w-auto">
                            <div className="font-mono text-xl font-extrabold text-[#3cac3b] bg-black/50 border border-white/5 py-1 px-4.5 rounded-sm select-none">
                              {m.team_a_score ?? '—'} : {m.team_b_score ?? '—'}
                            </div>
                            <button
                              onClick={() => startEditMatch(m)}
                              className="border border-[#3cac3b] text-[#3cac3b] hover:bg-[#3cac3b] hover:text-white px-3 py-1.5 text-xs font-mono tracking-widest uppercase transition-all rounded-sm cursor-pointer whitespace-nowrap"
                            >
                              Modify Details
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Editing Block Container Form */}
                      {isEditing && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 text-xs">
                          <h4 className="font-mono text-[#3cac3b] font-bold uppercase tracking-wider text-[11px]">ADMINISTRATIVE OVERRIDE FLIGHT</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Score A input */}
                            <div>
                              <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono mb-1">Score: {inputTeamAName || m.team_a_id || 'Team A'}</label>
                              <input
                                type="number"
                                min={0}
                                value={inputScoreA}
                                onChange={(e) => setInputScoreA(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/60 border border-white/10 text-white font-mono text-xs py-1.5 text-center focus:border-[#3cac3b] outline-none rounded-sm"
                                disabled={inputStatus === 'SCHEDULED'}
                              />
                            </div>

                            {/* Score B input */}
                            <div>
                              <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono mb-1">Score: {inputTeamBName || m.team_b_id || 'Team B'}</label>
                              <input
                                type="number"
                                min={0}
                                value={inputScoreB}
                                onChange={(e) => setInputScoreB(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/60 border border-white/10 text-white font-mono text-xs py-1.5 text-center focus:border-[#3cac3b] outline-none rounded-sm"
                                disabled={inputStatus === 'SCHEDULED'}
                              />
                            </div>

                            {/* Roster Match Status */}
                            <div>
                              <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono mb-1">Match state</label>
                              <select
                                value={inputStatus}
                                onChange={(e) => setInputStatus(e.target.value as any)}
                                className="w-full bg-black/60 border border-white/10 text-white font-mono text-xs py-1.5 px-2 focus:border-[#3cac3b] outline-none rounded-sm"
                              >
                                <option value="SCHEDULED">SCHEDULED</option>
                                <option value="LIVE">LIVE</option>
                                <option value="COMPLETED">COMPLETED</option>
                              </select>
                            </div>

                            {/* Match Host Hub */}
                            <div>
                              <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono mb-1">Host Country</label>
                              <select
                                value={inputHost}
                                onChange={(e) => setInputHost(e.target.value as any)}
                                className="w-full bg-black/60 border border-white/10 text-white font-mono text-xs py-1.5 px-2 focus:border-[#3cac3b] outline-none rounded-sm"
                              >
                                <option value="USA">USA Core</option>
                                <option value="MEXICO">Mexico Core</option>
                                <option value="CANADA">Canada Core</option>
                              </select>
                            </div>
                          </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/25 p-4 border border-white/5 rounded-sm">
                            
                            {/* TEAM A IDENTITY SETUP */}
                            <div className="space-y-3 bg-[#1f2020]/40 p-3 rounded-xs border border-emerald-500/10">
                              <h5 className="text-[11px] font-mono font-bold uppercase tracking-wide text-emerald-450 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> Team A Registration
                              </h5>
                              
                              <div className="space-y-1">
                                <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Select Real National Country</label>
                                <select
                                  value={teamsList.some(t => t.code === inputTeamAID) ? inputTeamAID : ""}
                                  onChange={(e) => {
                                    const selectedCode = e.target.value;
                                    if (selectedCode) {
                                      setInputTeamAID(selectedCode);
                                      const countryObj = teamsList.find(t => t.code === selectedCode);
                                      if (countryObj) {
                                        setInputTeamAName(countryObj.name);
                                        const stats = db.getTeamStats()[selectedCode];
                                        setInputTeamAFlag(stats?.flagUrl || countryObj.flag || selectedCode);
                                      }
                                    }
                                  }}
                                  className="w-full bg-black/60 border border-white/10 text-white font-sans text-xs py-1.5 px-2 focus:border-[#3cac3b] outline-none rounded-sm"
                                >
                                  <option value="">-- [Custom Override / Bracket Placeholder] --</option>
                                  {teamsList.map(t => (
                                    <option key={t.code} value={t.code} className="bg-[#1f2020]">
                                      {t.name} ({t.code})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Team ID / Code (Type manually to override)</label>
                                <input
                                  type="text"
                                  value={inputTeamAID}
                                  onChange={(e) => setInputTeamAID(e.target.value.toUpperCase())}
                                  className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                                  placeholder="e.g. USA, TBD_R32_1, 2A"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Display Name</label>
                                  <input
                                    type="text"
                                    value={inputTeamAName}
                                    onChange={(e) => setInputTeamAName(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                                    placeholder="United States"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono font-bold">Flag Code / image URL</label>
                                  <input
                                    type="text"
                                    value={inputTeamAFlag}
                                    onChange={(e) => setInputTeamAFlag(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                                    placeholder="USA or URL"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* TEAM B IDENTITY SETUP */}
                            <div className="space-y-3 bg-[#1f2020]/40 p-3 rounded-xs border border-blue-500/10">
                              <h5 className="text-[11px] font-mono font-bold uppercase tracking-wide text-blue-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span> Team B Registration
                              </h5>
                              
                              <div className="space-y-1">
                                <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Select Real National Country</label>
                                <select
                                  value={teamsList.some(t => t.code === inputTeamBID) ? inputTeamBID : ""}
                                  onChange={(e) => {
                                    const selectedCode = e.target.value;
                                    if (selectedCode) {
                                      setInputTeamBID(selectedCode);
                                      const countryObj = teamsList.find(t => t.code === selectedCode);
                                      if (countryObj) {
                                        setInputTeamBName(countryObj.name);
                                        const stats = db.getTeamStats()[selectedCode];
                                        setInputTeamBFlag(stats?.flagUrl || countryObj.flag || selectedCode);
                                      }
                                    }
                                  }}
                                  className="w-full bg-black/60 border border-white/10 text-white font-sans text-xs py-1.5 px-2 focus:border-[#3cac3b] outline-none rounded-sm"
                                >
                                  <option value="">-- [Custom Override / Bracket Placeholder] --</option>
                                  {teamsList.map(t => (
                                    <option key={t.code} value={t.code} className="bg-[#1f2020]">
                                      {t.name} ({t.code})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Team ID / Code (Type manually to override)</label>
                                <input
                                  type="text"
                                  value={inputTeamBID}
                                  onChange={(e) => setInputTeamBID(e.target.value.toUpperCase())}
                                  className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                                  placeholder="e.g. COL, TBD_R32_2, 2B"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Display Name</label>
                                  <input
                                    type="text"
                                    value={inputTeamBName}
                                    onChange={(e) => setInputTeamBName(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                                    placeholder="Colombia"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono font-bold">Flag Code / image URL</label>
                                  <input
                                    type="text"
                                    value={inputTeamBFlag}
                                    onChange={(e) => setInputTeamBFlag(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                                    placeholder="COL or URL"
                                  />
                                </div>
                              </div>
                            </div>

                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Stadium Venue Location */}
                            <div className="space-y-1">
                              <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Stadium Venue Name</label>
                              <input
                                type="text"
                                value={inputVenue}
                                onChange={(e) => setInputVenue(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white outline-none focus:border-[#3cac3b] rounded-sm"
                              />
                            </div>

                            {/* Kickoff timestamp calendar picker */}
                            <div className="space-y-1">
                              <label className="block text-[10px] text-[#d1d4d1]/50 uppercase font-mono">Kickoff Date Time UTC</label>
                              <input
                                type="text"
                                value={inputKickoff}
                                onChange={(e) => setInputKickoff(e.target.value)}
                                placeholder="YYYY-MM-DDTHH:MM:SSZ (e.g., 2026-06-25T18:00:00Z)"
                                className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm"
                              />
                            </div>

                            {/* Prediction lock locking target deadline */}
                            <div className="space-y-1">
                              <label className="block text-[10px] text-[#3cac3b] uppercase font-mono font-bold">Prediction Locking Deadline</label>
                              <input
                                type="text"
                                value={inputDeadline}
                                onChange={(e) => setInputDeadline(e.target.value)}
                                placeholder="Defaults to Kickoff if blank"
                                className="w-full bg-black/60 border border-[#3cac3b]/30 py-1.5 px-3 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-1.5 pt-2">
                            <button
                              onClick={saveEditMatch}
                              className="bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white px-4 py-2 font-sans font-bold uppercase rounded-sm cursor-pointer"
                            >
                              Confirm Save
                            </button>
                            <button
                              onClick={() => setEditingMatchId(null)}
                              className="bg-zinc-800 text-white px-4 py-2 font-sans font-semibold uppercase rounded-sm hover:bg-zinc-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Simulation controls */}
            <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 space-y-4 rounded-sm">
              <h3 className="font-sans text-lg font-bold uppercase tracking-wider text-[#3cac3b] border-b border-[#d1d4d1]/10 pb-2">
                Database Resilience Controls
              </h3>
              
              <p className="text-xs text-[#d1d4d1]/80 leading-relaxed">
                Operate on local-first database synchronization. Trigger database validation checks to verify that the system blocks invalid entries instantly.
              </p>

              <div className="space-y-2">
                <button
                  onClick={onSimulateTamper}
                  className="w-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 py-2.5 text-xs font-sans font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Force Sync Mismatch
                </button>

                <button
                  onClick={async () => {
                    await onResetDatabase();
                    reloadDbState();
                  }}
                  className="w-full bg-[#3cac3b]/10 border border-[#3cac3b]/30 hover:bg-[#3cac3b]/20 text-white py-2.5 text-xs font-sans font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer rounded-sm"
                >
                  <RefreshCw className="w-4 h-4 text-[#3cac3b]" /> Generate Clean Genesis State
                </button>
              </div>
            </div>

            {/* Quick analytics info */}
            <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 rounded-sm">
              <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white mb-2">
                Cognitive Rules Note
              </h3>
              <p className="text-[11px] leading-relaxed text-[#d1d4d1]/50">
                Completing a single-elimination match advance logic will automatically push the correct winning team ID into the corresponding slot of the next Round match (A or B depending on original match termination suffix branch).
              </p>
            </div>

          </div>

        </div>
      )}

      {/* VIEW Tab: User Management Center */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 rounded-sm space-y-4">
            
            {/* Search and control filter line */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#d1d4d1]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, employee ID..."
                  className="w-full bg-black/40 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-[#3cac3b]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-[#3cac3b] hover:bg-[#3cac3b]/95 text-white font-sans text-xs px-4 py-2 hover:opacity-90 flex items-center gap-1.5 uppercase font-bold tracking-wider rounded-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Create Custom Analyst
                </button>
                <button
                  onClick={() => { reloadDbState(); }}
                  className="bg-black/30 border border-white/10 hover:bg-black/40 text-white font-sans text-xs px-3 py-2 flex items-center gap-1.5 rounded-sm cursor-pointer"
                  title="Force Reload database sync"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List Table of Registered Analysts */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[#d1d4d1]/10 text-[#d1d4d1]/50 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Professional Analyst</th>
                    <th className="py-2.5 px-3">Employee Verification ID</th>
                    <th className="py-2.5 px-3 text-right">Prestige Accuracy</th>
                    <th className="py-2.5 px-3 text-right">Points</th>
                    <th className="py-2.5 px-3 text-center">Executive Directory Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d4d1]/10 text-white font-medium">
                  {filteredProfiles.map((p) => {
                    const totalPredsCount = predictionsList.filter(pred => pred.user_id === p.id).length;
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-white/5">
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[9px] font-mono font-black py-0.5 px-1.5 rounded-sm tracking-wide ${
                            p.role === 'ADMIN' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30' : 'bg-[#3cac3b]/25 text-emerald-400'
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">{p.fullName}</span>
                            <span className="text-[10px] text-[#d1d4d1]/50 font-mono">{p.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-white/95">{p.employee_id}</span>
                            <span className="text-[9px] text-[#d1d4d1]/40 font-mono">Sync: {p.phone_number}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono text-emerald-400 font-bold bg-black/40 border border-[#d1d4d1]/10 px-2 py-0.5 rounded-sm">
                            {p.accuracy}% Acc
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#3cac3b]">
                          {p.points.toLocaleString()} pts
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleInspectPredictions(p)}
                              className="bg-[#252727] hover:bg-black p-1.5 text-white border border-[#d1d4d1]/10 hover:border-[#3cac3b] rounded-sm transition-all cursor-pointer flex items-center gap-1"
                              title="Audit all predictions made by this user"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-mono">[{totalPredsCount}] Sheet</span>
                            </button>

                            <button
                              onClick={() => handleToggleRole(p)}
                              className="bg-black/40 hover:bg-black/70 p-1.5 text-amber-400 border border-amber-500/20 hover:border-amber-400 rounded-sm transition-all cursor-pointer text-[10px] uppercase font-bold"
                              title="Change administration permission"
                            >
                              Toggle Admin
                            </button>

                            <button
                              onClick={() => handleDeleteUser(p.id)}
                              className="bg-rose-950/10 hover:bg-rose-950/40 p-1.5 text-rose-400 border border-rose-500/20 hover:border-rose-400 rounded-sm transition-all cursor-pointer"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* ACTIVE USER'S SUBMITTED PREDICTION FEED */}
          {selectedUser && (
            <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 rounded-sm space-y-4 animate-fadeIn relative">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-white hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Users className="w-5 h-5 text-[#3cac3b]" />
                <div>
                  <h3 className="font-sans text-xl font-black uppercase text-white leading-none">
                    PRED_SHEET AUDITING FEED: <span className="text-[#3cac3b]">{selectedUser.fullName}</span>
                  </h3>
                  <p className="text-[10px] uppercase font-mono text-[#d1d4d1]/50 tracking-wider mt-1">
                    Employee Key Validation ID: {selectedUser.employee_id} | Email: {selectedUser.email}
                  </p>
                </div>
              </div>

              {selectedUserPreds.length === 0 ? (
                <div className="p-8 text-center text-[#d1d4d1]/40 text-xs font-mono">
                  This analyst has not written any prediction blocks on matching sets yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#d1d4d1]/10 text-white/50 uppercase tracking-widest font-mono text-[9px]">
                        <th className="py-2">Match details</th>
                        <th className="py-2 text-center">Prediction Forecast</th>
                        <th className="py-2 text-right">Predicted Score</th>
                        <th className="py-2 text-right">Actual Match Score</th>
                        <th className="py-2 text-center">Calculated Accuracy Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d1d4d1]/10 font-medium text-white/90">
                      {selectedUserPreds.map((pred) => {
                        const originalM = matches.find(m => m.id === pred.match_id);
                        if (!originalM) return null;
                        
                        // Calculated state feedback
                        let pointsGainedString = 'PENDING KICKOFF';
                        let badgeStyle = 'bg-zinc-800 text-zinc-300 border border-zinc-700';

                        if (originalM.status === 'COMPLETED' && originalM.team_a_score !== null && originalM.team_b_score !== null) {
                          const actualWinner = originalM.team_a_score > originalM.team_b_score ? originalM.team_a_id :
                                               originalM.team_b_score > originalM.team_a_score ? originalM.team_b_id : 'DRAW';
                          
                          const correctWinner = pred.selection === actualWinner;
                          const perfectScore = pred.team_a_pred_score === originalM.team_a_score && 
                                               pred.team_b_pred_score === originalM.team_b_score;

                          if (perfectScore) {
                            pointsGainedString = '+400 PTS (PERFECT)';
                            badgeStyle = 'bg-[#3cac3b]/30 text-emerald-400 border border-emerald-500';
                          } else if (correctWinner) {
                            pointsGainedString = '+250 PTS (WINNER)';
                            badgeStyle = 'bg-sky-500/25 text-sky-400 border border-sky-400';
                          } else {
                            pointsGainedString = '+0 PTS (INCORRECT)';
                            badgeStyle = 'bg-rose-500/10 text-rose-300 border border-rose-500/30';
                          }
                        }

                        return (
                          <tr key={pred.id} className="hover:bg-white/5">
                            <td className="py-3 font-sans">
                              <span className="block text-[10px] text-[#3cac3b] font-mono leading-none">{originalM.round} | {originalM.venue}</span>
                              <span className="block font-bold text-xs text-white mt-1 uppercase italic leading-none">{originalM.team_a_name} vs {originalM.team_b_name}</span>
                            </td>
                            <td className="py-3 text-center font-mono">
                              <span className="bg-black/60 text-[#3cac3b] border border-[#3cac3b]/25 rounded-sm py-0.5 px-2 text-[10px] font-bold">
                                {pred.selection}
                              </span>
                            </td>
                            <td className="py-3 text-right text-base text-white/70">
                              {pred.team_a_pred_score} : {pred.team_b_pred_score}
                            </td>
                            <td className="py-3 text-right text-base text-[#3cac3b] font-black">
                              {originalM.team_a_score ?? '—'} : {originalM.team_b_score ?? '—'}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-block text-[9px] font-bold py-1 px-2.5 rounded-sm ${badgeStyle}`}>
                                {pointsGainedString}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ACTIVE TAB LEDGER CHAIN AUDITOR */}
      {activeTab === 'LEDGER' && (
        <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 space-y-4 rounded-sm">
          <div className="space-y-1">
            <h3 className="font-sans text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#3cac3b]" /> Employee Action Audit Logs
            </h3>
            <p className="text-xs text-[#d1d4d1]/70 font-sans">
              Sequential system logs tracking user action histories with validation tokens to maintain absolute database integrity.
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-[10px] text-white/90">
              <thead>
                <tr className="border-b border-[#d1d4d1]/10 text-[#d1d4d1]/40 uppercase tracking-wider font-bold">
                  <th className="py-2 px-2">Log ID</th>
                  <th className="py-2 px-2">Timestamp UTC</th>
                  <th className="py-2 px-2">Action Type</th>
                  <th className="py-2 px-2 text-left">Action details</th>
                  <th className="py-2 px-2">Parent node key</th>
                  <th className="py-2 px-2 text-right">Verification check value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1d4d1]/10">
                {[...ledger].reverse().map((b) => (
                  <tr key={b.index} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 text-[#3cac3b] font-bold">#{b.index}</td>
                    <td className="py-3 px-2 text-white/60">{new Date(b.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 px-2 text-rose-450 font-bold">{b.action}</td>
                    <td className="py-3 px-2 max-w-[190px] truncate" title={b.payload}>{b.payload}</td>
                    <td className="py-3 px-2 font-mono text-white/35 truncate max-w-[100px]">{b.previous_hash}</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-450 font-bold max-w-[120px] truncate" title={b.hash}>{b.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POLLS tab - admin manage and review poll results */}
      {activeTab === 'POLLS' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Create new Poll Form */}
            <div className="bg-[#252727] border border-[#d1d4d1]/10 p-5 rounded-sm h-fit">
              <h3 className="font-sans text-lg uppercase font-bold text-white tracking-wide mb-3 flex items-center gap-1.5 border-b border-[#d1d4d1]/10 pb-2">
                <Plus className="w-5 h-5 text-[#3cac3b]" /> Launch Custom Fan Poll
              </h3>
              
              <form onSubmit={handleCreatePollOnServer} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-[#3cac3b] uppercase font-mono font-bold tracking-wider mb-1">
                    Poll Question Query
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Which team will win group A?"
                    value={newPollQuestion}
                    onChange={(e) => setNewPollQuestion(e.target.value)}
                    className="w-full bg-black/50 border border-[#d1d4d1]/10 py-2 px-3 text-xs text-white focus:border-[#3cac3b] outline-none rounded-sm placeholder-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-[#3cac3b] uppercase font-mono font-bold tracking-wider">
                      Poll Option Sub-Fields
                    </label>
                    <button
                      type="button"
                      onClick={handleAddNewOptionField}
                      className="text-[10px] text-[#3cac3b] hover:underline uppercase font-mono font-bold cursor-pointer"
                    >
                      + Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {newPollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-zinc-500 font-mono">#{idx+1}</span>
                        <input
                          type="text"
                          required
                          placeholder={`Option #${idx+1}`}
                          value={opt}
                          onChange={(e) => handleUpdateOptionField(idx, e.target.value)}
                          className="flex-1 bg-black/40 border border-white/5 py-1 px-2.5 text-xs text-white focus:border-[#3cac3b] outline-none rounded-sm"
                        />
                        {newPollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(idx)}
                            className="text-zinc-500 hover:text-rose-400 text-xs font-mono font-bold px-1.5"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#3cac3b] uppercase font-mono font-bold tracking-wider mb-1">
                    Points Reward (On Correct Guess)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    required
                    value={newPollReward}
                    onChange={(e) => setNewPollReward(Number(e.target.value) || 300)}
                    className="w-full bg-black/50 border border-[#d1d4d1]/10 py-2 px-3 text-xs text-yellow-400 font-mono font-bold focus:border-[#3cac3b] outline-none rounded-sm"
                  />
                  <span className="text-[9px] text-zinc-500 font-mono leading-none mt-1 block">
                    Range: 50 to 2000 points.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3cac3b] hover:bg-[#328e31] text-xs font-bold text-white uppercase py-2.5 rounded-sm tracking-wider transition-all duration-200 mt-2 cursor-pointer text-center"
                >
                  Publish Live Poll
                </button>
              </form>
            </div>

            {/* Right Column: Dynamic Poll Management & Vote Audit Sheets */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#252727] border border-[#d1d4d1]/10 p-5 rounded-sm">
                <h3 className="font-sans text-xl font-bold uppercase tracking-wider text-white mb-1">
                  Fan Poll Control Room & Voter Sheets
                </h3>
                <p className="text-xs text-[#d1d4d1]/70 mb-5">
                  View precise individual voter selections, review statistics, or resolve/close active polls to award points to winner profiles immediately.
                </p>

                <div className="space-y-6 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
                  {polls.length === 0 ? (
                    <div className="text-center py-12 text-[#d1d4d1]/30 text-xs font-mono">
                      No active pools found in database storage.
                    </div>
                  ) : (
                    polls.map((poll) => {
                      const pollVotes = votes.filter(v => v.poll_id === poll.id);
                      const isVoted = pollVotes.length > 0;

                      return (
                        <div key={poll.id} className="bg-black/30 border border-[#d1d4d1]/10 p-4 rounded-sm flex flex-col justify-between">
                          <header className="flex flex-wrap justify-between items-start gap-2 mb-3 pb-2 border-b border-white/5">
                            <div>
                              <h4 className="font-sans text-sm font-black text-white">{poll.question}</h4>
                              <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">POLL ID: {poll.id}</span>
                            </div>
                            <div className="flex gap-1.5 items-center">
                              <span className="bg-[#3cac3b]/10 border border-[#3cac3b]/30 text-[#3cac3b] font-mono text-[9px] px-2 py-0.5 rounded-sm uppercase font-bold">
                                Reward: +{poll.pointsReward} PTS
                              </span>
                              {poll.status === 'RESOLVED' ? (
                                <span className="bg-zinc-700/80 border border-zinc-600 text-zinc-300 font-mono text-[9px] px-2 py-0.5 rounded-sm uppercase font-bold">
                                  Resolved
                                </span>
                              ) : (
                                <span className="bg-[#e61d25]/20 border border-[#e61d25]/40 text-rose-300 font-mono text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wide font-black animate-pulse">
                                  Active Open
                                </span>
                              )}
                            </div>
                          </header>

                          {/* Options grid with stats */}
                          <div className="space-y-3.5 my-2">
                            {poll.options.map((opt) => {
                              const matchingVotes = pollVotes.filter(v => v.option_id === opt.id);
                              const totalVotes = pollVotes.length;
                              const pct = totalVotes > 0 ? Math.round((matchingVotes.length / totalVotes) * 100) : 0;
                              const isWinner = poll.status === 'RESOLVED' && poll.correctOptionId === opt.id;

                              // Collect voters info details
                              const voterEntries = matchingVotes.map(v => {
                                const found = profiles.find(p => p.id === v.user_id);
                                return found ? `${found.fullName} (${found.role})` : 'Unknown User';
                              }).join(', ');

                              return (
                                <div key={opt.id} className={`p-2 bg-black/40 border rounded-sm flex flex-col gap-1.5 ${
                                  isWinner ? 'border-[#3cac3b] shadow-[0_0_10px_rgba(60,172,59,0.1)]' : 'border-white/5'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                                      {isWinner && <Check className="w-3.5 h-3.5 text-[#3cac3b]" />}
                                      {opt.text}
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-400 font-bold shrink-0">
                                      {matchingVotes.length} votes ({pct}%)
                                    </span>
                                  </div>

                                  {/* Voters text log sheet */}
                                  <div className="text-[9px] font-mono text-zinc-500 break-words mt-0.5">
                                    Voters: {voterEntries || <span className="italic">None</span>}
                                  </div>

                                  {/* Resolve outcome controls */}
                                  {poll.status === 'OPEN' && (
                                    <button
                                      onClick={() => handleResolvePollOnServer(poll.id, opt.id)}
                                      className="self-end text-[9px] font-mono uppercase bg-[#3cac3b]/10 hover:bg-[#3cac3b]/20 text-[#3cac3b] px-2 py-0.5 rounded-sm border border-[#3cac3b]/20 mt-1 cursor-pointer transition-all shrink-0"
                                    >
                                      Mark as Correct Outcome
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ACTIVE TAB SYSTEM SCHEMAS WITH DIRECT COPY TEMPLATES */}
      {activeTab === 'SYSTEM_SCHEMAS' && (
        <div className="bg-[#252727] border border-[#d1d4d1]/10 p-4 space-y-4 rounded-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-sans text-xl font-bold uppercase tracking-wider text-white">
                Supabase PostgreSQL database layout
              </h3>
              <p className="text-xs text-[#d1d4d1]/70">
                Official SQL blueprints defining profile structures, prediction matches, and temporal checks preventing post-kickoff predictions.
              </p>
            </div>

            <button
              onClick={copySqlSchema}
              className="bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white font-sans font-bold text-xs px-4 py-2 hover:opacity-90 flex items-center gap-2 tracking-wide uppercase cursor-pointer rounded-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy SQL Code
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-neutral-950 border border-[#d1d4d1]/10 p-4 text-[11px] font-mono leading-relaxed text-emerald-400/90 overflow-y-auto max-h-[350px] custom-scrollbar rounded-sm select-all whitespace-pre-wrap">
              {SUPABASE_SQL_TEMP}
            </pre>
          </div>
        </div>
      )}

      {/* CREATE USER POPUP OVERLAY */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn font-sans text-xs">
          <div className="w-full max-w-sm bg-[#1e2020] border border-[#d1d4d1]/20 p-6 rounded-sm relative text-[#d1d4d1] space-y-4">
            
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 text-white hover:text-[#3cac3b]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#3cac3b] uppercase block font-bold leading-none">REGULATE AUDIT MEMBERS</span>
              <h3 className="font-sans font-black text-xl text-white uppercase leading-none">Register New Analyst</h3>
            </div>

            {errorMsg && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] rounded-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomUser} className="space-y-3.5 pt-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-mono uppercase text-white/50 block font-bold">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Didier Drogba"
                  className="w-full bg-black/40 border border-white/10 py-1.5 px-3 text-white focus:border-[#3cac3b] outline-none rounded-sm uppercase"
                  required
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-mono uppercase text-white/50 block font-bold">Corporate Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="drogba@fifa.com"
                  className="w-full bg-black/40 border border-white/10 py-1.5 px-3 text-white focus:border-[#3cac3b] outline-none rounded-sm"
                  required
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-mono uppercase text-white/50 block font-bold">Employee Verification ID (FIFA-)</label>
                <input
                  type="text"
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  placeholder="FIFA-2026-0888"
                  className="w-full bg-black/40 border border-white/10 py-1.5 px-3 text-white focus:border-[#3cac3b] font-mono tracking-widest outline-none rounded-sm uppercase"
                  required
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-mono uppercase text-white/50 block font-bold">Mobile Synchronous Number</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+33 (123) 456-789"
                  className="w-full bg-black/40 border border-white/10 py-1.5 px-3 text-white font-mono focus:border-[#3cac3b] outline-none rounded-sm"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-mono uppercase text-white/50 block font-bold">Assigned Security Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 py-1.5 px-3 text-white focus:border-[#3cac3b] outline-none rounded-sm"
                >
                  <option value="ANALYST">ANALYST MEMBER</option>
                  <option value="ADMIN">ADMIN EXECUTIVE</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white font-bold py-2 px-4 uppercase tracking-wider rounded-sm transition-all"
              >
                Insert Verified Analyst
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SQUADS tab - national team statistics, roster, & player details management */}
      {activeTab === 'SQUADS' && (
        <div className="space-y-6">
          <div className="bg-[#252727] border border-[#d1d4d1]/10 p-5 rounded-sm">
            <h3 className="font-sans text-2xl uppercase font-black tracking-tight text-white mb-2 flex items-center gap-2">
              <Globe className="w-6 h-6 text-[#3cac3b]" /> Squad & Team Profile Administration
            </h3>
            <p className="text-xs text-[#d1d4d1]/70 leading-relaxed max-w-3xl mb-4">
              Select any participating country to update their profile stats, overall probability indices, or edit squad rosters, player biographical profiles, statistics, and profile photos. All updates write securely to the persistent disk database and ledger.
            </p>

            {/* Select Team Dropdown */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#1f2020] p-4 border border-[#d1d4d1]/10 rounded-sm">
              <div className="space-y-1">
                <label className="block text-[10px] text-[#3cac3b] uppercase font-mono font-bold tracking-wider">Select Participating Country</label>
                <select
                  value={selectedTeamCode}
                  onChange={(e) => {
                    setSelectedTeamCode(e.target.value);
                  }}
                  className="bg-black/60 border border-white/10 py-2 px-4 text-white font-sans outline-none focus:border-[#3cac3b] rounded-sm text-sm"
                >
                  {teamsList.map(t => (
                    <option key={t.code} value={t.code} className="bg-[#1f2020]">
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex gap-2 self-end">
                <div className="text-xs text-[#d1d4d1]/50 font-mono">
                  Active Team: <span className="text-white font-bold">{selectedTeamCode}</span> | Current Roster Size: <span className="text-[#3cac3b] font-bold">{(db.getSquads()[selectedTeamCode] || []).length} players</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Team Profile Details Stats Form */}
            <div className="bg-[#252727] border border-[#d1d4d1]/10 p-5 rounded-sm space-y-4 h-fit">
              <h4 className="font-sans text-lg font-bold uppercase tracking-wider text-[#3cac3b] border-b border-[#d1d4d1]/10 pb-2">
                Team Profile Details
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-[#d1d4d1]/60 uppercase font-mono">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={teamWinProb}
                    onChange={(e) => setTeamWinProb(Number(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#d1d4d1]/60 uppercase font-mono">Avg Goals Per Game</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={teamAvgGoals}
                    onChange={(e) => setTeamAvgGoals(Number(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#d1d4d1]/60 uppercase font-mono">Clean Sheets Ratio</label>
                  <input
                    type="text"
                    placeholder="e.g. 42%"
                    value={teamCleanSheets}
                    onChange={(e) => setTeamCleanSheets(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white outline-none focus:border-[#3cac3b] rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#d1d4d1]/60 uppercase font-mono">Momentum Trend (5 comma values)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10,20,15,45,5"
                    value={teamMomentum}
                    onChange={(e) => setTeamMomentum(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm"
                  />
                  <span className="block text-[9px] text-[#d1d4d1]/40 font-mono mt-0.5">Comma-separated weights</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#3cac3b] uppercase font-mono font-semibold">Country Flag Image (URL)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://example.com/country-flag.png"
                    value={teamFlagUrl}
                    onChange={(e) => setTeamFlagUrl(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 py-1.5 px-3 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs font-mono"
                  />
                  <span className="block text-[9px] text-[#d1d4d1]/40 leading-normal font-sans">
                    Pasting an image URL will override the default flag dynamically throughout the entire bracket, tree views, matchlists, lists, headers & prediction panels.
                  </span>

                  {teamFlagUrl && (
                    <div className="mt-2 p-2 bg-black/20 border border-white/5 rounded-xs flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 font-mono">Flag Image Preview:</span>
                      <img
                        src={teamFlagUrl}
                        alt={`${selectedTeamCode} flag override`}
                        referrerPolicy="no-referrer"
                        className="w-8 h-5 object-cover rounded-xs border border-white/15"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpdateTeamStatsProfile}
                  className="w-full bg-[#3cac3b] hover:bg-[#3cac3b]/95 text-white font-sans font-bold py-2 px-4 uppercase rounded-sm text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Save Profile Details
                </button>
              </div>
            </div>

            {/* Right Column: Squad Roster Table & Editor */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Squad List table */}
              <div className="bg-[#252727] border border-[#d1d4d1]/10 p-5 rounded-sm">
                <div className="flex justify-between items-center border-b border-[#d1d4d1]/10 pb-3 mb-4">
                  <h4 className="font-sans text-lg font-bold uppercase tracking-wider text-white">
                    Squad Player Roster
                  </h4>
                  {!isAddingPlayer && editingPlayerIndex === null && (
                    <button
                      onClick={() => {
                        setIsAddingPlayer(true);
                        setEditingPlayerIndex(null);
                        setPlayerJersey(1);
                        setPlayerName('');
                        setPlayerPosition('FWD');
                        setPlayerClub('');
                        setPlayerGoals(0);
                        setPlayerAssists(0);
                        setPlayerImage('');
                      }}
                      className="bg-[#3cac3b]/10 border border-[#3cac3b]/30 text-[#3cac3b] hover:bg-[#3cac3b]/20 px-3 py-1.5 text-xs uppercase font-sans font-bold rounded-sm cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add New Player
                    </button>
                  )}
                </div>

                {/* Adding / Editing Player Form Panel */}
                {(isAddingPlayer || editingPlayerIndex !== null) && (
                  <form
                    onSubmit={isAddingPlayer ? handleAddPlayerToRoster : handleSaveEditedPlayer}
                    className="bg-[#1f2020] border border-[#3cac3b]/20 p-4 rounded-sm mb-6 space-y-4"
                  >
                    <h5 className="font-mono text-xs font-bold text-[#3cac3b] uppercase tracking-wider border-b border-white/[0.05] pb-1.5">
                      {isAddingPlayer ? '⚡ Registering New Roster Member' : '📝 Editing Member Roster Details'}
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-zinc-400 font-mono">Jersey #</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          required
                          value={playerJersey}
                          onChange={(e) => setPlayerJersey(Number(e.target.value) || 0)}
                          className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="block text-[10px] text-zinc-400 font-mono">Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lionel Messi"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-zinc-400 font-mono">Position</label>
                        <select
                          value={playerPosition}
                          onChange={(e) => setPlayerPosition(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                        >
                          <option value="GK">GK</option>
                          <option value="DEF">DEF</option>
                          <option value="MID">MID</option>
                          <option value="FWD">FWD</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="block text-[10px] text-zinc-400 font-mono">Club Association</label>
                        <input
                          type="text"
                          placeholder="e.g. Internazionale"
                          value={playerClub}
                          onChange={(e) => setPlayerClub(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-400 font-mono">Goals</label>
                          <input
                            type="number"
                            min="0"
                            value={playerGoals}
                            onChange={(e) => setPlayerGoals(Number(e.target.value) || 0)}
                            className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400 font-mono">Assists</label>
                          <input
                            type="number"
                            min="0"
                            value={playerAssists}
                            onChange={(e) => setPlayerAssists(Number(e.target.value) || 0)}
                            className="w-full bg-black/60 border border-white/10 py-1 px-2.5 text-white outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-[#3cac3b] font-mono font-bold">Player Image URL / Photo Link</label>
                      <input
                        type="text"
                        placeholder="e.g. https://images.unsplash.com/... or leave blank for initials avatar"
                        value={playerImage}
                        onChange={(e) => setPlayerImage(e.target.value)}
                        className="w-full bg-black/60 border border-[#3cac3b]/30 py-1.5 px-3 text-white font-mono outline-none focus:border-[#3cac3b] rounded-sm text-xs"
                      />
                      <span className="block text-[9px] text-[#d1d4d1]/40 leading-normal font-sans">
                        Pasting any direct HTTPS image hosting link will instantly overlay and style the player portrait across both matches and squads rosters.
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-[#3cac3b] hover:bg-[#3cac3b]/90 text-white font-sans font-bold px-4 py-2 uppercase rounded-sm text-xs cursor-pointer"
                      >
                        {isAddingPlayer ? 'Add To Squad' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPlayer(false);
                          setEditingPlayerIndex(null);
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-sans font-bold px-4 py-2 uppercase rounded-sm text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Squad Members List Table */}
                {(!db.getSquads()[selectedTeamCode] || db.getSquads()[selectedTeamCode].length === 0) ? (
                  <div className="text-center py-8 text-[#d1d4d1]/40 text-xs font-mono border border-dashed border-white/5 bg-black/10">
                    NO PLAYERS ENROLLED IN {selectedTeamCode} ROSTER YET.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#d1d4d1]/10 font-mono text-[10px] text-zinc-400 uppercase tracking-wider bg-black/20">
                          <th className="py-2.5 px-3">Jersey #</th>
                          <th className="py-2.5 px-3">Player Info</th>
                          <th className="py-2.5 px-2">Position</th>
                          <th className="py-2.5 px-2">Club Details</th>
                          <th className="py-2.5 px-2 text-center">G / A</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(db.getSquads()[selectedTeamCode] || []).map((player, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors leading-relaxed">
                            <td className="py-3 px-3 font-mono font-bold text-sm text-[#3cac3b]">
                              #{player.jerseyNumber}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                {/* IMAGE AVATAR DISPLAY */}
                                {player.image ? (
                                  <img
                                    src={player.image}
                                    alt={player.name}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-full border border-white/15 object-cover shrink-0"
                                    onError={(e) => {
                                      // fallback if link fails
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#1a381e] border border-[#3cac3b]/30 flex items-center justify-center font-mono font-black text-[9px] text-[#3cac3b] shrink-0">
                                    {player.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-sans font-bold text-white block text-sm">{player.name}</span>
                                  {player.image && (
                                    <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">IMAGE READY</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-mono">
                              <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                                player.position === 'FWD' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                                player.position === 'MID' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' :
                                player.position === 'DEF' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                                'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                              }`}>
                                {player.position}
                              </span>
                            </td>
                            <td className="py-3 px-2 font-sans text-zinc-300">
                              {player.club}
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-medium text-white/90">
                              {player.goals} / {player.assists}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleStartEditPlayer(player, idx)}
                                  className="p-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-sm text-zinc-300 font-sans text-[10px] font-bold uppercase cursor-pointer transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePlayerFromRoster(idx, player.name)}
                                  className="p-1 px-2.5 bg-rose-950/40 border border-rose-900/30 text-rose-400 hover:bg-rose-900/40 rounded-sm font-sans text-[10px] font-bold uppercase cursor-pointer transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL_PREDICTIONS tab - admin view of all submitted match predictions */}
      {activeTab === 'ALL_PREDICTIONS' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#252727] border border-[#d1d4d1]/10 p-5 rounded-sm">
            <h3 className="font-sans text-xl font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#3cac3b]" /> Global Prediction Feed
            </h3>
            <p className="text-xs text-[#d1d4d1]/70 mb-5">
              Live feed of all match predictions submitted by analysts. Cross-reference selections and monitor forecasting trends. 
              Showing {predictionsList.length} total predictions.
            </p>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-[#d1d4d1]/10 text-[#d1d4d1]/40 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Date / Round</th>
                    <th className="py-3 px-3">Analyst</th>
                    <th className="py-3 px-3">Match</th>
                    <th className="py-3 px-3 text-center">Prediction</th>
                    <th className="py-3 px-3 text-right">Score Forecast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d4d1]/10 text-white/90">
                  {predictionsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No predictions have been submitted by any users yet.
                      </td>
                    </tr>
                  ) : (
                    [...predictionsList].sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map(pred => {
                      const user = profiles.find(p => p.id === pred.user_id);
                      const match = matches.find(m => m.id === pred.match_id);
                      if (!match) return null;
                      
                      return (
                        <tr key={pred.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <span className="block text-[#3cac3b] font-bold">{match.round}</span>
                            <span className="text-white/50">{new Date(match.start_time).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="block font-bold text-white text-sm">{user?.fullName || 'Unknown User'}</span>
                            <span className="text-white/40">{user?.email || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white uppercase">{match.team_a_name}</span>
                            <span className="text-white/40 mx-2">vs</span>
                            <span className="font-bold text-white uppercase">{match.team_b_name}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-black/60 text-[#3cac3b] border border-[#3cac3b]/25 rounded-sm py-1 px-2 font-bold">
                              {pred.selection}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-base text-white/80">
                            {pred.team_a_pred_score} : {pred.team_b_pred_score}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SUPABASE_SQL_TEMP = `-- --- 2026 FIFA World Cup Prediction Database Schemas & Row-Level Security Policies ---

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  fullName TEXT NOT NULL,
  role TEXT CHECK (role IN ('ANALYST', 'ADMIN')) DEFAULT 'ANALYST',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row-Level Security for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow team analysts to read all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow individual profile owners write access"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Tournament Matches Table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_code VARCHAR(3) NOT NULL,
  team_a_name TEXT NOT NULL,
  team_b_code VARCHAR(3) NOT NULL,
  team_b_name TEXT NOT NULL,
  team_a_score INT,
  team_b_score INT,
  start_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED')) DEFAULT 'SCHEDULED',
  venue TEXT NOT NULL,
  host_city_country VARCHAR(10) CHECK (host_city_country IN ('USA', 'MEXICO', 'CANADA')) NOT NULL,
  round VARCHAR(10) CHECK (round IN ('R32', 'R16', 'QF', 'SF', 'FINAL')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row level Security for Matches (Only Admin edits)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read-only public matches access"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Only verified administrators can override matches"
  ON public.matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- 3. Predictions Table with Temporal Guard Verification
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  selection VARCHAR(3) NOT NULL,
  team_a_pred_score INT NOT NULL,
  team_b_pred_score INT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_match_user_prediction UNIQUE (user_id, match_id)
);

-- Enable Row level Security for Predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on public predictions leaderboard"
  ON public.predictions FOR SELECT
  USING (true);

-- TEMPORAL SECURITY POLICY: Prevent insertions or updates after kickoff timestamps
CREATE POLICY "Prevent retrospective predictions after kickoff"
  ON public.predictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_id 
      AND TIMEZONE('utc', NOW()) < matches.start_time
    )
  );

CREATE POLICY "Allow updates to original predictions prior to kickoff"
  ON public.predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_id 
      AND TIMEZONE('utc', NOW()) < matches.start_time
    )
  );
`;
