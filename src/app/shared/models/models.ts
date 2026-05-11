// ==================== AUTH ====================
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  telephone: string;
  photo?: string;
  stock_affecte?: number;
  stock_affecte_nom?: string;
  is_active: boolean;
  date_creation: string;
}

export type UserRole = 'admin' | 'superviseur' | 'gestionnaire' | 'caissier' | 'chauffeur' | 'maintenancier';

export interface LoginRequest { username: string; password: string; }
export interface AuthResponse { access: string; refresh: string; user: User; }

// ==================== PAGINATION ====================
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// ==================== ZONES ====================
export interface Zone {
  id: number;
  nom: string;
  description: string;
  responsable?: number;
  responsable_nom?: string;
  nombre_stocks: number;
  is_active: boolean;
  date_creation: string;
}

// ==================== STOCKS ====================
export interface Stock {
  id: number;
  nom: string;
  zone: number;
  zone_nom: string;
  adresse: string;
  telephone: string;
  solde_caisse: number;
  solde_orange_money: number;
  nombre_produits: number;
  is_active: boolean;
  date_creation: string;
}

export interface StockProduit {
  id: number;
  stock: number;
  produit: number;
  produit_nom: string;
  produit_unite: string;
  produit_prix_vente: number;
  quantite: number;
  quantite_minimale: number;
  alerte_stock_bas: boolean;
  valeur_stock: number;
}

// ==================== PRODUCTS ====================
export interface Categorie { id: number; nom: string; description: string; }

export interface Produit {
  id: number;
  reference: string;
  nom: string;
  description: string;
  categorie?: number;
  categorie_nom?: string;
  unite: string;
  prix_achat: number;
  prix_vente: number;
  tva: number;
  marge_beneficiaire: number;
  prix_vente_ttc: number;
  is_active: boolean;
  date_creation: string;
}

export interface Fournisseur {
  id: number;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  is_active: boolean;
}

export interface Client {
  id: number;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  solde_credit: number;
  plafond_credit: number;
  is_active: boolean;
}

// ==================== SUPPLY ====================
export interface LigneCommande {
  id?: number;
  produit: number;
  produit_nom?: string;
  quantite_commandee: number;
  quantite_recue: number;
  prix_unitaire: number;
  montant_total?: number;
}

export interface CommandeFournisseur {
  id: number;
  numero: string;
  fournisseur: number;
  fournisseur_nom: string;
  stock_destination: number;
  stock_nom: string;
  statut: 'brouillon' | 'validee' | 'en_cours' | 'recue' | 'annulee';
  statut_display: string;
  lignes: LigneCommande[];
  montant_total: number;
  date_commande: string;
  date_livraison_prevue?: string;
  cree_par_nom: string;
  notes: string;
}

// ==================== TRANSFERS ====================
export interface LigneTransfert {
  id?: number;
  produit: number;
  produit_nom?: string;
  produit_unite?: string;
  quantite: number;
}

export interface Transfert {
  id: number;
  numero: string;
  stock_source: number;
  source_nom: string;
  stock_destination: number;
  destination_nom: string;
  statut: 'en_attente' | 'confirme' | 'en_transit' | 'recu' | 'annule';
  statut_display: string;
  lignes: LigneTransfert[];
  cree_par_nom: string;
  date_transfert: string;
  notes: string;
}

// ==================== SALES ====================
export interface LigneVente {
  id?: number;
  produit: number;
  produit_nom?: string;
  produit_unite?: string;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  montant_brut?: number;
  montant_net?: number;
}

export interface Vente {
  id: number;
  numero: string;
  client: number;
  client_nom: string;
  stock: number;
  stock_nom: string;
  statut: 'paye' | 'partiel' | 'credit' | 'annule';
  statut_display: string;
  mode_paiement: string;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  lignes: LigneVente[];
  cree_par_nom: string;
  date_vente: string;
  notes: string;
}

// ==================== FINANCE ====================
export interface Caisse {
  id: number;
  nom: string;
  stock: number;
  stock_nom: string;
  solde: number;
  is_active: boolean;
}

export interface CompteOrangeMoney {
  id: number;
  nom: string;
  numero: string;
  stock: number;
  stock_nom: string;
  solde: number;
  is_active: boolean;
}

export interface Depense {
  id: number;
  libelle: string;
  categorie: string;
  categorie_display: string;
  montant: number;
  source: string;
  caisse?: number;
  compte_om?: number;
  description: string;
  cree_par_nom: string;
  date_depense: string;
}

// ==================== LOGISTICS ====================
export interface Engin {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  type: string;
  type_display: string;
  statut: string;
  statut_display: string;
  annee?: number;
  kilometrage: number;
  stock_affecte?: number;
  stock_nom?: string;
}

export interface Chauffeur {
  id: number;
  user: number;
  nom_complet: string;
  telephone: string;
  numero_permis: string;
  categories_permis: string;
  date_expiration_permis: string;
  is_disponible: boolean;
}

export interface SortieEngin {
  id: number;
  engin: number;
  engin_immat: string;
  chauffeur: number;
  chauffeur_nom: string;
  destination: string;
  motif: string;
  date_depart: string;
  date_retour_prevue?: string;
  statut: string;
  statut_display: string;
  distance_parcourue?: number;
}

export interface Maintenance {
  id: number;
  engin: number;
  engin_immat: string;
  type: string;
  type_display: string;
  statut: string;
  statut_display: string;
  description: string;
  prestataire: string;
  cout: number;
  date_planifiee: string;
  cree_par_nom: string;
}
