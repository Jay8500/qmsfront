import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { DatePipe } from '@angular/common';
interface cpTable {
  id: number;
  cp_master_id: any;
  cp_type: any,
  department_name: any,
  status: any
}

export type SortColumn = keyof cpTable | '';
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
  selector: 'app-cplist',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],//BlockuiComponent
  templateUrl: './cplist.component.html',
  styleUrl: './cplist.component.scss',
})
export class CplistComponent {
  public intialFilters: any = JSON.stringify({
    cp_type: null,
    department_name: null,
    status: null
  });
  public cpFilters = signal(JSON.parse(this.intialFilters));
  public cpNameList: any = [];
  public departmentList: any = [];
  public auditCategoryList: any = [];
  public statusList: any = [];
  public cpGrid: any = [];
  public copyData: any = [];
  public router = inject(Router);
  selectedRange: string = 'Last 30 days';
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }
  async ngOnInit() {
    try {
      await this.getCpGrid();
    } catch (e) { }
  }

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }

    // sorting data
    if (direction === '' || column === '') {
      this.cpGrid = this.cpGrid;
    } else {
      this.cpGrid = [...this.cpGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'text-success';
      case 'Inactive':
        return 'text-danger';
      default:
        return '';
    }
  }

  showFilter = false;
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  onFilterClick() {
    try {
      let filters = this.cpFilters();
      this.cpGrid = this.copyData.filter((fl: any) => {
        let cp_type = !filters.cp_type || fl['cp_type'] === filters.cp_type;
        let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
        let status = !filters.status || fl['status'] === filters.status;
        return cp_type && department_name && status;
      });
    } catch (e) {
    }
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.cpFilters.set(JSON.parse(this.intialFilters));
      this.cpGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, ctrl: any) {
    try {
      this.router.navigate(
        ['/cp-master'],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: ctrl == null ? null : ctrl.cp_master_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(delPrp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${delPrp.cp_type}`);
    if (confirm) {
      let savePayload = {
        "action": "D",
        "cp_master_id": delPrp.cp_master_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnCpMasterWrite", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'cp',
          detail: saveResult.message,
        });
        // await this.getCpGrid();
        this.cpGrid.forEach((ele: any) => {
          if (ele.cp_master_id == delPrp.cp_master_id) {
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

  public params: any = {};
  async getCpGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.cpGrid = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnCpMasterWrite',
        flags);
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((prp: any, index: number) => {
          let createTrainings: any = {
            id: index + 1,
            cp_master_id: prp.cp_master_id,
            cp_type: prp.cp_type,
            department_name: prp.department_name,
            sections: prp.sections,
            created_by: prp.created_by,
            created_at: prp.created_at,
            updated_by: prp.updated_by,
            updated_at: prp.updated_at,
            status: prp.status,
          };
          sourcedData.push(createTrainings);
        });
        this.cpGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.cpNameList = [...new Set(sourcedData.map((item: any) => item.cp_type))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.departmentList = [...new Set(sourcedData.map((item: any) => item.department_name))].map((name, index) => ({
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
    } catch (e) {
    };
  }

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getCpGrid();
  }
}
