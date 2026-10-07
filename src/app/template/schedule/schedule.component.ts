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
  ChangeDetectorRef,
} from "@angular/core";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CommonModule } from "@angular/common";
import { HqmsService } from "../../services/hqms.service";
import { SharedModule } from "../../shared/shared.module";
import { DatePipe } from "@angular/common";
import { FileUploadModule, FileUpload } from "primeng/fileupload";
import { PolicyLinkComponent } from "../../vaccination-management/policy/policy-link/policy-link.component";
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
  selector: "app-schedule",
  imports: [
    PolicyLinkComponent,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    FileUploadModule,
    NgApexchartsModule,
    CommonModule,
    SharedModule,
  ],
  templateUrl: "./schedule.component.html",
  styleUrl: "./schedule.component.scss",
})
export class ScheduleComponent implements OnInit {
  public attachedFiles: any = [];
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChildren("sprtngDocs") sprtngDocs!: FileUpload;
  showFilter = false;
  private router = inject(Router);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  public visible: boolean = false;
  private all = signal<any[]>([]);
  stats = signal({
    totalScales: 0,
    totalOptions: 0,
    systemLocked: 0,
    scoringModel: 0,
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

  schedule_form: any = {
    action: "I",
    schedule_title: null,
    schedule_type: null,
    schedule_start_dt: null,
    schedule_end_dt: null,
    capacity: null,
    venue_id: null,
    reference_id: null,
    is_active: true,
  };
  clearScale = JSON.stringify(this.schedule_form);
  scheduleTypeList = [];
  referenceTypeList = [];
  venueList = [];
  departmentList = [];
  vaccinationList = [];
  auditorList = [];
  locationList = [];
  auditTypeList = [];
  trainingList = [];
  modeOfTrainingList = [];
  attendanceTypeList = [];
  feedbackList = [];
  committeeTypeList = [];
  chooseCommitteeList = [];
  scheduleSrcList: any = [];
  public intialErrorMsg: any = {
    schedule_title: "",
    schedule_type: "",
    schedule_start_dt: "",
    schedule_end_dt: "",
    capacity: "",
    venue_id: "",
    reference_id: "",
  };
  public errorMsg: any = { ...this.intialErrorMsg };
  public clearErr = JSON.stringify(this.errorMsg);
  public schedule_types = {
    AUDIT: {
      audit_schedule_id: null,
      audit_type_id: null,
      reference_id: null,
      auditor_id: null,
      audit_location_id: null,
      is_active: true,
    },
    TRAINING: {
      training_schedule_id: null,
      training_source_id: null,
      is_dep_role: null,
      reference_id: null,
      attendance_type_id: null,
      participants_fb_id: null,
      is_active: true,
    },
    VACCINATION: {
      vaccination_campaign_id: null,
      reference_id: null,
      is_active: true,
    },
    MEETING: {
      meeting_id: null, // table auto id
      committee_type_id: null,
      reference_id: null,
      chair_person_id: null,
      chairperson: null,
      co_chair_person_id: null,
      co_chair_person_name: null,
      co_ordinator_id: null,
      co_ordinator: null,
      committee_members: [],
      external_members: [],
      meeting_agenda: null,
      supporting_documents: [],
      is_active: true,
    },
  };
  public params: any = {};
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
  public selectedScheduleType: string = "";
  public schedulesList: any = [];

  onGetErrorMsgs(ctrl: any, helptext: any) {
    try {
      let message = "";
      switch (ctrl) {
        case "schedule_title":
          message = [null, "", 0].includes(this.schedule_form.schedule_title)
            ? "Schedule Title is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   schedule_title : scheduleErr
          // }
          break;
        case "schedule_type":
          message = [null, "", 0].includes(this.schedule_form.schedule_type)
            ? "Type is required"
            : "";
          // this.errorMsg = {
          //     ...this.errorMsg,
          //     schedule_type : error
          //   }
          break;
        case "schedule_start_dt":
          message = [null, "", 0].includes(this.schedule_form.schedule_start_dt)
            ? "Start Date is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   schedule_start_dt:scheduleDateErr
          // }
          break;
        case "schedule_end_dt":
          message = [null, "", 0].includes(this.schedule_form.schedule_end_dt)
            ? "End Date  is required"
            : "";
          // this.errorMsg = {
          //     ...this.errorMsg,
          //     schedule_end_dt :scheduleEndErr
          //   }
          break;
        case "capacity":
          // SRS 2.2: Capacity 1 to 999.
          message = [null, "", 0].includes(this.schedule_form.capacity)
            ? "Capacity is required"
            : !/^\d+$/.test(String(this.schedule_form.capacity)) || Number(this.schedule_form.capacity) < 1 || Number(this.schedule_form.capacity) > 999
              ? "Capacity must be a whole number from 1 to 999"
              : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   capacity :sclMax
          // }
          break;
        case "venue_id":
          message = [null, "", 0].includes(this.schedule_form.venue_id)
            ? "Venue is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   venue_id :venuErr
          // }
          break;
        case "reference_id":
          message = [null, "", 0].includes(this.schedule_form.reference_id)
            ? `${helptext} is required`
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   reference_id :refErr
          // }
          break;
        case "audit_type_id":
          message = [null, "", 0].includes(this.schedule_form.audit_type_id)
            ? "Audit Type is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   audit_type_id :adtTypeErr
          // }
          break;
        case "department_id":
          message = [null, "", 0].includes(this.schedule_form.department_id)
            ? "Department is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   department_id :depErr
          // }
          break;
        case "auditor_id":
          message = [null, "", 0].includes(this.schedule_form.auditor_id)
            ? "Auditor is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   auditor_id :adtrErr
          // }
          break;
        case "audit_location_id":
          message = [null, "", 0].includes(this.schedule_form.audit_location_id)
            ? "Location is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   audit_location_id :lcErr
          // }
          break;
        case "training_source_id":
          message = [null, "", 0].includes(
            this.schedule_form.training_source_id,
          )
            ? "Schedule Source  is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   training_id :traingErr
          // }
          break;
        case "mode_of_training":
          message = [null, "", 0].includes(this.schedule_form.mode_of_training)
            ? "Locations is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   mode_of_training :modeErr
          // }
          break;
        case "attendance_type_id":
          message = [null, "", 0].includes(
            this.schedule_form.attendance_type_id,
          )
            ? "Attendence Type is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   attendance_type_id :attendenceErr
          // }
          break;
        case "participants_fb_id":
          message = [null, "", 0].includes(
            this.schedule_form.participants_fb_id,
          )
            ? "Participant Feedback is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   participants_fb_id :participateErr
          // }
          break;
        case "vaccine_id":
          message = [null, "", 0].includes(this.schedule_form.vaccine_id)
            ? "Vaccine is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   vaccine_id :vaccineErr
          // }
          break;
        case "committee_id":
          message = [null, "", 0].includes(this.schedule_form.committee_id)
            ? "Committe Type is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   committee_id :committeErr
          // }
          break;
        case "committee_type_id":
          message = [null, "", 0].includes(this.schedule_form.committee_type_id)
            ? "Committe Name is required"
            : "";
          // this.errorMsg = {
          //   ...this.errorMsg,
          //   committee_type_id :ctErr
          // }
          break;
        //  case "meeting_agenda":
        //  message = [null,'',0].includes(this.schedule_form.meeting_agenda) ? 'Meeting Agenda is required'  : ''
        //   // this.errorMsg = {
        //   //   ...this.errorMsg,
        //   //   meeting_agenda :ctErr
        //   // }
        //  break;
      }
      this.errorMsg = {
        ...this.errorMsg,
        [ctrl]: message,
      };
      this.cdr.detectChanges();
      return message;
    } catch (e) {}
  }

  resetForm() {
    if (this.pageMode == "NEW") {
      this.schedule_form = JSON.parse(this.clearScale);
      this.errorMsg = JSON.parse(this.clearErr);
    }
  }

  async onSubmit() {
    try {
      let erros: any = [
        "schedule_title",
        "schedule_type",
        "schedule_start_dt",
        "schedule_end_dt",
        "capacity",
        "venue_id",
      ];
      // Department has no field on the form (commented out) and Attendance Type is a TRAINING field:
      // validating them for every type blocked every VACCINATION / AUDIT / MEETING save.
      delete this.errorMsg["department_id"];
      if (this.selectedScheduleType != "TRAINING") delete this.errorMsg["attendance_type_id"];

      if (this.selectedScheduleType == "AUDIT") {
        erros.push(
          "reference_id",
          "audit_type_id",
          "audit_location_id",
          "auditor_id",
        );
      }

      if (this.selectedScheduleType == "TRAINING") {
        erros.push(
          "reference_id",
          "training_id",
          "mode_of_training",
          "attendance_type_id",
          "participants_fb_id",
        );
      }

      if (this.selectedScheduleType == "VACCINATION") {
        erros.push("reference_id");
      }

      if (this.selectedScheduleType == "MEETING") {
        erros.push("committee_id", "committee_type_id");
      }

      erros.forEach((ele: any) => {
        this.onGetErrorMsgs(ele, this.selectedScheduleType);
      });
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        return;
      }
      let scleSave = JSON.parse(JSON.stringify(this.schedule_form));
      // Edit of a non-VACCINATION schedule: common fields only (see onEditClicScaleClick).
      if (this.pageMode == "EDIT" && this.selectedScheduleType != "VACCINATION") {
        scleSave["schedule_type"] = null;
      }
      scleSave["schedule_start_dt"] = this._datePipe.transform(
        new Date(scleSave["schedule_start_dt"]),
        "yyyy-MM-dd",
      );
      scleSave["schedule_end_dt"] = this._datePipe.transform(
        new Date(scleSave["schedule_end_dt"]),
        "yyyy-MM-dd",
      );
      if (this.selectedScheduleType == "MEETING") {
        scleSave["committee_members"] = scleSave["committee_members"].map(
          (ele) => ele.committee_user_id,
        );
        scleSave["external_members"] = scleSave["external_members"].map(
          (ele) => ele.meeting_user_id,
        );
      }
      let cnfrmScle = await this._hqms.showConfirmMessage();
      if (cnfrmScle) {
        let saveSchComit: any = {};
        let formData = new FormData();
        if (this.selectedScheduleType == "MEETING") {
          saveSchComit = { ...scleSave };
          this.attachedFiles.forEach((file: any, index: number) => {
            formData.append("file", file.fileContent, file.fileName);
          });
          formData.append("data", JSON.stringify(saveSchComit));
        }

        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnSchedulesApi",
          this.selectedScheduleType == "MEETING" ? formData : scleSave,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "scle",
            severity: "success",
            summary: `${this.selectedScheduleType} Schedule`,
            detail: saveResult.message,
          });
          this.visible = false;
          await this.getScheduleListInfo();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "scle",
            severity: "warn",
            summary: `${this.selectedScheduleType} Schedule`,
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  openCreate(): void {
    this.editing.set(null);
    this.dialogVisible.set(true);
  }
  public effectiveMinDt: any = new Date();

  // Filter Dropdown
  public copyData: any = [];
  constructor(
    private _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
    public _datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    try {
      //  let getSrvrDt = await this._hqms.getServerDate('sDATE');
      //   let now = new Date(getSrvrDt);
      //   getSrvrDt = now.toISOString().split('T')[0] + 'T00:00';
      //   this.effectiveMinDt.set(getSrvrDt);

      let entyInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "commanEntityValuesGetApi",
        {
          entity_codes:
            "SCHEDULE_TYPE|VENUE|AUDIT_TYPE|MODEOFTRAINING|ATTENDANCETYPE|PARTICIPANTSFEEDBACK|COMMITTEETYPE|ENROLLMENT_SOURCE",
        },
      );
      if (entyInfo.status == 200) {
        this.scheduleTypeList = entyInfo.data["entities"]["SCHEDULE_TYPE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
        }));

        this.venueList = entyInfo.data["entities"]["VENUE"]["values"].map(
          (ele: any) => ({
            label: ele.display_value,
            value: ele.entity_value_id,
          }),
        );
        this.auditTypeList = entyInfo.data["entities"]["AUDIT_TYPE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.modeOfTrainingList = entyInfo.data["entities"]["MODEOFTRAINING"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.attendanceTypeList = entyInfo.data["entities"]["ATTENDANCETYPE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.feedbackList = entyInfo.data["entities"]["PARTICIPANTSFEEDBACK"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.committeeTypeList =
          entyInfo.data.entities.COMMITTEETYPE.values.map((ele: any) => ({
            label: ele.display_value,
            value: ele.entity_value_id,
            value_code: ele.value_code,
            sort_order: ele.sort_order,
          }));
        this.scheduleSrcList =
          entyInfo.data.entities.ENROLLMENT_SOURCE.values.map((ele: any) => ({
            label: ele.display_value,
            value: ele.entity_value_id,
            value_code: ele.value_code,
            sort_order: ele.sort_order,
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
        this.departmentList = getDeptmnts.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }));
      }

      let vccInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "VACCN_MASTR",
        },
      );
      if (vccInfo.status == 200) {
        this.vaccinationList = vccInfo.data.map((ele: any) => ({
          label: ele.vaccine_name,
          value: ele.vaccine_id,
        }));
      }

      let getFaculty: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTrainingFacultyDropdownGetApi",
        {
          faculty_type: "INTERNAL",
          is_faculty: false,
        },
      );
      if (getFaculty.status == 200) {
        this.auditorList = getFaculty.data
          .filter((f) => f.id != null)
          .map((ele: any) => ({
            label: ele.name,
            value: ele.id,
          }));
      }

