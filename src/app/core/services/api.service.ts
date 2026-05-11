import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected get<T>(path: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${path}`, { params: httpParams });
  }

  protected post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body);
  }

  protected put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${path}`, body);
  }

  protected patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${path}`, body);
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${path}`);
  }
}


// =================== SERVICES METIER ===================

@Injectable({ providedIn: 'root' })
export class ZoneService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('zones/', params); }
  get_(id: number) { return this.get<any>(`zones/${id}/`); }
  create(data: any) { return this.post<any>('zones/', data); }
  update(id: number, data: any) { return this.patch<any>(`zones/${id}/`, data); }
  delete_(id: number) { return this.delete<any>(`zones/${id}/`); }
  getStocks(id: number) { return this.get<any[]>(`zones/${id}/stocks/`); }
}

@Injectable({ providedIn: 'root' })
export class StockService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('stocks/', params); }
  get_(id: number) { return this.get<any>(`stocks/${id}/`); }
  create(data: any) { return this.post<any>('stocks/', data); }
  update(id: number, data: any) { return this.patch<any>(`stocks/${id}/`, data); }
  delete_(id: number) { return this.delete<any>(`stocks/${id}/`); }
  inventaire(id: number) { return this.get<any[]>(`stocks/${id}/inventaire/`); }
  alertes(id: number) { return this.get<any[]>(`stocks/${id}/alertes/`); }
  ruptures(id: number) { return this.get<any[]>(`stocks/${id}/ruptures/`); }
  stats() { return this.get<any>('stocks/stats/'); }
}

@Injectable({ providedIn: 'root' })
export class ProduitService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('products/', params); }
  get_(id: number) { return this.get<any>(`products/${id}/`); }
  create(data: any) { return this.post<any>('products/', data); }
  update(id: number, data: any) { return this.patch<any>(`products/${id}/`, data); }
  delete_(id: number) { return this.delete<any>(`products/${id}/`); }
  categories() { return this.get<any[]>('products/categories/'); }
  fournisseurs(params?: any) { return this.get<PaginatedResponse<any>>('products/fournisseurs/', params); }
  clients(params?: any) { return this.get<PaginatedResponse<any>>('products/clients/', params); }
  createClient(data: any) { return this.post<any>('products/clients/', data); }
  updateClient(id: number, data: any) { return this.patch<any>(`products/clients/${id}/`, data); }
  debiteurs() { return this.get<any[]>('products/clients/debiteurs/'); }
}

@Injectable({ providedIn: 'root' })
export class SupplyService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('supply/', params); }
  get_(id: number) { return this.get<any>(`supply/${id}/`); }
  create(data: any) { return this.post<any>('supply/', data); }
  valider(id: number) { return this.post<any>(`supply/${id}/valider/`, {}); }
  receptionner(id: number, quantites: any) { return this.post<any>(`supply/${id}/receptionner/`, { quantites }); }
  annuler(id: number) { return this.post<any>(`supply/${id}/annuler/`, {}); }
}

@Injectable({ providedIn: 'root' })
export class TransfertService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('transfers/', params); }
  get_(id: number) { return this.get<any>(`transfers/${id}/`); }
  create(data: any) { return this.post<any>('transfers/', data); }
  confirmer(id: number) { return this.post<any>(`transfers/${id}/confirmer/`, {}); }
  annuler(id: number) { return this.post<any>(`transfers/${id}/annuler/`, {}); }
}

@Injectable({ providedIn: 'root' })
export class VenteService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('sales/', params); }
  get_(id: number) { return this.get<any>(`sales/${id}/`); }
  create(data: any) { return this.post<any>('sales/', data); }
  payer(id: number, data: any) { return this.post<any>(`sales/${id}/payer/`, data); }
  stats() { return this.get<any>('sales/stats/'); }
  
  // Factures
  genererFacture(id: number) { return this.post<any>(`sales/${id}/generer_facture/`, {}); }
  TELECHARGERFacture(id: number) { return this.get<any>(`sales/${id}/telecharger_facture/`); }
}

