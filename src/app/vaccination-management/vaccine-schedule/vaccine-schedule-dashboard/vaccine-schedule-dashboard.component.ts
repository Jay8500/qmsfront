import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { VaccinationAccessService } from '../../vaccination-access.service';

export type SortColumn = string;
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
  selector: 'app-vaccine-schedule-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './vaccine-schedule-dashboard.component.html'
})
export class VaccineScheduleDashboardComponent implements OnInit {
  // Max rows loaded at once; filters, sorting and paging then work on the whole list.
  private readonly LOAD_ALL_SIZE = 1000;
  public intialFilters: any = JSON.stringify({
    campaign_name: null,
    vaccine_name: null,
    venue: null,
    scheduled_date: null,
    status: null,
    rec_status: null,
  });
  public vaccntnFilters = signal(JSON.parse(this.intialFilters));
  public campaignList: any = [];
  public vaccineList: any = [];
  public venueList: any = [];
  public schedulestatusList: any = [];
  public statusList: any = [];
  public vccneSchdlesGrid: any = [];
  public filteredData: any = [];
  public copyData: any = [];
  public router = inject(Router);
  public access = inject(VaccinationAccessService).access('vaccine-schedule-dashboard');
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  selectedRange: string = 'Last 30 days';

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      // setRange loads the summary cards and the grid.
      await this.setRange(this.selectedRange);
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
    if (direction !== '' && column !== '') {
      this.filteredData = [...this.filteredData].sort((a: any, b: any) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
    this.showPage(1);
  }

  showFilter = false;
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public date_range: any = null;
  async setRange(value: string) {
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
    await this.getVaccineSchGrid();
  }

  private getDateParams() {
    let fromDt = null;
    let toDate = null;
    if (this.date_range != null) {
      let dates = this.date_range.split(" - ");
      fromDt = dates[0];
      toDate = (dates.length > 1 ? dates[1] : dates[0]);
    };
    return {
      "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
      "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
    };
  }

  public initailStats = JSON.stringify({
    total_vaccines: 0,
    vaccinated_emp: 0,
    scheduled_vaccines: 0,
    vaccine_brands: 0,
    vaccinated_emp_last_updated: null,
    scheduled_vaccines_last_updated: null,
    vaccine_brands_last_updated: null,
    total_vaccines_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getSchStats() {
    try {
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'vaccnationDashboardStats', this.getDateParams());
      if (statInfo.status == 200) {
        this.stats.set({
          total_vaccines: statInfo['data'][0].no_of_vaccine_cnt || 0,
          vaccinated_emp: statInfo['data'][0].vaccinated_emp_cnt || 0,
          scheduled_vaccines: statInfo['data'][0].scheduled_vaccines_cnt || 0,
          vaccine_brands: statInfo['data'][0].vaccines_brands_cnt || 0,
          vaccinated_emp_last_updated: statInfo['data'][0].vaccinated_emp_cnt_last_updated,
          scheduled_vaccines_last_updated: statInfo['data'][0].scheduled_vaccines_cnt_last_updated,
          vaccine_brands_last_updated: statInfo['data'][0].vaccines_brands_cnt_last_updated,
          total_vaccines_last_updated: statInfo['data'][0].no_of_vaccine_cnt_last_updated,
        });
      };
    } catch (e) {
    };
  }

  public params: any = {};

  // Scope text for the list, e.g. "Pediatrics — 37 employees" (SRS 2.2 v0.2).
  private scopeText(vccn: any): string {
    if (vccn.target_scope) return vccn.target_scope;
    let depts = vccn.department_names || '';
    let cnt = vccn.employee_cnt;
    if (depts && cnt != null) return `${depts} — ${cnt} employees`;
    if (cnt != null) return `${cnt} employees`;
    return depts || '-';
  }

  async getVaccineSchGrid() {
    try {
      this.copyData = [];
      this.params = { ...this.getDateParams() };
      let info: any = await this._hqms.customGetApiCall('GET', 'schVaccine', {
        "page_no": 1,
        "page_size": this.LOAD_ALL_SIZE,
        ...this.params
      });
      if (info.status == 200) {
        let sourcedData: any = [];
        info.data.forEach((vccn: any, index: number) => {
          sourcedData.push({
            id: index + 1,
            vaccination_campaign_id: vccn.vaccination_campaign_id,
            campaign_name: vccn.campaign_name,
            vaccine_name: vccn.vaccine_name,
            venue: vccn.venue_name,
            scope: this.scopeText(vccn),
            scheduled_from_date: vccn.start_date,
            scheduled_to_date: vccn.end_date,
            capacity: vccn.capacity,
            status: vccn.status,
            rec_status: vccn.rec_status,
            created_by: vccn.created_by,
            created_at: vccn.created_at,
            updated_by: vccn.updated_by,
            updated_at: vccn.updated_at,
          });
        });
        this.copyData = [...sourcedData];
        this.campaignList = this.toOptions(sourcedData.map((item: any) => item.campaign_name));
        this.vaccineList = this.toOptions(sourcedData.map((item: any) => item.vaccine_name));
        this.venueList = this.toOptions(sourcedData.map((item: any) => item.venue));
        this.schedulestatusList = this.toOptions(sourcedData.map((item: any) => item.status));
        this.statusList = this.toOptions(sourcedData.map((item: any) => item.rec_status));
      };
      this.onFilterClick();
    } catch (e) {
    };
  }

  private toOptions(values: any[]) {
    return [...new Set(values.filter((v) => v != null && v !== ''))].map((name) => ({
      label: name,
      value: name
    }));
  }

  // True when the chosen date falls on or between the schedule's From and To dates.
  private onScheduledDate(row: any, date: any): boolean {
    if (!date) return true;
    let day = this._datePipe.transform(date, 'yyyy-MM-dd') || '';
    let from = this._datePipe.transform(row.scheduled_from_date, 'yyyy-MM-dd') || '';
    let to = this._datePipe.transform(row.scheduled_to_date || row.scheduled_from_date, 'yyyy-MM-dd') || from;
    return day >= from && day <= to;
  }

  onFilterClick() {
    try {
      let filters = this.vaccntnFilters();
      this.filteredData = this.copyData.filter((fl: any) => {
        let campaign_name = !filters.campaign_name || fl['campaign_name'] === filters.campaign_name;
        let vaccine_name = !filters.vaccine_name || fl['vaccine_name'] === filters.vaccine_name;
        let venue = !filters.venue || fl['venue'] === filters.venue;
        let scheduled_date = this.onScheduledDate(fl, filters.scheduled_date);
        let status = !filters.status || fl['status'] === filters.status;
        let rec_status = !filters.rec_status || fl['rec_status'] === filters.rec_status;
        return campaign_name && vaccine_name && venue && scheduled_date && status && rec_status;
      });
      this.showPage(1);
    } catch (e) {
    }
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.vaccntnFilters.set(JSON.parse(this.intialFilters));
      this.filteredData = [...this.copyData];
      this.showPage(1);
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, vccnInfo: any) {
    try {
      this.router.navigate(
        [
          '/vaccine-schedule-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: vccnInfo == null ? null : vccnInfo.vaccination_campaign_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(vccnInfo: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${vccnInfo.campaign_name}`);
    if (confirm) {
      let savePayload = {
        "action": "D",
        "vaccination_campaign_id": vccnInfo.vaccination_campaign_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "schVaccine", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Vaccine Schedules',
          detail: saveResult.message,
        });
        // Delete deactivates the record; the schedule status itself is unchanged.
        this.copyData.forEach((ele: any) => {
          if (ele.vaccination_campaign_id == vccnInfo.vaccination_campaign_id) {
            ele['rec_status'] = 'Inactive';
          };
        });
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Vaccine Schedules',
          detail: saveResult.message,
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

  // Client-side paging over the filtered list.
  showPage(pageNo: number) {
    let { pageSize } = this.pageNators();
    let totalPages = Math.max(1, Math.ceil(this.filteredData.length / pageSize));
    let page = Math.min(Math.max(1, pageNo), totalPages);
    this.vccneSchdlesGrid = this.filteredData.slice((page - 1) * pageSize, page * pageSize);
    this.pageNators.update(current => ({
      ...current,
      pageNo: page,
      totalItems: this.filteredData.length,
      totalPages: totalPages
    }));
  }

  changePage(newDisplayPage: number) {
    this.showPage(newDisplayPage);
  }
}
