import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="poster">
      <div class="center-layer">
        <div class="subtitle">FOOTBALL MATCH SIMULATOR</div>
        <div class="mode-cards">
          <a routerLink="/teams" class="mode-card">
            <span class="mode-title">CLUB VS CLUB</span>
            <span class="mode-desc">Pick two real squads and simulate a head-to-head match</span>
          </a>
          <a routerLink="/dream-xi" class="mode-card">
            <span class="mode-title">DREAM XI</span>
            <span class="mode-desc">Build your fantasy lineup from any league and watch them play</span>
          </a>
        </div>
      </div>

      <div class="player-layer player-right">
        <img src="assets/hero-player.png" alt="" class="player-img" />
      </div>

      <div class="player-layer player-left">
        <img src="assets/hero-player-left.png" alt="" class="player-img" />
      </div>


      <div class="edge left-edge">
        <span class="edge-label">SEASON 26/27</span>
      </div>
      <div class="edge left-edge bottom">
        <span class="edge-label">PL &middot; LIGA &middot; SERIE A</span>
      </div>
      <div class="edge right-edge">
        <span class="edge-label">66 TEAMS</span>
      </div>
      <div class="edge right-edge bottom">
        <span class="edge-label">1,081 PLAYERS</span>
      </div>
    </div>
  `,
  styles: [`
    .poster {
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .center-layer {
      position: absolute;
      z-index: 1;
      top: 50%;
      left: 53%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      width: 30%;
      max-width: 360px;
    }

    .mode-cards {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: 100%;
    }

    .mode-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1rem 1.5rem;
      background: #1a3c2a;
      border: 2px solid #2a5c40;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
    }

    .mode-card:hover {
      background: #24503a;
      border-color: #4dcba6;
      transform: translateY(-2px);
    }

    .mode-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem;
      color: #f5f0e1;
      letter-spacing: 0.1em;
      white-space: nowrap;
    }

    .mode-desc {
      font-size: 0.75rem;
      color: rgba(245, 240, 225, 0.65);
      line-height: 1.4;
    }

    .player-layer {
      position: absolute;
      top: 0;
      bottom: -4%;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      pointer-events: none;
    }

    .player-right {
      right: 5%;
      justify-content: flex-end;
      padding-right: 5%;
    }

    .player-left {
      left: 0;
      justify-content: flex-start;
      padding-left: 5%;
    }

    .player-img {
      height: 88%;
      width: auto;
      object-fit: contain;
    }

    .player-left .player-img {
      height: 92%;
    }

    .subtitle {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(1.2rem, 2vw, 1.6rem);
      color: #1a3c2a;
      letter-spacing: 0.15em;
      white-space: nowrap;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }


    /* Vertical edge labels */
    .edge {
      position: absolute;
      z-index: 4;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      color: rgba(245, 240, 225, 0.7);
      writing-mode: vertical-lr;
    }

    .left-edge {
      left: 1.2rem;
      top: 5.5rem;
    }

    .left-edge.bottom {
      top: auto;
      bottom: 2rem;
      transform: rotate(180deg);
    }

    .right-edge {
      right: 1.2rem;
      top: 5.5rem;
    }

    .right-edge.bottom {
      top: auto;
      bottom: 2rem;
    }

    @media (max-width: 768px) {
      .edge { display: none; }
      .player-img { height: 75%; }
      .player-left { display: none; }
      .center-layer { width: 70%; }
      .mode-card { padding: 0.8rem 1.2rem; }
    }
  `],
})
export class HomeComponent {}
