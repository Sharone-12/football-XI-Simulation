import { RealTimeEngine, Team, Player, Position } from '@bleckert/football-simulator';
import type { MatchSlice, MatchSnapshot, PlayerAttributes, RealTimeMatchEvent, SimulatedPlayer, Tactics } from '@bleckert/football-simulator';
import { FORMATION_LAYOUTS } from '../components/formation-grid/formation-grid.component';
import { MatchEvent, MatchSetup, MatchStats, ScriptGoal, SelectedPlayer, SetupPlayer, SetupTeam, SimulationResult } from '../models/simulation.model';

type Side = 'home' | 'away';

const SINGLE_ROLE: Record<string, Position> = {
  GK: Position.GK, LB: Position.LB, RB: Position.RB, LWB: Position.LWB, RWB: Position.RWB,
  LM: Position.LM, RM: Position.RM, LW: Position.LW, RW: Position.RW,
  CAM: Position.COM, LAM: Position.LW, RAM: Position.RW,
};

// Slot labels that repeat in a formation are split left -> right.
const GROUP_ROLES: Record<string, Position[][]> = {
  CB: [[Position.CB], [Position.LCB, Position.RCB], [Position.LCB, Position.CB, Position.RCB]],
  CM: [[Position.CM], [Position.LCM, Position.RCM], [Position.LCM, Position.CM, Position.RCM]],
  CDM: [[Position.DM], [Position.LDM, Position.RDM], [Position.LDM, Position.DM, Position.RDM]],
  ST: [[Position.ST], [Position.LF, Position.RF], [Position.LF, Position.CF, Position.RF]],
};

const DETAILED_ROLE: Record<string, Position> = {
  GK: Position.GK, DL: Position.LB, DR: Position.RB, DC: Position.CB, DM: Position.DM,
  MC: Position.CM, ML: Position.LM, MR: Position.RM, AMC: Position.COM, AML: Position.LW,
  AMR: Position.RW, ST: Position.ST, FW: Position.ST,
};

const GROUP_FALLBACK: Record<string, Position> = {
  Goalkeeper: Position.GK, Defender: Position.CB, Midfielder: Position.CM, Forward: Position.ST,
};

function slotRoles(formation: string): Position[] {
  const labels = (FORMATION_LAYOUTS[formation] || FORMATION_LAYOUTS['4-3-3']).map((s) => s.label);
  const seen: Record<string, number> = {};
  return labels.map((label) => {
    if (label in SINGLE_ROLE) return SINGLE_ROLE[label];
    const count = labels.filter((l) => l === label).length;
    seen[label] = (seen[label] ?? -1) + 1;
    return GROUP_ROLES[label][count - 1][seen[label]];
  });
}

function benchRole(p: SetupPlayer): Position {
  const first = (p.detailed_position || '').split('/')[0];
  return DETAILED_ROLE[first] ?? GROUP_FALLBACK[p.position] ?? Position.CM;
}

const minuteOf = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

/** Copies an object graph, keeping prototypes and shared references: a checkpoint of the engine. */
function cloneGraph<T>(root: T): T {
  const seen = new Map<object, unknown>();
  const walk = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return seen.get(v);
    if (Array.isArray(v)) {
      const out: unknown[] = [];
      seen.set(v, out);
      for (const x of v) out.push(walk(x));
      return out;
    }
    if (v instanceof Map) {
      const out = new Map();
      seen.set(v, out);
      for (const [k, x] of v) out.set(walk(k), walk(x));
      return out;
    }
    if (v instanceof Set) {
      const out = new Set();
      seen.set(v, out);
      for (const x of v) out.add(walk(x));
      return out;
    }
    const out = Object.create(Object.getPrototypeOf(v));
    seen.set(v, out);
    for (const k of Object.keys(v)) out[k] = walk((v as Record<string, unknown>)[k]);
    return out;
  };
  return walk(root) as T;
}

