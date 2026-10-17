require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const Match = require('../models/Match');

function safeNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

async function seedMatches(season = '26_27') {
  const matchesPath = path.join(__dirname, '..', '..', 'data', 'processed', `matches_${season}.csv`);
  const statsPath = path.join(__dirname, '..', '..', 'data', 'processed', `match_stats_${season}.csv`);

  if (!fs.existsSync(matchesPath) || !fs.existsSync(statsPath)) {
    console.error(`Files for season ${season} not found.`);
    return;
  }

  console.log(`\nReading match files for season ${season}...`);
  const matchesRaw = fs.readFileSync(matchesPath, 'utf-8');
  const statsRaw = fs.readFileSync(statsPath, 'utf-8');

  const matchRows = parse(matchesRaw, { columns: true, skip_empty_lines: true });
  const statRows = parse(statsRaw, { columns: true, skip_empty_lines: true });

  console.log(`Parsed ${matchRows.length} matches and ${statRows.length} stat records.`);

  // Group stats by event_id
  const statsByEvent = new Map();
  for (const row of statRows) {
    const eventId = parseInt(row.event_id, 10);
    if (!statsByEvent.has(eventId)) {
      statsByEvent.set(eventId, []);
    }
    statsByEvent.get(eventId).push({
      stat: row.stat || '',
      home: row.home || '',
      away: row.away || '',
    });
  }

  // Build match documents
  const matchDocs = matchRows.map((row) => {
    const eventId = parseInt(row.event_id, 10);
    return {
      event_id: eventId,
      league: row.league || '',
      season: row.season || '',
      round: safeNum(row.round),
      date: row.date || '',
      home: row.home || '',
      home_id: safeNum(row.home_id),
      away: row.away || '',
      away_id: safeNum(row.away_id),
      status: row.status || '',
      home_goals: safeNum(row.home_goals),
      away_goals: safeNum(row.away_goals),
      stats: statsByEvent.get(eventId) || [],
    };
  });

  // Batch insert
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < matchDocs.length; i += BATCH_SIZE) {
    const batch = matchDocs.slice(i, i + BATCH_SIZE);
    await Match.insertMany(batch, { ordered: false }).catch((err) => {
      if (err.code === 11000) {
        inserted += err.result?.nInserted || 0;
        return;
      }
      throw err;
    });
    inserted += batch.length;
    console.log(`  Inserted matches: ${Math.min(inserted, matchDocs.length)}/${matchDocs.length}`);
  }

  return matchDocs.length;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const args = process.argv.slice(2);
    const seedAll = args.includes('--all');
    const seasonArg = args.find((a) => a.startsWith('--season='));
    const selectedSeason = seasonArg ? seasonArg.split('=')[1] : '26_27';

    // Clear existing matches
    await Match.deleteMany({});
    console.log('Cleared existing match data');

    if (seedAll) {
      await seedMatches('25_26');
      await seedMatches('26_27');
    } else {
      await seedMatches(selectedSeason);
    }

    const totalMatches = await Match.countDocuments();
    console.log(`\nSuccessfully seeded ${totalMatches} matches with detailed stats!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding matches error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { seedMatches };
