import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="player-card" [class.selected]="selected" [class.clickable]="clickable" (click)="onSelect()">
      <div class="player-header">
        <div class="player-info">
          <span class="player-name">{{ player.player }}</span>
          <span class="player-team">{{ player.team }}</span>
        </div>
        <span class="player-position" [class]="'pos-' + positionClass">
          {{ player.detailed_position || player.position }}
        </span>
      </div>
      @if (showStats) {
        <div class="player-stats">
          <div class="stat-item">
            <span class="stat-num">{{ player.appearances }}</span>
            <span class="stat-lbl">Apps</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ player.goals }}</span>
            <span class="stat-lbl">Goals</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ player.assists }}</span>
            <span class="stat-lbl">Assists</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ player.xg | number:'1.1-1' }}</span>
            <span class="stat-lbl">xG</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .player-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.75rem;
      transition: all var(--transition);
    }
    .player-card.clickable { cursor: pointer; }
    .player-card.clickable:hover {
      border-color: var(--accent);
      background: rgba(106, 191, 64, 0.06);
    }
    .player-card.selected {
      border-color: var(--accent);
      background: rgba(106, 191, 64, 0.1);
    }
    .player-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
    .player-info { display: flex; flex-direction: column; min-width: 0; }
    .player-name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .player-team { font-size: 0.7rem; color: var(--text-muted); }
    .player-position {
      font-size: 0.65rem; font-weight: 600;
      padding: 0.15rem 0.4rem; border-radius: 4px;
      white-space: nowrap; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .pos-gk { background: rgba(251, 191, 36, 0.12); color: var(--yellow); }
    .pos-def { background: rgba(96, 165, 250, 0.12); color: var(--accent-blue); }
    .pos-mid { background: rgba(52, 211, 153, 0.12); color: var(--accent-green); }
    .pos-fwd { background: rgba(106, 191, 64, 0.12); color: var(--accent); }
    .player-stats {
      display: flex; gap: 0.6rem;
      margin-top: 0.5rem; padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }
    .stat-item { display: flex; flex-direction: column; align-items: center; }
    .stat-num { font-weight: 700; font-size: 0.8rem; }
    .stat-lbl { font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; }
  `],
})
export class PlayerCardComponent {
  @Input() player!: Player;
  @Input() selected = false;
  @Input() clickable = false;
  @Input() showStats = false;
  @Output() selectPlayer = new EventEmitter<Player>();

  get positionClass(): string {
    const pos = (this.player.position || '').toLowerCase();
    if (pos.includes('goalkeeper') || pos === 'gk') return 'gk';
    if (pos.includes('defender') || pos.includes('back')) return 'def';
    if (pos.includes('midfielder') || pos.includes('mid')) return 'mid';
    return 'fwd';
  }

  onSelect(): void {
    if (this.clickable) this.selectPlayer.emit(this.player);
  }
}
