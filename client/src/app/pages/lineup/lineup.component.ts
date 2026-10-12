import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Player } from '../../models/player.model';
import { Team } from '../../models/team.model';
import { SelectedPlayer, LineupData } from '../../models/simulation.model';
import { FormationGridComponent } from '../../components/formation-grid/formation-grid.component';
import { PlayerCardComponent } from '../../components/player-card/player-card.component';

@Component({
  selector: 'app-lineup',
  standalone: true,
  imports: [CommonModule, FormsModule, FormationGridComponent, PlayerCardComponent],
  template: `
    <div class="page">
      <div class="page-top">
        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'home'" (click)="switchTab('home')">
            {{ homeTeam?.name || 'Home' }}
          </button>
          <button class="tab" [class.active]="activeTab === 'away'" (click)="switchTab('away')">
            {{ awayTeam?.name || 'Away' }}
          </button>
        </div>
        <div class="lineup-count">{{ filledCount }} / 11 selected</div>
      </div>

      <div class="lineup-layout">
        <div class="pitch-section">
          <div class="formation-select">
            <label>Formation</label>
            <select [ngModel]="activeTab === 'home' ? homeFormation : awayFormation" (ngModelChange)="setFormation($event)">
              @for (f of formations; track f) { <option [value]="f">{{ f }}</option> }
            </select>
          </div>
          <div class="pitch-wrap">
            <app-formation-grid
              [formation]="activeTab === 'home' ? homeFormation : awayFormation"
              [players]="activeTab === 'home' ? homePlayers : awayPlayers"
              [editable]="true"
              [selectedSlotIndex]="activeSlotIndex"
              (slotSelected)="onSlotSelected($event)"
            />
          </div>
        </div>

        <div class="player-section">
          <input type="text" class="search-input" placeholder="Search players..." [(ngModel)]="playerSearch" />
          @if (activeTab === 'home' ? loadingHome : loadingAway) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="player-list">
              @for (player of filteredPlayers; track player.player_id) {
                <app-player-card
                  [player]="player" [clickable]="true"
                  [selected]="isPlayerSelected(player)" [showStats]="true"
                  (selectPlayer)="onPlayerSelected($event)"
                />
              }
              @if (filteredPlayers.length === 0) { <p class="empty">No players available</p> }
            </div>
          }
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
    .page { height: 100%; display: flex; flex-direction: column; max-width: 1200px; margin: 0 auto; padding: 0.75rem 1rem; }
    .page-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .tabs { display: flex; gap: 0.4rem; }
    .tab {
      padding: 0.45rem 1.25rem; border-radius: var(--radius-pill);
      background: var(--bg-card); color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-family: var(--font-heading); font-weight: 600; font-size: 0.8rem;
    }
    .tab.active { background: var(--accent); color: #000; border-color: var(--accent); }
    .lineup-count { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
    .lineup-layout { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; min-height: 0; }
    .pitch-section { display: flex; flex-direction: column; gap: 0.5rem; min-height: 0; }
    .formation-select { display: flex; align-items: center; gap: 0.6rem; }
    .formation-select label { font-weight: 600; font-size: 0.8rem; color: var(--text-secondary); }
    .formation-select select { flex: 1; font-size: 0.8rem; padding: 0.4rem 0.6rem; }
    .pitch-wrap { flex: 1; min-height: 0; overflow: hidden; }
    .player-section { display: flex; flex-direction: column; gap: 0.5rem; min-height: 0; }
    .search-input { width: 100%; font-size: 0.8rem; padding: 0.4rem 0.6rem; }
    .player-list { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; overflow-y: auto; min-height: 0; padding-right: 4px; }
    .empty { text-align: center; color: var(--text-muted); padding: 2rem; }
    .simulate-bar { padding: 0.5rem 0; text-align: center; }
    .btn-lg { padding: 0.7rem 2.5rem; font-size: 0.95rem; }
    @media (max-width: 768px) { .lineup-layout { grid-template-columns: 1fr; } }
  `],
})
export class LineupComponent implements OnInit {
  formations = ['4-3-3','4-4-2','3-5-2','5-3-2','4-2-3-1','3-4-3','5-4-1','4-1-4-1','4-5-1'];
  homeTeam: Team | null = null;
  awayTeam: Team | null = null;
  homeFormation = '4-3-3';
  awayFormation = '4-3-3';
  homePlayers: (SelectedPlayer | null)[] = new Array(11).fill(null);
  awayPlayers: (SelectedPlayer | null)[] = new Array(11).fill(null);
  homeSquad: Player[] = [];
  awaySquad: Player[] = [];
  activeTab: 'home' | 'away' = 'home';
  activeSlotIndex = 0;
  playerSearch = '';
  loadingHome = false;
  loadingAway = false;
  simulating = false;

