import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StockService, VenteService, LogisticsService, FinanceService, ProduitService } from '../../core/services/api.service';

interface KpiCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  route?: string;
}

interface VenteJour {
  date: string;
  jour: string;
  nombre: number;
  chiffre_affaires: number;
}

interface ProduitVendu {
  produit__id: number;
  produit__nom: string;
  quantite_vendue: number;
  chiffre_affaires: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h3>Bienvenue sur SyliDigit 👋</h3>
          <p>Voici un aperçu de votre activité en temps réel.</p>
        </div>
        <div class="welcome-date">{{ today | date:'EEEE dd MMMM yyyy':'':'fr' }}</div>
      </div>

      <!-- KPI Cards - Today's Stats -->
      <div class="kpi-section">
        <h4 class="section-title">📊 Aujourd'hui</h4>
        <div class="kpi-grid">
          <div class="kpi-card" *ngFor="let kpi of todayKpis" [routerLink]="kpi.route" [class.clickable]="kpi.route">
            <div class="kpi-icon" [style.background]="kpi.color + '22'">{{ kpi.icon }}</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-title">{{ kpi.title }}</div>
              <div class="kpi-sub">{{ kpi.subtitle }}</div>
            </div>
            <div class="kpi-arrow" *ngIf="kpi.route">→</div>
          </div>
        </div>
      </div>

