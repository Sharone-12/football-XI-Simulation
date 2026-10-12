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
          <div class="logo-badge">XI</div>
          <span class="logo-text">PICK XI</span>
        </a>

        <div class="nav-pills">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="pill">Home</a>
          <a routerLink="/teams" routerLinkActive="active" class="pill">Teams</a>
          <a routerLink="/dream-xi" routerLinkActive="active" class="pill">Dream XI</a>
          <a routerLink="/history" routerLinkActive="active" class="pill">History</a>
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
      background: #fff;
      border-bottom: 1px solid var(--border-color);
      height: var(--nav-height);
      position: relative;
      z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.25rem;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
    }

    .nav-logo:hover { color: var(--text-primary); }

    .logo-badge {
      width: 30px;
      height: 30px;
      background: var(--accent);
      color: #fff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
    }

    .logo-text {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.05rem;
      letter-spacing: 0.06em;
      color: var(--text-primary);
    }

    .nav-pills {
      display: flex;
      gap: 0.25rem;
      background: var(--bg-secondary);
      padding: 0.2rem;
      border-radius: var(--radius-pill);
    }

    .pill {
      padding: 0.35rem 1rem;
      border-radius: var(--radius-pill);
      color: var(--text-secondary);
      font-family: var(--font-heading);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      transition: all var(--transition);
    }

    .pill:hover {
      color: var(--text-primary);
      background: rgba(0,0,0,0.04);
    }

    .pill.active {
      color: #fff;
      background: var(--accent);
      box-shadow: var(--shadow-sm);
    }

    .nav-auth {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-name {
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .btn-sm {
      padding: 0.35rem 0.9rem;
      font-size: 0.75rem;
    }

    .main-content {
      height: calc(100vh - var(--nav-height));
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .nav-pills { display: none; }
    }
  `],
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
