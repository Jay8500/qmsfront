import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { DatePipe } from '@angular/common';

interface locationTable {
  id: number;
  loc_id: any,
  // org_id: any,
  location_name: any,
  contact_person: any,
  email_id: any,
  office_phone: any,
  mobile_phone: any,
  address1: any,
  address2: any,
  state_name: any,
  country_name: any,
  fax_number: any,
  website_url: any,
  city_name: any,
  area_name: any,
  status: any,
  is_approved_loc: any
}

export type SortColumn = keyof locationTable | '';
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
  selector: 'app-locationgrid',
  imports: [NgApexchartsModule, CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './locationgrid.component.html',
})
export class LocationgridComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    location_name: null,
    contact_person: null,
    status: null,
  });
  public locFilters = signal({ ...JSON.parse(this.intialFilters) });
  public locList: any = [];
  public contactPersonList: any = [];
  public statusList: any = [];
  public router = inject(Router);
  public locInfo: any = [];
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  public copyData: any = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.getLocGrid();
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
      this.locInfo = this.locInfo;
    } else {
      this.locInfo = [...this.locInfo].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }
  public params: any = {};
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  async getLocGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.locInfo = [];
      let sourcedData: any = [];
      let totalCnt = 0;
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
      };
      this.params = { ...flags }
      let oInfo: any = await this._hqms.customGetApiCall('GET', 'fnLocApi', flags);
      if (oInfo.status == 200) {
        totalCnt = oInfo.data[0]['total_row_cnt'];
        oInfo.data.forEach((gridCls: any, index: number) => {
          let locs: any = {
            id: index + 1,
            "loc_id": gridCls.loc_id,
            // "org_id": gridCls.org_id,
            "location_name": gridCls.location_name,
            "contact_person": gridCls.contact_person,
            "email_id": gridCls.email_id,
            "office_phone": gridCls.office_phone,
            "mobile_phone": gridCls.mobile_phone,
            "address1": gridCls.address1,
            "address2": gridCls.address2,
            "state_name": gridCls.state_name,
            "country_name": gridCls.country_name,
            "fax_number": gridCls.fax_number,
            "website_url": gridCls.website_url,
            "city_name": gridCls.city_name,
            'area_name': gridCls.area_name,
            "status": gridCls.status,
            "is_approved_loc": gridCls.is_approved_loc,
          };
          sourcedData.push(locs);
        });
        this.locInfo = [...sourcedData];
        this.copyData = [...sourcedData];
        this.locList = [...new Set(sourcedData.map((item: any) => item.location_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.contactPersonList = [...new Set(sourcedData.map((item: any) => item.contact_person))].map((name, index) => ({
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
    let filters = this.locFilters();
    this.locInfo = this.copyData.filter((fl: any) => {
      let location_name = !filters.location_name || fl['location_name'] === filters.location_name;
      let contact_person = !filters.contact_person || fl['contact_person'] === filters.contact_person;
      let status = !filters.status || fl['status'] === filters.status;
      return location_name && contact_person && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.locFilters.set(JSON.parse(this.intialFilters));
      this.locInfo = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, locs: any) {
    try {
      this.router.navigate(
        [
          '/location',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: locs == null ? null : locs.loc_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(locs: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${locs.location_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "loc_id": locs.loc_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLocApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Location',
          detail: saveResult.message,
        });
        // this.locList = [...this.copyData.filter((fl: any) => fl.loc_id != locs.loc_id)];
        this.locInfo.forEach((ele: any) => {
          if (ele.loc_id == locs.loc_id) {
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
    await this.getLocGrid();
  }

  async onClickApprove(locs: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm Approve ${locs.location_name}`);
    if (confirm) {
      let savePayload = {
        action: "A",
        "loc_id": locs.loc_id,
        // "org_id": locs.org_id,
        "is_active": true
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLocApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Location Approved',
          detail: saveResult.message,
        });
        this.locInfo.forEach((ele: any) => {
          if (ele.loc_id == locs.loc_id) {
            ele['status'] = 'Active';
            ele['is_approved_loc'] = 'Approved';
          };
        });
      };
    };
  }
}