@Injectable({ providedIn: 'root' })
export class FactureService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('sales/factures/', params); }
  get_(id: number) { return this.get<any>(`sales/factures/${id}/`); }
  create(data: any) { return this.post<any>('sales/factures/', data); }
  TELECHARGER(id: number) { return this.get<any>(`sales/factures/${id}/telecharger/`); }
  nonReglees() { return this.get<any[]>('sales/factures/non_reglees/'); }
}

@Injectable({ providedIn: 'root' })
export class FinanceService extends ApiService {
  // Caisses et Comptes
  caisses(params?: any) { return this.get<PaginatedResponse<any>>('finance/caisses/', params); }
  getCaisse(id: number) { return this.get<any>(`finance/caisses/${id}/`); }
  ajusterCaisse(id: number, data: any) { return this.post<any>(`finance/caisses/${id}/ajuster/`, data); }
  historiqueCaisse(id: number) { return this.get<any[]>(`finance/caisses/${id}/historique/`); }
  orangeMoney(params?: any) { return this.get<PaginatedResponse<any>>('finance/orange-money/', params); }
  depenses(params?: any) { return this.get<PaginatedResponse<any>>('finance/depenses/', params); }
  createDepense(data: any) { return this.post<any>('finance/depenses/', data); }
  updateDepense(id: number, data: any) { return this.patch<any>(`finance/depenses/${id}/`, data); }
  deleteDepense(id: number) { return this.delete<any>(`finance/depenses/${id}/`); }
  statsDepenses() { return this.get<any>('finance/depenses/stats/'); }
  mouvements(params?: any) { return this.get<PaginatedResponse<any>>('finance/mouvements/', params); }

  // Types de contrats
  typesContrat(params?: any) { return this.get<PaginatedResponse<any>>('finance/types-contrat/', params); }
  createTypeContrat(data: any) { return this.post<any>('finance/types-contrat/', data); }
  updateTypeContrat(id: number, data: any) { return this.patch<any>(`finance/types-contrat/${id}/`, data); }
  deleteTypeContrat(id: number) { return this.delete<any>(`finance/types-contrat/${id}/`); }

  // Salariés
  salaries(params?: any) { return this.get<PaginatedResponse<any>>('finance/salaries/', params); }
  salariesActifs() { return this.get<any[]>('finance/salaries/actifs/'); }
  getSalarie(id: number) { return this.get<any>(`finance/salaries/${id}/`); }
  createSalarie(data: any) { return this.post<any>('finance/salaries/', data); }
  updateSalarie(id: number, data: any) { return this.patch<any>(`finance/salaries/${id}/`, data); }
  deleteSalarie(id: number) { return this.delete<any>(`finance/salaries/${id}/`); }
  resilierSalarie(id: number, data: any) { return this.post<any>(`finance/salaries/${id}/resilier/`, data); }

  // Bulletins de paie
  bulletinsPaie(params?: any) { return this.get<PaginatedResponse<any>>('finance/bulletins-paie/', params); }
  getBulletinPaie(id: number) { return this.get<any>(`finance/bulletins-paie/${id}/`); }
  createBulletinPaie(data: any) { return this.post<any>('finance/bulletins-paie/', data); }
  updateBulletinPaie(id: number, data: any) { return this.patch<any>(`finance/bulletins-paie/${id}/`, data); }
  deleteBulletinPaie(id: number) { return this.delete<any>(`finance/bulletins-paie/${id}/`); }
  validerBulletinPaie(id: number) { return this.post<any>(`finance/bulletins-paie/${id}/valider/`, {}); }
  payerBulletinPaie(id: number, data: any) { return this.post<any>(`finance/bulletins-paie/${id}/payer/`, data); }
  statsBulletinsPaie() { return this.get<any>('finance/bulletins-paie/stats/'); }
  telechargerBulletinPaie(id: number) { return this.get<any>(`finance/bulletins-paie/${id}/telecharger/`, { responseType: 'blob' }); }
  envoyerBulletinEmail(id: number, email?: string) { return this.post<any>(`finance/bulletins-paie/${id}/envoyer_email/`, { email }); }

