import { Component, signal, OnInit, inject, Input, Output } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import {Validations} from '../../validations'

interface createAccessbyRole {
  "id":null,
  "action": any,
  loc_id: null,
  role_id: null,
module_id: null,
  // "role_access": []
};
@Component({
  selector: 'app-accessbyrole',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './accessbyrole.component.html',
})
export class AccessbyroleComponent implements OnInit {
  public FORM_NAME = 'ACCESSBYROLEUSER'
  public validations=inject(Validations)
  public pageMode = "NEW";
  public router = inject(Router);
  public locList: any = [];
  public roleList: any = [];
  public moduleList: any = [];
  public role_access: createAccessbyRole[] = [];
  public accesbyRole: any = JSON.stringify({
    "action": "I",
    loc_id: null,
    role_id: null,
    module_id: null,
    // "role_access": []
  });
  // public role_access: any = [];
  public createAccessbyRole = signal<createAccessbyRole>({ ...JSON.parse(this.accesbyRole) });
  public errorMsg:any={
    loc_id:'',
    role_id:'',
    module_id:''
  }
  onLocChange() {
    this.role_access = [];
    this.createAccessbyRole().role_id = null;
    this.createAccessbyRole().module_id = null;
  }
  onGetErrMsg(ctrl:any){
    let result=this.validations.validateField(this.FORM_NAME,ctrl,this.createAccessbyRole()[ctrl]);
    this.errorMsg[ctrl]=result?.message || ""
  }

  onRoleChange() {
    this.role_access = [];
    this.createAccessbyRole().module_id = null;
  }

  async onModuleChange() {
    this.role_access = [];
    if (this.createAccessbyRole().module_id != null) {
      await this.getSelectedDoc();
    };
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      let getLoc: any = await this._hqms.customGetApiCall('GET', 'fnScdrpdwnApi',
        { "flag": "LOC" });
      if (getLoc.status == 200) {
        this.locList = getLoc.data.map((ele: any) => ({
          label: ele.loc_name,
          value: ele.loc_id
        }))
      };
      let getRole: any = await this._hqms.customGetApiCall('GET', 'fnScdrpdwnApi',
        { "flag": "ROLE" });
      if (getRole.status == 200) {
        this.roleList = getRole.data.map((ele: any) => ({
          label: ele.role_name,
          value: ele.role_id
        }))
      };
      let getModule: any = await this._hqms.customGetApiCall('GET', 'fnScdrpdwnApi',
        { "flag": "MODULE" });
      if (getModule.status == 200) {
        this.moduleList = getModule.data.map((ele: any) => ({
          label: ele.module_name,
          value: ele.module_id
        }))
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        // await this.editAccessbyRole(state['data']['id'])
      };
      // await this.getSelectedDoc();
    } catch (e) { };
  }

  async getSelectedDoc() {
    try {
      this.role_access = [];
      let info: any = await this._hqms.customGetApiCall('GET', 'fnAccessRoleApi',
        {
          "module_id": this.createAccessbyRole().module_id,
          "location_id": this.createAccessbyRole().loc_id,
          "role_id": this.createAccessbyRole().role_id,
        });
      if (info.status == 200) {
        this.role_access = info.data[0]['role_access'].map((ele,index:number) => ({ ...ele, select: ele.role_doc_access_id != null, id: index}))
      };
    } catch (e) { };
  }

  async onSubmitClick() {
    let copyRlAccs = JSON.parse(JSON.stringify(this.role_access));
    Object.keys(this.errorMsg).forEach((ctrl)=>{this.onGetErrMsg(ctrl)})
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid) {
      this._hqms.hqmsToasterService({
        key: "appWkflw",
        severity: "warn",
        summary: "Access By User",
        detail: "Check the errors",
      });
      return;
    }
    if (copyRlAccs.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'accessrole',
        severity: 'warn',
        summary: 'Atleast select module',
        detail: 'Check the errors',
      });
      return;
    };

    if (copyRlAccs.filter((cd) => cd.select == true).length == 0) {
      this._hqms.hqmsToasterService({
        key: 'accessrole',
        severity: 'warn',
        summary: 'Atleast select a Document',
        detail: 'Check the errors',
      });
      return;
    };
    let rlAcs = {
      action: "I",
      "role_access": copyRlAccs.filter((cd) => cd.select == true).map((c: any) => ({
        ...c,
        loc_id: this.createAccessbyRole().loc_id,
        role_id: this.createAccessbyRole().role_id,
        module_id: this.createAccessbyRole().module_id,
        org_id: this._hqms.getOrgId(),
      }))
    };
    let confirmAccessbyRole = await this._hqms.showConfirmMessage();
    if (confirmAccessbyRole) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAccessRoleApi", rlAcs);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: 'accessrole',
          severity: 'success',
          summary: 'Access by Role',
          detail: saveResult.message,
        });
        this.onClearClick();
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          key: 'accessrole',
          severity: 'warn',
          summary: 'Access by Role',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.role_access = [];
    this.createAccessbyRole.set({ ...JSON.parse(this.accesbyRole) });
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
  public selecteAll:boolean = false; 
  onSelectAll(event:any){
      this.role_access.forEach((ele:any )=> {
      ele.select = event.target.checked;
       this.onSelectClick(event,ele)
      })
  }
}
