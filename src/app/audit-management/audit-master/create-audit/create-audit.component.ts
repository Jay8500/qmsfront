import { Component, QueryList, signal, ViewChildren, OnInit, inject, computed } from '@angular/core';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '../../../shared/shared.module';
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
  selector: 'app-create-audit',
  imports: [FormsModule, SharedModule, FileUploadModule, DragDropModule],
  templateUrl: './create-audit.component.html',
})
export class CreateAuditComponent implements OnInit {
  private validations = inject(Validations);
  @ViewChildren('postAss') postAssess!: FileUpload;
  @ViewChildren('preAssess') preAssess!: FileUpload;
  public attachedFiles: any = [];
  public router = inject(Router);
  readonly FORM_NAME = 'AuditAssignmentForm';
  readonly FIELD_NAME = 'auditTypeSelect';
  readonly FIELD1_NAME = 'audit_name';
  public pageMode = 'NEW';
  public crtAdt: any = JSON.stringify({
    action: "I", //INSERT
    audit_template_id: null,
    audit_type_id: null,
    audit_name: "",
    category_type_id: null,
    capa_required: "Y",
    mandatory_flag: true,
    section_documents: [],
    sections: [],
    is_active: true,
    track_trash: []
  });
  public createAudit: any = signal<auditModel>({ ...JSON.parse(this.crtAdt) });
  public errorMsg: any = { audit_type_id: '', audit_name: '', category_type_id: '' };
  public uploadError1 = false;
  public secAdd = signal({
    "id": this.createAudit().sections.length + 1,
    "section_id": null,
    "section_name": null,
    "section_description": null,
    "sec_order": this.createAudit().sections.length + 1,
    "is_active": true,
    "is_edit_click": false,
    "is_selected": false,
    "questions": [],
    "add": "M"
  });
  public qstnsAdd = signal({
    "id": this.createAudit().sections.length + 1,
    "question_id": null,
    "question_text": null,
    "is_mandatory": false,// mark as required
    "section_id": null,
    "is_not_applicable": false,
    "ques_order": 0,
    "is_edit_click": false,
    "is_evidence": false,
    is_active: true
  });
  public sctnsCnt = 0;
  public qstnCnt: number = 0;
  public auditTypeList: any = [];
  public auditCatList: any = [];

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  goBack(): void {
    this.router.navigateByUrl('/audit-master-dashboard')
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createAudit()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async ngOnInit() {
    let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "AUDIT_TYPE | AUDIT_CATEGORY" }, true);
    if (info.status == 200) {
      this.auditTypeList = info.data['entities']['AUDIT_TYPE']['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id
      }));
      this.auditCatList = info.data['entities']['AUDIT_CATEGORY']['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id
      }));
    };
    let state = history.state;
    if (state ?.data) {
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editAudit(state['data']['id'])
      };
    }
  }

  async editAudit(audit_template_id: any) {
    try {
      this.selectedSection = null;
      let getAuditInfo: any = await this._hqms.customGetApiCall('GET', 'fnAuditTemplateApi',
        {
          "audit_template_id": audit_template_id
        });
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let qstnDoc = editInfo['audit_quest_file_ids'].length > 0 ? editInfo['audit_quest_file_ids'] : [];
          let sctnDoc = editInfo['audit_sect_file_ids'].length > 0 ?
            editInfo['audit_sect_file_ids'].map((ele, index: number) => ({ id: index + 1, ...ele, section_id: ele.section_id })) : [];
          this.createAudit.set({
            "action": "U",
            "audit_template_id": editInfo['audit_template_id'],
            "audit_type_id": editInfo['audit_type_id'],
            "audit_name": editInfo['audit_name'],
            "category_type_id": editInfo['category_type_id'],
            "capa_required": editInfo['capa_required'] ? "Y" : "N",
            "mandatory_flag": editInfo['mandatory_flag'],
            "section_documents": sctnDoc,
            "sections": editInfo['sections'].map((sctn: any, index: number) => ({
              ...sctn,
              "id": index + 1,
              "is_edit_click": false,
              "is_selected": false,
              questions: sctn.questions.map((qstn: any, qstnIn: number) =>
                (
                  {
                    ...qstn,
                    "is_edit_click": false,
                    "is_selected": false
                  }
                )
              )
            })
            ),
            "track_trash": [],
            "is_active": editInfo['is_active']
          });
          this.getSectionsCnt();
          this.getQstnCnt();
        };
      };
    } catch (e) { };
  }

  async  onBulkUploadClick(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.createAudit().section_documents = [];
    if (this.pageMode == 'NEW') {
      thisObj['sections'] = [];
    } else {
      thisObj['sections'].forEach(ele => { ele.is_active = false });
    };
    this.selectedSection = null;
    this.uploadError1 = false;
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'audit',
        severity: 'warn',
        summary: 'Sections & Questions',
        detail: 'Accepted Formats were .xlsx',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    thisObj.section_documents.push(
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
            key: 'audit',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Sections with Questions required',
          });
          return;
        }
        if (!xlData[0].hasOwnProperty('Section Title') &&
          !xlData[0].hasOwnProperty('Section Order') &&
          !xlData[0].hasOwnProperty('Question Order') &&
          !xlData[0].hasOwnProperty('Question Text') &&
          !xlData[0].hasOwnProperty('Mark as Required') &&
          !xlData[0].hasOwnProperty('NA Allowed')
        ) {
          this._hqms.hqmsToasterService({
            key: 'audit',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Required Section/ Question attributes',
          });
          return;
        }

        if (this.createAudit().sections.filter((fl) => fl.add == 'M').length == 0) {
          this.createAudit().sections = [];
        }
        let getUniqsSections = [...new Map(xlData.map(item => [item['Section Title'], item])).values()];
        let sectQstnStrcuture: any = [];
        if (getUniqsSections.length > 0) {
          getUniqsSections.sort((a: any, b: any) =>
            parseInt(a['Section Order']) - parseInt(b['Section Order']))
          getUniqsSections.forEach((ele: any, index: number) => {
            let sectionsObj: any = {
              "id": index + 1,
              "section_id": null,
              "section_name": ele['Section Title'],
              "section_description": null,
              "sec_order": parseInt(ele['Section Order']),
              "is_active": true,
              "is_edit_click": false,
              "is_selected": false,
              "add": "B",
              "questions": []
            };
            let findQstnScns = xlData.filter((qstn: any) => qstn['Section Title'] == ele['Section Title']);
            if (findQstnScns.length > 0) {
              findQstnScns.sort((a: any, b: any) => parseInt(a['Question Order']) - parseInt(b['Question Order']));
              findQstnScns.forEach((qstnEle: any) => {
                let qstns = {
                  "question_id": null,
                  "question_text": qstnEle['Question Text'],
                  "is_mandatory": qstnEle['Mark as Required'] == 'Y' ? true : false,
                  "section_id": null,
                  "is_not_applicable": qstnEle['NA Allowed'] == 'Y' ? true : false,
                  "ques_order": parseInt(qstnEle['Question Order']),
                  "is_active": true,
                  "is_edit_click": false,
                  "is_evidence": false,
                };
                sectionsObj['questions'].push(qstns);
              });
            };
            sectQstnStrcuture.push(sectionsObj);
          });
          let fetchUploadedSecOrder = sectQstnStrcuture.length;
          this.createAudit()['sections'].forEach((sc) => sc.is_selected = false);
          this.createAudit()['sections'] = this.createAudit()['sections'].concat(...sectQstnStrcuture).
            map((sctns, indx) =>
              ({ ...sctns, is_active: true, is_selected: false, "sec_order": fetchUploadedSecOrder + 1 })).sort((a: any, b: any) => a.sec_order - b.sec_order);
          this.getSectionsCnt();
          this.getQstnCnt();
        };
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
        this.createAudit().section_documents = [];
        this.createAudit().sections = [];
        this.attachedFiles.splice(thisFileIndex, 1);
        this.qstnCnt = 0;
        this.sctnsCnt = 0;
      };
      // this.preAssess.clear();
    }
  }

  onSectionsAddClick() {
    this.createAudit().sections.forEach((ele) => ele.is_selected = false);
    this.selectedSection = null;
    let sctns = JSON.parse(JSON.stringify(this.secAdd()));
    this.createAudit().sections.push(sctns);
    this.secAdd.set({
      "id": this.createAudit().sections.length + 1,
      "section_id": null,
      "section_name": null,
      "section_description": null,
      "sec_order": 0,
      "is_active": true,
      "questions": [],
      "is_edit_click": false,
      "is_selected": false,
      "add": "M"
    });
    this.getSectionsCnt();
  }
  public selectedSection: any = null;
  onQstnsAddClick() {
    let atleastSectnRqd = this.createAudit().sections.filter((sec) => sec.is_active == true);
    if (atleastSectnRqd.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'audit',
        severity: 'warn',
        summary: 'Audit Sections',
        detail: 'Aleast section is required for mapping questions',
      });
      return;
    };
    let checkActiveSec = atleastSectnRqd.filter((activeSec) => activeSec.is_selected == true);
    if (checkActiveSec.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'audit',
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
      "id": this.createAudit().sections.length + 1,
      "question_id": null,
      "question_text": null,
      "is_mandatory": false,// mark as required
      "section_id": null,
      "is_not_applicable": false,
      "ques_order": 0,
      "is_edit_click": false,
      "is_evidence": false,
      is_active: true
    });
    this.getQstnCnt();
  }

  getQstnCnt() {
    this.qstnCnt = this.createAudit().sections.reduce((sum, sec) => sum + sec.questions.filter((sc) => sc.is_active == true).length, 0);
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid || this.uploadError1) {
        this._hqms.hqmsToasterService({
          key: 'audit',
          severity: 'warn',
          summary: 'Audit',
          detail: 'Check the errors',
        });
        return;
      };
      if (this.createAudit().sections.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'audit',
          severity: 'warn',
          summary: 'Audit',
          detail: 'Sections are required.',
        });
        return;
      };
      let getAudit = JSON.parse(JSON.stringify(this.createAudit()));

      if (this.pageMode == 'NEW') {
        getAudit['sections'] = getAudit['sections'].filter((ele: any) => ele.is_active !== false).
          map((section, sIdx) => {
            let newSectionOrdr = sIdx + 1;
            return {
              ...section,
              "sec_order": newSectionOrdr,
              questions: section.questions.filter(ele => ele.is_active !== false).map((qstn, qsIn) => ({ ...qstn, ques_order: qsIn + 1 }))
            }
          })
      } else {

        getAudit['sections'] = getAudit['sections'].filter((ele: any) =>
          ele.section_id != null && ele.is_active == true ||
          ele.section_id != null && ele.is_active == false ||
          ele.section_id == null && ele.is_active == true
        );
        getAudit['sections'].forEach(sc => {
          sc['questions'].forEach(qs => {
            if (sc.is_active == false && sc.section_id != null) {
              qs.is_active = false;
            }
          })
        })
      }

      getAudit['sections'].forEach((secEle: any) => {
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
        })
      })
      getAudit['capa_required'] = getAudit['capa_required'] == 'Y' ? true : false;
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(getAudit));
      let confirmAssessment = await this._hqms.showConfirmMessage();
      if (confirmAssessment) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAuditTemplateApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'audit',
            severity: 'success',
            summary: 'Audit',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/audit-master-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'audit',
            severity: 'warn',
            summary: 'Audit',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createAudit.set({ ...JSON.parse(this.crtAdt) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.qstnCnt = 0;
    this.sctnsCnt = 0;
    this.selectedSection = null;
    // this.preAssess.clear();
    // this.postAssess.clear();
  }

  editSectn(sctns, index) {
    sctns.is_edit_click = !sctns.is_edit_click;
    sctns.section_name = sctns.section_name;
    this.createAudit().sections.forEach((el, ind: number) => {
      if (ind !== index) {
        el.is_edit_click = false
      }
    }
    )
  }

  async trashSctn(sctns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      sctns.is_active = false;
      if (sctns.questions) {
        sctns.questions.forEach(q => q.is_active = false);
      };
      // this.createAudit().sections = this.createAudit().sections.filter(s=>s.is_active !== false);
      // sctns.questions = [];
      this.getSectionsCnt();
      this.getQstnCnt();
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
      // sctns.questions = sctns.questions.filter(q=>q.is_active !== false);
      if (sctns.questions.length === 0) {
        this.createAudit().sections = this.createAudit().sections.filter(s => s !== sctns);
        this.getSectionsCnt();
      };
      this.getQstnCnt();
    }
  }

  getSectionsCnt() {
    this.sctnsCnt = this.createAudit().sections.filter((sec) => sec.is_active == true).length;
  }

  onSectionSelected(event: any, sctns) { // for manual mapping
    this.createAudit().sections.forEach((sec) => sec.is_selected = false);
    if (event.target.checked) {
      sctns['is_selected'] = true;
      this.selectedSection = sctns;
    } else {
      sctns['is_selected'] = false;
      this.selectedSection = null;
    }
  }


  dropSection(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.createAudit().sections, event.previousIndex, event.currentIndex);
    this.createAudit().sections.forEach((item: any, ind: number) => {
      item.sec_order = ind + 1;
    })
  }

  dropQuestion(event: CdkDragDrop<any[]>, section: any) {
    moveItemInArray(section.questions, event.previousIndex, event.currentIndex);
    section.questions.forEach((item: any, ind: number) => {
      item.ques_order = ind + 1;
    })
  }
}
