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
import {
  Component,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  OnInit,
  inject,
  signal,
  computed,
} from "@angular/core";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CommonModule } from "@angular/common";
import { HqmsService } from "../../services/hqms.service";
import { SharedModule } from "../../shared/shared.module";
import { NospacesDirective } from "../../directives/nospaces.directive";
import { DatePipe } from "@angular/common";

interface licenseTrackerTable {
  id: number;
  entity_id: any;
  entity_name: any;
  entity_code: any;
  category_type: any;
}

export type SortColumn = keyof licenseTrackerTable | "";
export type SortDirection = "asc" | "desc" | "";
const rotate: { [key: string]: SortDirection } = {
  asc: "desc",
  desc: "",
  "": "asc",
};
const compare = (v1: string | number, v2: string | number) =>
  v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}
@Directive({
  selector: "th[sortable]",
  standalone: true,
  host: {
    "[class.asc]": 'direction === "asc"',
    "[class.desc]": 'direction === "desc"',
    "(click)": "rotate()",
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = "";
  @Input() direction: SortDirection = "";
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
@Component({
  selector: "app-questionbank",
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    NgApexchartsModule,
    CommonModule,
    SharedModule,
  ],
  templateUrl: "./questionbank.component.html",
  styleUrl: "./questionbank.component.scss",
})
export class QuestionbankComponent implements OnInit {
  private router = inject(Router);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  private all = signal<any[]>([]);
  stats = signal({
    totalQstns: 0,
    totalCategories: 0,
    mandatoryCnt: 0,
    evidencesCnt: 0,
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
  public visible: boolean = false;

  dialogVisible = signal(false);
  editing = signal<any>(null);

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

  noop(): void {}

  openValues(): void {
    // this.router.navigate(["/entity", e.entity_id]);
  }

  openCreate(): void {
    this.editing.set(null);
    this.dialogVisible.set(true);
  }

  private fieldValidity = signal<Record<string, boolean>>({});
  public qstnsBnksInfo: any = [];

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(
    private _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
    public _datePipe: DatePipe,
  ) {}
  public categ;
  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "commanEntityValuesGetApi",
        { entity_codes: "QUESTION_BANK_CATGEORY|QUESTION_INPUT_TYPE" },
      );
      if (info.status == 200) {
        this.typeList = info.data["entities"]["QUESTION_BANK_CATGEORY"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.inputList = info.data["entities"]["QUESTION_INPUT_TYPE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
      }
      let rsInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "RESPONSE_SCALES",
        },
      );
      if (rsInfo.status == 200) {
        this.responseScaleList = rsInfo.data.map((ele: any) => ({
          label: ele.scale_name,
          value: ele.response_scale_id,
        }));
      }
      await this.getQstnBnGrid();
    } catch (e) {}
  }

  public params: any = {};
  async getQstnBnGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.qstnsBnksInfo = [];
      let flags: any = {
        page_no: pageNo,
        page_size: pageSize,
      };
      let totalCnt = 0;
      this.params = { ...flags };
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnQuestionMasterApi",
        this.params,
      );
      if (info.status == 200) {
        totalCnt = info.data[0]["total_row_cnt"];
        this.stats.set({
          totalQstns: info.data[0]["total_questions_cnt"] || 0,
          totalCategories: info.data[0]["categories_cnt"] || 0,
          mandatoryCnt: info.data[0]["mandatory_cnt"] || 0,
          evidencesCnt: info.data[0]["evidence_required"] || 0,
        });
        this.qstnsBnksInfo = info.data.map((ele, ind) => ({
          id: ind + 1,
          ...ele,
        }));
        this.copyData = [...info.data];
        this.pageNators.update((current) => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize),
        }));
      }
    } catch (e) {}
  }

  async onDelete(entityMaster: any) {
    let confirm = await this._hqms.showConfirmMessage(
      `Confirm delete ${entityMaster.entity_name}`,
    );
    if (confirm) {
      let savePayload = {
        action: "D",
        entity_id: entityMaster.entity_id,
      };
      var saveResult: any = await this._hqms.customSaveApiCall(
        "POST",
        "fnEntityApi",
        savePayload,
      );
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: "success",
          summary: "Entity Master",
          detail: saveResult.message,
        });
        this.qstnsBnksInfo.forEach((ele: any) => {
          if (ele.entity_id == entityMaster.entity_id) {
            ele["status"] = "Inactive";
          }
        });
      }
    }
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
  });

  async changePage(newDisplayPage: number) {
    this.pageNators.update((prev) => ({ ...prev, pageNo: newDisplayPage }));
    await this.getQstnBnGrid();
  }

  onEditClicQstn(edit: any) {
    this.pageMode = "EDIT";
    this._text = `Editing ${edit["question_code"]}`;
    this.visible = true;
    this.question = { ...edit };
    this.question["action"] = "U";
    this.errorMsg = JSON.parse(this.clearErr);
  }
  public pageMode: string = "NEW";
  public _text: string = "New Question";
  public question: any = {
    action: "I",
    question_id: null,
    question_text: null,
    question_code: null,
    // question_category_id: null,
    input_type_id: null,
    response_scale_id: null,
    help_text: null,
    is_mandatory: false,
    requires_evidence: false,
    is_active: true,
    is_not_applicable: false,
  };
  public clearQuestion = JSON.stringify(this.question);
  typeList = [];
  inputList = [];
  responseScaleList = [];
  public intialErrorMsg: any = {
    question_text: "",
    question_code: "",
    // question_category_id: "",
    input_type_id: "",
    response_scale_id: "",
    help_text: "",
  };
  public errorMsg: any = { ...this.intialErrorMsg };
  public clearErr = JSON.stringify(this.errorMsg);

  onGetErrorMsgs(ctrl: any, index?: any) {
    try {
      switch (ctrl) {
        case "question_text":
          let error = [null, "", 0].includes(this.question.question_text)
            ? "Question Text is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            question_text: error,
          };
          break;
        case "question_code":
          let nameErr = [null, "", 0].includes(this.question.question_code)
            ? "Question code is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            question_code: nameErr,
          };
          break;
        // case "question_category_id":
        //   let categoryErrr = [null, "", 0].includes(
        //     this.question.question_category_id,
        //   )
        //     ? "Category is required"
        //     : "";
        //   this.errorMsg = {
        //     ...this.errorMsg,
        //     question_category_id: categoryErrr,
        //   };
        //   break;
        case "input_type_id":
          let sclMax = [null, "", 0].includes(this.question.input_type_id)
            ? "Input type is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            input_type_id: sclMax,
          };
          break;
        case "response_scale_id":
          let res_scale = [null, "", 0].includes(
            this.question.response_scale_id,
          )
            ? "Response Scale is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            response_scale_id: res_scale,
          };
          break;
        case "help_text":
          let desc = [null, "", 0].includes(this.question.help_text)
            ? "Help text is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            help_text: desc,
          };
          break;
      }
    } catch (e) {}
  }

  async onSubmit() {
    try {
      let erros: any = [
        "question_text",
        "question_code",
        // "question_category_id",
        "input_type_id",
        "response_scale_id",
        "help_text",
      ];
      erros.forEach((ele: any) => {
        this.onGetErrorMsgs(ele);
      });
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Questions",
          detail: "Check the errors",
        });
        return;
      }
      let qstn = JSON.parse(JSON.stringify(this.question));
      let cnfrmQstn = await this._hqms.showConfirmMessage();
      if (cnfrmQstn) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnQuestionMasterApi",
          qstn,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "success",
            summary: "Questions",
            detail: saveResult.message,
          });
          await this.getQstnBnGrid();
          this.visible = false;
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "warn",
            summary: "Questions",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  resetForm() {
    if (this.pageMode == "NEW") {
      this.question = JSON.parse(this.clearQuestion);
      this.errorMsg = JSON.parse(this.clearErr);
    }
  }
}
