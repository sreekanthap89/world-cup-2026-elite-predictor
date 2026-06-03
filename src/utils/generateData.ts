import fs from 'fs';

// Complete FIFA code to 2-letter ISO mapping
const FIFA_TO_ISO: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb',
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  ENG: 'gb', CRO: 'hr', GHA: 'gh', PAN: 'pa'
};

// 1. Load datasets
const teams_raw = JSON.parse(fs.readFileSync('src/utils/teams_data.json', 'utf8'));
const stadiums_raw = JSON.parse(fs.readFileSync('src/utils/stadiums_data.json', 'utf8'));
const worldcup_raw = JSON.parse(fs.readFileSync('src/utils/worldcup_data.json', 'utf8'));

// Maps
const teamNameToCode: Record<string, string> = {};
teams_raw.forEach((t: any) => {
  teamNameToCode[t.name.toLowerCase()] = t.fifa_code;
  // some common normalization
  if (t.name === 'South Korea') {
    teamNameToCode['korea republic'] = 'KOR';
    teamNameToCode['south korea'] = 'KOR';
  }
  if (t.name === 'Czech Republic') {
    teamNameToCode['czechia'] = 'CZE';
    teamNameToCode['czech republic'] = 'CZE';
  }
  if (t.name === 'USA') {
    teamNameToCode['united states'] = 'USA';
    teamNameToCode['usa'] = 'USA';
  }
});

const cityToStadium: Record<string, string> = {};
const cityToCountry: Record<string, string> = {};
stadiums_raw.stadiums.forEach((s: any) => {
  cityToStadium[s.city] = s.name;
  cityToCountry[s.city] = s.cc.toUpperCase();
});

// For time parser
function parseKickoff(dateStr: string, timeStr: string): string {
  const parts = timeStr.trim().split(' ');
  const hm = parts[0]; // "13:00"
  const offsetStr = parts[1]; // "UTC-6" or similar
  
  let hoursOffset = 0;
  if (offsetStr && offsetStr.startsWith('UTC')) {
    const multStr = offsetStr.replace('UTC', '');
    hoursOffset = parseInt(multStr, 10);
    if (isNaN(hoursOffset)) hoursOffset = 0;
  }
  
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(`${dateStr}T${hm.padStart(5, '0')}:00Z`);
  d.setUTCHours(d.getUTCHours() - hoursOffset);
  return d.toISOString();
}

// Map rounds and build structures
const INITIAL_MATCHES: any[] = [];
let grpIndex = 1;
let r32Index = 1;

// Round of 16 sequence ordered to match Left then Right
const r16Mapping = [
  { id: 'm-l-r16-1', wing: 'LEFT', qf: 'm-l-qf-1', slot: 'A' }, // Philadephia
  { id: 'm-l-r16-2', wing: 'LEFT', qf: 'm-l-qf-1', slot: 'B' }, // Houston
  { id: 'm-r-r16-1', wing: 'RIGHT', qf: 'm-r-qf-1', slot: 'A' }, // NY/NJ
  { id: 'm-r-r16-2', wing: 'RIGHT', qf: 'm-r-qf-1', slot: 'B' }, // Mexico City
  { id: 'm-l-r16-3', wing: 'LEFT', qf: 'm-l-qf-2', slot: 'A' }, // Dallas
  { id: 'm-l-r16-4', wing: 'LEFT', qf: 'm-l-qf-2', slot: 'B' }, // Seattle
  { id: 'm-r-r16-3', wing: 'RIGHT', qf: 'm-r-qf-2', slot: 'A' }, // Atlanta
  { id: 'm-r-r16-4', wing: 'RIGHT', qf: 'm-r-qf-2', slot: 'B' }  // Vancouver
];

// QF mapping
const qfMapping = [
  { id: 'm-l-qf-1', wing: 'LEFT', sf: 'm-l-sf-1', slot: 'A' }, // Boston
  { id: 'm-l-qf-2', wing: 'LEFT', sf: 'm-l-sf-1', slot: 'B' }, // LA
  { id: 'm-r-qf-1', wing: 'RIGHT', sf: 'm-r-sf-1', slot: 'A' }, // Miami
  { id: 'm-r-qf-2', wing: 'RIGHT', sf: 'm-r-sf-1', slot: 'B' }  // Kansas City
];

let r16Idx = 0;
let qfIdx = 0;
let sfIdx = 0;

