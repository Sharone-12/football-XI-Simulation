import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="poster">
      <div class="teal-accent"></div>

      <div class="title-layer">
        <div class="subtitle">FOOTBALL MATCH SIMULATOR</div>
        <span class="title-word">TOUCH</span>
        <span class="title-word">LINE</span>
      </div>

      <div class="player-layer">
        <img src="assets/hero-player.png" alt="" class="player-img" />
      </div>

      <div class="ui-layer">
        <span class="year">2026</span>
        <div class="bottom-block">
          <a routerLink="/teams" class="cta">PLAY NOW</a>
        </div>
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
      background: #b5e61d;
      position: relative;
      overflow: hidden;
    }

    /* Clean teal accent — hard curved edge, not a blob */
    .teal-accent {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 35%;
      height: 40%;
      background: #4dcba6;
      border-radius: 50% 0 0 0;
      opacity: 0.55;
      z-index: 0;
    }

    /* Title sits BEHIND the player */
    .title-layer {
      position: absolute;
      z-index: 1;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 0.85;
      pointer-events: none;
    }

    .title-word {
      display: block;
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(7rem, 20vw, 18rem);
      color: #fff;
      letter-spacing: 0.03em;
    }

    /* Player renders ON TOP of the title */
    .player-layer {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      pointer-events: none;
      padding-left: 5%;
    }

    .player-img {
      height: 88%;
      width: auto;
      object-fit: contain;
    }

    /* Subtitle, year, CTA — on top of everything */
    .ui-layer {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
    }

    .subtitle {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(0.9rem, 1.8vw, 1.2rem);
      color: #fff;
      letter-spacing: 0.2em;
      white-space: nowrap;
      margin-bottom: 0.3rem;
    }

    .bottom-block {
      position: absolute;
      bottom: 7vh;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8rem;
    }

    .year {
      position: absolute;
      right: 12%;
      bottom: 28%;
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2rem, 4.5vw, 3.5rem);
      color: #fff;
      letter-spacing: 0.12em;
    }

    .cta {
      pointer-events: auto;
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(1rem, 1.6vw, 1.2rem);
      color: #fff;
      letter-spacing: 0.15em;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50px;
      padding: 0.6rem 3rem;
      transition: all 0.2s ease;
    }

    .cta:hover {
      background: #fff;
      color: #b5e61d;
      border-color: #fff;
    }

    /* Vertical edge labels */
    .edge {
      position: absolute;
      z-index: 4;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      color: rgba(255, 255, 255, 0.7);
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
      .title-word { font-size: 5rem; }
      .edge { display: none; }
      .player-img { height: 75%; }
      .ui-layer { padding: 20vh 0 6vh; }
    }
  `],
})
export class HomeComponent {}
