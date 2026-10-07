import { Component, signal, ViewChild, OnInit, inject, computed } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import {moveItemInArray,CdkDragDrop, DragDropModule} from '@angular/cdk/drag-drop';
import { SharedModule } from '../../shared/shared.module';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
import { Validations } from '../../validations';
@Component({
  selector: 'app-cpmaster',
  imports: [FormsModule, SelectModule, SharedModule, FileUploadModule, DragDropModule],
  templateUrl: './cpmaster.component.html',
  styleUrl: './cpmaster.component.scss',
})
export class CpmasterComponent implements OnInit {
  private validations = inject(Validations);
  @ViewChild('postAss') postAssess!: FileUpload;
  @ViewChild('preAssess') preAssess!: FileUpload;
  public attachedFiles: any = [];
  public router = inject(Router);
  readonly FORM_NAME = 'CPMASTERFORM';
  readonly FIELD_NAME = 'cp_name';
  readonly FIELD1_NAME = 'department_id';
  public pageMode = 'NEW';
  public crtCP: any = JSON.stringify({
    "action": "I", //INSERT
    "role_code": "ADMIN",
    "cp_master_id": null,
    "cp_name": "",
    "department_id": null,
    "section_documents": [],
    "sections": [],
    "is_active": true,
    "track_trash": []
  });
  public createCPmaster: any = signal<any>({ ...JSON.parse(this.crtCP) });
  public errorMsg: any = { cp_name: '', department_id: '' };
  public uploadError1 = false;
  public secAdd = signal({
    "id": this.createCPmaster().sections.length + 1,
    "section_id": null,
    "section_name": null,
    "section_description": null,
    "sec_order": this.createCPmaster().sections.length + 1,
    "is_active": true,
    "is_edit_click": false,
    "is_selected": false,
    "questions": [],
    "add": "M"
  });
  public qstnsAdd = signal({
    "id": this.createCPmaster().sections.length + 1,
    "question_id": null,
    "question_text": null,
    "is_mandatory": false,// mark as required
    "section_id": null,
    "is_not_applicable": false,
    "ques_order": 0,
    "is_edit_click": false,
    "is_evidence": false,
    is_active : true,
  });
  public sctnsCnt = 0;
  public qstnCnt: number = 0;
  public auditTypeList: any = [];
  public departmentList: any = [];

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  goBack(): void {
    this.location.back();
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createCPmaster()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async ngOnInit() {
    let info: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "DEPARTMENT"
    });
    if (info.status == 200) {
        this.departmentList = info.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }))
      };
    let state = history.state;
    if (state ?.data) {
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editAudit(state['data']['id'])
      };
    }
  }

  async editAudit(cp_master_id: any) {
    try {
      this.selectedSection = null;
      let edifInfo: any = await this._hqms.customGetApiCall('GET', 'fnCpMasterWrite',
        {
          "cp_master_id": cp_master_id
        });
      if (edifInfo.status == 200) {
        let editInfo = edifInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let sctnDoc = (editInfo['audit_sect_file_ids'] || []) .length > 0 ?
            editInfo['audit_sect_file_ids'].map((ele, index: number) => ({ id: index + 1, ...ele, section_id: ele.section_id })) : [];
          this.createCPmaster.set({
            "action": "U",
            "cp_master_id": editInfo['cp_master_id'],
            "cp_name": editInfo['cp_type'],
            "department_id": editInfo['department_id'],
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
    } catch (e) {
    };
  }

  async  onBulkUploadClick(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.createCPmaster().section_documents = [];
    if(this.pageMode == 'NEW'){
      thisObj['sections'] = [];
    }else{
      thisObj['sections'].forEach(ele=>{ele.is_active= false});
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

        if (this.createCPmaster().sections.filter((fl) => fl.add == 'M').length == 0) {
          this.createCPmaster().sections = [];
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
          this.createCPmaster()['sections'].forEach((sc) => sc.is_selected = false);
          this.createCPmaster()['sections'] = this.createCPmaster()['sections'].concat(...sectQstnStrcuture).
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
        this.createCPmaster().section_documents = [];
        this.createCPmaster().sections = [];
        this.attachedFiles.splice(thisFileIndex, 1);
        this.qstnCnt = 0;
        this.sctnsCnt = 0;
      };
      // this.preAssess.clear();
    }
  }

  onSectionsAddClick() {
    this.createCPmaster().sections.forEach((ele) => ele.is_selected = false);
    this.selectedSection = null;
    let sctns = JSON.parse(JSON.stringify(this.secAdd()));
    this.createCPmaster().sections.push(sctns);
    this.secAdd.set({
      "id": this.createCPmaster().sections.length + 1,
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
    let atleastSectnRqd = this.createCPmaster().sections.filter((sec) => sec.is_active == true);
    if (atleastSectnRqd.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'audit',
        severity: 'warn',
        summary: 'CP Sections',
        detail: 'Aleast section is required for mapping questions',
      });
      return;
    };
    let checkActiveSec = atleastSectnRqd.filter((activeSec) => activeSec.is_selected == true);
    if (checkActiveSec.length == 0) {
      this._hqms.hqmsToasterService({
        key: 'audit',
        severity: 'warn',
        summary: 'CP Sections',
        detail: 'Select section is required for mapping questions',
      });
      return;
    };
    let qstns = JSON.parse(JSON.stringify(this.qstnsAdd())); // MANUAL ADDED QUESTIONS OBJECT
    qstns['ques_order'] = this.selectedSection.questions.length + 1;
    this.selectedSection.questions.push(qstns);
    this.qstnsAdd.set({
      "id": this.createCPmaster().sections.length + 1,
      "question_id": null,
      "question_text": null,
      "is_mandatory": false,// mark as required
      "section_id": null,
      "is_not_applicable": false,
      "ques_order": 0,
      "is_edit_click": false,
      "is_evidence": false,
      is_active : true
    });
    this.getQstnCnt();
  }

  getQstnCnt() {
    this.qstnCnt = this.createCPmaster().sections.reduce((sum, sec) => sum + sec.questions.filter((sc) => sc.is_active == true).length, 0);
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid || this.uploadError1) {
        this._hqms.hqmsToasterService({
          key: 'cp',
          severity: 'warn',
            summary: 'CP Master',
          detail: 'Check the errors',
        });
        return;
      };
      if (this.createCPmaster().sections.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'cp',
          severity: 'warn',
           summary: 'CP Master',
          detail: 'Sections are required.',
        });
        return;
      };
      let getCPmstr = JSON.parse(JSON.stringify(this.createCPmaster()));
      if (this.pageMode == 'NEW') {
        getCPmstr['sections'] = getCPmstr['sections'].filter((ele: any) => ele.is_active !== false).
          map((section, sIdx) => {
            let newSectionOrdr = sIdx + 1;
            return {
              ...section,
              "sec_order": newSectionOrdr,
              questions: section.questions.filter(ele => ele.is_active !== false).map((qstn, qsIn) => ({ ...qstn, ques_order: qsIn + 1 }))
            }
          })
      } else {
        getCPmstr['sections'] = getCPmstr['sections'].filter((ele: any) =>
          ele.section_id != null && ele.is_active == true ||
          ele.section_id != null && ele.is_active == false ||
          ele.section_id == null && ele.is_active == true
        );
        getCPmstr['sections'].forEach(sc => {
          sc['questions'].forEach(qs => {
            if (sc.is_active == false && sc.section_id != null) {
              qs.is_active = false;
            }
          })
        })
      }
      getCPmstr['sections'].forEach((secEle: any) => {
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
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      delete getCPmstr['track_trash'];
      formData.append("data", JSON.stringify(getCPmstr));
      let cnfrmCPMaster = await this._hqms.showConfirmMessage();
      if (cnfrmCPMaster) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnCpMasterWrite", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'cp',
            severity: 'success',
            summary: 'CP Master',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/cp-list');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'cp',
            severity: 'warn',
            summary: 'CP Master',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createCPmaster.set({ ...JSON.parse(this.crtCP) });
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
    this.createCPmaster().sections.forEach((el, ind: number) => {
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
      // this.createCPmaster().sections = this.createCPmaster().sections.filter(s=>s.is_active !== false);
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
        this.createCPmaster().sections = this.createCPmaster().sections.filter(s => s !== sctns);
        this.getSectionsCnt();
      };
      this.getQstnCnt();
    }
  }

  getSectionsCnt() {
    this.sctnsCnt = this.createCPmaster().sections.filter((sec) => sec.is_active == true).length;
  }

  onSectionSelected(event: any, sctns) { // for manual mapping
    this.createCPmaster().sections.forEach((sec) => sec.is_selected = false);
    if (event.target.checked) {
      sctns['is_selected'] = true;
      this.selectedSection = sctns;
    } else {
      sctns['is_selected'] = false;
      this.selectedSection = null;
    }
  }

  dropSection(event:CdkDragDrop<any[]>){
   moveItemInArray(this.createCPmaster().sections,event.previousIndex,event.currentIndex);
     this.createCPmaster().sections.forEach((item:any, ind:number)=> {
        item.sec_order = ind+1;
     })
  }

  dropQuestion(event:CdkDragDrop<any[]>, section:any){
   moveItemInArray(section.questions,event.previousIndex,event.currentIndex);
     section.questions.forEach((item:any, ind:number)=> {
        item.ques_order = ind+1;
     })
  }
}
