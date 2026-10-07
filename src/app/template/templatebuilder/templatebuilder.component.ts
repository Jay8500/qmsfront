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
  moveItemInArray,
  CdkDragDrop,
  DragDropModule,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
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
  selector: "app-templatebuilder",
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
    DragDropModule,
  ],
  templateUrl: "./templatebuilder.component.html",
  styleUrl: "./templatebuilder.component.scss",
})
export class TemplatebuilderComponent implements OnInit {
  private router = inject(Router);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  public visible: boolean = false;
  private all = signal<any[]>([]);
  stats = signal({
    totalTemplates: 0,
    published: 0,
    drafts: 0,
    capaEnabled: 0,
  });
  categories = signal<string[]>([]);
  public pageMode: string = "NEW";
  public _text: string = "New Response Scale";
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

  public template: any = {
    action: "I",
    template_type_id: null,
    template_name: null,
    category_type_id: null,
    department_id: null,
    audit_type_id: null,
    // data_mode:null,
    communication_mode_id: null,
    default_scale: null,
    benchmark_pct: null,
    effective_from: null,
    effective_to: null,
    capa_required: true,
    has_sections: false,
    is_anonymous: false,
    is_active: true,
    template_status: "DRAFT",
    sections: [],
  };
  clearTemplate = JSON.stringify(this.template);
  templateTypeList = [];
  deptList = [];
  auditTypeList = [];
  dcmList = [];
  cmcnList = [];
  qstnbnkCtgryList = [];
  inputList = [];
  categoryList = [];
  responseScaleList = [];
  public intialErrorMsg: any = {
    template_type_id: "",
    template_name: "",
    category_type_id: "",
    department_id: "",
    audit_type_id: "",
    // data_mode:"",
    communication_mode_id: "",
    default_scale: "",
    benchmark_pct: "",
    effective_from: "",
    effective_to: "",
    sections: [],
    section_name: "",
    description: "",
    weightage: "",
    selected_sctn_id: "",
    question_text: "",
    question_code: "",
    // question_category_id: "",
    input_type: "",
    response_scale_id: "",
    // help_text:""
  };
  public errorMsg: any = { ...this.intialErrorMsg };
  public clearErr = JSON.stringify(this.errorMsg);

