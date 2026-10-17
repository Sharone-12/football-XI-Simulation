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
      <div class="page">
        <div class="page-scroll">
          <div class="scoreline-card">
            <div class="team-side">
              <span class="team-name home-label">{{ result.result.homeTeamName }}</span>
            </div>
            <div class="score-center">
              <span class="score">{{ result.result.homeGoals }}</span>
              <span class="score-dash">&ndash;</span>
              <span class="score">{{ result.result.awayGoals }}</span>
            </div>
            <div class="team-side">
              <span class="team-name away-label">{{ result.result.awayTeamName }}</span>
            </div>
          </div>

          <div class="content-grid">
            <div class="col">
              <div class="section-card">
                <h3 class="section-title">Match Statistics</h3>
                <div class="stats-grid">
                  <app-stat-bar [homeStat]="result.stats.possession.home" [awayStat]="result.stats.possession.away" label="Possession %" />
                  <app-stat-bar [homeStat]="result.stats.shots.home" [awayStat]="result.stats.shots.away" label="Shots" />
                  <app-stat-bar [homeStat]="result.stats.shotsOnTarget.home" [awayStat]="result.stats.shotsOnTarget.away" label="On Target" />
                  <app-stat-bar [homeStat]="result.stats.passes.home" [awayStat]="result.stats.passes.away" label="Passes" />
                  <app-stat-bar [homeStat]="result.stats.fouls.home" [awayStat]="result.stats.fouls.away" label="Fouls" />
                  <app-stat-bar [homeStat]="result.stats.corners.home" [awayStat]="result.stats.corners.away" label="Corners" />
                </div>
              </div>

              <div class="section-card">
                <h3 class="section-title">Lineups</h3>
                <div class="lineups-row">
                  <div class="lineup-half">
                    <span class="lineup-label home-label">{{ result.homeTeam.name }} ({{ result.homeTeam.formation }})</span>
                    <app-formation-grid [formation]="result.homeTeam.formation" [players]="result.homeTeam.players" />
                  </div>
                  <div class="lineup-half">
                    <span class="lineup-label away-label">{{ result.awayTeam.name }} ({{ result.awayTeam.formation }})</span>
                    <app-formation-grid [formation]="result.awayTeam.formation" [players]="result.awayTeam.players" />
                  </div>
                </div>
              </div>
            </div>

            <div class="col">
              <div class="section-card timeline-card">
                <h3 class="section-title">Match Timeline</h3>
                <div class="timeline">
                  @for (event of result.timeline; track $index) {
                    <div class="tl-event">
                      <span class="tl-min">{{ event.minute }}'</span>
                      <div class="tl-dot" [class]="'dot-' + event.type"></div>
                      <div class="tl-detail">
                        <span class="tl-team">{{ event.team }}</span>
                        <span class="tl-icon">{{ getEventIcon(event.type) }}</span>
                        <span class="tl-player">{{ event.player }}</span>
                        @if (event.description) { <span class="tl-desc">{{ event.description }}</span> }
                      </div>
                    </div>
                  }
                  @if (result.timeline.length === 0) { <p class="empty">No events recorded</p> }
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            @if (authService.isLoggedIn() && !saved) {
              <button class="btn btn-secondary" (click)="saveMatch()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Match' }}
              </button>
            }
            @if (saved) { <span class="saved-msg">Match saved!</span> }
            <a routerLink="/" class="btn btn-outline">New Match</a>
          </div>
        </div>
      </div>
    } @else {
      <div class="page empty-page">
        <p>No simulation data. Start a new match.</p>
        <a routerLink="/" class="btn btn-primary" style="margin-top:1rem;">Go Home</a>
      </div>
    }
  `,
  styles: [`
    .page { height: 100%; display: flex; flex-direction: column; max-width: 1200px; margin: 0 auto; padding: 0.75rem 1rem; }
    .page-scroll { flex: 1; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .empty-page { justify-content: center; align-items: center; text-align: center; color: var(--text-muted); }
    .scoreline-card {
      display: flex; align-items: center; justify-content: center; gap: 1.5rem;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1.5rem; flex-shrink: 0;
      backdrop-filter: blur(12px);
    }
    .team-side { flex: 1; text-align: center; }
    .team-name { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; }
    .home-label { color: var(--accent); }
    .away-label { color: var(--accent-blue); }
    .score-center { display: flex; align-items: center; gap: 0.5rem; }
    .score { font-family: var(--font-heading); font-size: 2.8rem; font-weight: 800; line-height: 1; }
    .score-dash { font-size: 1.5rem; color: var(--text-muted); }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .col { display: flex; flex-direction: column; gap: 0.75rem; }
    .section-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1rem;
      backdrop-filter: blur(12px);
    }
    .section-title {
      font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 0.75rem; text-align: center;
    }
    .stats-grid { display: flex; flex-direction: column; gap: 1rem; }
    .lineups-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .lineup-half { display: flex; flex-direction: column; gap: 0.3rem; }
    .lineup-label { font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700; text-align: center; }
    .timeline-card { flex: 1; display: flex; flex-direction: column; }
    .timeline { flex: 1; display: flex; flex-direction: column; gap: 0; overflow-y: auto; max-height: 400px; }
    .tl-event { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.35rem 0; }
    .tl-min { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); min-width: 28px; text-align: right; }
    .tl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .dot-goal { background: var(--accent); box-shadow: 0 0 6px rgba(106,191,64,0.4); }
    .dot-card { background: #eab308; }
    .dot-chance { background: var(--accent-blue); }
    .dot-save { background: #a855f7; }
    .dot-substitution { background: var(--text-muted); }
    .tl-detail { display: flex; flex-wrap: wrap; gap: 0.25rem; font-size: 0.8rem; }
    .tl-team { font-weight: 600; color: var(--accent); }
    .tl-icon { font-weight: 700; font-size: 0.7rem; }
    .tl-player { font-weight: 600; }
    .tl-desc { color: var(--text-secondary); }
    .actions { display: flex; justify-content: center; gap: 0.75rem; align-items: center; padding: 0.5rem 0; flex-shrink: 0; }
    .saved-msg { color: var(--accent-green); font-weight: 600; font-size: 0.85rem; }
    .empty { text-align: center; color: var(--text-muted); padding: 1.5rem; }
    @media (max-width: 768px) {
      .content-grid { grid-template-columns: 1fr; }
      .scoreline-card { flex-direction: column; gap: 0.75rem; padding: 1rem; }
      .score { font-size: 2rem; }
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
    if (state?.result) this.result = state.result;
  }

  ngOnInit(): void {}

  getEventIcon(type: string): string {
    switch (type) {
      case 'goal': return 'GOAL';
      case 'card': return 'CARD';
      case 'chance': return 'CHANCE';
      case 'save': return 'SAVE';
      case 'substitution': return 'SUB';
      default: return '';
    }
  }

  saveMatch(): void {
    if (!this.result) return;
    this.saving = true;
    this.historyService.saveSimulation(this.result).subscribe({
      next: () => { this.saving = false; this.saved = true; },
      error: () => { this.saving = false; },
    });
  }
}
