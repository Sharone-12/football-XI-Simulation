import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-page">
      <div class="home-left">
        <div class="hero-text">
          <span class="hero-tag">Football Match Simulator</span>
          <h1 class="hero-title">Pick Your XI.<br/>Simulate The Match.</h1>
          <p class="hero-sub">Build your dream lineup from Europe's top leagues. Set formations, pick players, and watch the simulation unfold.</p>
        </div>

        <div class="mode-buttons">
          <a routerLink="/teams" class="mode-btn">
            <div class="mode-btn-icon club-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="12" y1="4" x2="12" y2="20" opacity="0.4"/>
                <circle cx="7" cy="12" r="3" stroke-width="1.5"/>
                <circle cx="17" cy="12" r="3" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="mode-btn-text">
              <span class="mode-btn-title">Club vs Club</span>
              <span class="mode-btn-desc">Pick two real teams and build your starting XIs</span>
            </div>
            <span class="mode-arrow">&rarr;</span>
          </a>

          <a routerLink="/dream-xi" class="mode-btn">
            <div class="mode-btn-icon dream-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L14.5 8.5H21L16 12.5L17.5 19L12 15L6.5 19L8 12.5L3 8.5H9.5L12 2Z"/>
              </svg>
            </div>
            <div class="mode-btn-text">
              <span class="mode-btn-title">Dream XI</span>
              <span class="mode-btn-desc">Mix stars from any league into fantasy XIs</span>
            </div>
            <span class="mode-arrow">&rarr;</span>
          </a>
        </div>
      </div>

      <div class="home-right">
        <div class="hero-widget">
          <img src="assets/hero.png" alt="Football pixel art" class="hero-img" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-page {
      height: 100%;
      display: flex;
      align-items: center;
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem;
      gap: 4rem;
    }

    .home-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .hero-tag {
      display: inline-block;
      font-family: var(--font-heading);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      background: rgba(196, 83, 42, 0.08);
      padding: 0.3rem 0.8rem;
      border-radius: var(--radius-pill);
      margin-bottom: 0.75rem;
    }

    .hero-title {
      font-family: var(--font-heading);
      font-size: 3rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: var(--text-primary);
    }

    .hero-sub {
      margin-top: 1rem;
      font-size: 1rem;
      color: var(--text-secondary);
      max-width: 420px;
      line-height: 1.7;
    }

    .mode-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .mode-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: #fff;
      color: var(--text-primary);
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    .mode-btn:hover {
      transform: translateX(4px);
      color: var(--text-primary);
      box-shadow: var(--shadow-md);
      border-color: var(--border-light);
    }

    .mode-btn-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .club-icon {
      background: rgba(45, 122, 79, 0.08);
      color: var(--accent-green);
    }

    .dream-icon {
      background: rgba(59, 95, 192, 0.08);
      color: var(--accent-blue);
    }

    .mode-btn-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .mode-btn-title {
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 0.95rem;
    }

    .mode-btn-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .mode-arrow {
      font-size: 1.1rem;
      color: var(--text-muted);
      transition: all var(--transition);
    }

    .mode-btn:hover .mode-arrow {
      color: var(--accent);
      transform: translateX(3px);
    }

    .home-right {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
    }

    .hero-widget {
      width: 360px;
      height: 440px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
      background: var(--bg-secondary);
      box-shadow: var(--shadow-lg);
    }

    .hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: 900px) {
      .home-page {
        flex-direction: column;
        justify-content: center;
        padding: 1.5rem;
        gap: 2rem;
      }
      .home-right { display: none; }
      .hero-title { font-size: 2.2rem; }
    }
  `],
})
export class HomeComponent {}
