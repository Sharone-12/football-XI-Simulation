import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

interface AuthResponse {
  token: string;
  user: { id: string; username: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = '/api/auth';
  private tokenKey = 'pick_xi_token';
  private userKey = 'pick_xi_user';

  public user$ = new BehaviorSubject<{ id: string; username: string; email: string } | null>(
    this.getStoredUser()
  );

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap((res) => {
        this.storeAuth(res);
      })
    );
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, { username, email, password })
      .pipe(
        tap((res) => {
          this.storeAuth(res);
        })
      );
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    } catch {
      // ignore
    }
    this.user$.next(null);
  }

  getUsername(): string {
    const user = this.user$.value;
    return user ? user.username : '';
  }

  private storeAuth(res: AuthResponse): void {
    try {
      localStorage.setItem(this.tokenKey, res.token);
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
    } catch {
      // ignore
    }
    this.user$.next(res.user);
  }

  private getStoredUser(): { id: string; username: string; email: string } | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
