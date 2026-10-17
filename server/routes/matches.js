const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// GET /api/matches - Query matches with optional filters
router.get('/', async (req, res) => {
  try {
    const { league, season, team, team_id, round, limit = 50, skip = 0 } = req.query;
    const query = {};

    if (league) {
      query.league = league;
    }
    if (season) {
      query.season = season;
    }
    if (round) {
      query.round = parseInt(round, 10);
    }
    if (team_id) {
      const tid = parseInt(team_id, 10);
      query.$or = [{ home_id: tid }, { away_id: tid }];
    } else if (team) {
      query.$or = [
        { home: new RegExp(team, 'i') },
        { away: new RegExp(team, 'i') },
      ];
    }

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort({ date: -1, round: -1 })
        .skip(parseInt(skip, 10))
        .limit(Math.min(parseInt(limit, 10), 100)),
      Match.countDocuments(query),
    ]);

    res.json({
      total,
      count: matches.length,
      matches,
    });
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/h2h/:team1Id/:team2Id - Head-to-head matches between two teams
router.get('/h2h/:team1Id/:team2Id', async (req, res) => {
  try {
    const t1 = parseInt(req.params.team1Id, 10);
    const t2 = parseInt(req.params.team2Id, 10);

    const matches = await Match.find({
      $or: [
        { home_id: t1, away_id: t2 },
        { home_id: t2, away_id: t1 },
      ],
    }).sort({ date: -1 });

    res.json(matches);
  } catch (err) {
    console.error('Error fetching H2H matches:', err);
    res.status(500).json({ error: 'Failed to fetch H2H matches' });
  }
});

// GET /api/matches/:eventId - Single match with stats
router.get('/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const match = await Match.findOne({ event_id: eventId });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

module.exports = router;
