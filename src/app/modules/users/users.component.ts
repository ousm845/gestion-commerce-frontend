import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, StockService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>👤 Gestion des Utilisateurs</h3>
          <p class="subtitle">Comptes, rôles et permissions</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvel Utilisateur</button>
      </div>

      <div class="roles-summary" *ngIf="stats">
        <div class="role-pill" *ngFor="let r of stats.par_role">
          <span class="role-count">{{ r.count }}</span>
          <span>{{ r.role }}</span>
        </div>
      </div>

      <app-data-table
        [columns]="columns" [data]="users" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Prénom *</label>
                <input type="text" formControlName="first_name" />
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" formControlName="last_name" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nom d'utilisateur *</label>
                <input type="text" formControlName="username" />
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" formControlName="telephone" />
              </div>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" formControlName="email" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rôle *</label>
                <select formControlName="role">
                  <option value="admin">Administrateur</option>
                  <option value="superviseur">Superviseur</option>
                  <option value="gestionnaire">Gestionnaire de Stock</option>
                  <option value="caissier">Caissier</option>
                  <option value="chauffeur">Chauffeur</option>
                  <option value="maintenancier">Maintenancier</option>
                </select>
              </div>
              <div class="form-group">
                <label>Stock Affecté</label>
                <select formControlName="stock_affecte">
                  <option value="">— Aucun —</option>
                  <option *ngFor="let s of stocks" [value]="s.id">{{ s.nom }}</option>
                </select>
              </div>
            </div>
            <ng-container *ngIf="!editing">
              <div class="form-row">
                <div class="form-group">
                  <label>Mot de passe *</label>
                  <input type="password" formControlName="password" />
                </div>
                <div class="form-group">
                  <label>Confirmer *</label>
                  <input type="password" formControlName="password_confirm" />
                </div>
              </div>
            </ng-container>
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
    .roles-summary { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .role-pill {
      background: white; border-radius: 20px; padding: 6px 14px;
      display: flex; align-items: center; gap: 8px; font-size: 13px;
      border: 1px solid #e9ecef; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .role-count {
      background: linear-gradient(135deg, #ff6b00, #ff9500);
      color: white; border-radius: 10px; padding: 2px 7px; font-size: 12px; font-weight: 700;
    }
  `]
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  stocks: any[] = [];
  stats: any = null;
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false; editing: any = null;
  searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'full_name', label: 'Nom Complet' },
    { key: 'username', label: 'Identifiant' },
    { key: 'role_display', label: 'Rôle' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'stock_affecte_nom', label: 'Stock' },
    { key: 'is_active', label: 'Actif', type: 'boolean' },
    { key: 'date_creation', label: 'Créé le', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private userService: UserService, private stockService: StockService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm(); this.load();
    this.userService.stats().subscribe(s => this.stats = s);
    this.stockService.list({ page_size: 200 }).subscribe(d => this.stocks = d.results);
  }

  buildForm(u?: any): void {
    const base: any = {
      first_name: [u?.first_name || ''],
      last_name: [u?.last_name || ''],
      username: [u?.username || '', Validators.required],
      email: [u?.email || '', [Validators.required, Validators.email]],
      role: [u?.role || 'gestionnaire', Validators.required],
      telephone: [u?.telephone || ''],
      stock_affecte: [u?.stock_affecte || null]
    };
    if (!u) {
      base['password'] = ['', [Validators.required, Validators.minLength(6)]];
      base['password_confirm'] = ['', Validators.required];
    }
    this.form = this.fb.group(base);
  }

  load(): void {
    this.loading = true;
    this.userService.list({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.users = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(u?: any): void { this.editing = u || null; this.buildForm(u); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(u: any): void { this.openForm(u); }
  onDelete(u: any): void { if (confirm(`Désactiver ${u.username} ?`)) { /* deactivate */ } }

  onSubmit(): void {
    if (this.form.invalid) return; this.saving = true;
    const obs = this.editing ? this.userService.update(this.editing.id, this.form.value) : this.userService.create(this.form.value);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); this.userService.stats().subscribe(s => this.stats = s); },
      error: () => { this.saving = false; }
    });
  }
}
