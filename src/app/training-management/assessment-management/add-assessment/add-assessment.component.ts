import { Component, signal, QueryList, ViewChild, ViewChildren, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
interface createAssessmentClass {
  "action": string,
  "assessment_template_id": any,
  "training_id": any,
  "assessment_type_id": any,
  "total_score": any,
  "pass_mark": any,
  "training_name": any,
  "pre_assessment_files": [],
  "post_assessment_files": [],
  "pre_questions": [],
  "post_questions": [],
  "is_active": boolean
};
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
import {moveItemInArray,CdkDragDrop, DragDropModule} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-add-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, SharedModule, FileUploadModule, DragDropModule],
  templateUrl: './add-assessment.component.html'
})
export class AddAssessmentComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'AssessmentForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];

  @ViewChild('postAss') postAssess!: FileUpload;
  @ViewChild('preAssess') preAssess!: FileUpload;
  public errorMsg: any = { training_id: '', total_score: '', pass_mark: '' };
  public trainingNameList = [];
  public selectedFcltyType = signal(null);

  public assessment: any = JSON.stringify({
    "action": "I", //INSERT
    "assessment_template_id": null,
    "training_id": "",
    "assessment_type_id": null,
    "total_score": null,
    "pass_mark": null,
    "training_name": null,
    "pre_assessment_files": [],
    "post_assessment_files": [],
    "pre_questions": [],
    "post_questions": [],
    "is_active": true
  });
  public createAssessment: any = signal<createAssessmentClass>({ ...JSON.parse(this.assessment) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createAssessment()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }
  public assessmentTypesList: any = [];
  async ngOnInit() {
    try {
      let trainingList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "ASSMNT_TRNG"
        });
      if (trainingList.status == 200) {
        this.trainingNameList = trainingList.data.map((ele: any) => ({
          label: ele.training_name,
          value: ele.training_id
        }))
      };
      let assessmentTypesList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ASSESSMENTTYPE" });
      if (assessmentTypesList.status == 200) {
        this.assessmentTypesList = assessmentTypesList.data.entities.ASSESSMENTTYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }))
      };

      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editAssessment(state['data']['id'])
      };
    } catch (e) {
    };
  }

  async editAssessment(assessmentId: any) {
    try {
      let getAssessmentListEdit: any = await this._hqms.customGetApiCall('GET', 'assessmentApi',
        {
          "only_active": true,
          "assessment_template_id": assessmentId
        });
      if (getAssessmentListEdit.status == 200) {
        let editInfo = getAssessmentListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let pre_assessment_files = editInfo['pre_assessment_file'].length > 0 ? editInfo['pre_assessment_file'] : [];
          let post_assessment_files = editInfo['post_assessment_file'].length > 0 ? editInfo['post_assessment_file'] : [];
          this.createAssessment.set({
            "action": "U",
            "training_id": editInfo['training_id'],
            "assessment_type_id": editInfo['assessment_type_id'],
            "total_score": editInfo['total_score'],
            "pass_mark": editInfo['pass_mark'],
            "training_name": editInfo['training_name'],
            "pre_assessment_files": pre_assessment_files,
            "post_assessment_files": post_assessment_files,
            "assessment_template_id": editInfo['assessment_template_id'],
            "is_active": editInfo["is_active"],
            "pre_questions": editInfo['pre_questions'].map((ele:any)=> ( { ...ele, is_edit_click : false   } ) ),
            "post_questions": editInfo['post_questions'].map((ele:any)=> ( { ...ele, is_edit_click : false   } ) ),
          });
          this.isAssessMentType = this.assessmentTypesList.filter((ty) => ty.value == editInfo['assessment_type_id'])[0]['value_code']
        }
      };
    } catch (e) {
    };
  }

  public uploadError1 = false;
  public uploadError2 = false;

  async  onPreAssessFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    if(this.pageMode == 'NEW'){
      thisObj['pre_questions'] = [];
      thisObj['pre_assessment_files'] = [];
    }else{
      thisObj['pre_questions'].forEach(ele=>{ele.is_active= false});
      thisObj['pre_assessment_files'] = [];
    };
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'training',
        severity: 'warn',
        summary: 'Training - Supporting Documents',
        detail: 'Accepted Formats were .xlsx',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    thisObj.pre_assessment_files.push(
      {
        file_id: null, //UUID - STRING
        file_name: fileSelected.files[0].name,
        file_type: fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
        fileSaveType: null,
        is_active: true,
        upload_file_name: fileSelected.files[0].name
      }
    );
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
            key: 'ass',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'PreAssessment Questions required',
          });
          return;
        }
        if (!xlData[0].hasOwnProperty('Question Text') &&
          !xlData[0].hasOwnProperty('Answer Type') &&
          !xlData[0].hasOwnProperty('Question Order') &&
          !xlData[0].hasOwnProperty('Options')
        ) {
          this._hqms.hqmsToasterService({
            key: 'pre',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Question attributes',
          });
          return;
        }
              xlData.forEach((qstnEle: any) => {
                let qstns = {
                  "question_id": null,
                  "question_text": qstnEle['Question Text'],
                  "question_type": qstnEle['Answer Type'],
                  "options_json":  qstnEle['Answer Type'] == 'MCQ' ? qstnEle['Options'].split(' '):null,
                  "ques_order": parseInt(qstnEle['Question Order']),
                  "correct_answer": qstnEle['Correct Answer'],
                  "is_active": true,
                  "is_edit_click": false,
                };
                thisObj['pre_questions'].push(qstns);
              });
              thisObj['pre_questions'] = thisObj['pre_questions'].sort((a: any, b: any) => parseInt(a['ques_order']) - parseInt(b['ques_order']));
              this.getPreCnt();
      };
      reader.readAsBinaryString(file);
    };
    thisFile.clear();
  }

  async onRemovePreAssessFileSelect(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage();
    if (confirm) {
      this.uploadError2 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
        this.preQstnCnt = 0;
      if(this.pageMode == 'NEW'){
         doc['pre_questions'] = [];
         doc['pre_assessment_files'] = [];
      }else{
        doc['pre_questions'].forEach(ele=>{ele.is_active= false});
        doc['pre_assessment_files'] = [];
      };
      this.preAssess.clear();
    }
  }

  async  onPostAssessFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    if(this.pageMode == 'NEW'){
      thisObj['post_questions'] = [];
      thisObj['post_assessment_files'] = [];
    }else{
      thisObj['post_questions'].forEach(ele=>{ele.is_active= false});
      thisObj['post_assessment_files'] = [];
    };
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this._hqms.hqmsToasterService({
        key: 'assessment',
        severity: 'warn',
        summary: 'Post Assessment',
        detail: 'Accepted Formats were Xlsx',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError2 = false;
      }, 3000);
      return;
    };
      thisObj.post_assessment_files.push(
      {
        file_id: null, //UUID - STRING
        file_name: fileSelected.files[0].name,
        file_type: fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
        fileSaveType: null,
        is_active: true,
        upload_file_name: fileSelected.files[0].name
      }
    );
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
            key: 'ass',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'PostAssessment Questions required',
          });
          return;
        }
        if (!xlData[0].hasOwnProperty('Question Text') &&
          !xlData[0].hasOwnProperty('Answer Type') &&
          !xlData[0].hasOwnProperty('Question Order') &&
          !xlData[0].hasOwnProperty('Options')
        ) {
          this._hqms.hqmsToasterService({
            key: 'pre',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Question attributes',
          });
          return;
        }
              xlData.forEach((qstnEle: any) => {
                let qstns = {
                  "question_id": null,
                  "question_text": qstnEle['Question Text'],
                  "question_type": qstnEle['Answer Type'],
                     "options_json":  qstnEle['Answer Type'] == 'MCQ' ? qstnEle['Options'].split(' '):null,
                  "ques_order": parseInt(qstnEle['Question Order']),
                  "correct_answer": qstnEle['Correct Answer'],
                  "is_active": true,
                  "is_edit_click": false,
                };
                thisObj['post_questions'].push(qstns);
              });
              thisObj['post_questions'] = thisObj['post_questions'].sort((a: any, b: any) => parseInt(a['ques_order']) - parseInt(b['ques_order']));
              this.getPostCnt();
      };
      reader.readAsBinaryString(file);
    };
    thisFile.clear();
  }

  async onRemovePostAssessFileSelect(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      this.uploadError2 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
      if(this.pageMode == 'NEW'){
        doc['post_questions'] = [];
        doc['post_assessment_files'] = [];
      }else{
        doc['post_questions'].forEach(ele=>{ele.is_active= false});
        doc['post_assessment_files'] = [];
      };
      this.postQstnCnt = 0;
      this.preAssess.clear();
    }
  }

  async onSubmitClick() {
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.uploadError1 || this.uploadError2) {
      this._hqms.hqmsToasterService({
        key: 'assessment',
        severity: 'warn',
        summary: 'Assessment',
        detail: 'Check the errors',
      });
      return;
    };

     if(this.createAssessment().pass_mark > this.createAssessment().total_score){
           this._hqms.hqmsToasterService({
                key: 'assessment',
                severity: 'warn',
                summary: 'Assessment',
                detail: 'Passmark should not be greater than total marks',
      });
      return;
    };

    let data =  JSON.parse(JSON.stringify(this.createAssessment())) ;
    if (this.pageMode == 'NEW') {
       data['pre_assessment_files'] =
         data['pre_assessment_files'].filter((fl: any) => fl.is_active == true);
       data['post_assessment_files'] =
        data['post_assessment_files'].filter((fl: any) => fl.is_active == true);
        data['pre_questions'] = data['pre_questions'].filter((fl)=> fl.is_active == true);
        data['post_questions'] = data['post_questions'].filter((fl)=> fl.is_active == true);
    };
        delete data.training_name;
      let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(data));
    let confirmAssessment = await this._hqms.showConfirmMessage();
    if (confirmAssessment) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "assessmentApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Assessment',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/assessment-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Assessment',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.uploadError2 = false;
    this.preQstnCnt = 0;
    this.postQstnCnt = 0;
    this.createAssessment.set({ ...JSON.parse(this.assessment) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.isAssessMentType = '';
    // this.preAssess.clear();
    // this.postAssess.clear();
  }

  goBack(): void {
    this.router.navigateByUrl('/assessment-dashboard');
  }
  public isAssessMentType = '';
  onAssessTypeClick(type: string, assmtObj: any) {
    this.isAssessMentType = type;
    assmtObj['pre_assessment_files'] = [];
    assmtObj['post_assessment_files'] = [];
    assmtObj["pre_questions"] = [];
    assmtObj["post_questions"] = [];
    this.attachedFiles = [];
  }

  public questionType = [
    {
      label : "MCQ's",
      value : "MCQ"
    },
    {
      label : "Free text",
      value : "FREE_TEXT"
    },
  ]
  public manual_pre = signal({
    "question_id": null,
    "question_text" : null,
    "question_type":null,
    "options_json" : [],
    "ques_order" : this.createAssessment().pre_questions.length,
    "is_active" : true,
    "is_edit_click": false,
  });

  public manual_post = signal({
    "question_id": null,
    "question_text" : null,
    "question_type":null,
    "options_json" : [],
    "ques_order" : this.createAssessment().post_questions.length,
    "is_active" : true,
    "is_edit_click": false,
  });
 public preQstnCnt = 0;
 public postQstnCnt = 0;
  onPreAdd(){
    let preAdd = JSON.parse(JSON.stringify(this.manual_pre() ));
    preAdd.options_json = preAdd.options_json.toString().split(' ')//.join(",")
    this.createAssessment().pre_questions.push(preAdd)
    this.manual_pre.set({
      "question_id": null,
      "question_text" : null,
      "question_type":null,
      "options_json" : [],
      "ques_order" :  this.createAssessment().pre_questions.length,
     "is_active" : true,
     "is_edit_click": false,
    });
    this.getPreCnt();
  }

  onPostAdd(){
    let manulPost = JSON.parse(JSON.stringify(this.manual_post() ));
    manulPost.options_json = manulPost.options_json.toString().split(' ')//.join(",")
    this.createAssessment().post_questions.push(manulPost)
    this.manual_post.set({
      "question_id": null,
      "question_text" : null,
      "question_type":null,
      "options_json" : [],
      "ques_order" :  this.createAssessment().post_questions.length,
     "is_active" : true,
     "is_edit_click": false,
    });
    this.getPostCnt();
  }

  getPreCnt() {
    this.preQstnCnt = this.createAssessment().pre_questions.filter((sec) => sec.is_active == true).length;
  }

  getPostCnt() {
    this.postQstnCnt = this.createAssessment().post_questions.filter((sec) => sec.is_active == true).length;
  }

  preeditQstn(qstns, qstnIn) {
    qstns.is_edit_click = !qstns.is_edit_click;
    qstns.question_text = qstns.question_text;
  }

  async pretrashQstn(qstns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      qstns.is_active = false;
      this.getPreCnt();
    }
  }

  predrop(event:CdkDragDrop<any[]>){
    moveItemInArray(this.createAssessment().pre_questions,event.previousIndex,event.currentIndex);
    this.createAssessment().pre_questions.forEach((item:any, index:number) => {
      item.ques_order =  index+1;
    });
  }

  posteditQstn(qstns, qstnIn) {
    qstns.is_edit_click = !qstns.is_edit_click;
    qstns.question_text = qstns.question_text;
  }

  async posttrashQstn(qstns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      qstns.is_active = false;
      this.getPostCnt();
    }
  }

  postdrop(event:CdkDragDrop<any[]>){
    moveItemInArray(this.createAssessment().post_questions,event.previousIndex,event.currentIndex);
    this.createAssessment().post_questions.forEach((item:any, index:number) => {
      item.ques_order =  index+1;
    });
  }
}
