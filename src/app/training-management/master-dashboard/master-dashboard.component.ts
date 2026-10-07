import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
// import { BlockuiComponent } from '../../components/blockui/blockui.component';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface trainingsTable {
  id: number;
  training_id: any;
  training_name: string;
  description: string;
  faculty_type_name: string;
  faculty_name: string;
  mode_of_training_name: string;
  designation_name: string;
  created_at: any;
  modified_at: any;
  status: string;
};
export type SortColumn = keyof trainingsTable | '';
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
  selector: 'app-master-dashboard',
  imports: [RouterLink, CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],//BlockuiComponent
  templateUrl: './master-dashboard.component.html',
  styleUrl: './master-dashboard.component.scss',
})
export class MasterDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    training_name: null,
    faculty_type_name: null,
    faculty_name: null,
    designation_name: null,
    status: null
  });
  public trainingFilters = signal(JSON.parse(this.intialFilters));
  public trainingNameList: any = [];
  public facultyTypeList: any = [];
  public facultyNameList: any = [];
  public specializationList: any = [];
  public statusList: any = [];
  public trainingGrid: trainingsTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getTrainingGrid();
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
      this.trainingGrid = this.trainingGrid;
    } else {
      this.trainingGrid = [...this.trainingGrid].sort((a, b) => {
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
    await this.getTrainingStats();
    await this.getTrainingGrid();
  }

  public initailStats = JSON.stringify({
    no_of_training: 0,
    no_of_faculty: 0,
    internal_faculty: 0,
    external_faculty: 0,
    no_of_training_last_updated: null,
    no_of_faculty_last_updated: null,
    internal_faculty_last_updated: null,
    external_faculty_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getTrainingStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.trainingGrid = [];
      let statsParam = {
        "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'trainingDashboardStats', statsParam);
      if (statInfo.status == 200) {
        this.stats.set({
          no_of_training: statInfo['data'][0].no_of_training,
          no_of_faculty: statInfo['data'][0].no_of_faculty,
          internal_faculty: statInfo['data'][0].no_of_internal_faculty,
          external_faculty: statInfo['data'][0].no_of_external_faculty,
          no_of_training_last_updated: statInfo['data'][0].training_last_updated,
          no_of_faculty_last_updated: statInfo['data'][0].faculty_last_updated,
          internal_faculty_last_updated: statInfo['data'][0].internal_faculty_last_updated,
          external_faculty_last_updated: statInfo['data'][0].external_faculty_last_updated
        })
      };
    } catch (e) {
    };
  }


  onFilterClick() {
    let filters = this.trainingFilters();
    this.trainingGrid = this.copyData.filter((fl: any) => {
      let matchName = !filters.training_name || fl['training_name'] === filters.training_name;
      let faculty_name = !filters.faculty_name || fl['faculty_name'] === filters.faculty_name;
      let faculty_type_name = !filters.faculty_type_name || fl['faculty_type_name'] === filters.faculty_type_name;
      let designation_name = !filters.designation_name || fl['designation_name'] === filters.designation_name;
      let status = !filters.status || fl['status'] === filters.status;
      return matchName && faculty_name && faculty_type_name && designation_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.trainingFilters.set(JSON.parse(this.intialFilters));
      this.trainingGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, training: any) {
    try {
      this.router.navigate(
        [
          '/training-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: training == null ? null : training.training_id
            }
          }
        },
      );
    } catch (e) {
      console.log("   de",e)
     };
  }

  async onDelete(training: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${training.training_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "training_id": training.training_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "trainingWriteApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Training',
          detail: saveResult.message,
        });
        // this.trainingGrid = [...this.copyData.filter((fl: any) => fl.training_id != training.training_id)];
        this.trainingGrid.forEach((ele: any) => {
          if (ele.training_id == training.training_id) {
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
  public params: any = {};
  async getTrainingGrid() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let totalCnt = 0;
      let { pageNo, pageSize } = this.pageNators();
      this.trainingGrid = [];
      let getTraningsList: any = await this._hqms.customGetApiCall('GET', 'trainingWriteApi',
        {
          "page_no": pageNo,
          "page_size": pageSize,
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getTraningsList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getTraningsList.data[0]['total_row_cnt'];
        getTraningsList.data.forEach((trainings: any, index: number) => {
          let createTrainings: any = {
            id: index + 1,
            training_id: trainings.training_id,
            training_name: trainings.training_name,
            description: trainings.description,
            faculty_type_name: trainings.faculty_type_name,
            faculty_name: trainings.faculty_name,
            mode_of_training_name: trainings.mode_of_training_name,
            designation_name: trainings.designation_name,
            created_by: trainings.created_by,
            created_at: trainings.created_at,
            updated_by: trainings.updated_by,
            updated_at: trainings.updated_at,
            status: trainings.status
          };
          sourcedData.push(createTrainings);
        });
        this.trainingGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.trainingNameList = [...new Set(sourcedData.map((item: any) => item.training_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyTypeList = [...new Set(sourcedData.map((item: any) => item.faculty_type_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyNameList = [...new Set(sourcedData.map((item: any) => item.faculty_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.specializationList = [...new Set(sourcedData.map((item: any) => item.designation_name))].map((name, index) => ({
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
    await this.getTrainingGrid();
  }
}
