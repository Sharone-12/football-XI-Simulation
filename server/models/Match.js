const mongoose = require('mongoose');

const matchStatSchema = new mongoose.Schema(
  {
    stat: { type: String, required: true },
    home: { type: String, default: '' },
    away: { type: String, default: '' },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema({
  event_id: { type: Number, unique: true, required: true },
  league: { type: String, required: true },
  season: { type: String, required: true },
  round: { type: Number, default: 0 },
  date: { type: String, default: '' },
  home: { type: String, required: true },
  home_id: { type: Number, required: true },
  away: { type: String, required: true },
  away_id: { type: Number, required: true },
  status: { type: String, default: '' },
  home_goals: { type: Number, default: 0 },
  away_goals: { type: Number, default: 0 },
  stats: [matchStatSchema],
});

matchSchema.index({ league: 1, season: 1 });
matchSchema.index({ home_id: 1, away_id: 1 });
matchSchema.index({ home: 1, away: 1 });
matchSchema.index({ date: -1 });

module.exports = mongoose.model('Match', matchSchema);
