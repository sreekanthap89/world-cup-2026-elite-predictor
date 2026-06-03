import React from 'react';
import { Match, Prediction } from '../types';
import { Award, CheckCircle, ShieldAlert } from 'lucide-react';

interface MyPredictionsViewProps {
  matches: Match[];
  predictions: Prediction[];
  currentUserId: string;
  onMatchClick: (match: Match) => void;
}

export default function MyPredictionsView({
  matches,
  predictions,
  currentUserId,
  onMatchClick
}: MyPredictionsViewProps) {
  
  // Filter for predictions made by the current user
  const userPreds = predictions.filter(p => p.user_id === currentUserId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <span className="font-mono text-[10px] text-[#3cac3b] uppercase tracking-widest font-bold">
            USER AUDIT FEED
          </span>
          <h2 className="font-sans text-2xl font-black italic uppercase text-white tracking-tighter">
            My Match Predictions
          </h2>
          <p className="text-sm text-[#d1d4d1]/70 mt-1 max-w-2xl">
            Review all your forecasted match outcomes. Matches are open for update until their predictive windows lock locally down.
          </p>
        </div>
      </div>

      <div className="bg-[#252727] border border-[#d1d4d1]/10 rounded-sm overflow-hidden p-1 lg:p-4">
        {userPreds.length === 0 ? (
          <div className="p-8 text-center text-[#d1d4d1]/40 text-xs font-mono">
            You have not made any match predictions yet. Return to the Bracket View to start forecasting matches.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#d1d4d1]/10 text-white/50 uppercase tracking-widest text-[9px] font-bold">
                  <th className="py-3 px-3">Date / Round</th>
                  <th className="py-3 px-3">Forecasted Match</th>
                  <th className="py-3 px-3 text-center">Your Score Prediction</th>
                  <th className="py-3 px-3 text-center">Winner Predicted</th>
                  <th className="py-3 px-3 text-right">Official Final Score</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1d4d1]/10 font-medium text-white/90">
                {userPreds.map(pred => {
                  const match = matches.find(m => m.id === pred.match_id);
                  if (!match) return null;

                  const deadlineStr = match.prediction_deadline || match.start_time;
                  const isLocked = new Date(deadlineStr).getTime() < Date.now();

                  return (
                    <tr key={pred.id} className="transition-colors hover:bg-white/5 group">
                      <td className="py-4 px-3 text-[10px] text-[#d1d4d1]/60">
                        <span className="block text-white font-bold">{match.round}</span>
                        {new Date(match.start_time).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                           <span className="font-bold">{match.team_a_name}</span>
                           <span className="text-[#d1d4d1]/40 text-[9px]">VS</span>
                           <span className="font-bold">{match.team_b_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="inline-block px-3 py-1 bg-black/40 border border-[#d1d4d1]/10 rounded-sm font-bold text-lg text-[#3cac3b]">
                          {pred.team_a_pred_score} - {pred.team_b_pred_score}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center font-bold">
                         {pred.selection}
                      </td>
                      <td className="py-4 px-3 text-right">
                        {match.status === 'COMPLETED' ? (
                           <span className="inline-block px-3 py-1 bg-black/60 border border-white/10 rounded-sm font-bold text-lg">
                             {match.team_a_score} - {match.team_b_score}
                           </span>
                        ) : (
                          <span className="text-[10px] text-[#d1d4d1]/40 tracking-wider">UNTIL POST MATCH</span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {isLocked ? (
                           <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[9px] uppercase font-bold rounded-sm whitespace-nowrap">
                             <ShieldAlert className="w-3 h-3" /> Locked
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] uppercase font-bold rounded-sm whitespace-nowrap">
                             <CheckCircle className="w-3 h-3" /> Editable
                           </span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => onMatchClick(match)}
                          className="bg-[#252727] border border-[#d1d4d1]/10 hover:border-[#3cac3b] hover:bg-black/50 text-white p-2 rounded-sm transition-all focus:outline-none"
                          title="View or Edit Prediction"
                        >
                           <Award className="w-4 h-4 text-[#3cac3b]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
