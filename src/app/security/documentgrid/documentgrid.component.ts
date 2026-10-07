import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';

interface documentTable {
  id: number;
  document_id: any;
  document_name: any;
  description: any,
  primary_url: any,
  secondary_url: any,
  status: any;
}

export type SortColumn = keyof documentTable | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };
const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}

@Component({
  selector: 'app-documentgrid',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './documentgrid.component.html',
})
export class DocumentgridComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    document_name: null,
    primary_url: null,
    status: null,
  });
  public docFilters = signal({ ...JSON.parse(this.intialFilters) });
  public documentList: any = [];
  public statusList: any = [];
  public docList: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      await this.getDocGrid();
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.docList = this.docList;
    } else {
      this.docList = [...this.docList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};

  async getDocGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.docList = [];
      let totalCnt = 0;
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
      };
      this.params = { ...flags }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnDocApi',
        flags);
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((documents: any, index: number) => {
          let prp: any = {
            id: index + 1,
            document_id: documents.document_id,
            document_name: documents.document_name,
            primary_url: documents.primary_url,
            secondary_url: documents.secondary_url,
            description: documents.description,
            created_by: documents.created_by,
            created_at: documents.created_at,
            updated_by: documents.updated_by,
            updated_at: documents.updated_at,
            status: documents.status,
          };
          sourcedData.push(prp);
        });
        this.docList = [...sourcedData];
        this.copyData = [...sourcedData];
        this.documentList = [...new Set(sourcedData.map((item: any) => item.document_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.statusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.pageNators.update(current => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize)
        }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.docFilters();
    this.docList = this.copyData.filter((fl: any) => {
      let document_name = !filters.document_name || fl['document_name'] === filters.document_name;
      let status = !filters.status || fl['status'] === filters.status;
      return document_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.docFilters.set(JSON.parse(this.intialFilters));
      this.docList = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, doc: any) {
    try {
      this.router.navigate(
        [
          '/document',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: doc == null ? null : doc.document_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(doc: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${doc.document_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "document_id": doc.document_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnDocApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Document',
          detail: saveResult.message,
        });
        this.docList.forEach((ele: any) => {
          if (ele.document_id == doc.document_id) {
            ele['status'] = 'Inactive';
          };
        });
      };
    };
  }


  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalItems;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.docList();
  }

}

