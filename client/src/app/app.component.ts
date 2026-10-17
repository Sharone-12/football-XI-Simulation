import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.navbar-transparent]="isHome$ | async">
      <div class="nav-container">
        <a routerLink="/" class="nav-logo">
          <span class="logo-touch">TOUCH</span><span class="logo-line">LINE</span>
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

    <main class="main-content" [class.main-full]="isHome$ | async">
      <router-outlet />
    </main>
  `,
  styles: [`
    .navbar {
      background: var(--bg-primary);
      height: var(--nav-height);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar-transparent {
      background: transparent;
      position: absolute;
      left: 0;
      right: 0;
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .nav-logo {
      font-family: 'Bebas Neue', var(--font-heading), sans-serif;
      font-size: 1.8rem;
      letter-spacing: 0.1em;
      color: #fff;
    }

    .nav-logo:hover { color: #fff; }

    .logo-touch {
      font-weight: 400;
    }

    .logo-line {
      font-weight: 400;
    }

    .nav-links {
      display: flex;
      gap: 0.25rem;
    }

    .nav-links a {
      padding: 0.5rem 1.2rem;
      border-radius: var(--radius-pill);
      color: rgba(255, 255, 255, 0.85);
      font-family: 'Bebas Neue', var(--font-heading), sans-serif;
      font-size: 1.1rem;
      font-weight: 400;
      letter-spacing: 0.1em;
      transition: all var(--transition);
    }

    .nav-links a:hover {
      color: #fff;
      background: rgba(30, 90, 40, 0.4);
    }

    .nav-links a.active {
      color: #fff;
      background: #2d7a3a;
    }

    .nav-auth {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-name {
      color: rgba(255, 255, 255, 0.9);
      font-family: 'Bebas Neue', var(--font-heading), sans-serif;
      font-size: 1.05rem;
      font-weight: 400;
      letter-spacing: 0.08em;
    }

    .btn-sm {
      padding: 0.4rem 1.1rem;
      font-size: 0.85rem;
      font-family: 'Bebas Neue', var(--font-heading), sans-serif;
      letter-spacing: 0.08em;
    }

    .main-content {
      height: calc(100vh - var(--nav-height));
      overflow: hidden;
    }

    .main-full {
      height: 100vh;
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-container { padding: 0 1rem; }
    }
  `],
})
export class AppComponent {
  isHome$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map(e => e.urlAfterRedirects === '/')
  );

  constructor(public authService: AuthService, private router: Router) {}
}
