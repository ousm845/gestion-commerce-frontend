import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../core/services/api.service';

@Component({
  selector: 'app-bulletins-paie',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>📄 Bulletins de Paie</h3>
          <p class="subtitle">Gestion des salaires et paie</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouveau Bulletin</button>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card red">
          <strong>{{ stats.total_a_payer | number:'1.0-0' }} FCA</strong>
          <small>À Payer</small>
        </div>
        <div class="stat-card green">
          <strong>{{ stats.total_payes | number:'1.0-0' }} FCA</strong>
          <small>Payés</small>
        </div>
        <div class="stat-card">
          <strong>{{ stats.nombre_bulletins }}</strong>
          <small>Bulletins ce mois</small>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Salarié</th>
              <th>Période</th>
              <th>Brut</th>
              <th>Net</th>
              <th>Statut</th>
              <th>Date Paiement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bulletins">
              <td>{{ b.salarie_nom }}</td>
              <td>{{ b.periode_fin | date:'dd/MM/yyyy' }}</td>
              <td>{{ b.salaire_brut | number:'1.0-0' }} FCA</td>
              <td>{{ b.net_a_payer | number:'1.0-0' }} FCA</td>
              <td><span class="badge" [class]="'badge-' + b.statut">{{ b.statut_display }}</span></td>
              <td>{{ b.date_paie | date:'dd/MM/yyyy' }}</td>
              <td class="actions-cell">
                <button class="btn-icon" (click)="telecharger(b)" title="Télécharger PDF">📥</button>
                <button class="btn-icon" (click)="envoyerEmail(b)" title="Envoyer par email">📧</button>
                <button class="btn-icon" (click)="valider(b)" *ngIf="b.statut === 'brouillon'" title="Valider">✅</button>
                <button class="btn-icon" (click)="payer(b)" *ngIf="b.statut === 'valide'" title="Payer">💰</button>
                <button class="btn-icon" (click)="openForm(b)" title="Modifier">✏️</button>
              </td>
            </tr>
            <tr *ngIf="bulletins.length === 0 && !loading">
              <td colspan="7" class="text-center">Aucun bulletin de paie</td>
            </tr>
            <tr *ngIf="loading">
              <td colspan="7" class="text-center">Chargement...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalCount > 10">
        <button (click)="pageChange(currentPage - 1)" [disabled]="currentPage === 1">Précédent</button>
        <span>Page {{ currentPage }} sur {{ Math.ceil(totalCount / 10) }}</span>
        <button (click)="pageChange(currentPage + 1)" [disabled]="currentPage >= Math.ceil(totalCount / 10)">Suivant</button>
      </div>

      <!-- Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>📄 {{ editing ? 'Modifier' : 'Nouveau' }} Bulletin de Paie</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Salarié *</label>
                <select formControlName="salarie">
                  <option [ngValue]="null">Sélectionner</option>
                  <option *ngFor="let s of salaries" [ngValue]="s.id">{{ s.user_nom }} - {{ s.salaire_base | number }} FCA</option>
                </select>
              </div>
              <div class="form-group">
                <label>Période *</label>
                <div style="display: flex; gap: 8px;">
                  <input type="date" formControlName="periode_debut" />
                  <input type="date" formControlName="periode_fin" />
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date de paie *</label>
                <input type="date" formControlName="date_paie" />
              </div>
              <div class="form-group">
                <label>Salaire de base *</label>
                <input type="number" formControlName="salaire_base" min="0" />
              </div>
            </div>

            <div class="form-section-title">Éléments du salaire</div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Heures supplémentaires</label>
                <input type="number" formControlName="heures_supplementaires" min="0" step="0.5" />
              </div>
              <div class="form-group">
                <label>Taux heure sup.</label>
                <input type="number" formControlName="taux_heure_sup" min="0" />
              </div>
              <div class="form-group">
                <label>Prime</label>
                <input type="number" formControlName="prime" min="0" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Prime d'ancienneté</label>
                <input type="number" formControlName="prime_anciennete" min="0" />
              </div>
              <div class="form-group">
                <label>Indemnité transport</label>
                <input type="number" formControlName="indemnite_transport" min="0" />
              </div>
              <div class="form-group">
                <label>Indemnité logement</label>
                <input type="number" formControlName="indemnite_logement" min="0" />
              </div>
            </div>

            <div class="form-section-title">Retenues</div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Cotisation CNPS (5.6%)</label>
                <input type="number" formControlName="cnps_employee" min="0" />
              </div>
              <div class="form-group">
                <label>Impôt sur salaire</label>
                <input type="number" formControlName="impots_salaire" min="0" />
              </div>
              <div class="form-group">
                <label>Autres retenues</label>
                <input type="number" formControlName="autres_retenues" min="0" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Source paiement</label>
                <select formControlName="source_paiement">
                  <option [ngValue]="null">Sélectionner</option>
                  <option *ngFor="let c of caisses" [ngValue]="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea formControlName="notes" rows="2"></textarea>
              </div>
            </div>

            <div class="salaire-summary" *ngIf="form.value.salaire_base">
              <div class="summary-row">
                <span>Salaire Brut:</span>
                <strong>{{ calculerBrut() | number:'1.0-0' }} FCA</strong>
              </div>
              <div class="summary-row">
                <span>Total Retenues:</span>
                <strong>{{ calculerRetenues() | number:'1.0-0' }} FCA</strong>
              </div>
              <div class="summary-row total">
                <span>Net à Payer:</span>
                <strong>{{ calculerNet() | number:'1.0-0' }} FCA</strong>
              </div>
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

      <!-- Payment Modal -->
      <div class="modal-overlay" *ngIf="showPayment" (click)="showPayment=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>💰 Payer le Bulletin</h4>
            <button class="close-btn" (click)="showPayment=false">✕</button>
          </div>
          <div class="modal-form">
            <p>Montant à payer: <strong>{{ selectedBulletin?.net_a_payer | number:'1.0-0' }} FCA</strong></p>
            <div class="form-group">
              <label>Source de paiement</label>
              <select [(ngModel)]="paymentSource">
                <option value="caisse">Caisse</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showPayment=false">Annuler</button>
              <button class="btn btn-success" (click)="confirmPayment()">Confirmer Paiement</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-lg { max-width: 700px; }
    .form-section-title { font-weight: 600; margin: 16px 0 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .salaire-summary { background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .summary-row.total { border-top: 2px solid #374151; margin-top: 8px; padding-top: 8px; font-size: 18px; }
    .stats-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px 20px; border-left: 4px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card.green { border-color: #10b981; }
    .stat-card.red { border-color: #ef4444; }
    .stat-card strong { display: block; font-size: 18px; font-weight: 800; }
    .stat-card small { color: #999; font-size: 12px; }
    .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .data-table th { background: #f9fafb; font-weight: 600; color: #374151; }
    .data-table tr:hover { background: #f9fafb; }
    .actions-cell { display: flex; gap: 4px; }
    .btn-icon { background: none; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 14px; }
    .btn-icon:hover { background: #f3f4f6; }
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
    .badge-brouillon { background: #fef3c7; color: #92400e; }
    .badge-valide { background: #dbeafe; color: #1e40af; }
    .badge-paye { background: #d1fae5; color: #065f46; }
    .pagination { display: flex; justify-content: center; gap: 16px; margin-top: 16px; align-items: center; }
    .text-center { text-align: center; }
  `]
})
export class BulletinsPaieComponent implements OnInit {
  bulletins: any[] = [];
  salaries: any[] = [];
  caisses: any[] = [];
  loading = false;
  saving = false;
  totalCount = 0;
  currentPage = 1;
  showForm = false;
  showPayment = false;
  editing: any = null;
  selectedBulletin: any = null;
  paymentSource = 'caisse';
  form!: FormGroup;
  stats: any = null;
  Math = Math;

  constructor(
    private financeService: FinanceService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadSalaries();
    this.loadCaisses();
    this.loadStats();
  }

  load(): void {
    this.loading = true;
    this.financeService.bulletinsPaie({ page: this.currentPage }).subscribe({
      next: d => { this.bulletins = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadSalaries(): void {
    this.financeService.salariesActifs().subscribe(d => this.salaries = d);
  }

  loadCaisses(): void {
    this.financeService.caisses().subscribe(d => this.caisses = d.results);
  }

  loadStats(): void {
    this.financeService.statsBulletinsPaie().subscribe(s => this.stats = s);
  }

  pageChange(p: number): void {
    this.currentPage = p;
    this.load();
  }

  buildForm(d?: any): void {
    this.form = this.fb.group({
      salarie: [d?.salarie || null, Validators.required],
      periode_debut: [d?.periode_debut || '', Validators.required],
      periode_fin: [d?.periode_fin || '', Validators.required],
      date_paie: [d?.date_paie || new Date().toISOString().split('T')[0], Validators.required],
      salaire_base: [d?.salaire_base || 0, [Validators.required, Validators.min(0)]],
      heures_supplementaires: [d?.heures_supplementaires || 0],
      taux_heure_sup: [d?.taux_heure_sup || 0],
      prime: [d?.prime || 0],
      prime_anciennete: [d?.prime_anciennete || 0],
      indemnite_transport: [d?.indemnite_transport || 0],
      indemnite_logement: [d?.indemnite_logement || 0],
      cnps_employee: [d?.cnps_employee || 0],
      impots_salaire: [d?.impots_salaire || 0],
      autres_retenues: [d?.autres_retenues || 0],
      source_paiement: [d?.source_paiement || null],
      notes: [d?.notes || '']
    });
  }

  calculerBrut(): number {
    const v = this.form.value;
    const heuresSupMontant = (v.heures_supplementaires || 0) * (v.taux_heure_sup || 0);
    return (v.salaire_base || 0) + heuresSupMontant + (v.prime || 0) + 
           (v.prime_anciennete || 0) + (v.indemnite_transport || 0) + (v.indemnite_logement || 0);
  }

  calculerRetenues(): number {
    const v = this.form.value;
    return (v.cnps_employee || 0) + (v.impots_salaire || 0) + (v.autres_retenues || 0);
  }

  calculerNet(): number {
    return this.calculerBrut() - this.calculerRetenues();
  }

  openForm(d?: any): void { this.editing = d || null; this.buildForm(d); this.showForm = true; }
  closeForm(): void { this.showForm = false; this.editing = null; }

  onSubmit(): void {
    if (this.form.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    this.saving = true;
    const data = this.form.value;
    
    const numericFields = [
      'salaire_base', 'heures_supplementaires', 'taux_heure_sup', 'prime',
      'prime_anciennete', 'indemnite_transport', 'indemnite_logement',
      'cnps_employee', 'impots_salaire', 'autres_retenues'
    ];
    numericFields.forEach(field => {
      if (data[field] !== null && data[field] !== undefined) {
        data[field] = parseFloat(data[field]) || 0;
      }
    });
    
    const dateFields = ['periode_debut', 'periode_fin', 'date_paie'];
    dateFields.forEach(field => {
      if (data[field]) {
        if (data[field] instanceof Date) {
          data[field] = data[field].toISOString().split('T')[0];
        }
        if (typeof data[field] === 'string' && data[field].includes('T')) {
          data[field] = data[field].split('T')[0];
        }
      }
    });
    
    delete data.salaire_brut;
    delete data.net_a_payer;
    delete data.cree_par;
    delete data.statut;
    
    if (this.editing) {
      this.financeService.updateBulletinPaie(this.editing.id, data).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.load(); this.loadStats(); },
        error: (err) => { 
          this.saving = false;
          console.error('Erreur mise à jour:', err);
          const msg = err.error ? JSON.stringify(err.error) : 'Erreur lors de la mise à jour';
          alert(msg);
        }
      });
    } else {
      this.financeService.createBulletinPaie(data).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.load(); this.loadStats(); },
        error: (err) => { 
          this.saving = false;
          console.error('Erreur création:', err);
          const msg = err.error ? JSON.stringify(err.error) : 'Erreur lors de la création';
          alert(msg);
        }
      });
    }
  }

  valider(bulletin: any): void {
    if (confirm('Valider ce bulletin de paie ?')) {
      this.financeService.validerBulletinPaie(bulletin.id).subscribe(() => {
        this.load();
        this.loadStats();
      });
    }
  }

  payer(bulletin: any): void {
    this.selectedBulletin = bulletin;
    this.showPayment = true;
  }

  confirmPayment(): void {
    if (!this.selectedBulletin) return;
    this.financeService.payerBulletinPaie(this.selectedBulletin.id, { source: this.paymentSource }).subscribe({
      next: () => { this.showPayment = false; this.load(); this.loadStats(); },
      error: (err) => { alert(err.error?.error || 'Erreur lors du paiement'); }
    });
  }

  telecharger(bulletin: any): void {
    window.open(`/api/finance/bulletins-paie/${bulletin.id}/telecharger/`, '_blank');
  }

  envoyerEmail(bulletin: any): void {
    const email = prompt('Entrez l\'adresse email du destinataire:', '');
    if (email) {
      this.financeService.envoyerBulletinEmail(bulletin.id, email).subscribe({
        next: (res: any) => { alert(res.message || 'Email envoyé avec succès'); },
        error: (err) => { alert(err.error?.error || 'Erreur lors de l\'envoi de l\'email'); }
      });
    }
  }
}

