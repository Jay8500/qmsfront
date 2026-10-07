import {
  Component,
  QueryList,
  signal,
  ViewChildren,
  OnInit,
  inject,
  computed,
} from "@angular/core";
import { HqmsService } from "../../services/hqms.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Validations } from "../../validations";
import { SharedModule } from "../../shared/shared.module";
import { NospacesDirective } from "../../directives/nospaces.directive";
import { FileUploadModule, FileUpload } from "primeng/fileupload";
import { FilterService, SelectItemGroup } from "primeng/api";

interface SearchEvent {
  originalEvent: Event;
  query: string;
}
@Component({
  selector: "app-user",
  imports: [FormsModule, SharedModule, FileUploadModule],
  templateUrl: "./user.component.html",
})
export class UserComponent implements OnInit {
  @ViewChildren("upCoverPage") upCoverPage!: FileUpload;
  public providerTypeList: any = [];
  public attachedFiles: any = [];
  public router = inject(Router);
  private validations = inject(Validations);
  readonly FORM_NAME = "user";
  public pageMode = "NEW";
  public depList: any = [];
  public desigList: any = [];
  public roleList: any = [];
  public locList: any = [];
  public crtAdt: any = JSON.stringify({
    action: "I", //INSERT
    user_id: null,
    title_cd: null,
    first_name: null,
    middle_name: null,
    last_name: null,
    display_name: null,
    gender_cd: null,
    father_name: null,
    dob: null,
    joining_dt: null,
    marital_status_cd: null,
    blood_group_cd: null,
    religion_cd: null,
    employment_type_id: null,
    signature: null,
    designation_id: null,
    dept_id: null,
    speciality_id: null,
    email_id: null,
    office_phone: null,
    mobile_phone: null,
    address1: null,
    address2: null,
    state_name: null,
    country_id: null,
    country_name: null,
    zipcode: null,
    fax_number: null,
    website_url: null,
    city_id: null,
    city_name: null,
    state_id: null,
    user_name: null,
    role_id: null,
    photo: [],
    area_name: null,
    is_active: true,
    employee_id: null,
    user_role: [],
    user_type:"NOT_INTEGRATED"
  });
  public newUser: any = signal({ ...JSON.parse(this.crtAdt) });
  public areaList: any = [];
  public filterModules: any = [];
  public empTypeList: any = [];
  public errorMsg: any = {
    title_cd: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    user_name: "",
    employment_type_id: "",
    dept_id: "",
    designation_id: "",
    email_id: "",
    mobile_phone: "",
    address1: "",
    area_name:''
  };

  constructor(
    private location: Location,
    public _hqms: HqmsService,
  ) {}

  goBack(): void {
    this.router.navigateByUrl("/nulist");
  }

  onGetErrorMsgs(ctrl: any, item?: any) {
    if (item) {
      const result = this.validations.validateField(
        this.FORM_NAME,
        ctrl,
        item[ctrl],
      );
      item[ctrl + "_error"] = result?.message || "";
    } else {
      const result = this.validations.validateField(
        this.FORM_NAME,
        ctrl,
        this.newUser()[ctrl],
      );
      this.errorMsg[ctrl] = result?.message || "";
    }
  }

