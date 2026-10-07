import { Component, OnInit, inject } from "@angular/core";
import { HqmsService } from "../../services/hqms.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Validations } from "../../validations";
import { SharedModule } from "../../shared/shared.module";
import { NospacesDirective } from "../../directives/nospaces.directive";
import {
  moveItemInArray,
  CdkDragDrop,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { FilterService, SelectItemGroup } from "primeng/api";
import { AutoComplete } from "primeng/autocomplete";
interface SearchEvent {
  originalEvent: Event;
  query: string;
}
@Component({
  selector: "app-approvalworkflow",
  standalone: true,
  imports: [SharedModule, FormsModule, DragDropModule],
  templateUrl: "./approvalworkflow.component.html",
})
export class ApprovalworkflowComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = "Apprvworkflw";
  public router = inject(Router);
  public pageMode = "NEW";
  public mdlsLst = [];
  public docLst = [];
  public locationList = [];
  public userList = [];
  public autoApprvdecList = [];
  public groupedModules: any = [];
  filterModules: any = [];
  public initRle: any = JSON.stringify({
    action: "I",
    approval_workflow_id: null,
    apprvl_workflw_name: null,
    module_id: null,
    document_id: null,
    description: null,
    is_active: true,
    users: null,
    approval_workflow_map: [],
  });
  public apprvlWrkFlow: any = { ...JSON.parse(this.initRle) };
  public errorMsg: any = {
    apprvl_workflw_name:"",
    description: "",
    module_id:"",
    document_id:"",
    users:''
  };

  dropSection(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      this.apprvlWrkFlow.approval_workflow_map,
      event.previousIndex,
      event.currentIndex,
    );
    this.apprvlWrkFlow.approval_workflow_map.forEach(
      (item: any, ind: number) => {
        item["approval_level"] = ind + 1;
      },
    );
  }

  constructor(
    private location: Location,
    public _hqms: HqmsService,
  ) {}

  goBack(): void {
    this.router.navigateByUrl("/approvalworkflowgrid");
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(
      this.FORM_NAME,
      ctrl,
      this.apprvlWrkFlow[ctrl],
    );
    this.errorMsg[ctrl] = result?.message || "";
  }

  onModuleChange(): void {
    this.apprvlWrkFlow.approval_workflow_map = [];
    this.apprvlWrkFlow.users = null;
    this.onModuleDocClick(this.apprvlWrkFlow.module_id);
  }

  onDocumentChange(): void {
    this.apprvlWrkFlow.approval_workflow_map = [];
    this.apprvlWrkFlow.users = null;
  }

  async ngOnInit() {
    let mdls: any = await this._hqms.customGetApiCall("GET", "fnScdrpdwnApi", {
      flag: "MODULE",
    }, true);
    if (mdls.status == 200) {
      this.mdlsLst = mdls.data.map((ele: any) => ({
        label: ele.module_name,
        value: ele.module_id,
      }));
    }
    await this.onUserLocList();
    let state = history.state;
    if (state?.data) {
      this.pageMode = state["data"]["mode"];
      if (this.pageMode != "NEW") {
        await this.getApprovlWrkflwInfo(state["data"]["id"]);
      }
    }
  }

  async onModuleDocClick(Ctrl: any) {
    let mdls: any = await this._hqms.customGetApiCall("GET", "fnScdrpdwnApi", {
      flag: "MODULE_DOC",
      module_id: Ctrl,
    });
    if (mdls.status == 200) {
      this.docLst = mdls.data.map((ele: any) => ({
        label: ele.document_name,
        value: ele.document_id,
      }));
    }
  }

  async getApprovlWrkflwInfo(approvlId: any) {

    try {
      let getApprovlInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnAppWkflApi",
        {
          approval_workflow_id: approvlId,
        },
      );
      if (getApprovlInfo.status == 200) {
        let editInfo = getApprovlInfo["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          await this.onModuleDocClick(editInfo["module_id"]);
          let userMap = {};
          editInfo["approval_workflow_map"].forEach((row: any) => {
            if (!userMap[row.user_id]) {
              userMap[row.user_id] = {
                is_select: true,
                approval_workflow_map_id: row.approval_workflow_map_id,
                user_id: row.user_id,
                user_role: this.groupedModules.filter(
                  (fl) => fl.user_id === row.user_id,
                )[0]["user_role"],
                display_name: row.user_display_name,
                workflow_loc_map: [],
                is_active: row.is_active,
                is_auto_approval: row.is_auto_approval,
              };
            }
            userMap[row.user_id].workflow_loc_map.push(row.loc_id);
            userMap[row.user_id].user_role.forEach((lc) => {
              if (lc.value == row.loc_id) {
                lc.is_active = true;
              }
            });
          });
          let formattedUsers = Object.values(userMap);
          this.apprvlWrkFlow = {
            action: "U",
            approval_workflow_id: editInfo["approval_workflow_id"],
            apprvl_workflw_name: editInfo["apprvl_workflw_name"],
            description: editInfo["description"],
            module_id: editInfo["module_id"],
            document_id: editInfo["document_id"],
            is_active: editInfo["is_active"],
            approval_workflow_map: formattedUsers,
            users: editInfo["users"],
            

          };
        }
      }
    } catch (e) {}
  }

  async onSubmitClick() {
    try {
      let wkflw = JSON.parse(JSON.stringify(this.apprvlWrkFlow));
      Object.keys(this.errorMsg).forEach((ctrl)=>this.onGetErrorMsgs(ctrl))
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: "appWkflw",
          severity: "warn",
          summary: "Approval Workflow",
          detail: "Check the errors",
        });
        return;
      }
      let lcnWseUsr: any = [];
      if (this.pageMode == "NEW") {
        wkflw.approval_workflow_map = wkflw.approval_workflow_map.filter(
          (usr: any) => usr.is_select == true,
        );
      }
      wkflw.approval_workflow_map.forEach((usrMppd) => {
        usrMppd.workflow_loc_map.forEach((lc) => {
          usrMppd.user_role.forEach((uRls) => {
            if (lc == uRls.value) {
              uRls.is_active = true;
            }
          });
        });
      });

      wkflw.approval_workflow_map.forEach((usrMppd, ind: number) => {
        if (this.pageMode == "NEW") {
          usrMppd.user_role = usrMppd.user_role.filter(
            (c) => c.is_active == true,
          );
        }
        usrMppd.user_role.forEach((lcn: any) => {
          let crtlcnWseUsr: any = {
            approval_level: usrMppd.approval_level,
            approval_workflow_map_id: usrMppd.approval_workflow_map_id,
            is_auto_approval: usrMppd.is_auto_approval,
            is_select: usrMppd.is_select,
            user_id: usrMppd.user_id,
            loc_id: lcn.value,
            is_active: lcn.is_active,
          };
          lcnWseUsr.push(crtlcnWseUsr);
        });
      });
      wkflw.approval_workflow_map = lcnWseUsr;
      delete wkflw.users;
      let cnfrmUsr = await this._hqms.showConfirmMessage();
      if (cnfrmUsr) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnAppWkflApi",
          wkflw,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "appWkflw",
            severity: "success",
            summary: "Approval Workflow",
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl("/approvalworkflowgrid");
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "appWkflw",
            severity: "warn",
            summary: "Approval Workflow",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  onAccRemove(ctrl, index: number) {
    if (this.pageMode == "NEW") {
      this.apprvlWrkFlow.approval_workflow_map.splice(index, 1);
    } else {
      ctrl.is_active = false;
    }
  }

  onClearClick() {
    this.apprvlWrkFlow = JSON.parse(this.initRle);
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ""));
  }

  async onUserLocList() {
    try {
      let info: any = await this._hqms.customGetApiCall("GET", "fnAppWkflApi", {
        action: "U",
      });
      if (info.status == 200) {
        this.groupedModules = info.data.map((ele: any, ind: number) => ({
          ...ele,
          approval_workflow_map_id: null,
          workflow_loc_map: [],
          is_active: true,
          is_select: true,
          is_auto_approval: false,
          user_role: ele.user_role.map((ele) => ({
            label: ele.location_name,
            value: ele.loc_id,
            is_active: false,
          })),
        }));
      }
    } catch (e) {}
  }

  filterGroupedModules(event: SearchEvent) {
    try {
      let query: any = event.query.toLowerCase();
      let filtered: any = [];
      if (this.groupedModules.length == 0) {
        return;
      }
      for (let optGrp of this.groupedModules) {
        let parentMatches = optGrp.display_name.toLowerCase().includes(query);
        if (parentMatches) {
          filtered.push({
            ...optGrp,
            label: optGrp.display_name,
          });
        }
      }
      this.filterModules = filtered;
    } catch (e) {}
  }

  onUserSelect(event: any) {
    try {
      if (event) {
        let getValues = event["value"];
        let findUsrExists = this.apprvlWrkFlow.approval_workflow_map.filter(
          (fl) => fl.user_id === getValues["user_id"] && fl.is_select == true,
        );
        if (findUsrExists.length > 0) {
          this._hqms.hqmsToasterService({
            key: "appWkflw",
            severity: "warn",
            summary: "Approval Workflow",
            detail: "User Already selected",
          });
          this.apprvlWrkFlow.users = null;
          return;
        }
        this.apprvlWrkFlow.approval_workflow_map.push(getValues);
        this.apprvlWrkFlow.approval_workflow_map.forEach(
          (item: any, ind: number) => {
            item["approval_level"] = ind + 1;
          },
        );
        this.apprvlWrkFlow.users = null;
      }
    } catch (e) {}
  }

  onUserSelection(event: any, accCntrl: any) {
    if (event.target.checked == false) {
      accCntrl.is_select = false;
      accCntrl.workflow_loc_map = [];
    }
  }
}
