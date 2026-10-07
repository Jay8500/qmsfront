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
// import { Entity, EntityWithCounts, RefDataStats } from "../core/models";
// import { EntityFormComponent } from "../entity-form/entity-form.component";
//old
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SelectComponent } from '../../smart/select/select.component';
import { SharedModule } from '../../shared/shared.module';
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
  selector: 'app-responsescale',
  imports: [FormsModule, ButtonModule, SelectModule, InputTextModule, IconFieldModule, InputIconModule,
    TagModule, TooltipModule,
    NgApexchartsModule, CommonModule, SharedModule
  ],
  templateUrl: './responsescale.component.html',
  styleUrl: './responsescale.component.scss',
})
export class ResponsescaleComponent implements OnInit {
  private router = inject(Router);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  public visible: boolean = false;
  private all = signal<any[]>([]);
  stats = signal({
    totalScales: 0,
    totalOptions: 0,
    systemLocked: 0,
    scoringModel: 0
  });
  categories = signal<string[]>([]);
  public pageMode: string = 'NEW';
  public _text: string = 'New Response Scale';
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
  dialogVisible = signal(false);
  editing = signal<any>(null);

  scale: any = {
    "action": "I",
    "response_scale_id": null,
    scale_code: null,
    scale_name: null,
    scale_type: null,
    scale_max: null,
    description: null,
    is_higher_better: false,
    is_system: false,
    is_active: true,
    options: []
  };
  clearScale = JSON.stringify(this.scale);
  typeList = [];
  public intialErrorMsg: any = {
    scale_code: "",
    scale_name: "",
    scale_type: "",
    scale_max: "",
    description: "",
    options: []
  };
  public errorMsg: any = { ...this.intialErrorMsg };
  public clearErr = JSON.stringify(this.errorMsg);

