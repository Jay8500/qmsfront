import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { VaccinationAccessService } from '../../vaccination-access.service';
import { VaccineBulkUploadComponent } from '../vaccine-bulk-upload/vaccine-bulk-upload.component';
import { PolicyDialogComponent } from '../../policy/policy-dialog/policy-dialog.component';

interface vaccineTable {
  id: number;
  vaccine_id: any;
  vaccine_code: string;
  vaccine_name: string;
  manufacture_name: string;
  scope: string;
  route: string;
  recurrence: string;
  volume: string;
  dose_count: number;
  created_by: any;
  created_at: any;
  updated_by: any;
  updated_at: any;
  status: string;
};
export type SortColumn = keyof vaccineTable | '';
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

// Joins the distinct non-empty values of one dose field, e.g. "IM, SC".
const distinctJoin = (values: any[]) => [...new Set(values.filter((v) => v != null && v !== ''))].join(', ');

@Component({
  selector: 'app-vaccine-master-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule, VaccineBulkUploadComponent, PolicyDialogComponent],
  templateUrl: './vaccine-master-dashboard.component.html'
})
export class VaccineMasterDashboardComponent implements OnInit {
  // Max rows loaded at once; filters, sorting and paging then work on the whole list (SRS 2.1.C filters).
  private readonly LOAD_ALL_SIZE = 1000;
  public intialFilters: any = JSON.stringify({
    vaccine_code: null,
    vaccine_name: null,
    manufacture_name: null,
    route: null,
    recurrence: null,
    dose_count: null,
    status: null
  });
  public vaccineFilters = signal(JSON.parse(this.intialFilters));
  public vaccineCodeList: any = [];
  public vaccineNameList: any = [];
  public manuFacturerList: any = [];
  public routeList: any = [];
  public recurrenceList: any = [];
  public doseCountList: any = [];
  public statusList: any = [];
  public vaccineGrid: vaccineTable[] = [];
  public filteredData: vaccineTable[] = [];
  public router = inject(Router);
  public access = inject(VaccinationAccessService).access('vaccine-master-dashboard');
  // Vaccination Policy / SOP versions (SRS 2.x4)
  public showPolicy = false;
  public showBulkUpload = false;
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: vaccineTable[] = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getVaccineGrid();
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
      this.filteredData = [...this.filteredData].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
    this.showPage(1);
  }

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
    await this.getVaccineStats();
  }

  public initailStats = JSON.stringify({
    "no_of_vaccine_cnt": 0,
    "vaccinated_emp_cnt": 0,
    "vaccines_brands_cnt": 0,
    "scheduled_vaccines_cnt": 0,
    "no_of_vaccine_cnt_last_updated": null,
    "vaccinated_emp_cnt_last_updated": null,
    "vaccines_brands_cnt_last_updated": null,
    "scheduled_vaccines_cnt_last_updated": null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

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

  async getVaccineStats() {
    try {
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'vaccnationDashboardStats', this.getDateParams());
      if (statInfo.status == 200) {
        this.stats.set({
          no_of_vaccine_cnt: statInfo['data'][0].no_of_vaccine_cnt || 0,
          vaccinated_emp_cnt: statInfo['data'][0].vaccinated_emp_cnt || 0,
          vaccines_brands_cnt: statInfo['data'][0].vaccines_brands_cnt || 0,
          scheduled_vaccines_cnt: statInfo['data'][0].scheduled_vaccines_cnt || 0,
          no_of_vaccine_cnt_last_updated: statInfo['data'][0].no_of_vaccine_cnt_last_updated,
          vaccinated_emp_cnt_last_updated: statInfo['data'][0].vaccinated_emp_cnt_last_updated,
          vaccines_brands_cnt_last_updated: statInfo['data'][0].vaccines_brands_cnt_last_updated,
          scheduled_vaccines_cnt_last_updated: statInfo['data'][0].scheduled_vaccines_cnt_last_updated
        })
      };
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.vaccineFilters();
    this.filteredData = this.copyData.filter((fl: any) => {
      let vaccine_code = !filters.vaccine_code || fl['vaccine_code'] === filters.vaccine_code;
      let vaccine_name = !filters.vaccine_name || fl['vaccine_name'] === filters.vaccine_name;
      let manufacture_name = !filters.manufacture_name || fl['manufacture_name'] === filters.manufacture_name;
      let route = !filters.route || (fl['route'] || '').split(', ').includes(filters.route);
      let recurrence = !filters.recurrence || (fl['recurrence'] || '').split(', ').includes(filters.recurrence);
      let dose_count = !filters.dose_count || fl['dose_count'] === filters.dose_count;
      let status = !filters.status || fl['status'] === filters.status;
      return vaccine_code && vaccine_name && manufacture_name && route && recurrence && dose_count && status;
    });
    this.showPage(1);
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.vaccineFilters.set(JSON.parse(this.intialFilters));
      this.filteredData = [...this.copyData];
      this.showPage(1);
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, vccn: any) {
    try {
      this.router.navigate(
        [
          '/vaccine-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: vccn == null ? null : vccn.vaccine_id
            }
          }
        },
      );
    } catch (e) {
    };
  }

  async onDelete(vcc: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${vcc.vaccine_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "vaccine_id": vcc.vaccine_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "vaccineMasterApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Vaccine',
          detail: saveResult.message,
        });
        this.copyData.forEach((ele: any) => {
          if (ele.vaccine_id == vcc.vaccine_id) {
            ele['status'] = 'Inactive';
          };
        });
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Vaccine',
          detail: saveResult.message,
        });
      };
    };
  }

  async onBulkUploadDone(saved: boolean) {
    this.showBulkUpload = false;
    if (saved) {
      await this.getVaccineStats();
      await this.getVaccineGrid();
    }
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
  public params: any = {};

  // The master list always shows every vaccine; the date range applies to the summary cards only.
  async getVaccineGrid() {
    try {
      this.params = {};
      this.copyData = [];
      let vaccineList: any = await this._hqms.customGetApiCall('GET', 'vaccineMasterApi',
        {
          "page_no": 1,
          "page_size": this.LOAD_ALL_SIZE,
          ...this.params
        });
      if (vaccineList.status == 200) {
        let sourcedData: vaccineTable[] = [];
        vaccineList.data.forEach((vccn: any, index: number) => {
          let configs: any[] = vccn.configurations || [];
          sourcedData.push({
            id: index + 1,
            vaccine_id: vccn.vaccine_id,
            vaccine_code: vccn.vaccine_code,
            vaccine_name: vccn.vaccine_name,
            manufacture_name: vccn.manufacture_name,
            scope: distinctJoin(configs.map((c: any) => c.target_name)),
            route: distinctJoin(configs.map((c: any) => c.route_name)),
            recurrence: distinctJoin(configs.map((c: any) => c.recurrence_interval)),
            volume: distinctJoin(configs.map((c: any) => [c.dosage_value, c.dosage_unit].filter((v) => v != null).join(' '))),
            dose_count: configs.length,
            created_by: vccn.created_by,
            created_at: vccn.created_at,
            updated_by: vccn.updated_by,
            updated_at: vccn.updated_at,
            status: vccn.status
          });
        });
        this.copyData = [...sourcedData];
        this.vaccineCodeList = this.toOptions(sourcedData.map((item) => item.vaccine_code));
        this.vaccineNameList = this.toOptions(sourcedData.map((item) => item.vaccine_name));
        this.manuFacturerList = this.toOptions(sourcedData.map((item) => item.manufacture_name));
        this.routeList = this.toOptions(sourcedData.flatMap((item) => (item.route || '').split(', ')));
        this.recurrenceList = this.toOptions(sourcedData.flatMap((item) => (item.recurrence || '').split(', ')));
        this.doseCountList = [...new Set(sourcedData.map((item) => item.dose_count))].sort().map((cnt) => ({
          label: `${cnt} ${cnt == 1 ? 'dose' : 'doses'}`,
          value: cnt
        }));
        this.statusList = this.toOptions(sourcedData.map((item) => item.status));
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

  // Client-side paging over the filtered list.
  showPage(pageNo: number) {
    let { pageSize } = this.pageNators();
    let totalPages = Math.max(1, Math.ceil(this.filteredData.length / pageSize));
    let page = Math.min(Math.max(1, pageNo), totalPages);
    this.vaccineGrid = this.filteredData.slice((page - 1) * pageSize, page * pageSize);
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
