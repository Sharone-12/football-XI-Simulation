// Maps season per-90 stats onto the 1-20 attribute scale used by @bleckert/football-simulator.
// Each player is ranked against others in the same role (CB, FB, CM, WIDE, AM, ST, GK), and each
// role has its own attribute band, so an elite CB passer is not mistaken for an elite finisher.
const Player = require('../models/Player');

const FULL_SAMPLE_MINUTES = 900;
const MIN_MINUTES_FOR_DISTRIBUTION = 450;
const TTL_MS = 60 * 60 * 1000;

const ROLE_BY_DETAIL = {
  DC: 'CB', DL: 'FB', DR: 'FB', DM: 'CM', MC: 'CM',
  LW: 'WIDE', RW: 'WIDE', ML: 'WIDE', MR: 'WIDE', AM: 'AM', ST: 'ST',
};
const ROLE_BY_POSITION = { Goalkeeper: 'GK', Defender: 'CB', Midfielder: 'CM', Forward: 'ST' };

function roleOf(p) {
  if (p.position === 'Goalkeeper') return 'GK';
  const first = (p.detailed_position || '').split('/')[0];
  return ROLE_BY_DETAIL[first] || ROLE_BY_POSITION[p.position] || 'CM';
}

// [lo, hi] per role: ST, WIDE, AM, CM, FB, CB, GK
const band = (ST, WIDE, AM, CM, FB, CB, GK) => ({ ST, WIDE, AM, CM, FB, CB, GK });
const FAMILIES = [
  { attrs: ['finishing'], b: band([10, 20], [8, 19], [8, 19], [5, 16], [3, 12], [3, 11], [1, 3]) },
  { attrs: ['offTheBall'], b: band([10, 20], [9, 20], [9, 20], [6, 16], [5, 14], [3, 11], [1, 3]) },
  { attrs: ['longShots'], b: band([7, 18], [7, 19], [8, 20], [6, 18], [3, 13], [3, 11], [1, 3]) },
  { attrs: ['dribbling', 'flair', 'agility', 'balance'], b: band([8, 19], [10, 20], [9, 20], [7, 18], [6, 16], [4, 13], [1, 6]) },
  { attrs: ['passing', 'technique', 'firstTouch', 'decisions', 'composure'], b: band([7, 17], [8, 18], [10, 20], [10, 20], [8, 17], [8, 18], [5, 14]) },
  { attrs: ['vision'], b: band([6, 17], [8, 19], [10, 20], [9, 20], [6, 16], [5, 14], [2, 9]) },
  { attrs: ['crossing', 'corners'], b: band([4, 14], [8, 19], [7, 18], [6, 17], [8, 19], [3, 11], [1, 4]) },
  { attrs: ['freeKickTaking'], b: band([5, 17], [6, 18], [7, 19], [6, 18], [5, 16], [3, 12], [1, 5]) },
  { attrs: ['tackling', 'marking'], b: band([3, 10], [4, 13], [4, 13], [8, 19], [9, 19], [11, 20], [1, 5]) },
  { attrs: ['positioning', 'anticipation', 'concentration'], b: band([5, 14], [5, 14], [6, 15], [8, 18], [9, 18], [10, 20], [8, 18]) },
  { attrs: ['heading', 'jumpingReach', 'strength', 'bravery'], b: band([7, 19], [4, 14], [4, 13], [6, 16], [6, 16], [10, 20], [6, 14]) },
  { attrs: ['aggression', 'workRate', 'stamina', 'teamwork'], b: band([7, 18], [7, 18], [7, 18], [7, 18], [7, 18], [7, 18], [5, 12]) },
];
const PACE_BY_ROLE = { ST: 14, WIDE: 15, AM: 13, CM: 12, FB: 14, CB: 12, GK: 9 };

const ratio = (made, total) => (total > 0 ? made / total : null);
const lin = (v, lo, hi) => (v === null || v === undefined || Number.isNaN(v) ? null : (v - lo) / (hi - lo));
function blend(...parts) {
  const known = parts.filter(([v]) => v !== null);
  if (!known.length) return null;
  return known.reduce((s, [v, w]) => s + v * w, 0) / known.reduce((s, [, w]) => s + w, 0);
}