  onGetErrorMsgs(ctrl: any, index: any) {
    try {
      switch (ctrl) {
        case "scale_code":
          let error = [null, '', 0].includes(this.scale.scale_code) ? 'Scale Code is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            scale_code: error
          }
          break;
        case "scale_name":
          let nameErr = [null, '', 0].includes(this.scale.scale_name) ? 'Scale Name is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            scale_name: nameErr
          }
          break;
        case "scale_type":
          let typeErrr = [null, '', 0].includes(this.scale.scale_type) ? 'Type is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            scale_type: typeErrr
          }
          break;
        case "scale_max":
          let sclMax = [null, '', 0].includes(this.scale.scale_max) ? 'Scale Max is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            scale_max: sclMax
          }
          break;
        case "description":
          let desc = [null, '', 0].includes(this.scale.description) ? 'Description is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            description: desc
          }
          break;
        case "option_label":
          let option_label = [null, '', 0].includes(this.scale.options[index]['option_label']) ? 'Option Label is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
          };
          this.errorMsg.options[index]['option_label'] = option_label;

          break;
        case "option_code":
          let option_code = [null, '', 0].includes(this.scale.options[index]['option_code']) ? 'Option Code is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
          };
          this.errorMsg.options[index]['option_code'] = option_code;

          break;
        case "score_points":
          let score_points = [null, '', 0].includes(this.scale.options[index]['score_points']) ? 'Score is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
          };
          this.errorMsg.options[index]['score_points'] = score_points;

          break;
      }
    } catch (e) {
    }
  }

  resetForm() {
    if (this.pageMode == 'NEW') {
      this.scale = JSON.parse(this.clearScale);
      this.errorMsg = JSON.parse(this.clearErr);
    };
  }

  async onSubmit() {
    try {
      let erros: any = ['scale_code', 'scale_name', 'scale_type', 'scale_max', 'description']
      erros.forEach((ele: any) => { this.onGetErrorMsgs(ele, null) });
      if (this.scale.options.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'rle',
          severity: 'warn',
          summary: 'Response Scale',
          detail: 'Check the errors',
        });
        return;
      };
      let childErr = ['option_label', 'option_code', 'score_points'];
      childErr.forEach((ctrl: any) => {
        this.scale.options.forEach((ele, index) => {
          this.onGetErrorMsgs(ctrl, index)
        })
      });
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) { return };
      let scleSave = JSON.parse(JSON.stringify(this.scale));
      console.log("response scale", scleSave)
      scleSave.options.forEach((ele: any, ind: number) => ele.display_order = ind + 1);
      let cnfrmScle = await this._hqms.showConfirmMessage();
      if (cnfrmScle) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnResponseScaleApi", scleSave);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'scle',
            severity: 'success',
            summary: 'Response Scale',
            detail: saveResult.message,
          });
          this.visible = false;
          await this.getResponseScleInfo();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'scle',
            severity: 'warn',
            summary: 'Response Scale',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {

    }
  }

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const cat = this.categoryFilter();
    const st = this.statusFilter();
    return this.all().filter((e) => {
      if (
        q &&
        !(
          e.entity_name.toLowerCase().includes(q) ||
          e.entity_code.toLowerCase().includes(q) ||
          e.category_type.toLowerCase().includes(q)
        )
      )
        return false;
      if (cat && e.category_type !== cat) return false;
      if (st === "active" && !e.is_active) return false;
      if (st === "inactive" && e.is_active) return false;
      return true;
    });
  });

  noop(): void { }

  openValues(): void {
    // this.router.navigate(["/entity", e.entity_id]);
  }

  openCreate(): void {
    this.editing.set(null);
    this.dialogVisible.set(true);
  }


  private fieldValidity = signal<Record<string, boolean>>({});
  public responseScaleGrid: any = [];

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "RESPONSESCALE" });
      if (info.status == 200) {
        this.typeList = info.data['entities']['RESPONSESCALE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
      };
      await this.getResponseScleInfo();
    } catch (e) { }
  }


  public params: any = {};
  async getResponseScleInfo() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.responseScaleGrid = [];
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      let totalCnt = 0;
      this.params = { ...flags }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnResponseScaleApi', this.params);
      if (info.status == 200) {
        let sourcedData: any = [];
        this.stats.set(
          {
            totalScales: info.data[0]['total_scales_cnt'] || 0,
            totalOptions: info.data[0]['total_options_cnt'] || 0,
            systemLocked: info.data[0]['total_system_locked_cnt'] || 0,
            scoringModel: info.data[0]['total_scoring_model_cnt'] || 0,
          }
        )
        totalCnt = info.data[0]['total_row_cnt'];
        this.responseScaleGrid = info.data.map((ct, index: number) => ({ id: index + 1, ...ct }))
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
        this.responseScaleGrid.forEach((ele: any) => {
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
    await this.getResponseScleInfo();
  }

  onEditClicScaleClick(edit: any) {
    this.pageMode = 'EDIT';
    this._text = `Editing ${edit['scale_name']}`;
    this.visible = true;
    this.scale = { ...edit };
    this.scale['action'] = 'U';
    this.scale['scale_type'] = edit['scale_type_id'];
    this.errorMsg['scale_code'] = "";
    this.errorMsg['scale_name'] = "";
    this.errorMsg['scale_type'] = "";
    this.errorMsg['scale_max'] = "";
    this.errorMsg['description'] = "";
    this.errorMsg['options'] = [];
    edit.options.forEach((ele) => {
      this.errorMsg['options'].push({
        "option_label": "",
        "option_code": "",
        "display_order": "",
        "score_points": "",
      });
    });

  }

  onOptnAdd(options: any, scale: any) {
    let optn = JSON.parse(JSON.stringify(options));
    optn["option_id"] = null;
    optn["is_active"] = true;
    optn["option_label"] = null;
    optn["option_code"] = null;
    optn["display_order"] = null;
    optn["score_points"] = null;
    optn["not_applicable"] = false;
    optn["exclude_from_score"] = false;
    scale.options.push(optn);
    this.errorMsg['options'].push({
      "option_label": "",
      "option_code": "",
      "display_order": "",
      "score_points": "",
    })
  }

  onOptnRemove(options: any, optionIndex: any) {
    if (this.pageMode == 'NEW') {
    this.scale.options.splice(optionIndex, 1);
    this.errorMsg.options.splice(optionIndex, 1);
    } else {
      options.is_active = false;
    };
  }

  onAddOption(scle: any) {
    scle['options'] = [];
    this.errorMsg['options'] = [];
    scle['options'].push(
      {
        "option_id": null,
        "is_active": true,
        "option_label": null,
        "option_code": null,
        "display_order": null,
        "score_points": null,
        "not_applicable": false,
        "exclude_from_score": false,
        "is_edit": true
      })
    this.errorMsg['options'].push({
      "option_label": "",
      "option_code": "",
      "display_order": "",
      "score_points": "",
    })
  }
  // public customFilter:RegExp=/^[a-zA-Z0-9]*$/;
  // removeSpaces(event:Event){
  //   const inputEle=event.target as HTMLInputElement;
  //   let value=inputEle.value;
  //   value=value.replace(/^\s+/,'');
  //   value=value.replace(/\s{2,}/g,' ');
  //   inputEle.value=value
  // }
}
