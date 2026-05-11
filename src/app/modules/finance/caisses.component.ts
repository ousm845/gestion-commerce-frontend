
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FinanceService, VenteService } from '../../core/services/api.service';

@Component({
  selector: 'app-caisses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h3>🏦 Tableau de Bord Caisse</h3>
          <p class="subtitle">Vue d'ensemble de la trésorerie</p>
        </div>
        <button class="btn btn-primary" (click)="load()">🔄 Actualiser</button>
      </div>

      <!-- Résumé global moderne -->
      <div class="dashboard-grid">
        <div class="dash-card total-cash">
          <div class="dash-icon">💰</div>
          <div class="dash-info">
            <span class="dash-label">Total Disponible</span>
            <span class="dash-value">{{ getTotalGeneral() | number:'1.0-0' }} FCA</span>
          </div>
        </div>
        
        <div class="dash-card especes">
          <div class="dash-icon">💵</div>
          <div class="dash-info">
            <span class="dash-label">Espèces</span>
            <span class="dash-value">{{ getTotalEspaces() | number:'1.0-0' }} FCA</span>
          </div>
        </div>
        
        <div class="dash-card orange">
          <div class="dash-icon">📱</div>
          <div class="dash-info">
            <span class="dash-label">Orange Money</span>
            <span class="dash-value">{{ getTotalOM() | number:'1.0-0' }} FCA</span>
          </div>
        </div>
        
        <div class="dash-card wave">
          <div class="dash-icon">🌊</div>
          <div class="dash-info">
            <span class="dash-label">Wave</span>
            <span class="dash-value">{{ getTotalWave() | number:'1.0-0' }} FCA</span>
          </div>
        </div>
        
        <div class="dash-card carte">
          <div class="dash-icon">💳</div>
          <div class="dash-info">
            <span class="dash-label">Carte</span>
            <span class="dash-value">{{ getTotalCarte() | number:'1.0-0' }} FCA</span>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="quick-actions">
        <button class="action-btn success" (click)="openAjust('entree')">
          <span class="action-icon">⬆️</span>
          <span class="action-text">Entrée</span>
        </button>
        <button class="action-btn danger" (click)="openAjust('sortie')">
          <span class="action-icon">⬇️</span>
          <span class="action-text">Sortie</span>
        </button>
        <button class="action-btn info" (click)="loadMouvements()">
          <span class="action-icon">📋</span>
          <span class="action-text">Historique</span>
        </button>
      </div>

      <!-- Contenu principal en 2 colonnes -->
      <div class="main-content">
        <!-- Colonne gauche: Caisses -->
        <div class="left-column">
          <div class="section-card">
            <div class="section-header">
              <h4>🏦 Caisses</h4>
            </div>
            <div class="caisses-list">
              <div class="caisse-item" *ngFor="let c of caisses" (click)="voirHistorique(c)">
                <div class="caisse-info">
                  <strong>{{ c.nom }}</strong>
                  <small>{{ c.stock_nom }}</small>
                </div>
                <div class="caisse-solde">
                  {{ c.solde || 0 | number:'1.0-0' }} FCA
                </div>
              </div>
              <div class="empty-state" *ngIf="caisses.length === 0">
                Aucune caisse
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne droite: Ventes -->
        <div class="right-column">
          <!-- Onglets -->
          <div class="tabs">
            <button class="tab" [class.active]="showWhat === 'paye'" (click)="showWhat = 'paye'">
              ✅ Payées ({{ ventesPayees.length }})
            </button>
            <button class="tab" [class.active]="showWhat === 'credit'" (click)="showWhat = 'credit'">
              ❌ Crédits ({{ ventesCredits.length }})
            </button>
            <button class="tab" [class.active]="showWhat === 'partiel'" (click)="showWhat = 'partiel'">
              💰 Partiels ({{ ventesPartiels.length }})
            </button>
          </div>

          <!-- Liste des ventes -->
          <div class="ventes-list">
            <div class="vente-item" *ngFor="let v of getCurrentVentes()">
              <div class="vente-main">
                <span class="vente-num">{{ v.numero }}</span>
                <span class="vente-client">{{ v.client_nom }}</span>
              </div>
              <div class="vente-montants">
                <span class="montant-total">{{ v.montant_total | number:'1.0-0' }} FCA</span>
                <span class="montant-reste text-danger" *ngIf="v.montant_restant > 0">
                  reste: {{ v.montant_restant | number:'1.0-0' }}
                </span>
              </div>
              <button class="btn-payer" (click)="enregistrerPaiement(v)" *ngIf="v.montant_restant > 0">
                💳 Payer
              </button>
            </div>
            <div class="empty-state" *ngIf="getCurrentVentes().length === 0">
              Aucune vente
            </div>
          </div>
        </div>
      </div>

      <!-- Historique récent -->
      <div class="history-section" *ngIf="mouvements.length > 0">
        <h4>🕐 Derniers mouvements</h4>
        <div class="history-grid">
          <div class="history-item" *ngFor="let m of mouvements.slice(0, 5)"
               [class.entree]="m.type === 'entree'" 
               [class.sortie]="m.type === 'sortie'">
            <span class="history-icon">{{ m.type === 'entree' ? '⬆️' : '⬇️' }}</span>
            <div class="history-content">
              <span class="history-desc">{{ m.description }}</span>
              <span class="history-date">{{ m.date_mouvement | date:'dd/MM HH:mm' }}</span>
            </div>
            <span class="history-amount" [class.text-success]="m.type === 'entree'" [class.text-danger]="m.type === 'sortie'">
              {{ m.type === 'entree' ? '+' : '-' }}{{ m.montant | number:'1.0-0' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Modal Paiement -->
      <div class="modal-overlay" *ngIf="showPaiement" (click)="showPaiement=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>💳 Paiement</h4>
            <button class="close-btn" (click)="showPaiement=false">✕</button>
          </div>
          <div class="modal-body" *ngIf="selectedVente">
            <div class="info-box">
              <p><strong>{{ selectedVente.numero }}</strong> - {{ selectedVente.client_nom }}</p>
              <p>Reste à payer: <strong class="text-danger">{{ selectedVente.montant_restant | number:'1.0-0' }} FCA</strong></p>
            </div>
            <div class="form-group">
              <label>Montant</label>
              <input type="number" [(ngModel)]="paiementMontant" [max]="selectedVente.montant_restant" min="0" />
            </div>
            <div class="form-group">
              <label>Mode de paiement</label>
              <select [(ngModel)]="paiementMode">
                <option value="espece">💵 Espèces</option>
                <option value="orange_money">📱 Orange Money</option>
                <option value="wave">🌊 Wave</option>
                <option value="carte">💳 Carte</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showPaiement=false">Annuler</button>
            <button class="btn btn-success" (click)="confirmPaiement()">Valider</button>
          </div>
        </div>
      </div>

      <!-- Modal Ajustement -->
      <div class="modal-overlay" *ngIf="showAjust" (click)="showAjust=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4 [class.text-success]="ajustType === 'entree'" [class.text-danger]="ajustType === 'sortie'">
              {{ ajustType === 'entree' ? '⬆️ Entrée' : '⬇️ Sortie' }} Caisse
            </h4>
            <button class="close-btn" (click)="showAjust=false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Montant (FCFA)</label>
              <input type="number" [(ngModel)]="ajustMontant" min="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Mode</label>
              <select [(ngModel)]="ajustMode">
                <option value="espece">💵 Espèces</option>
                <option value="orange_money">📱 Orange Money</option>
                <option value="wave">🌊 Wave</option>
                <option value="carte">💳 Carte</option>
              </select>
            </div>
            <div class="form-group">
              <label>Motif</label>
              <input type="text" [(ngModel)]="ajustDescription" placeholder="Description..." />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAjust=false">Annuler</button>
            <button class="btn" [class.btn-success]="ajustType === 'entree'" [class.btn-danger]="ajustType === 'sortie'" (click)="confirmAjust()">
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
    .dash-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #e5e7eb; }
    .dash-card.total-cash { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, white 100%); }
    .dash-card.especes { border-color: #f59e0b; }
    .dash-card.orange { border-color: #ff6b00; }
    .dash-card.wave { border-color: #6366f1; }
    .dash-card.carte { border-color: #3b82f6; }
    .dash-icon { font-size: 28px; }
    .dash-info { display: flex; flex-direction: column; }
    .dash-label { font-size: 12px; color: #6b7280; }
    .dash-value { font-size: 18px; font-weight: 700; color: #1f2937; }
    
    .quick-actions { display: flex; gap: 12px; margin-bottom: 20px; }
    .action-btn { flex: 1; padding: 14px 20px; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; transition: all 0.2s; }
    .action-btn.success { background: #d1fae5; color: #065f46; }
    .action-btn.success:hover { background: #a7f3d0; }
    .action-btn.danger { background: #fee2e2; color: #991b1b; }
    .action-btn.danger:hover { background: #fecaca; }
    .action-btn.info { background: #dbeafe; color: #1e40af; }
    .action-btn.info:hover { background: #bfdbfe; }
    .action-icon { font-size: 18px; }
    
    .main-content { display: grid; grid-template-columns: 350px 1fr; gap: 20px; margin-bottom: 20px; }
    .section-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .section-header { padding: 14px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .section-header h4 { margin: 0; font-size: 14px; font-weight: 600; }
    .caisses-list { max-height: 300px; overflow-y: auto; }
    .caisse-item { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s; }
    .caisse-item:hover { background: #f9fafb; }
    .caisse-info { display: flex; flex-direction: column; }
    .caisse-info strong { font-size: 14px; }
    .caisse-info small { font-size: 12px; color: #9ca3af; }
    .caisse-solde { font-weight: 600; color: #10b981; }
    
    .tabs { display: flex; background: white; border-radius: 12px; padding: 4px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .tab { flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer; border-radius: 8px; font-size: 13px; font-weight: 500; color: #6b7280; transition: all 0.2s; }
    .tab.active { background: #ff6b00; color: white; }
    
    .ventes-list { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); max-height: 400px; overflow-y: auto; }
    .vente-item { padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f3f4f6; }
    .vente-main { flex: 1; display: flex; flex-direction: column; }
    .vente-num { font-weight: 600; font-size: 13px; }
    .vente-client { font-size: 12px; color: #6b7280; }
    .vente-montants { text-align: right; }
    .montant-total { display: block; font-weight: 600; }
    .montant-reste { font-size: 11px; }
    .btn-payer { padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .btn-payer:hover { background: #059669; }
    
    .history-section { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .history-section h4 { margin: 0 0 12px 0; font-size: 14px; }
    .history-grid { display: flex; flex-direction: column; gap: 8px; }
    .history-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; background: #f9fafb; }
    .history-item.entree { border-left: 3px solid #10b981; }
    .history-item.sortie { border-left: 3px solid #ef4444; }
    .history-icon { font-size: 16px; }
    .history-content { flex: 1; display: flex; flex-direction: column; }
    .history-desc { font-size: 13px; }
    .history-date { font-size: 11px; color: #9ca3af; }
    .history-amount { font-weight: 600; font-size: 13px; }
    
    .empty-state { padding: 24px; text-align: center; color: #9ca3af; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: white; border-radius: 14px; padding: 24px; width: 90%; max-width: 400px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h4 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
    .modal-body { margin-bottom: 20px; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
    .info-box { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .info-box p { margin: 4px 0; font-size: 13px; }
    
    .btn { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #ff6b00; color: white; }
    .btn-secondary { background: #e5e7eb; }
    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .text-danger { color: #ef4444; }
    .text-success { color: #10b981; }
    
    @media (max-width: 1200px) {
      .dashboard-grid { grid-template-columns: repeat(3, 1fr); }
      .main-content { grid-template-columns: 1fr; }
    }
  `]
})
export class CaissesComponent implements OnInit, OnDestroy {
  caisses: any[] = [];
  mouvements: any[] = [];
  loading = false;
  
  private refreshInterval: any;
  private routeSubscription: any;
  
  ventesPayees: any[] = [];
  ventesCredits: any[] = [];
  ventesPartiels: any[] = [];
  totalPaye = 0;
  totalCredit = 0;
  totalVentes = 0;
  showWhat = 'paye';
  
  showAjust = false;
  showPaiement = false;
  ajustType = 'entree';
  ajustMontant = 0;
  ajustMode = 'espece';
  ajustDescription = '';
  selectedCaisse: any = null;
  
  selectedVente: any = null;
  paiementMontant = 0;
  paiementMode = 'espece';

  constructor(
    private financeService: FinanceService,
    private venteService: VenteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    this.refreshInterval = setInterval(() => this.load(), 30000);
    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (window.location.pathname.includes('caisses')) this.load();
    });
  }
  
  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.financeService.caisses().subscribe({
      next: d => { this.caisses = d.results || d; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.financeService.mouvements({ page_size: 100, ordering: '-date_mouvement' }).subscribe({
      next: d => { this.mouvements = d.results || d; },
      error: () => { this.mouvements = []; }
    });
    this.loadVentes();
  }

  loadVentes(): void {
    this.venteService.list({ page_size: 500 }).subscribe({
      next: (d: any) => {
        const ventes = d.results || [];
        this.ventesPayees = ventes.filter((v: any) => v.statut === 'paye');
        this.ventesCredits = ventes.filter((v: any) => v.statut === 'credit');
        this.ventesPartiels = ventes.filter((v: any) => v.statut === 'partiel');
      },
      error: () => {}
    });
  }

  getTotalGeneral(): number {
    return this.caisses.reduce((sum, c) => sum + (parseFloat(c.solde) || 0), 0);
  }
  getTotalEspaces(): number {
    return this.caisses.reduce((sum, c) => sum + (parseFloat(c.solde_especes) || 0), 0);
  }
  getTotalOM(): number {
    return this.caisses.reduce((sum, c) => sum + (parseFloat(c.solde_orange_money) || 0), 0);
  }
  getTotalWave(): number {
    return this.caisses.reduce((sum, c) => sum + (parseFloat(c.solde_wave) || 0), 0);
  }
  getTotalCarte(): number {
    return this.caisses.reduce((sum, c) => sum + (parseFloat(c.solde_carte) || 0), 0);
  }

  getCurrentVentes(): any[] {
    switch (this.showWhat) {
      case 'paye': return this.ventesPayees;
      case 'credit': return this.ventesCredits;
      case 'partiel': return this.ventesPartiels;
      default: return [];
    }
  }

  loadMouvements(): void {
    this.financeService.mouvements({ page_size: 100, ordering: '-date_mouvement' }).subscribe({
      next: d => { this.mouvements = d.results || d; },
      error: () => {}
    });
  }

  voirHistorique(caisse: any): void {
    this.selectedCaisse = caisse;
    this.financeService.historiqueCaisse(caisse.id).subscribe({
      next: (data: any) => { this.mouvements = data; },
      error: () => {}
    });
  }

  openAjust(type: string): void {
    if (!this.selectedCaisse && this.caisses.length > 0) {
      this.selectedCaisse = this.caisses[0];
    }
    if (!this.selectedCaisse) {
      alert('Veuillez d\'abord sélectionner une caisse en cliquant dessus');
      return;
    }
    this.ajustType = type;
    this.ajustMontant = 0;
    this.ajustMode = 'espece';
    this.ajustDescription = '';
    this.showAjust = true;
  }

  confirmAjust(): void {
    if (!this.ajustMontant || !this.selectedCaisse) return;
    this.financeService.ajusterCaisse(this.selectedCaisse.id, {
      montant: this.ajustMontant,
      type: this.ajustType,
      mode_paiement: this.ajustMode,
      description: this.ajustDescription
    }).subscribe(updated => {
      const idx = this.caisses.findIndex(c => c.id === updated.id);
      if (idx >= 0) this.caisses[idx] = updated;
      this.showAjust = false;
      this.load();
    });
  }

  enregistrerPaiement(vente: any): void {
    this.selectedVente = vente;
    this.paiementMontant = vente.montant_restant;
    this.paiementMode = 'espece';
    this.showPaiement = true;
  }

  confirmPaiement(): void {
    if (!this.selectedVente || this.paiementMontant <= 0) return;
    this.venteService.payer(this.selectedVente.id, { 
      montant: this.paiementMontant, 
      mode_paiement: this.paiementMode 
    }).subscribe({
      next: () => {
        this.showPaiement = false;
        this.selectedVente = null;
        this.load();
      },
      error: () => alert('Erreur lors du paiement')
    });
  }
}

