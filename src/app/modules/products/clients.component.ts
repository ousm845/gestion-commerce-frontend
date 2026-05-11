import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProduitService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>👥 Clients</h3>
          <p class="subtitle">Gestion du portefeuille client</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" (click)="loadDebiteurs()">⚠️ Débiteurs</button>
          <button class="btn btn-primary" (click)="openForm()">+ Nouveau Client</button>
        </div>
      </div>

      <app-data-table
        [columns]="columns" [data]="showDebiteurs ? debiteurs : clients" [loading]="loading"
        [totalCount]="showDebiteurs ? debiteurs.length : totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier Client' : 'Nouveau Client' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" formControlName="nom" placeholder="Nom du client" />
              </div>
              <div class="form-group">
                <label>Contact</label>
                <input type="text" formControlName="contact" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" formControlName="telephone" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" formControlName="email" />
              </div>
            </div>
            <div class="form-group">
              <label>Adresse</label>
              <input type="text" formControlName="adresse" />
            </div>
            <div class="form-group">
              <label>Plafond Crédit (FCFA) — 0 = illimité</label>
              <input type="number" formControlName="plafond_credit" />
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
  `
})
export class ClientsComponent implements OnInit {
  clients: any[] = [];
  debiteurs: any[] = [];
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false; editing: any = null;
  showDebiteurs = false; searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'contact', label: 'Contact' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'solde_credit', label: 'Solde Dû', type: 'money' },
    { key: 'plafond_credit', label: 'Plafond', type: 'money' },
    { key: 'is_active', label: 'Actif', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private produitService: ProduitService, private fb: FormBuilder) {}

  ngOnInit(): void { this.buildForm(); this.load(); }

  buildForm(c?: any): void {
    this.form = this.fb.group({
      nom: [c?.nom || '', Validators.required],
      contact: [c?.contact || ''],
      telephone: [c?.telephone || ''],
      email: [c?.email || ''],
      adresse: [c?.adresse || ''],
      plafond_credit: [c?.plafond_credit || 0]
    });
  }

  load(): void {
    this.loading = true; this.showDebiteurs = false;
    this.produitService.clients({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.clients = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadDebiteurs(): void {
    this.produitService.debiteurs().subscribe(d => { this.debiteurs = d; this.showDebiteurs = true; });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(c?: any): void { this.editing = c || null; this.buildForm(c); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(c: any): void { this.openForm(c); }
  onDelete(c: any): void {
    if (confirm(`Supprimer le client "${c.nom}" ?`)) {
      // delete
    }
  }
  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.editing
      ? this.produitService.updateClient(this.editing.id, this.form.value)
      : this.produitService.createClient(this.form.value);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.saving = false; } });
  }
}
