const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team_id: { type: Number, unique: true, required: true },
  league: { type: String, required: true },
  leagues: [String],
  playerCount: { type: Number, default: 0 },
});

teamSchema.index({ league: 1 });
teamSchema.index({ name: 'text' });

module.exports = mongoose.model('Team', teamSchema);
