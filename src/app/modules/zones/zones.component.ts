import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ZoneService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🗺️ Zones Géographiques</h3>
          <p class="subtitle">Organisez vos dépôts par zone</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvelle Zone</button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="zones"
        [loading]="loading"
        [totalCount]="totalCount"
        [currentPage]="currentPage"
        (search)="onSearch($event)"
        (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)"
        (delete)="onDelete($event)">
      </app-data-table>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier la Zone' : 'Nouvelle Zone' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="zoneForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label>Nom de la Zone *</label>
              <input type="text" formControlName="nom" placeholder="Ex: Zone Nord" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" rows="3" placeholder="Description..."></textarea>
            </div>
            <div class="form-group">
              <label>Statut</label>
              <select formControlName="is_active">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="zoneForm.invalid || saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ZonesComponent implements OnInit {
  zones: any[] = [];
  loading = false;
  saving = false;
  totalCount = 0;
  currentPage = 1;
  showForm = false;
  editing: any = null;
  searchTerm = '';
  zoneForm!: FormGroup;

  columns: TableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'nombre_stocks', label: 'Stocks' },
    { key: 'responsable_nom', label: 'Responsable' },
    { key: 'is_active', label: 'Statut', type: 'boolean' },
    { key: 'date_creation', label: 'Créé le', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private zoneService: ZoneService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  buildForm(zone?: any): void {
    this.zoneForm = this.fb.group({
      nom: [zone?.nom || '', Validators.required],
      description: [zone?.description || ''],
      is_active: [zone?.is_active !== undefined ? zone.is_active : true]
    });
  }

  load(): void {
    this.loading = true;
    this.zoneService.list({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: data => {
        this.zones = data.results;
        this.totalCount = data.count;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(term: string): void { this.searchTerm = term; this.currentPage = 1; this.load(); }
  onPageChange(page: number): void { this.currentPage = page; this.load(); }

  openForm(zone?: any): void {
    this.editing = zone || null;
    this.buildForm(zone);
    this.showForm = true;
  }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(zone: any): void { this.openForm(zone); }

  onDelete(zone: any): void {
    if (confirm(`Supprimer la zone "${zone.nom}" ?`)) {
      this.zoneService.delete_(zone.id).subscribe(() => this.load());
    }
  }

  onSubmit(): void {
    if (this.zoneForm.invalid) return;
    this.saving = true;
    console.log('Form data:', this.zoneForm.value);
    const obs = this.editing
      ? this.zoneService.update(this.editing.id, this.zoneForm.value)
      : this.zoneService.create(this.zoneForm.value);

    obs.subscribe({
      next: (data) => { 
        console.log('Success:', data); 
        this.saving = false; 
        this.closeForm(); 
        this.load(); 
      },
      error: (err) => { 
        console.error('Error:', err); 
        this.saving = false; 
        alert('Erreur lors de l\'enregistrement: ' + JSON.stringify(err));
      }
    });
  }
}
