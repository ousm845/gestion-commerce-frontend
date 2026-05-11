import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { FinanceService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-comptabilite',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="tabs">
        <button [class.active]="activeTab === 'comptes'" (click)="activeTab = 'comptes'">📒 Plan Comptable</button>
        <button [class.active]="activeTab === 'journaux'" (click)="activeTab = 'journaux'">📔 Journaux</button>
        <button [class.active]="activeTab === 'ecritures'" (click)="activeTab = 'ecritures'">📝 Écritures</button>
        <button [class.active]="activeTab === 'balance'" (click)="activeTab = 'balance'">⚖️ Balance</button>
      </div>

      <!-- PLAN COMPTABLE -->
      <div *ngIf="activeTab === 'comptes'" class="tab-content">
        <div class="page-header">
          <div>
            <h3>📒 Plan Comptable</h3>
            <p class="subtitle">Gestion du plan comptable</p>
          </div>
          <button class="btn btn-primary" (click)="openCompteForm()">+ Nouveau Compte</button>
        </div>
        <app-data-table
          [columns]="compteColumns" [data]="comptes" [loading]="loading"
          [totalCount]="totalComptes" [currentPage]="pageComptes"
          (pageChange)="loadComptes($event)">
        </app-data-table>
      </div>

      <!-- JOURNAUX -->
      <div *ngIf="activeTab === 'journaux'" class="tab-content">
        <div class="page-header">
          <div>
            <h3>📔 Journaux Comptables</h3>
            <p class="subtitle">Gestion des journaux</p>
          </div>
          <button class="btn btn-primary" (click)="openJournalForm()">+ Nouveau Journal</button>
        </div>
        <app-data-table
          [columns]="journalColumns" [data]="journaux" [loading]="loadingJournaux"
          [totalCount]="totalJournaux" [currentPage]="pageJournaux"
          (pageChange)="loadJournaux($event)">
        </app-data-table>
      </div>

      <!-- ÉCRITURES -->
      <div *ngIf="activeTab === 'ecritures'" class="tab-content">
        <div class="page-header">
          <div>
            <h3>📝 Écritures Comptables</h3>
            <p class="subtitle">Saisie des opérations</p>
          </div>
          <button class="btn btn-primary" (click)="openEcritureForm()">+ Nouvelle Écriture</button>
        </div>
        <app-data-table
          [columns]="ecritureColumns" [data]="ecritures" [loading]="loadingEcritures"
          [totalCount]="totalEcritures" [currentPage]="pageEcritures"
          (pageChange)="loadEcritures($event)">
        </app-data-table>
      </div>

      <!-- BALANCE -->
      <div *ngIf="activeTab === 'balance'" class="tab-content">
        <div class="page-header">
          <div>
            <h3>⚖️ Balance des Comptes</h3>
            <p class="subtitle">Résumé des soldes</p>
          </div>
          <button class="btn btn-primary" (click)="loadBalance()">🔄 Actualiser</button>
        </div>
        <app-data-table
          [columns]="balanceColumns" [data]="balance" [loading]="loadingBalance"
          [totalCount]="balance.length">
        </app-data-table>
      </div>

      <!-- MODAL: COMPTE -->
      <div class="modal-overlay" *ngIf="showCompteForm" (click)="showCompteForm=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>📒 {{ editingCompte ? 'Modifier' : 'Nouveau' }} Compte</h4>
            <button class="close-btn" (click)="showCompteForm=false">✕</button>
          </div>
          <form [formGroup]="compteForm" (ngSubmit)="saveCompte()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Numéro *</label>
                <input type="text" formControlName="numero" placeholder="Ex: 601" />
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" formControlName="nom" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nature</label>
                <select formControlName="nature">
                  <option value="actif">Actif</option>
                  <option value="passif">Passif</option>
                  <option value="charge">Charge</option>
                  <option value="produit">Produit</option>
                </select>
              </div>
              <div class="form-group">
                <label>Compte Parent</label>
                <select formControlName="compte_parent">
                  <option [ngValue]="null">Aucun</option>
                  <option *ngFor="let c of comptes" [ngValue]="c.id">{{ c.numero }} - {{ c.nom }}</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCompteForm=false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="compteForm.invalid">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: JOURNAL -->
      <div class="modal-overlay" *ngIf="showJournalForm" (click)="showJournalForm=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>📔 {{ editingJournal ? 'Modifier' : 'Nouveau' }} Journal</h4>
            <button class="close-btn" (click)="showJournalForm=false">✕</button>
          </div>
          <form [formGroup]="journalForm" (ngSubmit)="saveJournal()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Code *</label>
                <input type="text" formControlName="code" placeholder="Ex: ACH, VTE, CAI" />
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" formControlName="nom" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showJournalForm=false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="journalForm.invalid">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: ÉCRITURE -->
      <div class="modal-overlay" *ngIf="showEcritureForm" (click)="showEcritureForm=false">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>📝 {{ editingEcriture ? 'Modifier' : 'Nouvelle' }} Écriture</h4>
            <button class="close-btn" (click)="showEcritureForm=false">✕</button>
          </div>
          <form [formGroup]="ecritureForm" (ngSubmit)="saveEcriture()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Journal *</label>
                <select formControlName="journal">
                  <option *ngFor="let j of journaux" [value]="j.id">{{ j.code }} - {{ j.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Numéro de pièce *</label>
                <input type="text" formControlName="numero_piece" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date écriture *</label>
                <input type="date" formControlName="date_ecriture" />
              </div>
              <div class="form-group">
                <label>Date pièce</label>
                <input type="date" formControlName="date_piece" />
              </div>
            </div>
            <div class="form-group">
              <label>Libellé *</label>
              <input type="text" formControlName="libelle" />
            </div>

            <div class="lignes-section">
              <div class="section-header">
                <span>Lignes d'écriture</span>
                <button type="button" class="btn btn-sm btn-secondary" (click)="addLigne()">+ Ligne</button>
              </div>
              <table class="lignes-table">
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody formArrayName="lignes">
                  <tr *ngFor="let ligne of lignesArray.controls; let i=index" [formGroupName]="i">
                    <td>
                      <select formControlName="compte">
                        <option *ngFor="let c of comptes" [value]="c.id">{{ c.numero }} - {{ c.nom }}</option>
                      </select>
                    </td>
                    <td>
                      <select formControlName="type_ligne">
                        <option value="debit">Débit</option>
                        <option value="credit">Crédit</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" formControlName="montant" min="0" />
                    </td>
                    <td>
                      <button type="button" class="btn-icon" (click)="removeLigne(i)">🗑️</button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2"><strong>Total Débit:</strong></td>
                    <td><strong>{{ totalDebit | number:'1.0-0' }}</strong></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="2"><strong>Total Crédit:</strong></td>
                    <td><strong>{{ totalCredit | number:'1.0-0' }}</strong></td>
                    <td></td>
                  </tr>
                  <tr [class.error]="totalDebit !== totalCredit">
                    <td colspan="2"><strong>Écart:</strong></td>
                    <td><strong>{{ totalDebit - totalCredit | number:'1.0-0' }}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              <div class="error-msg" *ngIf="totalDebit !== totalCredit">
                ⚠️ L'écriture doit être équilibrée (débit = crédit)
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showEcritureForm=false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="ecritureForm.invalid || totalDebit !== totalCredit">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: #f3f4f6; padding: 4px; border-radius: 8px; }
    .tabs button { flex: 1; padding: 10px 16px; border: none; background: transparent; cursor: pointer; border-radius: 6px; font-weight: 500; }
    .tabs button.active { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .tab-content { animation: fadeIn 0.2s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-lg { max-width: 800px; }
    .lignes-section { margin: 16px 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 600; }
    .lignes-table { width: 100%; border-collapse: collapse; }
    .lignes-table th, .lignes-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    .lignes-table select, .lignes-table input { width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; }
    .lignes-table tfoot td { border-top: 2px solid #374151; }
    .lignes-table .error td { color: #ef4444; }
    .error-msg { color: #ef4444; font-weight: 600; margin-top: 8px; }
    .btn-icon { border: none; background: none; cursor: pointer; }
  `]
})
export class ComptabiliteComponent implements OnInit {
  activeTab = 'comptes';
  
  // Comptes
  comptes: any[] = [];
  loading = false;
  totalComptes = 0;
  pageComptes = 1;
  showCompteForm = false;
  editingCompte: any = null;
  compteForm!: FormGroup;

  // Journaux
  journaux: any[] = [];
  loadingJournaux = false;
  totalJournaux = 0;
  pageJournaux = 1;
  showJournalForm = false;
  editingJournal: any = null;
  journalForm!: FormGroup;

  // Écritures
  ecritures: any[] = [];
  loadingEcritures = false;
  totalEcritures = 0;
  pageEcritures = 1;
  showEcritureForm = false;
  editingEcriture: any = null;
  ecritureForm!: FormGroup;

  // Balance
  balance: any[] = [];
  loadingBalance = false;

  compteColumns: TableColumn[] = [
    { key: 'numero', label: 'Numéro' },
    { key: 'nom', label: 'Nom' },
    { key: 'nature_display', label: 'Nature' },
    { key: 'compte_parent_numero', label: 'Parent' },
    { key: 'solde', label: 'Solde', type: 'money' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  journalColumns: TableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'nom', label: 'Nom' },
    { key: 'is_active', label: 'Actif', type: 'boolean' }
  ];

  ecritureColumns: TableColumn[] = [
    { key: 'numero_piece', label: 'Pièce' },
    { key: 'journal_code', label: 'Journal' },
    { key: 'date_ecriture', label: 'Date', type: 'date' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'total_debit', label: 'Débit', type: 'money' },
    { key: 'total_credit', label: 'Crédit', type: 'money' },
    { key: 'valide_par_nom', label: 'Validé par' }
  ];

  balanceColumns: TableColumn[] = [
    { key: 'numero', label: 'Numéro' },
    { key: 'nom', label: 'Nom' },
    { key: 'nature', label: 'Nature' },
    { key: 'solde', label: 'Solde', type: 'money' }
  ];

  constructor(private financeService: FinanceService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadComptes();
    this.loadJournaux();
  }

  // ========== COMPTES ==========
  loadComptes(page = 1): void {
    this.pageComptes = page;
    this.loading = true;
    this.financeService.comptesComptables({ page }).subscribe({
      next: d => { this.comptes = d.results; this.totalComptes = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCompteForm(c?: any): void {
    this.editingCompte = c || null;
    this.compteForm = this.fb.group({
      numero: [c?.numero || '', Validators.required],
      nom: [c?.nom || '', Validators.required],
      nature: [c?.nature || 'charge'],
      compte_parent: [c?.compte_parent || null]
    });
    this.showCompteForm = true;
  }

  saveCompte(): void {
    if (this.compteForm.invalid) return;
    const data = this.compteForm.value;
    if (this.editingCompte) {
      this.financeService.updateCompteComptable(this.editingCompte.id, data).subscribe(() => {
        this.showCompteForm = false;
        this.loadComptes();
      });
    } else {
      this.financeService.createCompteComptable(data).subscribe(() => {
        this.showCompteForm = false;
        this.loadComptes();
      });
    }
  }

  // ========== JOURNAUX ==========
  loadJournaux(page = 1): void {
    this.pageJournaux = page;
    this.loadingJournaux = true;
    this.financeService.journaux({ page }).subscribe({
      next: d => { this.journaux = d.results; this.totalJournaux = d.count; this.loadingJournaux = false; },
      error: () => { this.loadingJournaux = false; }
    });
  }

  openJournalForm(j?: any): void {
    this.editingJournal = j || null;
    this.journalForm = this.fb.group({
      code: [j?.code || '', Validators.required],
      nom: [j?.nom || '', Validators.required]
    });
    this.showJournalForm = true;
  }

  saveJournal(): void {
    if (this.journalForm.invalid) return;
    const data = this.journalForm.value;
    if (this.editingJournal) {
      this.financeService.updateJournal(this.editingJournal.id, data).subscribe(() => {
        this.showJournalForm = false;
        this.loadJournaux();
      });
    } else {
      this.financeService.createJournal(data).subscribe(() => {
        this.showJournalForm = false;
        this.loadJournaux();
      });
    }
  }

  // ========== ÉCRITURES ==========
  loadEcritures(page = 1): void {
    this.pageEcritures = page;
    this.loadingEcritures = true;
    this.financeService.ecritures({ page }).subscribe({
      next: d => { this.ecritures = d.results; this.totalEcritures = d.count; this.loadingEcritures = false; },
      error: () => { this.loadingEcritures = false; }
    });
  }

  get lignesArray(): FormArray { return this.ecritureForm.get('lignes') as FormArray; }

  get totalDebit(): number {
    const arr = this.lignesArray;
    if (!arr || !arr.controls) return 0;
    let sum = 0;
    for (const c of arr.controls) {
      if (c.get('type_ligne')?.value === 'debit') {
        sum += c.get('montant')?.value || 0;
      }
    }
    return sum;
  }

  get totalCredit(): number {
    const arr = this.lignesArray;
    if (!arr || !arr.controls) return 0;
    let sum = 0;
    for (const c of arr.controls) {
      if (c.get('type_ligne')?.value === 'credit') {
        sum += c.get('montant')?.value || 0;
      }
    }
    return sum;
  }

  addLigne(): void {
    this.lignesArray.push(this.fb.group({
      compte: ['', Validators.required],
      type_ligne: ['debit'],
      montant: [0, [Validators.required, Validators.min(0.01)]]
    }));
  }

  removeLigne(i: number): void {
    this.lignesArray.removeAt(i);
  }

  openEcritureForm(e?: any): void {
    this.editingEcriture = e || null;
    this.ecritureForm = this.fb.group({
      journal: [e?.journal || (this.journaux[0]?.id || ''), Validators.required],
      numero_piece: [e?.numero_piece || ''],
      date_ecriture: [e?.date_ecriture || new Date().toISOString().split('T')[0]],
      date_piece: [e?.date_piece || new Date().toISOString().split('T')[0]],
      libelle: [e?.libelle || '', Validators.required],
      lignes: this.fb.array([])
    });

    if (e?.lignes?.length) {
      e.lignes.forEach((l: any) => {
        this.lignesArray.push(this.fb.group({
          compte: [l.compte],
          type_ligne: [l.type_ligne],
          montant: [l.montant]
        }));
      });
    } else {
      this.addLigne();
      this.addLigne();
    }
    this.showEcritureForm = true;
  }

  saveEcriture(): void {
    if (this.ecritureForm.invalid || this.totalDebit !== this.totalCredit) return;
    const data = this.ecritureForm.value;
    if (this.editingEcriture) {
      this.financeService.updateEcriture(this.editingEcriture.id, data).subscribe(() => {
        this.showEcritureForm = false;
        this.loadEcritures();
      });
    } else {
      this.financeService.createEcriture(data).subscribe({
        next: () => {
          this.showEcritureForm = false;
          this.loadEcritures();
        },
        error: (err: any) => { alert(err.error?.[0] || 'Erreur: écriture non équilibrée'); }
      });
    }
  }

  // ========== BALANCE ==========
  loadBalance(): void {
    this.loadingBalance = true;
    this.financeService.balance().subscribe({
      next: d => { this.balance = d; this.loadingBalance = false; },
      error: () => { this.loadingBalance = false; }
    });
  }
}
