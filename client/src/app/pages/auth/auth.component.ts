import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="auth-card">
        <h1 class="auth-title">{{ isLogin ? 'Sign In' : 'Create Account' }}</h1>
        <p class="auth-sub">{{ isLogin ? 'Welcome back to Pick XI' : 'Join Pick XI and save your matches' }}</p>

        <form (ngSubmit)="submit()" class="auth-form">
          @if (!isLogin) {
            <div class="form-group">
              <label for="username">Username</label>
              <input id="username" type="text" [(ngModel)]="username" name="username" placeholder="Enter username" required />
            </div>
          }
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="Enter email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="Enter password" required minlength="6" />
          </div>

          @if (error) { <div class="error-msg">{{ error }}</div> }

          <button type="submit" class="btn btn-primary btn-full" [disabled]="submitting">
            {{ submitting ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account') }}
          </button>
        </form>

        <div class="auth-toggle">
          @if (isLogin) {
            <span>Don't have an account?</span>
            <button class="link-btn" (click)="isLogin = false; error = ''">Register</button>
          } @else {
            <span>Already have an account?</span>
            <button class="link-btn" (click)="isLogin = true; error = ''">Sign In</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { height: 100%; display: flex; justify-content: center; align-items: center; padding: 1rem; }
    .auth-card {
      width: 100%; max-width: 400px;
      background: #fff; border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 2rem;
      box-shadow: var(--shadow-md);
    }
    .auth-title { font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; text-align: center; }
    .auth-sub { text-align: center; color: var(--text-secondary); margin-top: 0.4rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
    .form-group input { width: 100%; }
    .error-msg {
      background: rgba(196,56,42,0.08); color: var(--danger);
      padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;
    }
    .btn-full { width: 100%; padding: 0.7rem; }
    .auth-toggle {
      margin-top: 1.25rem; text-align: center; font-size: 0.85rem;
      color: var(--text-secondary); display: flex; justify-content: center; gap: 0.4rem;
    }
    .link-btn { background: none; color: var(--accent); font-weight: 600; padding: 0; }
    .link-btn:hover { text-decoration: underline; }
  `],
})
export class AuthComponent {
  isLogin = true;
  username = '';
  email = '';
  password = '';
  error = '';
  submitting = false;

  constructor(private authService: AuthService, private router: Router) {}

  submit(): void {
    this.error = '';
    if (!this.email || !this.password) { this.error = 'Please fill in all fields.'; return; }
    if (!this.isLogin && !this.username) { this.error = 'Please enter a username.'; return; }

    this.submitting = true;
    if (this.isLogin) {
      this.authService.login(this.email, this.password).subscribe({
        next: () => { this.submitting = false; this.router.navigate(['/']); },
        error: (err) => { this.submitting = false; this.error = err.error?.message || 'Login failed.'; },
      });
    } else {
      this.authService.register(this.username, this.email, this.password).subscribe({
        next: () => { this.submitting = false; this.router.navigate(['/']); },
        error: (err) => { this.submitting = false; this.error = err.error?.message || 'Registration failed.'; },
      });
    }
  }
}
