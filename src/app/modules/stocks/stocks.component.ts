import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService, ZoneService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🏭 Stocks & Dépôts</h3>
          <p class="subtitle">Gestion de vos entrepôts</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouveau Stock</button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid" *ngIf="!loading">
        <div class="summary-card">
          <span class="s-icon">🏭</span>
          <div><strong>{{ stats?.total || 0 }}</strong><small>Total Stocks</small></div>
        </div>
        <div class="summary-card">
          <span class="s-icon">✅</span>
          <div><strong>{{ stats?.actifs || 0 }}</strong><small>Actifs</small></div>
        </div>
        <div class="summary-card warn">
          <span class="s-icon">⚠️</span>
          <div><strong>{{ stats?.alertes_stock || 0 }}</strong><small>Alertes Stock</small></div>
        </div>
        <div class="summary-card danger">
          <span class="s-icon">❌</span>
          <div><strong>{{ stats?.ruptures_stock || 0 }}</strong><small>Ruptures</small></div>
        </div>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="stocks"
        [loading]="loading"
        [totalCount]="totalCount"
        [currentPage]="currentPage"
        [rowClickable]="true"
        (search)="onSearch($event)"
        (pageChange)="onPageChange($event)"
        (rowClick)="onRowClick($event)"
        (edit)="onEdit($event)"
        (delete)="onDelete($event)">
      </app-data-table>

      <!-- Modal Ajout/Edit -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier le Stock' : 'Nouveau Stock' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="stockForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label>Nom du Stock *</label>
              <input type="text" formControlName="nom" placeholder="Ex: Dépôt Central" />
            </div>
            <div class="form-group">
              <label>Zone *</label>
              <select formControlName="zone">
                <option value="">— Sélectionner une zone —</option>
                <option *ngFor="let z of zones" [value]="z.id">{{ z.nom }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Adresse</label>
                <input type="text" formControlName="adresse" placeholder="Adresse" />
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" formControlName="telephone" placeholder="Téléphone" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="stockForm.invalid || saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-grid { display: flex; gap: 14px; margin-bottom: 24px; }
    .summary-card {
      background: white; border-radius: 12px; padding: 16px 20px;
      display: flex; align-items: center; gap: 12px;
      border: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .summary-card.warn { border-color: #fde68a; background: #fffbeb; }
    .summary-card.danger { border-color: #fecaca; background: #fef2f2; }
    .s-icon { font-size: 24px; }
    .summary-card strong { display: block; font-size: 22px; color: #1a1a2e; }
    .summary-card small { color: #999; font-size: 12px; }
  `]
})
export class StocksComponent implements OnInit {
  stocks: any[] = [];
  zones: any[] = [];
  loading = false;
  saving = false;
  totalCount = 0;
  currentPage = 1;
  showForm = false;
  editing: any = null;
  searchTerm = '';
  stats: any = {};
  stockForm!: FormGroup;

  columns: TableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'zone_nom', label: 'Zone' },
    { key: 'nombre_produits', label: 'Produits' },
    { key: 'solde_caisse', label: 'Caisse (FCFA)', type: 'money' },
    { key: 'solde_orange_money', label: 'Orange Money', type: 'money' },
    { key: 'is_active', label: 'Statut', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private stockService: StockService, private zoneService: ZoneService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.loadStats();
    this.loadZones();
  }

  buildForm(stock?: any): void {
    this.stockForm = this.fb.group({
      nom: [stock?.nom || '', Validators.required],
      zone: [stock?.zone || '', Validators.required],
      adresse: [stock?.adresse || ''],
      telephone: [stock?.telephone || '']
    });
  }

  load(): void {
    this.loading = true;
    this.stockService.list({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: data => { this.stocks = data.results; this.totalCount = data.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadStats(): void { this.stockService.stats().subscribe(s => this.stats = s); }
  loadZones(): void { this.zoneService.list({ is_active: true, page_size: 100 }).subscribe(d => this.zones = d.results); }

  onSearch(term: string): void { this.searchTerm = term; this.currentPage = 1; this.load(); }
  onPageChange(page: number): void { this.currentPage = page; this.load(); }
  onRowClick(stock: any): void { /* Navigate to detail */ }

  openForm(stock?: any): void { this.editing = stock || null; this.buildForm(stock); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(stock: any): void { this.openForm(stock); }

  onDelete(stock: any): void {
    if (confirm(`Supprimer le stock "${stock.nom}" ?`)) {
      this.stockService.delete_(stock.id).subscribe(() => this.load());
    }
  }

  onSubmit(): void {
    if (this.stockForm.invalid) return;
    this.saving = true;
    const obs = this.editing
      ? this.stockService.update(this.editing.id, this.stockForm.value)
      : this.stockService.create(this.stockForm.value);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); this.loadStats(); }, error: () => { this.saving = false; } });
  }
}
