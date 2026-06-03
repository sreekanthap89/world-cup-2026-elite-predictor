import fs from 'fs';

const worldcup = JSON.parse(fs.readFileSync('src/utils/worldcup_data.json', 'utf8'));

console.log('--- KNOCKOUT ROUNDS LABELS ---');
const koRounds = new Map<string, number>();
worldcup.matches.forEach((m: any) => {
  if (!m.round.includes('Matchday')) {
    koRounds.set(m.round, (koRounds.get(m.round) || 0) + 1);
  }
});
console.log(Array.from(koRounds.entries()));

console.log('--- ROUND OF 16 DETAILS ---');
worldcup.matches.filter((m: any) => m.round === 'Round of 16').forEach((m: any, i: number) => {
  console.log(`Index ${i}: num ${m.num} | ${m.team1} vs ${m.team2} | ${m.ground} | ${m.date}`);
});

console.log('--- QUARTER-FINAL DETAILS ---');
worldcup.matches.filter((m: any) => m.round === 'Quarter-final').forEach((m: any, i: number) => {
  console.log(`Index ${i}: num ${m.num} | ${m.team1} vs ${m.team2} | ${m.ground} | ${m.date}`);
});

console.log('--- SEMI-FINAL DETAILS ---');
worldcup.matches.filter((m: any) => m.round === 'Semi-final').forEach((m: any, i: number) => {
  console.log(`Index ${i}: num ${m.num} | ${m.team1} vs ${m.team2} | ${m.ground} | ${m.date}`);
});

console.log('--- FINAL DETAILS ---');
worldcup.matches.filter((m: any) => m.round === 'Final').forEach((m: any, i: number) => {
  console.log(`Index ${i}: num ${m.num} | ${m.team1} vs ${m.team2} | ${m.ground} | ${m.date}`);
});
