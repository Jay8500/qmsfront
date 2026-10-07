import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';

interface categoryMasterTable {
  id: number;
  category_id: any;
  category_name: any;
  description: any,
  catgegory_short_code: any,
  category_type_id: any,
  status: any;
}

export type SortColumn = keyof categoryMasterTable | '';
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
  selector: 'app-category-master-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './category-master-dashboard.component.html',
})
export class CategoryMasterDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    category_name: null,
    catgegory_short_code: null,
    status: null,
  });
  public categoryMasterFilters = signal({ ...JSON.parse(this.intialFilters) });
  public licenseNameList: any = [];
  public categoryTypeList: any = [];
  public statusList: any = [];
  public categoryMasterGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      await this.getCategoryMasterGrid();
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
      this.categoryMasterGrid = this.categoryMasterGrid;
    } else {
      this.categoryMasterGrid = [...this.categoryMasterGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};
  async getCategoryMasterGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.categoryMasterGrid = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let getCategoryMasterList: any = await this._hqms.customGetApiCall('GET', 'fnKpiCategoryApi',
        flags);
      if (getCategoryMasterList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getCategoryMasterList.data[0]['total_row_cnt'];
        getCategoryMasterList.data.forEach((categoryMasters: any, index: number) => {
          let createCategoryMaster: any = {
            id: index + 1,
            category_id: categoryMasters.category_id,
            category_name: categoryMasters.category_name,
            catgegory_short_code: categoryMasters.catgegory_short_code,
            category_type_id: categoryMasters.category_type_id,
            description: categoryMasters.description,
            created_by: categoryMasters.created_by,
            created_at: categoryMasters.created_at,
            updated_by: categoryMasters.updated_by,
            updated_at: categoryMasters.updated_at,
            status: categoryMasters.status,
          };
          sourcedData.push(createCategoryMaster);
        });
        this.categoryMasterGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.licenseNameList = [...new Set(sourcedData.map((item: any) => item.category_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.categoryTypeList = [...new Set(sourcedData.map((item: any) => item.catgegory_short_code))].map((name, index) => ({
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
    let filters = this.categoryMasterFilters();
    this.categoryMasterGrid = this.copyData.filter((fl: any) => {
      let category_name = !filters.category_name || fl['category_name'] === filters.category_name;
      let catgegory_short_code = !filters.catgegory_short_code || fl['catgegory_short_code'] === filters.catgegory_short_code;
      let status = !filters.status || fl['status'] === filters.status;
      return category_name && catgegory_short_code && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.categoryMasterFilters.set(JSON.parse(this.intialFilters));
      this.categoryMasterGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, categoryMasterr: any) {
    try {
      this.router.navigate(
        [
          '/category-master-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: categoryMasterr == null ? null : categoryMasterr.category_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(categoryMasterr: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${categoryMasterr.category_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "category_id": categoryMasterr.category_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnKpiCategoryApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Category Master',
          detail: saveResult.message,
        });
        this.categoryMasterGrid.forEach((ele: any) => {
          if (ele.category_id == categoryMasterr.category_id) {
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
    await this.categoryMasterGrid();
  }
}
