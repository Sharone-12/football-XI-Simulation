const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const { toAttributes, getDistributions } = require('../engine/attributes');
const { getTeamProfile, tacticsFrom, keeperQuality } = require('../engine/teamProfile');
const { makeScript } = require('../engine/script');

// Average club profiles, weighted by how many of the XI come from each club.
function blendProfiles(profiles) {
  const known = profiles.filter(Boolean);
  if (!known.length) return null;
  const out = {};
  for (const p of known) for (const [k, v] of Object.entries(p)) out[k] = (out[k] || 0) + v / known.length;
  return out;
}

// POST /api/simulate - build engine-ready lineups; the match itself runs in the browser.
// Lineups are slot-aligned with the formation (null = empty slot, e.g. no goalkeeper picked).
router.post('/', async (req, res) => {
  try {
    const { homeLineup, awayLineup } = req.body;

    if (!homeLineup || !awayLineup) {
      return res.status(400).json({ error: 'Both homeLineup and awayLineup are required' });
    }
    if (!homeLineup.formation || !awayLineup.formation) {
      return res.status(400).json({ error: 'Formation is required for both lineups' });
    }
    const filled = (l) => (Array.isArray(l.players) ? l.players.filter((id) => id != null) : []);
    if (filled(homeLineup).length < 10 || filled(awayLineup).length < 10) {
      return res.status(400).json({ error: 'Each lineup must have at least 10 players' });
    }

    const ids = [...filled(homeLineup), ...filled(awayLineup)];
    const docs = await Player.find({ player_id: { $in: ids } }).lean();
    const byId = new Map(docs.map((p) => [p.player_id, p]));

    const clubIds = [...new Set(docs.map((p) => p.team_id))];
    const [dist, profileList] = await Promise.all([
      getDistributions(),
      Promise.all(clubIds.map((id) => getTeamProfile(id))),
    ]);
    const profiles = new Map(clubIds.map((id, i) => [id, profileList[i]]));

    const shape = (p) => ({
      player_id: p.player_id,
      player: p.player,
      position: p.position,
      detailed_position: p.detailed_position,
      shots_p90: p.shots_p90 ?? 0,
      attributes: toAttributes(p, dist, p.position === 'Goalkeeper' ? keeperQuality(profiles.get(p.team_id)) : null),
    });

    // Season team match stats (Dream XI: blend of the players' clubs).
    const profileOf = (lineup) => blendProfiles(filled(lineup).map((id) => profiles.get(byId.get(id)?.team_id)));

    const build = async (lineup) => {
      const players = lineup.players.map((id) => {
        const p = id == null ? null : byId.get(id);
        return p ? shape(p) : null;
      });
      const first = byId.get(filled(lineup)[0]);

      // Club XI: bench = most-used keeper + six most-used outfielders not starting.
      let bench = [];
      const teamIds = new Set(filled(lineup).map((id) => byId.get(id)?.team_id));
      if (teamIds.size === 1 && first) {
        const rest = await Player.find({ team_id: first.team_id, player_id: { $nin: ids } })
          .sort({ minutes: -1 }).limit(15).lean();
        const gk = rest.find((p) => p.position === 'Goalkeeper');
        bench = [gk, ...rest.filter((p) => p.position !== 'Goalkeeper').slice(0, 6)].filter(Boolean).map(shape);
      }

      const profile = profileOf(lineup);

      return {
        name: lineup.teamName || first?.team || 'Team',
        team_id: first?.team_id,
        formation: lineup.formation,
        players,
        bench,
        tactics: tacticsFrom(profile),
      };
    };

    const [homeTeam, awayTeam] = await Promise.all([build(homeLineup), build(awayLineup)]);
    if (homeTeam.players.filter(Boolean).length < 10 || awayTeam.players.filter(Boolean).length < 10) {
      return res.status(400).json({ error: 'Could not find enough players. Check player IDs.' });
    }

    const side = (lineup) => ({ xi: filled(lineup).map((id) => byId.get(id)).filter(Boolean), profile: profileOf(lineup) });
    const script = makeScript(side(homeLineup), side(awayLineup));

    res.json({ homeTeam, awayTeam, script });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
