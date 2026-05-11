import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProduitService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🤝 Fournisseurs</h3>
          <p class="subtitle">Gestion de vos fournisseurs</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouveau Fournisseur</button>
      </div>

      <app-data-table
        [columns]="columns" [data]="fournisseurs" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier Fournisseur' : 'Nouveau Fournisseur' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" formControlName="nom" />
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
              <textarea formControlName="adresse" rows="2"></textarea>
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
export class FournisseursComponent implements OnInit {
  fournisseurs: any[] = [];
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false; editing: any = null;
  searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'contact', label: 'Contact' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    { key: 'is_active', label: 'Actif', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private produitService: ProduitService, private fb: FormBuilder) {}

  ngOnInit(): void { this.buildForm(); this.load(); }

  buildForm(f?: any): void {
    this.form = this.fb.group({
      nom: [f?.nom || '', Validators.required],
      contact: [f?.contact || ''],
      telephone: [f?.telephone || ''],
      email: [f?.email || ''],
      adresse: [f?.adresse || ''],
      is_active: [f?.is_active !== undefined ? f.is_active : true]
    });
  }

  load(): void {
    this.loading = true;
    this.produitService.fournisseurs({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.fournisseurs = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(f?: any): void { this.editing = f || null; this.buildForm(f); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(f: any): void { this.openForm(f); }
  onDelete(f: any): void {
    if (confirm(`Supprimer "${f.nom}" ?`)) { /* delete */ }
  }
  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const api = `products/fournisseurs/`;
    const obs = this.editing ? this.produitService['http'].patch(`${this.produitService['baseUrl']}/${api}${this.editing.id}/`, this.form.value) : this.produitService['http'].post(`${this.produitService['baseUrl']}/${api}`, this.form.value);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.saving = false; } });
  }
}
