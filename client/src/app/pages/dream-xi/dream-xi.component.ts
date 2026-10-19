import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { SelectedPlayer, LineupData, MatchSetup } from '../../models/simulation.model';
import { FormationGridComponent } from '../../components/formation-grid/formation-grid.component';
import { PlayerCardComponent } from '../../components/player-card/player-card.component';

@Component({
  selector: 'app-dream-xi',
  standalone: true,
  imports: [CommonModule, FormsModule, FormationGridComponent, PlayerCardComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Dream XI Builder</h1>
      </div>

      <div class="dream-layout">
        <div class="xi-section">
          <h2 class="xi-title home-label">Home XI</h2>
          <div class="formation-row">
            <select [(ngModel)]="homeFormation" (ngModelChange)="resetSide('home')">
              @for (f of formations; track f) { <option [value]="f">{{ f }}</option> }
            </select>
            <span class="count">{{ homeFilledCount }}/11</span>
          </div>
          <div class="pitch-wrap">
            <app-formation-grid
              [formation]="homeFormation" [players]="homePlayers" [editable]="true"
              [selectedSlotIndex]="activeSide === 'home' ? activeSlotIndex : -1"
              (slotSelected)="onSlotSelected('home', $event)"
              (slotRemoved)="onSlotRemoved('home', $event)"
            />
          </div>
          <input type="text" placeholder="Home XI name" [(ngModel)]="homeTeamName" class="name-input" />
        </div>

        <div class="pool-section">
          <div class="pool-filters">
            <input type="text" placeholder="Search players..." [(ngModel)]="searchQuery" (input)="searchPlayers()" />
            <div class="filter-row">
              <select [(ngModel)]="filterLeague" (ngModelChange)="searchPlayers()">
                <option value="">All Leagues</option>
                <option value="Premier League">PL</option>
                <option value="La Liga">La Liga</option>
              </select>
              <select [(ngModel)]="filterPosition" (ngModelChange)="searchPlayers()">
                <option value="">All Pos</option>
                <option value="Goalkeeper">GK</option>
                <option value="Defender">DEF</option>
                <option value="Midfielder">MID</option>
                <option value="Forward">FWD</option>
              </select>
            </div>
          </div>

          <div class="side-toggle">
            <button class="toggle-btn" [class.active]="activeSide === 'home'" (click)="activeSide = 'home'; activeSlotIndex = -1">
              + Home
            </button>
            <button class="toggle-btn away" [class.active]="activeSide === 'away'" (click)="activeSide = 'away'; activeSlotIndex = -1">
              + Away
            </button>
          </div>

          @if (loading) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="player-pool-list">
              @for (player of poolPlayers; track player.player_id) {
                <app-player-card
                  [player]="player" [clickable]="true"
                  [selected]="isPlayerUsed(player)" [showStats]="false"
                  (selectPlayer)="onPlayerSelected($event)"
                />
              }
              @if (poolPlayers.length === 0) { <p class="empty">No players found</p> }
            </div>
            @if (totalPages > 1) {
              <div class="pagination">
                <button class="btn btn-outline btn-xs" [disabled]="currentPage <= 1" (click)="changePage(-1)">Prev</button>
                <span class="page-info">{{ currentPage }}/{{ totalPages }}</span>
                <button class="btn btn-outline btn-xs" [disabled]="currentPage >= totalPages" (click)="changePage(1)">Next</button>
              </div>
            }
          }
        </div>

        <div class="xi-section">
          <h2 class="xi-title away-label">Away XI</h2>
          <div class="formation-row">
            <select [(ngModel)]="awayFormation" (ngModelChange)="resetSide('away')">
              @for (f of formations; track f) { <option [value]="f">{{ f }}</option> }
            </select>
            <span class="count">{{ awayFilledCount }}/11</span>
          </div>
          <div class="pitch-wrap">
            <app-formation-grid
              [formation]="awayFormation" [players]="awayPlayers" [editable]="true"
              [selectedSlotIndex]="activeSide === 'away' ? activeSlotIndex : -1"
              (slotSelected)="onSlotSelected('away', $event)"
              (slotRemoved)="onSlotRemoved('away', $event)"
            />
          </div>
          <input type="text" placeholder="Away XI name" [(ngModel)]="awayTeamName" class="name-input" />
        </div>
      </div>

      @if (canSimulate) {
        <div class="simulate-bar">
          <button class="btn btn-primary btn-lg" (click)="simulate()" [disabled]="simulating">
            @if (simulating) {
              <span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Simulating...
            } @else { Simulate Match }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { height: 100%; display: flex; flex-direction: column; max-width: 1400px; margin: 0 auto; padding: 0.5rem 1rem; }
    .page-header { text-align: center; margin-bottom: 0.5rem; }
    .page-title { font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700; }
    .dream-layout { flex: 1; display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 0.75rem; min-height: 0; }
    .xi-section { display: flex; flex-direction: column; gap: 0.4rem; min-height: 0; }
    .xi-title { font-family: var(--font-heading); font-size: 0.9rem; font-weight: 700; text-align: center; }
    .home-label { color: var(--accent); }
    .away-label { color: var(--accent-blue); }
    .formation-row { display: flex; align-items: center; gap: 0.5rem; }
    .formation-row select { flex: 1; font-size: 0.8rem; padding: 0.35rem 0.5rem; }
    .count { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .pitch-wrap { flex: 1; min-height: 0; overflow: hidden; }
    .name-input { width: 100%; text-align: center; font-size: 0.8rem; padding: 0.35rem; }
    .pool-section {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 0.75rem;
      display: flex; flex-direction: column; gap: 0.5rem; min-height: 0;
      backdrop-filter: blur(12px);
    }
    .pool-filters { display: flex; flex-direction: column; gap: 0.35rem; }
    .pool-filters input, .pool-filters select { font-size: 0.8rem; padding: 0.35rem 0.5rem; }
    .filter-row { display: flex; gap: 0.35rem; }
    .filter-row select { flex: 1; }
    .side-toggle { display: flex; gap: 0.35rem; }
    .toggle-btn {
      flex: 1; padding: 0.35rem; border-radius: var(--radius-sm);
      background: var(--bg-secondary); color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-family: var(--font-heading); font-weight: 600; font-size: 0.75rem;
    }
    .toggle-btn.active { background: rgba(26,138,90,0.12); color: var(--accent); border-color: var(--accent); }
    .toggle-btn.away.active { background: rgba(45,122,106,0.12); color: var(--accent-blue); border-color: var(--accent-blue); }
    .player-pool-list { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; overflow-y: auto; min-height: 0; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .page-info { font-size: 0.75rem; color: var(--text-muted); }
    .btn-xs { padding: 0.25rem 0.6rem; font-size: 0.7rem; }
    .empty { text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.85rem; }
    .simulate-bar { padding: 0.4rem 0; text-align: center; }
    .btn-lg { padding: 0.65rem 2.5rem; font-size: 0.95rem; }
    @media (max-width: 900px) { .dream-layout { grid-template-columns: 1fr; } }
  `],
})
export class DreamXiComponent implements OnInit {
  formations = ['4-3-3','4-4-2','3-5-2','5-3-2','4-2-3-1','3-4-3','5-4-1','4-1-4-1','4-5-1'];
  homeFormation = '4-3-3';
  awayFormation = '4-3-3';
  homePlayers: (SelectedPlayer | null)[] = new Array(11).fill(null);
  awayPlayers: (SelectedPlayer | null)[] = new Array(11).fill(null);
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

  constructor(private api: ApiService, private router: Router) {}
  ngOnInit(): void { this.searchPlayers(); }

  get homeFilledCount(): number { return this.homePlayers.filter(p => p !== null).length; }
  get awayFilledCount(): number { return this.awayPlayers.filter(p => p !== null).length; }
  get canSimulate(): boolean { return this.homePlayers.every(p => p !== null) && this.awayPlayers.every(p => p !== null); }

  searchPlayers(): void { this.currentPage = 1; this.loadPlayers(); }

  loadPlayers(): void {
    this.loading = true;
    this.api.getPlayers({
      dreamxi: true, search: this.searchQuery || undefined,
      league: this.filterLeague || undefined, position: this.filterPosition || undefined,
      page: this.currentPage, limit: 20,
    }).subscribe({
      next: (res) => { this.poolPlayers = res.players; this.totalPages = res.pages; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  changePage(delta: number): void { this.currentPage += delta; this.loadPlayers(); }

  resetSide(side: 'home' | 'away'): void {
    if (side === 'home') this.homePlayers = new Array(11).fill(null);
    else this.awayPlayers = new Array(11).fill(null);
    this.activeSlotIndex = 0;
    this.activeSide = side;
  }

  isPlayerUsed(player: Player): boolean {
    return this.homePlayers.some(p => p?.player_id === player.player_id) ||
           this.awayPlayers.some(p => p?.player_id === player.player_id);
  }

  onSlotSelected(side: 'home' | 'away', index: number): void {
    if (this.activeSide === side && this.activeSlotIndex >= 0 && this.activeSlotIndex !== index) {
      const players = side === 'home' ? this.homePlayers : this.awayPlayers;
      const temp = players[this.activeSlotIndex];
      players[this.activeSlotIndex] = players[index];
      players[index] = temp;
      this.replaceArray(side);
      this.activeSlotIndex = -1;
      return;
    }
    this.activeSide = side;
    this.activeSlotIndex = (this.activeSlotIndex === index) ? -1 : index;
  }

  onSlotRemoved(side: 'home' | 'away', index: number): void {
    if (side === 'home') {
      this.homePlayers[index] = null;
      this.homePlayers = [...this.homePlayers];
    } else {
      this.awayPlayers[index] = null;
      this.awayPlayers = [...this.awayPlayers];
    }
    this.activeSide = side;
    this.activeSlotIndex = index;
  }

  onPlayerSelected(player: Player): void {
    const homeIdx = this.homePlayers.findIndex(p => p?.player_id === player.player_id);
    if (homeIdx !== -1) { this.homePlayers[homeIdx] = null; this.replaceArray('home'); this.activeSide = 'home'; this.activeSlotIndex = homeIdx; return; }
    const awayIdx = this.awayPlayers.findIndex(p => p?.player_id === player.player_id);
    if (awayIdx !== -1) { this.awayPlayers[awayIdx] = null; this.replaceArray('away'); this.activeSide = 'away'; this.activeSlotIndex = awayIdx; return; }

    const players = this.activeSide === 'home' ? this.homePlayers : this.awayPlayers;
    let targetSlot: number;
    if (this.activeSlotIndex >= 0 && this.activeSlotIndex < 11) {
      targetSlot = this.activeSlotIndex;
      if (players[targetSlot] !== null) players[targetSlot] = null;
    } else {
      targetSlot = players.findIndex(p => p === null);
      if (targetSlot === -1) return;
    }

    players[targetSlot] = {
      player_id: player.player_id, player: player.player,
      position: player.position, detailed_position: player.detailed_position,
    };

    this.replaceArray(this.activeSide);
    const nextEmpty = players.findIndex((p, i) => i > targetSlot && p === null);
    this.activeSlotIndex = nextEmpty >= 0 ? nextEmpty : players.findIndex(p => p === null) ?? -1;
  }

  private replaceArray(side: 'home' | 'away'): void {
    if (side === 'home') this.homePlayers = [...this.homePlayers];
    else this.awayPlayers = [...this.awayPlayers];
  }

  simulate(): void {
    if (!this.canSimulate) return;
    this.simulating = true;
    const homeLineup: LineupData = { name: this.homeTeamName, formation: this.homeFormation, players: this.homePlayers };
    const awayLineup: LineupData = { name: this.awayTeamName, formation: this.awayFormation, players: this.awayPlayers };
    this.api.simulate(homeLineup, awayLineup).subscribe({
      next: (teams) => {
        const setup: MatchSetup = { ...teams, mode: 'dream' };
        this.simulating = false;
        this.router.navigate(['/simulation'], { state: { setup } });
      },
      error: () => { this.simulating = false; },
    });
  }
}