      let locList: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "AUDIT_LOCATION",
        },
      );
      if (locList.status == 200) {
        this.locationList = locList.data.map((ele: any) => ({
          label: ele.location_name,
          value: ele.audit_location_id,
        }));
      }
      let trainingList: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "TRAINING",
        },
      );
      if (trainingList.status == 200) {
        this.trainingList = trainingList.data.map((ele: any) => ({
          label: ele.training_name,
          value: ele.training_id,
          // faculty_name: ele.faculty_name,
          // faculty_id: ele.faculty_id,
          // mode_of_training_id: ele.mode_of_training_id
        }));
      }
      await this.getScheduleListInfo();
    } catch (e) {}
  }

  async getScheduleListInfo() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.schedulesList = [];
      let flags: any = {
        page_no: pageNo,
        page_size: pageSize,
      };
      let totalCnt = 0;
      this.params = { ...flags };
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnSchedulesApi",
        this.params,
      );
      if (info.status == 200) {
        let sourcedData: any = [];
        this.stats.set({
          totalScales: info.data[0]["total_scales_cnt"] || 0,
          totalOptions: info.data[0]["total_options_cnt"] || 0,
          systemLocked: info.data[0]["total_system_locked_cnt"] || 0,
          scoringModel: info.data[0]["total_scoring_model_cnt"] || 0,
        });
        totalCnt = info.data[0]["total_row_cnt"];
        this.schedulesList = info.data.map((ct, index: number) => ({
          id: index + 1,
          ...ct,
        }));
        this.copyData = [...sourcedData];
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
        this.schedulesList.forEach((ele: any) => {
          if (ele.entity_id == entityMaster.entity_id) {
            ele["status"] = "Inactive";
          }
        });
      }
    }
  }

  async changePage(newDisplayPage: number) {
    this.pageNators.update((prev) => ({ ...prev, pageNo: newDisplayPage }));
    await this.schedulesList();
  }

  // "New Schedule" button: empty form (an earlier Edit must not stay in it).
  onNewClick() {
    this.pageMode = "NEW";
    this.selectedScheduleType = "";
    this.schedule_form = JSON.parse(this.clearScale);
    this.errorMsg = JSON.parse(this.clearErr);
    this.visible = true;
  }

  // 'YYYY-MM-DD' (fn_schedule_get schedule_start_date / schedule_end_date) → Date for p-datepicker.
  private toDate(value: any): Date | null {
    let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  // Edit a schedule from the list.
  // VACCINATION: every field incl. the vaccine; the campaign is kept (vaccination_campaign_id).
  // Other types: the common fields only — the list has no AUDIT / TRAINING / MEETING detail ids,
  // so their type part is not sent on save (fn_schedule_write would insert it again).
  async onEditClicScaleClick(edit: any) {
    this.pageMode = "EDIT";
    this._text = `Editing ${edit["schedule_title"] || ""}`;
    this.selectedScheduleType = "";
    this.schedule_form = JSON.parse(this.clearScale);
    let typeOpt: any = this.scheduleTypeList.find((op: any) => op.value === edit["schedule_type_id"]);
    if (typeOpt?.value_code == "VACCINATION") {
      await this.onScheduleTypeChange({ value: typeOpt.value }); // shows and loads the Vaccines field
      this.schedule_form["vaccination_campaign_id"] = edit["vaccination_campaign_id"] || null;
    }
    let status = String(edit["schedule_status"] ?? "");
    this.schedule_form = {
      ...this.schedule_form,
      action: "U",
      schedule_id: edit["schedule_id"],
      schedule_type: edit["schedule_type_id"] || null,
      schedule_title: edit["schedule_title"],
      schedule_start_dt: this.toDate(edit["schedule_start_date"]),
      schedule_end_dt: this.toDate(edit["schedule_end_date"]),
      capacity: edit["capacity"],
      venue_id: edit["venue_id"],
      reference_id: edit["reference_id"],
      status: ["", "True", "False"].includes(status) ? "Scheduled" : status,
      is_active: edit["is_active"] ?? true,
    };
    this.errorMsg = JSON.parse(this.clearErr);
    this.visible = true;
  }

  async onScheduleTypeChange(event: any) {
    this.schedule_form["action"] = "I";
    this.schedule_form["schedule_title"] = null;
    this.schedule_form["schedule_start_dt"] = null;
    this.schedule_form["schedule_end_dt"] = null;
    this.schedule_form["capacity"] = null;
    this.schedule_form["venue_id"] = null;
    this.schedule_form["reference_id"] = null;
    // Schedule status text (fn_schedule_write stores it as given; `true` was saved as "True").
    this.schedule_form["status"] = "Scheduled";
    this.schedule_form["is_active"] = true;
    this.errorMsg = JSON.parse(this.clearErr);
    let filterSlctdVal = this.scheduleTypeList.filter(
      (fl: any) => fl.value === event.value,
    );
    if (filterSlctdVal.length > 0) {
      this.selectedScheduleType = filterSlctdVal[0]["value_code"];
      this.schedule_form = {
        ...this.schedule_form,
        ...this.schedule_types[this.selectedScheduleType],
      };
      this.errorMsg = {
        ...this.errorMsg,
        ...Object.fromEntries(
          Object.entries(this.schedule_types[this.selectedScheduleType]).map(
            ([key, val]) => [key, val ? val : ""],
          ),
        ),
      };
      delete this.errorMsg["is_active"];
      let rsInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: `SCHEDULE_${filterSlctdVal[0]["value_code"]}`,
        },
      );
      if (rsInfo.status == 200) {
        this.referenceTypeList = rsInfo.data.map((ele: any) => ({
          label:
            this.selectedScheduleType != "TRAINING"
              ? ele.template_name
              : ele.training_name,
          value:
            this.selectedScheduleType != "TRAINING"
              ? ele.template_id
              : ele.training_id,
        }));
      }
    }
  }

  public trainingScrList: any = [];
  public slctdTrngSrc: any = "";
  async onTypeClick(ctrl) {
    try {
      let filtrData = this.scheduleSrcList.filter((f) => f.value === ctrl);
      if (filtrData.length > 0) {
        this.slctdTrngSrc = filtrData[0]["value_code"];
        this.trainingScrList = [];
        let getTypesList: any = await this._hqms.customGetApiCall(
          "GET",
          "fnTemplateListGet",
          {
            flag: filtrData[0]["value_code"],
          },
        );
        if (getTypesList.status == 200) {
          if (filtrData[0]["value_code"] == "DEPARTMENT") {
            this.trainingScrList = getTypesList.data.map((ele: any) => ({
              label: ele.department_name,
              value: ele.department_id,
            }));
          }
          if (filtrData[0]["value_code"] == "ROLE") {
            this.trainingScrList = getTypesList.data.map((ele: any) => ({
              label: ele.role_name,
              value: ele.role_id,
            }));
          }
        }
      }
    } catch (e) {}
  }

  async removeImage(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(
      `Remove ${doc.file_name}`,
    );
    if (confirm) {
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      }
    }
  }

  enableActiveImages() {
    return (
      this.schedule_form?.supporting_documents.length == 0 ||
      this.schedule_form?.supporting_documents.filter(
        (fl) => fl.is_active == false,
      ).length > 0
    );
  }

  async onFileSelect(
    thisFile: any,
    fileSelected: any,
    fileType: any,
    thisObj: any,
    maindata: any,
  ) {
    let selectedFiles: any = fileSelected.files;
    if (!selectedFiles || selectedFiles.length == 0) {
      return;
    }
    let uniqueFilesToPush: any = [];
    let duplicateFileNames: any = [];
    for (const newFile of selectedFiles) {
      let isDuplicate = this.schedule_form.supporting_documents.some(
        (exisingFile) =>
          exisingFile.file_name === newFile.name &&
          exisingFile.file_size === newFile.size,
      );
      if (isDuplicate) {
        duplicateFileNames.push(newFile.name);
      } else {
        uniqueFilesToPush.push({
          file_id: null,
          file_name: newFile.name,
          file_type: newFile.type, // "JPG"
          file_size: newFile.size,
          storage_path: null,
          fileSaveType: null,
          is_active: true,
          upload_file_name: newFile.name,
        });
      }
    }
    if (uniqueFilesToPush.length > 0) {
      this.schedule_form.supporting_documents = [
        ...this.schedule_form.supporting_documents,
        ...uniqueFilesToPush,
      ];
      this.schedule_form.supporting_documents.forEach((ele) => {
        this.attachedFiles.push({
          fileName: ele.file_name,
          fileContent: selectedFiles[0],
        });
      });
    }
    if (duplicateFileNames.length > 0) {
      this._hqms.hqmsToasterService({
        key: "rle",
        severity: "error",
        summary: "Duplicate",
        detail: "Files already exists",
      });
      return;
    }
  }

  async onCommitteeTypeClick(ctrl) {
    // get committee list on type
    try {
      this.schedule_form["reference_id"] = null;
      this.errorMsg["reference_id"] = "";
      this.chooseCommitteeList = [];
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "COMMITTEE",
          committee_type_id: ctrl,
        },
      );
      if (info.status == 200) {
        this.chooseCommitteeList = info.data.map((ele: any) => ({
          label: ele.committee_name,
          value: ele.committee_id,
          chair_person_id: ele.chair_person_id,
          chairperson: ele.chairperson,
          co_ordinator_id: ele.co_ordinator_id,
          co_ordinator: ele.co_ordinator,
          committee_members: ele.committee_members,
          co_chair_person_id: ele.co_chair_person_id,
          co_chair_person_name: ele.co_chair_person_name,
        }));
      }
    } catch (e) {}
  }

  onCommiteeChange(event: any) {
    try {
      let filterSltd = this.chooseCommitteeList.filter(
        (f: any) => f["value"] === event["value"],
      );
      if (filterSltd.length > 0) {
        let cmtInfo = filterSltd[0];
        this.schedule_form["chairperson"] = cmtInfo["chairperson"];
        this.schedule_form["co_chair_person_name"] =
          cmtInfo["co_chair_person_name"];
        this.schedule_form["committee_members"] = cmtInfo["committee_members"];
        this.schedule_form["co_ordinator"] = cmtInfo["co_ordinator"];
      }
    } catch (e) {}
  }

  public customFilter: RegExp = /^[a-zA-Z0-9]*$/;
  removeSpaces(event: Event) {
    const inputEle = event.target as HTMLInputElement;
    let value = inputEle.value;
    value = value.replace(/^\s+/, "");
    value = value.replace(/\s{2,}/g, " ");
    inputEle.value = value;
  }

  async getEmployees(flag: any, id: any) {
    try {
      // let getEmpsInfo: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      //   {
      //     "reference_type": flag,
      //     "reference_type_id": id,
      //     "flag": "EMPLOYEE"
      //   });
      // if (getEmpsInfo.status == 200) {
      //   getEmpsInfo.data.forEach((emp: any, index: number) => {
      //     let emps = {
      //       "attendee_id": null,
      //       "id": index + 1,//NO DB
      //       "is_selected": false, // NO DB
      //       "employee_name": emp.employee_name, // NO DB
      //       "employee_id": emp.employee_id,
      //       "attendee_status_id": null
      //     };
      //     if (flag == 'DEPT') {
      //       emps['department_id'] = id;
      //       emps['role_id'] = null;
      //     } else {
      //       emps['department_id'] = null;
      //       emps['role_id'] = id;
      //     };
      //     if (this.createScheduleTraining().basic_training != null) {
      //       emps['enrollment_source_id'] = this.createScheduleTraining().basic_training;
      //     };
      //     // if (this.copyEditAttendees.length > 0) {
      //     //   let filterParticipants = this.copyEditAttendees.filter((fl: any) => fl.employee_id == emps['employee_id']);
      //     //   if (filterParticipants.length > 0) {
      //     //     emps['is_selected'] = true;
      //     //     emps['attendee_id'] = filterParticipants[0]['attendee_id'];
      //     //     emps['attendee_status_id'] = filterParticipants[0]['attendee_status_id'];
      //     //   };
      //     // };
      //     tempArray.push(emps);
      //   });
      //   // this.attendees.set(tempArray);
      //   // this.copyEmployees.set(tempArray);
      // }
    } catch (e) {}
  }
}