      <!-- KPI Cards - Month Stats -->
      <div class="kpi-section">
        <h4 class="section-title">📈 Ce Mois</h4>
        <div class="kpi-grid">
          <div class="kpi-card" *ngFor="let kpi of monthKpis" [routerLink]="kpi.route" [class.clickable]="kpi.route">
            <div class="kpi-icon" [style.background]="kpi.color + '22'">{{ kpi.icon }}</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-title">{{ kpi.title }}</div>
              <div class="kpi-sub">{{ kpi.subtitle }}</div>
            </div>
            <div class="kpi-arrow" *ngIf="kpi.route">→</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-row">
        <!-- Sales Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <h4>📈 Ventes des 7 derniers jours</h4>
          </div>
          <div class="chart-container">
            <div class="simple-bar-chart">
              <div class="bar-item" *ngFor="let v of ventes7Jours">
                <div class="bar-wrapper">
                  <div class="bar" [style.height.%]="getBarHeight(v.chiffre_affaires)" [style.background]="'linear-gradient(180deg, #ff6b00 0%, #ff8f33 100%)'">
                    <span class="bar-value">{{ v.chiffre_affaires | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="bar-label">{{ v.jour }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="card chart-card">
          <div class="card-header">
            <h4>🏆 Top 5 Produits les plus vendus</h4>
          </div>
          <div class="products-list">
            <div class="product-item" *ngFor="let p of topProduits; let i = index">
              <div class="product-rank">{{ i + 1 }}</div>
              <div class="product-info">
                <strong>{{ p.produit__nom }}</strong>
                <span class="product-qty">{{ p.quantite_vendue | number:'1.0-0' }} unités</span>
              </div>
              <div class="product-ca">{{ p.chiffre_affaires | number:'1.0-0' }} FCA</div>
            </div>
            <div class="empty-state" *ngIf="topProduits.length === 0 && !loading">
              Aucune vente ce mois
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom sections -->
      <div class="dashboard-row">
        <!-- Alertes Stock -->
        <div class="card alertes-card">
          <div class="card-header">
            <h4>⚠️ Alertes Stock Bas</h4>
            <a routerLink="/stocks" class="see-all">Voir tout →</a>
          </div>
          <div class="alerte-list">
            <div class="alerte-item" *ngFor="let alerte of alertesStock">
              <div class="alerte-info">
                <strong>{{ alerte.produit_nom }}</strong>
                <small>{{ alerte.stock_nom }}</small>
              </div>
              <div class="alerte-qty">
                <span class="badge badge-danger">{{ alerte.quantite }} {{ alerte.produit_unite }}</span>
              </div>
            </div>
            <div class="empty-state" *ngIf="alertesStock.length === 0 && !loading">
              ✅ Aucune alerte de stock
            </div>
          </div>
        </div>

        <!-- Dernières ventes -->
        <div class="card ventes-card">
          <div class="card-header">
            <h4>💰 Dernières Ventes</h4>
            <a routerLink="/sales" class="see-all">Voir tout →</a>
          </div>
          <div class="vente-list">
            <div class="vente-item" *ngFor="let vente of dernieresVentes">
              <div class="vente-info">
                <strong>{{ vente.numero }}</strong>
                <small>{{ vente.client_nom }}</small>
              </div>
              <div class="vente-right">
                <span class="vente-montant">{{ vente.montant_total | number:'1.0-0' }} FCA</span>
                <span class="badge" [class]="'badge-' + vente.statut">{{ vente.statut_display }}</span>
              </div>
            </div>
            <div class="empty-state" *ngIf="dernieresVentes.length === 0 && !loading">
              Aucune vente récente
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h4>Actions Rapides</h4>
        <div class="actions-grid">
          <a routerLink="/sales" class="action-btn" style="--color: #ff6b00">
            <span>💰</span> Nouvelle Vente
          </a>
          <a routerLink="/supply" class="action-btn" style="--color: #3b82f6">
            <span>🛒</span> Approvisionnement
          </a>
          <a routerLink="/transfers" class="action-btn" style="--color: #10b981">
            <span>🔄</span> Transfert Stock
          </a>
          <a routerLink="/finance/depenses" class="action-btn" style="--color: #f59e0b">
            <span>💸</span> Enregistrer Dépense
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; }

    .welcome-banner {
      background: linear-gradient(135deg, #0a0f1e 0%, #1a1f3e 100%);
      border-radius: 16px; padding: 24px 28px;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
      border: 1px solid rgba(255,107,0,0.2);
    }
    .welcome-text h3 { color: white; margin: 0 0 4px; font-size: 20px; }
    .welcome-text p { color: rgba(255,255,255,0.5); margin: 0; font-size: 14px; }
    .welcome-date { color: rgba(255,255,255,0.4); font-size: 13px; }

    .section-title {
      font-size: 14px; color: #666; margin: 0 0 12px 4px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .kpi-section { margin-bottom: 20px; }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .kpi-card {
      background: white; border-radius: 14px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      transition: all 0.2s; border: 1px solid #f0f0f0;
      position: relative;
    }
    .kpi-card.clickable { cursor: pointer; }
    .kpi-card.clickable:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .kpi-icon {
      width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .kpi-value { font-size: 22px; font-weight: 800; color: #1a1a2e; line-height: 1.1; }
    .kpi-title { font-size: 12px; font-weight: 600; color: #555; margin-top: 3px; }
    .kpi-sub { font-size: 10px; color: #999; margin-top: 2px; }
    .kpi-arrow { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #ccc; font-size: 16px; }

    /* CHARTS ROW */
    .charts-row {
      display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 24px;
    }
    .card {
      background: white; border-radius: 16px; padding: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0f0f0;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .card-header h4 { margin: 0; font-size: 15px; color: #1a1a2e; }
    .see-all { color: #ff6b00; font-size: 13px; text-decoration: none; font-weight: 600; }
    .see-all:hover { text-decoration: underline; }

    /* Simple Bar Chart */
    .simple-bar-chart {
      display: flex; align-items: flex-end; justify-content: space-between;
      height: 180px; padding-top: 20px;
    }
    .bar-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      height: 100%;
    }
    .bar-wrapper {
      flex: 1; width: 100%; display: flex; align-items: flex-end;
      justify-content: center; padding: 0 4px;
    }
    .bar {
      width: 100%; max-width: 40px; border-radius: 6px 6px 0 0;
      min-height: 4px; position: relative; transition: height 0.3s ease;
    }
    .bar-value {
      position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
      font-size: 10px; font-weight: 600; color: #333; white-space: nowrap;
    }
    .bar-label {
      margin-top: 8px; font-size: 11px; color: #666; font-weight: 500;
    }

    /* Products List */
    .products-list { max-height: 200px; overflow-y: auto; }
    .product-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 0; border-bottom: 1px solid #f5f5f5;
    }
    .product-item:last-child { border-bottom: none; }
    .product-rank {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #ff6b00, #ff8f33);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .product-info { flex: 1; }
    .product-info strong { display: block; font-size: 13px; color: #1a1a2e; }
    .product-qty { font-size: 11px; color: #999; }
    .product-ca { font-size: 13px; font-weight: 700; color: #10b981; }

    /* Bottom Row */
    .dashboard-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;
    }
    .alerte-item, .vente-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #f5f5f5;
    }
    .alerte-item:last-child, .vente-item:last-child { border-bottom: none; }
    .alerte-info strong, .vente-info strong { display: block; font-size: 13px; color: #1a1a2e; }
    .alerte-info small, .vente-info small { color: #999; font-size: 11px; }
    .vente-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .vente-montant { font-size: 14px; font-weight: 700; color: #1a1a2e; }

    .badge {
      padding: 3px 8px; border-radius: 12px; font-size: 10px;
      font-weight: 700; text-transform: uppercase;
    }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-paye { background: #dcfce7; color: #16a34a; }
    .badge-partiel { background: #fef9c3; color: #ca8a04; }
    .badge-credit { background: #fee2e2; color: #dc2626; }

    .empty-state { text-align: center; padding: 24px; color: #999; font-size: 13px; }

    /* Quick Actions */
    .quick-actions h4 { margin: 0 0 12px; font-size: 15px; color: #1a1a2e; }
    .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .action-btn {
      background: white; border: 2px solid rgba(0,0,0,0.08);
      border-radius: 14px; padding: 16px;
      text-decoration: none; color: #333;
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover {
      border-color: var(--color);
      background: color-mix(in srgb, var(--color) 8%, white);
      color: var(--color);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px color-mix(in srgb, var(--color) 20%, transparent);
    }
    .action-btn span { font-size: 20px; }

    @media (max-width: 1024px) {
      .charts-row, .dashboard-row { grid-template-columns: 1fr; }
      .actions-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = true;
  today = new Date();
  
  // Auto-refresh
  private refreshInterval: any;
  private routeSubscription: any;
  
  // KPIs
  todayKpis: KpiCard[] = [];
  monthKpis: KpiCard[] = [];
  
  // Data
  alertesStock: any[] = [];
  dernieresVentes: any[] = [];
  ventes7Jours: VenteJour[] = [];
  topProduits: ProduitVendu[] = [];
  
  // Stats from API
  statsVentes: any = {};

  constructor(
    private stockService: StockService,
    private venteService: VenteService,
    private logisticsService: LogisticsService,
    private financeService: FinanceService,
    private produitService: ProduitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadDashboard();
    }, 30000);
    
    // Refresh when returning to dashboard from other pages
    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Check if we're on dashboard
      if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        this.loadDashboard();
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadDashboard(): void {
    forkJoin({
      stocks: this.stockService.stats(),
      ventes: this.venteService.stats(),
      engins: this.logisticsService.statsEngins(),
      produits: this.produitService.list({ page_size: 1 }),
      ventes_list: this.venteService.list({ page_size: 5, ordering: '-date_vente' })
    }).subscribe({
      next: (data) => {
        this.statsVentes = data.ventes;
        this.buildTodayKpis(data.ventes);
        this.buildMonthKpis(data.ventes, data.stocks);
        this.ventes7Jours = data.ventes.ventes_7_derniers_jours || [];
        this.topProduits = data.ventes.produits_plus_vendus?.slice(0, 5) || [];
        this.dernieresVentes = data.ventes_list.results || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // Alertes stock
    this.stockService.list().subscribe(data => {
      const stocks = data.results || [];
      stocks.forEach(stock => {
        this.stockService.alertes(stock.id).subscribe(alertes => {
          this.alertesStock.push(...alertes.map((a: any) => ({ ...a, stock_nom: stock.nom })));
        });
      });
    });
  }

  private buildTodayKpis(stats: any): void {
    const todayStats = stats.ventes_aujourdhui || { nombre: 0, chiffre_affaires: 0, clients_servis: 0 };
    this.todayKpis = [
      {
        title: "Ventes aujourd'hui",
        value: todayStats.nombre,
        subtitle: 'transactions',
        icon: '🛒',
        color: '#ff6b00',
        route: '/sales'
      },
      {
        title: "CA aujourd'hui",
        value: this.formatMoney(todayStats.chiffre_affaires),
        subtitle: 'chiffre d\'affaires',
        icon: '💰',
        color: '#10b981',
        route: '/sales'
      },
      {
        title: 'Clients servis',
        value: todayStats.clients_servis || 0,
        subtitle: 'ce jour',
        icon: '👥',
        color: '#3b82f6',
        route: '/sales'
      }
    ];
  }

  private buildMonthKpis(ventes: any, stocks: any): void {
    this.monthKpis = [
      {
        title: 'CA du Mois',
        value: this.formatMoney(ventes.chiffre_affaires_mois),
        subtitle: `${this.formatMoney(ventes.chiffre_affaires_total)} total`,
        icon: '📊',
        color: '#10b981',
        route: '/sales'
      },
      {
        title: 'Stocks Actifs',
        value: stocks.actifs || 0,
        subtitle: `${stocks.total || 0} au total`,
        icon: '🏭',
        color: '#3b82f6',
        route: '/stocks'
      },
      {
        title: 'Alertes Stock',
        value: stocks.alertes_stock || 0,
        subtitle: 'Produits en rupture',
        icon: '⚠️',
        color: '#ef4444',
        route: '/stocks'
      },
      {
        title: 'Ventes en Crédit',
        value: ventes.en_credit || 0,
        subtitle: `${this.formatMoney(ventes.montant_credit_total)} dus`,
        icon: '📋',
        color: '#f59e0b',
        route: '/sales'
      }
    ];
  }

  getBarHeight(value: number): number {
    if (!this.ventes7Jours.length) return 10;
    const max = Math.max(...this.ventes7Jours.map(v => v.chiffre_affaires));
    if (max === 0) return 10;
    return Math.max(10, (value / max) * 100);
  }

  formatMoney(value: number): string {
    if (!value) return '0 FCA';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M FCA';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K FCA';
    return value.toFixed(0) + ' FCA';
  }
}
