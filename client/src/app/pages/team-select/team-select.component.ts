import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Team } from '../../models/team.model';

@Component({
  selector: 'app-team-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Club vs Club</h1>
        <p class="page-sub">Select a home team and an away team to build your lineups.</p>
      </div>

      <div class="columns">
        <div class="team-column">
          <h2 class="column-title home-label">Home Team</h2>
          <div class="filters">
            <select [(ngModel)]="homeLeague" (ngModelChange)="loadTeams('home')">
              <option value="">All Leagues</option>
              @for (l of leagues; track l) { <option [value]="l">{{ l }}</option> }
            </select>
            <input type="text" placeholder="Search..." [(ngModel)]="homeSearch" (input)="loadTeams('home')" />
          </div>
          @if (loadingHome) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="team-list">
              @for (team of homeTeams; track team.team_id) {
                <div class="team-item" [class.selected]="selectedHome?.team_id === team.team_id" (click)="selectTeam('home', team)">
                  <span class="team-name">{{ team.name }}</span>
                  <span class="team-league">{{ team.league }}</span>
                </div>
              }
              @if (homeTeams.length === 0) { <p class="empty">No teams found</p> }
            </div>
          }
        </div>

        <div class="team-column">
          <h2 class="column-title away-label">Away Team</h2>
          <div class="filters">
            <select [(ngModel)]="awayLeague" (ngModelChange)="loadTeams('away')">
              <option value="">All Leagues</option>
              @for (l of leagues; track l) { <option [value]="l">{{ l }}</option> }
            </select>
            <input type="text" placeholder="Search..." [(ngModel)]="awaySearch" (input)="loadTeams('away')" />
          </div>
          @if (loadingAway) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="team-list">
              @for (team of awayTeams; track team.team_id) {
                <div class="team-item" [class.selected]="selectedAway?.team_id === team.team_id" (click)="selectTeam('away', team)">
                  <span class="team-name">{{ team.name }}</span>
                  <span class="team-league">{{ team.league }}</span>
                </div>
              }
              @if (awayTeams.length === 0) { <p class="empty">No teams found</p> }
            </div>
          }
        </div>
      </div>

      @if (selectedHome && selectedAway) {
        <div class="continue-bar">
          <div class="matchup">
            <span class="matchup-team">{{ selectedHome.name }}</span>
            <span class="matchup-vs">vs</span>
            <span class="matchup-team">{{ selectedAway.name }}</span>
          </div>
          <button class="btn btn-primary" (click)="goToLineup()">Continue to Lineup &rarr;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { height: 100%; display: flex; flex-direction: column; max-width: 1100px; margin: 0 auto; padding: 1rem 1rem 0.75rem; }
    .page-header { text-align: center; margin-bottom: 1rem; }
    .page-title { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; }
    .page-sub { color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem; }
    .columns { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; min-height: 0; }
    .team-column {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1rem;
      display: flex; flex-direction: column; min-height: 0;
      backdrop-filter: blur(12px);
    }
    .column-title { font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; text-align: center; margin-bottom: 0.75rem; }
    .home-label { color: var(--accent); }
    .away-label { color: var(--accent-blue); }
    .filters { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; }
    .filters select, .filters input { flex: 1; min-width: 0; font-size: 0.8rem; padding: 0.4rem 0.6rem; }
    .team-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; min-height: 0; }
    .team-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0.7rem; border-radius: var(--radius-sm);
      cursor: pointer; transition: all var(--transition);
    }
    .team-item:hover { background: rgba(255, 255, 255, 0.06); }
    .team-item.selected { background: rgba(106, 191, 64, 0.1); border-left: 3px solid var(--accent); }
    .team-name { font-weight: 500; font-size: 0.85rem; }
    .team-league { font-size: 0.7rem; color: var(--text-muted); }
    .empty { text-align: center; color: var(--text-muted); padding: 2rem; }
    .continue-bar {
      margin-top: 0.75rem; background: rgba(106, 191, 64, 0.08);
      border: 1px solid var(--accent); border-radius: var(--radius-md);
      padding: 0.75rem 1.25rem; display: flex;
      align-items: center; justify-content: space-between;
      animation: slideUp 0.3s ease; box-shadow: 0 0 20px rgba(106, 191, 64, 0.15);
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .matchup { display: flex; align-items: center; gap: 0.6rem; }
    .matchup-team { font-family: var(--font-heading); font-weight: 700; font-size: 1rem; }
    .matchup-vs { color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; }
    @media (max-width: 768px) { .columns { grid-template-columns: 1fr; } }
  `],
})
export class TeamSelectComponent implements OnInit {
  leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Champions League'];
  homeLeague = ''; awayLeague = ''; homeSearch = ''; awaySearch = '';
  homeTeams: Team[] = []; awayTeams: Team[] = [];
  loadingHome = false; loadingAway = false;
  selectedHome: Team | null = null; selectedAway: Team | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void { this.loadTeams('home'); this.loadTeams('away'); }

  loadTeams(side: 'home' | 'away'): void {
    const league = side === 'home' ? this.homeLeague : this.awayLeague;
    const search = side === 'home' ? this.homeSearch : this.awaySearch;
    if (side === 'home') this.loadingHome = true; else this.loadingAway = true;
    this.api.getTeams(league || undefined, search || undefined).subscribe({
      next: (teams) => {
        if (side === 'home') { this.homeTeams = teams; this.loadingHome = false; }
        else { this.awayTeams = teams; this.loadingAway = false; }
      },
      error: () => { if (side === 'home') this.loadingHome = false; else this.loadingAway = false; },
    });
  }

  selectTeam(side: 'home' | 'away', team: Team): void {
    if (side === 'home') this.selectedHome = team; else this.selectedAway = team;
  }

  goToLineup(): void {
    if (this.selectedHome && this.selectedAway) {
      this.router.navigate(['/lineup'], {
        state: { homeTeam: this.selectedHome, awayTeam: this.selectedAway, mode: 'club' },
      });
    }
  }
}
