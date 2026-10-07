import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
interface versionControlTable {
  id: number;
  document_no: any;
  document_name: any;
  document_type: any;
  // approved_status: any;
  current_version: any;
  status: any;
  created_at: any;
  updated_at: any;
}
export type SortColumn = keyof versionControlTable | '';
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
  selector: 'app-version-control-dashboard',
  imports: [CommonModule, SharedModule, SelectModule, FormsModule, NgbdSortableHeader],
  templateUrl: './version-control-dashboard.component.html',
  styleUrl: './version-control-dashboard.component.scss'
})
export class VersionControlDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    document_name: null,
    document_type: null,
    // approved_status: null,
    status: null,
  });
  public versionControlFilters = signal({ ...JSON.parse(this.intialFilters) });
  public documentNameList: any = [];
  public documentTypeList: any = [];
  // public approvalStatusList: any = [];
  public statusList: any = [];
  public versionControllGrid: any = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];
  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  public date_range: any = null;
  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })
  public initailStats = JSON.stringify({
    total_documents: 0,
    policy_documents: 0,
    manual_documents: 0,
    medical_documents: 0,
    total_documents_last_updated: null,
    policy_documents_last_updated: null,
    manual_documents_last_updated: null,
    medical_documents_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getVersionControlGrid();
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    if (direction === '' || column === '') {
      this.versionControllGrid = this.versionControllGrid;
    } else {
      this.versionControllGrid = [...this.versionControllGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  async setRange(value: string) {
    this.selectedRange = value;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.date_range = null;
    this.selectedRange = value;
    switch (value) {
      case 'Last 7 days':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 30 days':
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Month':
        let firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        let lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        this.date_range = `${this._datePipe.transform(firstDayLastMonth, "dd-MMM-yyyy")} - ${this._datePipe.transform(lastDayLastMonth, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getVersionControlStats();
  }

  async getVersionControlStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let getVersionControlStats: any = await this._hqms.customGetApiCall('GET', 'fnDocumentDashboardApi',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getVersionControlStats.status == 200) {
        getVersionControlStats = getVersionControlStats['data'][0];
        this.stats.set({
          total_documents: getVersionControlStats.total_documents,
          policy_documents: getVersionControlStats.policy_documents,
          manual_documents: getVersionControlStats.manual_documents,
          medical_documents: getVersionControlStats.medical_documents,
          total_documents_last_updated: getVersionControlStats.total_documents_last_updated,
          policy_documents_last_updated: getVersionControlStats.policy_documents_last_updated,
          manual_documents_last_updated: getVersionControlStats.manual_documents_last_updated,
          medical_documents_last_updated: getVersionControlStats.medical_documents_last_updated
        })
      };
    } catch (e) { };
  }

  public params: any = {};
  async getVersionControlGrid() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let { pageNo, pageSize } = this.pageNators();
      this.versionControllGrid = [];
      let totalCnt = 0;
      let flages: any = {
        action: "G",
        "page_no": pageNo,
        "page_size": pageSize,
        "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy')
      };
      this.params = { ...flages }
      let getVersionControlList: any = await this._hqms.customGetApiCall('GET', 'fnDocumentApi', this.params);
      if (getVersionControlList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getVersionControlList.data[0]['total_row_cnt'];
        getVersionControlList.data.forEach((versionControls: any, index: number) => {
          let createVersionControls: any = {
            id: index + 1,
            document_id: versionControls.document_id,
            document_no: versionControls.document_no,
            document_name: versionControls.document_name,
            document_type: versionControls.document_type,
            current_version: versionControls.current_version_no ? `v${versionControls.current_version_no}` : 'Draft',
            can_edit: versionControls.can_edit !== false,
            can_approve: !!versionControls.can_approve,
            // approved_status: versionControls.approved_status,
            created_by: versionControls.created_by,
            created_at: versionControls.created_at,
            updated_by: versionControls.updated_by,
            updated_at: versionControls.updated_at,
            status: versionControls.status,
          };
          sourcedData.push(createVersionControls);
        });
        this.versionControllGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.documentNameList = [...new Set(sourcedData.map((item: any) => item.document_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.documentTypeList = [...new Set(sourcedData.map((item: any) => item.document_type))].map((name, index) => ({
          label: name,
          value: name
        }));
        // this.approvalStatusList = [...new Set(sourcedData.map((item: any) => item.approved_status))].map((name, index) => ({
        //   label: name,
        //   value: name
        // }));
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
    let filters = this.versionControlFilters();
    this.versionControllGrid = this.copyData.filter((fl: any) => {
      let document_name = !filters.document_name || fl['document_name'] === filters.document_name;
      let document_type = !filters.document_type || fl['document_type'] === filters.document_type;
      // let approved_status = !filters.approved_status || fl['approved_status'] === filters.approved_status;
      let status = !filters.status || fl['status'] === filters.status;
      return document_name && document_type && status;
      // && approved_status
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.versionControlFilters.set(JSON.parse(this.intialFilters));
      this.versionControllGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, versionnControl: any) {
    try {
      // if (versionnControl != null) {
      //   if (versionnControl['status'] == 'Inactive') {
      //     this._hqms.hqmsToasterService({
      //       severity: 'success',
      //       summary: 'Version Control',
      //       detail: 'Inactive record not for edit',
      //     });
      //     return;
      //   };
      // };
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/version-control-details' : '/version-control-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: versionnControl == null ? null : versionnControl.document_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(versionnControl: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${versionnControl.document_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "document_id": versionnControl.document_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnDocumentApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Version Control',
          detail: saveResult.message,
        });
        // this.versionControllGrid = [...this.copyData.filter((fl: any) => fl.document_id != versionnControl.document_id)];
        this.versionControllGrid.forEach((ele: any) => {
          if (ele.document_id == versionnControl.document_id) {
            ele['status'] = 'Inactive';
          };
        });
      };
    };
  }


  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getVersionControlGrid();
  }
}
