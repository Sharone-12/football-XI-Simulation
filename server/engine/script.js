// Decides what happens in a match from the data: the score (team attack vs opposition defence,
// adjusted for the XI actually picked), who scores and assists (player per-90 output), possession
// and shot volume. The browser then plays the match out on the pitch to this script.

const LEAGUE_GOALS = 1.4; // goals per team per match
const LEAGUE_SHOTS = 12.5;
const HOME_ADVANTAGE = 1.08;
const FULL_SAMPLE_MINUTES = 900;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const avg = (a, b, fallback) => (a == null ? (b ?? fallback) : b == null ? a : (a + b) / 2);
const trust = (p) => Math.min(1, (p.minutes || 0) / FULL_SAMPLE_MINUTES);

function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function pick(items, weight) {
  const w = items.map(weight);
  let r = Math.random() * w.reduce((s, x) => s + x, 0);
  for (let i = 0; i < items.length; i++) if ((r -= w[i]) <= 0) return items[i];
  return items[items.length - 1];
}

const goalThreat = (p) => trust(p) * ((p.goals_p90 || 0) * 2 + (p.xg_p90 || 0) * 1.5) + 0.02;
const creativity = (p) =>
  trust(p) * ((p.assists_p90 || 0) * 2 + (p.xa_p90 || 0) * 1.5 + (p.key_passes_p90 || 0) * 0.1 + (p.big_chances_created_p90 || 0) * 0.5) + 0.02;

// Expected goals for `side` against `opp`. side/opp: { xi: Player docs, profile: team profile | null }
function expectedGoals(side, opp, home) {
  const attack = avg(side.profile?.goals, side.profile?.xg, LEAGUE_GOALS);
  const concede = avg(opp.profile?.conceded, opp.profile?.xga, LEAGUE_GOALS);
  // The XI's own per-90 output vs what the club usually scores: a weakened XI scores less.
  const outfield = side.xi.filter((p) => p.position !== 'Goalkeeper');
  const xiAttack = outfield.reduce((s, p) => s + trust(p) * ((p.goals_p90 || 0) + (p.xg_p90 || 0)) / 2, 0);
  const lineup = side.profile ? Math.sqrt(clamp(xiAttack / attack, 0.6, 1.5)) : 1;
  return clamp((attack * concede / LEAGUE_GOALS) * lineup * (home ? HOME_ADVANTAGE : 1), 0.15, 5);
}

function expectedShots(side, opp) {
  const shots = side.profile?.shots ?? LEAGUE_SHOTS;
  const allowed = opp.profile?.shotsAgainst ?? LEAGUE_SHOTS;
  return clamp(shots * allowed / LEAGUE_SHOTS, 4, 30);
}

function makeScript(home, away) {
  const goals = [];
  for (const [sideName, side, opp] of [['home', home, away], ['away', away, home]]) {
    const n = poisson(expectedGoals(side, opp, sideName === 'home'));
    const shooters = side.xi.filter((p) => p.position !== 'Goalkeeper');
    for (let i = 0; i < n; i++) {
      const scorer = pick(shooters, goalThreat);
      const assister = Math.random() < 0.85
        ? pick(side.xi.filter((p) => p !== scorer && p.position !== 'Goalkeeper'), creativity)
        : null;
      goals.push({
        side: sideName,
        // Up to 85': the pitch needs time to find the shot for it before full time.
        minute: 1 + Math.floor(Math.random() * 85),
        player_id: scorer.player_id,
        player: scorer.player,
        assist_id: assister?.player_id ?? null,
        assist: assister?.player ?? null,
      });
    }
  }
  goals.sort((a, b) => a.minute - b.minute);

  const hp = home.profile?.possession ?? 50;
  const ap = away.profile?.possession ?? 50;
  const possession = Math.round((hp / (hp + ap)) * 100);

  // A side's usual pass count, scaled by how much of the ball it gets in this match.
  const passes = (side, share, usual) => Math.round((side.profile?.passes ?? 450) * share / usual);

  return {
    goals,
    possession: { home: possession, away: 100 - possession },
    passes: { home: passes(home, possession, hp), away: passes(away, 100 - possession, ap) },
    shots: { home: Math.round(expectedShots(home, away)), away: Math.round(expectedShots(away, home)) },
  };
}

module.exports = { makeScript, expectedGoals };
