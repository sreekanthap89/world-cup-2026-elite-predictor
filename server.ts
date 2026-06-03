/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { Match, Prediction, Profile, LedgerBlock, Player, TeamStats } from "./src/types";

// Seed data from source ts file
import { INITIAL_MATCHES, OFFICIAL_ROSTERS, OFFICIAL_TEAM_STATS } from "./src/data";

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), "db.json");

/**
 * Standard server-side hash function for ledger security
 */
function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const SEEDED_PROFILES: Profile[] = [
  { id: 'user-rossi', fullName: 'Marco Rossi', email: 'marco.rossi@fifa.com', employee_id: 'FIFA-2026-0041', phone_number: '+1 (555) 012-0041', role: 'ANALYST', rank: 1, accuracy: 98, points: 9840 },
  { id: 'user-jenkins', fullName: 'Sarah Jenkins', email: 'sarah.j@predictor-net.org', employee_id: 'FIFA-2026-0129', phone_number: '+1 (555) 012-0129', role: 'ANALYST', rank: 2, accuracy: 95, points: 9510 },
  { id: 'user-khan', fullName: 'Ahmed Khan', email: 'ahmed_k@al-jazeera.com', employee_id: 'FIFA-2026-0331', phone_number: '+1 (555) 012-0331', role: 'ANALYST', rank: 3, accuracy: 91, points: 9120 },
  { id: 'user-predictor-alpha', fullName: 'Predictor_Alpha', email: 'sreekanthap90@gmail.com', employee_id: 'FIFA-2026-9901', phone_number: '+1 (555) 012-2026', role: 'ADMIN', rank: 4, accuracy: 94, points: 8420 }
];

const SEEDED_PREDICTIONS: Prediction[] = [
  { id: 'pred-1', user_id: 'user-rossi', match_id: 'm-left-r16-1', selection: 'USA', team_a_pred_score: 2, team_b_pred_score: 0, created_at: '2026-06-01T12:00:00Z' },
  { id: 'pred-2', user_id: 'user-jenkins', match_id: 'm-left-r16-1', selection: 'USA', team_a_pred_score: 3, team_b_pred_score: 1, created_at: '2026-06-01T14:30:00Z' },
  { id: 'pred-3', user_id: 'user-khan', match_id: 'm-left-r16-1', selection: 'COLOMBIA', team_a_pred_score: 1, team_b_pred_score: 2, created_at: '2026-06-01T18:15:00Z' }
];

interface ServerDB {
  profiles: Profile[];
  matches: Match[];
  predictions: Prediction[];
  ledger: LedgerBlock[];
  isTampered: boolean;
  squads: Record<string, Player[]>;
  teamStats: Record<string, TeamStats>;
}

let dbCache: ServerDB = {
  profiles: [...SEEDED_PROFILES],
  matches: [...INITIAL_MATCHES],
  predictions: [...SEEDED_PREDICTIONS],
  ledger: [],
  isTampered: false,
  squads: { ...OFFICIAL_ROSTERS },
  teamStats: { ...OFFICIAL_TEAM_STATS }
};

// Cryptographic verification helper
function verifyServerLedger(ledger: LedgerBlock[]): { isValid: boolean } {
  if (ledger.length === 0) return { isValid: true };
  let lastHash = "0000000000000000000000000000000000000000000000000000000000000000";
  for (let i = 0; i < ledger.length; i++) {
    const block = ledger[i];
    if (block.previous_hash !== lastHash) {
      return { isValid: false };
    }
    const inputStr = `${block.index}|${block.timestamp}|${block.action}|${block.payload}|${block.previous_hash}`;
    const computedHash = sha256(inputStr);
    if (block.hash !== computedHash) {
      return { isValid: false };
    }
    lastHash = computedHash;
  }
  return { isValid: true };
}

// Append ledger action on the server
function appendServerLedgerAction(action: string, payload: string) {
  const lastBlock = dbCache.ledger[dbCache.ledger.length - 1];
  const previousHash = lastBlock ? lastBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000";
  const index = dbCache.ledger.length;
  const timestamp = new Date().toISOString();

  const inputStr = `${index}|${timestamp}|${action}|${payload}|${previousHash}`;
  const hash = sha256(inputStr);

  const block: LedgerBlock = {
    index,
    timestamp,
    action,
    payload,
    previous_hash: previousHash,
    hash
  };

  dbCache.ledger.push(block);
}

