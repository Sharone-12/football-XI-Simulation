// Pitch view ported from the demo of @bleckert/football-simulator
// (https://github.com/tbleckert/football-simulator, MIT License, (c) Tobias Bleckert).
import { Component, Input } from '@angular/core';
import type { PitchView } from '../../engine/live-match';

const INSET = 7;
const SPAN = 100 - INSET * 2;
const SET_PIECES = ['throw_in', 'corner', 'goal_kick', 'free_kick', 'penalty'];

@Component({
  selector: 'app-match-pitch',
  standalone: true,
  template: `
    <div class="pitch">
      <div class="pitch-grain"></div>
      <div class="mark mark--outline"></div>
      <div class="mark mark--half"></div>
      <div class="mark mark--circle"></div>
      <div class="mark mark--home-box"></div>
      <div class="mark mark--away-box"></div>
      <div class="mark mark--home-six"></div>
      <div class="mark mark--away-six"></div>
      <div class="mark mark--home-spot"></div>
      <div class="mark mark--away-spot"></div>

      @if (offsideLine !== null) {
        <div class="offside-line" [style.left.%]="x(offsideLine)"></div>
      }
      @if (setPiece) {
        <div class="restart-zone" [style.left.%]="x(view.bx)" [style.top.%]="y(view.by)"></div>
      }
      @if (view.pass; as t) {
        <div class="pass-target" [style.left.%]="x(t.x)" [style.top.%]="y(t.y)"></div>
      }

      @for (p of view.players; track p.id) {
        <div class="player"
          [class.away]="p.teamSide === 'away'"
          [class.gk]="p.roleName === 'GK'"
          [class.owner]="p.id === view.ownerId"
          [style.left.%]="x(p.x)" [style.top.%]="y(p.y)"
          [title]="p.playerName + ' · ' + p.roleName">
          <span>{{ p.playerNumber }}</span>
        </div>
      }

      <div class="ball" [style.left.%]="x(view.bx)" [style.top.%]="y(view.by)"></div>
    </div>
    <div class="caption">
      @if (owner; as o) {
        <span class="caption-dot" [class.away]="o.teamSide === 'away'"></span>{{ o.playerName }}
        <span class="caption-intent">{{ intentLabel }}</span>
      } @else {
        <span class="caption-intent">{{ phaseLabel }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      --field-inset: ${INSET}%;
      --pitch: #1a5c36;
      --line: rgba(245, 240, 225, 0.7);
      --home: #f5f0e1;
      --away: #e0614f;
      --mint: #a1e8cc;
      display: block;
      width: 100%;
      max-width: max(320px, calc((100vh - 250px) * 105 / 68));
      margin: 0 auto;
    }
    .pitch {
      position: relative; width: 100%; aspect-ratio: 105 / 68; overflow: hidden;
      border-radius: var(--radius-md);
      background:
        radial-gradient(circle at 50% 45%, rgba(161, 232, 204, 0.08), transparent 42%),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 50%, transparent 50%),
        var(--pitch);
      background-size: auto, 10% 100%, auto;
      box-shadow: var(--shadow-md);
      isolation: isolate;
    }
    .pitch-grain {
      position: absolute; inset: 0; z-index: -1; opacity: 0.24; pointer-events: none;
      background-image:
        radial-gradient(rgba(255, 255, 255, 0.35) 0.55px, transparent 0.7px),
        radial-gradient(rgba(0, 0, 0, 0.45) 0.55px, transparent 0.7px);
      background-position: 0 0, 5px 7px;
      background-size: 9px 9px, 11px 11px;
      mix-blend-mode: soft-light;
    }
    .mark, .player, .ball, .restart-zone, .pass-target, .offside-line { position: absolute; }
    .mark { pointer-events: none; }
    .mark--outline { inset: var(--field-inset); border: 1.5px solid var(--line); }
    .mark--half { top: var(--field-inset); bottom: var(--field-inset); left: 50%; width: 1.5px; background: var(--line); }
    .mark--circle {
      top: 50%; left: 50%; width: 15%; aspect-ratio: 1; border: 1.5px solid var(--line);
      border-radius: 50%; transform: translate(-50%, -50%);
    }
    .mark--circle::after {
      position: absolute; top: 50%; left: 50%; width: 0.35rem; aspect-ratio: 1; border-radius: 50%;
      background: var(--line); content: ''; transform: translate(-50%, -50%);
    }
    .mark--home-box, .mark--away-box { top: 24%; width: 13.5%; height: 52%; border: 1.5px solid var(--line); }
    .mark--home-box { left: var(--field-inset); border-left: 0; }
    .mark--away-box { right: var(--field-inset); border-right: 0; }
    .mark--home-six, .mark--away-six { top: 38.4%; width: 4.5%; height: 23.2%; border: 1.5px solid var(--line); }
    .mark--home-six { left: var(--field-inset); border-left: 0; }
    .mark--away-six { right: var(--field-inset); border-right: 0; }
    .mark--home-spot, .mark--away-spot {
      top: 50%; width: 0.35rem; aspect-ratio: 1; border-radius: 50%; background: var(--line); transform: translate(-50%, -50%);
    }
    .mark--home-spot { left: 16%; }
    .mark--away-spot { right: 16%; transform: translate(50%, -50%); }
    .offside-line {
      top: var(--field-inset); bottom: var(--field-inset); z-index: 1; width: 2px;
      border-left: 2px dashed var(--away); opacity: 0.8; pointer-events: none; transition: left 90ms linear;
    }
    .restart-zone {
      z-index: 2; width: 4rem; aspect-ratio: 1; border: 1.5px dashed var(--home); border-radius: 50%;
      background: rgba(161, 232, 204, 0.12); transform: translate(-50%, -50%);
    }
    .pass-target {
      z-index: 3; width: 1.1rem; aspect-ratio: 1; border: 2px solid var(--mint); border-radius: 50%;
      box-shadow: 0 0 0 0.28rem rgba(161, 232, 204, 0.14); transform: translate(-50%, -50%);
    }
    .player {
      z-index: 4; display: grid; place-items: center;
      width: clamp(1.15rem, 2.1vw, 1.65rem); aspect-ratio: 1;
      border: 2px solid rgba(8, 8, 8, 0.3); border-radius: 50%;
      background: var(--home); color: #1a3c2a;
      box-shadow: 0 2px 4px rgba(8, 8, 8, 0.24);
      font-family: var(--font-body); font-size: clamp(0.5rem, 0.7vw, 0.62rem); font-weight: 800; line-height: 1;
      transform: translate(-50%, -50%);
      transition: left 90ms linear, top 90ms linear, transform 140ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 140ms ease;
    }
    .player.away { border-color: rgba(245, 240, 225, 0.88); background: var(--away); color: #fff; }
    .player.gk { background: #e8c547; color: #1a3c2a; }
    .player.away.gk { background: #7fb3d5; }
    .player.owner {
      transform: translate(-50%, -50%) scale(1.18);
      box-shadow: 0 2px 4px rgba(8, 8, 8, 0.24), 0 0 0 0.32rem rgba(161, 232, 204, 0.45);
    }
    .ball {
      z-index: 6; width: clamp(0.55rem, 0.85vw, 0.75rem); aspect-ratio: 1;
      border: 2px solid #080808; border-radius: 50%;
      background:
        radial-gradient(circle at 70% 25%, #080808 0 12%, transparent 14%),
        radial-gradient(circle at 30% 70%, #080808 0 11%, transparent 13%),
        #f7f5ef;
      box-shadow: 0 2px 5px rgba(8, 8, 8, 0.34);
      transform: translate(-50%, -50%);
      transition: left 90ms linear, top 90ms linear;
    }
    .caption {
      display: flex; align-items: center; justify-content: center; gap: 0.45rem;
      min-height: 1.6rem; margin-top: 0.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-primary);
    }
    .caption-dot { width: 0.6rem; aspect-ratio: 1; border-radius: 50%; background: var(--home); border: 1.5px solid #1a3c2a; }
    .caption-dot.away { background: var(--away); }
    .caption-intent { font-weight: 500; color: var(--text-secondary); text-transform: capitalize; }
  `],
})
export class MatchPitchComponent {
  @Input({ required: true }) view!: PitchView;

  x(v: number): number {
    return INSET + (v / 105) * SPAN;
  }

  y(v: number): number {
    return INSET + (v / 68) * SPAN;
  }

  get owner(): PitchView['players'][number] | undefined {
    return this.view.players.find((p) => p.id === this.view.ownerId);
  }

  get setPiece(): boolean {
    return SET_PIECES.includes(this.view.phase);
  }

  get phaseLabel(): string {
    return this.view.phase.replace(/_/g, ' ');
  }

  get intentLabel(): string {
    return (this.view.intent || '').replace(/_/g, ' ');
  }

  get offsideLine(): number | null {
    const v = this.view;
    const side = this.owner?.teamSide || v.possSide;
    if (!side || v.phase !== 'open_play') return null;
    const dir = (side === 'home') === (v.period !== 2) ? 1 : -1;
    const opp = v.players
      .filter((p) => p.teamSide !== side)
      .map((p) => p.x)
      .sort((a, b) => (dir > 0 ? b - a : a - b));
    const secondLast = opp[1];
    if (secondLast === undefined) return null;
    return dir > 0 ? Math.max(v.bx, secondLast) : Math.min(v.bx, secondLast);
  }
}
