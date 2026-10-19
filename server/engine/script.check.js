// node server/engine/script.check.js — sanity checks for the match script (no DB needed).
const assert = require('node:assert');
const { makeScript, expectedGoals } = require('./script');

const player = (id, position, g, xg) => ({
  player_id: id, player: `P${id}`, position, minutes: 900, goals_p90: g, xg_p90: xg, assists_p90: 0.1, xa_p90: 0.1,
});
const xi = (base, g) => [
  player(base, 'Goalkeeper', 0, 0),
  ...[1, 2, 3, 4].map((i) => player(base + i, 'Defender', 0.02, 0.03)),
  ...[5, 6, 7].map((i) => player(base + i, 'Midfielder', g / 3, g / 3)),
  ...[8, 9, 10].map((i) => player(base + i, 'Forward', g, g)),
];
const strong = { xi: xi(100, 0.8), profile: { goals: 4.3, xg: 3.2, conceded: 0.8, xga: 0.9, possession: 66, passes: 650, shots: 19, shotsAgainst: 8 } };
const weak = { xi: xi(200, 0.2), profile: { goals: 0.9, xg: 1.0, conceded: 2.1, xga: 1.9, possession: 40, passes: 380, shots: 9, shotsAgainst: 17 } };

assert(expectedGoals(strong, weak, true) > 2 * expectedGoals(weak, strong, false), 'strong side should expect far more goals');

let strongGoals = 0;
let weakGoals = 0;
for (let i = 0; i < 400; i++) {
  const s = makeScript(strong, weak);
  assert.strictEqual(s.possession.home + s.possession.away, 100);
  assert(s.shots.home > s.shots.away && s.passes.home > s.passes.away);
  for (const g of s.goals) {
    assert(g.minute >= 1 && g.minute <= 85);
    assert.notStrictEqual(g.player_id % 100, 0, 'goalkeepers never score');
    assert.notStrictEqual(g.player_id, g.assist_id, 'nobody assists himself');
    if (g.side === 'home') strongGoals++;
    else weakGoals++;
  }
}
const avg = strongGoals / 400;
assert(avg > 2.5 && avg <= 5.5, `strong side averages ${avg.toFixed(2)} goals`);
assert(weakGoals / 400 < 1, 'weak side scores rarely');
console.log(`ok: strong ${avg.toFixed(2)} vs weak ${(weakGoals / 400).toFixed(2)} goals per match`);
