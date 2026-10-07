import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface CompletedMeetingTable {
  id: number;
  meeting_code: any;
  meetingName: any;
  meetingDate: any;
  meetingPeriod: any;
  assignedTo: any;
  status: any;
}

export type SortColumn = keyof CompletedMeetingTable | '';
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
  selector: 'app-manage-meetings-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './manage-meetings-dashboard.component.html',
  styleUrl: './manage-meetings-dashboard.component.scss'
})
export class ManageMeetingsDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    meeting_code: null,
    meetingName: null,
    assignedTo: null,
    status: null,
  });
  public ManageMeetFilters = signal(JSON.parse(this.intialFilters));
  public meetingIdList: any = [];
  public meetingNameList: any = [];
  public assignedToList: any = [];
  public momStatusList: any = [];
  public ManageMeetGrid: CompletedMeetingTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getManageMeetGrid();
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
      this.ManageMeetGrid = this.ManageMeetGrid;
    } else {
      this.ManageMeetGrid = [...this.ManageMeetGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public date_range: any = null;
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
    await this.getManageMeetStats();
  }

  public initailStats = JSON.stringify({
    total_committee: 0,
    mom_created: 0,
    scheduled_meetings: 0,
    completed_meetings: 0,
    total_committee_last_updated: null,
    mom_created_last_updated: null,
    scheduled_meetings_last_updated: null,
    completed_meetings_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getManageMeetStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.ManageMeetGrid = [];
      let getManageMeetInfo: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getManageMeetInfo.status == 200) {
        getManageMeetInfo = getManageMeetInfo['data'][0];
        this.stats.set({
          total_committee: getManageMeetInfo.total_committee,
          mom_created: getManageMeetInfo.mom_created,
          scheduled_meetings: getManageMeetInfo.scheduled_meetings,
          completed_meetings: getManageMeetInfo.completed_meetings,
          total_committee_last_updated: getManageMeetInfo.total_committee_last_updated,
          mom_created_last_updated: getManageMeetInfo.mom_created_last_updated,
          scheduled_meetings_last_updated: getManageMeetInfo.scheduled_meetings_last_updated,
          completed_meetings_last_updated: getManageMeetInfo.completed_meetings_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};

  async getManageMeetGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.ManageMeetGrid = [];
      let totalCnt = 0;
      let flages: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getManageMeetList: any = await this._hqms.customGetApiCall('GET', 'fnMomApi', this.params);
      if (getManageMeetList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getManageMeetList.data[0]['total_row_cnt'];
        getManageMeetList.data.forEach((info: any, index: number) => {
          let createManageMeet: any = {
            id: index + 1,
            meeting_id: info.meeting_id,
            meeting_code: info.meeting_code,
            meetingName: info.meeting_name,
            assignedTo: info.assignedTo,
            meetingDate: info.meeting_date,
            committee_name: info.committee_name,
            meetingPeriod: info.meeting_period,
            created_by: info.created_by,
            created_at: info.created_at,
            updated_by: info.updated_by,
            updated_at: info.updated_at,
            status: info.status,
            mom_decision: info.mom_decision,
          };
          sourcedData.push(createManageMeet);
        });
        this.ManageMeetGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.meetingIdList = [...new Set(sourcedData.map((item: any) => item.meeting_code))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.meetingNameList = [...new Set(sourcedData.map((item: any) => item.meetingName))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.assignedToList = [...new Set(sourcedData.map((item: any) => item.assignedTo))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.momStatusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
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
    let filters = this.ManageMeetFilters();
    this.ManageMeetGrid = this.copyData.filter((fl: any) => {
      let meeting_code = !filters.meeting_code || fl['meeting_code'] === filters.meeting_code;
      let meetingName = !filters.meetingName || fl['meetingName'] === filters.meetingName;
      let assignedTo = !filters.assignedTo || fl['assignedTo'] === filters.assignedTo;
      let status = !filters.status || fl['status'] === filters.status;
      return meeting_code && meetingName && assignedTo && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.ManageMeetFilters.set(JSON.parse(this.intialFilters));
      this.ManageMeetGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, manageMeetProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/manage-meetings-details' : pageMode == 'MEETINGATTENDANCE' ? '/meeting-attendance' : '/manage-meetings-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: manageMeetProp == null ? null : manageMeetProp.meeting_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(manageMeetProp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${manageMeetProp.meetingName}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "meeting_id": manageMeetProp.meeting_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMomApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Manage Meetings',
          detail: saveResult.message,
        });
        // this.ManageMeetGrid = [...this.copyData.filter((fl: any) => fl.meeting_id != manageMeetProp.meeting_id)];
        this.ManageMeetGrid.forEach((ele: any) => {
          if (ele.meeting_id == manageMeetProp.meeting_id) {
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
    let pages = this.pageNators().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getManageMeetGrid();
  }


  public is_show_mom: boolean = false;
  public selectedMeeting: any = {
    meeting_name: null,
    meeting_agenda: null,
    meeting_id: null,
    mom_decision: [],
  };
  public clearMeets = JSON.stringify(this.selectedMeeting);

  async onMomApprovalClick(meetingPrp: any) {
    this.is_show_mom = true;
    this.selectedMeeting = JSON.parse(this.clearMeets);
    this.selectedMeeting['meeting_name'] = meetingPrp['meetingName'];
    this.selectedMeeting['meeting_agenda'] = meetingPrp['meeting_code'];
    this.selectedMeeting['meeting_id'] = meetingPrp['meeting_id'];
    this.selectedMeeting['mom_decision'] = meetingPrp['mom_decision'];
    let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "AGENDAAPPROVAL" });
    if (info.status == 200) {
      this.agendaAppStatus = info.data.entities.AGENDAAPPROVAL.values.map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
        severity: ele.display_value == 'Approved' ? 'success' : 'danger'
      }))
    };
  }
  public agendaAppStatus: any = [];

  async momStatusClick(agndStatus: any) {
    let agendaApp: any = {
      action: "A",
      meeting_id: this.selectedMeeting.meeting_id,
      mom_approved_status_id: agndStatus,
    };
    var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMomApi", agendaApp);
    if (saveResult.status == 200) {
      this._hqms.hqmsToasterService({
        severity: 'success',
        summary: 'Mom Approval',
        detail: saveResult.message,
      });
      this.onCloseDialog();
      await this.getManageMeetGrid();

    } else if (saveResult.status == 204 || saveResult.status == 501) {
      this._hqms.hqmsToasterService({
        severity: 'warn',
        summary: 'Mom Approval',
        detail: saveResult.message,
      });
    }
  }

  onCloseDialog() {
    this.is_show_mom = false;
    this.selectedMeeting = JSON.parse(this.clearMeets);
  }
}