  onGetErrorMsgs(ctrl: any, index: any) {
    try {
      switch (ctrl) {
        case "template_type_id":
          let error = [null, "", 0].includes(this.template.template_type_id)
            ? "Template Type is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            template_type_id: error,
          };
          break;
        case "template_name":
          let nameErr = [null, "", 0].includes(this.template.template_name)
            ? "Template Name is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            template_name: nameErr,
          };
          break;
        // case "template_code":
        //   let typeErrr = [null,'',0].includes(this.template.template_code) ? 'Template Code is required'  : ''
        //   this.errorMsg = {
        //     ...this.errorMsg,
        //     template_code :typeErrr
        //   }
        // break;
        case "category_type_id":
          let sclMax = [null, "", 0].includes(this.template.category_type_id)
            ? "Category is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            category_type_id: sclMax,
          };
          break;
        case "department_id":
          let dept = [null, "", 0].includes(this.template.department_id)
            ? "Department is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            department_id: dept,
          };
          break;
        case "audit_type_id":
          let tempName = [null, "", 0].includes(this.template.audit_type_id)
            ? "Audit Type is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            audit_type_id: tempName,
          };
          break;
        // case "data_mode":
        //   let dcErr = [null,'',0].includes(this.template.data_mode) ? 'Data Collection Mode is required'  : ''
        //   this.errorMsg = {
        //     ...this.errorMsg,
        //     data_mode :dcErr
        //   }
        //  break;
        case "communication_mode_id":
          let cmErr = [null, "", 0].includes(
            this.template.communication_mode_id,
          )
            ? "Communication Mode  is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            communication_mode_id: cmErr,
          };
          break;
        case "default_scale":
          let dsErr = [null, "", 0].includes(this.template.default_scale)
            ? "Default Scale is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            default_scale: dsErr,
          };
          break;
        case "benchmark_pct":
          let benchErr = [null, "", 0].includes(this.template.benchmark_pct)
            ? "Benchmark is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            benchmark_pct: benchErr,
          };
          break;
        case "effective_from":
          let effectErr = [null, "", 0].includes(this.template.effective_from)
            ? "Effective From  is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            effective_from: effectErr,
          };
          break;
        case "effective_to":
          let toErr = [null, "", 0].includes(this.template.effective_to)
            ? "Effective To is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            effective_to: toErr,
          };
          break;
        case "question_text":
          let qstnTextErr = [null, "", 0].includes(
            this.add_question.question_text,
          )
            ? "Question Text  is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            question_text: qstnTextErr,
          };
          break;
        case "question_code":
          let qustnCodeErr = [null, "", 0].includes(
            this.add_question.question_code,
          )
            ? "Question Code  is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            question_code: qustnCodeErr,
          };
          break;
        // case "question_category_id":
        //   let qstnCatErr = [null, "", 0].includes(
        //     this.add_question.question_category_id,
        //   )
        //     ? "Question Category  is required"
        //     : "";
        //   this.errorMsg = {
        //     ...this.errorMsg,
        //     question_category_id: qstnCatErr,
        //   };
        //   break;
        case "input_type":
          let inputErr = [null, "", 0].includes(this.add_question.input_type)
            ? "Input Type  is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            input_type: inputErr,
          };
          break;
        case "response_scale_id":
          let res_scaleErr = [null, "", 0].includes(
            this.add_question.response_scale_id,
          )
            ? "Response Scale is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            response_scale_id: res_scaleErr,
          };
          break;
        case "selected_sctn_id":
          let targetErr = [null, "", 0].includes(this.selected_sctn_id)
            ? "Targer Section is required"
            : "";
          this.errorMsg = {
            ...this.errorMsg,
            selected_sctn_id: targetErr,
          };
          break;
      }
    } catch (e) { }
  }

  resetForm() {
    if (this.pageMode == "NEW") {
      this.template = JSON.parse(this.clearTemplate);
      this.errorMsg = JSON.parse(this.clearErr);
    }
  }

  async onSubmit(status: string) {
    try {
      let erros: any = [
        "template_type_id",
        "template_name",
        "category_type_id",
        "department_id",
        "audit_type_id",
        "communication_mode_id",
        "benchmark_pct",
        "effective_from",
        "effective_to",
      ];
      erros.forEach((ele: any) => {
        this.onGetErrorMsgs(ele, null);
      });
      if (this.template.sections.length == 0) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Template Builder",
          detail: "Check the errors",
        });
        return;
      }
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        return;
      }
      let getTemplate = JSON.parse(JSON.stringify(this.template));
      getTemplate["template_status"] = status;
      getTemplate["effective_from"] = this._datePipe.transform(
        new Date(getTemplate["effective_from"]),
        "yyyy-MM-dd",
      );
      getTemplate["effective_to"] = this._datePipe.transform(
        new Date(getTemplate["effective_to"]),
        "yyyy-MM-dd",
      );
      getTemplate["sections"] = this.template.sections.map(
        (sec, secInd: number) => {
          if (!this.template.has_sections) {
            return {
              questions: sec.questions.map((q: any, index: number) => ({
                ...this.cleanQuestions(q),
                display_seq: index + 1,
              })),
            };
          }
          return {
            section_id: sec.section_id,
            section_name: sec.section_name,
            description: sec.description,
            is_mandatory: sec.is_mandatory,
            weightage: sec.weightage,
            display_seq: secInd + 1,
            questions: sec.questions.map((q: any, index: number) => ({
              ...this.cleanQuestions(q),
              display_seq: index + 1,
            })),
          };
        },
      );
      let cnfrmTmplte = await this._hqms.showConfirmMessage("Template builder");
      if (cnfrmTmplte) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnTemplateBuilderApi",
          getTemplate,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "tmplte",
            severity: "success",
            summary: "Template Builder",
            detail: saveResult.message,
          });
          this.visible = false;
          this.template = JSON.parse(this.clearTemplate);
          this.errorMsg = JSON.parse(this.clearErr);
          await this.getTmpltBuilderInfo();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "tmplte",
            severity: "warn",
            summary: "Template Builder",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) { }
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
  public templateMaster: any = [];

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(
    private _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
    public _datePipe: DatePipe,
  ) { }

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "commanEntityValuesGetApi",
        {
          entity_codes:
            "TEMPLATE_TYPE|COMMUNICATION_MODE|TEMPLATE_AUDIT_TYPE|QUESTION_BANK_CATGEORY|QUESTION_INPUT_TYPE|TEMPLATE_CATEGORY",
        },
      );
      if (info.status == 200) {
        this.templateTypeList = info.data["entities"]["TEMPLATE_TYPE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.cmcnList = info.data["entities"]["COMMUNICATION_MODE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.auditTypeList = info.data["entities"]["TEMPLATE_AUDIT_TYPE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.qstnbnkCtgryList = info.data["entities"]["QUESTION_BANK_CATGEORY"][
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
        this.categoryList = info.data["entities"]["TEMPLATE_CATEGORY"][
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
      let getDeptmnts: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "DEPARTMENT",
        },
      );
      if (getDeptmnts.status == 200) {
        this.deptList = getDeptmnts.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }));
      }
      await this.getQstnBnkInfo();
      await this.getTmpltBuilderInfo();
    } catch (e) { }
  }

  async getQstnBnkInfo() {
    try {
      let qstn: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "QUESTION_BANK",
        },
      );
      if (qstn.status == 200) {
        this.questionsList = qstn.data.map((ele: any) => ({
          ...ele,
          selected: false,
        }));
      }
      this.syncQuestionBankSelection();
    } catch (e) { }
  }

  public params: any = {};
  async getTmpltBuilderInfo() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.templateMaster = [];
      let flags: any = {
        page_no: pageNo,
        page_size: pageSize,
      };
      let totalCnt = 0;
      this.params = { ...flags };
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateBuilderApi",
        this.params,
      );
      if (info.status == 200) {
        console.log("info.data ", info.data)
        let sourcedData: any = [];
        totalCnt = info.data[0]["total_row_cnt"];
        this.stats.set({
          totalTemplates: info.data[0]["total_templates_cnt"] || 0,
          published: info.data[0]["total_published_cnt"] || 0,
          drafts: info.data[0]["total_drafts_cnt"] || 0,
          capaEnabled: info.data[0]["total_capa_enabled_cnt"] || 0,
        });
        this.templateMaster = info.data.map((ele, index: number) => ({
          ...ele,
          id: index + 1,
        }));
        this.copyData = info.data;
        this.pageNators.update((current) => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize),
        }));
      }
    } catch (e) { }
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
        this.templateMaster.forEach((ele: any) => {
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
    await this.templateMaster();
  }

  onEditClicScaleClick(edit: any) {
    this.pageMode = "EDIT";
    this._text = `Editing ${edit["template_code"]}`;
    this.visible = true;
    this.template = { ...edit };
    this.template["action"] = "U";
    this.syncQuestionBankSelection();
  }

  onAddOption(scle: any) {
    scle["sections"] = [];
    this.errorMsg["sections"] = [];
    scle["sections"].push({
      option_id: null,
      is_active: true,
      option_label: "test",
      option_code: null,
      display_order: null,
      score_points: null,
      not_applicable: false,
      exclude_from_score: false,
      is_edit: true,
    });
    this.errorMsg["sections"].push({
      option_label: "",
      option_code: "",
      display_order: "",
      score_points: "",
    });
  }

  public add_section: any = {
    section_name: null,
    description: null,
    weightage: null,
    is_mandatory: false,
  };
  public clearSctn = JSON.stringify(this.add_section);
  public sectionsList: any = [];
  public selected_sctn_id: any = null;
  public stateValue = "From Question Bank";
  public stateOptions: any[] = ["From Question Bank", "Create New"];
  public questionsList: any = [
    {
      question_id: "12",
      question_text: "adasdsad",
      is_active: true,
    },
    {
      question_id: "122",
      question_text: "2354234",
      is_active: true,
    },
  ]; // bank
  public add_question: any = {
    action: "I",
    question_id: null,
    question_text: null,
    question_code: null,
    // question_category_id: null,
    category_type_id: null,
    input_type: null,
    response_scale: null,
    response_scale_id: null,
    help_text: null,
    is_mandatory: false,
    requires_evidence: false,
    is_active: true,
    is_not_applicable: false,
  };
  public clearAddQstn = JSON.stringify(this.add_question);

  onSectionAdd() {
    let trimmedName = (this.add_section.section_name || "").trim();
    if (!trimmedName) return;
    let isDuplicate = this.template.sections.some(
      (sec) =>
        sec.section_name &&
        sec.section_name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      this._hqms.hqmsToasterService({
        key: "rle",
        severity: "error",
        summary: "Duplicate",
        detail: "Section already exists",
      });
      return;
    }
    // if(!(this.add_section.section_name || '').trim()) return;
    let newSecId = `sec-${Date.now()}`;
    let createdSection: any = {
      id: newSecId,
      section_name: this.add_section.section_name,
      description: this.add_section.description,
      weightage: this.add_section.weightage
        ? `${this.add_section.weightage}`
        : "",
      is_mandatory: this.add_section.is_mandatory,
      questions: [],
    };
    this.template["sections"].push(createdSection);
    this.selected_sctn_id = newSecId;
    this.add_section = JSON.parse(this.clearSctn);
  }

  async onQuestinSubmit() {
    try {
      let erros: any = [
        "question_text",
        "question_code",
        // "question_category_id",
        "input_type",
        "response_scale_id",
      ];
      erros.forEach((ele: any) => {
        this.onGetErrorMsgs(ele, null);
      });
      let errors = {
        question_text: this.errorMsg.question_text,
        question_code: this.errorMsg.question_code,
        // question_category_id: this.errorMsg.question_category_id,
        input_type: this.errorMsg.input_type,
        response_scale_id: this.errorMsg.response_scale_id,
      };
      let isValid = this._hqms.showErrorSummary(errors);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Questions",
          detail: "Check the errors",
        });
        return;
      }
      let qstn = JSON.parse(JSON.stringify(this.add_question));
      let cnfrmQstn = await this._hqms.showConfirmMessage(
        "Creating new question to question bank",
      );
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
          this.stateValue = "From Question Bank";
          this.add_question = JSON.parse(this.clearAddQstn);
          await this.getQstnBnkInfo();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "warn",
            summary: "Questions",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) { }
  }

  onHasSection(value: any) {
    this.add_section = JSON.parse(this.clearSctn);
    if (!value) {
      let allQues = this.template["sections"].flatMap((s) => s.questions);
      this.template["sections"] = [
        { id: "default-sec", section_name: null, questions: allQues },
      ];
      this.selected_sctn_id = "default-sec";
    } else {
      if (
        this.template["sections"].length === 1 &&
        this.template["sections"][0]["id"] === "default-sec"
      ) {
        let existingQues = this.template["sections"][0]["questions"];
        this.template["sections"] =
          existingQues.length > 0
            ? [
              {
                id: `sec-${Date.now()}`,
                section_name: "Default Section",
                description: "",
                isMandatory: false,
                weightage: null,
                questions: existingQues,
              },
            ]
            : [];
      }
      this.selected_sctn_id = this.template["sections"][0] ?.id || "";
    }
  }

  get sectionDropdownOptions() {
    return this.template.sections.map((sec) => ({
      label: sec.section_name,
      value: sec.id,
    }));
  }

  get sectionListIds(): string[] {
    return this.template["sections"].map((s) => s.id);
  }

  get totalSectionsCount(): any {
    return this.template.has_sections ? this.template["sections"].length : 0;
  }

  get totalQuestionsCount(): any {
    return this.template.sections.reduce(
      (sum, sec) => sum + sec.questions.length,
      0,
    );
  }

  removeSection(secIndex: number): void {
    let removeSec: any = this.template.sections[secIndex];
    this.template.sections.splice(secIndex, 1);
    this.syncQuestionBankSelection();
    //  let removedSec:any = this.template['sections'][secIndex];
    //  removedSec.questions.forEach(q => {
    //    let bankItem = this.questionsList.find(qb=>
    //    qb.question_id === q.question_id);
    //    if(bankItem) bankItem.selected = false;
    //  })
    //  this.template.sections.splice(secIndex,1);
    if (this.selected_sctn_id === removeSec.id) {
      this.selected_sctn_id = this.template.sections[0] ?.id || "";
    }
  }

  toggleQuestionSelection(question: any): void {
    let targetSection: any = null;
    if (this.template.has_sections) {
      if (!this.selected_sctn_id) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Please add and select a target section first",
          detail: "Check the errors",
        });
        return;
      }
      targetSection = this.template.sections.find(
        (s) => s.id === this.selected_sctn_id,
      );
    } else {
      if (this.template.sections.length === 0) {
        this.template.sections.push({
          id: "deafult-sec",
          section_name: null,
          questions: [],
        });
      }
    }
    if (!targetSection) return;
    let existingIdx = targetSection.questions.findIndex(
      (q) => q.id === question.id,
    );
    if (existingIdx > -1) {
      targetSection.questions.splice(existingIdx, 1);
      question.selected = false;
    } else {
      targetSection.questions.push({ ...question });
      question.selected = true;
    }
  }

  removeQuestionFromPreview(secIndex: number, qIndex: number): void {
    let removeQ = this.template.sections[secIndex].questions[qIndex];
    this.template.sections[secIndex].questions.splice(qIndex, 1);
    this.syncQuestionBankSelection();
    //  let qToRemove:any = this.template.sections[secIndex].questions[qIndex];
    //  this.template.sections[secIndex].questions.splice(qIndex,1);
    //  let bankItem:any  = this.questionsList.find(qb=>qb.question_id === qToRemove.id);
    //  if(bankItem) bankItem.selected = false;
  }

  dropSection(event: CdkDragDrop<any[]>): void {
    //  if(!this.template.has_sections) return;
    moveItemInArray(
      this.template.sections,
      event.previousIndex,
      event.currentIndex,
    );
  }

  dropQuestion(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  cleanQuestions(q: any) {
    return {
      question_id: q["question_id"],
      //  question_text : q['question_text'],
    };
  }

  addQuestionToTargetSection(qstn: any) {
    let qId = qstn.question_id || qstn.id;
    if (qstn.selected) return;
    if (this.isQuestionInPreview(qId)) {
      this._hqms.hqmsToasterService({
        key: "rle",
        severity: "warn",
        summary: "Question already added to form preview",
        detail: "Check the errors",
      });
      return;
    }
    if (!this.template.has_sections) {
      // sections false
      if (this.template.sections.length == 0) {
        this.template.sections.push({
          id: "default-sec",
          section_name: null,
          questions: [],
        });
      }

      let clonedQuestion: any = {
        ...qstn,
        id:
          "q_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      };
      this.template.sections[0].questions.push(clonedQuestion);
    }
    if (this.template.has_sections) {
      if (!this.selected_sctn_id) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Selecting target section is required",
          detail: "Check the errors",
        });
        return;
      }
      let targetSection = this.template.sections.find(
        (sec) => sec.id === this.selected_sctn_id,
      );
      if (targetSection) {
        let clonedQuestion: any = {
          ...qstn,
          id:
            "q_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 6),
        };
        targetSection.questions.push(clonedQuestion);
      }
    }
  }

  isQuestionInPreview(qId: String): boolean {
    return this.template.sections.some((sec) =>
      sec.questions.some((q) => q.question_id === qId || q.id === qId),
    );
  }

  syncQuestionBankSelection(): void {
    this.questionsList.forEach((bankQ) => {
      let qId = bankQ.question_id || bankQ.id;
      bankQ.selected = this.isQuestionInPreview(qId);
    });
  }

  getStatusSeverity(
    status: string,
  ): "success" | "warn" | "warning" | "danger" | undefined {
    switch (status) {
      case "DRAFT":
        return "warn";
        break;
      case "PUBLISHED":
        return "success";
        break;
      case "RETIRED":
        return "danger";
        break;
        deafault: return undefined;
    }
  }

  onTemplateTypeSelect() {
    this.template["template_name"] = null;
    this.template["category_type_id"] = null;
    this.template["department_id"] = null;
    this.template["audit_type_id"] = null;
    this.template["communication_mode_id"] = null;
    this.template["default_scale"] = null;
    this.template["benchmark_pct"] = null;
    this.template["effective_from"] = null;
    this.template["effective_to"] = null;
    this.template["capa_required"] = true;
    this.template["has_sections"] = false;
    this.template["is_anonymous"] = false;
    this.template["is_active"] = true;
    this.template["template_status"] = "DRAFT";
    this.template["sections"] = [];

    this.errorMsg["template_name"] = "";
    this.errorMsg["category_type_id"] = "";
    this.errorMsg["department_id"] = "";
    this.errorMsg["audit_type_id"] = "";
    this.errorMsg["communication_mode_id"] = "";
    this.errorMsg["default_scale"] = "";
    this.errorMsg["benchmark_pct"] = "";
    this.errorMsg["effective_from"] = "";
    this.errorMsg["effective_to"] = "";
    this.errorMsg["capa_required"] = "";
    this.errorMsg["has_sections"] = "";
    this.errorMsg["is_anonymous"] = "";
    this.errorMsg["is_active"] = "";
    this.errorMsg["template_status"] = "";
    this.add_question = JSON.parse(this.clearAddQstn);
    this.stateValue = "From Question Bank";
    this.selected_sctn_id = null;
  }
}
