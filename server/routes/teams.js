const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');

// GET /api/teams - list all teams
router.get('/', async (req, res) => {
  try {
    const { league, search } = req.query;
    const filter = {};

    if (league) {
      filter.league = league;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const teams = await Team.find(filter).sort({ name: 1 });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/:teamId - get team by team_id with players
router.get('/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const team = await Team.findOne({ team_id: teamId });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const players = await Player.find({ team_id: teamId }).sort({ position: 1, player: 1 });

    res.json({ ...team.toObject(), players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
