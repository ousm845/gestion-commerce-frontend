import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PersonnelService, FinanceService, StockService, ZoneService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>👥 Personnel</h3>
          <p class="subtitle">Gestion des employés et agents</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="showTab('presences')">📋 Pointage</button>
          <button class="btn btn-outline" (click)="showTab('affectations')">📍 Affectations</button>
          <button class="btn btn-outline" (click)="showTab('conges')">🏖️ Congés</button>
          <button class="btn btn-primary" (click)="openForm()">+ Nouveau Salarié</button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid" *ngIf="!loading">
        <div class="summary-card">
          <span class="s-icon">👥</span>
          <div><strong>{{ stats?.total_personnel || 0 }}</strong><small>Total Personnel</small></div>
        </div>
        <div class="summary-card">
          <span class="s-icon">✅</span>
          <div><strong>{{ stats?.presents_aujourdhui || 0 }}</strong><small>Présents</small></div>
        </div>
        <div class="summary-card warn">
          <span class="s-icon">❌</span>
          <div><strong>{{ stats?.absents_aujourdhui || 0 }}</strong><small>Absents</small></div>
        </div>
        <div class="summary-card info">
          <span class="s-icon">🏖️</span>
          <div><strong>{{ stats?.en_conge || 0 }}</strong><small>En Congé</small></div>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div class="tabs-container">
        <div class="tabs">
          <button [class.active]="activeTab === 'liste'" (click)="showTab('liste')">📋 Liste</button>
          <button [class.active]="activeTab === 'presences'" (click)="showTab('presences')">🕐 Pointage</button>
          <button [class.active]="activeTab === 'affectations'" (click)="showTab('affectations')">📍 Affectations</button>
          <button [class.active]="activeTab === 'conges'" (click)="showTab('conges')">🏖️ Congés</button>
        </div>

        <!-- Liste Personnel -->
        <div *ngIf="activeTab === 'liste'">
          <app-data-table
            [columns]="personnelColumns"
            [data]="personnel"
            [loading]="loading"
            [totalCount]="totalCount"
            [currentPage]="currentPage"
            (search)="onSearch($event)"
            (pageChange)="onPageChange($event)"
            (edit)="onEditSalarie($event)"
            (delete)="onDeleteSalarie($event)">
          </app-data-table>
        </div>

        <!-- Présences -->
        <div *ngIf="activeTab === 'presences'">
          <div class="tab-header">
            <h4>Pointage du {{ today | date:'dd/MM/yyyy' }}</h4>
            <button class="btn btn-primary" (click)="pointer()">🕐 Pointer</button>
          </div>
          <app-data-table
            [columns]="presenceColumns"
            [data]="presences"
            [loading]="loadingPresences"
            [totalCount]="totalPresences"
            [currentPage]="currentPagePresences"
            (search)="onSearchPresence($event)"
            (pageChange)="onPageChangePresence($event)"
            (edit)="onEditPresence($event)">
          </app-data-table>
        </div>

        <!-- Affectations -->
        <div *ngIf="activeTab === 'affectations'">
          <div class="tab-header">
            <h4>Affectations</h4>
            <button class="btn btn-primary" (click)="openAffectationForm()">+ Nouvelle Affectation</button>
          </div>
          <app-data-table
            [columns]="affectationColumns"
            [data]="affectations"
            [loading]="loadingAffectations"
            [totalCount]="totalAffectations"
            [currentPage]="currentPageAffectations"
            (pageChange)="onPageChangeAffectation($event)"
            (edit)="onEditAffectation($event)"
            (delete)="onDeleteAffectation($event)">
          </app-data-table>
        </div>

        <!-- Congés -->
        <div *ngIf="activeTab === 'conges'">
          <div class="tab-header">
            <h4>Congés</h4>
            <button class="btn btn-primary" (click)="openCongeForm()">+ Demander Congé</button>
          </div>
          <app-data-table
            [columns]="congeColumns"
            [data]="conges"
            [loading]="loadingConges"
            [totalCount]="totalConges"
            [currentPage]="currentPageConges"
            (pageChange)="onPageChangeConge($event)"
            (edit)="onEditConge($event)">
          </app-data-table>
        </div>
      </div>

      <!-- Modal Ajout Salarié -->
      <div class="modal-overlay" *ngIf="showSalarieForm" (click)="closeSalarieForm()">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editingSalarie ? 'Modifier le Salarié' : 'Nouveau Salarié' }}</h4>
            <button class="close-btn" (click)="closeSalarieForm()">✕</button>
          </div>
          <form [formGroup]="salarieForm" (ngSubmit)="onSubmitSalarie()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" formControlName="nom" placeholder="Nom" />
              </div>
              <div class="form-group">
                <label>Prénom *</label>
                <input type="text" formControlName="prenom" placeholder="Prénom" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email</label>
                <input type="email" formControlName="email" placeholder="email@exemple.com" />
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" formControlName="telephone" placeholder="Téléphone" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rôle *</label>
                <select formControlName="role">
                  <option value="">— Sélectionner —</option>
                  <option value="gestionnaire">Gestionnaire de Stock</option>
                  <option value="caissier">Caissier</option>
                  <option value="superviseur">Superviseur</option>
                  <option value="chauffeur">Chauffeur</option>
                  <option value="maintenancier">Maintenancier</option>
                </select>
              </div>
              <div class="form-group">
                <label>Poste / Fonction</label>
                <select formControlName="fonction">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let f of fonctions" [value]="f.id">{{ f.nom }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date d'embauche *</label>
                <input type="date" formControlName="date_embauche" />
              </div>
              <div class="form-group">
                <label>Salaire de base *</label>
                <input type="number" formControlName="salaire_base" placeholder="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Type de contrat</label>
                <select formControlName="type_contrat">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let t of typesContrat" [value]="t.id">{{ t.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Numéro CNPS</label>
                <input type="text" formControlName="numero_cnps" placeholder="N° CNPS" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeSalarieForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="salarieForm.invalid || savingSalarie">
                {{ savingSalarie ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Pointage -->
      <div class="modal-overlay" *ngIf="showPresenceForm" (click)="closePresenceForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>Pointage</h4>
            <button class="close-btn" (click)="closePresenceForm()">✕</button>
          </div>
          <form [formGroup]="presenceForm" (ngSubmit)="onSubmitPresence()" class="modal-form">
            <div class="form-group">
              <label>Salarié *</label>
              <select formControlName="salarie">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let s of salaries" [value]="s.id">{{ s.nom }} {{ s.prenom }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date</label>
                <input type="date" formControlName="date" />
              </div>
              <div class="form-group">
                <label>Statut</label>
                <select formControlName="statut">
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="retard">Retard</option>
                  <option value="conge">Congé</option>
                  <option value="mission">Mission</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Heure d'arrivée</label>
                <input type="time" formControlName="heure_arrivee" />
              </div>
              <div class="form-group">
                <label>Heure de départ</label>
                <input type="time" formControlName="heure_depart" />
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closePresenceForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="presenceForm.invalid || savingPresence">
                {{ savingPresence ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Affectation -->
      <div class="modal-overlay" *ngIf="showAffectationForm" (click)="closeAffectationForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>{{ editingAffectation ? 'Modifier Affectation' : 'Nouvelle Affectation' }}</h4>
            <button class="close-btn" (click)="closeAffectationForm()">✕</button>
          </div>
          <form [formGroup]="affectationForm" (ngSubmit)="onSubmitAffectation()" class="modal-form">
            <div class="form-group">
              <label>Salarié *</label>
              <select formControlName="salarie">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let s of salaries" [value]="s.id">{{ s.nom }} {{ s.prenom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fonction *</label>
              <select formControlName="fonction">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let f of fonctions" [value]="f.id">{{ f.nom }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stock</label>
                <select formControlName="stock">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let s of stocks" [value]="s.id">{{ s.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Zone</label>
                <select formControlName="zone">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let z of zones" [value]="z.id">{{ z.nom }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date de début *</label>
                <input type="date" formControlName="date_debut" />
              </div>
              <div class="form-group">
                <label>Date de fin</label>
                <input type="date" formControlName="date_fin" />
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeAffectationForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="affectationForm.invalid || savingAffectation">
                {{ savingAffectation ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Congé -->
      <div class="modal-overlay" *ngIf="showCongeForm" (click)="closeCongeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>Demande de Congé</h4>
            <button class="close-btn" (click)="closeCongeForm()">✕</button>
          </div>
          <form [formGroup]="congeForm" (ngSubmit)="onSubmitConge()" class="modal-form">
            <div class="form-group">
              <label>Salarié *</label>
              <select formControlName="salarie">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let s of salaries" [value]="s.id">{{ s.nom }} {{ s.prenom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type de congé</label>
              <select formControlName="type_conge">
                <option value="annuel">Congé Annuel</option>
                <option value="maladie">Congé Maladie</option>
                <option value="maternité">Congé Maternité</option>
                <option value="paternité">Congé Paternité</option>
                <option value="sans_solde">Congé Sans Solde</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date de début *</label>
                <input type="date" formControlName="date_debut" />
              </div>
              <div class="form-group">
                <label>Date de fin *</label>
                <input type="date" formControlName="date_fin" />
              </div>
            </div>
            <div class="form-group">
              <label>Motif</label>
              <textarea formControlName="motif" rows="2"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCongeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="congeForm.invalid || savingConge">
                {{ savingConge ? 'Envoi...' : 'Soumettre' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; gap: 10px; }
    .summary-grid { display: flex; gap: 14px; margin-bottom: 24px; }
    .summary-card {
      background: white; border-radius: 12px; padding: 16px 20px;
      display: flex; align-items: center; gap: 12px;
      border: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .summary-card.warn { border-color: #fde68a; background: #fffbeb; }
    .summary-card.info { border-color: #bfdbfe; background: #eff6ff; }
    .s-icon { font-size: 24px; }
    .summary-card strong { display: block; font-size: 22px; color: #1a1a2e; }
    .summary-card small { color: #999; font-size: 12px; }
    .tabs-container { background: white; border-radius: 12px; padding: 20px; border: 1px solid #f0f0f0; }
    .tabs { display: flex; gap: 8px; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px; }
    .tabs button {
      padding: 10px 20px; background: none; border: none; cursor: pointer;
      font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px;
    }
    .tabs button.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 500; }
    .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .tab-header h4 { margin: 0; }
    .modal-lg { max-width: 600px; }
    .form-row { display: flex; gap: 16px; }
    .form-row .form-group { flex: 1; }
  `]
})
export class PersonnelComponent implements OnInit {
  // Data
  personnel: any[] = [];
  salaries: any[] = [];
  presences: any[] = [];
  affectations: any[] = [];
  conges: any[] = [];
  typesContrat: any[] = [];
  fonctions: any[] = [];
  stocks: any[] = [];
  zones: any[] = [];
  stats: any = {};
  
  // Loading
  loading = false;
  loadingPresences = false;
  loadingAffectations = false;
  loadingConges = false;
  savingSalarie = false;
  savingPresence = false;
  savingAffectation = false;
  savingConge = false;
  
  // Pagination
  totalCount = 0;
  currentPage = 1;
  totalPresences = 0;
  currentPagePresences = 1;
  totalAffectations = 0;
  currentPageAffectations = 1;
  totalConges = 0;
  currentPageConges = 1;
  
  // Tabs
  activeTab = 'liste';
  today = new Date();
  searchTerm = '';
  roleFilter = '';
  roles = ['chauffeur', 'caissier', 'responsable', 'vendeur', 'magasinier', 'secretaire', 'directeur', 'autre'];
  
  // Forms
  showSalarieForm = false;
  showPresenceForm = false;
  showAffectationForm = false;
  showCongeForm = false;
  editingSalarie: any = null;
  editingPresence: any = null;
  editingAffectation: any = null;
  editingConge: any = null;
  
  salarieForm!: FormGroup;
  presenceForm!: FormGroup;
  affectationForm!: FormGroup;
  congeForm!: FormGroup;
  
  // Table columns
  personnelColumns: TableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'date_embauche', label: 'Embauché le', type: 'date' },
    { key: 'salaire_base', label: 'Salaire', type: 'money' },
    { key: 'type_contrat_nom', label: 'Contrat' },
    { key: 'statut', label: 'Statut' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];
  
  presenceColumns: TableColumn[] = [
    { key: 'salarie_nom', label: 'Salarié' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'heure_arrivee', label: 'Arrivée' },
    { key: 'heure_depart', label: 'Départ' },
    { key: 'statut', label: 'Statut' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];
  
  affectationColumns: TableColumn[] = [
    { key: 'salarie_nom', label: 'Salarié' },
    { key: 'stock_nom', label: 'Stock' },
    { key: 'zone_nom', label: 'Zone' },
    { key: 'fonction_nom', label: 'Fonction' },
    { key: 'date_debut', label: 'Début', type: 'date' },
    { key: 'date_fin', label: 'Fin', type: 'date' },
    { key: 'est_active', label: 'Active', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];
  
  congeColumns: TableColumn[] = [
    { key: 'salarie_nom', label: 'Salarié' },
    { key: 'type_conge_display', label: 'Type' },
    { key: 'date_debut', label: 'Début', type: 'date' },
    { key: 'date_fin', label: 'Fin', type: 'date' },
    { key: 'jours_ouvrables', label: 'Jours' },
    { key: 'statut_display', label: 'Statut' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(
    private personnelService: PersonnelService,
    private financeService: FinanceService,
    private stockService: StockService,
    private zoneService: ZoneService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.load();
    this.loadStats();
    this.loadReferences();
  }

  buildForms(): void {
    this.salarieForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: [''],
      telephone: [''],
      role: [''],
      fonction: [''],
      date_embauche: ['', Validators.required],
      salaire_base: ['', Validators.required],
      type_contrat: [''],
      numero_cnps: ['']
    });
    
    this.presenceForm = this.fb.group({
      salarie: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      heure_arrivee: [''],
      heure_depart: [''],
      statut: ['present'],
      notes: ['']
    });
    
    this.affectationForm = this.fb.group({
      salarie: ['', Validators.required],
      fonction: ['', Validators.required],
      stock: [''],
      zone: [''],
      date_debut: ['', Validators.required],
      date_fin: [''],
      notes: ['']
    });
    
    this.congeForm = this.fb.group({
      salarie: ['', Validators.required],
      type_conge: ['annuel'],
      date_debut: ['', Validators.required],
      date_fin: ['', Validators.required],
      motif: ['']
    });
  }

  load(): void {
    this.loading = true;
    this.personnelService.list({ page: this.currentPage, search: this.searchTerm }).subscribe({
      next: data => {
        this.personnel = data.results;
        this.totalCount = data.count;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadStats(): void {
    this.personnelService.statistiques().subscribe(s => this.stats = s);
  }

  loadReferences(): void {
    this.financeService.salaries().subscribe(d => this.salaries = d.results);
    this.financeService.typesContrat({ page_size: 100 }).subscribe(d => this.typesContrat = d.results);
    this.personnelService.fonctions({ page_size: 100 }).subscribe(d => this.fonctions = d.results);
    this.stockService.list({ page_size: 100 }).subscribe(d => this.stocks = d.results);
    this.zoneService.list({ page_size: 100 }).subscribe(d => this.zones = d.results);
  }

  loadPresences(): void {
    this.loadingPresences = true;
    this.personnelService.presences({ page: this.currentPagePresences }).subscribe({
      next: data => {
        this.presences = data.results;
        this.totalPresences = data.count;
        this.loadingPresences = false;
      },
      error: () => { this.loadingPresences = false; }
    });
  }

  loadAffectations(): void {
    this.loadingAffectations = true;
    this.personnelService.affectations({ page: this.currentPageAffectations }).subscribe({
      next: data => {
        this.affectations = data.results;
        this.totalAffectations = data.count;
        this.loadingAffectations = false;
      },
      error: () => { this.loadingAffectations = false; }
    });
  }

  loadConges(): void {
    this.loadingConges = true;
    this.personnelService.conges({ page: this.currentPageConges }).subscribe({
      next: data => {
        this.conges = data.results;
        this.totalConges = data.count;
        this.loadingConges = false;
      },
      error: () => { this.loadingConges = false; }
    });
  }

  showTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'liste') this.load();
    else if (tab === 'presences') this.loadPresences();
    else if (tab === 'affectations') this.loadAffectations();
    else if (tab === 'conges') this.loadConges();
  }

  // Search & Pagination
  onSearch(term: string): void { this.searchTerm = term; this.currentPage = 1; this.load(); }
  onPageChange(page: number): void { this.currentPage = page; this.load(); }
  onSearchPresence(term: string): void { this.currentPagePresences = 1; this.loadPresences(); }
  onPageChangePresence(page: number): void { this.currentPagePresences = page; this.loadPresences(); }
  onPageChangeAffectation(page: number): void { this.currentPageAffectations = page; this.loadAffectations(); }
  onPageChangeConge(page: number): void { this.currentPageConges = page; this.loadConges(); }

  // Pointage
  pointer(): void {
    this.personnelService.pointer().subscribe({
      next: () => { alert('Pointage enregistré!'); this.loadPresences(); },
      error: () => { alert('Erreur: Vous n\'êtes peut-être pas enregistré comme employé.'); }
    });
  }

  // Salarié
  openForm(salarie?: any): void {
    this.editingSalarie = salarie || null;
    if (salarie) {
      this.salarieForm.patchValue(salarie);
    } else {
      this.salarieForm.reset({ date_embauche: new Date().toISOString().split('T')[0] });
    }
    this.showSalarieForm = true;
  }
  closeSalarieForm(): void { this.showSalarieForm = false; this.editingSalarie = null; }
  onEditSalarie(salarie: any): void { this.openForm(salarie); }
  onDeleteSalarie(salarie: any): void {
    if (confirm(`Supprimer "${salarie.nom} ${salarie.prenom}" ?`)) {
      this.financeService.deleteSalarie(salarie.id).subscribe(() => this.load());
    }
  }
  onSubmitSalarie(): void {
    if (this.salarieForm.invalid) return;
    this.savingSalarie = true;
    const data = this.salarieForm.value;
    // Create user first, then salarie
    // For now, create directly via salaries endpoint
    const obs = this.editingSalarie
      ? this.financeService.updateSalarie(this.editingSalarie.id, data)
      : this.financeService.createSalarie(data);
    obs.subscribe({
      next: () => { this.savingSalarie = false; this.closeSalarieForm(); this.load(); this.loadStats(); },
      error: () => { this.savingSalarie = false; }
    });
  }

  // Presence
  openPresenceForm(presence?: any): void {
    this.editingPresence = presence || null;
    if (presence) {
      this.presenceForm.patchValue(presence);
    } else {
      this.presenceForm.reset({ date: new Date().toISOString().split('T')[0], statut: 'present' });
    }
    this.showPresenceForm = true;
  }
  closePresenceForm(): void { this.showPresenceForm = false; this.editingPresence = null; }
  onEditPresence(presence: any): void { this.openPresenceForm(presence); }
  onSubmitPresence(): void {
    if (this.presenceForm.invalid) return;
    this.savingPresence = true;
    const obs = this.editingPresence
      ? this.personnelService.updatePresence(this.editingPresence.id, this.presenceForm.value)
      : this.personnelService.createPresence(this.presenceForm.value);
    obs.subscribe({
      next: () => { this.savingPresence = false; this.closePresenceForm(); this.loadPresences(); this.loadStats(); },
      error: () => { this.savingPresence = false; }
    });
  }

  // Affectation
  openAffectationForm(affectation?: any): void {
    this.editingAffectation = affectation || null;
    if (affectation) {
      this.affectationForm.patchValue(affectation);
    } else {
      this.affectationForm.reset({ date_debut: new Date().toISOString().split('T')[0] });
    }
    this.showAffectationForm = true;
  }
  closeAffectationForm(): void { this.showAffectationForm = false; this.editingAffectation = null; }
  onEditAffectation(affectation: any): void { this.openAffectationForm(affectation); }
  onDeleteAffectation(affectation: any): void {
    if (confirm('Supprimer cette affectation ?')) {
      this.personnelService.deleteAffectation(affectation.id).subscribe(() => this.loadAffectations());
    }
  }
  onSubmitAffectation(): void {
    if (this.affectationForm.invalid) return;
    this.savingAffectation = true;
    const obs = this.editingAffectation
      ? this.personnelService.updateAffectation(this.editingAffectation.id, this.affectationForm.value)
      : this.personnelService.createAffectation(this.affectationForm.value);
    obs.subscribe({
      next: () => { this.savingAffectation = false; this.closeAffectationForm(); this.loadAffectations(); },
      error: () => { this.savingAffectation = false; }
    });
  }

  // Congé
  openCongeForm(conge?: any): void {
    this.editingConge = conge || null;
    if (conge) {
      this.congeForm.patchValue(conge);
    } else {
      this.congeForm.reset();
    }
    this.showCongeForm = true;
  }
  closeCongeForm(): void { this.showCongeForm = false; this.editingConge = null; }
  onEditConge(conge: any): void { this.openCongeForm(conge); }
  onSubmitConge(): void {
    if (this.congeForm.invalid) return;
    this.savingConge = true;
    this.personnelService.createConge(this.congeForm.value).subscribe({
      next: () => { this.savingConge = false; this.closeCongeForm(); this.loadConges(); },
      error: () => { this.savingConge = false; }
    });
  }
}

