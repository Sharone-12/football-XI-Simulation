import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-bar-row">
      <span class="stat-value home">{{ homeStat }}</span>
      <div class="stat-bar-container">
        <div class="bar-track">
          <div class="bar home-bar" [style.width.%]="homePercent"></div>
          <div class="bar away-bar" [style.width.%]="awayPercent"></div>
        </div>
        <span class="stat-label">{{ label }}</span>
      </div>
      <span class="stat-value away">{{ awayStat }}</span>
    </div>
  `,
  styles: [`
    .stat-bar-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.3rem 0; }
    .stat-value {
      font-family: var(--font-heading);
      font-size: 0.9rem; font-weight: 600;
      min-width: 32px; text-align: center;
    }
    .stat-value.home { color: var(--accent); }
    .stat-value.away { color: var(--accent-blue); }
    .stat-bar-container { flex: 1; position: relative; }
    .bar-track {
      display: flex; height: 5px; border-radius: 3px;
      overflow: hidden; background: var(--bg-secondary);
    }
    .bar { height: 100%; transition: width 0.6s ease; }
    .home-bar { background: var(--accent); border-radius: 3px 0 0 3px; }
    .away-bar { background: var(--accent-blue); border-radius: 0 3px 3px 0; }
    .stat-label {
      position: absolute; top: -16px; left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.05em;
      white-space: nowrap;
    }
  `],
})
export class StatBarComponent {
  @Input() homeStat: number = 0;
  @Input() awayStat: number = 0;
  @Input() label: string = '';

  get total(): number { return this.homeStat + this.awayStat || 1; }
  get homePercent(): number { return (this.homeStat / this.total) * 100; }
  get awayPercent(): number { return (this.awayStat / this.total) * 100; }
}
