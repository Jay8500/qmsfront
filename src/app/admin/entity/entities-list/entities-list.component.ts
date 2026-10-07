import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { MessageService, ConfirmationService } from "primeng/api";
//old
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectComponent } from '../../../smart/select/select.component';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';

interface licenseTrackerTable {
  id: number;
  entity_id: any;
  entity_name: any;
  entity_code: any;
  category_type: any;
}

export type SortColumn = keyof licenseTrackerTable | '';
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
  selector: "app-entities-list",
  standalone: true,
  imports: [FormsModule, ButtonModule, SelectModule, InputTextModule, IconFieldModule, InputIconModule,
    TagModule, TooltipModule,
    NgApexchartsModule, CommonModule, SharedModule
  ],
  templateUrl: './entities-list.component.html',
  styleUrl: './entities-list.component.css'
})
export class EntitiesListComponent implements OnInit {

  private router = inject(Router);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  public pageMode :string = 'NEW';
  public _text:string = 'New Response Scale';
  stats = signal({
    totalEntities: 0,
    totalValues: 0,
    systemLocked: 0,
    activeValues: 0,
    total_cnt_last_updated: null,
    inactive_cnt_last_updated: null,
    system_cnt_last_updated: null,
    active_cnt_last_updated: null,
  });
  categories = signal<string[]>([]);
  search = signal("");
  categoryFilter = signal<string>("");
  statusFilter = signal<"active" | "all" | "inactive">("active");

  statusOptions = [
    { label: "Active only", value: "active" },
    { label: "All statuses", value: "all" },
    { label: "Inactive", value: "inactive" },
  ];
  categoryOptions = computed(() => [
    { label: "All Categories", value: "" },
    ...this.categories().map((c) => ({ label: c, value: c })),
  ]);
public categoryTypeList = [];
  noop(): void { }
  openCreate(): void {
    this.pageMode = 'NEW';
    this.visible = true;
  }

