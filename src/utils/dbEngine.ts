/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile, Match, Prediction, LedgerBlock, Player, TeamStats, Poll, PollVote } from '../types';

const STORAGE_PREFIX = 'FWC2026_PREDICTOR_';
const PROFILE_KEY = `FWC2026_PREDICTOR_PROFILE`;

export class ClientDBEngine {
  private profile: Profile = {
    id: 'user-predictor-alpha',
    fullName: 'Predictor_Alpha',
    email: 'sreekanthap90@gmail.com',
    employee_id: 'FIFA-2026-9901',
    phone_number: '+1 (555) 012-2026',
    role: 'ADMIN',
    rank: 4,
    accuracy: 94,
    points: 8420
  };
  private profiles: Profile[] = [];
  private matches: Match[] = [];
  private predictions: Prediction[] = [];
  private ledger: LedgerBlock[] = [];
  private squads: Record<string, Player[]> = {};
  private teamStats: Record<string, TeamStats> = {};
  private polls: Poll[] = [];
  private votes: PollVote[] = [];
  private isTampered: boolean = false;

  constructor() {
    // Initial sync load if saved profile exists
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        this.profile = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading stored cache on launch", e);
    }
  }

  /**
   * Syncs latest central database values from the Express backend
   */
  private async syncFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/db/get');
      if (!res.ok) throw new Error('API server fetch failure');
      const data = await res.json();
      
      this.profiles = data.profiles || [];
      this.matches = data.matches || [];
      this.predictions = data.predictions || [];
      this.ledger = data.ledger || [];
      this.squads = data.squads || {};
      this.teamStats = data.teamStats || {};
      this.polls = data.polls || [];
      this.votes = data.votes || [];
      this.isTampered = !!data.isTampered;

      // Update current profile reference if it exists in the updated profiles
      const currentId = this.profile.id;
      const refreshedProfile = this.profiles.find(p => p.id === currentId);
      if (refreshedProfile) {
        this.profile = refreshedProfile;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(refreshedProfile));
      }
    } catch (e) {
      console.error('Error synchronizing database state from server:', e);
    }
  }

  /**
   * Initializes state and computes system verification
   */
  public async initializeAndVerify(): Promise<boolean> {
    await this.syncFromServer();
    return !this.isTampered;
  }

  public getProfile(): Profile {
    return this.profile;
  }

  public getProfiles(): Profile[] {
    return this.profiles;
  }

  public getMatches(): Match[] {
    return this.matches;
  }

  public getPredictions(): Prediction[] {
    return this.predictions;
  }

  public getSquads(): Record<string, Player[]> {
    return this.squads;
  }

  public getTeamStats(): Record<string, TeamStats> {
    return this.teamStats;
  }

  public getLedger(): LedgerBlock[] {
    return this.ledger;
  }

  public checkIsTampered(): boolean {
    return this.isTampered;
  }

  /**
   * Updates a user profile
   */
  public async updateProfile(updated: Partial<Profile>): Promise<void> {
    const fullUpdated = { ...this.profile, ...updated } as Profile;
    try {
      const res = await fetch('/api/db/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated: fullUpdated })
      });
      if (res.ok) {
        this.profile = fullUpdated;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(fullUpdated));
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed updating profile', e);
    }
  }

  /**
   * Admin-initiated profile update
   */
  public async saveOrUpdateProfileDirectly(targetProfile: Profile): Promise<void> {
    try {
      const res = await fetch('/api/db/save-profile-directly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfile })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed saving profile directly', e);
    }
  }

  /**
   * Admin-initiated profile removal
   */
  public async deleteProfileDirectly(profileId: string): Promise<void> {
    try {
      const res = await fetch('/api/db/delete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed deleting profile directly', e);
    }
  }

  /**
   * Safe registration
   */
  public async registerNewUser(profile: Profile): Promise<void> {
    try {
      const res = await fetch('/api/db/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed registering new user', e);
    }
  }

  /**
   * Commit squad roster revisions to secure backend database
   */
  public async updateSquad(teamCode: string, roster: Player[]): Promise<void> {
    try {
      const res = await fetch('/api/db/update-squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode, roster })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed updating squad roster on server', e);
    }
  }

  /**
   * Commit team stats and overview revisions to secure backend database
   */
  public async updateTeamStats(teamCode: string, stats: TeamStats): Promise<void> {
    try {
      const res = await fetch('/api/db/update-team-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode, stats })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed updating team stats profile on server', e);
    }
  }

  /**
   * Resets a user password
   */
  public async resetUserPassword(email: string, newPassword: string): Promise<void> {
    try {
      const res = await fetch('/api/db/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed resetting user password', e);
    }
  }

  /**
   * Synchronous lookup against server-seeded participant profiles
   */
  public attemptLogin(email: string, employeeId: string): Profile | null {
    const found = this.profiles.find(
      p => p.email.toLowerCase() === email.toLowerCase() && (!employeeId || p.employee_id === employeeId)
    );
    if (found) {
      this.profile = found;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(found));
      return found;
    }
    return null;
  }

  /**
   * Administrator gate check
   */
  public attemptAdminLogin(email: string, securityKey: string): Profile | null {
    if (securityKey !== 'ADMIN2026') return null;
    const found = this.profiles.find(
      p => p.email.toLowerCase() === email.toLowerCase() && p.role === 'ADMIN'
    );
    if (found) {
      this.profile = found;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(found));
      return found;
    }
    return null;
  }

  /**
   * Resets predictions and ledger
   */
  public async resetDatabaseToClean(): Promise<void> {
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed resetting data', e);
    }
  }

  /**
   * Submit forecasts to server
   */
  public async submitPrediction(
    matchId: string,
    selection: string,
    scoreA: number,
    scoreB: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/db/submit-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.profile.id,
          matchId,
          selection,
          scoreA,
          scoreB
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Server rejected submission.' };
      }

      await this.syncFromServer();
      return { success: true };
    } catch (e) {
      console.error('Error submitting prediction', e);
      return { success: false, error: 'Network communication failure.' };
    }
  }

  /**
   * Adjust schedules or override scores (Administrative)
   */
  public async overrideMatchStatus(matchId: string, updates: Partial<Match>): Promise<void> {
    try {
      const res = await fetch('/api/db/override-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, updates })
      });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed score override on server', e);
    }
  }

  /**
   * Forces a mock tamper simulation to display integrity validation
   */
  public async simulateTampering(): Promise<void> {
    try {
      const res = await fetch('/api/db/simulate-tamper', { method: 'POST' });
      if (res.ok) {
        await this.syncFromServer();
      }
    } catch (e) {
      console.error('Failed tampering simulation', e);
    }
  }

  public getPolls(): Poll[] {
    return this.polls;
  }

  public getVotes(): PollVote[] {
    return this.votes;
  }

  public async submitVote(pollId: string, optionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/db/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.profile.id,
          pollId,
          optionId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Server rejected vote.' };
      }

      await this.syncFromServer();
      return { success: true };
    } catch (e) {
      console.error('Error submitting vote', e);
      return { success: false, error: 'Network communication failure.' };
    }
  }

  public async createPoll(question: string, options: string[], pointsReward: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/db/create-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options, pointsReward })
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Server rejected poll creation.' };
      }

      await this.syncFromServer();
      return { success: true };
    } catch (e) {
      console.error('Error creating poll', e);
      return { success: false, error: 'Network communication failure.' };
    }
  }

  public async resolvePoll(pollId: string, correctOptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/db/resolve-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, correctOptionId })
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Server rejected resolving poll.' };
      }

      await this.syncFromServer();
      return { success: true };
    } catch (e) {
      console.error('Error resolving poll', e);
      return { success: false, error: 'Network communication failure.' };
    }
  }
}