// The engine's own shot rate gives each side ~13 shots a match; scaled to the side's real shot volume.
const ENGINE_SHOTS_PER_SIDE = 13.4;
const SHOT_REPLAYS = 30;
const QUICK_REPLAYS = 30;
const BALL_DECAY = 0.985; // engine's per-tick rolling friction
const GOAL_WIDTH = 7.32;
const PITCH_WIDTH = 68;
const SCORER_EARLY = 25 * 60; // the scripted scorer may score from 25 minutes before his minute
const SCORER_GRACE = 15 * 60; // after which another attacker may finish it instead
const DUE_SCORER_BOOST = 3;
const BEHIND_BOOST = 1.5;
const LATE_BOOST = 3;
const NOT_SCORERS = new Set([Position.GK, Position.LB, Position.LCB, Position.CB, Position.RCB, Position.RB, Position.LWB, Position.RWB]);

type Engine = RealTimeEngine;
type ShotIntent = { shootingIntentChance(p: SimulatedPlayer, distance: number): number; state: { time: number } };
type ShotAction = { type: string; teamSide: Side; from: SimulatedPlayer; target: { x: number; y: number }; inaccurate: boolean };
type Replay = { eng: Engine; slices: MatchSlice[]; goal: boolean };

interface PlayerTally { goals: number; assists: number; shots: number; saves: number; tackles: number; interceptions: number; passes: number }

export interface RosterEntry { id: string; teamSide: Side; roleName: string; playerName: string; playerNumber: number }

/** One engine tick, stored compactly (a full MatchSnapshot is ~10KB; a match has ~22k ticks). */
interface Frame {
  t: number;
  period: 1 | 2 | 'ended';
  phase: string;
  home: number;
  away: number;
  bx: number;
  by: number;
  owner: number;
  xy: Float32Array;
  roster: RosterEntry[];
  pass: { x: number; y: number } | null;
  intent: string | null;
  possSide: Side | null;
}

export interface PitchView {
  players: (RosterEntry & { x: number; y: number })[];
  bx: number;
  by: number;
  ownerId: string | null;
  phase: string;
  period: 1 | 2 | 'ended';
  possSide: Side | null;
  pass: { x: number; y: number } | null;
  intent: string | null;
}

export const TICK_SECONDS = 0.25;
const ACTION_PRE_TICKS = 32;  // 8s of build-up before a shot or card
const ACTION_POST_TICKS = 10; // 2.5s after it

/**
 * Plays the match on the physics engine, directed by the data-driven script: open play is never
 * touched, but each shot is replayed from the moment it is struck until its outcome matches the
 * script (the scripted scorer's shot goes in, everyone else's doesn't).
 */
export class LiveMatch {
  private engine: Engine;
  readonly frames: Frame[] = [];
  readonly feed: MatchEvent[] = [];
  readonly feedTicks: number[] = [];
  halfTimeTick = -1;

  private readonly actionTicks: number[] = [];
  private roster: RosterEntry[] = [];
  /** Keyed `${side}:${shirt number}`: engine checkpoints copy Player objects, so identity can't be used. */
  private readonly ids = new Map<string, SetupPlayer>();
  private readonly lineups = new Map<SetupTeam, (SetupPlayer | null)[]>();
  private readonly tallies = new Map<string, PlayerTally>();
  private readonly counts = {
    possession: { home: 0, away: 0 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 },
    passes: { home: 0, away: 0 }, fouls: { home: 0, away: 0 }, corners: { home: 0, away: 0 },
  };
  private lastReceive: { receiver?: string; passer?: Player; side?: Side; time: number } = { time: -1 };
  private readonly pending: ScriptGoal[];
  private scriptedGoal: ScriptGoal | null = null;