  // Comptabilité - Plan comptable
  comptesComptables(params?: any) { return this.get<PaginatedResponse<any>>('finance/comptes-comptables/', params); }
  planComptable() { return this.get<any[]>('finance/comptes-comptables/plan_comptable/'); }
  getCompteComptable(id: number) { return this.get<any>(`finance/comptes-comptables/${id}/`); }
  createCompteComptable(data: any) { return this.post<any>('finance/comptes-comptables/', data); }
  updateCompteComptable(id: number, data: any) { return this.patch<any>(`finance/comptes-comptables/${id}/`, data); }
  deleteCompteComptable(id: number) { return this.delete<any>(`finance/comptes-comptables/${id}/`); }

  // Comptabilité - Journaux
  journaux(params?: any) { return this.get<PaginatedResponse<any>>('finance/journaux/', params); }
  createJournal(data: any) { return this.post<any>('finance/journaux/', data); }
  updateJournal(id: number, data: any) { return this.patch<any>(`finance/journaux/${id}/`, data); }
  deleteJournal(id: number) { return this.delete<any>(`finance/journaux/${id}/`); }

  // Comptabilité - Écritures
  ecritures(params?: any) { return this.get<PaginatedResponse<any>>('finance/ecritures/', params); }
  getEcriture(id: number) { return this.get<any>(`finance/ecritures/${id}/`); }
  createEcriture(data: any) { return this.post<any>('finance/ecritures/', data); }
  updateEcriture(id: number, data: any) { return this.patch<any>(`finance/ecritures/${id}/`, data); }
  deleteEcriture(id: number) { return this.delete<any>(`finance/ecritures/${id}/`); }
  validerEcriture(id: number) { return this.post<any>(`finance/ecritures/${id}/valider/`, {}); }
  grandLivre(params: any) { return this.get<any[]>('finance/ecritures/grand_livre/', params); }
  balance() { return this.get<any[]>('finance/ecritures/balance/'); }

  // Tableau de bord comptable
  tableauBordComptable() { return this.get<any>('finance/tableau-bord/'); }
}

@Injectable({ providedIn: 'root' })
export class LogisticsService extends ApiService {
  engins(params?: any) { return this.get<PaginatedResponse<any>>('logistics/engins/', params); }
  getEngin(id: number) { return this.get<any>(`logistics/engins/${id}/`); }
  createEngin(data: any) { return this.post<any>('logistics/engins/', data); }
  updateEngin(id: number, data: any) { return this.patch<any>(`logistics/engins/${id}/`, data); }
  statsEngins() { return this.get<any>('logistics/engins/stats/'); }
  // Chauffeurs depuis le ViewSet SortieEngin (nouveau endpoint avec nom_complet)
  getSalariesForSortie() { return this.get<any[]>('logistics/sorties/chauffeurs/'); }
  getChauffeur(id: number) { return this.get<any>(`logistics/sorties/${id}/`); } // ou finance/salaries/${id}/
  // Ancien endpoint Chauffeur ViewSet
  chauffeurs(params?: any) { return this.get<PaginatedResponse<any>>('logistics/chauffeurs/', params); }
  sorties(params?: any) { return this.get<PaginatedResponse<any>>('logistics/sorties/', params); }
  createSortie(data: any) { return this.post<any>('logistics/sorties/', data); }
  deleteSortie(id: number) { return this.delete<any>(`logistics/sorties/${id}/`); }
  retourEngin(id: number, data: any) { return this.post<any>(`logistics/sorties/${id}/retour/`, data); }
  maintenances(params?: any) { return this.get<PaginatedResponse<any>>('logistics/maintenances/', params); }
  createMaintenance(data: any) { return this.post<any>('logistics/maintenances/', data); }
  deleteMaintenance(id: number) { return this.delete<any>(`logistics/maintenances/${id}/`); }
  terminerMaintenance(id: number, data: any) { return this.post<any>(`logistics/maintenances/${id}/terminer/`, data); }
  statsMaintenance() { return this.get<any>('logistics/maintenances/stats/'); }
}

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  list(params?: any) { return this.get<PaginatedResponse<any>>('auth/users/', params); }
  get_(id: number) { return this.get<any>(`auth/users/${id}/`); }
  create(data: any) { return this.post<any>('auth/users/', data); }
  update(id: number, data: any) { return this.patch<any>(`auth/users/${id}/`, data); }
  stats() { return this.get<any>('auth/users/stats/'); }
}

