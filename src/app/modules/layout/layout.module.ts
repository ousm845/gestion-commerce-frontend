import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('../dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'zones', loadComponent: () => import('../zones/zones.component').then(m => m.ZonesComponent) },
      { path: 'stocks', loadComponent: () => import('../stocks/stocks.component').then(m => m.StocksComponent) },
      { path: 'stocks/:id', loadComponent: () => import('../stocks/stock-detail.component').then(m => m.StockDetailComponent) },
      { path: 'products', loadComponent: () => import('../products/products.component').then(m => m.ProductsComponent) },
      { path: 'fournisseurs', loadComponent: () => import('../products/fournisseurs.component').then(m => m.FournisseursComponent) },
      { path: 'clients', loadComponent: () => import('../products/clients.component').then(m => m.ClientsComponent) },
      { path: 'supply', loadComponent: () => import('../supply/supply.component').then(m => m.SupplyComponent) },
      { path: 'transfers', loadComponent: () => import('../transfers/transfers.component').then(m => m.TransfersComponent) },
      { path: 'sales', loadComponent: () => import('../sales/sales.component').then(m => m.SalesComponent) },
      { path: 'factures', loadComponent: () => import('../sales/factures.component').then(m => m.FacturesComponent) },
      { path: 'finance/caisses', loadComponent: () => import('../finance/caisses.component').then(m => m.CaissesComponent) },
      { path: 'finance/orange-money', loadComponent: () => import('../finance/orange-money.component').then(m => m.OrangeMoneyComponent) },
      { path: 'finance/depenses', loadComponent: () => import('../finance/depenses.component').then(m => m.DepensesComponent) },
      { path: 'finance/salaries', loadComponent: () => import('../finance/bulletins-paie.component').then(m => m.BulletinsPaieComponent) },
      { path: 'finance/bulletins-paie', loadComponent: () => import('../finance/bulletins-paie.component').then(m => m.BulletinsPaieComponent) },
      { path: 'finance/comptabilite', loadComponent: () => import('../finance/comptabilite.component').then(m => m.ComptabiliteComponent) },
      { path: 'finance/tableau-bord', loadComponent: () => import('../finance/tableau-bord-comptable.component').then(m => m.TableauBordComptableComponent) },
      { path: 'logistics/engins', loadComponent: () => import('../logistics/engins.component').then(m => m.EnginsComponent) },
      { path: 'logistics/sorties', loadComponent: () => import('../logistics/sorties.component').then(m => m.SortiesComponent) },
{ path: 'logistics/maintenances', loadComponent: () => import('../logistics/maintenances.component').then(m => m.MaintenancesComponent) },
      { path: 'logistics/chauffeur/:id', loadComponent: () => import('../logistics/chauffeur-detail.component').then(m => m.ChauffeurDetailComponent) },
      { path: 'personnel', loadComponent: () => import('../personnel/personnel.component').then(m => m.PersonnelComponent) },
      { path: 'users', loadComponent: () => import('../users/users.component').then(m => m.UsersComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes), LayoutComponent],
  exports: [RouterModule]
})
export class LayoutModule {}
