import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LogisticsService } from '../../core/services/api.service';

@Component({
  selector: 'app-chauffeur-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h3>👤 Dossier Chauffeur</h3>
        <a routerLink="/logistics/engins" class="btn btn-secondary">← Retour Engins</a>
      </div>
      
      <div class="card" *ngIf="chauffeur">
        <div class="card-header">
          <h4>{{ chauffeur.nom_complet }}</h4>
          <span class="badge" [class.green]="chauffeur.is_disponible" [class.red]="!chauffeur.is_disponible">
            {{ chauffeur.is_disponible ? 'Disponible' : 'Occupé' }}
          </span>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>Numéro Permis</label>
              <strong>{{ chauffeur.numero_permis }}</strong>
            </div>
            <div class="info-item">
              <label>Catégories</label>
              <strong>{{ chauffeur.categories_permis }}</strong>
            </div>
            <div class="info-item">
              <label>Expiration Permis</label>
              <strong>{{ chauffeur.date_expiration_permis | date }}</strong>
            </div>
            <div class="info-item">
              <label>Téléphone</label>
              <strong>{{ chauffeur.telephone }}</strong>
            </div>
          </div>
          <h5>Sorties Récentes</h5>
          <div class="simple-table">
            <div *ngFor="let s of sorties.slice(0,5)" class="table-row">
              <span>{{ s.engin_immat }} → {{ s.destination }}</span>
              <small>{{ s.statut_display || s.statut }} | {{ s.date_depart | date }}</small>
            </div>
            <div *ngIf="sorties.length === 0" class="no-data">Aucune sortie récente</div>
          </div>
        </div>
      </div>
    </div>
  `,

  styles: [`
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
    .info-item { background: #f8f9fa; padding: 16px; border-radius: 8px; }
    .info-item label { color: #666; font-weight: 500; display: block; margin-bottom: 4px; }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.green { background: #d4edda; color: #155724; }
    .badge.red { background: #f8d7da; color: #721c24; }
  `]
})
export class ChauffeurDetailComponent implements OnInit {
  chauffeur: any = null;
  sorties: any[] = [];
  loading = false;
  

  // Supprimé colonnes DataTable


  constructor(private route: ActivatedRoute, private logisticsService: LogisticsService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadChauffeur(+id);
    }
  }

  loadChauffeur(id: number): void {
    this.loading = true;
    this.logisticsService.getChauffeur(id).subscribe({
      next: (c: any) => {
        this.chauffeur = c;
        // Charger sorties
        this.logisticsService.sorties({chauffeur: id, page_size: 10}).subscribe(s => this.sorties = s.results || s);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}

