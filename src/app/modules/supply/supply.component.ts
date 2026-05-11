import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SupplyService, ProduitService, StockService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-supply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🛒 Approvisionnements</h3>
          <p class="subtitle">Gestion des commandes fournisseurs</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvelle Commande</button>
      </div>

      <app-data-table
        [columns]="columns" [data]="commandes" [loading]="loading"
        [totalCount]="totalCount" [currentPage]="currentPage"
        (search)="onSearch($event)" (pageChange)="onPageChange($event)"
        (edit)="viewDetail($event)" (delete)="onDelete($event)">
        <div tableActions style="display:flex;gap:6px">
          <select class="filter-select" (change)="filterByStatut($event)">
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option>
            <option value="recue">Reçue</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </app-data-table>

      <!-- Nouvelle Commande Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card modal-card-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>🛒 Nouvelle Commande Fournisseur</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Fournisseur *</label>
                <select formControlName="fournisseur">
                  <option [ngValue]="null">— Sélectionner —</option>
                  <option *ngFor="let f of fournisseurs" [ngValue]="f.id">{{ f.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Stock Destination *</label>
                <select formControlName="stock_destination">
                  <option [ngValue]="null">— Sélectionner —</option>
                  <option *ngFor="let s of stocks" [ngValue]="s.id">{{ s.nom }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Date Livraison Prévue</label>
              <input type="date" formControlName="date_livraison_prevue" />
            </div>

            <div class="section-title">Produits Commandés</div>
            <div formArrayName="lignes">
              <div *ngFor="let ligne of lignesArray.controls; let i = index" [formGroupName]="i" class="ligne-form">
                <div class="form-row" style="grid-template-columns: 2fr 1fr 1fr auto; align-items: end">
                  <div class="form-group">
                    <label>Produit *</label>
                    <select formControlName="produit" (change)="onProduitSelect(i)">
                      <option [ngValue]="null">— Produit —</option>
                      <option *ngFor="let p of produits" [ngValue]="p.id">{{ p.nom }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Quantité *</label>
                    <input type="number" formControlName="quantite_commandee" min="0.01" step="0.01" />
                  </div>
                  <div class="form-group">
                    <label>Prix Unitaire *</label>
                    <input type="number" formControlName="prix_unitaire" min="0" />
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeLigne(i)">✕</button>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-secondary" (click)="addLigne()">+ Ajouter Produit</button>

            <div class="form-group" style="margin-top:16px">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                {{ saving ? '...' : 'Créer la Commande' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedCommande" (click)="selectedCommande = null">
        <div class="modal-card modal-card-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>Commande {{ selectedCommande.numero }}</h4>
            <button class="close-btn" (click)="selectedCommande = null">✕</button>
          </div>
          <div style="padding: 0 24px 24px">
            <div class="commande-info">
              <p><strong>Fournisseur:</strong> {{ selectedCommande.fournisseur_nom }}</p>
              <p><strong>Stock:</strong> {{ selectedCommande.stock_nom }}</p>
              <p><strong>Statut:</strong> <span class="badge badge-{{ selectedCommande.statut }}">{{ selectedCommande.statut_display }}</span></p>
              <p><strong>Total à payer:</strong> {{ selectedCommande.montant_total | number:'1.0-0' }} FCFA</p>
              <p><strong>Montant reçu:</strong> {{ selectedCommande.montant_recu | number:'1.0-0' }} FCFA</p>
            </div>

            <table class="detail-table">
              <thead><tr><th>Produit</th><th>Commandé</th><th>Reçu</th><th>Prix Unit.</th><th>Montant Commandé</th><th>Montant Reçu</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of selectedCommande.lignes">
                  <td>{{ l.produit_nom }}</td>
                  <td>{{ l.quantite_commandee }}</td>
                  <td>{{ l.quantite_recue }}</td>
                  <td>{{ l.prix_unitaire | number:'1.0-0' }} FCFA</td>
                  <td>{{ l.montant_commande | number:'1.0-0' }} FCFA</td>
                  <td>{{ l.montant_total | number:'1.0-0' }} FCFA</td>
                </tr>
              </tbody>
            </table>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedCommande = null">Fermer</button>
              <button *ngIf="selectedCommande.statut === 'brouillon'" class="btn btn-info" (click)="valider(selectedCommande)">✓ Valider</button>
              <button *ngIf="selectedCommande.statut === 'validee'" class="btn btn-success" (click)="receptionner(selectedCommande)">📦 Réceptionner</button>
              <button *ngIf="['brouillon','validee'].includes(selectedCommande.statut)" class="btn btn-danger" (click)="annuler(selectedCommande)">✕ Annuler</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-select { padding: 8px 14px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 13px; }
    .commande-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
    .commande-info p { font-size: 13px; color: #333; }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .detail-table th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid #e9ecef; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; }
    .section-title { font-size: 13px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 10px; }
    .ligne-form { background: #f8f9fa; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
  `]
})
export class SupplyComponent implements OnInit {
  commandes: any[] = [];
  fournisseurs: any[] = [];
  stocks: any[] = [];
  produits: any[] = [];
  loading = false; saving = false;
  totalCount = 0; currentPage = 1;
  showForm = false;
  selectedCommande: any = null;
  searchTerm = ''; statutFilter = '';
  form!: FormGroup;

  columns: TableColumn[] = [
    { key: 'numero', label: 'N° Commande' },
    { key: 'fournisseur_nom', label: 'Fournisseur' },
    { key: 'stock_nom', label: 'Stock' },
    { key: 'montant_total', label: 'Montant', type: 'money' },
    { key: 'statut', label: 'Statut', type: 'badge' },
    { key: 'date_commande', label: 'Date', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor(
    private supplyService: SupplyService,
    private produitService: ProduitService,
    private stockService: StockService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm(); this.load();
    this.produitService.fournisseurs({ page_size: 200 }).subscribe(d => this.fournisseurs = d.results);
    this.stockService.list({ page_size: 200 }).subscribe(d => this.stocks = d.results);
    this.produitService.list({ page_size: 500 }).subscribe(d => this.produits = d.results);
  }

  buildForm(): void {
    this.form = this.fb.group({
      fournisseur: [null, Validators.required],
      stock_destination: [null, Validators.required],
      date_livraison_prevue: [null],
      notes: [''],
      lignes: this.fb.array([])
    });
  }

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }

  addLigne(): void {
    this.lignesArray.push(this.fb.group({
      produit: [null, Validators.required],
      quantite_commandee: [1, [Validators.required, Validators.min(0.01)]],
      quantite_recue: [0],
      prix_unitaire: [0, Validators.required]
    }));
  }

  removeLigne(i: number): void { this.lignesArray.removeAt(i); }

  onProduitSelect(i: number): void {
    const ctrl = this.lignesArray.at(i);
    const pid = ctrl.get('produit')?.value;
    const p = this.produits.find(x => x.id === pid);
    if (p && p.prix_achat) ctrl.get('prix_unitaire')?.setValue(p.prix_achat);
  }

  load(): void {
    this.loading = true;
    const params: any = { page: this.currentPage, search: this.searchTerm };
    if (this.statutFilter) params['statut'] = this.statutFilter;
    this.supplyService.list(params).subscribe({
      next: d => { this.commandes = d.results; this.totalCount = d.count; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  filterByStatut(event: any): void { this.statutFilter = event.target.value; this.load(); }
  onSearch(t: string): void { this.searchTerm = t; this.currentPage = 1; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(): void { this.buildForm(); this.showForm = true; }
  closeForm(): void { this.showForm = false; }
  viewDetail(commande: any): void { this.supplyService.get_(commande.id).subscribe(c => this.selectedCommande = c); }
  onDelete(c: any): void { if (confirm('Annuler cette commande ?')) this.annuler(c); }

  valider(c: any): void {
    this.supplyService.valider(c.id).subscribe(updated => { this.selectedCommande = updated; this.load(); });
  }

  receptionner(c: any): void {
    const quantites: any = {};
    c.lignes.forEach((l: any) => quantites[l.id] = l.quantite_commandee);
    this.supplyService.receptionner(c.id, quantites).subscribe(updated => { this.selectedCommande = updated; this.load(); });
  }

  annuler(c: any): void {
    this.supplyService.annuler(c.id).subscribe(() => { this.selectedCommande = null; this.load(); });
  }

  formatError(errorObj: any): string {
    let msg = '';
    for (const key in errorObj) {
      if (Array.isArray(errorObj[key])) {
        msg += key + ': ';
        errorObj[key].forEach((e: any, i: number) => {
          if (typeof e === 'object') {
            msg += '\n  - ' + this.formatError(e);
          } else {
            msg += e + (i < errorObj[key].length - 1 ? ', ' : '');
          }
        });
        msg += '\n';
      } else if (typeof errorObj[key] === 'object') {
        msg += key + ': ' + this.formatError(errorObj[key]) + '\n';
      } else {
        msg += key + ': ' + errorObj[key] + '\n';
      }
    }
    return msg;
  }

  onSubmit(): void {
    const formValue = this.form.value;
    
    // Prepare data in the correct format for Django
    const data: any = {
      fournisseur: formValue.fournisseur,
      stock_destination: formValue.stock_destination,
      date_livraison_prevue: formValue.date_livraison_prevue || null,
      notes: formValue.notes || '',
      lignes: []
    };
    
    // Transform lignes array
    for (const ligne of this.lignesArray.value) {
      if (ligne.produit && ligne.quantite_commandee && ligne.prix_unitaire) {
        data.lignes.push({
          produit: ligne.produit,
          quantite_commandee: Number(ligne.quantite_commandee),
          quantite_recue: 0,
          prix_unitaire: Number(ligne.prix_unitaire)
        });
      }
    }
    
    console.log('Submitting data:', JSON.stringify(data, null, 2));
    
    if (!data.fournisseur || !data.stock_destination || data.lignes.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires et ajouter au moins un produit.');
      return;
    }
    
    this.saving = true;
    this.supplyService.create(data).subscribe({
      next: (result) => { 
        console.log('Success:', result);
        this.saving = false; 
        this.closeForm(); 
        this.load(); 
      },
      error: (err) => { 
        console.error('Full error:', err);
        console.log('Error response:', err.error);
        this.saving = false; 
        
        // Parse error response with more details
        let errorMessage = 'Erreur inconnue';
        if (err.error) {
          errorMessage = this.formatError(err.error);
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        alert('Erreur:\n' + errorMessage);
      }
    });
  }
}
