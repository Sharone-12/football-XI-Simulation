import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HistoryService } from '../../services/history.service';
import { SimulationResult } from '../../models/simulation.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Match History</h1>
      </div>

      @if (!authService.isLoggedIn()) {
        <div class="center-msg">
          <p>Sign in to view your match history.</p>
          <a routerLink="/auth" class="btn btn-primary" style="margin-top:1rem;">Login / Register</a>
        </div>
      } @else if (loading) {
        <div class="loading-container"><div class="spinner"></div></div>
      } @else if (simulations.length === 0) {
        <div class="center-msg">
          <p>No saved matches yet. Simulate a match and save it!</p>
          <a routerLink="/" class="btn btn-primary" style="margin-top:1rem;">Start a Match</a>
        </div>
      } @else {
        <div class="history-list">
          @for (sim of simulations; track sim._id) {
            <div class="history-card" (click)="toggleExpand(sim)">
              <div class="card-header">
                <div class="card-matchup">
                  <span class="h-team">{{ sim.result.homeTeamName }}</span>
                  <span class="h-score">{{ sim.result.homeGoals }} - {{ sim.result.awayGoals }}</span>
                  <span class="h-team">{{ sim.result.awayTeamName }}</span>
                </div>
                <div class="card-meta">
                  <span class="mode-badge" [class]="sim.mode">{{ sim.mode === 'club' ? 'Club' : 'Dream' }}</span>
                  <span class="h-date">{{ sim.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>

              @if (expandedId === sim._id) {
                <div class="card-detail">
                  <div class="detail-stats">
                    <div class="detail-row">
                      <span>{{ sim.stats.possession.home }}%</span>
                      <span class="detail-label">Possession</span>
                      <span>{{ sim.stats.possession.away }}%</span>
                    </div>
                    <div class="detail-row">
                      <span>{{ sim.stats.shots.home }}</span>
                      <span class="detail-label">Shots</span>
                      <span>{{ sim.stats.shots.away }}</span>
                    </div>
                    <div class="detail-row">
                      <span>{{ sim.stats.shotsOnTarget.home }}</span>
                      <span class="detail-label">On Target</span>
                      <span>{{ sim.stats.shotsOnTarget.away }}</span>
                    </div>
                  </div>
                  <div class="detail-formations">
                    <span>{{ sim.homeTeam.formation }}</span>
                    <span class="detail-label">Formation</span>
                    <span>{{ sim.awayTeam.formation }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (totalPages > 1) {
          <div class="pagination">
            <button class="btn btn-outline" [disabled]="currentPage <= 1" (click)="loadPage(currentPage - 1)">Prev</button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="btn btn-outline" [disabled]="currentPage >= totalPages" (click)="loadPage(currentPage + 1)">Next</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { height: 100%; display: flex; flex-direction: column; max-width: 800px; margin: 0 auto; padding: 0.75rem 1rem; }
    .page-header { text-align: center; margin-bottom: 0.75rem; flex-shrink: 0; }
    .page-title { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; }
    .center-msg { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); }
    .history-list { flex: 1; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .history-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 0.75rem 1rem;
      cursor: pointer; transition: all var(--transition);
    }
    .history-card:hover { border-color: var(--accent); }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-matchup { display: flex; align-items: center; gap: 0.6rem; }
    .h-team { font-weight: 600; font-size: 0.9rem; }
    .h-score { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; color: var(--accent); }
    .card-meta { display: flex; align-items: center; gap: 0.6rem; }
    .mode-badge {
      font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.4rem;
      border-radius: 4px; text-transform: uppercase;
    }
    .mode-badge.club { background: var(--accent-dim); color: var(--accent); }
    .mode-badge.dream { background: rgba(59,95,192,0.1); color: var(--accent-blue); }
    .h-date { font-size: 0.75rem; color: var(--text-muted); }
    .card-detail {
      margin-top: 0.75rem; padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .detail-stats { display: flex; flex-direction: column; gap: 0.3rem; }
    .detail-row, .detail-formations { display: flex; justify-content: space-between; font-size: 0.8rem; }
    .detail-label { color: var(--text-muted); text-align: center; }
    .detail-formations { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.5rem 0; flex-shrink: 0; }
    .page-info { font-size: 0.8rem; color: var(--text-muted); }
  `],
})
export class HistoryComponent implements OnInit {
  simulations: SimulationResult[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  expandedId: string | null = null;

  constructor(public authService: AuthService, private historyService: HistoryService) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading = true;
    this.currentPage = page;
    this.historyService.getHistory(page).subscribe({
      next: (res) => { this.simulations = res.simulations; this.totalPages = res.pages; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  toggleExpand(sim: SimulationResult): void {
    this.expandedId = this.expandedId === sim._id ? null : (sim._id ?? null);
  }
}
