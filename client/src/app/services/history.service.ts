import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimulationResult } from '../models/simulation.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private baseUrl = '/api/history';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getHistory(page: number = 1): Observable<{ simulations: SimulationResult[]; total: number; pages: number }> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<{ simulations: SimulationResult[]; total: number; pages: number }>(
      this.baseUrl,
      { params, headers: this.getHeaders() }
    );
  }

  saveSimulation(result: SimulationResult): Observable<SimulationResult> {
    return this.http.post<SimulationResult>(this.baseUrl, result, {
      headers: this.getHeaders(),
    });
  }

  getSimulation(id: string): Observable<SimulationResult> {
    return this.http.get<SimulationResult>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
