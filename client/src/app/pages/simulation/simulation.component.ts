import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SimulationResult, MatchEvent } from '../../models/simulation.model';
import { FormationGridComponent } from '../../components/formation-grid/formation-grid.component';
import { StatBarComponent } from '../../components/stat-bar/stat-bar.component';
import { HistoryService } from '../../services/history.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, RouterModule, FormationGridComponent, StatBarComponent],
  template: `
    @if (result) {
      <div class="sim-page">
        <!-- Scoreline -->
        <div class="scoreline-card">
          <div class="team-side home-side">
            <span class="team-name">{{ result.result.homeTeamName }}</span>
          </div>
          <div class="score-center">
            <span class="score">{{ result.result.homeGoals }}</span>
            <span class="score-dash">-</span>
            <span class="score">{{ result.result.awayGoals }}</span>
          </div>
          <div class="team-side away-side">
            <span class="team-name">{{ result.result.awayTeamName }}</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-section card">
          <h3 class="section-title">Match Statistics</h3>
          <div class="stats-grid">
            <app-stat-bar
              [homeStat]="result.stats.possession.home"
              [awayStat]="result.stats.possession.away"
              label="Possession %"
            />
            <app-stat-bar
              [homeStat]="result.stats.shots.home"
              [awayStat]="result.stats.shots.away"
              label="Shots"
            />
            <app-stat-bar
              [homeStat]="result.stats.shotsOnTarget.home"
              [awayStat]="result.stats.shotsOnTarget.away"
              label="Shots on Target"
            />
            <app-stat-bar
              [homeStat]="result.stats.passes.home"
              [awayStat]="result.stats.passes.away"
              label="Passes"
            />
            <app-stat-bar
              [homeStat]="result.stats.fouls.home"
              [awayStat]="result.stats.fouls.away"
              label="Fouls"
            />
            <app-stat-bar
              [homeStat]="result.stats.corners.home"
              [awayStat]="result.stats.corners.away"
              label="Corners"
            />
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-section card">
          <h3 class="section-title">Match Timeline</h3>
          <div class="timeline">
            @for (event of result.timeline; track $index) {
              <div class="timeline-event" [class]="'event-' + event.type">
                <span class="event-minute">{{ event.minute }}'</span>
                <div class="event-dot-line">
                  <div class="event-dot" [class]="'dot-' + event.type"></div>
                  <div class="event-line"></div>
                </div>
                <div class="event-detail">
                  <span class="event-team">{{ event.team }}</span>
                  <span class="event-icon">{{ getEventIcon(event.type) }}</span>
                  <span class="event-player">{{ event.player }}</span>
                  <span class="event-desc">{{ event.description }}</span>
                </div>
              </div>
            }
            @if (result.timeline.length === 0) {
              <p class="empty">No events recorded</p>
            }
          </div>
        </div>

        <!-- Lineups -->
        <div class="lineups-section">
          <div class="lineup-half">
            <h3 class="lineup-title home-label">{{ result.homeTeam.name }} ({{ result.homeTeam.formation }})</h3>
            <app-formation-grid
              [formation]="result.homeTeam.formation"
              [players]="result.homeTeam.players"
            />
          </div>
          <div class="lineup-half">
            <h3 class="lineup-title away-label">{{ result.awayTeam.name }} ({{ result.awayTeam.formation }})</h3>
            <app-formation-grid
              [formation]="result.awayTeam.formation"
              [players]="result.awayTeam.players"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          @if (authService.isLoggedIn() && !saved) {
            <button class="btn btn-secondary" (click)="saveMatch()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Match' }}
            </button>
          }
          @if (saved) {
            <span class="saved-msg">Match saved!</span>
          }
          <a routerLink="/" class="btn btn-outline">New Match</a>
        </div>
      </div>
    } @else {
      <div class="loading-container" style="padding-top:6rem;">
        <p>No simulation data. Start a new match.</p>
        <a routerLink="/" class="btn btn-primary" style="margin-top:1rem;">Go Home</a>
      </div>
    }
  `,
  styles: [`
    .sim-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .scoreline-card {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2.5rem 2rem;
      margin-bottom: 2rem;
    }

    .team-side {
      flex: 1;
      text-align: center;
    }

    .team-name {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .score-center {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .score {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1;
    }

    .score-dash {
      font-size: 2rem;
      color: var(--text-muted);
      font-weight: 300;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .stats-section {
      margin-bottom: 2rem;
      padding-top: 2rem;
    }

    .stats-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .timeline-section {
      margin-bottom: 2rem;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      max-height: 400px;
      overflow-y: auto;
    }

    .timeline-event {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .event-minute {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      min-width: 36px;
      text-align: right;
    }

    .event-dot-line {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 4px;
    }

    .event-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-goal { background: var(--accent-green); box-shadow: 0 0 8px rgba(34,197,94,0.4); }
    .dot-card { background: var(--yellow); }
    .dot-chance { background: var(--accent-blue); }
    .dot-save { background: #a855f7; }
    .dot-substitution { background: var(--text-muted); }

    .event-line {
      width: 2px;
      flex: 1;
      min-height: 16px;
      background: var(--border-color);
    }

    .event-detail {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .event-team {
      font-weight: 600;
      color: var(--accent-green);
    }

    .event-icon {
      font-weight: 700;
    }

    .event-player {
      font-weight: 600;
    }

    .event-desc {
      color: var(--text-secondary);
    }

    .lineups-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .lineup-title {
      font-size: 1rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.75rem;
    }

    .home-label { color: var(--accent-green); }
    .away-label { color: var(--accent-blue); }

    .actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      align-items: center;
    }

    .saved-msg {
      color: var(--accent-green);
      font-weight: 600;
    }

    .empty {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem;
    }

    @media (max-width: 640px) {
      .scoreline-card {
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
      }
      .score { font-size: 2.5rem; }
      .lineups-section { grid-template-columns: 1fr; }
    }
  `],
})
export class SimulationComponent implements OnInit {
  result: SimulationResult | null = null;
  saving = false;
  saved = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private historyService: HistoryService
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state?.result) {
      this.result = state.result;
    }
  }

  ngOnInit(): void {}

  getEventIcon(type: string): string {
    switch (type) {
      case 'goal': return '[ GOAL ]';
      case 'card': return '[ CARD ]';
      case 'chance': return '[ CHANCE ]';
      case 'save': return '[ SAVE ]';
      case 'substitution': return '[ SUB ]';
      default: return '';
    }
  }

  saveMatch(): void {
    if (!this.result) return;
    this.saving = true;
    this.historyService.saveSimulation(this.result).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
