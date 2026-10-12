const mongoose = require('mongoose');

const playerInLineupSchema = new mongoose.Schema(
  {
    player_id: Number,
    player: String,
    position: String,
    detailed_position: String,
  },
  { _id: false }
);

const teamLineupSchema = new mongoose.Schema(
  {
    name: String,
    team_id: Number,
    formation: String,
    players: [playerInLineupSchema],
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    minute: Number,
    type: { type: String, enum: ['goal', 'card', 'chance', 'save', 'tackle'] },
    team: String,
    player: String,
    description: String,
  },
  { _id: false }
);

const simulationResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  homeTeam: teamLineupSchema,
  awayTeam: teamLineupSchema,
  result: {
    homeGoals: Number,
    awayGoals: Number,
    homeTeamName: String,
    awayTeamName: String,
  },
  timeline: [timelineEventSchema],
  stats: {
    possession: { home: Number, away: Number },
    shots: { home: Number, away: Number },
    shotsOnTarget: { home: Number, away: Number },
    passes: { home: Number, away: Number },
    fouls: { home: Number, away: Number },
    corners: { home: Number, away: Number },
  },
  mode: { type: String, enum: ['club', 'dream'], default: 'club' },
  createdAt: { type: Date, default: Date.now },
});

simulationResultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SimulationResult', simulationResultSchema);
