import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { SelectedPlayer, LineupData } from '../../models/simulation.model';
import { FormationGridComponent } from '../../components/formation-grid/formation-grid.component';
import { PlayerCardComponent } from '../../components/player-card/player-card.component';

@Component({
  selector: 'app-dream-xi',
  standalone: true,
  imports: [CommonModule, FormsModule, FormationGridComponent, PlayerCardComponent],
  template: `
    <div class="dream-page">
      <h1 class="page-title">Dream XI Builder</h1>
      <p class="page-sub">Mix stars from the Premier League, La Liga, PSG, and Bayern Munich.</p>

      <div class="dream-layout">
        <!-- Home XI -->
        <div class="xi-section">
          <h2 class="xi-title home-label">Home XI</h2>
          <div class="formation-select">
            <select [(ngModel)]="homeFormation" (ngModelChange)="homePlayers = []">
              @for (f of formations; track f) {
                <option [value]="f">{{ f }}</option>
              }
            </select>
          </div>
          <app-formation-grid
            [formation]="homeFormation"
            [players]="homePlayers"
            [editable]="true"
            [selectedSlotIndex]="activeSide === 'home' ? activeSlotIndex : -1"
            (slotSelected)="onSlotSelected('home', $event)"
          />
          <div class="lineup-count">{{ homePlayers.length }} / 11</div>
          <input
            type="text"
            placeholder="Home XI team name"
            [(ngModel)]="homeTeamName"
            class="team-name-input"
          />
        </div>

        <!-- Player Pool (center) -->
        <div class="pool-section">
          <h3 class="pool-title">Player Pool</h3>

          <div class="pool-filters">
            <input
              type="text"
              placeholder="Search players..."
              [(ngModel)]="searchQuery"
              (input)="searchPlayers()"
            />
            <select [(ngModel)]="filterLeague" (ngModelChange)="searchPlayers()">
              <option value="">All Leagues</option>
              <option value="Premier League">Premier League</option>
              <option value="La Liga">La Liga</option>
            </select>
            <select [(ngModel)]="filterPosition" (ngModelChange)="searchPlayers()">
              <option value="">All Positions</option>
              <option value="Goalkeeper">GK</option>
              <option value="Defender">DEF</option>
              <option value="Midfielder">MID</option>
              <option value="Forward">FWD</option>
            </select>
          </div>

          <div class="side-toggle">
            <button
              class="toggle-btn"
              [class.active]="activeSide === 'home'"
              (click)="activeSide = 'home'; activeSlotIndex = -1"
            >
              Add to Home
            </button>
            <button
              class="toggle-btn"
              [class.active]="activeSide === 'away'"
              (click)="activeSide = 'away'; activeSlotIndex = -1"
            >
              Add to Away
            </button>
          </div>

          @if (loading) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="player-pool-list">
              @for (player of poolPlayers; track player.player_id) {
                <app-player-card
                  [player]="player"
                  [clickable]="!isPlayerUsed(player)"
                  [selected]="isPlayerUsed(player)"
                  [showStats]="true"
                  (selectPlayer)="onPlayerSelected($event)"
                />
              }
              @if (poolPlayers.length === 0) {
                <p class="empty">No players found</p>
              }
            </div>

            @if (totalPages > 1) {
              <div class="pagination">
                <button class="btn btn-outline" [disabled]="currentPage <= 1" (click)="changePage(-1)">Prev</button>
                <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
                <button class="btn btn-outline" [disabled]="currentPage >= totalPages" (click)="changePage(1)">Next</button>
              </div>
            }
          }
        </div>

        <!-- Away XI -->
        <div class="xi-section">
          <h2 class="xi-title away-label">Away XI</h2>
          <div class="formation-select">
            <select [(ngModel)]="awayFormation" (ngModelChange)="awayPlayers = []">
              @for (f of formations; track f) {
                <option [value]="f">{{ f }}</option>
              }
            </select>
          </div>
          <app-formation-grid
            [formation]="awayFormation"
            [players]="awayPlayers"
            [editable]="true"
            [selectedSlotIndex]="activeSide === 'away' ? activeSlotIndex : -1"
            (slotSelected)="onSlotSelected('away', $event)"
          />
          <div class="lineup-count">{{ awayPlayers.length }} / 11</div>
          <input
            type="text"
            placeholder="Away XI team name"
            [(ngModel)]="awayTeamName"
            class="team-name-input"
          />
        </div>
      </div>

      @if (canSimulate) {
        <div class="simulate-bar">
          <button class="btn btn-primary btn-lg" (click)="simulate()" [disabled]="simulating">
            @if (simulating) {
              <span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>
              Simulating...
            } @else {
              Simulate Match
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dream-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
    }

    .page-sub {
      text-align: center;
      color: var(--text-secondary);
      margin-top: 0.5rem;
      margin-bottom: 2rem;
    }

    .dream-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    .xi-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .xi-title {
      font-size: 1.1rem;
      font-weight: 700;
      text-align: center;
    }

    .home-label { color: var(--accent-green); }
    .away-label { color: var(--accent-blue); }

    .formation-select select {
      width: 100%;
    }

    .lineup-count {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .team-name-input {
      width: 100%;
      text-align: center;
    }

    .pool-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pool-title {
      font-size: 1rem;
      font-weight: 700;
      text-align: center;
      color: var(--text-secondary);
    }

    .pool-filters {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .side-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--bg-input);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-weight: 600;
      font-size: 0.8rem;
    }

    .toggle-btn.active {
      background: rgba(34, 197, 94, 0.1);
      color: var(--accent-green);
      border-color: var(--accent-green);
    }

    .player-pool-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 500px;
      overflow-y: auto;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    .page-info {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .empty {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem;
    }

    .simulate-bar {
      margin-top: 2rem;
      text-align: center;
    }

    .btn-lg {
      padding: 0.85rem 3rem;
      font-size: 1.05rem;
    }

    @media (max-width: 900px) {
      .dream-layout {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DreamXiComponent implements OnInit {
  formations = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1', '3-4-3', '5-4-1', '4-1-4-1', '4-5-1'];

  homeFormation = '4-3-3';
  awayFormation = '4-3-3';
  homePlayers: SelectedPlayer[] = [];
  awayPlayers: SelectedPlayer[] = [];
  homeTeamName = 'Home XI';
  awayTeamName = 'Away XI';

  activeSide: 'home' | 'away' = 'home';
  activeSlotIndex = -1;

  poolPlayers: Player[] = [];
  loading = false;
  searchQuery = '';
  filterLeague = '';
  filterPosition = '';
  currentPage = 1;
  totalPages = 1;
  simulating = false;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchPlayers();
  }

  searchPlayers(): void {
    this.currentPage = 1;
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.loading = true;
    this.api
      .getPlayers({
        dreamxi: true,
        search: this.searchQuery || undefined,
        league: this.filterLeague || undefined,
        position: this.filterPosition || undefined,
        page: this.currentPage,
        limit: 20,
      })
      .subscribe({
        next: (res) => {
          this.poolPlayers = res.players;
          this.totalPages = res.pages;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  changePage(delta: number): void {
    this.currentPage += delta;
    this.loadPlayers();
  }

  get canSimulate(): boolean {
    return this.homePlayers.length === 11 && this.awayPlayers.length === 11;
  }

  isPlayerUsed(player: Player): boolean {
    return (
      this.homePlayers.some((p) => p.player_id === player.player_id) ||
      this.awayPlayers.some((p) => p.player_id === player.player_id)
    );
  }

  onSlotSelected(side: 'home' | 'away', index: number): void {
    this.activeSide = side;
    this.activeSlotIndex = this.activeSlotIndex === index && this.activeSide === side ? -1 : index;
  }

  onPlayerSelected(player: Player): void {
    if (this.isPlayerUsed(player)) return;

    const players = this.activeSide === 'home' ? this.homePlayers : this.awayPlayers;
    if (players.length >= 11 && this.activeSlotIndex < 0) return;

    const selected: SelectedPlayer = {
      player_id: player.player_id,
      player: player.player,
      position: player.position,
      detailed_position: player.detailed_position,
    };

    if (this.activeSlotIndex >= 0 && this.activeSlotIndex < 11) {
      players[this.activeSlotIndex] = selected;
      this.activeSlotIndex = -1;
    } else {
      players.push(selected);
    }
  }

  simulate(): void {
    if (!this.canSimulate) return;

    this.simulating = true;
    const homeLineup: LineupData = {
      name: this.homeTeamName,
      formation: this.homeFormation,
      players: this.homePlayers,
    };
    const awayLineup: LineupData = {
      name: this.awayTeamName,
      formation: this.awayFormation,
      players: this.awayPlayers,
    };

    this.api.simulate(homeLineup, awayLineup).subscribe({
      next: (result) => {
        this.simulating = false;
        this.router.navigate(['/simulation'], { state: { result } });
      },
      error: () => {
        this.simulating = false;
      },
    });
  }
}