// Read database file
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const p = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(p);
      if (parsed && Array.isArray(parsed.matches) && parsed.matches.length >= 104) {
        dbCache = {
          ...parsed,
          squads: parsed.squads || { ...OFFICIAL_ROSTERS },
          teamStats: parsed.teamStats || { ...OFFICIAL_TEAM_STATS }
        };
        // Verify ledger integrity
        const check = verifyServerLedger(dbCache.ledger);
        dbCache.isTampered = !check.isValid;
        return;
      }
    }
  } catch (e) {
    console.error("Failed to load server db.json file, seeding...", e);
  }

  // If we reach here, we need to seed the file
  dbCache = {
    profiles: [...SEEDED_PROFILES],
    matches: [...INITIAL_MATCHES],
    predictions: [...SEEDED_PREDICTIONS],
    ledger: [],
    isTampered: false,
    squads: { ...OFFICIAL_ROSTERS },
    teamStats: { ...OFFICIAL_TEAM_STATS }
  };
  
  // Seed Genesis block
  appendServerLedgerAction("GENESIS", "Server database bootstrapped securely.");
  saveDatabaseToDisk();
}

// Write database file securely
function saveDatabaseToDisk() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf8");
  } catch (e) {
    console.error("Failed writing dbCache to disk", e);
  }
}

// Recalculate Leaderboards after score override
function recomputeLeaderboardOnServer() {
  dbCache.profiles = dbCache.profiles.map(usr => {
    const usrPreds = dbCache.predictions.filter(p => p.user_id === usr.id);
    if (usrPreds.length === 0) return usr;

    let correctCount = 0;
    let totalAssessed = 0;
    let calculatedPoints = 0;

    usrPreds.forEach(pred => {
      const match = dbCache.matches.find(m => m.id === pred.match_id);
      if (match && match.status === 'COMPLETED' && match.team_a_score !== null && match.team_b_score !== null) {
        totalAssessed++;
        const sa = match.team_a_score;
        const sb = match.team_b_score;
        const actualWinner = sa > sb ? match.team_a_id : sb > sa ? match.team_b_id : 'DRAW';
        const predictedWinner = pred.selection;

        if (predictedWinner === actualWinner) {
          correctCount++;
          calculatedPoints += 250;
          if (pred.team_a_pred_score === sa && pred.team_b_pred_score === sb) {
            calculatedPoints += 150;
          }
        }
      }
    });

    const accuracy = totalAssessed > 0 ? Math.round((correctCount / totalAssessed) * 100) : 75;

    return {
      ...usr,
      points: usr.points > 2000 ? usr.points + (calculatedPoints ? 20 : 0) : 1000 + calculatedPoints,
      accuracy: totalAssessed > 0 ? accuracy : usr.accuracy
    };
  }).sort((a, b) => b.points - a.points);

  dbCache.profiles = dbCache.profiles.map((usr, index) => ({
    ...usr,
    rank: index + 1
  }));
}

// Initialize on server run
loadDatabase();

// --- API IMPLEMENTATIONS ---

// 1. Get entire database state
app.get("/api/db/get", (req, res) => {
  res.json(dbCache);
});

// 2. Update a profile
app.post("/api/db/update-profile", (req, res) => {
  const { updated } = req.body;
  if (!updated || !updated.id) {
    return res.status(400).json({ error: "Invalid profile payload" });
  }

  dbCache.profiles = dbCache.profiles.map(p => p.id === updated.id ? { ...p, ...updated } : p);
  appendServerLedgerAction("UPDATE_PROFILE", JSON.stringify({ email: updated.email, fullName: updated.fullName }));
  saveDatabaseToDisk();

  res.json({ success: true, profiles: dbCache.profiles });
});

// 3. Admin direct save/update profile
app.post("/api/db/save-profile-directly", (req, res) => {
  const { targetProfile } = req.body;
  if (!targetProfile || !targetProfile.id) {
    return res.status(400).json({ error: "Invalid profile data" });
  }

  const exists = dbCache.profiles.some(p => p.id === targetProfile.id);
  if (exists) {
    dbCache.profiles = dbCache.profiles.map(p => p.id === targetProfile.id ? targetProfile : p);
  } else {
    dbCache.profiles.push(targetProfile);
  }

  appendServerLedgerAction("ADMIN_SAVE_PROFILE", JSON.stringify({ id: targetProfile.id, fullName: targetProfile.fullName, role: targetProfile.role }));
  saveDatabaseToDisk();
  res.json({ success: true, profiles: dbCache.profiles });
});

