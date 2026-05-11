import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProduitService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>📦 Catalogue Produits</h3>
          <p class="subtitle">Gérez vos produits, prix et catégories</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouveau Produit</button>
      </div>

      <app-data-table
        [columns]="columns" [data]="produits" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier le Produit' : 'Nouveau Produit' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Référence *</label>
                <input type="text" formControlName="reference" placeholder="REF-001" />
              </div>
              <div class="form-group">
                <label>Catégorie</label>
                <select formControlName="categorie">
                  <option value="">— Catégorie —</option>
                  <option *ngFor="let c of categories" [value]="c.id">{{ c.nom }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Nom du Produit *</label>
              <input type="text" formControlName="nom" placeholder="Nom du produit" />
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label>Unité *</label>
                <select formControlName="unite">
                  <option value="u">Unité</option>
                  <option value="kg">Kilogramme</option>
                  <option value="l">Litre</option>
                  <option value="t">Tonne</option>
                  <option value="sac">Sac</option>
                  <option value="caisse">Caisse</option>
                  <option value="m">Mètre</option>
                </select>
              </div>
              <div class="form-group">
                <label>Prix Achat (FCFA) *</label>
                <input type="number" formControlName="prix_achat" placeholder="0" />
              </div>
              <div class="form-group">
                <label>Prix Vente (FCFA) *</label>
                <input type="number" formControlName="prix_vente" placeholder="0" />
              </div>
            </div>
            <div class="form-group">
              <label>TVA (%)</label>
              <input type="number" formControlName="tva" placeholder="0" />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  produits: any[] = [];
  categories: any[] = [];
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false; editing: any = null;
  searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'reference', label: 'Référence' },
    { key: 'nom', label: 'Nom' },
    { key: 'categorie_nom', label: 'Catégorie' },
    { key: 'unite', label: 'Unité' },
    { key: 'prix_achat', label: 'Prix Achat', type: 'money' },
    { key: 'prix_vente', label: 'Prix Vente', type: 'money' },
    { key: 'is_active', label: 'Actif', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private produitService: ProduitService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.produitService.categories().subscribe((d: any) => this.categories = d.results || d);
  }

  buildForm(p?: any): void {
    this.form = this.fb.group({
      reference: [p?.reference || '', Validators.required],
      nom: [p?.nom || '', Validators.required],
      categorie: [p?.categorie || ''],
      unite: [p?.unite || 'u', Validators.required],
      prix_achat: [p?.prix_achat || 0, [Validators.required, Validators.min(0)]],
      prix_vente: [p?.prix_vente || 0, [Validators.required, Validators.min(0)]],
      tva: [p?.tva || 0],
      is_active: [p?.is_active !== undefined ? p.is_active : true]
    });
  }

  load(): void {
    this.loading = true;
    this.produitService.list({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.produits = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.currentPage = 1; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(p?: any): void { this.editing = p || null; this.buildForm(p); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(p: any): void { this.openForm(p); }
  onDelete(p: any): void {
    if (confirm(`Supprimer "${p.nom}" ?`)) {
      this.produitService.delete_(p.id).subscribe(() => this.load());
    }
  }
  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.editing ? this.produitService.update(this.editing.id, this.form.value) : this.produitService.create(this.form.value);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => { this.saving = false; } });
  }
}