  constructor(private api: ApiService, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state) { this.homeTeam = state.homeTeam; this.awayTeam = state.awayTeam; }
  }

  ngOnInit(): void {
    if (!this.homeTeam || !this.awayTeam) { this.router.navigate(['/teams']); return; }
    this.loadSquad('home');
    this.loadSquad('away');
  }

  loadSquad(side: 'home' | 'away'): void {
    const team = side === 'home' ? this.homeTeam : this.awayTeam;
    if (!team) return;
    if (side === 'home') this.loadingHome = true; else this.loadingAway = true;
    this.api.getTeam(team.team_id).subscribe({
      next: (res) => {
        if (side === 'home') { this.homeSquad = res.players; this.loadingHome = false; }
        else { this.awaySquad = res.players; this.loadingAway = false; }
      },
      error: () => { if (side === 'home') this.loadingHome = false; else this.loadingAway = false; },
    });
  }

  switchTab(tab: 'home' | 'away'): void {
    this.activeTab = tab;
    this.playerSearch = '';
    const players = tab === 'home' ? this.homePlayers : this.awayPlayers;
    const firstEmpty = players.findIndex(p => p === null);
    this.activeSlotIndex = firstEmpty >= 0 ? firstEmpty : -1;
  }

  get currentPlayers(): (SelectedPlayer | null)[] {
    return this.activeTab === 'home' ? this.homePlayers : this.awayPlayers;
  }

  get filledCount(): number {
    return this.currentPlayers.filter(p => p !== null).length;
  }

  get filteredPlayers(): Player[] {
    let squad = this.activeTab === 'home' ? this.homeSquad : this.awaySquad;
    if (this.playerSearch) {
      const q = this.playerSearch.toLowerCase();
      squad = squad.filter(p => p.player.toLowerCase().includes(q));
    }
    return squad;
  }

  get canSimulate(): boolean {
    return this.homePlayers.every(p => p !== null) && this.awayPlayers.every(p => p !== null);
  }

  setFormation(formation: string): void {
    if (this.activeTab === 'home') { this.homeFormation = formation; this.homePlayers = new Array(11).fill(null); }
    else { this.awayFormation = formation; this.awayPlayers = new Array(11).fill(null); }
    this.activeSlotIndex = 0;
  }

  onSlotSelected(index: number): void {
    this.activeSlotIndex = this.activeSlotIndex === index ? -1 : index;
  }

  isPlayerSelected(player: Player): boolean {
    return this.currentPlayers.some(p => p?.player_id === player.player_id);
  }

  onPlayerSelected(player: Player): void {
    const players = this.activeTab === 'home' ? this.homePlayers : this.awayPlayers;
    const existingIdx = players.findIndex(p => p?.player_id === player.player_id);
    if (existingIdx !== -1) {
      players[existingIdx] = null;
      this.activeSlotIndex = existingIdx;
      return;
    }

    let targetSlot: number;
    if (this.activeSlotIndex >= 0 && this.activeSlotIndex < 11 && players[this.activeSlotIndex] === null) {
      targetSlot = this.activeSlotIndex;
    } else {
      targetSlot = players.findIndex(p => p === null);
      if (targetSlot === -1) return;
    }

    players[targetSlot] = {
      player_id: player.player_id, player: player.player,
      position: player.position, detailed_position: player.detailed_position,
    };

    const nextEmpty = players.findIndex((p, i) => i > targetSlot && p === null);
    this.activeSlotIndex = nextEmpty >= 0 ? nextEmpty : players.findIndex(p => p === null);
    if (this.activeSlotIndex === undefined) this.activeSlotIndex = -1;
  }

  simulate(): void {
    if (!this.canSimulate || !this.homeTeam || !this.awayTeam) return;
    this.simulating = true;
    const homeLineup: LineupData = {
      name: this.homeTeam.name, team_id: this.homeTeam.team_id,
      formation: this.homeFormation,
      players: this.homePlayers.filter((p): p is SelectedPlayer => p !== null),
    };
    const awayLineup: LineupData = {
      name: this.awayTeam.name, team_id: this.awayTeam.team_id,
      formation: this.awayFormation,
      players: this.awayPlayers.filter((p): p is SelectedPlayer => p !== null),
    };
    this.api.simulate(homeLineup, awayLineup).subscribe({
      next: (result) => { this.simulating = false; this.router.navigate(['/simulation'], { state: { result } }); },
      error: () => { this.simulating = false; },
    });
  }
}
