import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';

interface roleMasterTable {
  id: number;
  role_id: any;
  role_name: any;
  role_short_name: any;
  role_desc: any,
  status: any;
}

export type SortColumn = keyof roleMasterTable | '';
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
  selector: 'app-rolegrid',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './rolegrid.component.html',
})
export class RolegridComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    role_name: null,
    role_short_name: null,
    status: null,
  });
  public rlMstrFltrs = signal({ ...JSON.parse(this.intialFilters) });
  public rlNameList: any = [];
  public rleShrtNameList: any = [];
  public statusList: any = [];
  public rlMstrGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      await this.getRoleGrid();
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
      this.rlMstrGrid = this.rlMstrGrid;
    } else {
      this.rlMstrGrid = [...this.rlMstrGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};

  async getRoleGrid() {
    try {
      // let { pageNo, pageSize } = this.pageNators();
      this.rlMstrGrid = [];
      // let totalCnt = 0;
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
      };
      this.params = { ...flags }
      let rleInfo: any = await this._hqms.customGetApiCall('GET', 'fnRoleApi',
        flags);
      if (rleInfo.status == 200) {
        let sourcedData: any = [];
        // totalCnt = rleInfo.data[0]['total_row_cnt'];
        rleInfo.data.forEach((info: any, index: number) => {
          let crtRl: any = {
            id: index + 1,
            role_id: info.role_id,
            role_name: info.role_name,
            role_desc: info.role_desc,
            role_short_name: info.role_short_name,
            created_by: info.created_by,
            created_at: info.created_at,
            updated_by: info.updated_by,
            updated_at: info.updated_at,
            status: info.status,
          };
          sourcedData.push(crtRl);
        });
        this.rlMstrGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.rlNameList = [...new Set(sourcedData.map((item: any) => item.role_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.rleShrtNameList = [...new Set(sourcedData.map((item: any) => item.role_short_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.statusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
          label: name,
          value: name
        }));
        // this.pageNators.update(current => ({
        //   ...current,
        //   totalItems: Math.ceil(totalCnt / pageSize),
        //   totalPages: Math.ceil(totalCnt / pageSize)
        // }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.rlMstrFltrs();
    this.rlMstrGrid = this.copyData.filter((fl: any) => {
      let role_name = !filters.role_name || fl['role_name'] === filters.role_name;
      let role_short_name = !filters.role_short_name || fl['role_short_name'] === filters.role_short_name;
      let status = !filters.status || fl['status'] === filters.status;
      return role_name && role_short_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.rlMstrFltrs.set(JSON.parse(this.intialFilters));
      this.rlMstrGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, roleMaster: any) {
    try {
      this.router.navigate(
        [
          '/role',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: roleMaster == null ? null : roleMaster.role_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(roleMaster: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${roleMaster.role_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "role_id": roleMaster.role_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnRoleApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Role',
          detail: saveResult.message,
        });
        this.rlMstrGrid.forEach((ele: any) => {
          if (ele.role_id == roleMaster.role_id) {
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
    await this.rlMstrGrid();
  }

}

