import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Team } from '../../models/team.model';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-team-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="team-select-page">
      <h1 class="page-title">Club vs Club</h1>
      <p class="page-sub">Select a home team and an away team to build your lineups.</p>

      <div class="columns">
        <!-- Home Team Column -->
        <div class="team-column">
          <h2 class="column-title home-label">Home Team</h2>

          <div class="filters">
            <select [(ngModel)]="homeLeague" (ngModelChange)="loadTeams('home')">
              <option value="">All Leagues</option>
              @for (l of leagues; track l) {
                <option [value]="l">{{ l }}</option>
              }
            </select>
            <input
              type="text"
              placeholder="Search teams..."
              [(ngModel)]="homeSearch"
              (input)="loadTeams('home')"
            />
          </div>

          @if (loadingHome) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="team-list">
              @for (team of homeTeams; track team.team_id) {
                <div
                  class="team-item"
                  [class.selected]="selectedHome?.team_id === team.team_id"
                  (click)="selectTeam('home', team)"
                >
                  <span class="team-name">{{ team.name }}</span>
                  <span class="team-league">{{ team.league }}</span>
                </div>
              }
              @if (homeTeams.length === 0) {
                <p class="empty">No teams found</p>
              }
            </div>
          }
        </div>

        <!-- Away Team Column -->
        <div class="team-column">
          <h2 class="column-title away-label">Away Team</h2>

          <div class="filters">
            <select [(ngModel)]="awayLeague" (ngModelChange)="loadTeams('away')">
              <option value="">All Leagues</option>
              @for (l of leagues; track l) {
                <option [value]="l">{{ l }}</option>
              }
            </select>
            <input
              type="text"
              placeholder="Search teams..."
              [(ngModel)]="awaySearch"
              (input)="loadTeams('away')"
            />
          </div>

          @if (loadingAway) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="team-list">
              @for (team of awayTeams; track team.team_id) {
                <div
                  class="team-item"
                  [class.selected]="selectedAway?.team_id === team.team_id"
                  (click)="selectTeam('away', team)"
                >
                  <span class="team-name">{{ team.name }}</span>
                  <span class="team-league">{{ team.league }}</span>
                </div>
              }
              @if (awayTeams.length === 0) {
                <p class="empty">No teams found</p>
              }
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
          <button class="btn btn-primary" (click)="goToLineup()">
            Continue to Lineup &rarr;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .team-select-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
    }

    .page-sub {
      text-align: center;
      color: var(--text-secondary);
      margin-top: 0.5rem;
      margin-bottom: 2rem;
    }

    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .team-column {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }

    .column-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-align: center;
    }

    .home-label { color: var(--accent-green); }
    .away-label { color: var(--accent-blue); }

    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .filters select,
    .filters input {
      flex: 1;
      min-width: 0;
    }

    .team-list {
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .team-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition);
    }

    .team-item:hover {
      background: var(--bg-card-hover);
    }

    .team-item.selected {
      background: rgba(34, 197, 94, 0.1);
      border-left: 3px solid var(--accent-green);
    }

    .team-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .team-league {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .empty {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem;
    }

    .continue-bar {
      margin-top: 2rem;
      background: var(--bg-card);
      border: 1px solid var(--accent-green);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .matchup {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .matchup-team {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .matchup-vs {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    @media (max-width: 768px) {
      .columns {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class TeamSelectComponent implements OnInit {
  leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Champions League'];

  homeLeague = '';
  awayLeague = '';
  homeSearch = '';
  awaySearch = '';

  homeTeams: Team[] = [];
  awayTeams: Team[] = [];
  loadingHome = false;
  loadingAway = false;

  selectedHome: Team | null = null;
  selectedAway: Team | null = null;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeams('home');
    this.loadTeams('away');
  }

  loadTeams(side: 'home' | 'away'): void {
    const league = side === 'home' ? this.homeLeague : this.awayLeague;
    const search = side === 'home' ? this.homeSearch : this.awaySearch;

    if (side === 'home') this.loadingHome = true;
    else this.loadingAway = true;

    this.api.getTeams(league || undefined, search || undefined).subscribe({
      next: (teams) => {
        if (side === 'home') {
          this.homeTeams = teams;
          this.loadingHome = false;
        } else {
          this.awayTeams = teams;
          this.loadingAway = false;
        }
      },
      error: () => {
        if (side === 'home') this.loadingHome = false;
        else this.loadingAway = false;
      },
    });
  }

  selectTeam(side: 'home' | 'away', team: Team): void {
    if (side === 'home') this.selectedHome = team;
    else this.selectedAway = team;
  }

  goToLineup(): void {
    if (this.selectedHome && this.selectedAway) {
      this.router.navigate(['/lineup'], {
        state: {
          homeTeam: this.selectedHome,
          awayTeam: this.selectedAway,
          mode: 'club',
        },
      });
    }
  }
}
