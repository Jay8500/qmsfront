import {
  Component,
  signal,
  OnInit,
  inject,
  Input,
  Output,
} from "@angular/core";
import { Location } from "@angular/common";
import { HqmsService } from "../../services/hqms.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedModule } from "../../shared/shared.module";
import { CommonModule } from "@angular/common";
import { Validations } from "../../validations";

interface createAccessbyUser {
  id: any;
  loc_id: null;
  user_id: null;
  module_id: null;
}
@Component({
  selector: "app-accessbyuser",
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: "./accessbyuser.component.html",
})
export class AccessbyuserComponent implements OnInit {
  public FORM_NAME = "ACCESSBYROLEUSER";
  public validations = inject(Validations);
  public pageMode = "NEW";
  public router = inject(Router);
  public locList: any = [];
  public userList: any = [];
  public moduleList: any = [];
  public user_access: createAccessbyUser[] = [];
  public accesbyUser: any = JSON.stringify({
    action: "I",
    loc_id: null,
    user_id: null,
    module_id: null,
    // "user_access": []
  });
  // public user_access: any = [];
  public createAccessbyUser = signal<createAccessbyUser>({
    ...JSON.parse(this.accesbyUser),
  });
  public errorMsg: any = {
    loc_id: "",
    user_id: "",
    module_id: "",
  };
  onLocChange() {
    this.user_access = [];
    this.createAccessbyUser().user_id = null;
    this.createAccessbyUser().module_id = null;
  }

  onUserChange() {
    this.user_access = [];
    this.createAccessbyUser().module_id = null;
  }

  async onModuleChange() {
    this.user_access = [];
    if (this.createAccessbyUser().module_id != null) {
      await this.getSelectedDoc();
    }
  }

  constructor(
    private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    try {
      let getLoc: any = await this._hqms.customGetApiCall(
        "GET",
        "fnScdrpdwnApi",
        { flag: "LOC" },
      );
      if (getLoc.status == 200) {
        this.locList = getLoc.data.map((ele: any) => ({
          label: ele.loc_name,
          value: ele.loc_id,
        }));
      }
      let getUser: any = await this._hqms.customGetApiCall(
        "GET",
        "fnScdrpdwnApi",
        { flag: "USERS" },
      );
      if (getUser.status == 200) {
        this.userList = getUser.data.map((ele: any) => ({
          label: ele.display_name,
          value: ele.user_id,
        }));
      }
      let getModule: any = await this._hqms.customGetApiCall(
        "GET",
        "fnScdrpdwnApi",
        { flag: "MODULE" },
      );
      if (getModule.status == 200) {
        this.moduleList = getModule.data.map((ele: any) => ({
          label: ele.module_name,
          value: ele.module_id,
        }));
      }
      let state = history.state;
      this.pageMode = state["data"]["mode"];
      if (this.pageMode != "NEW") {
        // await this.editAccessbyUser(state['data']['id'])
      }
      // await this.getSelectedDoc();
    } catch (e) {}
  }

  async getSelectedDoc() {
    try {
      this.user_access = [];
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnAccessUserApi",
        {
          module_id: this.createAccessbyUser().module_id,
          location_id: this.createAccessbyUser().loc_id,
          user_id: this.createAccessbyUser().user_id,
        },
      );
      if (info.status == 200) {
        this.user_access = info.data[0]["user_access"].map((ele, index) => ({
          ...ele,
          select: ele.user_doc_access_id != null,
          id: index,
        }));
      }
    } catch (e) {}
  }

  onGetErrorMsgs(ctrl: any) {
    let result = this.validations.validateField(
      this.FORM_NAME,
      ctrl,
      this.createAccessbyUser()[ctrl],
    );
    this.errorMsg[ctrl] = result?.message || "";
  }
  async onSubmitClick() {
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid) {
      this._hqms.hqmsToasterService({
        key: "appWkflw",
        severity: "warn",
        summary: "Access User",
        detail: "Check the errors",
      });
      return;
    }
    let copyRlAccs = JSON.parse(JSON.stringify(this.user_access));
    if (copyRlAccs.length == 0) {
      this._hqms.hqmsToasterService({
        key: "accessuser",
        severity: "warn",
        summary: "Atleast select module",
        detail: "Check the errors",
      });
      return;
    }
    if (copyRlAccs.filter((cd) => cd.select == true).length == 0) {
      this._hqms.hqmsToasterService({
        key: "accessuser",
        severity: "warn",
        summary: "Atleast select a Document",
        detail: "Check the errors",
      });
      return;
    }
    let rlAcs = {
      action: "I",
      user_access: copyRlAccs.map((c: any) => ({
        ...c,
        loc_id: this.createAccessbyUser().loc_id,
        user_id: this.createAccessbyUser().user_id,
        module_id: this.createAccessbyUser().module_id,
        org_id: this._hqms.getOrgId(),
      })),
    };
    let confirmAccessbyUser = await this._hqms.showConfirmMessage();
    if (confirmAccessbyUser) {
      var saveResult: any = await this._hqms.customSaveApiCall(
        "POST",
        "fnAccessUserApi",
        rlAcs,
      );
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: "accessuser",
          severity: "success",
          summary: "Access by User",
          detail: saveResult.message,
        });
        this.onClearClick();
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          key: "accessuser",
          severity: "warn",
          summary: "Access by User",
          detail: saveResult.message,
        });
      }
    }
  }

  onClearClick() {
    this.user_access = [];
    this.createAccessbyUser.set({ ...JSON.parse(this.accesbyUser) });
  }

  onSelectClick(event: any, selectedDocInfo: any) {
    selectedDocInfo.access_add = event.target.checked;
    selectedDocInfo.access_view = event.target.checked;
    selectedDocInfo.access_mod = event.target.checked;
    selectedDocInfo.access_del = event.target.checked;
    selectedDocInfo.access_qry = event.target.checked;
    selectedDocInfo.access_app = event.target.checked;
    selectedDocInfo.access_print = event.target.checked;
    selectedDocInfo.access_exp = event.target.checked;
    selectedDocInfo.dms_upload = event.target.checked;
    selectedDocInfo.dms_view = event.target.checked;
  }

  public selecteAll: boolean = false;
  onSelectAll(event: any) {
    this.user_access.forEach((ele: any) => {
      ele.select = event.target.checked;
      this.onSelectClick(event, ele);
    });
  }
}
