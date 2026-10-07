import { Component, signal, OnInit, inject } from "@angular/core";
import { HqmsService } from "../../services/hqms.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Validations } from "../../validations";
import { SharedModule } from "../../shared/shared.module";
import { NospacesDirective } from "../../directives/nospaces.directive";
@Component({
  selector: "app-passwordpolicy",
  imports: [FormsModule, SharedModule],

  templateUrl: "./passwordpolicy.component.html",
  styleUrl: "./passwordpolicy.component.scss",
})
export class PasswordpolicyComponent implements OnInit {
  public providerTypeList: any = [];
  public router = inject(Router);
  private validations = inject(Validations);
  readonly FORM_NAME = "PASSWORDPOLICY";
  public pageMode = "NEW";
  public crtAdt: any = JSON.stringify({
    action: "I", //INSERT
    passw_policy_id: null,
    passw_policy_min_len: null,
    passw_policy_special_char_len: null,
    passw_policy_min_capital_letters_len: null,
    passw_policy_min_small_letters_len: null,
    passw_policy_digits_min_len: null,
    passw_expiry_days: null,
    passw_remainder_days: null,
    remarks: null,
    is_active: true,
  });
  public ppMstr: any = signal({ ...JSON.parse(this.crtAdt) });
  public errorMsg: any = {
    passw_policy_min_len: "",
    passw_policy_special_char_len: "",
    passw_policy_min_capital_letters_len: "",
    passw_policy_min_small_letters_len: "",
    passw_policy_digits_min_len: "",
    passw_expiry_days: "",
    passw_remainder_days: "",
    remarks:""
  };

  constructor(
    private location: Location,
    public _hqms: HqmsService,
  ) {}

  goBack(): void {
    this.location.back();
  }

  onGetErrorMsgs(ctrl: any) {
    let result = this.validations.validateField(
      this.FORM_NAME,
      ctrl,
      this.ppMstr()[ctrl],
    );
    this.errorMsg[ctrl] = result?.message || "";
  }

  async ngOnInit() {
    await this.getPasswordPlcy();
  }

  async getPasswordPlcy() {
    try {
      let pplcyInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnPwdPlcyApi",
        {},
      );
      if (pplcyInfo.status == 200) {
        let editInfo = pplcyInfo["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.pageMode = "Edit";
          this.ppMstr.set({
            action: "U",
            passw_policy_id: editInfo.passw_policy_id,
            passw_policy_min_len: editInfo.passw_policy_min_len,
            passw_policy_special_char_len:
              editInfo.passw_policy_special_char_len,
            passw_policy_min_capital_letters_len:
              editInfo.passw_policy_min_capital_letters_len,
            passw_policy_min_small_letters_len:
              editInfo.passw_policy_min_small_letters_len,
            passw_policy_digits_min_len: editInfo.passw_policy_digits_min_len,
            passw_expiry_days: editInfo.passw_expiry_days,
            passw_remainder_days: editInfo.passw_remainder_days,
            remarks: editInfo.remarks,
          });
        }
      }
    } catch (e) {}
  }

  async onSubmitClick() {
    try {
      this.errorMsg.forEach((ctrl:any) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: "Password Policy",
          severity: "warn",
          summary: "Password Policy",
          detail: "Check the errors",
        });
        return;
      }
      let gePrvdr = JSON.parse(JSON.stringify(this.ppMstr()));
      let confirmAssessment = await this._hqms.showConfirmMessage();
      if (confirmAssessment) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnPwdPlcyApi",
          gePrvdr,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "provider",
            severity: "success",
            summary: "Password Policy",
            detail: saveResult.message,
          });
          await this.ngOnInit();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "provider",
            severity: "warn",
            summary: "Password Policy",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }
}
