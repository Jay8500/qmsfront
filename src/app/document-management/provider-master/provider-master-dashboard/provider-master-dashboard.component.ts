import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../layout/header/header.component';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CategoryReportsComponent } from '../../../components/category-reports/category-reports.component';
import { StatusReportComponent } from '../../../components/status-report/status-report.component';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';

interface providerTable {
  id: number;
  provider_id: any;
  provider_name: any;
  provider_type: any;
  status: any;
}

export type SortColumn = keyof providerTable | '';
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
  selector: 'app-provider-master-dashboard',
  imports: [NgApexchartsModule, CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './provider-master-dashboard.component.html',
  styleUrl: './provider-master-dashboard.component.scss',
})
export class ProviderMasterDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    provider_name: null,
    provider_type: null,
    status: null,
  });
  public providersFilters = signal({ ...JSON.parse(this.intialFilters) });
  public providersList: any = [];
  public providersTypeList: any = [];
  public statusList: any = [];
  public router = inject(Router);
  public providerInfo: any = [];
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  public copyData: any = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.getProviderGrid();
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
      this.providerInfo = this.providerInfo;
    } else {
      this.providerInfo = [...this.providerInfo].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }
  public params: any = {};
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  async getProviderGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.providerInfo = [];
      let sourcedData: any = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let prvdrsInfo: any = await this._hqms.customGetApiCall('GET', 'fnProviderApi',
        flags);
      if (prvdrsInfo.status == 200) {
        totalCnt = prvdrsInfo.data[0]['total_row_cnt'];
        prvdrsInfo.data.forEach((gridCls: any, index: number) => {
          let prvdrs: any = {
            id: index + 1,
            provider_id: gridCls.provider_id,
            provider_name: gridCls.provider_name,
            description: gridCls.description,
            provider_type_id: gridCls.provider_type_id,
            provider_type: gridCls.provider_type,
            contact_person: gridCls.contact_person,
            mobile_no1: gridCls.mobile_no1,
            mobile_no2: gridCls.mobile_no2,
            email_id: gridCls.email_id,
            web_url: gridCls.web_url,
            status: gridCls.status,
            address: gridCls.address,
            created_by: gridCls.created_by,
            created_at: gridCls.created_at,
            updated_by: gridCls.updated_by,
            updated_at: gridCls.updated_at,
          };
          sourcedData.push(prvdrs);
        });
        this.providerInfo = [...sourcedData];
        this.copyData = [...sourcedData];

        this.providersList = [...new Set(sourcedData.map((item: any) => item.provider_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.providersTypeList = [...new Set(sourcedData.map((item: any) => item.provider_type))].map((name, index) => ({
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

  onFilterClick() {
    let filters = this.providersFilters();
    this.providerInfo = this.copyData.filter((fl: any) => {
      let provider_name = !filters.provider_name || fl['provider_name'] ===
        filters.provider_name;
      let provider_type = !filters.provider_type || fl['provider_type'] === filters.provider_type;
      let status = !filters.status || fl['status'] === filters.status;
      return provider_name && provider_type && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.providersFilters.set(JSON.parse(this.intialFilters));
      this.providerInfo = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, prvdrs: any) {
    try {
      this.router.navigate(
        [
          '/provider-master-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: prvdrs == null ? null : prvdrs.provider_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(prvdrs: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${prvdrs.provider_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "provider_id": prvdrs.provider_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnProviderApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Provider',
          detail: saveResult.message,
        });
        // this.providersList = [...this.copyData.filter((fl: any) => fl.provider_id != prvdrs.provider_id)];
        this.providerInfo.forEach((ele: any) => {
          if (ele.provider_id == prvdrs.provider_id) {
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
    await this.getProviderGrid();
  }

}

