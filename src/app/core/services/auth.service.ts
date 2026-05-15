import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, AuthResponse } from '../../shared/models/models';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sylidigit_access';
  private readonly REFRESH_KEY = 'sylidigit_refresh';
  private readonly USER_KEY = 'sylidigit_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {

    console.log('AuthService - Login attempt for:', credentials.username);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/auth/login/`, credentials).pipe(
      tap(response => {
        console.log('AuthService - Login successful, storing token');
        localStorage.setItem(this.TOKEN_KEY, response.access);
        localStorage.setItem(this.REFRESH_KEY, response.refresh);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        console.log('AuthService - Token stored:', response.access.substring(0, 20) + '...');
      })
    );
  }

  logout(): void {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    if (refresh) {
      this.http.post(`${environment.apiUrl}/auth/auth/logout/`, { refresh }).subscribe();
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  register(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/auth/register/`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.access);
        localStorage.setItem(this.REFRESH_KEY, response.refresh);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  refreshToken(): Observable<any> {

    const refresh = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<any>(`${environment.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap(response => localStorage.setItem(this.TOKEN_KEY, response.access))
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isAdminOrSuperviseur(): boolean {
    return this.hasRole('admin', 'superviseur');
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
