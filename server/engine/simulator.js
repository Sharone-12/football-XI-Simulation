/**
 * Pick XI Match Simulation Engine
 *
 * Simulates a football match between two lineups using real player stats.
 */

// Poisson random number generator
function poissonRandom(lambda) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Weighted random selection from an array based on a weight function
function weightedRandomPick(items, weightFn) {
  const weights = items.map(weightFn);
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return items[Math.floor(Math.random() * items.length)];

  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Classify players by position group
function classifyPlayers(players) {
  const groups = { goalkeepers: [], defenders: [], midfielders: [], forwards: [] };
  for (const p of players) {
    const pos = (p.position || '').toLowerCase();
    if (pos === 'goalkeeper') groups.goalkeepers.push(p);
    else if (pos === 'defender') groups.defenders.push(p);
    else if (pos === 'midfielder') groups.midfielders.push(p);
    else if (pos === 'forward') groups.forwards.push(p);
    else groups.midfielders.push(p); // default
  }
  return groups;
}

// Average a stat across a group of players, defaulting to 0
function avgStat(players, statName) {
  if (players.length === 0) return 0;
  const sum = players.reduce((acc, p) => acc + (p[statName] || 0), 0);
  return sum / players.length;
}

// Calculate team ratings from player stats
function calculateTeamRatings(players) {
  const groups = classifyPlayers(players);
  const attackers = [...groups.forwards, ...groups.midfielders.filter((p) => {
    const dp = (p.detailed_position || '').toUpperCase();
    return dp.includes('AM') || dp.includes('RW') || dp.includes('LW');
  })];
  const mids = groups.midfielders;
  const defenders = groups.defenders;

  // Attack rating from forwards + attacking mids
  const attackGroup = attackers.length > 0 ? attackers : groups.forwards.length > 0 ? groups.forwards : mids;
  const attackRating =
    (avgStat(attackGroup, 'xg_p90') * 3 +
      avgStat(attackGroup, 'shots_p90') * 1 +
      avgStat(attackGroup, 'shots_on_target_p90') * 2 +
      avgStat(attackGroup, 'dribbles_p90') * 1 +
      avgStat(attackGroup, 'big_chances_created_p90') * 2) / 9;

  // Midfield rating
  const midfieldRating =
    (avgStat(mids, 'passes_p90') * 0.5 +
      avgStat(mids, 'key_passes_p90') * 3 +
      avgStat(mids, 'final_third_passes_p90') * 1 +
      avgStat(mids, 'total_passes_p90') * 0.3) / 4.8;

  // Defense rating
  const defenseRating =
    (avgStat(defenders, 'tackles_won_p90') * 2 +
      avgStat(defenders, 'interceptions_p90') * 2 +
      avgStat(defenders, 'clearances_p90') * 1.5 +
      avgStat(defenders, 'aerials_won_p90') * 1 +
      avgStat(defenders, 'recoveries_p90') * 1.5) / 8;

  // GK rating
  const gkRating = groups.goalkeepers.length > 0
    ? (avgStat(groups.goalkeepers, 'recoveries_p90') * 2 + avgStat(groups.goalkeepers, 'passes_p90') * 0.5) / 2.5
    : 1;

  return { attackRating, midfieldRating, defenseRating, gkRating };
}

// Formation modifiers
function getFormationModifiers(formation) {
  const modifiers = { attack: 1, midfield: 1, defense: 1 };
  switch (formation) {
    case '4-3-3':
      modifiers.attack = 1.1;
      modifiers.defense = 0.95;
      break;
    case '4-4-2':
      modifiers.midfield = 1.1;
      break;
    case '3-5-2':
      modifiers.midfield = 1.15;
      modifiers.defense = 0.9;
      break;
    case '5-3-2':
      modifiers.defense = 1.15;
      modifiers.attack = 0.9;
      break;
    case '4-2-3-1':
      modifiers.midfield = 1.05;
      modifiers.attack = 1.05;
      break;
    case '3-4-3':
      modifiers.attack = 1.15;
      modifiers.defense = 0.85;
      break;
  }
  return modifiers;
}

// Generate a random minute, avoiding duplicates in a set
function randomMinute(usedMinutes) {
  let minute;
  let attempts = 0;
  do {
    minute = Math.floor(Math.random() * 90) + 1;
    attempts++;
  } while (usedMinutes.has(minute) && attempts < 100);
  usedMinutes.add(minute);
  return minute;
}

// Generate timeline events
function generateTimeline(homeGoals, awayGoals, homePlayers, awayPlayers, homeTeamName, awayTeamName) {
  const timeline = [];
  const usedMinutes = new Set();

  // Goal events
  for (let i = 0; i < homeGoals; i++) {
    const scorer = weightedRandomPick(
      homePlayers.filter((p) => p.position !== 'Goalkeeper'),
      (p) => (p.xg_p90 || 0) * 3 + (p.goals_p90 || 0) * 5 + (p.shots_on_target_p90 || 0) + 0.1
    );
    const assister = weightedRandomPick(
      homePlayers.filter((p) => p.player_id !== scorer.player_id),
      (p) => (p.xa_p90 || 0) * 3 + (p.assists_p90 || 0) * 5 + (p.key_passes_p90 || 0) + 0.1
    );
    const minute = randomMinute(usedMinutes);
    timeline.push({
      minute,
      type: 'goal',
      team: homeTeamName,
      player: scorer.player,
      description: `GOAL! ${scorer.player} scores for ${homeTeamName}! Assisted by ${assister.player}.`,
    });
  }

  for (let i = 0; i < awayGoals; i++) {
    const scorer = weightedRandomPick(
      awayPlayers.filter((p) => p.position !== 'Goalkeeper'),
      (p) => (p.xg_p90 || 0) * 3 + (p.goals_p90 || 0) * 5 + (p.shots_on_target_p90 || 0) + 0.1
    );
    const assister = weightedRandomPick(
      awayPlayers.filter((p) => p.player_id !== scorer.player_id),
      (p) => (p.xa_p90 || 0) * 3 + (p.assists_p90 || 0) * 5 + (p.key_passes_p90 || 0) + 0.1
    );
    const minute = randomMinute(usedMinutes);
    timeline.push({
      minute,
      type: 'goal',
      team: awayTeamName,
      player: scorer.player,
      description: `GOAL! ${scorer.player} scores for ${awayTeamName}! Assisted by ${assister.player}.`,
    });
  }

  // Additional events (5-15 random events)
  const extraEvents = 5 + Math.floor(Math.random() * 11);
  for (let i = 0; i < extraEvents; i++) {
    const isHome = Math.random() > 0.5;
    const teamPlayers = isHome ? homePlayers : awayPlayers;
    const teamName = isHome ? homeTeamName : awayTeamName;
    const eventType = Math.random();
    const minute = randomMinute(usedMinutes);

    if (eventType < 0.3) {
      // Save
      const shooter = weightedRandomPick(teamPlayers, (p) => (p.shots_p90 || 0) + 0.1);
      const opposingGK = (isHome ? awayPlayers : homePlayers).find((p) => p.position === 'Goalkeeper');
      const gkName = opposingGK ? opposingGK.player : 'the goalkeeper';
      timeline.push({
        minute,
        type: 'save',
        team: teamName,
        player: shooter.player,
        description: `${shooter.player}'s shot is saved by ${gkName}.`,
      });
    } else if (eventType < 0.55) {
      // Chance created
      const creator = weightedRandomPick(teamPlayers, (p) => (p.key_passes_p90 || 0) + (p.big_chances_created_p90 || 0) + 0.1);
      timeline.push({
        minute,
        type: 'chance',
        team: teamName,
        player: creator.player,
        description: `${creator.player} creates a dangerous chance for ${teamName}.`,
      });
    } else if (eventType < 0.8) {
      // Card
      const offender = weightedRandomPick(teamPlayers, (p) => (p.yellows_p90 || 0) + (p.total_tackles_p90 || 0) * 0.3 + 0.1);
      const isRed = Math.random() < 0.05;
      timeline.push({
        minute,
        type: 'card',
        team: teamName,
        player: offender.player,
        description: `${isRed ? 'RED' : 'YELLOW'} CARD! ${offender.player} is booked for a foul.`,
      });
    } else {
      // Key tackle
      const tackler = weightedRandomPick(teamPlayers, (p) => (p.tackles_won_p90 || 0) + (p.interceptions_p90 || 0) + 0.1);
      timeline.push({
        minute,
        type: 'tackle',
        team: teamName,
        player: tackler.player,
        description: `Great defensive work by ${tackler.player}!`,
      });
    }
  }

  // Sort by minute
  timeline.sort((a, b) => a.minute - b.minute);
  return timeline;
}

/**
 * Main simulation function
 * @param {Object} homeLineup - { formation: string, players: Player[], teamName: string }
 * @param {Object} awayLineup - { formation: string, players: Player[], teamName: string }
 * @returns {{ result, timeline, stats }}
 */
function simulateMatch(homeLineup, awayLineup) {
  const homeRatings = calculateTeamRatings(homeLineup.players);
  const awayRatings = calculateTeamRatings(awayLineup.players);

  // Apply formation modifiers
  const homeMods = getFormationModifiers(homeLineup.formation);
  const awayMods = getFormationModifiers(awayLineup.formation);

  const homeAttack = homeRatings.attackRating * homeMods.attack;
  const homeMidfield = homeRatings.midfieldRating * homeMods.midfield;
  const homeDefense = homeRatings.defenseRating * homeMods.defense;

  const awayAttack = awayRatings.attackRating * awayMods.attack;
  const awayMidfield = awayRatings.midfieldRating * awayMods.midfield;
  const awayDefense = awayRatings.defenseRating * awayMods.defense;

  // Calculate expected goals
  const baseFactor = 2.5;
  const homeAdvantage = 1.1;

  let homeXG =
    ((homeAttack * 0.5 + homeMidfield * 0.3) /
      Math.max(awayDefense * 0.4 + awayMidfield * 0.2, 0.1)) *
    baseFactor *
    homeAdvantage;
  let awayXG =
    ((awayAttack * 0.5 + awayMidfield * 0.3) /
      Math.max(homeDefense * 0.4 + homeMidfield * 0.2, 0.1)) *
    baseFactor;

  // Clamp xG
  homeXG = Math.max(0.3, Math.min(5.0, homeXG));
  awayXG = Math.max(0.3, Math.min(5.0, awayXG));

  // Generate actual goals via Poisson
  const homeGoals = poissonRandom(homeXG);
  const awayGoals = poissonRandom(awayXG);

  const homeTeamName = homeLineup.teamName || 'Home';
  const awayTeamName = awayLineup.teamName || 'Away';

  // Generate timeline
  const timeline = generateTimeline(
    homeGoals,
    awayGoals,
    homeLineup.players,
    awayLineup.players,
    homeTeamName,
    awayTeamName
  );

  // Generate match stats
  const totalMidfield = homeMidfield + awayMidfield || 1;
  const homePossession = Math.round((homeMidfield / totalMidfield) * 100);
  const awayPossession = 100 - homePossession;

  const homeShots = Math.round(homeXG * 4 + Math.random() * 6);
  const awayShots = Math.round(awayXG * 4 + Math.random() * 6);

  const stats = {
    possession: { home: homePossession, away: awayPossession },
    shots: { home: homeShots, away: awayShots },
    shotsOnTarget: {
      home: Math.min(homeShots, Math.round(homeShots * 0.4 + Math.random() * 3)),
      away: Math.min(awayShots, Math.round(awayShots * 0.4 + Math.random() * 3)),
    },
    passes: {
      home: Math.round(homeMidfield * 80 + Math.random() * 100),
      away: Math.round(awayMidfield * 80 + Math.random() * 100),
    },
    fouls: {
      home: Math.round(6 + Math.random() * 10),
      away: Math.round(6 + Math.random() * 10),
    },
    corners: {
      home: Math.round(homeAttack * 2 + Math.random() * 5),
      away: Math.round(awayAttack * 2 + Math.random() * 5),
    },
  };

  return {
    result: {
      homeGoals,
      awayGoals,
      homeTeamName,
      awayTeamName,
    },
    timeline,
    stats,
  };
}

module.exports = { simulateMatch, poissonRandom, weightedRandomPick };
