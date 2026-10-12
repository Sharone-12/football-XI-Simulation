const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Dream XI eligible teams/leagues
const DREAM_XI_LEAGUES = ['Premier League', 'La Liga'];
const DREAM_XI_TEAMS = ['Paris Saint-Germain', 'FC Bayern München'];

// GET /api/players - list/search players
router.get('/', async (req, res) => {
  try {
    const { league, team, position, detailed_position, search, dreamxi, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (league) {
      filter.league = league;
    }
    if (team) {
      filter.team = team;
    }
    if (position) {
      filter.position = position;
    }
    if (detailed_position) {
      filter.detailed_position = detailed_position;
    }
    if (search) {
      filter.player = { $regex: search, $options: 'i' };
    }
    if (dreamxi === 'true') {
      filter.$or = [
        { league: { $in: DREAM_XI_LEAGUES } },
        { team: { $in: DREAM_XI_TEAMS } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [players, total] = await Promise.all([
      Player.find(filter).sort({ player: 1 }).skip(skip).limit(limitNum),
      Player.countDocuments(filter),
    ]);

    res.json({
      players,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:playerId - single player by player_id
router.get('/:playerId', async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId, 10);
    const player = await Player.findOne({ player_id: playerId });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
