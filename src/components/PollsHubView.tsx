/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vote, Award, CheckCircle, Percent, AlertCircle, Sparkles, Flame, Coins } from 'lucide-react';
import { Profile, Poll, PollVote } from '../types';

interface PollsHubViewProps {
  profile: Profile;
  polls: Poll[];
  votes: PollVote[];
  onSubmitVote: (pollId: string, optionId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function PollsHubView({ profile, polls, votes, onSubmitVote }: PollsHubViewProps) {
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper: calculate votes and percentages for an option
  const calculateOptionStats = (pollId: string, optionId: string) => {
    const pollVotes = votes.filter(v => v.poll_id === pollId);
    const totalVotes = pollVotes.length;
    const optionVotes = pollVotes.filter(v => v.option_id === optionId).length;
    const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
    return { count: optionVotes, percentage, total: totalVotes };
  };

  // Helper: check if logged-in user voted for this option
  const userVotedOption = (pollId: string, optionId: string) => {
    return votes.some(v => v.user_id === profile.id && v.poll_id === pollId && v.option_id === optionId);
  };

  // Helper: check if logged-in user voted for this poll
  const userVotedPoll = (pollId: string) => {
    return votes.find(v => v.user_id === profile.id && v.poll_id === pollId);
  };

  const handleVoteSubmit = async (pollId: string, optionId: string) => {
    setSubmittingPollId(pollId);
    setErrorMsg(null);
    const res = await onSubmitVote(pollId, optionId);
    setSubmittingPollId(null);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const totalUserVotes = polls.filter(p => userVotedPoll(p.id)).length;
  const pendingRewardPoints = polls
    .filter(p => p.status === 'OPEN' && userVotedPoll(p.id))
    .reduce((sum, p) => sum + p.pointsReward, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-1 select-text">
      {/* Premium Fan Hub Header Banner */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#d1d4d1]/10 pb-6 relative overflow-hidden">
        <div>
          <span className="font-mono text-xs text-[#e61d25] uppercase tracking-widest font-extrabold flex items-center gap-1.5 animate-pulse">
            <Flame className="w-4 h-4 text-[#e61d25] fill-[#e61d25]" /> FWC 2026 FAN FORECAST STATION
          </span>
          <h2 className="font-sans text-4xl font-black italic tracking-tighter text-white uppercase mt-1">
            Global Fan Opinion Polls
          </h2>
          <p className="text-sm text-[#d1d4d1]/70 mt-1 max-w-2xl">
            Cast your vote below! Resolving polls rewards predictors with massive point bonuses on the global leaderboard.
          </p>
        </div>

        {/* Dynamic score summary blocks */}
        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-[#1a1c1d] to-[#121415] border border-[#d1d4d1]/10 px-5 py-3 rounded-md shadow-lg">
            <span className="block text-[10px] text-[#3cac3b] uppercase tracking-wider font-bold font-mono">YOUR ENGAGEMENT</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-sans font-black text-3xl text-white">{totalUserVotes}</span>
              <span className="text-xs text-[#d1d4d1]/50 font-medium">/{polls.length} Polls</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1a1c1d] to-[#121415] border border-[#d1d4d1]/10 px-5 py-3 rounded-md shadow-lg">
            <span className="block text-[10px] text-yellow-400 uppercase tracking-wider font-bold font-mono">POTENTIAL REWARDS</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-sans font-black text-3xl text-yellow-500 font-mono">+{pendingRewardPoints}</span>
              <span className="text-[10px] text-yellow-400 font-extrabold font-mono">PTS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-rose-300 py-3 px-4 text-xs font-mono rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>VOTING REJECTED: {errorMsg}</span>
        </div>
      )}

      {/* GRID OF CURRENT AVAILABLE POLLS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => {
          const hasVoted = userVotedPoll(poll.id);
          const userSelectedOption = hasVoted?.option_id;
          const isResolved = poll.status === 'RESOLVED';

          return (
            <div
              key={poll.id}
              className={`flex flex-col justify-between border rounded-md p-5 backdrop-blur-md transition-all duration-300 relative overflow-hidden ${
                isResolved
                  ? 'bg-black/40 border-[#d1d4d1]/5 opacity-90'
                  : 'bg-[#151718]/80 border-[#d1d4d1]/10 hover:border-[#3cac3b]/30 shadow-xl'
              }`}
            >
              <div>
                {/* Header Flag / Badge line */}
                <div className="flex justify-between items-center mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-[#1e2021] border border-[#d1d4d1]/10 px-2.5 py-1 text-[10px] font-mono text-yellow-400 font-extrabold">
                    <Coins className="w-3.5 h-3.5" /> +{poll.pointsReward} PTS REWARD
                  </span>
                  
                  {isResolved ? (
                    <span className="text-[10px] font-mono font-bold bg-[#3cac3b]/20 border border-[#3cac3b]/40 text-[#3cac3b] px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 fill-emerald-500 text-black" /> Completed / Resolved
                    </span>
                  ) : hasVoted ? (
                    <span className="text-[10px] font-mono font-bold bg-sky-500/20 border border-sky-500/40 text-sky-300 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Cast Vote Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-red-500/25 border border-red-500/40 text-rose-300 px-2 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
                      Pending Action
                    </span>
                  )}
                </div>

                {/* Poll query text */}
                <h3 className="font-sans font-black tracking-tight text-white text-lg leading-snug mb-5">
                  {poll.question}
                </h3>

                {/* Poll options renderer */}
                <div className="space-y-3.5">
                  {poll.options.map((opt) => {
                    const { count, percentage, total } = calculateOptionStats(poll.id, opt.id);
                    const isMyChoice = userVotedOption(poll.id, opt.id);
                    const isCorrectOption = isResolved && poll.correctOptionId === opt.id;
                    const showStats = hasVoted || isResolved;

                    // Choose colors based on state
                    let barColor = 'bg-[#434647]';
                    let flagBorder = 'border-transparent';
                    if (isCorrectOption) {
                      barColor = 'bg-gradient-to-r from-[#3cac3b]/40 to-[#3cac3b]/70';
                      flagBorder = 'border-[#3cac3b]';
                    } else if (isMyChoice) {
                      barColor = isResolved ? 'bg-zinc-700' : 'bg-gradient-to-r from-[#2051ad]/40 to-[#2051ad]/80';
                      flagBorder = isResolved ? 'border-zinc-500' : 'border-[#2051ad]';
                    }

                    return (
                      <div key={opt.id} className="relative group rounded-md overflow-hidden">
                        
                        {/* Interactive or resolved background progress bar */}
                        {showStats && (
                          <div 
                            className={`absolute inset-0 transition-all duration-1000 ${barColor}`}
                            style={{ width: `${percentage}%` }}
                          />
                        )}

                        <button
                          disabled={isResolved || submittingPollId === poll.id}
                          onClick={() => handleVoteSubmit(poll.id, opt.id)}
                          className={`w-full text-left py-3 px-4 border text-xs font-semibold rounded-md relative z-10 flex justify-between items-center transition-all ${
                            isResolved
                              ? 'border-[#d1d4d1]/5 cursor-default'
                              : 'hover:bg-white/5 active:scale-[0.99]'
                          } ${
                            isMyChoice 
                              ? 'border-[#2051ad] bg-[#2051ad]/10 text-white' 
                              : isCorrectOption 
                              ? 'border-[#3cac3b] bg-[#3cac3b]/10 text-white font-extrabold' 
                              : 'border-[#eaeeee]/10 text-[#d1d4d1]/80 hover:border-white/20'
                          }`}
                        >
                          {/* Label info */}
                          <span className="flex items-center gap-2 max-w-[80%]">
                            {isCorrectOption && <CheckCircle className="w-4 h-4 text-[#3cac3b] fill-emerald-500/20 shrink-0" />}
                            {!isCorrectOption && isMyChoice && <Vote className="w-4 h-4 text-sky-400 shrink-0" />}
                            <span className="truncate">{opt.text}</span>
                          </span>

                          {/* Stats numbers if already voted / closed */}
                          {showStats && (
                            <span className="font-mono text-[10px] text-white/90 font-bold shrink-0 bg-black/30 px-1.5 py-0.5 rounded-sm">
                              {percentage}% ({count})
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reward status bottom footer line */}
              <div className="mt-5 pt-3.5 border-t border-[#d1d4d1]/5 flex justify-between items-center text-[10px] font-mono text-[#d1d4d1]/50">
                <span>TOTAL VOTE REGISTER: {votes.filter(v => v.poll_id === poll.id).length} CASTS</span>
                
                {isResolved ? (
                  poll.correctOptionId === userSelectedOption ? (
                    <span className="text-[#3cac3b] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#3cac3b]" /> SUCCESSFULLY REWARDED +{poll.pointsReward} PTS
                    </span>
                  ) : (
                    <span className="text-[#e61d25]">INCORRECT GUESS / COMPLETED</span>
                  )
                ) : (
                  userSelectedOption && (
                    <span className="text-sky-400 font-semibold uppercase">Locked for evaluation</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
