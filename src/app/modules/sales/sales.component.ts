import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { VenteService, ProduitService, StockService, FactureService } from '../../core/services/api.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>💰 Gestion des Ventes</h3>
          <p class="subtitle">Suivi des ventes et paiements</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Nouvelle Vente</button>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card green">
          <strong>{{ stats.chiffre_affaires_mois | number:'1.0-0' }} FCA</strong>
          <small>CA du Mois</small>
        </div>
        <div class="stat-card blue">
          <strong>{{ stats.total_ventes }}</strong>
          <small>Total Ventes</small>
        </div>
        <div class="stat-card green">
          <strong>{{ getVentesPayees() }}</strong>
          <small>Payé</small>
        </div>
        <div class="stat-card red">
          <strong>{{ stats.en_credit }}</strong>
          <small>En Crédit</small>
        </div>
        <div class="stat-card orange">
          <strong>{{ stats.montant_credit_total | number:'1.0-0' }} FCA</strong>
          <small>Montant Dû</small>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input type="text" placeholder="Rechercher..." [(ngModel)]="searchTerm" (input)="onSearch()" class="search-input">
        <select [(ngModel)]="statutFilter" (change)="load()" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="paye">Payé</option>
          <option value="partiel">Partiel</option>
          <option value="credit">Crédit</option>
        </select>
      </div>

      <!-- Ventes List -->
      <div *ngIf="ventes.length > 0" style="margin-bottom: 20px;">
        <div *ngFor="let v of ventes" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid;" [style.border-color]="getStatutColor(v)">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <strong>{{ v.numero }}</strong>
              <span style="margin-left: 10px; color: #666;">{{ v.client_nom }}</span>
              <span style="margin-left: 10px; font-size: 12px; color: #999;">{{ v.stock_nom }}</span>
            </div>
            <div>
              <span class="badge" [class]="v.statut">{{ getStatutLabel(v) }}</span>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14px; color: #666;">
              {{ v.date_vente | date:'dd/MM/yyyy HH:mm' }}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: bold;">{{ v.montant_total | number:'1.0-0' }} FCA</div>
              <div *ngIf="v.montant_paye > 0" style="font-size: 13px; color: #10b981;">
                Payé: {{ v.montant_paye | number:'1.0-0' }} FCA
              </div>
              <div *ngIf="v.montant_restant > 0" style="font-size: 13px; color: #ef4444;">
                Restant: {{ v.montant_restant | number:'1.0-0' }} FCA
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; display: flex; gap: 8px; flex-wrap: wrap;">
            <button *ngIf="!v.facture_id" class="btn btn-sm btn-primary" (click)="genererFacture(v)">
              📄 Générer Facture
            </button>
            <button *ngIf="v.facture_id" class="btn btn-sm btn-info" (click)="voirFacture(v)">
              🖨️ Imprimer Facture
            </button>
            <button *ngIf="v.montant_restant > 0" class="btn btn-sm btn-success" (click)="openPaiement(v)">
              💳 Payer
            </button>
            <button class="btn btn-sm btn-danger" (click)="onDelete(v)">🗑️</button>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div *ngIf="!loading && ventes.length === 0" style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 8px;">
        <p>Aucune vente trouvée.</p>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalCount > 10" style="display: flex; justify-content: center; gap: 8px; margin-top: 20px;">
        <button class="btn btn-sm" (click)="onPageChange(currentPage - 1)" [disabled]="currentPage === 1">Précédent</button>
        <span style="padding: 8px;">Page {{ currentPage }} / {{ totalPages }}</span>
        <button class="btn btn-sm" (click)="onPageChange(currentPage + 1)" [disabled]="currentPage >= totalPages">Suivant</button>
      </div>

      <!-- Modal Form -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card modal-card-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>💰 Nouvelle Vente</h4>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Client *</label>
                <select formControlName="client">
                  <option value="">— Sélectionner client —</option>
                  <option *ngFor="let c of clients" [value]="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Stock *</label>
                <select formControlName="stock">
                  <option value="">— Sélectionner stock —</option>
                  <option *ngFor="let s of stocks" [value]="s.id">{{ s.nom }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Catégorie</label>
                <select formControlName="categorie" (change)="onCategorieChange()">
                  <option value="">Toutes les catégories</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.nom }}</option>
                </select>
              </div>
            </div>

            <div class="section-title">Produits</div>
            <div formArrayName="lignes">
              <div *ngFor="let ligne of lignesArray.controls; let i = index" [formGroupName]="i" class="ligne-form">
                <div class="form-row" style="grid-template-columns: 2fr 1fr 1fr 1fr auto; align-items: end">
                  <div class="form-group">
                    <label>Produit *</label>
                    <select formControlName="produit" (change)="onProduitChange(i)">
                      <option value="">— Produit —</option>
                      <option *ngFor="let p of produitsFiltres" [value]="p.id">{{ p.nom }}</option>
                    </select>
                    <!-- Stock Info Display -->
                    <div *ngIf="ligne.get('produit')?.value" class="stock-info" [ngClass]="getStockInfo(ligne.get('produit')?.value).statut">
                      <span *ngIf="getStockInfo(ligne.get('produit')?.value).statut === 'rupture'" class="stock-badge rupture">❌ Rupture</span>
                      <span *ngIf="getStockInfo(ligne.get('produit')?.value).statut === 'alerte'" class="stock-badge alerte">⚠️ Stock: {{ getStockInfo(ligne.get('produit')?.value).quantite }} {{ getStockInfo(ligne.get('produit')?.value).unite }}</span>
                      <span *ngIf="getStockInfo(ligne.get('produit')?.value).statut === 'ok'" class="stock-badge ok">✅ Stock: {{ getStockInfo(ligne.get('produit')?.value).quantite }} {{ getStockInfo(ligne.get('produit')?.value).unite }}</span>
                      <span *ngIf="getStockInfo(ligne.get('produit')?.value).statut === 'unknown'" class="stock-badge unknown">✅ Stock: {{ getStockInfo(ligne.get('produit')?.value).quantite }} {{ getStockInfo(ligne.get('produit')?.value).unite }}</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Quantité *</label>
                    <input type="number" formControlName="quantite" min="0.01" step="0.01" />
                  </div>
                  <div class="form-group">
                    <label>Prix Unitaire *</label>
                    <input type="number" formControlName="prix_unitaire" min="0" />
                  </div>
                  <div class="form-group">
                    <label>Remise %</label>
                    <input type="number" formControlName="remise" min="0" max="100" />
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeLigne(i)" style="margin-bottom:0">✕</button>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-secondary" (click)="addLigne()">+ Ajouter Produit</button>

            <div class="section-title" style="margin-top:20px">Paiement</div>
            <div class="form-row">
              <div class="form-group">
                <label>Montant Payé (FCFA)</label>
                <input type="number" formControlName="montant_paye" min="0" />
              </div>
              <div class="form-group">
                <label>Mode de Paiement</label>
                <select formControlName="mode_paiement">
                  <option value="espece">Espèce</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="wave">Wave</option>
                  <option value="carte">Carte Bancaire</option>
                  <option value="mixte">Mixte</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2"></textarea>
            </div>

            <div class="vente-totaux" *ngIf="montantTotal > 0">
              <div class="total-row">
                <span>Total</span>
                <strong>{{ montantTotal | number:'1.0-0' }} FCA</strong>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving || lignesArray.length === 0">
                {{ saving ? 'Enregistrement...' : 'Créer la Vente' }}
              </button>
              <button type="button" class="btn btn-success" (click)="envoyerCaisse()" [disabled]="form.invalid || saving || lignesArray.length === 0">
                {{ saving ? '...' : '💰 Envoyer à la Caisse' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Paiement Modal -->
      <div class="modal-overlay" *ngIf="showPaiement" (click)="closePaiement()">
        <div class="modal-card" style="max-width:400px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>💳 Enregistrer Paiement</h4>
            <button class="close-btn" (click)="closePaiement()">✕</button>
          </div>
          <div class="modal-form" *ngIf="selectedVente">
            <div class="vente-info-box">
              <p><strong>Vente:</strong> {{ selectedVente.numero }}</p>
              <p><strong>Client:</strong> {{ selectedVente.client_nom }}</p>
              <p><strong>Total:</strong> {{ selectedVente.montant_total | number:'1.0-0' }} FCA</p>
              <p><strong>Déjà payé:</strong> {{ selectedVente.montant_paye | number:'1.0-0' }} FCA</p>
              <p><strong>Restant dû:</strong> <span style="color: red;">{{ selectedVente.montant_restant | number:'1.0-0' }} FCA</span></p>
            </div>
            <div class="form-group">
              <label>Montant à payer (FCFA)</label>
              <input type="number" [(ngModel)]="paiementMontant" [max]="selectedVente.montant_restant" min="0" />
            </div>
            <div class="form-group">
              <label>Mode de Paiement</label>
              <select [(ngModel)]="paiementMode">
                <option value="espece">Espèce</option>
                <option value="orange_money">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="carte">Carte Bancaire</option>
              </select>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closePaiement()">Annuler</button>
              <button class="btn btn-success" (click)="enregistrerPaiement()">✓ Valider Paiement</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket Modal -->
      <div class="modal-overlay" *ngIf="showTicket" (click)="showTicket=false">
        <div class="modal-card" style="max-width:350px" (click)="$event.stopPropagation()">
          <div class="modal-header" style="background: #10b981; color: white;">
            <h4>🧾 Reçu de Paiement</h4>
            <button class="close-btn" (click)="showTicket=false" style="color: white;">✕</button>
          </div>
          
          <div class="ticket-preview" id="ticket-content">
            <div style="text-align: center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px;">
              <strong style="font-size: 18px;">SYLIDIGIT</strong><br>
              <span style="font-size: 11px;">Gestion Commerciale</span>
            </div>
            
            <div style="margin-bottom: 10px; font-size: 12px;">
              <div><strong>Date:</strong> {{ today | date:'dd/MM/yyyy HH:mm' }}</div>
              <div><strong>Ticket N°:</strong> {{ selectedVente?.numero }}</div>
              <div><strong>Client:</strong> {{ selectedVente?.client_nom }}</div>
            </div>

            <div style="border-bottom: 1px dashed #333; padding-bottom: 5px; margin-bottom: 5px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>Produit</span>
                <span>Qté x Prix</span>
              </div>
            </div>

            <div *ngFor="let ligne of selectedVente?.lignes" style="font-size: 11px; margin-bottom: 3px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="flex: 1;">{{ ligne.produit_nom || ligne.produit }}</span>
                <span>{{ ligne.quantite }} x {{ ligne.prix_unitaire | number:'1.0-0' }}</span>
              </div>
            </div>

            <div style="border-top: 1px dashed #333; margin-top: 10px; padding-top: 10px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
                <span>TOTAL:</span>
                <span>{{ selectedVente?.montant_total | number:'1.0-0' }} FCA</span>
              </div>
              <div *ngIf="selectedVente?.montant_paye > 0" style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Payé:</span>
                <span>{{ selectedVente?.montant_paye | number:'1.0-0' }} FCA</span>
              </div>
              <div *ngIf="selectedVente?.montant_restant > 0" style="display: flex; justify-content: space-between; font-size: 12px; color: red;">
                <span>Reste:</span>
                <span>{{ selectedVente?.montant_restant | number:'1.0-0' }} FCA</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 15px; font-size: 11px; border-top: 1px dashed #333; padding-top: 10px;">
              <p>Merci pour votre achat!</p>
              <p>🧾 Ticket généré par SyliDigit</p>
            </div>
          </div>

          <div style="padding: 15px; background: #f8f9fa; display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-primary" (click)="imprimirTicket()">
              🖨️ Imprimer
            </button>
            <button class="btn btn-secondary" (click)="showTicket=false">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <!-- Facture/Impression Modal -->
      <div class="modal-overlay" *ngIf="showFacture" (click)="showFacture=false">
        <div class="modal-card modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header" style="background: #2563eb; color: white;">
            <h4>🖨️ Facture</h4>
            <button class="close-btn" (click)="showFacture=false" style="color: white;">✕</button>
          </div>
          
          <div class="facture-preview" id="facture-content" *ngIf="selectedFacture">
            <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">SYLIDIGIT</h1>
              <p style="margin: 5px 0; color: #666;">Gestion Commerciale Intégrée</p>
              <p style="margin: 5px 0; color: #666;">Tél: +224 626 896 783 / +221 788 361 475</p>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; margin-right: 10px;">
                <strong>Client:</strong><br>
                {{ selectedFacture.client_nom }}<br>
                <span *ngIf="selectedFacture.client_telephone">Tél: {{ selectedFacture.client_telephone }}</span>
              </div>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: right;">
                <strong>Facture N°:</strong> {{ selectedFacture.numero_facture }}<br>
                <strong>Date:</strong> {{ selectedFacture.date_facture | date:'dd/MM/yyyy' }}<br>
                <strong>Statut:</strong> 
                <span [style.color]="selectedFacture.statut === 'paye' ? '#10b981' : '#ef4444'">
                  {{ selectedFacture.statut === 'paye' ? 'Payé' : 'Crédit' }}
                </span>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <thead>
                <tr style="background: #2563eb; color: white;">
                  <th style="padding: 12px 8px; text-align: left;">Désignation</th>
                  <th style="padding: 12px 8px; text-align: center;">Qté</th>
                  <th style="padding: 12px 8px; text-align: right;">P.U (FCA)</th>
                  <th style="padding: 12px 8px; text-align: right;">Remise</th>
                  <th style="padding: 12px 8px; text-align: right;">Total (FCA)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ligne of selectedFacture.lignes" style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 8px;">{{ ligne.produit_nom }}</td>
                  <td style="padding: 10px 8px; text-align: center;">{{ ligne.quantite }}</td>
                  <td style="padding: 10px 8px; text-align: right;">{{ ligne.prix_unitaire | number:'1.0-0' }}</td>
                  <td style="padding: 10px 8px; text-align: right;">{{ ligne.remise || 0 }}%</td>
                  <td style="padding: 10px 8px; text-align: right; font-weight: bold;">{{ ligne.montant_net | number:'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>

            <div style="text-align: right; border-top: 2px solid #333; padding-top: 15px;">
              <div style="font-size: 16px; margin-bottom: 5px;">
                <strong>Total TTC: {{ selectedFacture.montant_total | number:'1.0-0' }} FCA</strong>
              </div>
              <div *ngIf="selectedFacture.montant_paye > 0" style="font-size: 14px; color: #10b981; margin-bottom: 5px;">
                <strong>Montant Payé: {{ selectedFacture.montant_paye | number:'1.0-0' }} FCA</strong>
              </div>
              <div *ngIf="selectedFacture.montant_restant > 0" style="font-size: 18px; color: #ef4444; font-weight: bold;">
                <strong>Reste à Payer: {{ selectedFacture.montant_restant | number:'1.0-0' }} FCA</strong>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
              <p>Merci pour votre confiance !</p>
              <p>Document généré par SyliDigit - {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
          </div>

          <div style="padding: 20px; background: #f8f9fa; display: flex; gap: 10px; justify-content: center; border-top: 1px solid #ddd;">
            <button class="btn btn-primary btn-lg" (click)="imprimirFacture()">
              🖨️ Imprimer
            </button>
            <button class="btn btn-secondary" (click)="showFacture=false">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
    .stat-card {
      background: white; border-radius: 12px; padding: 16px 20px;
      border-left: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .stat-card.green { border-color: #10b981; }
    .stat-card.blue { border-color: #3b82f6; }
    .stat-card.red { border-color: #ef4444; }
    .stat-card.orange { border-color: #ff6b00; }
    .stat-card strong { display: block; font-size: 20px; font-weight: 800; }
    .stat-card small { color: #999; font-size: 12px; }
    .filters-bar { display: flex; gap: 10px; margin-bottom: 20px; }
    .search-input { flex: 1; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; }
    .filter-select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; min-width: 150px; }
    .section-title { font-size: 13px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; margin-top: 4px; }
    .ligne-form { background: #f8f9fa; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .vente-totaux { background: #f8f9fa; border-radius: 10px; padding: 16px; margin-top: 16px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; }
    .total-row strong { font-size: 16px; }
    .text-danger { color: #ef4444; }
    .vente-info-box { background: #f8f9fa; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .vente-info-box p { margin: 4px 0; font-size: 13px; }
    .badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.paye { background: #d1fae5; color: #065f46; }
    .badge.credit { background: #fee2e2; color: #991b1b; }
    .badge.partiel { background: #dbeafe; color: #1e40af; }
    .modal-large { max-width: 700px; }
    .facture-preview { padding: 20px; background: white; }
    .ticket-preview { padding: 15px; background: white; font-family: 'Courier New', monospace; }
    .btn-lg { padding: 12px 24px; font-size: 16px; }
    .btn-success { background: #10b981; color: white; }
    .btn-info { background: #3b82f6; color: white; }
    /* Stock Info Styles */
    .stock-info { margin-top: 6px; font-size: 12px; }
    .stock-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; }
    .stock-badge.ok { background: #d1fae5; color: #065f46; }
    .stock-badge.alerte { background: #fef3c7; color: #92400e; }
    .stock-badge.rupture { background: #fee2e2; color: #991b1b; }
    .stock-badge.unknown { background: #f3f4f6; color: #6b7280; }
  `]
})
export class SalesComponent implements OnInit {
  ventes: any[] = [];
  clients: any[] = [];
  stocks: any[] = [];
  produits: any[] = [];
  categories: any[] = [];
  stats: any = null;
  loading = false; saving = false;
  totalCount = 0; currentPage = 1; totalPages = 1;
  showForm = false; showPaiement = false; showFacture = false; showTicket = false;
  selectedVente: any = null; selectedFacture: any = null;
  paiementMontant = 0; paiementMode = 'espece';
  searchTerm = ''; statutFilter = '';
  stockProduits: any[] = [];
  form!: FormGroup;
  today = new Date();

  constructor(
    private venteService: VenteService,
    private produitService: ProduitService,
    private stockService: StockService,
    private factureService: FactureService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.loadStats();
    this.produitService.clients({ page_size: 200 }).subscribe(d => this.clients = d.results);
    this.stockService.list({ page_size: 200 }).subscribe(d => this.stocks = d.results);
    this.produitService.categories().subscribe(d => this.categories = d);
    this.produitService.list({ page_size: 500 }).subscribe(d => {
      this.produits = d.results;
      this.produitsFiltres = d.results; // Initialize filtered products
    });
    
    // Listen for stock changes
    this.form.get('stock')?.valueChanges.subscribe(() => {
      this.onStockChange();
    });
    
    // Listen for category changes
    this.form.get('categorie')?.valueChanges.subscribe(() => {
      this.onCategorieChange();
    });
  }

  // Filter products by category
  onCategorieChange(): void {
    const categorieId = this.form.get('categorie')?.value;
    this.filterProduits();
  }

  // Filter products based on stock and category
  filterProduits(): void {
    const stockId = this.form.get('stock')?.value;
    const categorieId = this.form.get('categorie')?.value;
    
    let filtered = this.produits;
    
    // Filter by stock (products with quantity > 0 in stock)
    if (stockId && this.stockProduits.length > 0) {
      const productIdsInStock = this.stockProduits
        .filter((p: any) => (parseFloat(p.quantite) || 0) > 0)
        .map((p: any) => p.produit);
      filtered = filtered.filter((p: any) => productIdsInStock.includes(p.id));
    }
    
    // Filter by category
    if (categorieId) {
      filtered = filtered.filter((p: any) => p.categorie === parseInt(categorieId));
    }
    
    this.produitsFiltres = filtered;
  }

  buildForm(): void {
    this.form = this.fb.group({
      client: ['', Validators.required],
      stock: ['', Validators.required],
      categorie: [''],
      mode_paiement: ['espece'],
      montant_paye: [0],
      notes: [''],
      lignes: this.fb.array([])
    });
  }

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }

  // Get available quantity for a product in selected stock
  getDisponibilite(produitId: number): number {
    if (!this.stockProduits || !produitId) return 0;
    const sp = this.stockProduits.find((p: any) => p.produit === produitId);
    return sp ? parseFloat(sp.quantite) || 0 : 0;
  }

  // Get stock info for a product (quantity + status)
  getStockInfo(produitId: number): { quantite: number, statut: string, unite: string } {
    if (!this.stockProduits || !produitId) {
      return { quantite: 0, statut: 'unknown', unite: '' };
    }
    const sp = this.stockProduits.find((p: any) => p.produit === produitId);
    if (!sp) {
      return { quantite: 0, statut: 'unknown', unite: '' };
    }
    const quantite = parseFloat(sp.quantite) || 0;
    const quantiteMinimale = parseFloat(sp.quantite_minimale) || 0;
    
    let statut = 'ok';
    if (quantite === 0) {
      statut = 'rupture';
    } else if (quantiteMinimale > 0 && quantite <= quantiteMinimale) {
      statut = 'alerte';
    }
    
    return { 
      quantite, 
      statut,
      unite: sp.produit_unite || ''
    };
  }

  // Load stock products when stock changes
  onStockChange(): void {
    const stockId = this.form.get('stock')?.value;
    if (stockId) {
      this.stockService.get_(stockId).subscribe({
        next: (data: any) => {
          this.stockProduits = data.stock_produits || [];
          // Update available products based on stock and category
          this.filterProduits();
        },
        error: () => {
          this.stockProduits = [];
        }
      });
    } else {
      this.stockProduits = [];
      // Reset to all products when no stock selected
      this.produitsFiltres = this.produits;
    }
  }

  // Filter products that are in the selected stock (available products)
  produitsFiltres: any[] = [];

  get montantTotal(): number {
    return this.lignesArray.controls.reduce((sum: number, ctrl: any) => {
      const q = ctrl.get('quantite')?.value || 0;
      const p = ctrl.get('prix_unitaire')?.value || 0;
      const r = ctrl.get('remise')?.value || 0;
      return sum + (q * p * (1 - r / 100));
    }, 0);
  }

  addLigne(): void {
    this.lignesArray.push(this.fb.group({
      produit: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(0.01)]],
      prix_unitaire: [0, [Validators.required, Validators.min(0)]],
      remise: [0]
    }));
  }

  removeLigne(i: number): void { this.lignesArray.removeAt(i); }

  onProduitChange(i: number): void {
    const ligneCtrl = this.lignesArray.at(i);
    const produitId = ligneCtrl.get('produit')?.value;
    const produit = this.produits.find(p => p.id === +produitId);
    if (produit) ligneCtrl.get('prix_unitaire')?.setValue(produit.prix_vente);
  }

  load(): void {
    this.loading = true;
    const params: any = { page: this.currentPage };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statutFilter) params.statut = this.statutFilter;
    
    this.venteService.list(params).subscribe({
      next: (d: any) => { 
        this.ventes = d.results || []; 
        this.totalCount = d.count || 0; 
        this.totalPages = Math.ceil(this.totalCount / 10) || 1;
        this.loading = false; 
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  loadStats(): void { this.venteService.stats().subscribe(s => this.stats = s); }
  
  onSearch(): void { this.currentPage = 1; this.load(); }
  onPageChange(p: number): void { this.currentPage = p; this.load(); }
  openForm(): void { this.buildForm(); this.showForm = true; }
  closeForm(): void { this.showForm = false; }
  
  onDelete(v: any): void { 
    if (confirm('Annuler cette vente ?')) { 
      // Annulation de la vente
    } 
  }

  getStatutColor(v: any): string {
    if (v.statut === 'paye') return '#10b981';
    if (v.statut === 'partiel') return '#3b82f6';
    return '#ef4444';
  }

  getStatutLabel(v: any): string {
    if (v.statut === 'paye') return 'Payé';
    if (v.statut === 'partiel') return 'Partiel';
    return 'Crédit';
  }

  getVentesPayees(): number {
    return this.ventes.filter(v => v.statut === 'paye').length;
  }

  // Paiement
  openPaiement(vente: any): void {
    this.selectedVente = vente;
    this.paiementMontant = vente.montant_restant;
    this.showPaiement = true;
  }
  closePaiement(): void { this.showPaiement = false; this.selectedVente = null; }

  enregistrerPaiement(): void {
    if (!this.selectedVente || this.paiementMontant <= 0) return;
    this.venteService.payer(this.selectedVente.id, { montant: this.paiementMontant, mode_paiement: this.paiementMode }).subscribe({
      next: () => {
        this.closePaiement(); 
        this.load(); 
        this.loadStats();
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors du paiement');
      }
    });
  }

  // Envoyer à la caisse - création + paiement immédiat + ticket
  envoyerCaisse(): void {
    if (this.form.invalid || !this.lignesArray.length) return;
    
    // Get the total first
    const total = this.montantTotal;
    console.log('Total de la vente:', total);
    
    // Create the data with payment amount = total (paid immediately)
    const saleData = {
      ...this.form.value,
      montant_paye: total
    };
    console.log('Données envoyées:', saleData);
    
    this.saving = true;
    this.venteService.create(saleData).subscribe({
      next: (vente: any) => {
        // Mapper les noms de produits pour l'affichage du ticket
        const lignesWithNames = this.form.value.lignes.map((l: any) => {
          const produit = this.produits.find(p => p.id === +l.produit);
          return {
            ...l,
            produit_nom: produit ? produit.nom : 'Produit'
          };
        });
        
        const client = this.clients.find(c => c.id === +this.form.value.client);
        
        // La vente est créée et payée automatiquement (montant_paye = total)
        // Maintenant afficher le ticket
        this.selectedVente = { 
          ...vente, 
          lignes: lignesWithNames,
          client_nom: client ? client.nom : 'Client'
        };
        this.saving = false;
        this.closeForm();
        this.showTicket = true;
        this.load();
        this.loadStats();
      },
      error: (err) => { 
        this.saving = false; 
        console.error(err);
        if (err.error) {
          const errorMsg = Array.isArray(err.error) ? err.error.join('\n') : JSON.stringify(err.error);
          alert('Erreur de stock:\n' + errorMsg);
        } else {
          alert('Erreur lors de la création de la vente');
        }
      }
    });
  }

  // Imprimer le ticket
  imprimirTicket(): void {
    const printContent = document.getElementById('ticket-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${this.selectedVente?.numero || 'N/A'}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 10px; width: 300px; margin: 0 auto; }
          table { width: 100%; }
          @media print { body { width: auto; padding: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  // Facture
  genererFacture(vente: any): void {
    if (confirm('Générer la facture pour cette vente ?')) {
      this.venteService.genererFacture(vente.id).subscribe({
        next: () => { 
          alert('Facture générée avec succès!'); 
          this.load(); 
        },
        error: (err) => { 
          console.error(err); 
          alert('Erreur lors de la génération de la facture'); 
        }
      });
    }
  }

  voirFacture(vente: any): void {
    this.selectedVente = vente;
    this.factureService.get_(vente.facture_id).subscribe({
      next: (facture: any) => {
        this.selectedFacture = {
          numero_facture: facture.numero_facture || 'N/A',
          date_facture: facture.date_facture,
          client_nom: vente.client_nom,
          client_telephone: '',
          montant_total: facture.montant_total,
          montant_paye: vente.montant_paye,
          montant_restant: vente.montant_restant,
          statut: vente.statut,
          lignes: facture.lignes || []
        };
        this.showFacture = true;
      },
      error: (err: any) => {
        console.error(err);
        this.selectedFacture = {
          numero_facture: 'N/A',
          date_facture: new Date(),
          client_nom: vente.client_nom,
          client_telephone: '',
          montant_total: vente.montant_total,
          montant_paye: vente.montant_paye,
          montant_restant: vente.montant_restant,
          statut: vente.statut,
          lignes: []
        };
        this.showFacture = true;
      }
    });
  }

  imprimirFacture(): void {
    const printContent = document.getElementById('facture-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture - ${this.selectedFacture?.numero_facture || 'N/A'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f0f0f0; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.lignesArray.length) return;
    this.saving = true;
    this.venteService.create(this.form.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); this.loadStats(); },
      error: (err) => { 
        this.saving = false; 
        console.error(err);
        if (err.error) {
          const errorMsg = Array.isArray(err.error) ? err.error.join('\n') : JSON.stringify(err.error);
          alert('Erreur de stock:\n' + errorMsg);
        } else {
          alert('Erreur lors de la création de la vente');
        }
      }
    });
  }
}
