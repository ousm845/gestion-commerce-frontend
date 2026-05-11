import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/models';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  roles?: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand" [class.collapsed]="sidebarCollapsed()">
            <div class="brand-logo">SD</div>
            <div class="brand-text" *ngIf="!sidebarCollapsed()">
              <strong>SyliDigit</strong>
              <small>Gestion Intégrée</small>
            </div>
          </div>
          <button class="toggle-btn" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section" *ngFor="let group of navGroups">
            <span class="nav-section-label" *ngIf="!sidebarCollapsed()">{{ group.label }}</span>
            <ng-container *ngFor="let item of group.items">
              <a *ngIf="canSee(item) && item.route"
                 [routerLink]="item.route"
                 routerLinkActive="active"
                 class="nav-item"
                 [title]="sidebarCollapsed() ? item.label : ''">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
              </a>
            </ng-container>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="!sidebarCollapsed()">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-details">
              <strong>{{ currentUser?.full_name }}</strong>
              <small>{{ currentUser?.role_display }}</small>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" [title]="'Déconnexion'">🚪</button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <header class="topbar">
          <div class="page-title">
            <h2>{{ pageTitle }}</h2>
          </div>
          <div class="topbar-actions">
            <div class="user-badge">
              <span class="role-badge" [class]="'role-' + currentUser?.role">{{ currentUser?.role_display }}</span>
              <span class="user-name">{{ currentUser?.full_name }}</span>
            </div>
          </div>
        </header>

        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .layout {
      display: flex; min-height: 100vh;
      background: #f0f2f5;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* SIDEBAR */
    .sidebar {
      width: 260px; min-height: 100vh;
      background: #0a0f1e;
      display: flex; flex-direction: column;
      transition: width 0.3s ease;
      position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
      box-shadow: 4px 0 20px rgba(0,0,0,0.3);
    }
    .sidebar-collapsed .sidebar { width: 70px; }
    .sidebar-collapsed .main-content { margin-left: 70px; }

    .sidebar-header {
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 12px; overflow: hidden; }
    .brand-logo {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #ff6b00, #ff9500);
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; color: white; font-size: 14px;
    }
    .brand-text strong { display: block; color: white; font-size: 15px; }
    .brand-text small { color: rgba(255,255,255,0.4); font-size: 11px; }
    .toggle-btn {
      background: rgba(255,255,255,0.06); border: none;
      color: rgba(255,255,255,0.5); padding: 6px 10px;
      border-radius: 6px; cursor: pointer; font-size: 12px;
      transition: all 0.2s;
    }
    .toggle-btn:hover { background: rgba(255,107,0,0.2); color: #ff6b00; }

    .sidebar-nav {
      flex: 1; overflow-y: auto; padding: 12px 0;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .nav-section { margin-bottom: 8px; }
    .nav-section-label {
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3);
      letter-spacing: 1.5px; text-transform: uppercase;
      padding: 8px 18px 4px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 18px; cursor: pointer;
      color: rgba(255,255,255,0.6); text-decoration: none;
      transition: all 0.2s; border-left: 3px solid transparent;
      white-space: nowrap;
    }
    .nav-item:hover { background: rgba(255,107,0,0.1); color: rgba(255,255,255,0.9); border-left-color: rgba(255,107,0,0.5); }
    .nav-item.active { background: rgba(255,107,0,0.15); color: #ff6b00; border-left-color: #ff6b00; font-weight: 600; }
    .nav-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; }
    .nav-label { font-size: 14px; }

    .sidebar-footer {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding: 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .user-info { display: flex; align-items: center; gap: 10px; overflow: hidden; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #ff6b00, #ff9500);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 13px;
    }
    .user-details strong { display: block; color: white; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .user-details small { color: rgba(255,255,255,0.4); font-size: 11px; }
    .logout-btn {
      background: rgba(255,68,68,0.15); border: 1px solid rgba(255,68,68,0.3);
      border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 16px;
      transition: all 0.2s; flex-shrink: 0;
    }
    .logout-btn:hover { background: rgba(255,68,68,0.3); }

    /* MAIN CONTENT */
    .main-content { margin-left: 260px; flex: 1; display: flex; flex-direction: column; transition: margin-left 0.3s; }

    .topbar {
      background: white; padding: 16px 28px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 1px 8px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 50;
    }
    .topbar h2 { margin: 0; font-size: 20px; color: #1a1a2e; font-weight: 700; }
    .topbar-actions { display: flex; align-items: center; gap: 16px; }
    .user-badge { display: flex; align-items: center; gap: 10px; }
    .role-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .role-admin { background: #fff3cd; color: #856404; }
    .role-superviseur { background: #d1ecf1; color: #0c5460; }
    .role-gestionnaire { background: #d4edda; color: #155724; }
    .role-caissier { background: #f8d7da; color: #721c24; }
    .user-name { font-size: 14px; color: #555; font-weight: 500; }

    .page-content { flex: 1; padding: 24px 28px; }
  `]
})
export class LayoutComponent implements OnInit {
  currentUser: User | null = null;
  sidebarCollapsed = signal(false);
  pageTitle = 'Tableau de Bord';

  navGroups = [
    {
      label: 'Principal',
      items: [
        { label: 'Tableau de Bord', icon: '📊', route: '/dashboard' },
      ]
    },
    {
      label: 'Organisation',
      items: [
        { label: 'Zones', icon: '🗺️', route: '/zones' },
        { label: 'Stocks & Dépôts', icon: '🏭', route: '/stocks' },
      ]
    },
    {
      label: 'Catalogue',
      items: [
        { label: 'Produits', icon: '📦', route: '/products' },
        { label: 'Fournisseurs', icon: '🤝', route: '/fournisseurs' },
        { label: 'Clients', icon: '👥', route: '/clients' },
      ]
    },
    {
      label: 'Opérations',
      items: [
        { label: 'Approvisionnements', icon: '🛒', route: '/supply' },
        { label: 'Transferts', icon: '🔄', route: '/transfers' },
        { label: 'Ventes', icon: '💰', route: '/sales' },
        { label: 'Factures', icon: '📄', route: '/factures' },
      ]
    },
    {
      label: 'Finance',
      items: [
        { label: 'Caisses', icon: '🏦', route: '/finance/caisses' },
        { label: 'Dépenses', icon: '💸', route: '/finance/depenses' },
        { label: 'Salariés', icon: '👥', route: '/finance/salaries' },
        { label: 'Bulletins de Paie', icon: '📄', route: '/finance/bulletins-paie' },
        { label: 'Tableau de Bord', icon: '📊', route: '/finance/tableau-bord' },
        { label: 'Comptabilité', icon: '📒', route: '/finance/comptabilite' },
      ]
    },
    {
      label: 'Logistique',
      items: [
        { label: 'Engins', icon: '🚛', route: '/logistics/engins' },
        { label: 'Sorties Engins', icon: '🛣️', route: '/logistics/sorties' },
        { label: 'Maintenances', icon: '🔧', route: '/logistics/maintenances' },
      ]
    },
    {
      label: 'Administration',
      items: [
        { label: 'Personnel', icon: '👥', route: '/personnel' },
        { label: 'Utilisateurs', icon: '👤', route: '/users', roles: ['admin', 'superviseur'] },
      ]
    }
  ];

  pageTitles: Record<string, string> = {
    '/dashboard': 'Tableau de Bord',
    '/zones': 'Zones',
    '/stocks': 'Stocks & Dépôts',
    '/products': 'Produits',
    '/fournisseurs': 'Fournisseurs',
    '/clients': 'Clients',
    '/supply': 'Approvisionnements',
    '/transfers': 'Transferts',
    '/sales': 'Ventes',
    '/factures': 'Factures',
    '/finance/caisses': 'Caisses',
    '/finance/depenses': 'Dépenses',
    '/finance/salaries': 'Salariés',
    '/finance/bulletins-paie': 'Bulletins de Paie',
    '/finance/tableau-bord': 'Tableau de Bord Comptable',
    '/finance/comptabilite': 'Comptabilité',
    '/logistics/engins': 'Engins',
    '/logistics/sorties': 'Sorties Engins',
    '/logistics/maintenances': 'Maintenances',
    '/personnel': 'Personnel',
    '/users': 'Utilisateurs',
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.pageTitle = this.pageTitles[e.urlAfterRedirects] || 'SyliDigit';
    });
  }

  get userInitials(): string {
    if (!this.currentUser) return 'SD';
    const name = this.currentUser.full_name || this.currentUser.username;
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  canSee(item: NavItem): boolean {
    if (!item.roles) return true;
    return this.authService.hasRole(...item.roles);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  logout(): void {
    this.authService.logout();
  }
}