// 4. Admin delete profile
app.post("/api/db/delete-profile", (req, res) => {
  const { profileId } = req.body;
  if (!profileId) {
    return res.status(400).json({ error: "Invalid profile ID" });
  }

  dbCache.profiles = dbCache.profiles.filter(p => p.id !== profileId);
  dbCache.predictions = dbCache.predictions.filter(p => p.user_id !== profileId);

  appendServerLedgerAction("ADMIN_DELETE_PROFILE", JSON.stringify({ profileId }));
  saveDatabaseToDisk();
  res.json({ success: true, profiles: dbCache.profiles, predictions: dbCache.predictions });
});

// 5. Register participant
app.post("/api/db/register-user", (req, res) => {
  const { profile } = req.body;
  if (!profile || !profile.email || !profile.employee_id) {
    return res.status(400).json({ error: "Invalid registration payload" });
  }

  const exists = dbCache.profiles.find(
    p => p.email.toLowerCase() === profile.email.toLowerCase() || p.employee_id === profile.employee_id
  );

  if (!exists) {
    dbCache.profiles.push(profile);
    appendServerLedgerAction("USER_REGISTERED", JSON.stringify({ email: profile.email, employee_id: profile.employee_id, fullName: profile.fullName }));
    saveDatabaseToDisk();
  }

  res.json({ success: true, profiles: dbCache.profiles });
});

// Reset Password Access Key
app.post("/api/db/reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const found = dbCache.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (found) {
    found.employee_id = newPassword;
    appendServerLedgerAction("RESET_PASSWORD", JSON.stringify({ email }));
    saveDatabaseToDisk();
    return res.json({ success: true, profiles: dbCache.profiles });
  }
  res.status(404).json({ error: "User profile email not found" });
});

// 6. Forecast submissions with temporal validation using admin eligible window deadlines
app.post("/api/db/submit-prediction", (req, res) => {
  const { userId, matchId, selection, scoreA, scoreB } = req.body;
  if (!userId || !matchId || !selection) {
    return res.status(400).json({ error: "Invalid forecast request content" });
  }

  const targetMatch = dbCache.matches.find(m => m.id === matchId);
  if (!targetMatch) {
    return res.status(400).json({ error: "Target match not found in roster database" });
  }

  // Use the admin set prediction deadline if specified, otherwise default to match start time (kickoff)
  const deadlineStr = targetMatch.prediction_deadline || targetMatch.start_time;
  const deadlineTime = new Date(deadlineStr).getTime();
  const currTime = Date.now();

  if (currTime >= deadlineTime) {
    return res.status(403).json({ error: `Temporal Blocked: Prediction window closed on ${new Date(deadlineStr).toLocaleString()}. No edits possible.` });
  }

  const newPrediction: Prediction = {
    id: crypto.randomUUID(),
    user_id: userId,
    match_id: matchId,
    selection,
    team_a_pred_score: Number(scoreA),
    team_b_pred_score: Number(scoreB),
    created_at: new Date().toISOString()
  };

  dbCache.predictions = dbCache.predictions.filter(p => !(p.match_id === matchId && p.user_id === userId));
  dbCache.predictions.push(newPrediction);

  appendServerLedgerAction(
    "SUBMIT_PREDICTION",
    JSON.stringify({ user_id: userId, match_id: matchId, selection, scoreA, scoreB })
  );

  saveDatabaseToDisk();
  res.json({ success: true, predictions: dbCache.predictions });
});

// Update Squad Roster
app.post("/api/db/update-squad", (req, res) => {
  const { teamCode, roster } = req.body;
  if (!teamCode || !Array.isArray(roster)) {
    return res.status(400).json({ error: "Invalid squad roster payload" });
  }

  dbCache.squads[teamCode] = roster;
  appendServerLedgerAction("UPDATE_SQUAD", JSON.stringify({ teamCode, playerCount: roster.length }));
  saveDatabaseToDisk();
  res.json({ success: true, squads: dbCache.squads });
});

