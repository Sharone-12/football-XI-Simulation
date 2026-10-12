const express = require('express');
const router = express.Router();
const SimulationResult = require('../models/SimulationResult');
const { auth } = require('../middleware/auth');

// GET /api/history - get user's past simulations (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      SimulationResult.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-timeline'), // Exclude timeline from list view for performance
      SimulationResult.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      results,
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

// POST /api/history - save a simulation result
router.post('/', auth, async (req, res) => {
  try {
    const { homeTeam, awayTeam, result, timeline, stats, mode } = req.body;

    if (!homeTeam || !awayTeam || !result) {
      return res.status(400).json({ error: 'homeTeam, awayTeam, and result are required' });
    }

    const simulation = new SimulationResult({
      user: req.user.id,
      homeTeam,
      awayTeam,
      result,
      timeline: timeline || [],
      stats: stats || {},
      mode: mode || 'club',
    });

    await simulation.save();
    res.status(201).json(simulation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/:id - get single simulation detail
router.get('/:id', auth, async (req, res) => {
  try {
    const simulation = await SimulationResult.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json(simulation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
