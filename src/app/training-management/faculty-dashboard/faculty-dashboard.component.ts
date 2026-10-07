import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface facultyTable {
  id: number;
  faculty_id: any;
  faculty_type_id: any;
  faculty_type_name: any;
  faculty_name: any;
  designation_name: any;
  created_at: any;
  updated_at: any;
  status: string;
};
export type SortColumn = keyof facultyTable | '';
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
  selector: 'app-faculty-dashboard',
  imports: [RouterLink, CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.scss'
})
export class FacultyDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    faculty_type_name: null,
    faculty_name: null,
    designation_name: null,
    status: null,
  });
  public facultyFilters = signal(JSON.parse(this.intialFilters));
  public facultyTypeList: any = [];
  public facultyNameList: any = [];
  public facultyDesigList: any = [];
  public statusList: any = [];
  public facultyGrid: facultyTable[] = [];
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
      await this.getFacultyGrid();
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    //resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    //sorting data
    if (direction === '' || column === '') {
      this.facultyGrid = this.facultyGrid;
    } else {
      this.facultyGrid = [...this.facultyGrid].sort((a, b) => {
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
    await this.getFacultyStats();
  }

  public initailStats = JSON.stringify({
    no_of_training: 0,
    no_of_faculty: 0,
    training_duration: 0,
    avg_training_per_faculty: 0,
    no_of_training_last_updated: null,
    no_of_faculty_last_updated: null,
    training_duration_last_updated: null,
    avg_training_per_faculty_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getFacultyStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.facultyGrid = [];
      let getFacultyStatsInfo: any = await this._hqms.customGetApiCall('GET', 'facultyDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getFacultyStatsInfo.status == 200) {
        getFacultyStatsInfo = getFacultyStatsInfo['data'][0];
        this.stats.set({
          no_of_training: getFacultyStatsInfo.No_of_Training,
          no_of_faculty: getFacultyStatsInfo.No_of_faculty,
          training_duration: getFacultyStatsInfo.Training_Duration,
          avg_training_per_faculty: getFacultyStatsInfo.Avg_Training_Per_Faculty,
          no_of_training_last_updated: getFacultyStatsInfo.Training_last_updated,
          no_of_faculty_last_updated: getFacultyStatsInfo.Faculty_last_updated,
          training_duration_last_updated: getFacultyStatsInfo.Training_Duration_last_updated,
          avg_training_per_faculty_last_updated: getFacultyStatsInfo.Avg_Training_Per_Faculty_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};
  async getFacultyGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.facultyGrid = [];
      let totalCnt = 0;
      let flag = {
        "is_faculty": true,
        "page_no": pageNo,
        "page_size": pageSize,
      }
      this.params = flag
      let getFacultyList: any = await this._hqms.customGetApiCall('GET', 'fnFacultyGetApi',
        flag);
      if (getFacultyList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getFacultyList.data[0]['total_row_cnt'];
        getFacultyList.data.forEach((facPrp: any, index: number) => {
          let createFaculty: any = {
            id: index + 1,
            faculty_id: facPrp.id,
            faculty_type_id: facPrp.faculty_type_id,
            faculty_type_name: facPrp.faculty_type,
            faculty_name: facPrp.name,
            designation_name: facPrp.designation_name,
            created_by: facPrp.created_by,
            created_at: facPrp.created_at,
            updated_by: facPrp.updated_by,
            updated_at: facPrp.updated_at,
            status: facPrp.status,
          };
          sourcedData.push(createFaculty);
        });
        this.facultyGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.facultyTypeList = [...new Set(sourcedData.map((item: any) => item.faculty_type_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyNameList = [...new Set(sourcedData.map((item: any) => item.faculty_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyDesigList = [...new Set(sourcedData.map((item: any) => item.designation_name))].map((name, index) => ({
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
    let filters = this.facultyFilters();
    this.facultyGrid = this.copyData.filter((fl: any) => {
      let faculty_type_name = !filters.faculty_type_name || fl['faculty_type_name'] === filters.faculty_type_name;
      let designation_name = !filters.designation_name || fl['designation_name'] === filters.designation_name;
      let faculty_name = !filters.faculty_name || fl['faculty_name'] === filters.faculty_name;
      let status = !filters.status || fl['status'] === filters.status;
      return faculty_type_name && designation_name && faculty_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.facultyFilters.set(JSON.parse(this.intialFilters));
      this.facultyGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, facultyProp: any) {
    try {
      // if (facultyProp != null) {
      //   if (facultyProp['status'] == 'Inactive') {
      //     this._hqms.hqmsToasterService({
      //       severity: 'success',
      //       summary: 'Faculty',
      //       detail: 'Inactive record not for edit',
      //     });
      //     return;
      //   };
      // };
      this.router.navigate(
        [
          '/faculty-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: facultyProp == null ? null : facultyProp.faculty_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(facultyProp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${facultyProp.faculty_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "faculty_id": facultyProp.faculty_id,
        "faculty_type_id": facultyProp.faculty_type_id,
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "facultyWriteApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Faculty',
          detail: saveResult.message,
        });
        // this.facultyGrid = [...this.copyData.filter((fl: any) => fl.faculty_id != facultyProp.faculty_id)];
        this.facultyGrid.forEach((ele: any) => {
          if (ele.faculty_id == facultyProp.faculty_id) {
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
    await this.getFacultyGrid();
  }
}
