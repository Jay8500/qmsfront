import { HeaderComponent } from '../../../layout/header/header.component';
import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, signal, inject, computed, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
export type SortColumn = '';//keyof auditTable |
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
  selector: 'app-clinical-dashboard',
  imports: [ComparisonBarchartComponent, CommonModule, NgbdSortableHeader, ScoreWiseReportsComponent
    , SelectModule, FormsModule, SharedModule],
  templateUrl: './clinical-dashboard.component.html',
  styleUrl: './clinical-dashboard.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClinicalDashboardComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
  @ViewChild('rCCRpt') rCCRpt !: ComparisonBarchartComponent;
  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    cp_type: null,
    consultant: null,
    department: null,
    status: null
  });
  public adtFilters = signal(JSON.parse(this.intialFilters));
  public cpTypeList: any = [];
  public consultantList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  public statusList: any = [];
  public departmentList: any = [];
  public clincaiGrid: any = [];
  public copyData: any = [];
  public params: any = {}
  showFilter = false;
  selectedRange: string = 'Last 30 days';

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.depWiseChartsRpts();
      await this.recentComplianceRpts();
      await this.nonComplianceRpts();
    } catch (e) {  }
  }

  onSort({ column, direction }: SortEvent) {
    // // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      };
    };
    // sorting countries
    if (direction === '' || column === '') {
      this.clincaiGrid = this.clincaiGrid;
    } else {
      this.clincaiGrid = [...this.clincaiGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  getComplianceClass(compliance: any): any {
    if (compliance > 0) {
      // const value = parseInt(compliance.replace('%', ''), 10);
      if (compliance < 45) {
        return 'text-danger';   // red
      } else if (compliance >= 45 && compliance < 75) {
        return 'text-warning';  // orange
      } else {
        return 'text-success';  // green
      }
    }
  }

  public date_range: any = null;
  async setRange(value: string) {
    try {
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
      await this.getCDStats();
      await this.getClinicalDsbrdGrid();
    } catch (e) {
    }
  }

  public initailStats = JSON.stringify({
    clinical_pathway_audits_count: 0,
    overall_drafts_count: 0,
    overall_submitted_count: 0,
    overall_compliance_percentage: 0,
    clinical_pathway_audits_last_updated: null,
    overall_drafts_last_updated: null,
    overall_submitted_last_updated: null,
    overall_compliance_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getCDStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnCpDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (statInfo.status == 200) {
        this.stats.set({
          clinical_pathway_audits_count: statInfo['data'].clinical_pathway_audits_count,
          overall_drafts_count: statInfo['data'].overall_drafts_count,
          overall_submitted_count: statInfo['data'].overall_submitted_count,
          overall_compliance_percentage: statInfo['data'].overall_compliance_percentage,
          clinical_pathway_audits_last_updated: statInfo['data'].clinical_pathway_audits_last_updated,
          overall_drafts_last_updated: statInfo['data'].overall_drafts_last_updated,
          overall_submitted_last_updated: statInfo['data'].overall_submitted_last_updated,
          overall_compliance_last_updated: statInfo['data'].overall_compliance_last_updated
        })
      };
    } catch (e) {
    };
  }

  async depWiseChartsRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnCpDashboardApi',
        {
          "flag": "CP"
        });
      if (adChrt.status == 200) {
        this.scoreWiseRpt.plotData(adChrt['data'], 'pie')
      }
    } catch (e) {
    }
  }

  async recentComplianceRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnCpDashboardApi',
        {
          "flag": "RCC"
        });
      if (adChrt.status == 200) {
        let crtDtaSt: any = {
          "labels": [],
          "series": [],
          "chartNames": ['Compliance','Non-compliance']
        };
        let allMonths = [...Object.keys(adChrt['data']['NON_COMPLIANCE '] || {}),
        ...Object.keys(adChrt['data']['COMPLIANCE'] || {})
        ];
        let labels = Array.from(new Set(allMonths));
          if (Object.keys(adChrt['data']['COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => adChrt['data'].COMPLIANCE[mnth] || 0)
            });
        };
        if (Object.keys(adChrt['data']['NON_COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Non-compliance",
              data: labels.map(mnth => adChrt['data'].NON_COMPLIANCE[mnth] || 0)
            }
          );
        };

        crtDtaSt['labels'] = labels;
        this.rCCRpt.plotData(crtDtaSt, 'pie')
      }
    } catch (e) {
    }
  }

  public nonComplianceAudits: any = [];
  async nonComplianceRpts() {
    try {
      this.nonComplianceAudits = [];
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnCpDashboardApi',
        {
          "flag": "NC"
        });
      if (adChrt.status == 200) {
        this.nonComplianceAudits = adChrt.data
      }
    } catch (e) {
    }
  }

  async getClinicalDsbrdGrid() {
    this.clincaiGrid = [];
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
      this.clincaiGrid = [];
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
        // "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        // "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      };
      this.params = {...flags}
      let info: any = await this._hqms.customGetApiCall('GET', 'fnCpAuditApi',
        flags);
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((prpty: any, index: number) => {
          let adts: any = {
            "id": index + 1,
            "cp_audit_id": prpty.cp_audit_id,
            "doa": prpty.doa_name,
            "dod": prpty.dod_name,
            "dos": prpty.dos_name,
            "status": prpty.status,
            "cp_type": prpty.cp_type_name,
            "patient_name": prpty.patient_name,
            "displayCol": prpty.compliance,
            "compliance": prpty.compliance > 0 ? `${prpty.compliance} %` : null,
            "consultant": prpty.consultant_name,
            "department": prpty.department_name,
            "created_by": prpty.created_by,
            "created_at": prpty.created_at,
            "updated_by": prpty.updated_by,
            "updated_at": prpty.updated_at,
          };
          sourcedData.push(adts);
        });
        this.clincaiGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.cpTypeList = [...new Set(sourcedData.map((item: any) =>
          item.cp_type))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.departmentList = [...new Set(sourcedData.map((item: any) =>
          item.department))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.consultantList = [...new Set(sourcedData.map((item: any) =>
          item.consultant))].map((name, index) => ({
            label: name,
            value: name
          }));

        this.statusList = [...new Set(sourcedData.map((item: any) =>
          item.status))].map((name, index) => ({
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


  onFilterClick() {
    let filters = this.adtFilters();
    this.clincaiGrid = this.copyData.filter((fl: any) => {
      let cp_type = !filters.cp_type ||
        fl['cp_type'] === filters.cp_type;
      let consultant = !filters.consultant ||
        fl['consultant'] === filters.consultant;
      let department = !filters.department || fl['department'] ===
        filters.department;

      let status = !filters.status || fl['status'] === filters.status;
      return cp_type && consultant && department &&  status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.adtFilters.set(JSON.parse(this.intialFilters));
      this.clincaiGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, ctrl: any) {
    try {
      this.router.navigate(
        [
         this.assignRoute(pageMode)
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: ctrl == null ? null : ctrl.cp_audit_id
            }
          }
        },
      );
    } catch (e) { };
  }

  assignRoute(ctrl){
   let route = "";
    switch(ctrl){
      case "VIEW":
       route =  '/clinical-details';
      break;
      case "EDIT":
      case "NEW":
        route =  '/new-audit';
       break;
      case "WRITECAPA":
        route =  '/clinical-capa';
       break;
      case "REVIEWCAPA":
        route = '/clinical-capa-review';
       break;
    };
    return route;
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
    await this.getClinicalDsbrdGrid();
  }
}