  constructor(private readonly setup: MatchSetup) {
    const home = this.buildTeam(setup.homeTeam, true);
    const away = this.buildTeam(setup.awayTeam, false);
    const tactics = (t: SetupTeam) => ({ ...(t.tactics as Partial<Tactics>), formation: t.formation });
    this.engine = new RealTimeEngine(home, away, {
      homeTactics: tactics(setup.homeTeam),
      awayTactics: tactics(setup.awayTeam),
    });
    this.pending = [...(setup.script?.goals ?? [])];

    const shots = setup.script?.shots;
    if (shots) {
      const scale = {
        home: Math.min(2.5, Math.max(0.4, shots.home / ENGINE_SHOTS_PER_SIDE)),
        away: Math.min(2.5, Math.max(0.4, shots.away / ENGINE_SHOTS_PER_SIDE)),
      };
      const shooter = this.shooterWeights();
      const pending = this.pending;
      // The engine's private shot decision, scaled per side by the team's real shot volume and per
      // player by their shots per 90 (an own property, so checkpoints keep it).
      const eng = this.engine as unknown as ShotIntent;
      const shoot = eng.shootingIntentChance;
      eng.shootingIntentChance = function (this: ShotIntent, p: SimulatedPlayer, d: number) {
        const side = p.side as Side;
        const now = this.state.time;
        const mine = pending.filter((g) => g.side === side);
        const due = mine.some((g) => g.player === p.player.info.name && now >= g.minute * 60 - SCORER_EARLY);
        // A side behind its script pushes for the goal, harder as time runs out.
        const behind = mine.some((g) => now >= g.minute * 60);
        const late = mine.length && this.state.time > 5400 - mine.length * 600;
        return shoot.call(this, p, d) * scale[side] * (shooter.get(`${side}:${p.player.info.number}`) ?? 1)
          * (due ? DUE_SCORER_BOOST : 1) * (late ? LATE_BOOST : behind ? BEHIND_BOOST : 1);
      };
    }
    this.recordFrame(this.engine.start());
  }

  get lastTick(): number {
    return this.frames.length - 1;
  }

  /** Simulates the whole match (~2s), yielding to the browser between chunks. */
  async run(chunk = 1200): Promise<void> {
    const directed = !!this.setup.script;
    let lastShot: unknown = null;
    let quickRetries = 0;
    let sinceYield = 0;

    while (this.engine.state.period !== 'ended') {
      if (sinceYield >= chunk) {
        sinceYield = 0;
        await new Promise((resolve) => setTimeout(resolve));
      }
      const eng = this.engine;
      // A shot from close range can be struck and scored inside one tick: keep the tick before.
      const pre = directed && this.nearGoal() ? cloneGraph(eng) : null;
      const slice = this.step(eng);
      sinceYield++;

      // A shot struck and settled inside this tick never reaches the replay below: replay the tick.
      const quick = directed ? slice.events.find((e) => e.type === 'shot' && eng.state.activeBallAction?.type !== 'shot') : undefined;
      if (quick) {
        const sp = eng.state.players.find((p) => p.player === quick.player);
        const target = sp ? this.targetFor(sp) : null;
        const goal = slice.events.some((e) => e.type === 'goal');
        if (goal !== !!target && pre && quickRetries < QUICK_REPLAYS) {
          quickRetries++;
          this.engine = pre;
          continue;
        }
        if (goal) this.scriptedGoal = target;
      }
      quickRetries = 0;
      this.commit(slice);

      const act = eng.state.activeBallAction as ShotAction | null;
      if (!directed || act?.type !== 'shot' || act === lastShot) continue;

      // A shot has just been struck: replay its flight until the outcome matches the script.
      const target = this.targetFor(act.from);
      const struck = cloneGraph(eng);
      let chosen: Replay | null = null;
      for (let k = 0; k < SHOT_REPLAYS; k++) {
        const w = cloneGraph(struck);
        if (target) this.aimOnTarget(w);
        const r = this.resolveShot(w);
        if (r.goal === !!target) {
          chosen = r;
          break;
        }
        if (!chosen && !r.goal) chosen = r;
      }
      chosen ??= this.resolveShot(cloneGraph(struck));
      this.engine = chosen.eng;
      sinceYield += chosen.slices.length;
      if (chosen.goal) this.scriptedGoal = target;
      for (const s of chosen.slices) this.commit(s);
      lastShot = this.engine.state.activeBallAction;
    }
  }

