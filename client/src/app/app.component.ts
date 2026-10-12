import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="nav-logo">
          <span class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#22c55e" stroke-width="2"/>
              <circle cx="14" cy="14" r="4" fill="#22c55e"/>
              <line x1="14" y1="1" x2="14" y2="27" stroke="#22c55e" stroke-width="1" opacity="0.3"/>
              <line x1="1" y1="14" x2="27" y2="14" stroke="#22c55e" stroke-width="1" opacity="0.3"/>
            </svg>
          </span>
          <span class="logo-text">Pick XI</span>
        </a>

        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          <a routerLink="/teams" routerLinkActive="active">Teams</a>
          <a routerLink="/dream-xi" routerLinkActive="active">Dream XI</a>
          <a routerLink="/history" routerLinkActive="active">History</a>
        </div>

        <div class="nav-auth">
          @if (authService.user$ | async; as user) {
            <span class="user-name">{{ user.username }}</span>
            <button class="btn btn-outline btn-sm" (click)="authService.logout()">Logout</button>
          } @else {
            <a routerLink="/auth" class="btn btn-primary btn-sm">Login</a>
          }
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .navbar {
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: var(--text-primary);
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .nav-logo:hover {
      color: var(--text-primary);
    }

    .logo-icon {
      display: flex;
      align-items: center;
    }

    .nav-links {
      display: flex;
      gap: 0.25rem;
    }

    .nav-links a {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      transition: all var(--transition);
    }

    .nav-links a:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-links a.active {
      color: var(--accent-green);
      background: rgba(34, 197, 94, 0.08);
    }

    .nav-auth {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-name {
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .btn-sm {
      padding: 0.4rem 1rem;
      font-size: 0.8rem;
    }

    .main-content {
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
    }
  `],
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