// One composite per attribute; only the ordering within a role matters.
function composites(p) {
  const passAcc = ratio(p.passes, p.total_passes);
  const longAcc = ratio(p.long_balls, p.total_long_balls);
  const crossAcc = ratio(p.crosses, p.total_crosses);
  const dribbleAcc = ratio(p.dribbles, p.total_dribbles);
  const tackleAcc = ratio(p.tackles_won, p.total_tackles);
  const aerialAcc = ratio(p.aerials_won, p.total_aerials);
  const conversion = ratio(p.goals, p.shots);
  const onTarget = ratio(p.shots_on_target, p.shots);

  const finishing = blend([lin(p.goals_p90, 0, 0.8), 2], [lin(p.xg_p90, 0, 0.7), 1], [lin(conversion, 0.05, 0.25), 1]);
  const passing = blend([lin(passAcc, 0.7, 0.93), 2], [lin(p.passes_p90, 15, 85), 1]);
  const vision = blend([lin(p.key_passes_p90, 0.2, 2.8), 2], [lin(p.xa_p90, 0, 0.35), 1], [lin(p.big_chances_created_p90, 0, 0.6), 1]);
  const dribbling = blend([lin(p.dribbles_p90, 0, 3), 2], [lin(dribbleAcc, 0.3, 0.7), 1]);
  const tackling = blend([lin(p.tackles_won_p90, 0.3, 2.2), 2], [lin(tackleAcc, 0.4, 0.75), 1]);
  const reading = blend([lin(p.interceptions_p90, 0.2, 1.8), 2], [lin(p.recoveries_p90, 2, 9), 1]);
  const aerial = blend([lin(p.aerials_won_p90, 0.2, 4), 1], [lin(aerialAcc, 0.3, 0.7), 1]);
  const security = lin(p.dispossessed_p90, 3, 0.3);
  const engine = blend([lin(p.recoveries_p90, 2, 9), 1], [lin(p.total_tackles_p90, 0.5, 3.5), 1], [lin(p.touches_p90, 30, 100), 1]);

  return {
    finishing,
    longShots: blend([lin(p.shots_p90, 0.2, 4), 1], [lin(onTarget, 0.2, 0.55), 1]),
    offTheBall: blend([lin(p.xg_p90, 0.03, 0.7), 2], [lin(p.shots_p90, 0.2, 4), 1]),
    composure: blend([finishing, 1], [passing, 1], [security, 1]),
    passing,
    vision,
    technique: blend([passing, 1], [dribbling, 1], [security, 1]),
    firstTouch: blend([security, 2], [lin(p.touches_p90, 30, 100), 1]),
    decisions: blend([passing, 1], [vision, 1], [security, 1]),
    flair: blend([dribbling, 2], [vision, 1]),
    dribbling,
    agility: blend([dribbling, 1], [security, 1]),
    balance: blend([dribbling, 1], [security, 1]),
    crossing: blend([lin(p.crosses_p90, 0, 1.2), 1], [lin(crossAcc, 0.15, 0.4), 1]),
    corners: blend([lin(crossAcc, 0.15, 0.4), 1], [vision, 1]),
    freeKickTaking: blend([vision, 1], [lin(longAcc, 0.35, 0.75), 1]),
    tackling,
    marking: blend([tackling, 1], [reading, 1]),
    positioning: blend([reading, 2], [lin(p.clearances_p90, 0.2, 6), 1], [lin(p.blocked_shots_p90, 0, 1), 1]),
    anticipation: reading,
    concentration: lin(p.errors_to_goal_p90, 0.1, 0),
    heading: aerial,
    jumpingReach: aerial,
    strength: blend([aerial, 1], [tackling, 1]),
    bravery: blend([lin(p.blocked_shots_p90, 0, 1), 1], [aerial, 1]),
    aggression: blend([lin(p.total_tackles_p90, 0.5, 3.5), 1], [lin(p.yellows_p90, 0, 0.35), 1]),
    workRate: engine,
    stamina: engine,
    teamwork: blend([passing, 1], [engine, 1]),
  };
}

let distributions = null;
let builtAt = 0;

// Sorted composite values per role, from every player with a meaningful sample.
async function getDistributions() {
  if (distributions && Date.now() - builtAt < TTL_MS) return distributions;
  const players = await Player.find({ minutes: { $gte: MIN_MINUTES_FOR_DISTRIBUTION } }).lean();
  const d = {};
  for (const p of players) {
    const role = roleOf(p);
    d[role] ??= {};
    for (const [k, v] of Object.entries(composites(p))) {
      if (v === null) continue;
      (d[role][k] ??= []).push(v);
    }
  }
  for (const role of Object.values(d)) for (const arr of Object.values(role)) arr.sort((a, b) => a - b);
  distributions = d;
  builtAt = Date.now();
  return d;
}

function percentile(sorted, v) {
  if (!sorted || sorted.length < 5) return 0.5;
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo / sorted.length;
}

// keeperQ: 0..1 club shot-stopping (teamProfile.keeperQuality), or null when unknown.
function toAttributes(p, dist, keeperQ = null) {
  const role = roleOf(p);
  const trust = Math.min(1, (p.minutes || 0) / FULL_SAMPLE_MINUTES);
  const comp = composites(p);
  const attrs = {};

  for (const { attrs: keys, b } of FAMILIES) {
    const [lo, hi] = b[role];
    const mid = (lo + hi) / 2;
    for (const k of keys) {
      const v = comp[k];
      const target = v === null ? mid : lo + (hi - lo) * percentile(dist[role]?.[k], v);
      attrs[k] = Math.round(mid + (target - mid) * trust); // small samples shrink to the role middle
    }
  }

  const pace = PACE_BY_ROLE[role] + Math.round((attrs.dribbling - 12) * 0.3);
  Object.assign(attrs, {
    pace: Math.max(1, Math.min(20, pace)),
    acceleration: Math.max(1, Math.min(20, pace)),
    naturalFitness: 13,
    determination: 13,
    leadership: 11,
    longThrows: 8,
    penaltyTaking: Math.max(attrs.finishing, attrs.composure),
  });

  const isGK = role === 'GK';
  const stopper = isGK ? Math.round(9 + 10 * (keeperQ ?? 0.5)) : 2;
  Object.assign(attrs, {
    handling: stopper,
    reflexes: stopper,
    oneOnOnes: stopper,
    aerialReach: isGK ? Math.round((stopper + attrs.jumpingReach) / 2) : 2,
    commandOfArea: isGK ? Math.round((stopper + attrs.positioning) / 2) : 2,
    rushingOut: isGK ? 12 : 2,
    communication: isGK ? 13 : 2,
    eccentricity: isGK ? 8 : 2,
    tendencyToPunch: isGK ? 8 : 2,
    throwing: isGK ? attrs.passing : 2,
  });

  return attrs;
}

module.exports = { toAttributes, getDistributions, roleOf };
