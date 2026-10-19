export interface SimulationResult {
  _id?: string;
  homeTeam: LineupData;
  awayTeam: LineupData;
  result: {
    homeGoals: number;
    awayGoals: number;
    homeTeamName: string;
    awayTeamName: string;
  };
  timeline: MatchEvent[];
  stats: MatchStats;
  potm?: { player_id: number; player: string; team: string; rating: number; goals: number; assists: number; chances: number; saves: number };
  mode: 'club' | 'dream';
  createdAt?: string;
}

export interface LineupData {
  name: string;
  team_id?: number;
  formation: string;
  players: (SelectedPlayer | null)[];
}

export interface SetupPlayer extends SelectedPlayer {
  attributes: Record<string, number>;
  shots_p90?: number;
}

export interface SetupTeam {
  name: string;
  team_id?: number;
  formation: string;
  players: (SetupPlayer | null)[];
  bench: SetupPlayer[];
  tactics?: Record<string, string | number>;
}

export interface ScriptGoal {
  side: 'home' | 'away';
  minute: number;
  player_id: number;
  player: string;
  assist_id: number | null;
  assist: string | null;
}

/** What the data says happens (server/engine/script.js); the pitch plays it out. */
export interface MatchScript {
  goals: ScriptGoal[];
  possession: { home: number; away: number };
  passes: { home: number; away: number };
  shots: { home: number; away: number };
}

export interface MatchSetup {
  homeTeam: SetupTeam;
  awayTeam: SetupTeam;
  script?: MatchScript;
  mode: 'club' | 'dream';
}

export interface SelectedPlayer {
  player_id: number;
  player: string;
  position: string;
  detailed_position: string;
  assignedPosition?: string;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'chance' | 'save' | 'tackle';
  team: string;
  player: string;
  description: string;
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  passes: { home: number; away: number };
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
}
