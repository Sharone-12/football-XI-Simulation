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
  mode: 'club' | 'dream';
  createdAt?: string;
}

export interface LineupData {
  name: string;
  team_id?: number;
  formation: string;
  players: SelectedPlayer[];
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
  type: 'goal' | 'card' | 'chance' | 'save' | 'substitution';
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
