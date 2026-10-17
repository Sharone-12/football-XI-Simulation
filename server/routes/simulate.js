const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const { simulateMatch } = require('../engine/simulator');

// POST /api/simulate - run a match simulation
router.post('/', async (req, res) => {
  try {
    const { homeLineup, awayLineup } = req.body;

    if (!homeLineup || !awayLineup) {
      return res.status(400).json({ error: 'Both homeLineup and awayLineup are required' });
    }
    if (!homeLineup.formation || !awayLineup.formation) {
      return res.status(400).json({ error: 'Formation is required for both lineups' });
    }
    if (!homeLineup.players || !awayLineup.players || homeLineup.players.length < 10 || awayLineup.players.length < 10) {
      return res.status(400).json({ error: 'Each lineup must have at least 10 players' });
    }

    // Fetch full player data
    const allPlayerIds = [...homeLineup.players, ...awayLineup.players];
    const playersFromDB = await Player.find({ player_id: { $in: allPlayerIds } });

    const playerMap = {};
    for (const p of playersFromDB) {
      playerMap[p.player_id] = p.toObject();
    }

    const homePlayers = homeLineup.players.map((id) => playerMap[id]).filter(Boolean);
    const awayPlayers = awayLineup.players.map((id) => playerMap[id]).filter(Boolean);

    if (homePlayers.length < 10 || awayPlayers.length < 10) {
      return res.status(400).json({ error: 'Could not find enough players. Check player IDs.' });
    }

    // Determine team names from the first player in each lineup
    const homeTeamName = homeLineup.teamName || homePlayers[0].team || 'Home';
    const awayTeamName = awayLineup.teamName || awayPlayers[0].team || 'Away';

    const matchResult = simulateMatch(
      { formation: homeLineup.formation, players: homePlayers, teamName: homeTeamName },
      { formation: awayLineup.formation, players: awayPlayers, teamName: awayTeamName }
    );

    // Build response with lineup info
    const response = {
      homeTeam: {
        name: homeTeamName,
        team_id: homePlayers[0].team_id,
        formation: homeLineup.formation,
        players: homePlayers.map((p) => ({
          player_id: p.player_id,
          player: p.player,
          position: p.position,
          detailed_position: p.detailed_position,
        })),
      },
      awayTeam: {
        name: awayTeamName,
        team_id: awayPlayers[0].team_id,
        formation: awayLineup.formation,
        players: awayPlayers.map((p) => ({
          player_id: p.player_id,
          player: p.player,
          position: p.position,
          detailed_position: p.detailed_position,
        })),
      },
      ...matchResult,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