  private fieldValidity = signal<Record<string, boolean>>({});
  public entityMasterGrid: any = [];

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
       let getCategoryType: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ENTITY_CATGEORY" });
      if (getCategoryType.status == 200) {
        this.categoryTypeList = getCategoryType.data.entities.ENTITY_CATGEORY.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }))
      };
      await this.getEntityMasterGridInfo();
    } catch (e) { }
  }


  public params: any = {};
  async getEntityMasterGridInfo() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.entityMasterGrid = [];
      let flags: any = {
         "page_no": pageNo,
        "page_size": pageSize,
      };
       let totalCnt = 0;
      this.params = { ...flags }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnEntityApi', this.params);
      if (info.status == 200) {
        let sourcedData: any = [];
        this.stats.set(
          {
            totalEntities : info.data[0]['total_eneities_cnt']||0,
            totalValues : info.data[0]['total_values_cnt']||0,
            systemLocked : info.data[0]['total_system_locked_cnt']||0,
            activeValues : info.data[0]['total_active_values_cnt']||0,
            total_cnt_last_updated : info.data[0]['total_cnt_last_updated'],
            inactive_cnt_last_updated : info.data[0]['inactive_cnt_last_updated'],
            system_cnt_last_updated : info.data[0]['system_cnt_last_updated'],
            active_cnt_last_updated : info.data[0]['active_cnt_last_updated'],
          }
        )
         totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((entityMasters: any, index: number) => {
          let createEntityMaster: any = {
            id: index + 1,
            entity_id: entityMasters.entity_id,
            entity_name: entityMasters.entity_name,
            entity_code: entityMasters.entity_code,
            category_type: entityMasters.category_type,
            category_type_name: entityMasters.category_type_name,
            description:entityMasters.description,
            display_order:entityMasters.display_order,
            valueCount: entityMasters.valueCount || 0,
            is_system: entityMasters.is_system,
            is_editable: entityMasters.is_editable,
            values: entityMasters.entity_values,
            is_active: entityMasters.is_active,
          };
          sourcedData.push(createEntityMaster);
        });
        this.entityMasterGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.pageNators.update(current => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize)
        }));
      };
    } catch (e) {
    };
  }

  async onDelete(entityMaster: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${entityMaster.entity_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "entity_id": entityMaster.entity_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnEntityApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Entity Master',
          detail: saveResult.message,
        });
        this.entityMasterGrid.forEach((ele: any) => {
          if (ele.entity_id == entityMaster.entity_id) {
            ele['status'] = 'Inactive';
          };
        });
      };
    };
  }

  onFieldStatusChange(event: {
    fieldName: string;
    value: any;
    isValid: boolean;
    isTouched: boolean;
  }) {
    this.fieldValidity.update((current) => ({
      ...current,
      [event.fieldName]: event.isValid,
    }));
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
    await this.getEntityMasterGridInfo();
  }

  onEditClickDoc(edit:any){
    this.pageMode = 'EDIT';
    this._text = `Editing ${edit['entity_name']}`;
    this.visible = true;
    edit['']
    this.entity_json = {...edit};
    this.entity_json['action'] = 'U';
    this.errorMsg["entity_id"] =  "";
    this.errorMsg["entity_code"] =  "";
    this.errorMsg["entity_name"] =  "";
    this.errorMsg["category_type"] =  "";
    this.errorMsg["description"] =  "";
    this.errorMsg["display_order"] =  "";
    this.errorMsg["is_values"] =  "";
    this.errorMsg["is_editable"] =  "";
    this.errorMsg["is_system"] =  "";
    this.errorMsg["is_active"] =  "";
    this.errorMsg["values"] = [];
    edit.values.forEach(ele =>{
      this.errorMsg["values"].push({
        "value_code" : "",
        "short_name" : "",
        "display_value" :"",
        "display_order" : "",
      });
    })
  }

  public visible:boolean = false;
  public intialEntity: any = JSON.stringify({
    "action": "I",
    "entity_id": null,
    "entity_code": null,
    "entity_name": null,
    "category_type": null,
    "description": null,
    "display_order": null,
    "is_values": true,
    "is_editable": true,
    "is_system": false,
    "is_active": true,
    "values": [],
  });

  public entity_json :any={ ...JSON.parse(this.intialEntity) };
  public errorMsg :any = {
    "entity_id": "",
    "entity_code": "",
    "entity_name": "",
    "category_type": "",
    "description": "",
    "display_order": "",
    "is_values": "",
    "is_editable": "",
    "is_system": "",
    "is_active": "",
    "values": [],
  };
  public clearErr = JSON.stringify(this.errorMsg);

  onGetErrorMsgs(ctrl:any,index:any){
    try{
    switch (ctrl) {
      case "entity_code":
        let error = [null,'',0].includes(this.entity_json.entity_code) ? 'Entity Code is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
          entity_code : error
        }
       break;
      case "entity_name":
      let nameErr = [null,'',0].includes(this.entity_json.entity_name) ? 'Entity Name is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
          entity_name :nameErr
        }
       break;
      case "category_type":
      let typeErrr = [null,'',0].includes(this.entity_json.category_type) ? 'Category Type is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
          category_type :typeErrr
        }
       break;
      case "display_order":
      let sclMax = [null,'',0].includes(this.entity_json.display_order) ? 'Display Order is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
          display_order :sclMax
        }
       break;
      case "description":
      let desc = [null,'',0].includes(this.entity_json.description) ? 'Description is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
          description :desc
        }
       break;
      case "value_code":
      let value_code = [null,'',0].includes(this.entity_json.values[index]['value_code']) ? 'Value Code is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
        };
        this.errorMsg.values[index]['value_code'] = value_code;
       break;

      case "short_name":
      let short_name = [null,'',0].includes(this.entity_json.values[index]['short_name']) ? 'Short Name is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
        };
        this.errorMsg.values[index]['short_name'] = short_name;
       break;

      case "display_value":
      let display_value = [null,'',0].includes(this.entity_json.values[index]['display_value']) ? 'Display Value is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
        };
        this.errorMsg.values[index]['display_value'] = display_value;
       break;

      case "display_order2":
      let display_order = [null,'',0].includes(this.entity_json.values[index]['display_order']) ? 'Display Order is required'  : ''
        this.errorMsg = {
          ...this.errorMsg,
        };
        this.errorMsg.values[index]['display_order'] = display_order;
       break;

    }
    }catch(e){
    }
  }

  async onSubmit(){
    try{
      let erros :any= ['entity_code','entity_name','category_type','display_order','description']
      erros.forEach((ele:any)=> { this.onGetErrorMsgs(ele,null)  } );
      if(this.entity_json.values.length == 0) {
         this._hqms.hqmsToasterService({
          key: 'entity',
          severity: 'warn',
          summary: 'Entity Master',
          detail: 'Check the errors',
        });
        return;
      };
      let childErr = ['value_code','short_name','display_value','display_order2'];
       childErr.forEach((ctrl:any)=> {
        this.entity_json.values.forEach((ele,index) => {
          this.onGetErrorMsgs(ctrl,index)
         })
        });
      let isValid =  this._hqms.showErrorSummary(this.errorMsg);
      if(isValid){ return}
      let enty = JSON.parse(JSON.stringify(this.entity_json));
      let cnfrmEntity = await this._hqms.showConfirmMessage();
      if (cnfrmEntity) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnEntityApi", enty);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'entity',
            severity: 'success',
            summary: 'Entity Master',
            detail: saveResult.message,
          });
          this.visible = false;
          await this.ngOnInit();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'entity',
            severity: 'warn',
            summary: 'Entity Master',
            detail: saveResult.message,
          });
        }
      };
      // this.visible = false;
   }catch(e){
   }
  }

  resetForm(){
    if(this.pageMode == 'NEW'){
      this.entity_json = JSON.parse(this.intialEntity);
      this.errorMsg = JSON.parse(this.clearErr);
    }
  }

  addAccessControl(entity:any){
    entity['values'] = [];
    this.errorMsg['values'] = [];
     entity['values'].push(
     {
	 	"entity_value_id" :null,
		"is_active" : true,
		"value_code" : null,
		"entity_code" : null,
		"display_value" : null,
		"short_name" :null,
		"description" :null,
		"display_order" :null,
		"value_type" :null,
		"entity_id" : entity['entity_id'],
		"is_default" :false,
		"is_system" :false,
		"is_editable" :false,
		"is_visible" :false,
	 });
    this.errorMsg['values'].push({
        "value_code" : "",
      "short_name" : "",
      "display_value" :"",
      "display_order" : "",
    })

  }

  onAccAdd(ctrl:any,entity_json:any) {
    let enty = JSON.parse(JSON.stringify(ctrl));
    enty["entity_value_id"] = null;
    enty["is_active"] = true;
    enty["entity_code"] = null;
    enty["value_code"] = null;
    enty["display_value"] = null;
    enty["short_name"] = null;
    enty["description"] = null;
    enty["display_order"] = null;
    enty["value_type"] = null;
    enty["is_default"] = false;
    enty["is_system"] = false;
    enty["is_editable"] = false;
    enty["is_visible"] = false;
    entity_json.values.push(enty);
    this.errorMsg['values'].push({
    "value_code" : "",
	  "short_name" : "",
		"display_value" :"",
		"display_order" : "",
   })
  }

  onEntityValueRemove(entyVl, entyIndex: number) {
    if (this.pageMode == 'NEW') {
      this.entity_json.values.splice(entyIndex, 1);
      this.errorMsg.values.splice(entyIndex, 1);
    } else {
      entyVl.is_active = false;
    };
  }

}
