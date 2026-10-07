import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { DatePipe } from '@angular/common';

interface organizationTable {
  id: number;
  org_id: any;
  org_name: any;
  no_of_locations: any;
  contact_person: any;
  company_url: any;
  privacy_policy_url: any;
  terms_of_usage_url: any;
  copy_right: any;
  email_id: any;
  office_phone: any;
  fax_number: any;
  mobile_phone: any;
  website_url: any;
  address1: any;
  address2: any;
  area_name: any;
  city_name: any;
  state_name: any;
  country_name: any;
}

export type SortColumn = keyof organizationTable | '';
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
  selector: 'app-organizationgrid',
  imports: [NgApexchartsModule, CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './organizationgrid.component.html',
})
export class OrganizationgridComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    org_name: null,
    contact_person: null,
    company_url: null,
  });
  public orgFilters = signal({ ...JSON.parse(this.intialFilters) });
  public orgList: any = [];
  public contactPersonList: any = [];
  public companyUrlList: any = [];
  public router = inject(Router);
  public orgInfo: any = [];
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  public copyData: any = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.getOrgGrid();
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
      this.orgInfo = this.orgInfo;
    } else {
      this.orgInfo = [...this.orgInfo].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }
  public params: any = {};
  filterToggle() {
    this.showFilter = !this.showFilter;
  }


  async getOrgGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.orgInfo = [];
      let sourcedData: any = [];
      let totalCnt = 0;
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
      };
      this.params = { ...flags }
      let oInfo: any = await this._hqms.customGetApiCall('GET', 'fnOrgApi', flags);
      if (oInfo.status == 200) {
        totalCnt = oInfo.data[0]['total_row_cnt'];
        oInfo.data.forEach((gridCls: any, index: number) => {
          let orgs: any = {
            id: index + 1,
            "org_cd": gridCls.org_cd,
            "org_id": gridCls.org_id,
            "apt_ref": gridCls.apt_ref,
            "area_id": gridCls.area_id,
            "city_id": gridCls.city_id,
            "org_key": gridCls.org_key,
            "umr_lvl": gridCls.umr_lvl,
            "zipcode": gridCls.zipcode,
            "about_us": gridCls.about_us,
            "address1": gridCls.address1,
            "address2": gridCls.address2,
            "email_id": gridCls.email_id,
            "i_org_id": gridCls.i_org_id,
            "org_desc": gridCls.org_desc,
            "org_guid": gridCls.org_guid,
            "org_name": gridCls.org_name,
            "org_type": gridCls.org_type,
            "state_id": gridCls.state_id,
            "area_name": gridCls.area_name,
            "city_name": gridCls.city_name,
            "is_active": gridCls.is_active,
            "is_listed": gridCls.is_listed,
            "preferred": gridCls.preferred,
            "copy_right": gridCls.copy_right,
            "country_id": gridCls.country_id,
            "created_at": gridCls.created_at,
            "fax_number": gridCls.fax_number,
            "org_rev_no": gridCls.org_rev_no,
            "state_name": gridCls.state_name,
            "updated_at": gridCls.updated_at,
            "company_url": gridCls.company_url,
            "default_pwd": gridCls.default_pwd,
            "umr_loc_lvl": gridCls.umr_loc_lvl,
            "website_url": gridCls.website_url,
            "accrd_status": gridCls.accrd_status,
            "corp_pkg_all": gridCls.corp_pkg_all,
            "country_name": gridCls.country_name,
            "display_name": gridCls.display_name,
            "mobile_phone": gridCls.mobile_phone,
            "office_phone": gridCls.office_phone,
            "reference_id": gridCls.reference_id,
            "valid_end_dt": gridCls.valid_end_dt,
            "apmnt_pat_reg": gridCls.apmnt_pat_reg,
            "created_by_id": gridCls.created_by_id,
            "is_registered": gridCls.is_registered,
            "umr_multi_loc": gridCls.umr_multi_loc,
            "updated_by_id": gridCls.updated_by_id,
            "accr_status_id": gridCls.accr_status_id,
            "contact_person": gridCls.contact_person,
            "org_pat_format": gridCls.org_pat_format,
            "valid_start_dt": gridCls.valid_start_dt,
            "default_acct_id": gridCls.default_acct_id,
            "no_of_locations": gridCls.no_of_locations,
            "seq_start_value": gridCls.seq_start_value,
            "accreditation_no": gridCls.accreditation_no,
            "accreditation_for": gridCls.accreditation_for,
            "reference_type_id": gridCls.reference_type_id,
            "accreditation_body": gridCls.accreditation_body,
            "privacy_policy_url": gridCls.privacy_policy_url,
            "terms_of_usage_url": gridCls.terms_of_usage_url,
            "default_currency_id": gridCls.default_currency_id,
            "future_apt_restrick": gridCls.future_apt_restrick,
            "nature_of_business_id": gridCls.nature_of_business_id,
            "status": gridCls.status,
            "is_approved_org": gridCls.is_approved_org,
          };
          sourcedData.push(orgs);
        });
        this.orgInfo = [...sourcedData];
        this.copyData = [...sourcedData];
        this.orgList = [...new Set(sourcedData.map((item: any) => item.org_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.contactPersonList = [...new Set(sourcedData.map((item: any) => item.contact_person))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.companyUrlList = [...new Set(sourcedData.map((item: any) => item.company_url))].map((name, index) => ({
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
    let filters = this.orgFilters();
    this.orgInfo = this.copyData.filter((fl: any) => {
      let org_name = !filters.org_name || fl['org_name'] === filters.org_name;
      let contact_person = !filters.contact_person || fl['contact_person'] === filters.contact_person;
      let company_url = !filters.company_url || fl['company_url'] === filters.company_url;
      return org_name && contact_person && company_url;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.orgFilters.set(JSON.parse(this.intialFilters));
      this.orgInfo = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, orgs: any) {
    try {
      this.router.navigate(
        [
          '/organization',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: orgs == null ? null : orgs.org_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(orgs: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${orgs.org_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "org_id": orgs.org_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnOrgApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Organization',
          detail: saveResult.message,
        });
        // this.orgList = [...this.copyData.filter((fl: any) => fl.org_id != orgs.org_id)];
        this.orgInfo.forEach((ele: any) => {
          if (ele.org_id == orgs.org_id) {
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
    await this.getOrgGrid();
  }

  async onClickApprove(orgs: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm Approve ${orgs.org_name}`);
    if (confirm) {
      let savePayload = {
        action: "A",
        "org_id": orgs.org_id,
        "is_active": true
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnOrgAppApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Organization Approved',
          detail: saveResult.message,
        });
        this.orgInfo.forEach((ele: any) => {
          if (ele.org_id == orgs.org_id) {
            ele['status'] = 'Active';
            ele['is_approved_org'] = 'Approved';
          };
        });
      };
    };
  }
}