  /** Each player's shots per 90 relative to his side's average: who actually takes the shots. */
  private shooterWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    for (const side of ['home', 'away'] as Side[]) {
      const players = [...this.ids].filter(([key]) => key.startsWith(`${side}:`));
      const outfield = players.filter(([, p]) => p.position !== 'Goalkeeper');
      // Shot-weighted mean: the players who take the shots set the reference, so totals stay on target.
      const sum = outfield.reduce((s, [, p]) => s + (p.shots_p90 ?? 0), 0);
      const mean = sum && outfield.reduce((s, [, p]) => s + (p.shots_p90 ?? 0) ** 2, 0) / sum;
      if (!mean) continue;
      for (const [key, p] of outfield) weights.set(key, Math.min(3, Math.max(0.25, (p.shots_p90 ?? 0) / mean)));
    }
    return weights;
  }

  private step(eng: Engine): MatchSlice {
    const slice = eng.tick();
    // The engine keeps every snapshot and event (~250MB a match) but never reads them back.
    eng.snapshots.length = 0;
    eng.events.length = 0;
    return slice;
  }

  /** An outfield player on the ball close enough to a goal line to shoot and score in one tick. */
  private nearGoal(): boolean {
    const owner = this.engine.state.ball.owner;
    return !!owner && owner.role !== Position.GK && Math.min(owner.x, 105 - owner.x) < 14;
  }

  /** Plays a struck shot until it resolves. */
  private resolveShot(eng: Engine): Replay {
    const slices: MatchSlice[] = [];
    for (let i = 0; i < 40 && eng.state.period !== 'ended'; i++) {
      const s = this.step(eng);
      slices.push(s);
      if (s.events.some((e) => e.type === 'goal')) return { eng, slices, goal: true };
      if ((eng.state.activeBallAction as ShotAction | null)?.type !== 'shot') break;
    }
    return { eng, slices, goal: false };
  }

  /**
   * Re-aims a struck shot inside the posts; the keeper still has to be beaten. The engine judges
   * "inside the posts" where the ball ends the tick, so the pace is set to finish just over the line.
   */
  private aimOnTarget(eng: Engine): void {
    const act = eng.state.activeBallAction as ShotAction;
    const ball = eng.state.ball;
    const target = { x: act.target.x, y: PITCH_WIDTH / 2 + (Math.random() - 0.5) * GOAL_WIDTH * 0.6 };
    const dx = target.x - ball.x;
    const dy = target.y - ball.y;
    const d = Math.hypot(dx, dy) || 1;
    const run = d + 0.5;
    const speed = Math.hypot(ball.velocity.x, ball.velocity.y) || 34;
    const ticks = Math.max(1, Math.ceil(run / (speed * TICK_SECONDS)));
    const v = run / (TICK_SECONDS * (1 - BALL_DECAY ** ticks) / (1 - BALL_DECAY));
    ball.velocity = { x: (dx / d) * v, y: (dy / d) * v };
    act.target = target;
    act.inaccurate = false;
  }

  /** Which scripted goal (if any) a shot by `sp` right now should become. */
  private targetFor(sp: SimulatedPlayer): ScriptGoal | null {
    const now = this.engine.state.time;
    const left = this.engine.matchLengthSeconds - now;
    const mine = this.pending.filter((g) => g.side === sp.side);
    if (!mine.length) return null;
    const name = sp.player.info.name;
    // The scripted scorer: from 15 minutes before the scripted minute.
    const exact = mine.find((g) => g.player === name && now >= g.minute * 60 - SCORER_EARLY);
    if (exact) return exact;
    const natural = sp.player.position;
    if (natural === Position.GK) return null;
    // Scorer subbed off, goal well overdue, or time running out: another attacker finishes it.
    const onPitch = new Set(this.engine.state.players.map((p) => p.player.info.name));
    const goal = mine.find((g) => !onPitch.has(g.player) && now >= g.minute * 60 - 300)
      ?? mine.find((g) => now >= g.minute * 60 + SCORER_GRACE)
      ?? (left < mine.length * 900 ? mine[0] : null);
    if (goal && !NOT_SCORERS.has(natural)) return goal;
    return left < mine.length * 600 ? mine[0] : null;
  }

  private commit(slice: MatchSlice): void {
    const s = slice.snapshot;
    const tick = this.frames.length;
    // Ball ownership tracks control better than possession.teamSide, which barely moves off 50/50.
    const owner = s.ball.ownerId && s.phase === 'open_play' ? s.players.find((p) => p.id === s.ball.ownerId) : undefined;
    if (owner) this.counts.possession[owner.teamSide]++;

    const before = this.feed.length;
    for (const e of slice.events) {
      this.record(e);
      if (['shot', 'penalty', 'yellow_card', 'red_card'].includes(e.type)) this.actionTicks.push(tick);
      if (e.type === 'half_time') this.halfTimeTick = tick;
    }
    for (let k = before; k < this.feed.length; k++) this.feedTicks.push(tick);
    this.recordFrame(s);
  }

  /** 1 for ticks inside the build-up/aftermath window of a shot or card. */
  actionMask(): Uint8Array {
    const mask = new Uint8Array(this.frames.length);
    for (const t of this.actionTicks) mask.fill(1, Math.max(0, t - ACTION_PRE_TICKS), Math.min(mask.length, t + ACTION_POST_TICKS));
    return mask;
  }

  viewAt(tick: number): PitchView {
    const f = this.frames[Math.max(0, Math.min(tick, this.lastTick))];
    return {
      players: f.roster.map((r, k) => ({ ...r, x: f.xy[2 * k], y: f.xy[2 * k + 1] })),
      bx: f.bx,
      by: f.by,
      ownerId: f.owner >= 0 ? f.roster[f.owner].id : null,
      phase: f.phase,
      period: f.period,
      possSide: f.possSide,
      pass: f.pass,
      intent: f.intent,
    };
  }

  frameAt(tick: number): { t: number; home: number; away: number } {
    return this.frames[Math.max(0, Math.min(tick, this.lastTick))];
  }

  private recordFrame(s: MatchSnapshot): void {
    const ps = s.players;
    if (ps.length !== this.roster.length || ps.some((p, i) => p.id !== this.roster[i].id)) {
      this.roster = ps.map((p) => ({
        id: p.id, teamSide: p.teamSide, roleName: p.roleName, playerName: p.playerName, playerNumber: p.playerNumber,
      }));
    }
    const xy = new Float32Array(ps.length * 2);
    let owner = -1;
    ps.forEach((p, i) => {
      xy[2 * i] = p.x;
      xy[2 * i + 1] = p.y;
      if (p.id === s.ball.ownerId) owner = i;
    });
    this.frames.push({
      t: s.time,
      period: s.period,
      phase: s.phase,
      home: s.score.home,
      away: s.score.away,
      bx: s.ball.x,
      by: s.ball.y,
      owner,
      xy,
      roster: this.roster,
      pass: s.activePassTarget ? { x: s.activePassTarget.x, y: s.activePassTarget.y } : null,
      intent: owner >= 0 ? ps[owner].currentIntent.type : null,
      possSide: (s.possession.teamSide as Side | null) ?? null,
    });
  }

  result(): SimulationResult {
    const c = this.counts;
    const possTotal = c.possession.home + c.possession.away || 1;
    const homePoss = Math.round((c.possession.home / possTotal) * 100);
    const stats: MatchStats = {
      // Possession and passes from the team data (the engine passes ~2.5x a real side); the rest as played.
      possession: this.setup.script?.possession ?? { home: homePoss, away: 100 - homePoss },
      passes: this.setup.script?.passes ?? c.passes,
      shots: c.shots, shotsOnTarget: c.shotsOnTarget, fouls: c.fouls, corners: c.corners,
    };
    return {
      homeTeam: this.lineup(this.setup.homeTeam),
      awayTeam: this.lineup(this.setup.awayTeam),
      result: {
        homeGoals: this.frames[this.lastTick].home,
        awayGoals: this.frames[this.lastTick].away,
        homeTeamName: this.setup.homeTeam.name,
        awayTeamName: this.setup.awayTeam.name,
      },
      timeline: this.feed,
      stats,
      potm: this.playerOfTheMatch(),
      mode: this.setup.mode,
    };
  }

  private buildTeam(t: SetupTeam, home: boolean): Team {
    const side: Side = home ? 'home' : 'away';
    const sample = (t.players.find(Boolean) as SetupPlayer).attributes;
    const standIn = (gk: boolean) => Object.fromEntries(Object.keys(sample).map((k) => [k, gk ? 12 : 11])) as unknown as PlayerAttributes;
    const make = (p: SetupPlayer | null, role: Position, number: number) => {
      const player = new Player(
        { name: p?.player ?? `${t.name} ${role === Position.GK ? 'Keeper' : 'Stand-in'}`, number },
        { height: role === Position.GK ? 190 : 182, weight: 77 },
        (p?.attributes as unknown as PlayerAttributes) ?? standIn(role === Position.GK),
        role,
      );
      if (p) this.ids.set(`${side}:${number}`, p);
      return player;
    };

    // No keeper picked: start the squad's bench keeper rather than a stand-in.
    let benchPlayers = t.bench ?? [];
    let lineup = t.players;
    const benchGk = !lineup[0] && benchPlayers.find((p) => p.position === 'Goalkeeper');
    if (benchGk) {
      lineup = [benchGk, ...lineup.slice(1)];
      benchPlayers = benchPlayers.filter((p) => p !== benchGk);
    }
    this.lineups.set(t, lineup);

    const starters = slotRoles(t.formation).map((role, i) => make(lineup[i] ?? null, role, i + 1));
    // Without a named bench the engine clones the goalkeeper's attributes for every sub.
    const bench = benchPlayers.length
      ? benchPlayers.map((p, i) => make(p, benchRole(p), 12 + i))
      : [Position.GK, Position.CB, Position.CM, Position.RM, Position.ST].map((role, i) => {
          const like = starters.find((s) => s.position === role) ?? starters[role === Position.GK ? 0 : 9];
          return new Player({ name: `${t.name} Sub ${i + 1}`, number: 12 + i }, like.biometrics, { ...like.attributes }, role);
        });
    return new Team(home, t.name, [...starters, ...bench]);
  }

  private lineup(t: SetupTeam): SimulationResult['homeTeam'] {
    const strip = (p: SetupPlayer | null): SelectedPlayer | null =>
      p && { player_id: p.player_id, player: p.player, position: p.position, detailed_position: p.detailed_position };
    return { name: t.name, team_id: t.team_id, formation: t.formation, players: (this.lineups.get(t) ?? t.players).map(strip) };
  }

  private tally(side: Side | undefined, number: number | undefined): PlayerTally | null {
    if (!side || number === undefined) return null;
    const key = `${side}:${number}`;
    let t = this.tallies.get(key);
    if (!t) this.tallies.set(key, (t = { goals: 0, assists: 0, shots: 0, saves: 0, tackles: 0, interceptions: 0, passes: 0 }));
    return t;
  }

  private tallyByName(side: Side, name: string): PlayerTally | null {
    for (const [key, sp] of this.ids) {
      if (key.startsWith(`${side}:`) && sp.player === name) return this.tally(side, Number(key.split(':')[1]));
    }
    return null;
  }

  private record(e: RealTimeMatchEvent): void {
    const side = e.teamSide as Side | undefined;
    const other: Side | undefined = side && (side === 'home' ? 'away' : 'home');
    const name = e.player?.info.name ?? '';
    const team = e.team?.name ?? '';
    const minute = minuteOf(e.time);
    const c = this.counts;
    const t = this.tally(side, e.player?.info.number);

    switch (e.type) {
      case 'pass':
        if (side) c.passes[side]++;
        if (t) t.passes++;
        break;
      case 'receive':
        this.lastReceive = { receiver: e.playerId, passer: e.secondaryPlayer, side, time: e.time };
        break;
      case 'shot':
        if (side) c.shots[side]++;
        if (t) t.shots++;
        break;
      case 'tackle':
        if (t) t.tackles++;
        break;
      case 'interception':
        if (t) t.interceptions++;
        break;
      case 'foul':
        if (side) c.fouls[side]++;
        break;
      case 'corner':
        if (side) c.corners[side]++;
        break;
      case 'goal': {
        if (side) c.shotsOnTarget[side]++;
        if (t) t.goals++;
        const scripted = this.scriptedGoal;
        this.scriptedGoal = null;
        if (scripted) this.pending.splice(this.pending.indexOf(scripted), 1);
        // The script's assist when its scorer finished it; otherwise whoever played the last pass.
        let assist: string | undefined;
        let assistTally: PlayerTally | null = null;
        if (scripted && scripted.player === name && side) {
          assist = scripted.assist ?? undefined;
          assistTally = assist ? this.tallyByName(side, assist) : null;
        } else {
          const r = this.lastReceive;
          const passer = r.receiver === e.playerId && r.side === side && e.time - r.time < 20 ? r.passer : undefined;
          assist = passer?.info.name;
          assistTally = this.tally(side, passer?.info.number);
        }
        if (assistTally) assistTally.assists++;
        const by = assist ? ` Assisted by ${assist}.` : '';
        this.feed.push({ minute, type: 'goal', team, player: name, description: `GOAL! ${name} scores for ${team}!${by}` });
        break;
      }
      case 'save': {
        if (other) c.shotsOnTarget[other]++;
        if (t) t.saves++;
        const shooter = e.secondaryPlayer?.info.name ?? 'The shot';
        const shooterTeam = other ? this.setup[other === 'home' ? 'homeTeam' : 'awayTeam'].name : team;
        this.feed.push({ minute, type: 'save', team: shooterTeam, player: shooter, description: `${shooter}'s shot is saved by ${name}.` });
        break;
      }
      case 'miss': {
        const text = e.outcome?.includes('deflected')
          ? `${name}'s effort is deflected behind.`
          : (e.chanceQuality ?? 0) >= 0.45 ? `Big chance! ${name} can't keep it on target.` : `${name} shoots wide.`;
        this.feed.push({ minute, type: 'chance', team, player: name, description: text });
        break;
      }
      case 'yellow_card':
      case 'red_card': {
        const red = e.type === 'red_card';
        this.feed.push({ minute, type: 'card', team, player: name, description: `${red ? 'RED' : 'YELLOW'} CARD! ${name} is ${red ? 'sent off' : 'booked'}.` });
        break;
      }
    }
  }

  private playerOfTheMatch(): SimulationResult['potm'] {
    let best: { key: string; rating: number; t: PlayerTally } | null = null;
    for (const [key, t] of this.tallies) {
      if (!this.ids.has(key)) continue;
      const rating = 6 + t.goals * 1.5 + t.assists * 1 + t.saves * 0.3 + t.shots * 0.1
        + t.tackles * 0.05 + t.interceptions * 0.05 + Math.min(t.passes, 60) * 0.01;
      if (!best || rating > best.rating) best = { key, rating, t };
    }
    if (!best) return undefined;
    const sp = this.ids.get(best.key)!;
    return {
      player_id: sp.player_id,
      player: sp.player,
      team: best.key.startsWith('home:') ? this.setup.homeTeam.name : this.setup.awayTeam.name,
      rating: Math.min(10, Math.round(best.rating * 10) / 10),
      goals: best.t.goals,
      assists: best.t.assists,
      chances: best.t.shots,
      saves: best.t.saves,
    };
  }
}
