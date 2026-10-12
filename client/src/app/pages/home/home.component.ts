import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-page">
      <section class="hero">
        <h1 class="hero-title">Pick XI <span class="amp">&</span> Simulate</h1>
        <p class="hero-sub">Build your dream lineup. Simulate the match. See who wins.</p>
      </section>

      <section class="mode-cards">
        <a routerLink="/teams" class="mode-card">
          <div class="mode-icon club-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
              <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" stroke-width="2" opacity="0.5"/>
              <circle cx="14" cy="24" r="6" stroke="currentColor" stroke-width="2"/>
              <circle cx="34" cy="24" r="6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h2 class="mode-title">Club vs Club</h2>
          <p class="mode-desc">
            Choose two real teams from Europe's top leagues. Pick your starting XIs
            from their actual squads and simulate the match.
          </p>
          <span class="mode-cta">Select Teams &rarr;</span>
        </a>

        <a routerLink="/dream-xi" class="mode-card dream">
          <div class="mode-icon dream-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L28 16H40L30 24L34 36L24 28L14 36L18 24L8 16H20L24 4Z"
                    stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <h2 class="mode-title">Dream XI</h2>
          <p class="mode-desc">
            Mix and match stars from the Premier League, La Liga, PSG, and Bayern.
            Build two fantasy XIs and see who dominates.
          </p>
          <span class="mode-cta">Build Dream XI &rarr;</span>
        </a>
      </section>
    </div>
  `,
  styles: [`
    .home-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .hero {
      text-align: center;
      padding: 4rem 1rem 3rem;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .amp {
      color: var(--accent-green);
    }

    .hero-sub {
      margin-top: 1rem;
      font-size: 1.15rem;
      color: var(--text-secondary);
      max-width: 480px;
      margin-inline: auto;
    }

    .mode-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .mode-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2.5rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
      color: var(--text-primary);
    }

    .mode-card:hover {
      border-color: var(--accent-green);
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(34, 197, 94, 0.1);
      color: var(--text-primary);
    }

    .mode-card.dream:hover {
      border-color: var(--accent-blue);
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.1);
    }

    .mode-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .club-icon {
      background: rgba(34, 197, 94, 0.1);
      color: var(--accent-green);
    }

    .dream-icon {
      background: rgba(59, 130, 246, 0.1);
      color: var(--accent-blue);
    }

    .mode-title {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .mode-desc {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .mode-cta {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--accent-green);
      margin-top: auto;
    }

    .mode-card.dream .mode-cta {
      color: var(--accent-blue);
    }

    @media (max-width: 640px) {
      .mode-cards {
        grid-template-columns: 1fr;
      }
      .hero-title {
        font-size: 2.2rem;
      }
    }
  `],
})
export class HomeComponent {}
