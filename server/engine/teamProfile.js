// Season-to-date team profile from finished matches -> engine tactics and keeper quality.
const Match = require('../models/Match');

const TTL_MS = 60 * 60 * 1000;
const MIN_SEASON_MATCHES = 5;
const cache = new Map();

const num = (s) => {
  const m = String(s ?? '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
// "21/32 (66%)" -> attempted (32)
const attempted = (s) => {
  const m = String(s ?? '').match(/\d+\s*\/\s*(\d+)/);
  return m ? parseFloat(m[1]) : num(s);
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const scale = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);

async function getTeamProfile(teamId) {
  if (teamId == null) return null;
  const hit = cache.get(teamId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.profile;

  const all = await Match.find({
    status: 'finished',
    $or: [{ home_id: teamId }, { away_id: teamId }],
  }).lean();
  // "So far this season" once the current season has a few games; older seasons fill in before that.
  const current = all.reduce((max, m) => (m.season > max ? m.season : max), '');
  const thisSeason = all.filter((m) => m.season === current);
  const matches = thisSeason.length >= MIN_SEASON_MATCHES ? thisSeason : all;

  const totals = {};
  const counts = {};
  const add = (k, v) => {
    if (v === null || v === undefined || Number.isNaN(v)) return;
    totals[k] = (totals[k] || 0) + v;
    counts[k] = (counts[k] || 0) + 1;
  };

  for (const m of matches) {
    const side = m.home_id === teamId ? 'home' : 'away';
    const opp = side === 'home' ? 'away' : 'home';
    add('goals', side === 'home' ? m.home_goals : m.away_goals);
    add('conceded', side === 'home' ? m.away_goals : m.home_goals);
    const seen = new Set();
    for (const s of m.stats || []) {
      if (seen.has(s.stat)) continue; // some stats are listed twice per match
      seen.add(s.stat);
      switch (s.stat) {
        case 'Ball possession': add('possession', num(s[side])); break;
        case 'Expected goals': add('xg', num(s[side])); add('xga', num(s[opp])); break;
        case 'Passes': add('passes', num(s[side])); break;
        case 'Total shots': add('shots', num(s[side])); add('shotsAgainst', num(s[opp])); break;
        case 'Shots on target': add('shotsOnTarget', num(s[side])); break;
        case 'Corner kicks': add('corners', num(s[side])); break;
        case 'Long balls': add('longBalls', attempted(s[side])); break;
        case 'Crosses': add('crosses', attempted(s[side])); break;
        case 'Total tackles': add('tackles', num(s[side])); break;
        case 'Recoveries': add('recoveries', num(s[side])); break;
        case 'Interceptions': add('interceptions', num(s[side])); break;
        case 'Goalkeeper saves': add('saves', num(s[side])); break;
        case 'Goals prevented': add('goalsPrevented', num(s[side])); break;
        case 'Fouls': add('fouls', num(s[side])); break;
      }
    }
  }

  const profile = { matches: matches.length };
  for (const k of Object.keys(totals)) profile[k] = totals[k] / counts[k];
  const result = matches.length >= 3 ? profile : null;
  cache.set(teamId, { at: Date.now(), profile: result });
  return result;
}

// Engine tactics (0-100 scales, style preset fills the rest).
function tacticsFrom(profile) {
  if (!profile) return {};
  const poss = profile.possession ?? 50;
  const longShare = profile.longBalls && profile.passes ? profile.longBalls / profile.passes : 0.1;
  const defActions = (profile.tackles ?? 15) + (profile.interceptions ?? 9);
  const xgDiff = (profile.xg ?? 1.3) - (profile.xga ?? 1.3);

  let style = 'balanced';
  if (poss >= 57) style = 'possession';
  else if (longShare >= 0.13) style = 'direct';
  else if (poss <= 43) style = defActions >= 27 ? 'low_block' : 'counter';
  else if (defActions >= 27 && poss >= 50) style = 'high_press';

  return {
    style,
    mentality: xgDiff > 0.45 ? 'attacking' : xgDiff < -0.45 ? 'defensive' : 'balanced',
    press: Math.round(30 + 50 * scale(defActions + (poss - 50) * 0.4, 18, 34)),
    tempo: Math.round(35 + 45 * scale(longShare, 0.06, 0.16)),
    width: Math.round(35 + 45 * scale(profile.crosses ?? 15, 8, 24)),
    defensiveLine: Math.round(30 + 50 * scale(poss, 38, 64)),
  };
}

// Keeper shot-stopping 0..1 from goals prevented and save share.
function keeperQuality(profile) {
  if (!profile || profile.saves == null) return null;
  const faced = profile.saves + (profile.conceded ?? 0);
  const saveShare = faced > 0 ? profile.saves / faced : 0.7;
  const prevented = profile.goalsPrevented ?? 0;
  return clamp(0.5 * scale(prevented, -0.35, 0.35) + 0.5 * scale(saveShare, 0.6, 0.82), 0, 1);
}

module.exports = { getTeamProfile, tacticsFrom, keeperQuality };
