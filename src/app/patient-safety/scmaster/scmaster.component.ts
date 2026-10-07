import { Component, ViewChild, signal, OnInit, inject, computed } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {moveItemInArray,CdkDragDrop, DragDropModule} from '@angular/cdk/drag-drop';
import { SharedModule } from '../../shared/shared.module';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
interface auditModel {
  audit_template_id: any;
  audit_type_id: any;
  audit_name: any;
  category_type_id: any;
  capa_required: string;
  mandatory_flag: boolean;
  section_documents: any;
  sections: any;
  is_active: any;
  track_trash: any;
}
@Component({
  selector: 'app-scmaster',
  imports: [FormsModule , SharedModule, FileUploadModule, DragDropModule],
  templateUrl: './scmaster.component.html',
  styleUrl: './scmaster.component.scss',
})
export class ScmasterComponent implements OnInit {
  @ViewChild('postAss') postAssess!: FileUpload;
  @ViewChild('preAssess') preAssess!: FileUpload;
  public attachedFiles: any = [];
  public router = inject(Router);
  readonly FORM_NAME = 'AuditAssignmentForm';
  readonly FIELD_NAME = 'auditTypeSelect';
  readonly FIELD1_NAME = 'audit_name';
  public pageMode = 'NEW';
  public uploadError1 = false;
  public sctnsCnt = 0;
  public qstnCnt: number = 0;
  public scMstrGrid:any = [];
  public section_documents:any = [];
  public qstnsAdd = signal({
    "id": this.scMstrGrid.length + 1,
    "question_id": null,
    "question_text": null,
    "is_mandatory": false,// mark as required
    "section_id": null,
    "is_not_applicable": false,
    "ques_order": 0,
    "is_edit_click": false,
    "is_evidence": false
  });
  public selectedSection: any = null;

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    await this.getSCMaster()
  }

  async getSCMaster() {
    try {
      this.selectedSection = null;
      let info: any = await this._hqms.customGetApiCall('GET', 'fnSurveyCatagoryApi',{}
       );
      if (info.status == 200) {
        let mstrInfo = info['data'];
        if (mstrInfo.length > 0) {
          this.scMstrGrid = mstrInfo
          this.getSectionsCnt();
          this.getQstnCnt();
        };
      };
    } catch (e) { };
  }

  getSectionsCnt() {
    this.sctnsCnt = this.scMstrGrid.filter((sec) => sec.is_active == true).length;
  }

  getQstnCnt() {
    this.qstnCnt = this.scMstrGrid.reduce((sum, sec) => sum + sec.questions.filter((sc) => sc.is_active == true).length, 0);
  }

  async  onBulkUploadClick(thisFile: any, fileSelected: any, fileType: any, maindata: any) {
    this.section_documents = [];
    this.uploadError1 = false;
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'sc',
        severity: 'warn',
        summary: 'Questions',
        detail: 'Accepted Formats were .xlsx',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    let atleastSectnRqd = this.scMstrGrid.filter((sec) => sec.is_active == true);
    if (atleastSectnRqd.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'sc',
        severity: 'warn',
        summary: 'Audit Sections',
        detail: 'Aleast section is required for mapping questions',
      });
      return;
    };
    let checkActiveSec = atleastSectnRqd.filter((activeSec) => activeSec.is_selected == true);
    if (checkActiveSec.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'sc',
        severity: 'warn',
        summary: 'Audit Sections',
        detail: 'Select section is required for mapping questions',
      });
      return;
    };
    this.section_documents.push(
      {
        file_id: null,
        file_name: fileSelected.files[0].name,
        file_type: 'xlsx',// fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
        fileSaveType: null,
        is_active: true,
        upload_file_name: fileSelected.files[0].name
      });
    this.attachedFiles.push({ "fileName": fileSelected.files[0].name, "fileContent": fileSelected.files[0] });
    let splitForXtension = fileSelected.files[0].name.split('.');
    if (splitForXtension[1] == 'xlsx') {
      var uploadFileName = `${fileSelected.files[0].name}`;
      this.attachedFiles.push({ "fileName": uploadFileName, "fileContent": fileSelected.files[0] });
      let workBook: any = null;
      let jsonData = null;
      const reader = new FileReader();
      const file = fileSelected.files[0];
      reader.onload = (event) => {
        const data = reader.result;
        workBook = XLSX.read(data, { type: 'binary', cellDates: true });
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
            key: 'sc',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Questions required',
          });
          return;
        }
        if (!xlData[0].hasOwnProperty('Question Text') &&
          !xlData[0].hasOwnProperty('Mark as Required') &&
          !xlData[0].hasOwnProperty('Question Order') &&
          !xlData[0].hasOwnProperty('NA Allowed')
        ) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Required Section/ Question attributes',
          });
          return;
        };
       xlData.forEach((qs, qsIn)=> {
        let uploadedQstns:any = {
          "id": this.scMstrGrid.length + 1,
          "question_id": null,
          "question_text": qs['Question Text'],
          "is_mandatory": qs['Mark as Required'] == 'Y',
          "section_id": this.selectedSection.section_id,
          "is_not_applicable": qs['NA Allowed'] == 'Y',
          "ques_order": qsIn,
          "is_edit_click": false,
          "is_evidence": false
        }
       this.selectedSection.questions.push(uploadedQstns);
       });
       this.getQstnCnt();
      };
      reader.readAsBinaryString(file);
    };

    thisFile.clear();
  }

  async onBulkUploadRemoveClick(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.section_documents = [];
        this.attachedFiles.splice(thisFileIndex, 1);
        this.qstnCnt = 0;
        this.sctnsCnt = 0;
      };
      // this.preAssess.clear();
    }
  }

  onQstnsAddClick() {
    let atleastSectnRqd = this.scMstrGrid.filter((sec) => sec.is_active == true);
    if (atleastSectnRqd.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'sc',
        severity: 'warn',
        summary: 'Audit Sections',
        detail: 'Aleast section is required for mapping questions',
      });
      return;
    };
    let checkActiveSec = atleastSectnRqd.filter((activeSec) => activeSec.is_selected == true);
    if (checkActiveSec.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'sc',
        severity: 'warn',
        summary: 'Audit Sections',
        detail: 'Select section is required for mapping questions',
      });
      return;
    };
    let qstns = JSON.parse(JSON.stringify(this.qstnsAdd())); // MANUAL ADDED QUESTIONS OBJECT
    qstns['ques_order'] = this.selectedSection.questions.length + 1;
    this.selectedSection.questions.push(qstns);
    this.qstnsAdd.set({
      "id": this.scMstrGrid.length + 1,
      "question_id": null,
      "question_text": null,
      "is_mandatory": false,// mark as required
      "section_id": null,
      "is_not_applicable": false,
      "ques_order": 0,
      "is_edit_click": false,
      "is_evidence": false
    });
    this.getQstnCnt();
  }

  async onSubmitClick() {
    try {
      if (this.scMstrGrid.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'sc',
          severity: 'warn',
          summary: 'SC MASTER',
          detail: 'Sections are required.',
        });
        return;
      };
      let getIpsgMstr = JSON.parse(JSON.stringify(this.scMstrGrid));
      getIpsgMstr.forEach((secEle: any) => {
        delete secEle.loc_id;
        delete secEle.org_id;
        delete secEle.status;
        delete secEle.created_at;
        delete secEle.created_by;
        delete secEle.updated_at;
        delete secEle.updated_by;
        delete secEle.created_by_id;
        delete secEle.updated_by_id;
        delete secEle.is_edit_click;
        delete secEle.is_selected;
        delete secEle["add"];
        secEle['questions'].forEach((qstnEle: any) => {
          delete qstnEle.loc_id;
          delete qstnEle.org_id;
          delete qstnEle.status;
          delete qstnEle.created_at;
          delete qstnEle.created_by;
          delete qstnEle.updated_at;
          delete qstnEle.updated_by;
          delete qstnEle.display_seq;
          delete qstnEle.options_json;
          delete qstnEle.created_by_id;
          delete qstnEle.updated_by_id;
          delete qstnEle.is_edit_click;
          delete qstnEle.is_selected;
        });
      });
      let payLoad = {
        "action" :"I",
        "role_code": "ADMIN",
        "sections" : getIpsgMstr
      };
      let mstrCnfrm = await this._hqms.showConfirmMessage();
      if (mstrCnfrm) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnSurveyCatagoryApi", payLoad);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'success',
            summary: 'SC MASTER',
            detail: saveResult.message,
          });
          await this.ngOnInit();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'warn',
            summary:  'SC MASTER',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  editQstn(sctns, qstns, qstnIn) {
    qstns.is_edit_click = !qstns.is_edit_click;
    qstns.question_text = qstns.question_text;
    sctns.questions.forEach((qs, index: number) => {
      if (index !== qstnIn) {
        qs.is_edit_click = false;
      }
    })

  }

  async trashQstn(sctns, qstns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      qstns.is_active = false;
      this.getQstnCnt();
    }
  }

  onSectionSelected(event: any, sctns) { // for manual mapping
    this.scMstrGrid.forEach((sec) => sec.is_selected = false);
    if (event.target.checked) {
      sctns['is_selected'] = true;
      this.selectedSection = sctns;
    } else {
      sctns['is_selected'] = false;
      this.selectedSection = null;
    }
  }

  dropQuestion(event:CdkDragDrop<any[]>, section:any){
   moveItemInArray(section.questions,event.previousIndex,event.currentIndex);
     section.questions.forEach((item:any, ind:number)=> {
        item.ques_order = ind+1;
     })
  }

    async onClearClick(){
    await this.ngOnInit();
  }
}

