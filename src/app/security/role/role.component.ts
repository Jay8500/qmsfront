import { Component, signal, OnInit, inject, computed } from "@angular/core";
import { HqmsService } from "../../services/hqms.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Validations } from "../../validations";
import { SharedModule } from "../../shared/shared.module";
import { NospacesDirective } from "../../directives/nospaces.directive";
@Component({
  selector: "app-role",
  imports: [FormsModule, SharedModule],
  templateUrl: "./role.component.html",
})
export class RoleComponent implements OnInit {
  public providerTypeList: any = [];
  public router = inject(Router);
  private validations = inject(Validations);
  readonly FORM_NAME = "SEC_ROLE";
  public pageMode = "NEW";
  public initRle: any = JSON.stringify({
    action: "I",
    role_id: null,
    role_name: null,
    role_short_name: null,
    role_desc: null,
    is_active: true,
  });
  public roleMstr: any = { ...JSON.parse(this.initRle) };
  public errorMsg: any = {
    role_name: "",
    role_short_name: "",
    role_desc: "",
  };

  constructor(
    private location: Location,
    public _hqms: HqmsService,
  ) {}

  goBack(): void {
    this.router.navigateByUrl("/rolelist");
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(
      this.FORM_NAME,
      ctrl,
      this.roleMstr[ctrl],
    );
    this.errorMsg[ctrl] = result?.message || "";
  }

  async ngOnInit() {
    let state = history.state;
    if (state?.data) {
      this.pageMode = state["data"]["mode"];
      if (this.pageMode != "NEW") {
        await this.getRlInfo(state["data"]["id"]);
      }
    }
  }

  async getRlInfo(rlId: any) {
    try {
      let getAuditInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnRoleApi",
        {
          role_id: rlId,
        },
      );
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.roleMstr = {
            action: "U",
            role_id: editInfo["role_id"],
            role_name: editInfo["role_name"],
            role_short_name: editInfo["role_short_name"],
            role_desc: editInfo["role_desc"],
            is_active: editInfo["is_active"],
          };
        }
      }
    } catch (e) {}
  }

  async onSubmitClick() {
    try {
      ["role_name", "role_short_name", "role_desc"].forEach((ctrl) =>
        this.onGetErrorMsgs(ctrl),
      );
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Role",
          detail: "Check the errors",
        });
        return;
      }
      let rlSve = JSON.parse(JSON.stringify(this.roleMstr));
      let cnfrmRle = await this._hqms.showConfirmMessage();
      if (cnfrmRle) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnRoleApi",
          rlSve,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "success",
            summary: "Role",
            detail: saveResult.message,
          });
          this.router.navigateByUrl("/rolelist");
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "warn",
            summary: "Role",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  onClearClick() {}
}
