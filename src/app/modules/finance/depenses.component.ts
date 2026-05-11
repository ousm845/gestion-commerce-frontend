import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../core/services/api.service';

@Component({
  selector: 'app-depenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>💸 Dépenses</h3>
          <p class="subtitle">Suivi des sorties de fonds</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvelle Dépense</button>
      </div>

      <div class="stats-row" *ngIf="stats">
        <div class="stat-card red">
          <strong>{{ stats.total_mois | number:'1.0-0' }} FCA</strong>
          <small>Total ce mois</small>
        </div>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Catégorie</th>
              <th>Montant</th>
              <th>Source</th>
              <th>Caisse/Compte</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of depenses">
              <td>{{ d.libelle }}</td>
              <td>{{ d.categorie_display }}</td>
              <td class="text-danger">{{ d.montant | number:'1.0-0' }} FCA</td>
              <td>{{ d.source_display }}</td>
              <td>{{ d.caisse_nom || d.compte_om_nom || '-' }}</td>
              <td>{{ d.date_depense | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="btn btn-sm btn-danger" (click)="onDelete(d)">Supprimer</button>
              </td>
            </tr>
            <tr *ngIf="depenses.length === 0">
              <td colspan="7" class="text-center">Aucune dépense</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>💸 Nouvelle Dépense</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label>Libellé *</label>
              <input type="text" formControlName="libelle" placeholder="Description de la dépense" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Catégorie</label>
                <select formControlName="categorie">
                  <option value="salaire">Salaire</option>
                  <option value="carburant">Carburant</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="loyer">Loyer</option>
                  <option value="fournitures">Fournitures</option>
                  <option value="transport">Transport</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div class="form-group">
                <label>Montant (FCFA) *</label>
                <input type="number" formControlName="montant" min="0" />
              </div>
            </div>
            <div class="form-row">
            <div class="form-group">
              <label>Source</label>
              <select formControlName="source" (change)="onSourceChange()">
                <option value="caisse">Caisse</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date</label>
              <input type="date" formControlName="date_depense" />
            </div>
          </div>
          <div class="form-group" *ngIf="form.get('source')?.value === 'caisse'">
            <label>Caisse *</label>
            <select formControlName="caisse">
              <option value="">-- Sélectionner une caisse --</option>
              <option *ngFor="let c of caisses" [value]="c.id">{{ c.nom }} - {{ c.stock_nom }}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="form.get('source')?.value === 'orange_money'">
            <label>Compte Orange Money *</label>
            <select formControlName="compte_om">
              <option value="">-- Sélectionner un compte --</option>
              <option *ngFor="let c of compteOm" [value]="c.id">{{ c.nom }} - {{ c.stock_nom }}</option>
            </select>
          </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                {{ saving ? '...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px 20px; border-left: 4px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card.red { border-color: #ef4444; }
    .stat-card strong { display: block; font-size: 18px; font-weight: 800; }
    .stat-card small { color: #999; font-size: 12px; }
    .card { background: white; border-radius: 14px; overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background: #f9fafb; font-weight: 600; font-size: 12px; }
    .text-center { text-align: center; }
    .text-danger { color: #dc2626; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: white; border-radius: 14px; padding: 24px; max-width: 500px; width: 90%; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h4 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .form-row { display: flex; gap: 16px; }
    .form-row .form-group { flex: 1; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
    .btn { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-sm { padding: 6px 12px; font-size: 13px; }
    .btn-primary { background: #ff6b00; color: white; }
    .btn-secondary { background: #e5e7eb; }
    .btn-danger { background: #dc2626; color: white; }
  `]
})
export class DepensesComponent implements OnInit {
  depenses: any[] = [];
  caisses: any[] = [];
  compteOm: any[] = [];
  stats: any = null;
  loading = false;
  saving = false;
  totalCount = 0;
  currentPage = 1;
  showForm = false;
  editing: any = null;
  searchTerm = '';
  form!: FormGroup;

  constructor(private financeService: FinanceService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.loadStats();
    // Load caisses with error handling
    this.financeService.caisses({ page_size: 100 }).subscribe({
      next: (d: any) => { 
        console.log('Caisses loaded:', d);
        this.caisses = d.results || d; 
      },
      error: (err) => { console.error('Error loading caisses:', err); }
    });
    // Load Orange Money accounts with error handling
    this.financeService.orangeMoney({ page_size: 100 }).subscribe({
      next: (d: any) => { 
        console.log('OM accounts loaded:', d);
        this.compteOm = d.results || d; 
      },
      error: (err) => { console.error('Error loading OM accounts:', err); }
    });
  }

  onSourceChange(): void {
    // Reset the selected compte when source changes
    if (this.form.get('source')?.value === 'caisse') {
      this.form.get('compte_om')?.setValue('');
    } else {
      this.form.get('caisse')?.setValue('');
    }
  }

  buildForm(d?: any): void {
    this.form = this.fb.group({
      libelle: [d?.libelle || '', Validators.required],
      categorie: [d?.categorie || 'autre'],
      montant: [d?.montant || 0, [Validators.required, Validators.min(1)]],
      source: ['caisse'],
      caisse: [d?.caisse || ''],
      compte_om: [d?.compte_om || ''],
      date_depense: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  load(): void {
    this.loading = true;
    this.financeService.depenses({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.depenses = d.results || d; this.totalCount = d.count || 0; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadStats(): void {
    this.financeService.statsDepenses().subscribe(s => this.stats = s);
  }

  onSearch(t: string): void {
    this.searchTerm = t;
    this.load();
  }

  onPageChange(p: number): void {
    this.currentPage = p;
    this.load();
  }

  openForm(d?: any): void {
    this.editing = d || null;
    this.buildForm(d);
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editing = null;
  }

  onEdit(d: any): void {
    this.openForm(d);
  }

  onDelete(d: any): void {
    if (confirm('Supprimer "' + d.libelle + '" ?')) {
      this.financeService.deleteDepense(d.id).subscribe({
        next: () => { this.load(); this.loadStats(); },
        error: () => {}
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    
    // Additional validation - ensure caisse/compte_om is selected based on source
    const source = this.form.get('source')?.value;
    if (source === 'caisse' && !this.form.get('caisse')?.value) {
      alert('Veuillez sélectionner une caisse');
      return;
    }
    if (source === 'orange_money' && !this.form.get('compte_om')?.value) {
      alert('Veuillez sélectionner un compte Orange Money');
      return;
    }
    
    this.saving = true;
    this.financeService.createDepense(this.form.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); this.loadStats(); },
      error: () => { this.saving = false; }
    });
  }
}
