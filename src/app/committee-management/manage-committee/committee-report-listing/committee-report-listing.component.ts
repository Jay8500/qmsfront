import { Component, Directive, signal, computed, EventEmitter, OnInit, ViewChildren, QueryList, inject, Input, Output } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import {Validations} from '../../../validations'
interface CommitteeReport {
  id: number;
  committee_id: any;
  committee_name: any;
  committee_type_id: any;
  committee_type_name: any;
  meeting_id: any;
  meeting_name: any;
  chair_person_name: any;
  co_ordinator_name: any;
  meeting_date: any;
  from_dt: any;
  to_dt: any;
}
export type SortColumn = keyof CommitteeReport | '';
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
  selector: 'app-committee-report-listing',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],//BlockuiComponent
  templateUrl: './committee-report-listing.component.html'
})
export class CommitteeReportListingComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  public router = inject(Router);
  public FORM_NAME = 'COMMITTEERPT'
  public validation=inject(Validations)
  public committeeTypeList: any = [];
  public committeeNameList: any = [];
  public meetingNameList: any = [];
  public reportParams: any = signal({
    "committee_id": null,
    "committee_name": null,
    "committee_type_id": null,
    "committee_type_name": null,
    "meeting_id": null,
    "meeting_name": null,
    "from_dt": null,
    "to_dt": null,
  });
  public committeeList: any = [];
  public errMsg:any={
    from_dt:'',
    to_dt:'',
    committee_id:'',
    meeting_name:'',
    committee_name:'',
    committee_type_id:'',
    committee_type_name:'',
  }
  onGetErrMsg(ctrl:any){
    let res=this.validation.validateField(
        this.FORM_NAME,ctrl,this.reportParams()[ctrl]
    )
    this.errMsg[ctrl]=res?.message || ''
}
  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  goBack(): void {
    this.location.back();
  }

  getFormattedSNo(id: number): string {
    return id.toString().padStart(2, '');
  }

  async ngOnInit() {
    try {
      //Committee Type
      let getCommitteeTypeList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "COMMITTEETYPE" });
      if (getCommitteeTypeList.status == 200) {
        this.committeeTypeList = getCommitteeTypeList.data.entities.COMMITTEETYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }))
      };

      //Committee Name
      let getCommitteeNameList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "COMMITTEE" });
      if (getCommitteeNameList.status == 200) {
        this.committeeNameList = getCommitteeNameList.data.map((ele: any) => ({
          label: ele.committee_name,
          value: ele.committee_id
        }))
      };

      //Meeting Name
      let getMeetingNameList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "MEETING" });
      if (getMeetingNameList.status == 200) {
        this.meetingNameList = getMeetingNameList.data.map((ele: any) => ({
          label: ele.meeting_name,
          value: ele.meeting_id
        }))
      };
    } catch (e) { };
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
      this.committeeList = this.committeeList;
    } else {
      this.committeeList = [...this.committeeList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  onFilterChange() {
    this.committeeList = [];
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
  async getCommittee() {
    try {
      let getFilters = this.reportParams();
      if (
        getFilters['committee_type_id'] == null &&
        getFilters['committee_id'] == null &&
        getFilters['meeting_id'] == null &&
        getFilters['from_dt'] == null &&
        getFilters['to_dt'] == null
      ) {
        this._hqms.hqmsToasterService({
          severity: 'error',
          summary: 'Committee Report',
          detail: 'Atleast apply a filter'
        });
        return;
      }
      Object.keys(this.errMsg).forEach((ctrl)=>{this.onGetErrMsg(ctrl)});
      let isValid=this._hqms.showErrorSummary(this.errMsg);
      if (isValid) {
          this._hqms.hqmsToasterService({
          key: 'prem',
           severity: 'warn',
                summary: 'oppe doctors',
                detail: 'Check the errors',
              });
              return;
            };
      let { pageNo, pageSize } = this.pageNators();
      this.committeeList = [];
      let totalCnt = 0;
      let flages: any = {
        "committee_type_id": this.reportParams().committee_type_id,
        "committee_type_name": this.reportParams().committee_type_name,
        "committee_id": this.reportParams().committee_id,
        "committee_name": this.reportParams().committee_name,
        "meeting_id": this.reportParams().meeting_id,
        "meeting_name": this.reportParams().meeting_name,
        "from_dt": this._datePipe.transform(this.reportParams().from_dt, 'dd-MMM-yyyy'),
        "to_dt": this._datePipe.transform(this.reportParams().to_dt, 'dd-MMM-yyyy'),
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeReportsApi',
        flages
      );
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((item: any, index: number) => {
          let createCommittee: any = {
            id: index + 1,
            committee_id: item.committee_id,
            committee_name: item.committee_name,
            committee_type_id: item.committee_type_id,
            committee_type_name: item.committee_type_name,
            meeting_id: item.meeting_id,
            meeting_name: item.meeting_name,
            chair_person_name: item.chair_person_name,
            co_ordinator_name: item.co_ordinator_name,
            meeting_date: item.meeting_date
          };
          sourcedData.push(createCommittee);
        });
        this.committeeList = [...sourcedData];
        this.pageNators.update(current => ({
          ...current,
          totalItems: info.data.length,
          totalPages: Math.ceil(totalCnt)
        }));
      } else {
        this._hqms.hqmsToasterService({
          severity: 'error',
          summary: 'Committee Report',
          detail: info.message
        });
      }
    } catch (e) { };
  }

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getCommittee();
  }

  onPageRoute(pageMode: string, committeeCtrl: any) {
    try {
      this.router.navigate(
        ['/committee-report-details'],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: committeeCtrl == null ? null : committeeCtrl.committee_id
            }
          }
        },
      );
    } catch (e) { };
  }

  onClear() {
    this.reportParams.set({
      "committee_id": null,
      "committee_name": null,
      "committee_type_id": null,
      "committee_type_name": null,
      "meeting_id": null,
      "meeting_name": null,
      "from_dt": null,
      "to_dt": null,
    });
    this.committeeList = [];
  }
}
