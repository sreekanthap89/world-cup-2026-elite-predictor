/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string; // UUID
  email: string;
  employee_id: string;
  phone_number: string;
  fullName: string;
  role: 'ANALYST' | 'ADMIN';
  rank: number;
  accuracy: number;
  points: number;
}

export type RoundType = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL';

export interface Match {
  id: string; // UUID
  team_a_id: string; // Code e.g. 'USA'
  team_a_name: string;
  team_a_flag: string; // Background visual identifier or SVG colors
  team_b_id: string; // Code e.g. 'CAN'
  team_b_name: string;
  team_b_flag: string;
  team_a_score: number | null;
  team_b_score: number | null;
  start_time: string; // ISO String
  prediction_deadline?: string; // Admin-specified locking time (defaults to start_time if absent)
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  round: RoundType;
  venue: string;
  host_country: 'CAN' | 'MEX' | 'USA';
  bracket_wing: 'LEFT' | 'RIGHT'; // Flanking wing progress
  next_match_id: string | null; // Pointer to advance winner
  next_match_slot?: 'A' | 'B'; // Segment slot for winner promotion (Team A or Team B)
  group?: string; // Optional group stage identifier, e.g. 'Group A'
}

export interface Prediction {
  id: string; // UUID
  user_id: string;
  match_id: string;
  selection: string; // Winner team code e.g. 'USA'
  team_a_pred_score: number;
  team_b_pred_score: number;
  created_at: string;
}

export interface LedgerBlock {
  index: number;
  timestamp: string;
  action: string;
  payload: string;
  previous_hash: string;
  hash: string;
}

export interface Player {
  jerseyNumber: number;
  name: string;
  position: string;
  club: string;
  goals: number;
  assists: number;
  image?: string; // Optional player avatar or photo url
}

export interface TeamStats {
  winProbability: number;
  avgGoalsGame: number;
  cleanSheets: string;
  momentum: number[]; // Trend for past 5 matches e.g. [10, 20, 15, 45, 5]
  flagUrl?: string; // Optional custom flag image URL overriding ISO codes
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  correctOptionId?: string | null;
  status: 'OPEN' | 'RESOLVED';
  pointsReward: number;
}

export interface PollVote {
  id: string;
  user_id: string;
  poll_id: string;
  option_id: string;
  created_at: string;
}

