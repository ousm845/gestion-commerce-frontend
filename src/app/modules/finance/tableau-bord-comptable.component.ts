import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../core/services/api.service';

@Component({
  selector: 'app-tableau-bord-comptable',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>📊 Tableau de Bord Comptable</h3>
          <p class="subtitle">Suivi des revenus, dépenses et bénéfices</p>
        </div>
        <div class="periode-badge">{{ data?.periode?.mois || 'Chargement...' }}</div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <!-- Revenus -->
        <div class="kpi-card revenue">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <span class="kpi-label">Revenus du mois</span>
            <span class="kpi-value">{{ data?.revenus?.mois | number:'1.0-0' }} FCA</span>
            <span class="kpi-sub">Année: {{ data?.revenus?.annee | number:'1.0-0' }} FCA</span>
          </div>
        </div>

        <!-- Dépenses -->
        <div class="kpi-card expense">
          <div class="kpi-icon">💸</div>
          <div class="kpi-content">
            <span class="kpi-label">Dépenses du mois</span>
            <span class="kpi-value">{{ data?.depenses?.mois | number:'1.0-0' }} FCA</span>
            <span class="kpi-sub">Année: {{ data?.depenses?.annee | number:'1.0-0' }} FCA</span>
          </div>
        </div>

        <!-- Salaires -->
        <div class="kpi-card salary">
          <div class="kpi-icon">👥</div>
          <div class="kpi-content">
            <span class="kpi-label">Salaires du mois</span>
            <span class="kpi-value">{{ data?.salaires?.mois | number:'1.0-0' }} FCA</span>
            <span class="kpi-sub">Année: {{ data?.salaires?.annee | number:'1.0-0' }} FCA</span>
          </div>
        </div>

        <!-- Bénéfice Net -->
        <div class="kpi-card" [class.profit]="(data?.beneficiaire?.mois || 0) >= 0" [class.loss]="(data?.beneficiaire?.mois || 0) < 0">
          <div class="kpi-icon">{{ (data?.beneficiaire?.mois || 0) >= 0 ? '📈' : '📉' }}</div>
          <div class="kpi-content">
            <span class="kpi-label">Bénéfice Net (Mois)</span>
            <span class="kpi-value">{{ data?.beneficiaire?.mois | number:'1.0-0' }} FCA</span>
            <span class="kpi-sub">Marge: {{ data?.beneficiaire?.marge_mois || 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Graphique et Détails -->
      <div class="content-grid">
        <!-- Graphique -->
        <div class="chart-card">
          <h4>📊 Évolution Revenus vs Dépenses (6 derniers mois)</h4>
          <div class="chart-container" #chartContainer>
            <canvas #chartCanvas></canvas>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="dot revenue"></span> Revenus</span>
            <span class="legend-item"><span class="dot expense"></span> Dépenses</span>
            <span class="legend-item"><span class="dot profit"></span> Bénéfice</span>
          </div>
        </div>

        <!-- Charges -->
        <div class="charges-card">
          <h4>📋 Détail des Charges du Mois</h4>
          <div class="charges-list">
            <div class="charge-item">
              <span class="charge-label">🏠 Loyer</span>
              <span class="charge-value">{{ data?.charges?.loyer | number:'1.0-0' }} FCA</span>
            </div>
            <div class="charge-item">
              <span class="charge-label">⚡ Électricité</span>
              <span class="charge-value">{{ data?.charges?.electricite | number:'1.0-0' }} FCA</span>
            </div>
            <div class="charge-item">
              <span class="charge-label">💧 Eau</span>
              <span class="charge-value">{{ data?.charges?.eau | number:'1.0-0' }} FCA</span>
            </div>
            <div class="charge-item">
              <span class="charge-label">🌐 Internet/Téléphone</span>
              <span class="charge-value">{{ data?.charges?.internet | number:'1.0-0' }} FCA</span>
            </div>
            <div class="charge-item">
              <span class="charge-label">👥 Salaires</span>
              <span class="charge-value">{{ data?.salaires?.mois | number:'1.0-0' }} FCA</span>
            </div>
            <div class="charge-item">
              <span class="charge-label">📦 Autres charges</span>
              <span class="charge-value">{{ data?.charges?.autres | number:'1.0-0' }} FCA</span>
            </div>
            <div class="charge-item total">
              <span class="charge-label">💰 Total Charges</span>
              <span class="charge-value">{{ totalCharges | number:'1.0-0' }} FCA</span>
            </div>
          </div>

          <!-- Résumé -->
          <div class="summary-box" [class.positive]="(data?.beneficiaire?.mois || 0) >= 0" [class.negative]="(data?.beneficiaire?.mois || 0) < 0">
            <div class="summary-title">{{ (data?.beneficiaire?.mois || 0) >= 0 ? '🎉 ENTREPRISE PROFITABLE' : '⚠️ ENTREPRISE DÉFICITAIRE' }}</div>
            <div class="summary-amount">
              {{ (data?.beneficiaire?.mois || 0) >= 0 ? 'Bénéfice' : 'Déficit' }}: {{ data?.beneficiaire?.mois | number:'1.0-0' }} FCA
            </div>
            <div class="summary-message">
              {{ (data?.beneficiaire?.mois || 0) >= 0 
                ? 'Félicitations ! Votre entreprise génère des profits.'
                : 'Attention : Les dépenses dépassent les revenus. Analyser les charges.' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Dépenses par catégorie -->
      <div class="categories-card">
        <h4>📈 Répartition des Dépenses par Catégorie</h4>
        <div class="categories-grid">
          <div class="category-item" *ngFor="let cat of depensesParCategorie">
            <div class="category-bar" [style.width.%]="getCategoryPercent(cat.total)"></div>
            <div class="category-info">
              <span class="category-name">{{ getCategoryLabel(cat.categorie) }}</span>
              <span class="category-amount">{{ cat.total | number:'1.0-0' }} FCA</span>
            </div>
          </div>
          <div class="no-data" *ngIf="depensesParCategorie.length === 0">
           Aucune dépense enregistrée ce mois
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .periode-badge { background: #e9ecef; padding: 8px 16px; border-radius: 20px; font-weight: 600; color: #495057; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card { 
      background: white; border-radius: 12px; padding: 20px; display: flex; gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #dee2e6;
    }
    .kpi-card.revenue { border-color: #28a745; }
    .kpi-card.expense { border-color: #dc3545; }
    .kpi-card.salary { border-color: #ffc107; }
    .kpi-card.profit { border-color: #28a745; }
    .kpi-card.loss { border-color: #dc3545; }
    
    .kpi-icon { font-size: 32px; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-label { font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 24px; font-weight: 800; color: #212529; margin: 4px 0; }
    .kpi-sub { font-size: 11px; color: #adb5bd; }
    
    .content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-bottom: 24px; }
    
    .chart-card, .charges-card, .categories-card { 
      background: white; border-radius: 12px; padding: 20px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); 
    }
    .chart-card h4, .charges-card h4, .categories-card h4 { 
      margin: 0 0 16px; font-size: 16px; color: #343a40; 
    }
    
    .chart-container { height: 250px; position: relative; }
    .chart-legend { display: flex; gap: 20px; justify-content: center; margin-top: 12px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot.revenue { background: #28a745; }
    .dot.expense { background: #dc3545; }
    .dot.profit { background: #007bff; }
    
    .charges-list { margin-bottom: 16px; }
    .charge-item { 
      display: flex; justify-content: space-between; padding: 10px 0; 
      border-bottom: 1px solid #f1f3f5; 
    }
    .charge-item.total { border-top: 2px solid #343a40; border-bottom: none; font-weight: 700; font-size: 16px; margin-top: 8px; padding-top: 16px; }
    .charge-label { color: #495057; }
    .charge-value { font-weight: 600; }
    
    .summary-box { 
      border-radius: 12px; padding: 16px; text-align: center; 
    }
    .summary-box.positive { background: #d4edda; border: 2px solid #28a745; }
    .summary-box.negative { background: #f8d7da; border: 2px solid #dc3545; }
    .summary-title { font-weight: 800; font-size: 14px; margin-bottom: 8px; }
    .summary-box.positive .summary-title { color: #155724; }
    .summary-box.negative .summary-title { color: #721c24; }
    .summary-amount { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .summary-box.positive .summary-amount { color: #28a745; }
    .summary-box.negative .summary-amount { color: #dc3545; }
    .summary-message { font-size: 13px; opacity: 0.8; }
    
    .categories-grid { display: grid; gap: 12px; }
    .category-item { position: relative; }
    .category-bar { 
      position: absolute; left: 0; top: 0; bottom: 0; 
      background: linear-gradient(90deg, #e9ecef, #adb5bd); 
      border-radius: 4px; opacity: 0.3; 
    }
    .category-info { 
      position: relative; display: flex; justify-content: space-between; 
      padding: 8px 12px; 
    }
    .category-name { font-weight: 500; }
    .category-amount { font-weight: 600; }
    .no-data { text-align: center; color: #adb5bd; padding: 20px; }

    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TableauBordComptableComponent implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  data: any = null;
  loading = true;
  
  constructor(private financeService: FinanceService) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.financeService.tableauBordComptable().subscribe({
      next: d => { 
        this.data = d; 
        this.loading = false;
        setTimeout(() => this.drawChart(), 100);
      },
      error: () => { this.loading = false; }
    });
  }
  
  get totalCharges(): number {
    if (!this.data) return 0;
    return (this.data.charges?.loyer || 0) + 
           (this.data.charges?.electricite || 0) + 
           (this.data.charges?.eau || 0) + 
           (this.data.charges?.internet || 0) + 
           (this.data.salaires?.mois || 0) + 
           (this.data.charges?.autres || 0);
  }
  
  get depensesParCategorie(): any[] {
    return this.data?.depenses?.par_categorie || [];
  }
  
  getCategoryPercent(total: number): number {
    if (!this.data?.depenses?.mois) return 0;
    return Math.min(100, (total / this.data.depenses.mois) * 100);
  }
  
  getCategoryLabel(categorie: string): string {
    const labels: Record<string, string> = {
      'salaire': 'Salaires',
      'carburant': 'Carburant',
      'maintenance': 'Maintenance',
      'loyer': 'Loyer',
      'fournitures': 'Fournitures',
      'transport': 'Transport',
      'autre': 'Autres'
    };
    return labels[categorie] || categorie;
  }
  
  drawChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas || !this.data?.graphique_mensuel) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const data = this.data.graphique_mensuel;
    const width = canvas.parentElement?.clientWidth || 600;
    const height = 250;
    
    canvas.width = width;
    canvas.height = height;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const maxValue = Math.max(
      ...data.map((d: any) => Math.max(d.revenus, d.depenses, Math.abs(d.beneficiaire)))
    ) || 1000;
    
    const barWidth = chartWidth / data.length * 0.7;
    const barGap = chartWidth / data.length * 0.3;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw bars
    data.forEach((d: any, i: number) => {
      const x = padding + i * (barWidth + barGap) + barGap / 2;
      
      // Revenus (green)
      const revenusHeight = (d.revenus / maxValue) * chartHeight;
      ctx.fillStyle = '#28a745';
      ctx.fillRect(x, height - padding - revenusHeight, barWidth, revenusHeight);
      
      // Dépenses (red)
      const depensesHeight = (d.depenses / maxValue) * chartHeight;
      ctx.fillStyle = '#dc3545';
      ctx.fillRect(x + barWidth + 2, height - padding - depensesHeight, barWidth, depensesHeight);
      
      // Month label
      ctx.fillStyle = '#495057';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.mois, x + barWidth, height - 15);
    });
  }
}
