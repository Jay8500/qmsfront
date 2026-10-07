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
import * as XLSX from "xlsx";
interface mdMdle {
  section_documents: any;
  document: any;
  is_active: any;
  track_trash: any;
}
@Component({
  selector: "app-document",
  imports: [FormsModule, SharedModule, FileUploadModule],

  templateUrl: "./document.component.html",
  styleUrl: "./document.component.scss",
})
export class DocumentComponent implements OnInit {
  private validations = inject(Validations);
  @ViewChildren("postAss") postAssess!: FileUpload;
  @ViewChildren("preAssess") preAssess!: FileUpload;
  public attachedFiles: any = [];
  public router = inject(Router);
  readonly FORM_NAME = "document";
  public pageMode = "NEW";
  public crtAdt: any = JSON.stringify({
    action: "I", //INSERT
    section_documents: [],
    document: [],
    track_trash: [],
  });
  public createDoc: any = signal<mdMdle>({ ...JSON.parse(this.crtAdt) });
  public errorMsg: any = {
    document_name: "",
    primary_url: "",
  };
  public uploadError1 = false;
  public docAdd = signal({
    id: this.createDoc().document.length + 1,
    document_id: null,
    document_name: null,
    primary_url: null,
    secondary_url: null,
    is_active: true,
    is_edit_click: false,
    is_selected: false,
    add: "M",
    description: null,
  });
  public docCnt = 0;
  public selectedDoc: any = null;

  constructor(
    private location: Location,
    public _hqms: HqmsService,
  ) {}

  goBack(): void {
    this.router.navigateByUrl("/documentlist");
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
        this.docAdd()[ctrl],
      );
      this.errorMsg[ctrl] = result?.message || "";
    }
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

  async edit(document_id: any) {
    try {
      this.selectedDoc = null;
      let getAuditInfo: any = await this._hqms.customGetApiCall(
        "GET",
        "fnDocApi",
        {
          document_id: document_id,
        },
      );
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          // let sctnDoc = editInfo['audit_sect_file_ids'].length > 0 ?
          //   editInfo['audit_sect_file_ids'].map((ele, index: number) => ({ id: index + 1, ...ele, document_id: ele.document_id })) : [];
          this.createDoc.set({
            action: "U",
            section_documents: [],
            document: editInfo["document"].map((sctn: any, index: number) => ({
              ...sctn,
              id: index + 1,
              is_edit_click: false,
              is_selected: false,
              description: null,
            })),
            track_trash: [],
            is_active: editInfo["is_active"],
          });
          this.getMdleCnt();
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
    this.createDoc().section_documents = [];
    if (this.pageMode == "NEW") {
      thisObj["document"] = [];
    } else {
      thisObj["document"].forEach((ele) => {
        ele.is_active = false;
      });
    }
    this.selectedDoc = null;
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
        summary: "Document",
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
            detail: "Document with Questions required",
          });
          return;
        }
        if (
          !xlData[0].hasOwnProperty("Document Name") &&
          !xlData[0].hasOwnProperty("Primary URL")
        ) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "warn",
            summary: "Bulk Upload",
            detail: "Required Documents attributes",
          });
          return;
        }
        if (
          this.createDoc().document.filter((fl) => fl.add == "M").length == 0
        ) {
          this.createDoc().document = [];
        }
        let sectQstnStrcuture: any = [];
        xlData.forEach((ele: any, index: number) => {
          let crtDc: any = {
            id: index + 1,
            document_id: null,
            document_name: ele["Document Name"],
            primary_url: ele["Primary URL"],
            secondary_url: ele["Secondary URL"] || null,
            is_active: true,
            is_edit_click: false,
            is_selected: false,
            description: null,
            add: "B",
          };
          sectQstnStrcuture.push(crtDc);
        });
        this.createDoc().document = sectQstnStrcuture;
        this.getMdleCnt();
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
        this.createDoc().section_documents = [];
        this.createDoc().document = [];
        this.attachedFiles.splice(thisFileIndex, 1);
        this.docCnt = 0;
      }
      // this.preAssess.clear();
    }
  }

  onMdleAddClick() {
    let sctns = JSON.parse(JSON.stringify(this.docAdd()));
    this.createDoc().document.push(sctns);
    this.docAdd.set({
      id: this.createDoc().document.length + 1,
      document_id: null,
      document_name: null,
      primary_url: null,
      secondary_url: null,
      is_active: true,
      is_edit_click: false,
      is_selected: false,
      add: "M",
      description: null,
    });
    this.getMdleCnt();
  }

  async onSubmitClick() {
    try {
      if (this.createDoc().document.length == 0) {
        this._hqms.hqmsToasterService({
          key: "audit",
          severity: "warn",
          summary: "Document",
          detail: "Document are required.",
        });
        return;
      }
      let getMdSubm = JSON.parse(JSON.stringify(this.createDoc()));

      if (this.pageMode == "NEW") {
        getMdSubm["document"] = getMdSubm["document"]
          .filter((ele: any) => ele.is_active !== false)
          .map((Document, sIdx) => {
            return {
              ...Document,
            };
          });
      } else {
        getMdSubm["document"] = getMdSubm["document"].filter(
          (ele: any) =>
            (ele.document_id != null && ele.is_active == true) ||
            (ele.document_id != null && ele.is_active == false) ||
            (ele.document_id == null && ele.is_active == true),
        );
      }
      getMdSubm["document"].forEach((mdle: any) => {
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
      });
      delete getMdSubm["track_trash"];
      delete getMdSubm["section_documents"];
      let cnfrmMdlSub = await this._hqms.showConfirmMessage();
      if (cnfrmMdlSub) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnDocApi",
          getMdSubm,
        );
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "success",
            summary: "Document",
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl("/documentlist");
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: "audit",
            severity: "warn",
            summary: "Document",
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {}
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createDoc.set({ ...JSON.parse(this.crtAdt) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ""));
    this.docCnt = 0;
  }

  editMdle(sctns, index) {
    sctns.is_edit_click = !sctns.is_edit_click;
    sctns.document_name = sctns.document_name;
    this.createDoc().document.forEach((el, ind: number) => {
      if (ind !== index) {
        el.is_edit_click = false;
      }
    });
  }

  async trashMdle(sctns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      sctns.is_active = false;
      this.getMdleCnt();
    }
  }

  getMdleCnt() {
    this.docCnt = this.createDoc().document.filter(
      (sec) => sec.is_active == true,
    ).length;
  }
}
