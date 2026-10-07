import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';

interface licenseMasterTable {
  id: number;
  license_master_id: any;
  license_name: any;
  description: any,
  category_name: any,
  category_type_id: any,
  renewal_frequency_months: any
  license_criteria: any,
  status: any;
}

export type SortColumn = keyof licenseMasterTable | '';
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
  selector: 'app-lincense-master-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './lincense-master-dashboard.component.html',
  styleUrl: './lincense-master-dashboard.component.scss',
})
export class LincenseMasterDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    license_name: null,
    category_name: null,
    renewal_frequency_months: null,
    status: null,
  });
  public licenseMasterFilters = signal({ ...JSON.parse(this.intialFilters) });
  public licenseNameList: any = [];
  public categoryTypeList: any = [];
  public renewalFrqList: any = [];
  public statusList: any = [];
  public licenseMasterGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      await this.getLicenseMasterGrid();
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
      this.licenseMasterGrid = this.licenseMasterGrid;
    } else {
      this.licenseMasterGrid = [...this.licenseMasterGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};
  
  async getLicenseMasterGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.licenseMasterGrid = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let getLicenseMasterList: any = await this._hqms.customGetApiCall('GET', 'fnLicenseMasterApi',
        flags);
      if (getLicenseMasterList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getLicenseMasterList.data[0]['total_row_cnt'];
        getLicenseMasterList.data.forEach((licenseMasters: any, index: number) => {
          let createLicenseMaster: any = {
            id: index + 1,
            license_master_id: licenseMasters.license_master_id,
            license_name: licenseMasters.license_name,
            category_name: licenseMasters.category_name,
            category_type_id: licenseMasters.category_type_id,
            renewal_frequency_months: licenseMasters.renewal_frequency_months,
            description: licenseMasters.description,
            license_criteria: licenseMasters.license_criteria,
            created_by: licenseMasters.created_by,
            created_at: licenseMasters.created_at,
            updated_by: licenseMasters.updated_by,
            updated_at: licenseMasters.updated_at,
            status: licenseMasters.status,
          };
          sourcedData.push(createLicenseMaster);
        });
        this.licenseMasterGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.licenseNameList = [...new Set(sourcedData.map((item: any) => item.license_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.categoryTypeList = [...new Set(sourcedData.map((item: any) => item.category_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.renewalFrqList = [...new Set(sourcedData.map((item: any) => item.renewal_frequency_months))].map((name, index) => ({
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
    let filters = this.licenseMasterFilters();
    this.licenseMasterGrid = this.copyData.filter((fl: any) => {
      let license_name = !filters.license_name || fl['license_name'] === filters.license_name;
      let category_name = !filters.category_name || fl['category_name'] === filters.category_name;
      let renewal_frequency_months = !filters.renewal_frequency_months || fl['renewal_frequency_months'] === filters.renewal_frequency_months;
      let status = !filters.status || fl['status'] === filters.status;
      return license_name && category_name && renewal_frequency_months && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.licenseMasterFilters.set(JSON.parse(this.intialFilters));
      this.licenseMasterGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, licenseMaster: any) {
    try {
      this.router.navigate(
        [
          '/license-master-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: licenseMaster == null ? null : licenseMaster.license_master_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(licenseMaster: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${licenseMaster.license_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "license_master_id": licenseMaster.license_master_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLicenseMasterApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'License Master',
          detail: saveResult.message,
        });
        this.licenseMasterGrid.forEach((ele: any) => {
          if (ele.license_master_id == licenseMaster.license_master_id) {
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
    await this.licenseMasterGrid();
  }

}