// Update Team Profile/Stats
app.post("/api/db/update-team-stats", (req, res) => {
  const { teamCode, stats } = req.body;
  if (!teamCode || !stats) {
    return res.status(400).json({ error: "Invalid team stats payload" });
  }

  dbCache.teamStats[teamCode] = stats;

  if (stats.flagUrl) {
    dbCache.matches = dbCache.matches.map(m => {
      let changed = false;
      let team_a_flag = m.team_a_flag;
      let team_b_flag = m.team_b_flag;
      if (m.team_a_id === teamCode) {
        team_a_flag = stats.flagUrl;
        changed = true;
      }
      if (m.team_b_id === teamCode) {
        team_b_flag = stats.flagUrl;
        changed = true;
      }
      return changed ? { ...m, team_a_flag, team_b_flag } : m;
    });
  }

  appendServerLedgerAction("UPDATE_TEAM_STATS", JSON.stringify({ teamCode, flagUpdated: !!stats.flagUrl }));
  saveDatabaseToDisk();
  res.json({ success: true, teamStats: dbCache.teamStats, matches: dbCache.matches });
});

// 7. Admin Score Override
app.post("/api/db/override-match", (req, res) => {
  const { matchId, updates } = req.body;
  if (!matchId || !updates) {
    return res.status(400).json({ error: "Invalid score override payload" });
  }

  dbCache.matches = dbCache.matches.map(m => {
    if (m.id === matchId) {
      return { ...m, ...updates };
    }
    return m;
  });

  const targetMatch = dbCache.matches.find(m => m.id === matchId);
  if (targetMatch && targetMatch.status === 'COMPLETED' && targetMatch.next_match_id) {
    const scoreA = targetMatch.team_a_score ?? 0;
    const scoreB = targetMatch.team_b_score ?? 0;

    const winnerId = scoreA >= scoreB ? targetMatch.team_a_id : targetMatch.team_b_id;
    const winnerName = scoreA >= scoreB ? targetMatch.team_a_name : targetMatch.team_b_name;
    const winnerFlag = scoreA >= scoreB ? targetMatch.team_a_flag : targetMatch.team_b_flag;

    const nxtId = targetMatch.next_match_id;
    const nxtSlot = targetMatch.next_match_slot || (targetMatch.id.endsWith('-1') ? 'A' : 'B');

    dbCache.matches = dbCache.matches.map(m => {
      if (m.id === nxtId) {
        if (nxtSlot === 'A') {
          return {
            ...m,
            team_a_id: winnerId,
            team_a_name: winnerName,
            team_a_flag: winnerFlag
          };
        } else {
          return {
            ...m,
            team_b_id: winnerId,
            team_b_name: winnerName,
            team_b_flag: winnerFlag
          };
        }
      }
      return m;
    });
  }

  recomputeLeaderboardOnServer();
  appendServerLedgerAction("OVERRIDE_MATCH", JSON.stringify({ matchId, ...updates }));
  saveDatabaseToDisk();

  res.json({ success: true, matches: dbCache.matches, profiles: dbCache.profiles });
});

// 8. Reset whole db
app.post("/api/db/reset", (req, res) => {
  dbCache = {
    profiles: [...SEEDED_PROFILES],
    matches: [...INITIAL_MATCHES],
    predictions: [...SEEDED_PREDICTIONS],
    ledger: [],
    isTampered: false,
    squads: { ...OFFICIAL_ROSTERS },
    teamStats: { ...OFFICIAL_TEAM_STATS }
  };

  appendServerLedgerAction("GENESIS", "Database reset and re-verified successfully on administrative command.");
  saveDatabaseToDisk();

  res.json({ success: true, ...dbCache });
});

// 9. Tamper Simulation
app.post("/api/db/simulate-tamper", (req, res) => {
  const bogusPred: Prediction = {
    id: "hacked-uuid-server",
    user_id: "user-predictor-alpha",
    match_id: "m-r32-1",
    selection: "FRANCE",
    team_a_pred_score: 99,
    team_b_pred_score: 0,
    created_at: new Date().toISOString()
  };

  dbCache.predictions = dbCache.predictions.filter(p => !(p.match_id === "m-r32-1" && p.user_id === "user-predictor-alpha"));
  dbCache.predictions.push(bogusPred);

  const poisonedBlock: LedgerBlock = {
    index: dbCache.ledger.length,
    timestamp: new Date().toISOString(),
    action: 'TAMPER_INJECTED',
    payload: '{"bypassed": true}',
    previous_hash: 'ILLEGAL_CORRUPTED_HASH_LINK_FOR_SIMULATION',
    hash: 'BOGUS_BLOCK_HASH_8F92B'
  };

  dbCache.ledger.push(poisonedBlock);
  dbCache.isTampered = true;
  saveDatabaseToDisk();

  res.json({ success: true, ...dbCache });
});

// --- Vite Dev or static Production middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
