import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../core/services/api.service';

@Component({
  selector: 'app-orange-money',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>📱 Comptes Orange Money</h3>
          <p class="subtitle">Suivi des comptes Orange Money par stock</p>
        </div>
      </div>
      <div class="soldes-grid">
        <div class="solde-card" *ngFor="let c of comptes">
          <div class="solde-header">
            <span class="solde-icon">📱</span>
            <div>
              <strong>{{ c.nom }}</strong>
              <small>{{ c.numero }} | {{ c.stock_nom }}</small>
            </div>
          </div>
          <div class="solde-amount om">{{ c.solde | number:'1.0-0' }} FCA</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .soldes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .solde-card { background: white; border-radius: 14px; padding: 20px; border: 1px solid #fde68a; }
    .solde-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .solde-icon { font-size: 24px; }
    .solde-header strong { display: block; font-size: 14px; }
    .solde-header small { color: #999; font-size: 12px; }
    .solde-amount { font-size: 26px; font-weight: 800; }
    .solde-amount.om { color: #f59e0b; }
  `]
})
export class OrangeMoneyComponent implements OnInit {
  comptes: any[] = [];
  loading = false;

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loading = true;
    this.financeService.orangeMoney().subscribe({
      next: d => { this.comptes = d.results || d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
