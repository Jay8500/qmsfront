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
import {
  moveItemInArray,
  CdkDragDrop,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { SharedModule } from "../../shared/shared.module";
import { NospacesDirective } from "../../directives/nospaces.directive";
import { FileUploadModule, FileUpload } from "primeng/fileupload";
import * as XLSX from "xlsx";
interface mdMdle {
  section_documents: any;
  module: any;
  is_active: any;
  track_trash: any;
}
@Component({
  selector: "app-mdsm",
  imports: [FormsModule, SharedModule, FileUploadModule, DragDropModule],
  templateUrl: "./mdsm.component.html",
  styleUrl: "./mdsm.component.scss",
})
export class MdsmComponent implements OnInit {
  @ViewChildren("postAss") postAssess!: FileUpload;
  @ViewChildren("preAssess") preAssess!: FileUpload;
  public attachedFiles: any = [];
  public router = inject(Router);
  readonly FORM_NAME = "AuditAssignmentForm";
  public pageMode = "NEW";
  public crtAdt: any = JSON.stringify({
    action: "I", //INSERT
    module_id: null,
    section_documents: [],
    module: [],
    track_trash: [],
  });
  public createMdSub: any = signal<mdMdle>({ ...JSON.parse(this.crtAdt) });
  public uploadError1 = false;
  public mdleAdd = signal({
    id: this.createMdSub().module.length + 1,
    module_id: null,
    module_name: null,
    sec_order: this.createMdSub().module.length + 1,
    is_active: true,
    is_edit_click: false,
    is_selected: false,
    sub_module: [],
    add: "M",
    module_icon: null,
    module_route: null,
  });
  public qstnsAdd = signal({
    id: this.createMdSub().module.length + 1,
    sub_module_id: null,
    sub_module_name: null,
    module_id: null,
    ques_order: 0,
    is_edit_click: false,
    sub_module_icon: null,
    sub_module_route: null,
  });
  public mdleCnt = 0;
  public subMdCnt: number = 0;

  constructor(
    private location: Location,
    public _hqms: HqmsService,
  ) {}

  goBack(): void {
    this.router.navigateByUrl("/modulelist");
  }

  async ngOnInit() {
    let state = history.state;
    if (state?.data) {
      this.pageMode = state["data"]["mode"];
      if (this.pageMode != "NEW") {
        await this.edit(state["data"]["id"]);
      }
    }
  }

  async edit(module_id: any) {
    try {
      this.selectedMdle = null;
      let getAuditInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnModuleApi",
        {
          module_id: module_id,
        },
      );
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let qstnDoc =
            editInfo["audit_quest_file_ids"].length > 0
              ? editInfo["audit_quest_file_ids"]
              : [];
          let sctnDoc =
            editInfo["audit_sect_file_ids"].length > 0
              ? editInfo["audit_sect_file_ids"].map((ele, index: number) => ({
                  id: index + 1,
                  ...ele,
                  module_id: ele.module_id,
                }))
              : [];
          this.createMdSub.set({
            action: "U",
            section_documents: sctnDoc,
            module: editInfo["module"].map((sctn: any, index: number) => ({
              ...sctn,
              id: index + 1,
              is_edit_click: false,
              is_selected: false,
              sub_module: sctn.sub_module.map((qstn: any, qstnIn: number) => ({
                ...qstn,
                is_edit_click: false,
                is_selected: false,
              })),
            })),
            track_trash: [],
            is_active: editInfo["is_active"],
          });
          this.getMdleCnt();
          this.getSubMdCnt();
        }
      }
    } catch (e) {}
  }

  async onBulkUploadClick(
    thisFile: any,
    fileSelected: any,
    fileType: any,
    thisObj: any,
    maindata: any,
  ) {
    this.createMdSub().section_documents = [];
    if (this.pageMode == "NEW") {
      thisObj["module"] = [];
    } else {
      thisObj["module"].forEach((ele) => {
        ele.is_active = false;
      });
    }
    this.selectedMdle = null;
    this.uploadError1 = false;
    if (
      ![
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(fileSelected.files[0].type)
    ) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: "audit",
        severity: "warn",
        summary: "Module & Submodules",
        detail: "Accepted Formats were .xlsx",
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    thisObj.section_documents.push({
      file_id: null,
      file_name: fileSelected.files[0].name,
      file_type: "xlsx", // fileSelected.files[0].type, // "JPG"
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
    let splitForXtension = fileSelected.files[0].name.split(".");
    if (splitForXtension[1] == "xlsx") {
      var uploadFileName = `${fileSelected.files[0].name}`;
      this.attachedFiles.push({
        fileName: uploadFileName,
        fileContent: fileSelected.files[0],
      });
      let workBook: any = null;
      let jsonData = null;
      const reader = new FileReader();
      const file = fileSelected.files[0];
      reader.onload = (event) => {
        const data = reader.result;
        workBook = XLSX.read(data, { type: "binary", cellDates: true });
        jsonData = workBook.SheetNames.reduce((initial: any, name: any) => {
          const sheet = workBook.Sheets[name];
          initial[name] = XLSX.utils.sheet_to_json(sheet, { raw: false });
          return initial;
        }, {});
        const dataString = JSON.stringify(jsonData);
        let xlData = JSON.parse(dataString);
        let keys = Object.keys(xlData);
        if (keys.length > 0) xlData = xlData[keys[0]];
        if (xlData.length == 0) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "warn",
            summary: "Bulk Upload",
            detail: "Module with Questions required",
          });
          return;
        }
        if (
          !xlData[0].hasOwnProperty("Module") &&
          !xlData[0].hasOwnProperty("MO") &&
          !xlData[0].hasOwnProperty("SMO") &&
          !xlData[0].hasOwnProperty("Sub Module")
        ) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "warn",
            summary: "Bulk Upload",
            detail: "Required Section/ Question attributes",
          });
          return;
        }
        if (
          this.createMdSub().module.filter((fl) => fl.add == "M").length == 0
        ) {
          this.createMdSub().module = [];
        }
        let getUniqsSections = [
          ...new Map(xlData.map((item) => [item["Module"], item])).values(),
        ];
        let sectQstnStrcuture: any = [];
        if (getUniqsSections.length > 0) {
          getUniqsSections.sort(
            (a: any, b: any) => parseInt(a["MO"]) - parseInt(b["MO"]),
          );
          getUniqsSections.forEach((ele: any, index: number) => {
            let sectionsObj: any = {
              id: index + 1,
              module_id: null,
              module_name: ele["Module"],
              sec_order: parseInt(ele["MO"]),
              is_active: true,
              is_edit_click: false,
              is_selected: false,
              add: "B",
              module_icon: ele["Mod Icon"],
              module_route: ele["Mod Route"],
              sub_module: [],
            };
            let findQstnScns = xlData.filter(
              (qstn: any) => qstn["Module"] == ele["Module"],
            );
            if (findQstnScns.length > 0) {
              if (findQstnScns[0]["Sub Module"] != "N") {
                findQstnScns.sort(
                  (a: any, b: any) => parseInt(a["SMO"]) - parseInt(b["SMO"]),
                );
                findQstnScns.forEach((sbmdle: any) => {
                  let qstns = {
                    sub_module_id: null,
                    sub_module_name: sbmdle["Sub Module"],
                    sub_module_icon: sbmdle["Sub Icon"],
                    sub_module_route: sbmdle["Sub Route"],
                    module_id: null,
                    ques_order: parseInt(sbmdle["SMO"]),
                    is_active: true,
                    is_edit_click: false,
                  };
                  sectionsObj["sub_module"].push(qstns);
                });
              }
            }
            sectQstnStrcuture.push(sectionsObj);
          });
          let fetchUploadedSecOrder = sectQstnStrcuture.length;
          this.createMdSub()["module"].forEach(
            (sc) => (sc.is_selected = false),
          );
          this.createMdSub()["module"] = this.createMdSub()
            ["module"].concat(...sectQstnStrcuture)
            .map((sctns, indx) => ({
              ...sctns,
              is_active: true,
              is_selected: false,
              sec_order: fetchUploadedSecOrder + 1,
            }))
            .sort((a: any, b: any) => a.sec_order - b.sec_order);
          this.getMdleCnt();
          this.getSubMdCnt();
        }
      };
      reader.readAsBinaryString(file);
    }

    thisFile.clear();
  }

  async onBulkUploadRemoveClick(doc: any, imgIndex: any) {
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
        this.createMdSub().section_documents = [];
        this.createMdSub().module = [];
        this.attachedFiles.splice(thisFileIndex, 1);
        this.subMdCnt = 0;
        this.mdleCnt = 0;
      }
      // this.preAssess.clear();
    }
  }

  onMdleAddClick() {
    this.createMdSub().module.forEach((ele) => (ele.is_selected = false));
    this.selectedMdle = null;
    let sctns = JSON.parse(JSON.stringify(this.mdleAdd()));
    this.createMdSub().module.push(sctns);
    this.mdleAdd.set({
      id: this.createMdSub().module.length + 1,
      module_id: null,
      module_name: null,
      sec_order: this.createMdSub().module.length + 1,
      is_active: true,
      is_edit_click: false,
      is_selected: false,
      sub_module: [],
      add: "M",
      module_icon: null,
      module_route: null,
    });
    this.getMdleCnt();
  }
  public selectedMdle: any = null;

  onSubMdleAddClick() {
    let atleastSectnRqd = this.createMdSub().module.filter(
      (sec) => sec.is_active == true,
    );
    if (atleastSectnRqd.length == 0) {
      this._hqms.hqmsToasterService({
        key: "audit",
        severity: "warn",
        summary: "Module",
        detail: "Aleast Module is required for mapping sub_module",
      });
      return;
    }
    let checkActiveSec = atleastSectnRqd.filter(
      (activeSec) => activeSec.is_selected == true,
    );
    if (checkActiveSec.length == 0) {
      this._hqms.hqmsToasterService({
        key: "audit",
        severity: "warn",
        summary: "Module",
        detail: "Select Module is required for mapping sub_module",
      });
      return;
    }
    let qstns = JSON.parse(JSON.stringify(this.qstnsAdd())); // MANUAL ADDED QUESTIONS OBJECT
    qstns["ques_order"] = this.selectedMdle.sub_module.length + 1;
    this.selectedMdle.sub_module.push(qstns);
    this.qstnsAdd.set({
      id: this.createMdSub().module.length + 1,
      sub_module_id: null,
      sub_module_name: null,
      module_id: null,
      ques_order: 0,
      is_edit_click: false,
      sub_module_icon: null,
      sub_module_route: null,
    });
    this.getSubMdCnt();
  }

  getSubMdCnt() {
    this.subMdCnt = this.createMdSub().module.reduce(
      (sum, sec) =>
        sum + sec.sub_module.filter((sc) => sc.is_active == true).length,
      0,
    );
  }

  async onSubmitClick() {
    try {
      if (this.createMdSub().module.length == 0) {
        this._hqms.hqmsToasterService({
          key: "audit",
          severity: "warn",
          summary: "Module",
          detail: "Module are required.",
        });
        return;
      }
      let getMdSubm = JSON.parse(JSON.stringify(this.createMdSub()));

      if (this.pageMode == "NEW") {
        getMdSubm["module"] = getMdSubm["module"]
          .filter((ele: any) => ele.is_active !== false)
          .map((Module, sIdx) => {
            let newSectionOrdr = sIdx + 1;
            return {
              ...Module,
              sec_order: newSectionOrdr,
              sub_module: Module.sub_module
                .filter((ele) => ele.is_active !== false)
                .map((qstn, qsIn) => ({ ...qstn, ques_order: qsIn + 1 })),
            };
          });
      } else {
        getMdSubm["module"] = getMdSubm["module"].filter(
          (ele: any) =>
            (ele.module_id != null && ele.is_active == true) ||
            (ele.module_id != null && ele.is_active == false) ||
            (ele.module_id == null && ele.is_active == true),
        );
        getMdSubm["module"].forEach((sc) => {
          sc["sub_module"].forEach((qs) => {
            if (sc.is_active == false && sc.module_id != null) {
              qs.is_active = false;
            }
          });
        });
      }

      getMdSubm["module"].forEach((mdle: any) => {
        delete mdle.id;
        delete mdle.loc_id;
        delete mdle.org_id;
        delete mdle.status;
        delete mdle.created_at;
        delete mdle.created_by;
        delete mdle.updated_at;
        delete mdle.updated_by;
        delete mdle.created_by_id;
        delete mdle.updated_by_id;
        delete mdle.is_edit_click;
        delete mdle.is_selected;
        delete mdle["add"];
        mdle["sub_module"].forEach((sbmdle: any) => {
          delete sbmdle.loc_id;
          delete sbmdle.org_id;
          delete sbmdle.status;
          delete sbmdle.created_at;
          delete sbmdle.created_by;
          delete sbmdle.updated_at;
          delete sbmdle.updated_by;
          delete sbmdle.display_seq;
          delete sbmdle.options_json;
          delete sbmdle.created_by_id;
          delete sbmdle.updated_by_id;
          delete sbmdle.is_edit_click;
          delete sbmdle.is_selected;
        });
      });
      delete getMdSubm["track_trash"];
      delete getMdSubm["section_documents"];
      delete getMdSubm["module_id"];
      let cnfrmMdlSub = await this._hqms.showConfirmMessage();
      if (cnfrmMdlSub) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnModuleApi",
          getMdSubm,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "success",
            summary: "Module",
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl("/modulelist");
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "warn",
            summary: "Module",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createMdSub.set({ ...JSON.parse(this.crtAdt) });
    this.subMdCnt = 0;
    this.mdleCnt = 0;
    this.selectedMdle = null;
    // this.preAssess.clear();
    // this.postAssess.clear();
  }

  editMdle(sctns, index) {
    sctns.is_edit_click = !sctns.is_edit_click;
    sctns.module_name = sctns.module_name;
    this.createMdSub().module.forEach((el, ind: number) => {
      if (ind !== index) {
        el.is_edit_click = false;
      }
    });
  }

  async trashMdle(sctns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      sctns.is_active = false;
      if (sctns.sub_module) {
        sctns.sub_module.forEach((q) => (q.is_active = false));
      }
      // this.createMdSub().module = this.createMdSub().module.filter(s=>s.is_active !== false);
      // sctns.sub_module = [];
      this.getMdleCnt();
      this.getSubMdCnt();
    }
  }

  editSubMdle(sctns, qstns, qstnIn) {
    qstns.is_edit_click = !qstns.is_edit_click;
    qstns.sub_module_name = qstns.sub_module_name;
    sctns.sub_module.forEach((qs, index: number) => {
      if (index !== qstnIn) {
        qs.is_edit_click = false;
      }
    });
  }

  async trashSubMdle(sctns, qstns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      qstns.is_active = false;
      // sctns.sub_module = sctns.sub_module.filter(q=>q.is_active !== false);
      if (sctns.sub_module.length === 0) {
        this.createMdSub().module = this.createMdSub().module.filter(
          (s) => s !== sctns,
        );
        this.getMdleCnt();
      }
      this.getSubMdCnt();
    }
  }

  getMdleCnt() {
    this.mdleCnt = this.createMdSub().module.filter(
      (sec) => sec.is_active == true,
    ).length;
  }

  onMdleSlctd(event: any, sctns) {
    // for manual mapping
    this.createMdSub().module.forEach((sec) => (sec.is_selected = false));
    if (event.target.checked) {
      sctns["is_selected"] = true;
      this.selectedMdle = sctns;
    } else {
      sctns["is_selected"] = false;
      this.selectedMdle = null;
    }
  }

  dropMdle(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      this.createMdSub().module,
      event.previousIndex,
      event.currentIndex,
    );
    this.createMdSub().module.forEach((item: any, ind: number) => {
      item.sec_order = ind + 1;
    });
  }

  dropSubMdle(event: CdkDragDrop<any[]>, Module: any) {
    moveItemInArray(Module.sub_module, event.previousIndex, event.currentIndex);
    Module.sub_module.forEach((item: any, ind: number) => {
      item.ques_order = ind + 1;
    });
  }
}
