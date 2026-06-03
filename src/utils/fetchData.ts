import fs from 'fs';

async function fetchAndSave() {
  const urls = {
    teams: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.teams.json',
    stadiums: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.stadiums.json',
    quali_playoffs: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.quali_playoffs.json',
    worldcup: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
  };

  for (const [key, url] of Object.entries(urls)) {
    console.log(`Fetching ${key} from ${url}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log(`Successfully fetched ${key}. Items/Keys count:`, Array.isArray(data) ? data.length : Object.keys(data));
      fs.writeFileSync(`src/utils/${key}_data.json`, JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error(`Error fetching ${key}:`, err.message);
    }
  }
}

fetchAndSave();
