import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LogisticsService, StockService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

// ===================== ENGINS =====================
@Component({
  selector: 'app-engins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🚛 Gestion des Engins</h3>
          <p class="subtitle">Flotte de véhicules et équipements</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvel Engin</button>
      </div>

      <div class="stats-row" *ngIf="stats">
        <div class="stat-card green"><strong>{{ stats.disponibles }}</strong><small>Disponibles</small></div>
        <div class="stat-card blue"><strong>{{ stats.en_service }}</strong><small>En Service</small></div>
        <div class="stat-card red"><strong>{{ stats.en_panne }}</strong><small>En Panne</small></div>
        <div class="stat-card orange"><strong>{{ stats.en_maintenance }}</strong><small>En Maintenance</small></div>
      </div>

      <app-data-table
        [columns]="columns" [data]="engins" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editing ? 'Modifier Engin' : 'Nouvel Engin' }}</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Immatriculation *</label>
                <input type="text" formControlName="immatriculation" placeholder="AA-000-BB" />
              </div>
              <div class="form-group">
                <label>Type *</label>
                <select formControlName="type">
                  <option value="camion">Camion</option>
                  <option value="voiture">Voiture</option>
                  <option value="moto">Moto</option>
                  <option value="tracteur">Tracteur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Marque *</label>
                <input type="text" formControlName="marque" />
              </div>
              <div class="form-group">
                <label>Modèle</label>
                <input type="text" formControlName="modele" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Année</label>
                <input type="number" formControlName="annee" min="1990" max="2030" />
              </div>
              <div class="form-group">
                <label>Kilométrage</label>
                <input type="number" formControlName="kilometrage" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Stock Affecté</label>
              <select formControlName="stock_affecte">
                <option value="">— Aucun —</option>
                <option *ngFor="let s of stocks" [value]="s.id">{{ s.nom }}</option>
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
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px 20px; border-left: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card.green { border-color: #10b981; }
    .stat-card.blue { border-color: #3b82f6; }
    .stat-card.red { border-color: #ef4444; }
    .stat-card.orange { border-color: #ff6b00; }
    .stat-card strong { display: block; font-size: 26px; font-weight: 800; }
    .stat-card small { color: #999; font-size: 12px; }
  `]
})
export class EnginsComponent implements OnInit {
  engins: any[] = [];
  stocks: any[] = [];
  stats: any = null;
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false; editing: any = null;
  searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'immatriculation', label: 'Immatriculation' },
    { key: 'marque', label: 'Marque' },
    { key: 'modele', label: 'Modèle' },
    { key: 'type_display', label: 'Type' },
    { key: 'statut', label: 'Statut', type: 'badge' },
    { key: 'kilometrage', label: 'Kilométrage' },
    { key: 'stock_nom', label: 'Stock' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private logisticsService: LogisticsService, private stockService: StockService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm(); this.load();
    this.logisticsService.statsEngins().subscribe(s => this.stats = s);
    this.stockService.list({ page_size: 200 }).subscribe(d => this.stocks = d.results);
  }

  buildForm(e?: any): void {
    this.form = this.fb.group({
      immatriculation: [e?.immatriculation || '', Validators.required],
      type: [e?.type || 'camion', Validators.required],
      marque: [e?.marque || '', Validators.required],
      modele: [e?.modele || ''],
      annee: [e?.annee || null],
      kilometrage: [e?.kilometrage || 0],
      stock_affecte: [e?.stock_affecte || null]
    });
  }

  load(): void {
    this.loading = true;
    this.logisticsService.engins({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.engins = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(e?: any): void { this.editing = e || null; this.buildForm(e); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }
  onEdit(e: any): void { this.openForm(e); }
  onDelete(e: any): void { if (confirm(`Supprimer ${e.immatriculation} ?`)) { /* delete */ } }

  onSubmit(): void {
    if (this.form.invalid) return; this.saving = true;
    const obs = this.editing ? this.logisticsService.updateEngin(this.editing.id, this.form.value) : this.logisticsService.createEngin(this.form.value);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); this.logisticsService.statsEngins().subscribe(s => this.stats = s); }, error: () => { this.saving = false; } });
  }
}

// ===================== SORTIES =====================
@Component({
  selector: 'app-sorties',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🛣️ Sorties Engins</h3>
          <p class="subtitle">Historique et suivi des déplacements</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvelle Sortie</button>
      </div>

      <app-data-table
        [columns]="columns" [data]="sorties" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>🛣️ Nouvelle Sortie</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Engin *</label>
                <select formControlName="engin">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let e of engins" [value]="e.id">{{ e.immatriculation }} - {{ e.marque }}</option>
                </select>
              </div>
<div class="form-group">
                <label>Chauffeur * ({{ chauffeurs.length }})</label>
                <select formControlName="chauffeur">
                  <option value="">— Sélectionner chauffeur —</option>
<option *ngFor="let c of chauffeurs" [value]="c.id">
                    {{ c.nom_complet || c.user?.get_full_name || 'N/A' }} {{ c.numero_permis ? '(' + c.numero_permis + ')' : '' }}
                    <a href="/logistics/chauffeur/{{c.id}}" target="_blank" style="float:right;font-size:10px">[Dossier]</a>
                  </option>
                </select>
                <small *ngIf="chauffeurs.length === 0" class="error">Aucun chauffeur. Run: python backend/create_salarie_chauffeurs.py</small>
              </div>
            </div>
            <div class="form-group">
              <label>Destination *</label>
              <input type="text" formControlName="destination" placeholder="Ville, adresse..." />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date Départ *</label>
                <input type="datetime-local" formControlName="date_depart" />
              </div>
              <div class="form-group">
                <label>Kilométrage Départ</label>
                <input type="number" formControlName="kilometrage_depart" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Motif</label>
              <textarea formControlName="motif" rows="2"></textarea>
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
export class SortiesComponent implements OnInit {
  sorties: any[] = [];
  engins: any[] = [];
  chauffeurs: any[] = [];
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false;
  searchTerm = '';
  form!: FormGroup;

    columns: TableColumn[] = [
    { key: 'engin_immat', label: 'Engin' },
    { key: 'chauffeur_nom', label: 'Chauffeur' },
    { key: 'destination', label: 'Destination' },
    { key: 'date_depart', label: 'Départ', type: 'date' },
    { key: 'date_retour_reelle', label: 'Retour', type: 'date' },
    { key: 'distance_parcourue', label: 'Distance (km)', type: 'text' },
    { key: 'statut', label: 'Statut', type: 'badge' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private logisticsService: LogisticsService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm(); this.load();
    // Charger les engins disponibles
    this.logisticsService.engins({ statut: 'disponible', page_size: 100 }).subscribe({
      next: (d: any) => { this.engins = d.results || d; console.log('Engin disponibles:', this.engins); },
      error: (err: any) => { console.error('Erreur chargement engins:', err); }
    });
// Charger les salariés actifs pour les sorties (nouvel endpoint)
    this.logisticsService.getSalariesForSortie().subscribe({
      next: (d: any) => { 
        this.chauffeurs = d || [];
        console.log('✅ Salariés chargés:', this.chauffeurs.length, this.chauffeurs);
      },
      error: (err: any) => { 
        console.error('❌ Erreur API chauffeurs:', err);
        alert('Erreur chargement chauffeurs. Backend run ? Vérifiez console.');
        this.chauffeurs = [];
        // Fallback old
        this.logisticsService.chauffeurs().subscribe({
          next: (d2: any) => { 
            this.chauffeurs = d2.results || d2 || [];
            console.log('Fallback chauffeurs:', this.chauffeurs.length);
          },
          error: (err2) => console.error('Fallback échoué:', err2)
        });
      }
    });
    
    // Message empty state
    setTimeout(() => {
      if (this.chauffeurs.length === 0) {
        console.warn('⚠️ AUCUN CHAUFFEUR - Créer via Personnel ou re-run create_salarie_chauffeurs.py');
        alert('Aucun chauffeur disponible. Exécutez: cd backend && python create_salarie_chauffeurs.py');
      }
    }, 2000);
  }

  buildForm(): void {
    this.form = this.fb.group({
      engin: ['', Validators.required],
      chauffeur: ['', Validators.required],
      destination: ['', Validators.required],
      date_depart: ['', Validators.required],
      kilometrage_depart: [0],
      motif: ['']
    });
  }

  load(): void {
    this.loading = true;
    this.logisticsService.sorties({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.sorties = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(): void { this.buildForm(); this.showForm = true; }
  closeForm(): void { this.showForm = false; }
  onEdit(s: any): void { 
    const km = prompt('Km retour (actuel départ: ' + (s.kilometrage_depart || 0) + ')', (s.kilometrage_depart || 0) + 100);
    if (km !== null && confirm(`Marquer retour ${s.engin_immat} → km ${km} ?`)) {
      this.logisticsService.retourEngin(s.id, {kilometrage_retour: parseInt(km) || 0}).subscribe({
        next: () => { alert('Retour OK ! Distance: ' + (parseInt(km) - (s.kilometrage_depart || 0)) + 'km'); this.load(); },
        error: (err) => alert('Erreur: ' + (err.error?.[0] || err.message))
      });
    }
  }
  onDelete(s: any): void { 
    if (confirm(`Annuler ${s.engin_immat} ?`)) {
      this.logisticsService.deleteSortie(s.id).subscribe({
        next: () => { alert('Sortie annulée'); this.load(); },
        error: () => alert('Erreur annulation')
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return; this.saving = true;
    this.logisticsService.createSortie(this.form.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => { this.saving = false; }
    });
  }
}

// ===================== MAINTENANCES =====================
@Component({
  selector: 'app-maintenances',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🔧 Maintenances</h3>
          <p class="subtitle">Suivi des maintenances et pannes</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvelle Maintenance</button>
      </div>

      <div class="stats-row" *ngIf="stats">
        <div class="stat-card orange"><strong>{{ stats.cout_total | number:'1.0-0' }} FCFA</strong><small>Coût Total</small></div>
        <div class="stat-card blue"><strong>{{ stats.planifiees }}</strong><small>Planifiées</small></div>
        <div class="stat-card red"><strong>{{ stats.en_cours }}</strong><small>En Cours</small></div>
      </div>

      <app-data-table
        [columns]="columns" [data]="maintenances" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="onEdit($event)" (delete)="onDelete($event)">
      </app-data-table>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>🔧 Nouvelle Maintenance</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Engin *</label>
                <select formControlName="engin">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let e of engins" [value]="e.id">{{ e.immatriculation }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Type *</label>
                <select formControlName="type">
                  <option value="preventive">Préventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Description *</label>
              <textarea formControlName="description" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Prestataire</label>
                <input type="text" formControlName="prestataire" />
              </div>
              <div class="form-group">
                <label>Coût (FCFA)</label>
                <input type="number" formControlName="cout" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Date Planifiée *</label>
              <input type="date" formControlName="date_planifiee" />
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
    .stats-row { display: flex; gap: 14px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px 20px; border-left: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.05); min-width: 160px; }
    .stat-card.orange { border-color: #ff6b00; }
    .stat-card.blue { border-color: #3b82f6; }
    .stat-card.red { border-color: #ef4444; }
    .stat-card strong { display: block; font-size: 20px; font-weight: 800; }
    .stat-card small { color: #999; font-size: 12px; }
  `]
})
export class MaintenancesComponent implements OnInit {
  maintenances: any[] = [];
  engins: any[] = [];
  stats: any = null;
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false;
  searchTerm = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'engin_immat', label: 'Engin' },
    { key: 'type_display', label: 'Type' },
    { key: 'statut', label: 'Statut', type: 'badge' },
    { key: 'prestataire', label: 'Prestataire' },
    { key: 'cout', label: 'Coût', type: 'money' },
    { key: 'date_planifiee', label: 'Planifié le', type: 'date' },
    { key: 'cree_par_nom', label: 'Par' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(private logisticsService: LogisticsService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm(); this.load();
    this.logisticsService.statsEngins().subscribe(s => this.stats = s);
    this.logisticsService.statsMaintenance().subscribe(s => this.stats = {...this.stats, ...s});
    this.logisticsService.engins({ page_size: 200 }).subscribe(d => this.engins = d.results);
  }

  buildForm(): void {
    this.form = this.fb.group({
      engin: ['', Validators.required],
      type: ['corrective', Validators.required],
      description: ['', Validators.required],
      prestataire: [''],
      cout: [0],
      date_planifiee: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  load(): void {
    this.loading = true;
    this.logisticsService.maintenances({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: d => { this.maintenances = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(t: string): void { this.searchTerm = t; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(): void { this.buildForm(); this.showForm = true; }
  closeForm(): void { this.showForm = false; }
  onEdit(m: any): void { 
    const notes = prompt('Notes terminaison ?', '');
    if (confirm(`Terminer maintenance ${m.engin_immat} ?`)) {
      this.logisticsService.terminerMaintenance(m.id, {notes: notes, cout: prompt('Coût final FCFA ?', m.cout || 0)}).subscribe({
        next: () => { alert('Maintenance terminée !'); this.load(); },
        error: () => alert('Erreur')
      });
    }
  }
  onDelete(m: any): void {
    if (confirm(`Supprimer ${m.engin_immat} ?`)) {
      this.logisticsService.deleteMaintenance(m.id).subscribe({
        next: () => { this.load(); },
        error: () => alert('Erreur')
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return; this.saving = true;
    this.logisticsService.createMaintenance(this.form.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => { this.saving = false; }
    });
  }
}
