import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TransfertService, StockService, ProduitService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🔄 Transferts Inter-Stocks</h3>
          <p class="subtitle">Déplacez des produits entre vos dépôts</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouveau Transfert</button>
      </div>

      <app-data-table
        [columns]="columns" [data]="transferts" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="viewDetail($event)" (delete)="onDelete($event)">
      </app-data-table>

      <!-- Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card modal-card-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>🔄 Nouveau Transfert</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Stock Source *</label>
                <select formControlName="stock_source">
                  <option value="">— Sélectionner source —</option>
                  <option *ngFor="let s of stocks" [value]="s.id">{{ s.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Stock Destination *</label>
                <select formControlName="stock_destination">
                  <option value="">— Sélectionner destination —</option>
                  <option *ngFor="let s of stocks" [value]="s.id">{{ s.nom }}</option>
                </select>
              </div>
            </div>

            <div class="section-title">Produits à transférer</div>
            <div formArrayName="lignes">
              <div *ngFor="let ligne of lignesArray.controls; let i = index" [formGroupName]="i" class="ligne-form">
                <div class="form-row" style="grid-template-columns: 2fr 1fr auto; align-items: end">
                  <div class="form-group">
                    <label>Produit *</label>
                    <select formControlName="produit">
                      <option value="">— Produit —</option>
                      <option *ngFor="let p of produits" [value]="p.id">{{ p.nom }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Quantité *</label>
                    <input type="number" formControlName="quantite" min="0.01" step="0.01" />
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeLigne(i)">✕</button>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-secondary" (click)="addLigne()">+ Ajouter Produit</button>

            <div class="form-group" style="margin-top:16px">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving || !lignesArray.length">
                {{ saving ? '...' : 'Créer le Transfert' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedTransfert" (click)="selectedTransfert = null">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>Transfert {{ selectedTransfert.numero }}</h4>
            <button class="close-btn" (click)="selectedTransfert = null">✕</button>
          </div>
          <div style="padding: 0 24px 24px">
            <p>{{ selectedTransfert.source_nom }} → {{ selectedTransfert.destination_nom }}</p>
            <p><span class="badge badge-{{ selectedTransfert.statut }}">{{ selectedTransfert.statut_display }}</span></p>
            <table class="detail-table" style="margin-top:16px">
              <thead><tr><th>Produit</th><th>Quantité</th><th>Unité</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of selectedTransfert.lignes">
                  <td>{{ l.produit_nom }}</td>
                  <td>{{ l.quantite }}</td>
                  <td>{{ l.produit_unite }}</td>
                </tr>
              </tbody>
            </table>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedTransfert = null">Fermer</button>
              <button *ngIf="selectedTransfert.statut === 'en_attente'" class="btn btn-success" (click)="confirmer(selectedTransfert)">✓ Confirmer & Transférer</button>
              <button *ngIf="selectedTransfert.statut === 'en_attente'" class="btn btn-danger" (click)="annuler(selectedTransfert)">✕ Annuler</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-title { font-size: 13px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 10px; }
    .ligne-form { background: #f8f9fa; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .detail-table th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-weight: 600; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; }
  `]
})
export class TransfersComponent implements OnInit {
  transferts: any[] = [];
  stocks: any[] = [];
  produits: any[] = [];
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false;
  selectedTransfert: any = null;
  searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'numero', label: 'N°' },
    { key: 'source_nom', label: 'Source' },
    { key: 'destination_nom', label: 'Destination' },
    { key: 'statut', label: 'Statut', type: 'badge' },
    { key: 'date_transfert', label: 'Date', type: 'date' },
    { key: 'cree_par_nom', label: 'Créé par' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(
    private transfertService: TransfertService,
    private stockService: StockService,
    private produitService: ProduitService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm(); this.load();
    this.stockService.list({ page_size: 200 }).subscribe(d => this.stocks = d.results);
    this.produitService.list({ page_size: 500 }).subscribe(d => this.produits = d.results);
  }

  buildForm(): void {
    this.form = this.fb.group({
      stock_source: ['', Validators.required],
      stock_destination: ['', Validators.required],
      notes: [''],
      lignes: this.fb.array([])
    });
  }

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }
  addLigne(): void {
    this.lignesArray.push(this.fb.group({ produit: ['', Validators.required], quantite: [1, [Validators.required, Validators.min(0.01)]] }));
  }
  removeLigne(i: number): void { this.lignesArray.removeAt(i); }

  load(): void {
    this.loading = true;
    this.transfertService.list({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.transferts = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(): void { this.buildForm(); this.showForm = true; }
  closeForm(): void { this.showForm = false; }
  viewDetail(t: any): void { this.transfertService.get_(t.id).subscribe(tr => this.selectedTransfert = tr); }
  onDelete(t: any): void { if (confirm('Annuler ce transfert ?')) this.annuler(t); }

  confirmer(t: any): void {
    if (!confirm('Êtes-vous sûr de vouloir confirmer ce transfert ?')) return;
    this.transfertService.confirmer(t.id).subscribe({
      next: updated => { 
        this.selectedTransfert = updated; 
        this.load(); 
        alert('Transfert confirmé avec succès !');
      },
      error: (err) => {
        console.error('Erreur lors de la confirmation:', err);
        const msg = err.error?.error || err.error?.message || 'Erreur lors de la confirmation du transfert';
        alert(msg);
      }
    });
  }
  annuler(t: any): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce transfert ?')) return;
    this.transfertService.annuler(t.id).subscribe({
      next: () => { 
        this.selectedTransfert = null; 
        this.load(); 
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation:', err);
        const msg = err.error?.error || err.error?.message || 'Erreur lors de l\'annulation du transfert';
        alert(msg);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.lignesArray.length) return;
    this.saving = true;
    this.transfertService.create(this.form.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => { this.saving = false; }
    });
  }
}
