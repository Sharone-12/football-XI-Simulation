import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from '../models/team.model';
import { Player } from '../models/player.model';
import { LineupData, MatchScript, SetupTeam } from '../models/simulation.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getTeams(league?: string, search?: string): Observable<Team[]> {
    let params = new HttpParams();
    if (league) params = params.set('league', league);
    if (search) params = params.set('search', search);
    return this.http.get<Team[]>(`${this.baseUrl}/teams`, { params });
  }

  getTeam(teamId: number): Observable<Team & { players: Player[] }> {
    return this.http.get<Team & { players: Player[] }>(`${this.baseUrl}/teams/${teamId}`);
  }

  getPlayers(options: {
    league?: string;
    team?: string;
    position?: string;
    search?: string;
    dreamxi?: boolean;
    page?: number;
    limit?: number;
  }): Observable<{ players: Player[]; total: number; pages: number }> {
    let params = new HttpParams();
    if (options.league) params = params.set('league', options.league);
    if (options.team) params = params.set('team', options.team);
    if (options.position) params = params.set('position', options.position);
    if (options.search) params = params.set('search', options.search);
    if (options.dreamxi) params = params.set('dreamxi', 'true');
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    return this.http.get<{ players: Player[]; total: number; pages: number }>(
      `${this.baseUrl}/players`,
      { params }
    );
  }

  getPlayer(playerId: number): Observable<Player> {
    return this.http.get<Player>(`${this.baseUrl}/players/${playerId}`);
  }

  // Returns slot-aligned lineups with engine attributes; the match runs client-side.
  simulate(homeLineup: LineupData, awayLineup: LineupData): Observable<{ homeTeam: SetupTeam; awayTeam: SetupTeam; script: MatchScript }> {
    const body = (l: LineupData) => ({
      formation: l.formation,
      players: l.players.map(p => p?.player_id ?? null),
      teamName: l.name,
    });
    return this.http.post<{ homeTeam: SetupTeam; awayTeam: SetupTeam; script: MatchScript }>(`${this.baseUrl}/simulate`, {
      homeLineup: body(homeLineup),
      awayLineup: body(awayLineup),
    });
  }
}
