import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-bg"></div>
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon">SD</div>
          <h1>SyliDigit</h1>
          <p>Gestion Intégrée Multi-Sites</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group" [class.error]="f['username'].touched && f['username'].invalid">
            <label>Identifiant</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input type="text" formControlName="username" placeholder="Votre identifiant" autocomplete="username" />
            </div>
            <span class="error-msg" *ngIf="f['username'].touched && f['username'].errors?.['required']">
              Identifiant requis
            </span>
          </div>

          <div class="form-group" [class.error]="f['password'].touched && f['password'].invalid">
            <label>Mot de passe</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input [type]="showPassword ? 'text' : 'password'" formControlName="password"
                     placeholder="Votre mot de passe" autocomplete="current-password" />
              <button type="button" class="toggle-pass" (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="error-banner" *ngIf="errorMessage">
            ⚠️ {{ errorMessage }}
          </div>

          <button type="submit" class="btn-login" [disabled]="loading || loginForm.invalid">
            <span *ngIf="!loading">Se connecter →</span>
            <span *ngIf="loading" class="spinner">⏳ Connexion...</span>
          </button>
        </form>

        <div class="login-footer">
          <small>
            SyliDigit v1.0 — Proposé par SyliDigit
            • <a routerLink="/auth/register" style="color:#ff9500; text-decoration:none;">S'inscrire</a>
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0f1e;
      position: relative;
      overflow: hidden;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .login-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 20% 50%, rgba(255,107,0,0.15) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 20%, rgba(255,107,0,0.08) 0%, transparent 50%);
    }
    .login-card {
      position: relative; z-index: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,107,0,0.3);
      border-radius: 20px;
      padding: 48px 40px;
      width: 420px;
      backdrop-filter: blur(20px);
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    }
    .login-logo { text-align: center; margin-bottom: 36px; }
    .logo-icon {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #ff6b00, #ff9500);
      border-radius: 18px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 900; color: white;
      margin-bottom: 16px;
      box-shadow: 0 8px 32px rgba(255,107,0,0.4);
    }
    .login-logo h1 { color: #fff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .login-logo p { color: rgba(255,255,255,0.5); font-size: 13px; margin: 6px 0 0; }
    .form-group { margin-bottom: 20px; }
    label { display: block; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; margin-bottom: 8px; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; font-size: 16px; }
    input {
      width: 100%; padding: 13px 14px 13px 42px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px; color: white; font-size: 15px;
      transition: all 0.2s; box-sizing: border-box;
      outline: none;
    }
    input:focus { border-color: #ff6b00; background: rgba(255,107,0,0.08); box-shadow: 0 0 0 3px rgba(255,107,0,0.15); }
    input::placeholder { color: rgba(255,255,255,0.3); }
    .toggle-pass { position: absolute; right: 12px; background: none; border: none; cursor: pointer; font-size: 16px; }
    .form-group.error input { border-color: #ff4444; }
    .error-msg { color: #ff6666; font-size: 12px; margin-top: 4px; display: block; }
    .error-banner {
      background: rgba(255,68,68,0.15); border: 1px solid rgba(255,68,68,0.4);
      border-radius: 8px; padding: 12px 14px; color: #ff9999;
      font-size: 13px; margin-bottom: 20px;
    }
    .btn-login {
      width: 100%; padding: 15px;
      background: linear-gradient(135deg, #ff6b00, #ff9500);
      border: none; border-radius: 10px; color: white;
      font-size: 16px; font-weight: 700; cursor: pointer;
      transition: all 0.2s; letter-spacing: 0.3px;
    }
    .btn-login:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,0,0.4); }
    .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
    .login-footer { text-align: center; margin-top: 24px; }
    .login-footer small { color: rgba(255,255,255,0.3); font-size: 12px; }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';
  returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    // Login désactivé : accès direct à l'application.
    this.router.navigateByUrl(this.returnUrl);
  }
}

