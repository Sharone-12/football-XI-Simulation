require('dotenv').config();
const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
  if (connected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  connected = true;
}

const express = require('express');
const app = express();

app.use(require('cors')());
app.use(express.json());

app.use('/api/teams', require('../server/routes/teams'));
app.use('/api/players', require('../server/routes/players'));
app.use('/api/simulate', require('../server/routes/simulate'));
app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/history', require('../server/routes/history'));
app.use('/api/matches', require('../server/routes/matches'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};
