import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'money' | 'date' | 'boolean' | 'actions';
  badgeMap?: Record<string, string>;
  colorMap?: Record<string, string>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-table-wrapper">
      <div class="table-toolbar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Rechercher..." />
        </div>
        <div class="table-actions">
          <ng-content select="[tableActions]"></ng-content>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th *ngFor="let col of columns">{{ col.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of data" (click)="onRowClick(row)" [class.clickable]="rowClickable">
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'badge'" class="badge" [class]="getBadgeClass(col, row[col.key])">
                    {{ col.badgeMap?.[row[col.key]] || row[col.key] }}
                  </span>
                  <span *ngSwitchCase="'money'">{{ row[col.key] | number:'1.0-0' }} FCFA</span>
                  <span *ngSwitchCase="'date'">{{ row[col.key] | date:'dd/MM/yyyy' }}</span>
                  <span *ngSwitchCase="'boolean'">
                    <span [class]="row[col.key] ? 'badge badge-success' : 'badge badge-danger'">
                      {{ row[col.key] ? 'Oui' : 'Non' }}
                    </span>
                  </span>
                  <div *ngSwitchCase="'actions'" class="row-actions">
                    <button class="btn-icon btn-edit" (click)="onEdit(row, $event)" title="Modifier">✏️</button>
                    <button class="btn-icon btn-delete" (click)="onDelete(row, $event)" title="Supprimer">🗑️</button>
                  </div>
                  <span *ngSwitchDefault>{{ row[col.key] ?? '—' }}</span>
                </ng-container>
              </td>
            </tr>
            <tr *ngIf="data.length === 0 && !loading">
              <td [colSpan]="columns.length" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">📭</div>
                  <p>Aucune donnée trouvée</p>
                </div>
              </td>
            </tr>
            <tr *ngIf="loading">
              <td [colSpan]="columns.length" class="empty-cell">
                <div class="loading-state">⏳ Chargement...</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer" *ngIf="totalCount > 0">
        <span class="result-count">{{ totalCount }} résultat(s)</span>
        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">←</button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">→</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table-wrapper { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0f0f0; }
    .table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f5f5f5; gap: 12px; }
    .search-box { display: flex; align-items: center; gap: 8px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 8px 14px; flex: 1; max-width: 360px; }
    .search-box input { border: none; background: none; outline: none; font-size: 14px; color: #333; width: 100%; }
    .table-actions { display: flex; gap: 8px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8f9fa; }
    th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 700; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    td { padding: 13px 16px; font-size: 13px; color: #333; border-bottom: 1px solid #f5f5f5; }
    tr.clickable:hover td { background: #f8f9fa; cursor: pointer; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-success, .badge-paye, .badge-disponible, .badge-terminee { background: #dcfce7; color: #16a34a; }
    .badge-warning, .badge-partiel, .badge-validee, .badge-en_attente { background: #fef9c3; color: #ca8a04; }
    .badge-danger, .badge-credit, .badge-annule, .badge-en_panne { background: #fee2e2; color: #dc2626; }
    .badge-info, .badge-brouillon, .badge-planifiee { background: #dbeafe; color: #2563eb; }
    .badge-primary, .badge-recue, .badge-recu, .badge-confirme { background: #e0e7ff; color: #4338ca; }
    .badge-maintenance, .badge-en_cours, .badge-en_service { background: #fce7f3; color: #be185d; }
    .row-actions { display: flex; gap: 4px; }
    .btn-icon { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
    .btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
    .btn-delete:hover { background: #fee2e2; border-color: #fca5a5; }
    .empty-cell { text-align: center; padding: 40px !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .empty-icon { font-size: 40px; }
    .empty-state p { color: #999; font-size: 14px; margin: 0; }
    .loading-state { color: #999; font-size: 14px; }
    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #f5f5f5; }
    .result-count { font-size: 13px; color: #666; }
    .pagination { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #666; }
    .pagination button { background: white; border: 1px solid #e9ecef; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination button:not(:disabled):hover { background: #f8f9fa; }
  `]
})
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 20;
  @Input() rowClickable = false;
  @Output() search = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  searchTerm = '';
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  ngOnChanges(): void {}

  onSearch(): void { this.search.emit(this.searchTerm); }
  goToPage(page: number): void { this.pageChange.emit(page); }
  onRowClick(row: any): void { if (this.rowClickable) this.rowClick.emit(row); }
  onEdit(row: any, event: Event): void { event.stopPropagation(); this.edit.emit(row); }
  onDelete(row: any, event: Event): void { event.stopPropagation(); this.delete.emit(row); }

  getBadgeClass(col: TableColumn, value: string): string {
    const colorMap = col.colorMap || {};
    return colorMap[value] ? `badge-${colorMap[value]}` : `badge-${value}`;
  }
}
