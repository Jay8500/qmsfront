import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
interface MeetingTable {
  id: number;
  meeting_id: any;
  meeting_code: string;
  meeting_name: string;
  committee_name: string;
  chair_person_name: string;
  committee_type_name: string;
  meeting_date: string;
  meeting_period: string;
  venue_name: string;
  status: string;
  rec_status: string;
}

export type SortColumn = keyof MeetingTable | '';
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
  selector: 'app-schedule-commitee-meetings-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './schedule-commitee-meetings-dashboard.component.html',
  styleUrl: './schedule-commitee-meetings-dashboard.component.scss'
})
export class ScheduleCommiteeMeetingsDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    meeting_code: null,
    meeting_name: null,
    committee_name: null,
    committee_type_name: null,
    status: null,
  });
  public SchFilters = signal(JSON.parse(this.intialFilters));
  public meetingIdList: any = [];
  public meetingNameList: any = [];
  public committeeNameList: any = [];
  public coChairPersonList: any = [];
  public statusList: any = [];
  public SchGrid: MeetingTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;

  showFilter = false;
  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];
  public agendaAppStatus: any = [];

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getSchGrid();
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
      this.SchGrid = this.SchGrid;
    } else {
      this.SchGrid = [...this.SchGrid].sort((a, b) => {
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
    await this.getSchStats();
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

  async getSchStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.SchGrid = [];
      let getSchStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getSchStatsInfo.status == 200) {
        getSchStatsInfo = getSchStatsInfo['data'][0];
        this.stats.set({
          total_committee: getSchStatsInfo.total_committee,
          mom_created: getSchStatsInfo.mom_created,
          scheduled_meetings: getSchStatsInfo.scheduled_meetings,
          completed_meetings: getSchStatsInfo.completed_meetings,
          total_committee_last_updated: getSchStatsInfo.total_committee_last_updated,
          mom_created_last_updated: getSchStatsInfo.mom_created_last_updated,
          scheduled_meetings_last_updated: getSchStatsInfo.scheduled_meetings_last_updated,
          completed_meetings_last_updated: getSchStatsInfo.completed_meetings_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};

  async getSchGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.SchGrid = [];
      let totalCnt = 0;
      let flages: any = {
        // "is_faculty": true,
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getSchList: any = await this._hqms.customGetApiCall('GET', 'fnMeetingApi', this.params);
      if (getSchList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getSchList.data[0]['total_row_cnt'];
        getSchList.data.forEach((schPrp: any, index: number) => {
          let createSch: any = {
            id: index + 1,
            meeting_id: schPrp.meeting_id,
            meeting_code: schPrp.meeting_code,
            meeting_name: schPrp.meeting_name,
            committee_name: schPrp.committee_name,
            committee_type_name: schPrp.committee_type_name,
            chair_person_name: schPrp.chair_person_name,
            meeting_date: schPrp.meeting_date,
            meeting_period: schPrp.meeting_period,
            venue_name: schPrp.venue_name,
            created_by: schPrp.created_by,
            created_at: schPrp.created_at,
            updated_by: schPrp.updated_by,
            updated_at: schPrp.updated_at,
            status: schPrp.status,
            rec_status: schPrp.rec_status,
            meeting_agenda: schPrp.meeting_agenda,
            is_meeting_ongoing: schPrp.is_meeting_ongoing,
          };
          sourcedData.push(createSch);
        });
        this.SchGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.meetingIdList = [...new Set(sourcedData.map((item: any) => item.meeting_code))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.meetingNameList = [...new Set(sourcedData.map((item: any) => item.meeting_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.committeeNameList = [...new Set(sourcedData.map((item: any) => item.committee_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.coChairPersonList = [...new Set(sourcedData.map((item: any) => item.committee_type_name))].map((name, index) => ({
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
    let filters = this.SchFilters();
    this.SchGrid = this.copyData.filter((fl: any) => {
      let meeting_code = !filters.meeting_code || fl['meeting_code'] === filters.meeting_code;
      let meeting_name = !filters.meeting_name || fl['meeting_name'] === filters.meeting_name;
      let committee_name = !filters.committee_name || fl['committee_name'] === filters.committee_name;
      let committee_type_name = !filters.committee_type_name || fl['committee_type_name'] === filters.committee_type_name;
      let status = !filters.status || fl['status'] === filters.status;
      return meeting_code && meeting_name && committee_name && committee_type_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.SchFilters.set(JSON.parse(this.intialFilters));
      this.SchGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, schProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/schedule-commitee-meetings-details' : '/schedule-commitee-meetings-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: schProp == null ? null : schProp.meeting_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(schProp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${schProp.meeting_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "meeting_id": schProp.meeting_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMeetingApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Schedule Committee Meeting',
          detail: saveResult.message,
        });
        // this.SchGrid = [...this.copyData.filter((fl: any) => fl.meeting_id != schProp.meeting_id)];
        this.SchGrid.forEach((ele: any) => {
          if (ele.meeting_id == schProp.meeting_id) {
            ele['rec_status'] = 'Inactive';
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
    await this.getSchGrid();
  }

  public is_show_agenda: boolean = false;
  public selectedMeeting: any = {
    meeting_name: null,
    meeting_agenda: null,
    agenda_approved_status_id: null,
    meeting_id: null,
  };
  public clearMeets = JSON.stringify(this.selectedMeeting);

  async onAgendaApprovalClick(meetingPrp: any) {
    this.is_show_agenda = true;
    this.selectedMeeting = JSON.parse(this.clearMeets);
    this.selectedMeeting['meeting_name'] = meetingPrp['meeting_name'];
    this.selectedMeeting['meeting_agenda'] = meetingPrp['meeting_agenda'];
    this.selectedMeeting['meeting_id'] = meetingPrp['meeting_id'];
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

  async agendaStatusClick(agndStatus: any) {
    let agendaApp: any = {
      action: "A",
      meeting_id: this.selectedMeeting.meeting_id,
      agenda_approved_status_id: agndStatus,
    };
    var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMeetingApi", agendaApp);
    if (saveResult.status == 200) {
      this._hqms.hqmsToasterService({
        severity: 'success',
        summary: 'Agenda Approval',
        detail: saveResult.message,
      });
      this.onCloseDialog();
      await this.getSchGrid();

    } else if (saveResult.status == 204 || saveResult.status == 501) {
      this._hqms.hqmsToasterService({
        severity: 'warn',
        summary: 'Agenda Approval',
        detail: saveResult.message,
      });
    }
  }

  onCloseDialog() {
    this.is_show_agenda = false;
    this.selectedMeeting = JSON.parse(this.clearMeets);
  }
}
