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
    <div class="lineup-page">
      <h1 class="page-title">Build Your Lineups</h1>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'home'" (click)="activeTab = 'home'">
          {{ homeTeam?.name || 'Home' }}
        </button>
        <button class="tab" [class.active]="activeTab === 'away'" (click)="activeTab = 'away'">
          {{ awayTeam?.name || 'Away' }}
        </button>
      </div>

      <div class="lineup-layout">
        <!-- Formation + Pitch -->
        <div class="pitch-section">
          <div class="formation-select">
            <label>Formation</label>
            <select
              [ngModel]="activeTab === 'home' ? homeFormation : awayFormation"
              (ngModelChange)="setFormation($event)"
            >
              @for (f of formations; track f) {
                <option [value]="f">{{ f }}</option>
              }
            </select>
          </div>

          <app-formation-grid
            [formation]="activeTab === 'home' ? homeFormation : awayFormation"
            [players]="activeTab === 'home' ? homePlayers : awayPlayers"
            [editable]="true"
            [selectedSlotIndex]="activeSlotIndex"
            (slotSelected)="onSlotSelected($event)"
          />

          <div class="lineup-count">
            {{ (activeTab === 'home' ? homePlayers : awayPlayers).length }} / 11 selected
          </div>
        </div>

        <!-- Player List -->
        <div class="player-section">
          <input
            type="text"
            class="search-input"
            placeholder="Search players..."
            [(ngModel)]="playerSearch"
          />

          @if (loadingPlayers) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="player-list">
              @for (player of filteredPlayers; track player.player_id) {
                <app-player-card
                  [player]="player"
                  [clickable]="true"
                  [selected]="isPlayerSelected(player)"
                  [showStats]="true"
                  (selectPlayer)="onPlayerSelected($event)"
                />
              }
              @if (filteredPlayers.length === 0) {
                <p class="empty">No players available</p>
              }
            </div>
          }
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
    .lineup-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tab {
      padding: 0.6rem 1.5rem;
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .tab.active {
      background: rgba(34, 197, 94, 0.1);
      color: var(--accent-green);
      border-color: var(--accent-green);
    }

    .lineup-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .pitch-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .formation-select {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .formation-select label {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .formation-select select {
      flex: 1;
    }

    .lineup-count {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .player-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .search-input {
      width: 100%;
    }

    .player-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 600px;
      overflow-y: auto;
      padding-right: 4px;
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

    @media (max-width: 768px) {
      .lineup-layout {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class LineupComponent implements OnInit {
  formations = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1', '3-4-3', '5-4-1', '4-1-4-1', '4-5-1'];

  homeTeam: Team | null = null;
  awayTeam: Team | null = null;

  homeFormation = '4-3-3';
  awayFormation = '4-3-3';

  homePlayers: SelectedPlayer[] = [];
  awayPlayers: SelectedPlayer[] = [];

  homeSquad: Player[] = [];
  awaySquad: Player[] = [];

  activeTab: 'home' | 'away' = 'home';
  activeSlotIndex = -1;
  playerSearch = '';
  loadingPlayers = false;
  simulating = false;

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state) {
      this.homeTeam = state.homeTeam;
      this.awayTeam = state.awayTeam;
    }
  }

  ngOnInit(): void {
    if (!this.homeTeam || !this.awayTeam) {
      this.router.navigate(['/teams']);
      return;
    }
    this.loadSquad('home');
    this.loadSquad('away');
  }

  loadSquad(side: 'home' | 'away'): void {
    const team = side === 'home' ? this.homeTeam : this.awayTeam;
    if (!team) return;

    this.loadingPlayers = true;
    this.api.getTeam(team.team_id).subscribe({
      next: (res) => {
        if (side === 'home') this.homeSquad = res.players;
        else this.awaySquad = res.players;
        this.loadingPlayers = false;
      },
      error: () => {
        this.loadingPlayers = false;
      },
    });
  }

  get currentSquad(): Player[] {
    return this.activeTab === 'home' ? this.homeSquad : this.awaySquad;
  }

  get currentPlayers(): SelectedPlayer[] {
    return this.activeTab === 'home' ? this.homePlayers : this.awayPlayers;
  }

  get filteredPlayers(): Player[] {
    let squad = this.currentSquad;
    if (this.playerSearch) {
      const search = this.playerSearch.toLowerCase();
      squad = squad.filter((p) => p.player.toLowerCase().includes(search));
    }
    return squad;
  }

  get canSimulate(): boolean {
    return this.homePlayers.length === 11 && this.awayPlayers.length === 11;
  }

  setFormation(formation: string): void {
    if (this.activeTab === 'home') {
      this.homeFormation = formation;
      this.homePlayers = [];
    } else {
      this.awayFormation = formation;
      this.awayPlayers = [];
    }
    this.activeSlotIndex = -1;
  }

  onSlotSelected(index: number): void {
    this.activeSlotIndex = this.activeSlotIndex === index ? -1 : index;
  }

  isPlayerSelected(player: Player): boolean {
    return this.currentPlayers.some((p) => p.player_id === player.player_id);
  }

  onPlayerSelected(player: Player): void {
    const players = this.activeTab === 'home' ? this.homePlayers : this.awayPlayers;

    // If already selected, remove
    const existingIdx = players.findIndex((p) => p.player_id === player.player_id);
    if (existingIdx !== -1) {
      players.splice(existingIdx, 1);
      return;
    }

    if (players.length >= 11) return;

    const selected: SelectedPlayer = {
      player_id: player.player_id,
      player: player.player,
      position: player.position,
      detailed_position: player.detailed_position,
    };

    if (this.activeSlotIndex >= 0 && this.activeSlotIndex < 11) {
      // Replace at slot
      players[this.activeSlotIndex] = selected;
      // Move to next empty slot
      const nextEmpty = players.findIndex((p, i) => i > this.activeSlotIndex && !p);
      this.activeSlotIndex = nextEmpty >= 0 ? nextEmpty : -1;
    } else {
      players.push(selected);
    }
  }

  simulate(): void {
    if (!this.canSimulate || !this.homeTeam || !this.awayTeam) return;

    this.simulating = true;
    const homeLineup: LineupData = {
      name: this.homeTeam.name,
      team_id: this.homeTeam.team_id,
      formation: this.homeFormation,
      players: this.homePlayers,
    };
    const awayLineup: LineupData = {
      name: this.awayTeam.name,
      team_id: this.awayTeam.team_id,
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
