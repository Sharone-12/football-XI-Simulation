import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectedPlayer } from '../../models/simulation.model';

interface PositionSlot {
  label: string;
  x: number; // percentage from left
  y: number; // percentage from top
  player?: SelectedPlayer;
}

@Component({
  selector: 'app-formation-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pitch">
      <div class="pitch-markings">
        <div class="halfway-line"></div>
        <div class="center-circle"></div>
        <div class="center-dot"></div>
        <div class="penalty-area top"></div>
        <div class="penalty-area bottom"></div>
        <div class="goal-area top"></div>
        <div class="goal-area bottom"></div>
      </div>

      @for (slot of slots; track slot.label; let i = $index) {
        <div
          class="position-slot"
          [class.filled]="slot.player"
          [class.active]="selectedSlotIndex === i"
          [class.editable]="editable"
          [style.left.%]="slot.x"
          [style.top.%]="slot.y"
          (click)="onSlotClick(i)"
        >
          <div class="slot-dot"></div>
          <span class="slot-label">
            @if (slot.player) {
              {{ getShortName(slot.player.player) }}
            } @else {
              {{ slot.label }}
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .pitch {
      position: relative;
      width: 100%;
      padding-bottom: 140%;
      background: linear-gradient(
        180deg,
        #15803d 0%, #166534 10%, #15803d 10%,
        #166534 20%, #15803d 20%, #166534 30%,
        #15803d 30%, #166534 40%, #15803d 40%,
        #166534 50%, #15803d 50%, #166534 60%,
        #15803d 60%, #166534 70%, #15803d 70%,
        #166534 80%, #15803d 80%, #166534 90%,
        #15803d 90%, #166534 100%
      );
      border-radius: var(--radius-md);
      border: 2px solid rgba(255, 255, 255, 0.25);
      overflow: hidden;
    }

    .pitch-markings {
      position: absolute;
      inset: 0;
    }

    .halfway-line {
      position: absolute;
      top: 50%;
      left: 5%;
      right: 5%;
      height: 2px;
      background: rgba(255, 255, 255, 0.3);
    }

    .center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 22%;
      height: 0;
      padding-bottom: 22%;
      transform: translate(-50%, -50%);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
    }

    .center-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
    }

    .penalty-area {
      position: absolute;
      left: 20%;
      right: 20%;
      height: 16%;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .penalty-area.top { top: 0; border-top: none; }
    .penalty-area.bottom { bottom: 0; border-bottom: none; }

    .goal-area {
      position: absolute;
      left: 32%;
      right: 32%;
      height: 8%;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .goal-area.top { top: 0; border-top: none; }
    .goal-area.bottom { bottom: 0; border-bottom: none; }

    .position-slot {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      z-index: 2;
      cursor: default;
    }

    .position-slot.editable {
      cursor: pointer;
    }

    .slot-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(30, 41, 59, 0.85);
      border: 2px solid rgba(255, 255, 255, 0.4);
      transition: all var(--transition);
    }

    .position-slot.filled .slot-dot {
      background: var(--accent-green);
      border-color: #fff;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
    }

    .position-slot.active .slot-dot {
      background: var(--accent-blue);
      border-color: #fff;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.5);
      animation: pulse-slot 1.2s ease infinite;
    }

    @keyframes pulse-slot {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    .position-slot.editable:hover .slot-dot {
      transform: scale(1.1);
      border-color: #fff;
    }

    .slot-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.6);
      text-align: center;
      max-width: 70px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .slot-dot {
        width: 24px;
        height: 24px;
      }
      .slot-label {
        font-size: 0.55rem;
        max-width: 55px;
      }
    }
  `],
})
export class FormationGridComponent {
  @Input() formation: string = '4-3-3';
  @Input() players: SelectedPlayer[] = [];
  @Input() editable: boolean = false;
  @Input() selectedSlotIndex: number = -1;
  @Output() slotSelected = new EventEmitter<number>();

  get slots(): PositionSlot[] {
    const layout = this.getFormationLayout(this.formation);
    return layout.map((slot, i) => ({
      ...slot,
      player: this.players[i] || undefined,
    }));
  }

  onSlotClick(index: number): void {
    if (this.editable) {
      this.slotSelected.emit(index);
    }
  }

  getShortName(name: string): string {
    const parts = name.split(' ');
    if (parts.length <= 1) return name;
    return parts[0][0] + '. ' + parts.slice(1).join(' ');
  }

  private getFormationLayout(formation: string): PositionSlot[] {
    const formations: Record<string, PositionSlot[]> = {
      '4-3-3': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LB', x: 15, y: 76 },
        { label: 'CB', x: 37, y: 80 },
        { label: 'CB', x: 63, y: 80 },
        { label: 'RB', x: 85, y: 76 },
        { label: 'CM', x: 25, y: 58 },
        { label: 'CM', x: 50, y: 55 },
        { label: 'CM', x: 75, y: 58 },
        { label: 'LW', x: 18, y: 30 },
        { label: 'ST', x: 50, y: 24 },
        { label: 'RW', x: 82, y: 30 },
      ],
      '4-4-2': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LB', x: 15, y: 76 },
        { label: 'CB', x: 37, y: 80 },
        { label: 'CB', x: 63, y: 80 },
        { label: 'RB', x: 85, y: 76 },
        { label: 'LM', x: 15, y: 55 },
        { label: 'CM', x: 37, y: 58 },
        { label: 'CM', x: 63, y: 58 },
        { label: 'RM', x: 85, y: 55 },
        { label: 'ST', x: 37, y: 28 },
        { label: 'ST', x: 63, y: 28 },
      ],
      '3-5-2': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'CB', x: 25, y: 78 },
        { label: 'CB', x: 50, y: 80 },
        { label: 'CB', x: 75, y: 78 },
        { label: 'LM', x: 10, y: 55 },
        { label: 'CM', x: 30, y: 58 },
        { label: 'CM', x: 50, y: 53 },
        { label: 'CM', x: 70, y: 58 },
        { label: 'RM', x: 90, y: 55 },
        { label: 'ST', x: 37, y: 26 },
        { label: 'ST', x: 63, y: 26 },
      ],
      '5-3-2': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LWB', x: 10, y: 70 },
        { label: 'CB', x: 30, y: 78 },
        { label: 'CB', x: 50, y: 80 },
        { label: 'CB', x: 70, y: 78 },
        { label: 'RWB', x: 90, y: 70 },
        { label: 'CM', x: 25, y: 55 },
        { label: 'CM', x: 50, y: 52 },
        { label: 'CM', x: 75, y: 55 },
        { label: 'ST', x: 37, y: 28 },
        { label: 'ST', x: 63, y: 28 },
      ],
      '4-2-3-1': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LB', x: 15, y: 76 },
        { label: 'CB', x: 37, y: 80 },
        { label: 'CB', x: 63, y: 80 },
        { label: 'RB', x: 85, y: 76 },
        { label: 'CDM', x: 37, y: 62 },
        { label: 'CDM', x: 63, y: 62 },
        { label: 'LAM', x: 20, y: 42 },
        { label: 'CAM', x: 50, y: 38 },
        { label: 'RAM', x: 80, y: 42 },
        { label: 'ST', x: 50, y: 22 },
      ],
      '3-4-3': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'CB', x: 25, y: 78 },
        { label: 'CB', x: 50, y: 80 },
        { label: 'CB', x: 75, y: 78 },
        { label: 'LM', x: 15, y: 55 },
        { label: 'CM', x: 37, y: 58 },
        { label: 'CM', x: 63, y: 58 },
        { label: 'RM', x: 85, y: 55 },
        { label: 'LW', x: 20, y: 30 },
        { label: 'ST', x: 50, y: 24 },
        { label: 'RW', x: 80, y: 30 },
      ],
      '5-4-1': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LWB', x: 10, y: 70 },
        { label: 'CB', x: 30, y: 78 },
        { label: 'CB', x: 50, y: 80 },
        { label: 'CB', x: 70, y: 78 },
        { label: 'RWB', x: 90, y: 70 },
        { label: 'LM', x: 15, y: 50 },
        { label: 'CM', x: 37, y: 53 },
        { label: 'CM', x: 63, y: 53 },
        { label: 'RM', x: 85, y: 50 },
        { label: 'ST', x: 50, y: 26 },
      ],
      '4-1-4-1': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LB', x: 15, y: 76 },
        { label: 'CB', x: 37, y: 80 },
        { label: 'CB', x: 63, y: 80 },
        { label: 'RB', x: 85, y: 76 },
        { label: 'CDM', x: 50, y: 64 },
        { label: 'LM', x: 15, y: 45 },
        { label: 'CM', x: 37, y: 48 },
        { label: 'CM', x: 63, y: 48 },
        { label: 'RM', x: 85, y: 45 },
        { label: 'ST', x: 50, y: 24 },
      ],
      '4-5-1': [
        { label: 'GK', x: 50, y: 92 },
        { label: 'LB', x: 15, y: 76 },
        { label: 'CB', x: 37, y: 80 },
        { label: 'CB', x: 63, y: 80 },
        { label: 'RB', x: 85, y: 76 },
        { label: 'LM', x: 12, y: 52 },
        { label: 'CM', x: 30, y: 55 },
        { label: 'CM', x: 50, y: 50 },
        { label: 'CM', x: 70, y: 55 },
        { label: 'RM', x: 88, y: 52 },
        { label: 'ST', x: 50, y: 26 },
      ],
    };

    return formations[formation] || formations['4-3-3'];
  }
}