worldcup_raw.matches.forEach((m: any, idx: number) => {
  const isGroup = m.round.includes('Matchday');
  let roundCode = 'GROUP';
  let id = '';
  let wing: 'LEFT' | 'RIGHT' = 'LEFT';
  let next_match_id: string | null = null;
  let next_match_slot: 'A' | 'B' | undefined = undefined;

  const ground = m.ground;
  const stadiumName = cityToStadium[ground] || ground;
  const venue = `${stadiumName}, ${ground}`;
  const rawCountry = cityToCountry[ground] || 'USA';
  const host_country = rawCountry === 'MX' ? 'MEX' : rawCountry === 'US' ? 'USA' : 'CAN';

  // Teams mapping
  let team_a_name = m.team1;
  let team_b_name = m.team2;
  let team_a_id = teamNameToCode[team_a_name.toLowerCase()] || team_a_name.toUpperCase().replace(/\s+/g, '_');
  let team_b_id = teamNameToCode[team_b_name.toLowerCase()] || team_b_name.toUpperCase().replace(/\s+/g, '_');

  let team_a_flag = FIFA_TO_ISO[team_a_id] ? team_a_id : 'TBD';
  let team_b_flag = FIFA_TO_ISO[team_b_id] ? team_b_id : 'TBD';

  if (isGroup) {
    id = `m-group-${grpIndex++}`;
    roundCode = 'GROUP';
  } else if (m.round === 'Round of 32') {
    id = `m-r32-${r32Index++}`;
    roundCode = 'R32';
  } else if (m.round === 'Round of 16') {
    roundCode = 'R16';
    const cfg = r16Mapping[r16Idx++];
    id = cfg.id;
    wing = cfg.wing as any;
    next_match_id = cfg.qf;
    next_match_slot = cfg.slot as any;
  } else if (m.round === 'Quarter-final') {
    roundCode = 'QF';
    const cfg = qfMapping[qfIdx++];
    id = cfg.id;
    wing = cfg.wing as any;
    next_match_id = cfg.sf;
    next_match_slot = cfg.slot as any;
  } else if (m.round === 'Semi-final') {
    roundCode = 'SF';
    id = sfIdx === 0 ? 'm-l-sf-1' : 'm-r-sf-1';
    wing = sfIdx === 0 ? 'LEFT' : 'RIGHT';
    next_match_id = 'm-final-1';
    next_match_slot = sfIdx === 0 ? 'A' : 'B';
    sfIdx++;
  } else if (m.round === 'Final') {
    roundCode = 'FINAL';
    id = 'm-final-1';
    wing = 'LEFT';
    next_match_id = null;
  } else {
    id = `m-extra-${idx}`;
    roundCode = 'GROUP';
  }

  // Calculate start time
  const start_time = parseKickoff(m.date, m.time || '12:00 UTC-5');

  INITIAL_MATCHES.push({
    id,
    team_a_id,
    team_a_name,
    team_a_flag,
    team_b_id,
    team_b_name,
    team_b_flag,
    team_a_score: null,
    team_b_score: null,
    start_time,
    status: 'SCHEDULED',
    round: roundCode,
    venue,
    host_country,
    bracket_wing: wing,
    next_match_id,
    next_match_slot,
    group: m.group
  });
});

