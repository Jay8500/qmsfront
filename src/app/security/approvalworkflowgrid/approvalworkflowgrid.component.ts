import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';

interface aprvalwrkflowTable {
  id: number;
  approval_workflow_id: any;
  approval_workflow_name: any;
  application_type: any;
  module_name: any,
  status: any;
}

export type SortColumn = keyof aprvalwrkflowTable | '';
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
  selector: 'app-approvalworkflowgrid',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './approvalworkflowgrid.component.html',
})
export class ApprovalworkflowgridComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    approval_workflow_name: null,
    status: null,
  });
  public aprvalwrkflowFltrs = signal({ ...JSON.parse(this.intialFilters) });
  public apprvlWorkflwList: any = [];
  public applicationTypeList: any = [];
  public locationList: any = [];
  public statusList: any = [];
  public aprvalwrkflowMstrGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      await this.getAprvalwrkflowGrid();
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
      this.aprvalwrkflowMstrGrid = this.aprvalwrkflowMstrGrid;
    } else {
      this.aprvalwrkflowMstrGrid = [...this.aprvalwrkflowMstrGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};

  async getAprvalwrkflowGrid() {
    try {
      // let { pageNo, pageSize } = this.pageNators();
      this.aprvalwrkflowMstrGrid = [];
      // let totalCnt = 0;
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
      };
      this.params = { ...flags }
      let aprvalwrkflowInfo: any = await this._hqms.customGetApiCall('GET', 'fnAppWkflApi',
        flags);
      if (aprvalwrkflowInfo.status == 200) {
        let sourcedData: any = [];
        // totalCnt = aprvalwrkflowInfo.data[0]['total_row_cnt'];
        aprvalwrkflowInfo.data.forEach((info: any, index: number) => {
          let crtRl: any = {
            id: index + 1,
            approval_workflow_id: info.approval_workflow_id,
            approval_workflow_name: info.approval_workflow_name,
            module_name: info.module_name,
            document_name: info.document_name,
            created_by: info.created_by,
            created_at: info.created_at,
            updated_by: info.updated_by,
            updated_at: info.updated_at,
            status: info.status,
          };
          sourcedData.push(crtRl);
        });
        this.aprvalwrkflowMstrGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.apprvlWorkflwList = [...new Set(sourcedData.map((item: any) => item.approval_workflow_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.statusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
          label: name,
          value: name
        }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.aprvalwrkflowFltrs();
    this.aprvalwrkflowMstrGrid = this.copyData.filter((fl: any) => {
      let approval_workflow_name = !filters.approval_workflow_name || fl['approval_workflow_name'] === filters.approval_workflow_name;
      let status = !filters.status || fl['status'] === filters.status;
      return approval_workflow_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.aprvalwrkflowFltrs.set(JSON.parse(this.intialFilters));
      this.aprvalwrkflowMstrGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, aprvalwrkflowMastr: any) {
    try {
      this.router.navigate(
        [
          '/approvalworkflow',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: aprvalwrkflowMastr == null ? null : aprvalwrkflowMastr.approval_workflow_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(aprvalwrkflowMastr: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${aprvalwrkflowMastr.approval_workflow_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "approval_workflow_id": aprvalwrkflowMastr.approval_workflow_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAppWkflApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Approval Workflow',
          detail: saveResult.message,
        });
        this.aprvalwrkflowMstrGrid.forEach((ele: any) => {
          if (ele.approval_workflow_id == aprvalwrkflowMastr.approval_workflow_id) {
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
    await this.aprvalwrkflowMstrGrid();
  }

}
