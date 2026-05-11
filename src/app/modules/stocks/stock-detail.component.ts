import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DataTableComponent],
  template: `
    <div class="page-container" *ngIf="stock">
      <div class="page-header">
        <div>
          <a routerLink="/stocks" class="back-link">← Retour</a>
          <h3>🏭 {{ stock.nom }}</h3>
          <p class="subtitle">Zone: {{ stock.zone_nom }} | {{ stock.adresse }}</p>
        </div>
      </div>

      <!-- Finance Cards -->
      <div class="finance-cards">
        <div class="f-card caisse">
          <div class="f-icon">🏦</div>
          <div>
            <strong>{{ stock.solde_caisse | number:'1.0-0' }} FCFA</strong>
            <small>Solde Caisse</small>
          </div>
        </div>
        <div class="f-card om">
          <div class="f-icon">📱</div>
          <div>
            <strong>{{ stock.solde_orange_money | number:'1.0-0' }} FCFA</strong>
            <small>Orange Money</small>
          </div>
        </div>
        <div class="f-card produits">
          <div class="f-icon">📦</div>
          <div>
            <strong>{{ stock.nombre_produits }}</strong>
            <small>Produits en stock</small>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'inventaire'" (click)="activeTab = 'inventaire'">📦 Inventaire</button>
        <button class="tab-btn" [class.active]="activeTab === 'alertes'" (click)="activeTab = 'alertes'; loadAlertes()">⚠️ Alertes</button>
        <button class="tab-btn" [class.active]="activeTab === 'ruptures'" (click)="activeTab = 'ruptures'; loadRuptures()">❌ Ruptures</button>
      </div>

      <div *ngIf="activeTab === 'inventaire'">
        <!-- Search/Filter -->
        <div class="filter-row" style="margin-bottom: 16px;">
          <input type="text" [(ngModel)]="searchInventaire" (input)="filterInventaire()" placeholder="Rechercher un produit..." class="search-input" style="max-width: 300px; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        <app-data-table
          [columns]="inventaireColumns"
          [data]="filteredInventaire"
          [loading]="loading"
          [totalCount]="filteredInventaire.length">
        </app-data-table>
      </div>

      <div *ngIf="activeTab === 'alertes'">
        <div *ngIf="alertes.length === 0 && !loading" class="empty-state" style="text-align: center; padding: 40px; background: #fffbeb; border-radius: 8px;">
          <p style="color: #92400e;">Aucun produit en alerte de stock</p>
        </div>
        <app-data-table
          *ngIf="alertes.length > 0"
          [columns]="alerteColumns"
          [data]="alertes"
          [loading]="loading"
          [totalCount]="alertes.length">
        </app-data-table>
      </div>

      <div *ngIf="activeTab === 'ruptures'">
        <div *ngIf="ruptures.length === 0 && !loading" class="empty-state" style="text-align: center; padding: 40px; background: #d1fae5; border-radius: 8px;">
          <p style="color: #065f46;">✅ Aucun produit en rupture de stock</p>
        </div>
        <app-data-table
          *ngIf="ruptures.length > 0"
          [columns]="ruptureColumns"
          [data]="ruptures"
          [loading]="loading"
          [totalCount]="ruptures.length">
        </app-data-table>
      </div>
    </div>
  `,
  styles: [`
    .back-link { color: #ff6b00; text-decoration: none; font-size: 13px; display: block; margin-bottom: 8px; }
    .finance-cards { display: flex; gap: 16px; margin-bottom: 24px; }
    .f-card {
      flex: 1; background: white; border-radius: 14px; padding: 18px 20px;
      display: flex; align-items: center; gap: 14px;
      border: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .f-card.caisse { border-color: #a7f3d0; }
    .f-card.om { border-color: #fde68a; }
    .f-icon { font-size: 28px; }
    .f-card strong { display: block; font-size: 20px; font-weight: 800; }
    .f-card small { color: #999; font-size: 12px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; background: white; padding: 6px; border-radius: 10px; width: fit-content; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .tab-btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; background: none; color: #666; transition: all 0.2s; }
    .tab-btn.active { background: linear-gradient(135deg, #ff6b00, #ff9500); color: white; }
  `]
})
export class StockDetailComponent implements OnInit {
  stock: any = null;
  inventaire: any[] = [];
  filteredInventaire: any[] = [];
  alertes: any[] = [];
  ruptures: any[] = [];
  loading = false;
  activeTab = 'inventaire';
  searchInventaire = '';

  inventaireColumns: TableColumn[] = [
    { key: 'produit_nom', label: 'Produit' },
    { key: 'produit_unite', label: 'Unité' },
    { key: 'quantite', label: 'Quantité' },
    { key: 'quantite_minimale', label: 'Qté Min.' },
    { key: 'valeur_stock', label: 'Valeur Stock', type: 'money' },
  ];

  alerteColumns: TableColumn[] = [
    { key: 'produit_nom', label: 'Produit' },
    { key: 'quantite', label: 'Quantité Actuelle' },
    { key: 'quantite_minimale', label: 'Qté Minimale' },
    { key: 'valeur_stock', label: 'Valeur', type: 'money' },
  ];

  ruptureColumns: TableColumn[] = [
    { key: 'produit_nom', label: 'Produit' },
    { key: 'quantite', label: 'Quantité' },
    { key: 'produit_unite', label: 'Unité' },
  ];

  constructor(private route: ActivatedRoute, private stockService: StockService) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.loadStock(id);
  }

  loadStock(id: number): void {
    this.loading = true;
    this.stockService.get_(id).subscribe(stock => {
      this.stock = stock;
      this.stockService.inventaire(id).subscribe(inv => {
        this.inventaire = inv;
        this.filteredInventaire = inv;
        this.loading = false;
      });
    });
  }

  loadAlertes(): void {
    if (!this.stock) return;
    this.stockService.alertes(this.stock.id).subscribe(a => this.alertes = a);
  }

  loadRuptures(): void {
    if (!this.stock) return;
    this.stockService.ruptures(this.stock.id).subscribe(r => this.ruptures = r);
  }

  filterInventaire(): void {
    if (!this.searchInventaire) {
      this.filteredInventaire = this.inventaire;
      return;
    }
    const term = this.searchInventaire.toLowerCase();
    this.filteredInventaire = this.inventaire.filter((item: any) =>
      item.produit_nom.toLowerCase().includes(term)
    );
  }
}
