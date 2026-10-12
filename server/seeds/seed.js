require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const Player = require('../models/Player');
const Team = require('../models/Team');

const CSV_PATH = path.join(__dirname, '..', '..', 'data', 'processed', 'players_26_27.csv');

function safeNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop existing collections
    await Player.deleteMany({});
    await Team.deleteMany({});
    console.log('Cleared existing data');

    // Read and parse CSV
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvContent, { columns: true, skip_empty_lines: true }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    console.log(`Parsed ${records.length} rows from CSV`);

    // Deduplicate: prefer domestic league entry over Champions League
    const playerMap = new Map();
    for (const row of records) {
      const pid = parseInt(row.player_id, 10);
      if (!playerMap.has(pid)) {
        playerMap.set(pid, row);
      } else if (playerMap.get(pid).league === 'Champions League' && row.league !== 'Champions League') {
        playerMap.set(pid, row);
      }
    }
    const deduped = Array.from(playerMap.values());
    console.log(`Deduplicated: ${records.length} rows -> ${deduped.length} unique players`);

    // Map CSV rows to player documents
    const players = deduped.map((row) => ({
      player_id: safeNum(row.player_id),
      player: row.player || '',
      slug: row.slug || '',
      team: row.team || '',
      team_id: safeNum(row.team_id),
      league: row.league || '',
      position: row.position || '',
      detailed_position: row.detailed_position || '',
      role: row.role || '',
      season: row.season || '',
      appearances: safeNum(row.appearances),
      minutes: safeNum(row.minutes),
      goals: safeNum(row.goals),
      assists: safeNum(row.assists),
      xg: safeNum(row.xg),
      xa: safeNum(row.xa),
      shots: safeNum(row.shots),
      shots_on_target: safeNum(row.shots_on_target),
      passes: safeNum(row.passes),
      total_passes: safeNum(row.total_passes),
      key_passes: safeNum(row.key_passes),
      long_balls: safeNum(row.long_balls),
      total_long_balls: safeNum(row.total_long_balls),
      crosses: safeNum(row.crosses),
      total_crosses: safeNum(row.total_crosses),
      final_third_passes: safeNum(row.final_third_passes),
      dribbles: safeNum(row.dribbles),
      total_dribbles: safeNum(row.total_dribbles),
      dispossessed: safeNum(row.dispossessed),
      touches: safeNum(row.touches),
      tackles_won: safeNum(row.tackles_won),
      total_tackles: safeNum(row.total_tackles),
      interceptions: safeNum(row.interceptions),
      recoveries: safeNum(row.recoveries),
      clearances: safeNum(row.clearances),
      blocked_shots: safeNum(row.blocked_shots),
      aerials_won: safeNum(row.aerials_won),
      total_aerials: safeNum(row.total_aerials),
      yellows: safeNum(row.yellows),
      reds: safeNum(row.reds),
      big_chances_created: safeNum(row.big_chances_created),
      big_chances_missed: safeNum(row.big_chances_missed),
      errors_to_goal: safeNum(row.errors_to_goal),
      penalties_won: safeNum(row.penalties_won),
      penalties_conceded: safeNum(row.penalties_conceded),
      // Per-90 stats
      goals_p90: safeNum(row.goals_p90),
      assists_p90: safeNum(row.assists_p90),
      xg_p90: safeNum(row.xg_p90),
      xa_p90: safeNum(row.xa_p90),
      shots_p90: safeNum(row.shots_p90),
      shots_on_target_p90: safeNum(row.shots_on_target_p90),
      big_chances_created_p90: safeNum(row.big_chances_created_p90),
      big_chances_missed_p90: safeNum(row.big_chances_missed_p90),
      passes_p90: safeNum(row.passes_p90),
      total_passes_p90: safeNum(row.total_passes_p90),
      key_passes_p90: safeNum(row.key_passes_p90),
      long_balls_p90: safeNum(row.long_balls_p90),
      total_long_balls_p90: safeNum(row.total_long_balls_p90),
      crosses_p90: safeNum(row.crosses_p90),
      total_crosses_p90: safeNum(row.total_crosses_p90),
      final_third_passes_p90: safeNum(row.final_third_passes_p90),
      dribbles_p90: safeNum(row.dribbles_p90),
      total_dribbles_p90: safeNum(row.total_dribbles_p90),
      dispossessed_p90: safeNum(row.dispossessed_p90),
      touches_p90: safeNum(row.touches_p90),
      tackles_won_p90: safeNum(row.tackles_won_p90),
      total_tackles_p90: safeNum(row.total_tackles_p90),
      interceptions_p90: safeNum(row.interceptions_p90),
      recoveries_p90: safeNum(row.recoveries_p90),
      clearances_p90: safeNum(row.clearances_p90),
      blocked_shots_p90: safeNum(row.blocked_shots_p90),
      errors_to_goal_p90: safeNum(row.errors_to_goal_p90),
      aerials_won_p90: safeNum(row.aerials_won_p90),
      total_aerials_p90: safeNum(row.total_aerials_p90),
      yellows_p90: safeNum(row.yellows_p90),
      reds_p90: safeNum(row.reds_p90),
      penalties_won_p90: safeNum(row.penalties_won_p90),
      penalties_conceded_p90: safeNum(row.penalties_conceded_p90),
    }));

    // Insert players in batches
    const BATCH_SIZE = 500;
    let insertedCount = 0;
    for (let i = 0; i < players.length; i += BATCH_SIZE) {
      const batch = players.slice(i, i + BATCH_SIZE);
      await Player.insertMany(batch, { ordered: false }).catch((err) => {
        // Handle duplicate key errors gracefully
        if (err.code === 11000) {
          console.log(`  Some duplicates skipped in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
          insertedCount += err.result?.nInserted || 0;
          return;
        }
        throw err;
      });
      insertedCount += batch.length;
      console.log(`  Inserted players: ${Math.min(insertedCount, players.length)}/${players.length}`);
    }

    const totalPlayers = await Player.countDocuments();
    console.log(`${totalPlayers} players inserted`);

    // Derive teams from ALL CSV records (before dedup) to capture all leagues
    const teamMap = new Map();
    for (const row of records) {
      const tid = parseInt(row.team_id, 10);
      if (!teamMap.has(tid)) {
        teamMap.set(tid, { name: row.team, leagues: new Set() });
      }
      teamMap.get(tid).leagues.add(row.league);
    }

    // Get player counts from DB (after dedup insert)
    const teamAgg = await Player.aggregate([
      { $group: { _id: '$team_id', playerCount: { $sum: 1 } } },
    ]);
    const countMap = new Map(teamAgg.map(t => [t._id, t.playerCount]));

    const teams = Array.from(teamMap.entries()).map(([tid, t]) => {
      const leaguesArr = Array.from(t.leagues);
      const domesticLeagues = leaguesArr.filter((l) => l !== 'Champions League');
      const primaryLeague = domesticLeagues.length > 0 ? domesticLeagues[0] : leaguesArr[0];

      return {
        name: t.name,
        team_id: tid,
        league: primaryLeague,
        leagues: leaguesArr,
        playerCount: countMap.get(tid) || 0,
      };
    });

    await Team.insertMany(teams);
    console.log(`${teams.length} teams created`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