  async ngOnInit() {
    let getDeptmnts: any = await this._hqms.customGetApiCall(
      "GET",
      "fnScdrpdwnApi",
      {
        flag: "DEPARTMENT",
      },
    );
    if (getDeptmnts.status == 200) {
      this.depList = getDeptmnts.data.map((ele: any) => ({
        label: ele.department_name,
        value: ele.department_id,
      }));
    }
    let designList: any = await this._hqms.customGetApiCall(
      "GET",
      "fnScdrpdwnApi",
      {
        flag: "DESIGNATION",
      },
    );
    if (designList.status == 200) {
      this.desigList = designList.data.map((ele: any) => ({
        label: ele.designation_name,
        value: ele.designation_id,
      }));
    }
    let empTypeInfo: any = await this._hqms.customGetApiCall(
      "GET",
      "commanEntityValuesGetApi",
      { entity_codes: "EMPTYPE" },
    );
    if (empTypeInfo.status == 200) {
      this.empTypeList = empTypeInfo.data.entities.EMPTYPE.values.map(
        (ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }),
      );
    }
    let getLoc: any = await this._hqms.customGetApiCall(
      "GET",
      "fnScdrpdwnApi",
      { flag: "LOC" },
    );
    if (getLoc.status == 200) {
      this.newUser().user_role = getLoc.data.map((ele: any) => ({
        is_select: true,
        label: ele.loc_name,
        loc_id: ele.loc_id,
        role_id: [],
        is_active: true,
      }));
    }
    let getRole: any = await this._hqms.customGetApiCall(
      "GET",
      "fnScdrpdwnApi",
      { flag: "ROLE" },
    );
    if (getRole.status == 200) {
      this.roleList = getRole.data.map((ele: any) => ({
        label: ele.role_name,
        value: ele.role_id,
      }));
    }
    let arInfo: any = await this._hqms.customGetApiCall(
      "GET",
      "fnScdrpdwnApi",
      {
        flag: "AREA",
      },
    );
    if (arInfo.status == 200) {
      this.areaList = arInfo.data.map((ele: any) => ({
        label: ele.area_name,
        value: ele.area_id,
        city_id: ele.city_id,
        city_name: ele.city_name,
        country_id: ele.country_id,
        country_name: ele.country_name,
        state_id: ele.state_id,
        state_name: ele.state_name,
        zipcode: ele.zipcode,
      }));
    }
    let state = history.state;
    if (state?.data) {
      this.pageMode = state["data"]["mode"];
      if (this.pageMode != "NEW") {
        await this.editUser(state["data"]["id"]);
      }
    }
  }

  async editUser(user_id: any) {
    try {
      let getAuditInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnUserApi",
        {
          user_id: user_id,
        },
      );
      if (getAuditInfo.status == 200) {
        let editInfo: any = getAuditInfo["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let user_role: any = [];
          let grpdDrta = editInfo["user_role"].reduce(
            (acc: any, current: any) => {
              if (!current.is_select) return acc;
              if (!acc[current.loc_id]) {
                acc[current.loc_id] = {
                  is_select: true,
                  label: current.location_name,
                  loc_id: current.loc_id,
                  role_id: [],
                };
              }
              acc[current.loc_id].role_id.push(current.role_id);
              return acc;
            },
            {},
          );
          user_role = Object.values(grpdDrta);
          this.sessionHistory.clear();
          this.newUser.set({
            action: "U", //INSERT
            user_id: editInfo.user_id,
            title_cd: editInfo.title_cd,
            first_name: editInfo.first_name,
            middle_name: editInfo.middle_name,
            last_name: editInfo.last_name,
            display_name: editInfo.display_name,
            gender_cd: editInfo.gender_cd,
            father_name: editInfo.father_name,
            dob: editInfo.dob,
            joining_dt: editInfo.joining_dt,
            marital_status_cd: editInfo.marital_status_cd,
            blood_group_cd: editInfo.blood_group_cd,
            religion_cd: editInfo.religion_cd,
            employment_type_id: editInfo.employment_type_id,
            signature: editInfo.signature,
            designation_id: editInfo.designation_id,
            dept_id: editInfo.dept_id,
            speciality_id: editInfo.speciality_id,
            email_id: editInfo.email_id,
            office_phone: editInfo.office_phone,
            mobile_phone: editInfo.mobile_phone,
            address1: editInfo.address1,
            address2: editInfo.address2,
            state_name: editInfo.state_name,
            country_id: editInfo.country_id,
            country_name: editInfo.country_name,
            zipcode: editInfo.zipcode,
            fax_number: editInfo.fax_number,
            website_url: editInfo.website_url,
            city_id: editInfo.city_id,
            city_name: editInfo.city_name,
            state_id: editInfo.state_id,
            user_name: editInfo.user_name,
            role_id: editInfo.role_id,
            photo: editInfo.photo,
            area_name: editInfo.area_name,
            is_active: editInfo.is_active,
            employee_id: editInfo.employee_id,
            user_role: user_role,
          });
          this.newUser().user_role.forEach((item) => {
            item.role_id.forEach((role: string) => {
              this.sessionHistory.add(
                `${item.loc_id}|${role}|${item.is_active}`,
              );
            });
          });
        }
      }
    } catch (e) {}
  }

  public sessionHistory = new Set<string>();

  onRoleChange(item: any) {
    if (item.role_id && item.role_id.length > 0) {
      item.role_id.forEach((rle: string) => {
        this.sessionHistory.add(`${item.loc_id}|${rle}|${item.is_active}`);
      });
    }
  }

  async onSubmitClick() {
    try {
      let usr = JSON.parse(JSON.stringify(this.newUser()));
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      this.newUser().user_role.forEach((item: any) => {
        if (item.is_select) this.onGetErrorMsgs("role_id", item);
      });
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      let hasRoleErrors = this.newUser().user_role.some(
        (item: any) => item.is_select && item["role_id_error"],
      );
      if (isValid || hasRoleErrors) {
        this._hqms.hqmsToasterService({
          key: "nu",
          severity: "warn",
          summary: "User",
          detail: "Check the errors",
        });
        return;
      }
      let transformLctns: any = [];
      this.sessionHistory.forEach((historyKey) => {
        let [loc_id, role_id, is_active] = historyKey.split("|");
        let currentLoc = usr.user_role.find(
          (item: any) => item.loc_id === loc_id,
        );
        let isCurrentlySlctd: any =
          currentLoc?.role_id?.includes(role_id) || false;
        transformLctns.push({
          is_select: isCurrentlySlctd,
          loc_id: loc_id,
          role_id: role_id,
          is_active: Boolean(is_active),
        });
      });
      usr.user_role = transformLctns.filter((actve) => actve.is_active == true); //selected locations
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(usr));
      let cnfrmUsr = await this._hqms.showConfirmMessage();
      if (cnfrmUsr) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnUserApi",
          formData,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "nu",
            severity: "success",
            summary: "User",
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl("/nulist");
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "nu",
            severity: "warn",
            summary: "User",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  onClearClick() {
    this.newUser.set({ ...JSON.parse(this.crtAdt) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ""));
  }

  public uploadError1 = false;

  async onCoverPageFileSelect(
    thisFile: any,
    fileSelected: any,
    fileType: any,
    thisObj: any,
    maindata: any,
  ) {
    this.uploadError1 = false;
    if (["application/pdf"].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: "faculty",
        severity: "warn",
        summary: "Profile Photo",
        detail: "Accepted Formats were .png/.jpeg",
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    this.uploadError1 = false;
    thisObj.photo.push({
      file_id: null,
      file_name: fileSelected.files[0].name,
      file_type: fileSelected.files[0].type, // "JPG"
      file_size: fileSelected.files[0].size,
      storage_path: null,
      fileSaveType: null,
      is_active: true,
      upload_file_name: fileSelected.files[0].name,
    });
    this.attachedFiles.push({
      fileName: fileSelected.files[0].name,
      fileContent: fileSelected.files[0],
    });
    thisFile.clear();
  }

  async removeCoverPageImage(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(
      `Remove ${doc.file_name}`,
    );
    if (confirm) {
      this.uploadError1 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      }
      this.upCoverPage.clear();
    }
  }

  filterGroupedAreas(event: SearchEvent) {
    try {
      let query: any = event.query.toLowerCase();
      let filtered: any = [];
      if (this.areaList.length == 0) {
        return;
      }
      for (let optGrp of this.areaList) {
        let parentMatches = optGrp.label.toLowerCase().includes(query);
        if (parentMatches) {
          filtered.push({
            label: optGrp.label,
            value: optGrp.value,
            city_id: optGrp.city_id,
            city_name: optGrp.city_name,
            country_id: optGrp.country_id,
            country_name: optGrp.country_name,
            state_id: optGrp.state_id,
            state_name: optGrp.state_name,
            zipcode: optGrp.zipcode,
          });
        }
      }
      this.filterModules = filtered;
    } catch (e) {}
  }

  onAreaSelect(event: any) {
    try {
      if (event) {
        let getValues = event["value"];
        this.newUser().city_name = getValues["city_name"];
        this.newUser().state_name = getValues["state_name"];
        this.newUser().country_name = getValues["country_name"];
        this.newUser().city_id = getValues["city_id"];
        this.newUser().state_id = getValues["state_id"];
        this.newUser().country_id = getValues["country_id"];
        this.newUser().zipcode = getValues["zipcode"];
        this.newUser().area_name = getValues["label"];
      }
    } catch (e) {}
  }

  onSelectClick(event: any, scltdRle) {
    if (event.target.checked == false) {
      scltdRle.role_id = [];
    }
  }
}