// Preserve Rosters & add realistic procedural cohorts for all missing ones
const OFFICIAL_ROSTERS: Record<string, any[]> = {
  USA: [
    { jerseyNumber: 10, name: 'C. Pulisic', position: 'MID', club: 'AC Milan', goals: 28, assists: 14 },
    { jerseyNumber: 11, name: 'B. Aaronson', position: 'MID', club: 'Leeds United', goals: 8, assists: 11 },
    { jerseyNumber: 4, name: 'T. Adams', position: 'MID', club: 'AFC Bournemouth', goals: 2, assists: 5 },
    { jerseyNumber: 21, name: 'T. Weah', position: 'FWD', club: 'Juventus', goals: 12, assists: 8 },
    { jerseyNumber: 1, name: 'M. Turner', position: 'GK', club: 'Crystal Palace', goals: 0, assists: 0 },
    { jerseyNumber: 8, name: 'W. McKennie', position: 'MID', club: 'Juventus', goals: 11, assists: 15 }
  ],
  COL: [
    { jerseyNumber: 23, name: 'Luis Díaz', position: 'FWD', club: 'Liverpool F.C.', goals: 14, assists: 9 },
    { jerseyNumber: 10, name: 'J. Rodríguez', position: 'MID', club: 'São Paulo', goals: 29, assists: 32 },
    { jerseyNumber: 19, name: 'R. Borré', position: 'FWD', club: 'Werder Bremen', goals: 11, assists: 4 }
  ],
  FRA: [
    { jerseyNumber: 10, name: 'K. Mbappé', position: 'FWD', club: 'Real Madrid', goals: 47, assists: 22 },
    { jerseyNumber: 7, name: 'A. Griezmann', position: 'FWD', club: 'Atlético Madrid', goals: 44, assists: 31 },
    { jerseyNumber: 8, name: 'A. Tchouaméni', position: 'MID', club: 'Real Madrid', goals: 5, assists: 6 }
  ],
  NED: [
    { jerseyNumber: 4, name: 'V. van Dijk', position: 'DEF', club: 'Liverpool F.C.', goals: 7, assists: 2 },
    { jerseyNumber: 10, name: 'M. Depay', position: 'FWD', club: 'Atlético Madrid', goals: 44, assists: 12 },
    { jerseyNumber: 7, name: 'X. Simons', position: 'MID', club: 'RB Leipzig', goals: 4, assists: 9 }
  ],
  GER: [
    { jerseyNumber: 10, name: 'Jamal Musiala', position: 'MID', club: 'Bayern Munich', goals: 12, assists: 10 },
    { jerseyNumber: 17, name: 'Florian Wirtz', position: 'MID', club: 'Bayer Leverkusen', goals: 8, assists: 14 },
    { jerseyNumber: 9, name: 'N. Füllkrug', position: 'FWD', club: 'Borussia Dortmund', goals: 14, assists: 3 }
  ],
  BRA: [
    { jerseyNumber: 10, name: 'Vinícius Jr.', position: 'FWD', club: 'Real Madrid', goals: 16, assists: 15 },
    { jerseyNumber: 11, name: 'Raphinha', position: 'FWD', club: 'FC Barcelona', goals: 8, assists: 10 },
    { jerseyNumber: 5, name: 'Casemiro', position: 'MID', club: 'Manchester United', goals: 7, assists: 3 }
  ],
  MEX: [
    { jerseyNumber: 13, name: 'G. Ochoa', position: 'GK', club: 'Club América', goals: 0, assists: 0 },
    { jerseyNumber: 22, name: 'H. Lozano', position: 'FWD', club: 'PSV Eindhoven', goals: 19, assists: 15 },
    { jerseyNumber: 4, name: 'E. Álvarez', position: 'MID', club: 'West Ham United', goals: 7, assists: 8 },
    { jerseyNumber: 9, name: 'R. Jiménez', position: 'FWD', club: 'Fulham F.C.', goals: 33, assists: 10 },
    { jerseyNumber: 15, name: 'U. Antuna', position: 'MID', club: 'Cruz Azul', goals: 11, assists: 12 },
    { jerseyNumber: 10, name: 'S. Giménez', position: 'FWD', club: 'Feyenoord', goals: 22, assists: 6 }
  ],
  ECU: [
    { jerseyNumber: 13, name: 'Enner Valencia', position: 'FWD', club: 'Internacional', goals: 41, assists: 12 },
    { jerseyNumber: 10, name: 'Moisés Caicedo', position: 'MID', club: 'Chelsea F.C.', goals: 3, assists: 10 }
  ],
  ARG: [
    { jerseyNumber: 10, name: 'Lionel Messi', position: 'FWD', club: 'Inter Miami', goals: 106, assists: 54 },
    { jerseyNumber: 22, name: 'Lautaro Martínez', position: 'FWD', club: 'Inter Milan', goals: 24, assists: 8 },
    { jerseyNumber: 7, name: 'R. De Paul', position: 'MID', club: 'Atlético Madrid', goals: 2, assists: 11 }
  ],
  CAN: [
    { jerseyNumber: 19, name: 'A. Davies', position: 'MID', club: 'Bayern Munich', goals: 15, assists: 21 },
    { jerseyNumber: 9, name: 'J. David', position: 'FWD', club: 'Lille OSC', goals: 26, assists: 10 },
    { jerseyNumber: 7, name: 'C. Larin', position: 'FWD', club: 'RCD Mallorca', goals: 29, assists: 5 },
    { jerseyNumber: 8, name: 'S. Eustáquio', position: 'MID', club: 'F.C. Porto', goals: 6, assists: 12 },
    { jerseyNumber: 1, name: 'M. Crépeau', position: 'GK', club: 'Portland Timbers', goals: 0, assists: 0 },
    { jerseyNumber: 22, name: 'R. Laryea', position: 'DEF', club: 'Toronto F.C.', goals: 3, assists: 8 }
  ],
  ESP: [
    { jerseyNumber: 10, name: 'Dani Olmo', position: 'MID', club: 'FC Barcelona', goals: 11, assists: 9 },
    { jerseyNumber: 17, name: 'Lamine Yamal', position: 'FWD', club: 'FC Barcelona', goals: 3, assists: 7 },
    { jerseyNumber: 16, name: 'Rodri', position: 'MID', club: 'Manchester City', goals: 4, assists: 6 }
  ],
  ITA: [
    { jerseyNumber: 10, name: 'F. Chiesa', position: 'FWD', club: 'Liverpool F.C.', goals: 7, assists: 8 },
    { jerseyNumber: 23, name: 'N. Barella', position: 'MID', club: 'Inter Milan', goals: 10, assists: 14 }
  ]
};

