import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
      <div class="match-page">
        <div class="scoreboard">
          <div class="sb-side home-label">
            <img class="sb-crest" [src]="'https://img.sofascore.com/api/v1/team/' + result.homeTeam.team_id + '/image'" referrerpolicy="no-referrer" alt="" />
            <div class="sb-col">
              <span class="sb-team">{{ result.homeTeam.name }}</span>
              @if (matchEnded) {
                <div class="sb-scorers">
                  @for (g of homeScorers; track $index) {
                    <span class="sb-scorer">{{ g.player }} {{ g.minute }}'</span>
                  }
                </div>
              }
            </div>
          </div>
          <div class="sb-score">
            <span class="sb-goals">{{ homeGoalsShown }}</span>
            <span class="sb-dash">&ndash;</span>
            <span class="sb-goals">{{ awayGoalsShown }}</span>
          </div>
          <div class="sb-side away-label">
            <div class="sb-col away-col">
              <span class="sb-team">{{ result.awayTeam.name }}</span>
              @if (matchEnded) {
                <div class="sb-scorers">
                  @for (g of awayScorers; track $index) {
                    <span class="sb-scorer">{{ g.player }} {{ g.minute }}'</span>
                  }
                </div>
              }
            </div>
            <img class="sb-crest" [src]="'https://img.sofascore.com/api/v1/team/' + result.awayTeam.team_id + '/image'" referrerpolicy="no-referrer" alt="" />
          </div>
        </div>

        <div class="clock-row">
          <div class="clock-bar">
            <div class="clock-fill" [style.width.%]="(matchMinute / 90) * 100"></div>
          </div>
          <span class="clock-label">
            @if (matchEnded) { FT }
            @else if (showHT) { HT }
            @else { {{ matchMinute }}' }
          </span>
        </div>

        @if (goalCard) {
          <div class="goal-overlay" [class.goal-exit]="goalCardExiting">
            <div class="goal-card">
              <img class="goal-player-img"
                [src]="'https://img.sofascore.com/api/v1/player/' + getGoalScorerPlayerId(goalCard.player) + '/image'"
                referrerpolicy="no-referrer" alt="" />
              <span class="goal-text">GOAL!</span>
              <span class="goal-scorer">{{ goalCard.player }}</span>
              <span class="goal-meta">{{ goalCard.team }} &middot; {{ goalCard.minute }}'</span>
            </div>
          </div>
        }

        @if (showHT && !matchEnded) {
          <div class="ht-overlay">
            <div class="ht-card">HALF TIME</div>
          </div>
        }

        @if (showFT) {
          <div class="ft-overlay">
            <div class="ft-card">FULL TIME</div>
          </div>
        }

        <div class="live-timeline" #timelineEl>
          @for (event of visibleEvents; track $index) {
            <div class="ev" [class]="'ev-' + event.type">
              <span class="ev-min">{{ event.minute }}'</span>
              <div class="ev-dot"></div>
              <div class="ev-body">
                <span class="ev-team" [class.home-label]="event.team === result.homeTeam.name" [class.away-label]="event.team !== result.homeTeam.name">{{ event.team }}</span>
                <span class="ev-icon">{{ getEventIcon(event.type) }}</span>
                <span class="ev-player">{{ event.player }}</span>
                @if (event.description) { <div class="ev-desc">{{ event.description }}</div> }
              </div>
            </div>
          }
          @if (visibleEvents.length === 0 && !matchEnded) {
            <div class="ev-empty">Kick off...</div>
          }
        </div>

        @if (!matchEnded) {
          <button class="skip-btn" (click)="skipToEnd()">Skip to Full Time &rarr;</button>
        }

        @if (matchEnded) {
          <div class="post-match">
            @if (result.potm) {
              <div class="potm-card">
                <div class="potm-badge">PLAYER OF THE MATCH</div>
                <div class="potm-body">
                  <img class="potm-img"
                    [src]="'https://img.sofascore.com/api/v1/player/' + result.potm.player_id + '/image'"
                    referrerpolicy="no-referrer"
                    (error)="potmImgFailed = true"
                    [style.display]="potmImgFailed ? 'none' : 'block'"
                    alt="" />
                  @if (potmImgFailed) {
                    <div class="potm-initials">{{ getPotmInitials() }}</div>
                  }
                  <div class="potm-info">
                    <span class="potm-name">{{ result.potm.player }}</span>
                    <span class="potm-team">{{ result.potm.team }}</span>
                    <div class="potm-stats">
                      @if (result.potm.goals) { <span class="potm-stat"><span class="stat-label">G</span>{{ result.potm.goals }}</span> }
                      @if (result.potm.assists) { <span class="potm-stat"><span class="stat-label">A</span>{{ result.potm.assists }}</span> }
                      @if (result.potm.chances) { <span class="potm-stat"><span class="stat-label">CC</span>{{ result.potm.chances }}</span> }
                      @if (result.potm.saves) { <span class="potm-stat"><span class="stat-label">S</span>{{ result.potm.saves }}</span> }
                    </div>
                  </div>
                  <span class="potm-rating">{{ result.potm.rating }}</span>
                </div>
              </div>
            }
            <div class="pm-grid">
              <div class="pm-card">
                <h3 class="pm-title">Match Statistics</h3>
                <div class="stats-list">
                  <app-stat-bar [homeStat]="result.stats.possession.home" [awayStat]="result.stats.possession.away" label="Possession %" />
                  <app-stat-bar [homeStat]="result.stats.shots.home" [awayStat]="result.stats.shots.away" label="Shots" />
                  <app-stat-bar [homeStat]="result.stats.shotsOnTarget.home" [awayStat]="result.stats.shotsOnTarget.away" label="On Target" />
                  <app-stat-bar [homeStat]="result.stats.passes.home" [awayStat]="result.stats.passes.away" label="Passes" />
                  <app-stat-bar [homeStat]="result.stats.fouls.home" [awayStat]="result.stats.fouls.away" label="Fouls" />
                  <app-stat-bar [homeStat]="result.stats.corners.home" [awayStat]="result.stats.corners.away" label="Corners" />
                </div>
              </div>

              <div class="pm-card">
                <h3 class="pm-title">Lineups</h3>
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
        }
      </div>
    } @else {
      <div class="match-page empty-page">
        <p>No simulation data. Start a new match.</p>
        <a routerLink="/" class="btn btn-primary" style="margin-top:1rem;">Go Home</a>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }
    .match-page {
      display: flex; flex-direction: column; gap: 1.25rem;
      max-width: 900px; margin: 0 auto; padding: 1.5rem 1.5rem 3rem;
    }
    .empty-page { justify-content: center; align-items: center; text-align: center; color: var(--text-muted); }

    .scoreboard {
      display: flex; align-items: center; justify-content: center; gap: 1.5rem;
      background: rgba(245,240,225,0.85); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1.25rem 2rem;
      backdrop-filter: blur(12px); flex-shrink: 0;
    }
    .sb-side { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .sb-crest { width: 36px; height: 36px; object-fit: contain; }
    .sb-col { display: flex; flex-direction: column; gap: 0.2rem; }
    .away-col { align-items: flex-end; }
    .sb-team { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; }
    .sb-scorers { display: flex; flex-wrap: wrap; gap: 0.15rem 0.5rem; }
    .sb-scorer { font-size: 0.65rem; color: var(--text-secondary); white-space: nowrap; }
    .sb-score { display: flex; align-items: center; gap: 0.5rem; }
    .sb-goals { font-family: 'Bebas Neue', var(--font-heading), sans-serif; font-size: 3.5rem; font-weight: 400; line-height: 1; }
    .sb-dash { font-size: 1.5rem; color: var(--text-muted); }
    .home-label { color: var(--accent); }
    .away-label { color: var(--accent-blue); }

    .clock-row {
      display: flex; align-items: center; gap: 0.75rem;
      margin-top: 0.5rem; flex-shrink: 0;
    }
    .clock-bar {
      flex: 1; height: 6px; background: rgba(26,60,42,0.1);
      border-radius: 3px; overflow: hidden;
    }
    .clock-fill {
      height: 100%; background: var(--accent);
      border-radius: 3px; transition: width 0.4s linear;
    }
    .clock-label {
      font-family: 'Bebas Neue', var(--font-heading), sans-serif;
      font-size: 1.1rem; color: var(--text-secondary);
      min-width: 36px; text-align: right; letter-spacing: 0.05em;
    }

    .goal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.75);
      animation: fadeIn 0.2s ease;
    }
    .goal-overlay.goal-exit { animation: fadeOut 0.4s ease forwards; }
    .goal-card {
      background: linear-gradient(135deg, #1a3c2a 0%, #1a5c36 100%);
      border: 2px solid var(--accent);
      border-radius: 16px; padding: 2.5rem 4rem;
      text-align: center; display: flex; flex-direction: column; gap: 0.4rem;
      animation: goalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 0 80px rgba(26,138,90,0.25);
    }
    .goal-player-img {
      width: 80px; height: 80px; border-radius: 50%; object-fit: cover;
      border: 3px solid var(--accent); box-shadow: 0 0 20px rgba(26,138,90,0.4);
    }
    .goal-text {
      font-family: 'Bebas Neue', sans-serif; font-size: 4.5rem;
      color: #f5f0e1; letter-spacing: 0.15em; line-height: 1;
    }
    .goal-scorer {
      font-family: var(--font-heading); font-size: 1.6rem;
      font-weight: 700; color: var(--accent); margin-top: 0.25rem;
    }
    .goal-meta { font-size: 0.95rem; color: rgba(245,240,225,0.7); }

    @keyframes goalPop {
      from { transform: scale(0.4); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

    .ht-overlay, .ft-overlay {
      position: fixed; inset: 0; z-index: 900;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.6);
      animation: fadeIn 0.3s ease;
    }
    .ht-card, .ft-card {
      font-family: 'Bebas Neue', sans-serif; font-size: 4rem;
      color: #f5f0e1; letter-spacing: 0.2em;
      text-shadow: 0 2px 20px rgba(0,0,0,0.5);
    }

    .live-timeline {
      flex: 1; overflow-y: auto; min-height: 0;
      margin-top: 0.75rem;
      display: flex; flex-direction: column; gap: 0;
      background: rgba(245,240,225,0.85); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 0.5rem;
      backdrop-filter: blur(12px);
    }
    .ev {
      display: flex; align-items: flex-start; gap: 0.5rem;
      padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
      animation: evSlide 0.35s ease;
    }
    .ev-goal {
      background: rgba(26,138,90,0.08);
      border-left: 3px solid var(--accent);
    }
    .ev-card { border-left: 3px solid #eab308; }
    .ev-min {
      font-family: 'Bebas Neue', var(--font-heading), sans-serif;
      font-size: 0.9rem; color: var(--text-muted);
      min-width: 32px; text-align: right;
    }
    .ev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
    .ev-goal .ev-dot { background: var(--accent); box-shadow: 0 0 6px rgba(26,138,90,0.4); }
    .ev-card .ev-dot { background: #eab308; }
    .ev-chance .ev-dot { background: var(--accent-blue); }
    .ev-save .ev-dot { background: #a855f7; }
    .ev-tackle .ev-dot { background: var(--text-muted); }
    .ev-body { display: flex; flex-wrap: wrap; gap: 0.25rem; font-size: 0.8rem; }
    .ev-icon { font-weight: 700; font-size: 0.7rem; }
    .ev-player { font-weight: 600; }
    .ev-desc { width: 100%; color: var(--text-secondary); font-size: 0.78rem; margin-top: 0.15rem; }
    .ev-empty { padding: 2rem; text-align: center; color: var(--text-muted); font-style: italic; }

    @keyframes evSlide {
      from { opacity: 0; transform: translateX(-12px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .skip-btn {
      margin-top: 0.5rem; align-self: center;
      padding: 0.5rem 1.5rem; border-radius: var(--radius-pill);
      background: transparent; border: 1px solid var(--border-color);
      color: var(--text-secondary); font-family: var(--font-heading);
      font-size: 0.8rem; font-weight: 600; letter-spacing: 0.03em;
      cursor: pointer; transition: all var(--transition); flex-shrink: 0;
    }
    .skip-btn:hover { border-color: var(--accent); color: var(--accent); }

    .potm-card {
      background: linear-gradient(135deg, rgba(245,240,225,0.9), rgba(245,240,225,0.85));
      border: 1px solid rgba(251,191,36,0.4); border-radius: var(--radius-md);
      padding: 0.75rem 1rem; text-align: center;
      animation: fadeIn 0.5s ease;
    }
    .potm-badge {
      font-family: var(--font-heading); font-size: 0.65rem; font-weight: 700;
      color: #fbbf24; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 0.5rem;
    }
    .potm-body { display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
    .potm-img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #fbbf24; }
    .potm-initials {
      width: 56px; height: 56px; border-radius: 50%; border: 2px solid #fbbf24;
      display: flex; align-items: center; justify-content: center;
      background: rgba(251,191,36,0.12); color: #fbbf24; font-weight: 700; font-size: 1rem;
    }
    .potm-info { display: flex; flex-direction: column; align-items: flex-start; }
    .potm-name { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; }
    .potm-team { font-size: 0.75rem; color: var(--text-muted); }
    .potm-stats { display: flex; gap: 0.6rem; margin-top: 0.25rem; }
    .potm-stat { font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 0.15rem; }
    .stat-label {
      font-size: 0.6rem; font-weight: 700; color: #fbbf24;
      background: rgba(251,191,36,0.15); padding: 0.1rem 0.3rem;
      border-radius: 3px; letter-spacing: 0.05em;
    }
    .potm-rating {
      font-family: 'Bebas Neue', var(--font-heading), sans-serif; font-size: 2rem;
      color: #fbbf24; line-height: 1;
    }
    .post-match {
      display: flex; flex-direction: column; gap: 1.25rem;
      animation: fadeIn 0.5s ease;
    }
    .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .pm-card {
      background: rgba(245,240,225,0.85); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 1.5rem;
      backdrop-filter: blur(12px);
    }
    .pm-title {
      font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 0.75rem; text-align: center;
    }
    .stats-list { display: flex; flex-direction: column; gap: 1rem; }
    .lineups-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .lineup-half { display: flex; flex-direction: column; gap: 0.3rem; }
    .lineup-label { font-family: var(--font-heading); font-size: 0.75rem; font-weight: 700; text-align: center; }
    .actions {
      display: flex; justify-content: center; gap: 0.75rem;
      align-items: center; padding: 0.5rem 0; flex-shrink: 0;
    }
    .saved-msg { color: var(--accent-green); font-weight: 600; font-size: 0.85rem; }

    @media (max-width: 768px) {
      .pm-grid { grid-template-columns: 1fr; }
      .scoreboard { flex-direction: column; gap: 0.5rem; padding: 1rem; }
      .sb-goals { font-size: 2.5rem; }
      .goal-card { padding: 2rem 2.5rem; }
      .goal-text { font-size: 3rem; }
    }
  `],
})
export class SimulationComponent implements OnInit, OnDestroy {
  result: SimulationResult | null = null;
  matchMinute = 0;
  showHT = false;
  showFT = false;
  matchEnded = false;
  goalCard: MatchEvent | null = null;
  goalCardExiting = false;
  visibleEvents: MatchEvent[] = [];
  homeGoalsShown = 0;
  awayGoalsShown = 0;
  saving = false;
  saved = false;
  potmImgFailed = false;

  @ViewChild('timelineEl') timelineEl!: ElementRef;

  private timerInterval: any = null;
  private paused = false;
  private goalQueue: MatchEvent[] = [];
  private pendingHT = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private historyService: HistoryService
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state?.result) this.result = state.result;
  }

  ngOnInit(): void {
    if (!this.result) return;
    setTimeout(() => this.startMatch(), 800);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private startMatch(): void {
    this.timerInterval = setInterval(() => this.tick(), 500);
  }

  private tick(): void {
    if (this.paused) return;
    this.matchMinute++;

    const events = this.result!.timeline.filter(e => e.minute === this.matchMinute);
    const goals = events.filter(e => e.type === 'goal');
    const others = events.filter(e => e.type !== 'goal');

    for (const e of others) this.visibleEvents.push(e);

    if (goals.length > 0) {
      this.goalQueue.push(...goals);
      if (this.matchMinute === 45) this.pendingHT = true;
      this.processGoalQueue();
    } else if (this.matchMinute === 45) {
      this.doHalfTime();
    }

    if (this.matchMinute >= 90) this.doFullTime();

    this.scrollTimeline();
  }

  private processGoalQueue(): void {
    if (this.goalQueue.length === 0) {
      if (this.pendingHT) {
        this.pendingHT = false;
        this.doHalfTime();
      } else {
        this.paused = false;
      }
      return;
    }

    this.paused = true;
    const goal = this.goalQueue.shift()!;

    if (goal.team === this.result!.result.homeTeamName) this.homeGoalsShown++;
    else this.awayGoalsShown++;

    this.visibleEvents.push(goal);
    this.goalCard = goal;
    this.goalCardExiting = false;
    this.scrollTimeline();

    setTimeout(() => {
      this.goalCardExiting = true;
      setTimeout(() => {
        this.goalCard = null;
        this.goalCardExiting = false;
        this.processGoalQueue();
      }, 400);
    }, 2500);
  }

  private doHalfTime(): void {
    this.paused = true;
    this.showHT = true;
    setTimeout(() => {
      this.showHT = false;
      this.paused = false;
    }, 2000);
  }

  private doFullTime(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.matchMinute = 90;

    this.showFT = true;
    setTimeout(() => {
      this.showFT = false;
      this.matchEnded = true;
    }, 2000);
  }

  skipToEnd(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.paused = false;
    this.goalCard = null;
    this.goalCardExiting = false;
    this.goalQueue = [];
    this.showHT = false;
    this.showFT = false;
    this.matchMinute = 90;
    this.visibleEvents = [...this.result!.timeline];
    this.homeGoalsShown = this.result!.result.homeGoals;
    this.awayGoalsShown = this.result!.result.awayGoals;
    this.matchEnded = true;
  }

  private scrollTimeline(): void {
    setTimeout(() => {
      const el = this.timelineEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  get homeScorers(): { player: string; minute: number }[] {
    if (!this.result) return [];
    return this.result.timeline
      .filter(e => e.type === 'goal' && e.team === this.result!.result.homeTeamName)
      .sort((a, b) => a.minute - b.minute);
  }

  get awayScorers(): { player: string; minute: number }[] {
    if (!this.result) return [];
    return this.result.timeline
      .filter(e => e.type === 'goal' && e.team === this.result!.result.awayTeamName)
      .sort((a, b) => a.minute - b.minute);
  }

  getGoalScorerPlayerId(name: string): number {
    if (!this.result) return 0;
    const all = [...(this.result.homeTeam.players || []), ...(this.result.awayTeam.players || [])];
    const p = all.find(pl => pl?.player === name);
    return p?.player_id || 0;
  }

  getPotmInitials(): string {
    const parts = (this.result?.potm?.player || '').trim().split(/\s+/);
    const f = parts[0]?.[0] || '';
    const l = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
    return (f + l).toUpperCase();
  }

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
