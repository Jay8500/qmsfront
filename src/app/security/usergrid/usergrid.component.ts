import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
interface userTable {
  id: number;
  user_id: any;
  user_name: any;
  designation_name: any,
  department_name: any,
  email_id: any,
  mobile_phone: any,
  address1: any,
  status: any;
}

export type SortColumn = keyof userTable | '';
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
  selector: 'app-usergrid',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './usergrid.component.html',
})
export class UsergridComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    user_name: null,
    designation_name: null,
    department_name: null,
    status: null,
  });
  public userFilters = signal({ ...JSON.parse(this.intialFilters) });
  public userNameList: any = [];
  public designationList: any = [];
  public deptList: any = [];
  public statusList: any = [];
  public userGrid: any = [];
  public router = inject(Router);
  public selectedContent:any = null;
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      await this.getNewUserGrid();
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
      this.userGrid = this.userGrid;
    } else {
      this.userGrid = [...this.userGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};

  async getNewUserGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.userGrid = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let getNewUserList: any = await this._hqms.customGetApiCall('GET', 'fnUserApi',
        flags);
      if (getNewUserList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getNewUserList.data[0]['total_row_cnt'];
        getNewUserList.data.forEach((newUserr: any, index: number) => {
          let createNewUser: any = {
            id: index + 1,
            user_id: newUserr.user_id,
            user_name: newUserr.user_name,
            designation_name: newUserr.designation_name,
            department_name: newUserr.department_name,
            email_id: newUserr.email_id,
            mobile_phone: newUserr.mobile_phone,
            address1: (newUserr.address1||''),
            created_by: newUserr.created_by,
            created_at: newUserr.created_at,
            updated_by: newUserr.updated_by,
            updated_at: newUserr.updated_at,
            status: newUserr.status,
            user_role: newUserr.user_role.map((ele) => ({ location_name : ele.location_name, role_name : ele.role_name }) ),
          };
          sourcedData.push(createNewUser);
        });
        this.userGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.userNameList = [...new Set(sourcedData.map((item: any) => item.user_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.designationList = [...new Set(sourcedData.map((item: any) => item.designation_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.deptList = [...new Set(sourcedData.map((item: any) => item.department_name))].map((name, index) => ({
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
    let filters = this.userFilters();
    this.userGrid = this.copyData.filter((fl: any) => {
      let user_name = !filters.user_name || fl['user_name'] === filters.user_name;
      let designation_name = !filters.designation_name || fl['designation_name'] === filters.designation_name;
      let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
      let status = !filters.status || fl['status'] === filters.status;
      return user_name && designation_name && department_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.userFilters.set(JSON.parse(this.intialFilters));
      this.userGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, newUser: any) {
    try {
      this.router.navigate(
        [
          '/nu',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: newUser == null ? null : newUser.user_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(newUser: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${newUser.user_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "user_id": newUser.user_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnUserApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'New User',
          detail: saveResult.message,
        });
        this.userGrid.forEach((ele: any) => {
          if (ele.user_id == newUser.user_id) {
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
    await this.userGrid();
  }

}

