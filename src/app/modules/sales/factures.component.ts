import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FactureService, VenteService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>📄 Factures</h3>
          <p class="subtitle">Gestion des factures clients</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalFactures }}</div>
          <div class="stat-label">Total Factures</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ montantTotal | number:'1.0-0' }}</div>
          <div class="stat-label">Montant Total</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">{{ facturesNonReglees }}</div>
          <div class="stat-label">Non Réglées</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ montantRegle | number:'1.0-0' }}</div>
          <div class="stat-label">Montant Réglé</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input type="text" placeholder="Rechercher une facture..." 
               [(ngModel)]="searchTerm" (input)="onSearch()" class="search-input">
        <select [(ngModel)]="statutFilter" (change)="load()" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="proforma">Proforma</option>
          <option value="reglee">Réglée</option>
          <option value="partiel">Partiellement Réglée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      <app-data-table
        [columns]="columns" [data]="factures" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (pageChange)="onPageChange($event)">
      </app-data-table>

      <!-- Facture Detail Modal -->
      <div class="modal-overlay" *ngIf="showDetail" (click)="showDetail=false">
        <div class="modal-card modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>📄 Facture {{ selectedFacture?.numero_facture }}</h4>
            <button class="close-btn" (click)="showDetail=false">✕</button>
          </div>
          
          <div class="facture-preview" *ngIf="selectedFacture">
            <!-- Header -->
            <div class="facture-header-info">
              <div class="company-info">
                <h2>SYLIDIGIT</h2>
                <p>Gestion Commerciale Intégrée</p>
              </div>
              <div class="facture-info">
                <p><strong>Date:</strong> {{ selectedFacture.date_facture | date:'dd/MM/yyyy' }}</p>
                <p><strong>Statut:</strong> 
                  <span class="badge" [class]="selectedFacture.statut">{{ selectedFacture.statut }}</span>
                </p>
              </div>
            </div>

            <!-- Client Info -->
            <div class="client-info">
              <h4>Client:</h4>
              <p><strong>{{ selectedFacture.client_nom }}</strong></p>
              <p *ngIf="selectedFacture.client_adresse">{{ selectedFacture.client_adresse }}</p>
              <p *ngIf="selectedFacture.client_telephone">Tél: {{ selectedFacture.client_telephone }}</p>
              <p *ngIf="selectedFacture.client_nif">NIF: {{ selectedFacture.client_nif }}</p>
              <p *ngIf="selectedFacture.client_stat">STAT: {{ selectedFacture.client_stat }}</p>
            </div>

            <!-- Lines -->
            <table class="facture-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qt</th>
                  <th>Prix Unit.</th>
                  <th>Remise</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ligne of selectedFacture.lignes">
                  <td>{{ ligne.produit_nom }}</td>
                  <td>{{ ligne.quantite }} {{ ligne.unite }}</td>
                  <td>{{ ligne.prix_unitaire | number:'1.0-0' }}</td>
                  <td>{{ ligne.remise }}%</td>
                  <td>{{ ligne.montant_net | number:'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="facture-totals">
              <div class="total-row">
                <span>Sous-total:</span>
                <span>{{ selectedFacture.sous_total | number:'1.0-0' }} FCA</span>
              </div>
              <div class="total-row">
                <span>Remise:</span>
                <span>- {{ selectedFacture.total_remise | number:'1.0-0' }} FCA</span>
              </div>
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>{{ selectedFacture.montant_total | number:'1.0-0' }} FCA</span>
              </div>
              <div class="total-row" *ngIf="selectedFacture.montant_paye > 0">
                <span>Payé:</span>
                <span class="success">{{ selectedFacture.montant_paye | number:'1.0-0' }} FCA</span>
              </div>
              <div class="total-row" *ngIf="selectedFacture.montant_restant > 0">
                <span>Reste:</span>
                <span class="warning">{{ selectedFacture.montant_restant | number:'1.0-0' }} FCA</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="facture-actions">
              <button class="btn btn-primary" (click)="telechargerFacture(selectedFacture)">
                📥 Télécharger PDF
              </button>
              <button class="btn btn-secondary" (click)="showDetail=false">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--card-bg); padding: 1.25rem; border-radius: 8px; text-align: center; }
    .stat-card.warning { border-left: 4px solid #f59e0b; }
    .stat-card.success { border-left: 4px solid #10b981; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
    .stat-label { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem; }
    .filters-bar { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .search-input { flex: 1; padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 6px; }
    .filter-select { padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 6px; min-width: 200px; }
    .modal-large { max-width: 800px; }
    .facture-preview { padding: 1rem; }
    .facture-header-info { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .company-info h2 { color: #2563eb; margin: 0; }
    .facture-info { text-align: right; }
    .client-info { background: #f8fafc; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; }
    .facture-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    .facture-table th, .facture-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    .facture-table th { background: #f1f5f9; font-weight: 600; }
    .facture-totals { text-align: right; margin-bottom: 1.5rem; }
    .total-row { display: flex; justify-content: flex-end; gap: 2rem; padding: 0.5rem 0; }
    .total-row.final { font-size: 1.25rem; font-weight: 700; border-top: 2px solid var(--text-primary); margin-top: 0.5rem; padding-top: 0.75rem; }
    .total-row .success { color: #10b981; }
    .total-row .warning { color: #f59e0b; }
    .facture-actions { display: flex; gap: 1rem; justify-content: flex-end; }
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.proforma { background: #fef3c7; color: #92400e; }
    .badge.reglee { background: #d1fae5; color: #065f46; }
    .badge.partiel { background: #dbeafe; color: #1e40af; }
    .badge.annulee { background: #fee2e2; color: #991b1b; }
  `]
})
export class FacturesComponent implements OnInit {
  factures: any[] = [];
  selectedFacture: any = null;
  loading = false;
  totalCount = 0;
  currentPage = 1;
  searchTerm = '';
  statutFilter = '';
  showDetail = false;

  // Stats
  totalFactures = 0;
  montantTotal = 0;
  facturesNonReglees = 0;
  montantRegle = 0;

  columns: TableColumn[] = [
    { key: 'numero_facture', label: 'N° Facture' },
    { key: 'vente_numero', label: 'Vente' },
    { key: 'client_nom', label: 'Client' },
    { key: 'montant_total', label: 'Montant', type: 'money' },
    { key: 'montant_paye', label: 'Payé', type: 'money' },
    { key: 'montant_restant', label: 'Reste', type: 'money' },
    { key: 'statut', label: 'Statut' },
    { key: 'date_facture', label: 'Date', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(
    private factureService: FactureService,
    private venteService: VenteService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const params: any = { page: this.currentPage };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statutFilter) params.statut = this.statutFilter;

    this.factureService.list(params).subscribe({
      next: (data: any) => {
        this.factures = data.results;
        this.totalCount = data.count;
        this.loading = false;
        this.updateStats();
      },
      error: () => { this.loading = false; }
    });
  }

  updateStats(): void {
    this.totalFactures = this.factures.length;
    this.montantTotal = this.factures.reduce((sum, f) => sum + Number(f.montant_total), 0);
    this.facturesNonReglees = this.factures.filter(f => f.statut !== 'reglee').length;
    this.montantRegle = this.factures.reduce((sum, f) => sum + Number(f.montant_paye), 0);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.load();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.load();
  }

  voirDetail(facture: any): void {
    this.selectedFacture = facture;
    this.showDetail = true;
  }

  telechargerFacture(facture: any): void {
    this.factureService.TELECHARGER(facture.id).subscribe({
      next: (data) => {
        // Logique de téléchargement PDF à implémenter
        console.log('Facture data:', data);
        alert('Génération du PDF en cours...');
      },
      error: () => {
        alert('Erreur lors de la génération du PDF');
      }
    });
  }
}
