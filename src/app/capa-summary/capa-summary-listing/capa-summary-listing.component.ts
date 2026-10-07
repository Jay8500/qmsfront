import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { DatePipe } from '@angular/common';
interface capaTable {
  id: number;
  // capa_id: any;
  name: any;
  rows :any
  // sub_module_name: any;
  // write_capa: any;
  // action_taken: any;
  // created_by: any;
  // created_at: any;
  // status: any;
}
export type SortColumn =  '';
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
  @Output() sort:any = new EventEmitter<SortEvent>();
  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
@Component({
  selector: 'app-capa-summary-listing',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './capa-summary-listing.component.html',
})
export class CapaSummaryListingComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  public intialFilters: any = JSON.stringify({
    module_name: null,
    sub_module_name: null,
    created_by: null,
  });
  public capaFilters = signal(JSON.parse(this.intialFilters));
  public moduleList: any = [];
  public subModuleList: any = [];
  public writtenByList: any = [];
  public groupedMap:any = [];
  public capaGrid: capaTable[] = [];
  public router = inject(Router);
  showFilter = false;
  public copyData: any = [];
  public columCnt:number = 0;

  processData(flatList:any[]){
    try{
     let groups = flatList.reduce((acc,item)=>{
        let key = item.module_name || '';
        if(!acc[key]) acc[key]=[];
        acc[key].push(item);
        return acc;
      },{});
    this.groupedMap = Object.keys(groups).map((key,index) => ({
      name : key,
      id : index,
      rows : groups[key],
      count : groups[key].length
    }))
    }catch(e){
    }
  }

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.getCapaGrid();
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    if (direction === '' || column === '') {
      this.groupedMap = this.groupedMap;
    } else {
      let isParent :any= column === 'name';
      if(isParent){
       this.groupedMap = [...this.groupedMap].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
      }else{
       this.groupedMap = [...this.groupedMap].map(group => {
         let sortredRows = [...group.rows].
          sort((a, b) => {
            const res = compare(a[column], b[column]);
            return direction === 'asc' ? res : -res;
          });
          return { ...group, rows:sortredRows}
       })
      };
    };
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public params: any = {};

  async getCapaGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.capaGrid = [];
      let totalCnt = 0;
      let flages: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getCapaList: any = await this._hqms.customGetApiCall('GET', 'fnCapaSummaryApi', this.params);
      if (getCapaList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getCapaList.data[0]['total_row_cnt'];
        getCapaList.data.map((capaPrp: any, index: number) => ({...capaPrp,  id: index + 1}));
        this.processData(getCapaList.data);
        this.copyData = [...this.groupedMap];
        this.moduleList = [...new Set( getCapaList.data.map((item: any) => item.module_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.subModuleList = [...new Set( getCapaList.data.map((item: any) => item.sub_module_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.writtenByList = [...new Set( getCapaList.data.map((item: any) => item.created_by))].map((name, index) => ({
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
    try{
    let filters = this.capaFilters();
     this.groupedMap = this.copyData.map(m =>  {
       let isModuleMatch = m.name.includes(filters.module_name);
      //  let filteredRows =  m.rows.filter((rw) => (rw.sub_module_name || '').includes(filters.sub_module_name) || []  ) ;
       if(isModuleMatch){
         return {...m, count : m.rows.length};
       }
      //  else  if(filteredRows.length > 0){
      //    return {
      //      ...m,
      //      rows : filteredRows,
      //      count :filteredRows.length
      //    }
      //  }
       return null;
     } ).filter(item => item !== null);
  }catch(e){
  }
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.capaFilters.set(JSON.parse(this.intialFilters));
      this.groupedMap = [...this.copyData];
    } else {
      this.onFilterClick();
    }
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
    await this.getCapaGrid();
  }

  // Incident / Risk CAPAs open their own record (deep link); others open the module page as before
  viewItem(group: any, item: any) {
    if (item?.source_route && item?.source_module_id) {
      this.router.navigate(['/' + item.source_route], { state: { data: { mode: 'VIEW', id: item.source_module_id } } });
      return;
    }
    this.viewReport(group);
  }

  viewReport(capaProp: any) {
    switch (capaProp.name) {
      case 'Audit Management':
        this.router.navigate(['/audit-type-dashboard']);
        break;
      case 'Risk Management':
        this.router.navigate(['/risk-dashboard']
        //  {
        //   queryParams: { capa_id: capaProp.capa_id, sub_module_name: capaProp.sub_module_name }
        // }
        );
        break;
      case 'Incident Management':
        this.router.navigate(['/incident-dashboard']);
        break;
      case 'Feedback Management':
        this.router.navigate(['/prem-daily-feedbacks']);
        break;
      case 'Patient Safety':
        this.router.navigate(['/ipsg-dashboard']);
        break;
      case 'KPI Management':
        this.router.navigate(['/kpi-dashboard']);
        break;
      default:
        // Fallback to generic CAPA report page
        this.router.navigate(['/capa-report']);
        break;
    }
  }
}
