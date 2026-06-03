import fs from 'fs';

const teams = JSON.parse(fs.readFileSync('src/utils/teams_data.json', 'utf8'));

console.log('--- ALL 48 TEAMS ---');
const codeToName: Record<string, string> = {};
const nameToCode: Record<string, string> = {};

teams.forEach((t: any) => {
  codeToName[t.fifa_code] = t.name;
  nameToCode[t.name.toLowerCase()] = t.fifa_code;
  console.log(`"${t.name}": "${t.fifa_code}" (${t.confed})`);
});