// =================== PERSONNEL ===================

@Injectable({ providedIn: 'root' })
export class PersonnelService extends ApiService {
  // Personnel (using Salarie from finance)
  list(params?: any) { return this.get<PaginatedResponse<any>>('personnel/', params); }
  get_(id: number) { return this.get<any>(`personnel/${id}/`); }
  actifs() { return this.get<any[]>('personnel/actifs/'); }
  statistiques() { return this.get<any>('personnel/statistiques/'); }

  // Fonctions/Postes
  fonctions(params?: any) { return this.get<PaginatedResponse<any>>('personnel/fonctions/', params); }
  getFonction(id: number) { return this.get<any>(`personnel/fonctions/${id}/`); }
  createFonction(data: any) { return this.post<any>('personnel/fonctions/', data); }
  updateFonction(id: number, data: any) { return this.patch<any>(`personnel/fonctions/${id}/`, data); }
  deleteFonction(id: number) { return this.delete<any>(`personnel/fonctions/${id}/`); }

  // Présences/Pointages
  presences(params?: any) { return this.get<PaginatedResponse<any>>('personnel/presences/', params); }
  getPresence(id: number) { return this.get<any>(`personnel/presences/${id}/`); }
  createPresence(data: any) { return this.post<any>('personnel/presences/', data); }
  updatePresence(id: number, data: any) { return this.patch<any>(`personnel/presences/${id}/`, data); }
  deletePresence(id: number) { return this.delete<any>(`personnel/presences/${id}/`); }
  presencesAujourdhui() { return this.get<any[]>('personnel/presences/aujourdhui/'); }
  pointer() { return this.post<any>('personnel/presences/pointer/', {}); }
  statsPresences() { return this.get<any>('personnel/presences/statistiques/'); }

  // Affectations
  affectations(params?: any) { return this.get<PaginatedResponse<any>>('personnel/affectations/', params); }
  getAffectation(id: number) { return this.get<any>(`personnel/affectations/${id}/`); }
  createAffectation(data: any) { return this.post<any>('personnel/affectations/', data); }
  updateAffectation(id: number, data: any) { return this.patch<any>(`personnel/affectations/${id}/`, data); }
  deleteAffectation(id: number) { return this.delete<any>(`personnel/affectations/${id}/`); }
  affectationsParStock(stockId: number) { return this.get<any[]>(`personnel/affectations/par_stock/?stock_id=${stockId}`); }
  affectationsParZone(zoneId: number) { return this.get<any[]>(`personnel/affectations/par_zone/?zone_id=${zoneId}`); }

  // Congés
  conges(params?: any) { return this.get<PaginatedResponse<any>>('personnel/conges/', params); }
  getConge(id: number) { return this.get<any>(`personnel/conges/${id}/`); }
  createConge(data: any) { return this.post<any>('personnel/conges/', data); }
  updateConge(id: number, data: any) { return this.patch<any>(`personnel/conges/${id}/`, data); }
  deleteConge(id: number) { return this.delete<any>(`personnel/conges/${id}/`); }
  approuverConge(id: number) { return this.post<any>(`personnel/conges/${id}/approuver/`, {}); }
  rejeterConge(id: number) { return this.post<any>(`personnel/conges/${id}/rejeter/`, {}); }
  congesEnAttente() { return this.get<any[]>('personnel/conges/en_attente/'); }
}