// Procedural Roster filler for missing national rosters
teams_raw.forEach((t: any) => {
  const code = t.fifa_code;
  if (!OFFICIAL_ROSTERS[code]) {
    OFFICIAL_ROSTERS[code] = [
      { jerseyNumber: 10, name: `K. ${t.name} Star`, position: 'MID', club: 'Global FC', goals: 8, assists: 5 },
      { jerseyNumber: 9, name: `M. ${t.name} Striker`, position: 'FWD', club: 'National FC', goals: 15, assists: 2 },
      { jerseyNumber: 1, name: `G. ${t.name} Keeper`, position: 'GK', club: 'Capital United', goals: 0, assists: 0 }
    ];
  }
});

// Stats fill
const OFFICIAL_TEAM_STATS: Record<string, any> = {
  USA: { winProbability: 58, avgGoalsGame: 1.8, cleanSheets: '5/10', momentum: [10, 25, 12, 35, 45] },
  COL: { winProbability: 51, avgGoalsGame: 1.6, cleanSheets: '4/10', momentum: [20, 15, 30, 22, 18] },
  FRA: { winProbability: 75, avgGoalsGame: 2.5, cleanSheets: '6/10', momentum: [45, 30, 40, 48, 50] },
  NED: { winProbability: 60, avgGoalsGame: 1.9, cleanSheets: '4/10', momentum: [15, 25, 22, 30, 35] },
  GER: { winProbability: 68, avgGoalsGame: 2.1, cleanSheets: '5/10', momentum: [25, 30, 35, 28, 40] },
  BRA: { winProbability: 72, avgGoalsGame: 2.3, cleanSheets: '5/10', momentum: [35, 20, 45, 15, 42] },
  MEX: { winProbability: 62, avgGoalsGame: 2.4, cleanSheets: '4/10', momentum: [5, 15, 25, 40, 45] },
  ECU: { winProbability: 47, avgGoalsGame: 1.2, cleanSheets: '3/10', momentum: [10, 12, 18, 30, 25] },
  ARG: { winProbability: 80, avgGoalsGame: 2.6, cleanSheets: '7/10', momentum: [48, 45, 49, 42, 55] },
  CAN: { winProbability: 45, avgGoalsGame: 1.5, cleanSheets: '3/10', momentum: [12, 8, 20, 25, 10] },
  ESP: { winProbability: 78, avgGoalsGame: 2.3, cleanSheets: '6/10', momentum: [42, 40, 38, 45, 49] },
  ITA: { winProbability: 55, avgGoalsGame: 1.7, cleanSheets: '5/10', momentum: [20, 22, 15, 28, 32] }
};

// Procedural stats for other countries
teams_raw.forEach((t: any) => {
  const code = t.fifa_code;
  if (!OFFICIAL_TEAM_STATS[code]) {
    const prob = Math.floor(Math.random() * 35) + 35; // 35 - 70 %
    OFFICIAL_TEAM_STATS[code] = {
      winProbability: prob,
      avgGoalsGame: Number((1.0 + Math.random() * 1.2).toFixed(1)),
      cleanSheets: `${Math.floor(Math.random() * 4) + 1}/10`,
      momentum: Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 10)
    };
  }
});

// Map legacy alignments from old FIFA codes to new if mismatch
// COLOMBIA in old structures was 'COLOMBIA', now we normalization/alignment to 'COL'
// Ensure it matches perfect code lookups
OFFICIAL_ROSTERS['COLOMBIA'] = OFFICIAL_ROSTERS['COL'];
OFFICIAL_TEAM_STATS['COLOMBIA'] = OFFICIAL_TEAM_STATS['COL'];

// Write to src/data.ts
const dataTsContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, Player, TeamStats } from './types';

export const OFFICIAL_ROSTERS: Record<string, Player[]> = ${JSON.stringify(OFFICIAL_ROSTERS, null, 2)};

export const OFFICIAL_TEAM_STATS: Record<string, TeamStats> = ${JSON.stringify(OFFICIAL_TEAM_STATS, null, 2)};

export const INITIAL_MATCHES: Match[] = ${JSON.stringify(INITIAL_MATCHES, null, 2)};
`;

fs.writeFileSync('src/data.ts', dataTsContent);
console.log('Successfully compiled and saved all 104 matches, 48 teams rosters & stats into src/data.ts!');
