import { Component, signal, inject, OnInit, SecurityContext } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
interface essFilters {
  "action": string,
  "ess_survey_id": any,
  "survey_name": any,
  "participants_type_id": any,
  "from_date": any,
  "to_date": any,
  "questions": any,
  "section_documents": any,
  "is_active": boolean,
};
import { SelectModule } from 'primeng/select';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import * as _ from 'lodash';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Validations } from '../../validations';

@Component({
  selector: 'app-employee-survey-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FileUploadModule, SharedModule, DragDropModule],
  templateUrl: './employee-survey-add.component.html',
  styleUrl: './employee-survey-add.component.scss'
})
export class EmployeeSurveyAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'NewEmpSurvey';
  public router: any = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public santizer = inject(DomSanitizer);
  public errorMsg: any = {
    survey_name: '',
    participants_type_id: '',
    from_date: '',
    to_date: '',
  };
  public participantsList = [];
  public initialEmpSurvey: any = JSON.stringify({
    "action": "I", //INSERT
    "ess_survey_id": null,
    "survey_name": null,
    "participants_type_id": null,
    "from_date": null,
    "to_date": null,
    "questions": [],
    "section_documents": [],
    "is_active": true,
  });
  public essFilters = signal<essFilters>({ ...JSON.parse(this.initialEmpSurvey) });
  public minDateSetter: any = signal(null);

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.essFilters()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  onQuestionTypeChange() {
    if (this.manual_qstn().question_type != null) {
      this.manual_qstn().options_json = [];
    };
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(getSrvrDt)
      let getParticipants: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "ROLE" });
      if (getParticipants.status == 200) {
        this.participantsList = getParticipants.data.map((ele: any) => ({
          label: ele.role_name,
          value: ele.role_id
        }))
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editEmpSurvey(state['data']['id'])
      };
    } catch (e) {
    };
  }

  async editEmpSurvey(essSurveyId: any) {
    try {
      let getEmpSurveyEdit: any = await this._hqms.customGetApiCall('GET', 'fnEssSurveyApi',
        {
          "ess_survey_id": essSurveyId
        });
      if (getEmpSurveyEdit.status == 200) {
        let editInfo = getEmpSurveyEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let section_documents = editInfo['section_documents'].length > 0 ? editInfo['section_documents'] : [];
          this.essFilters.set({
            "action": "U",
            "ess_survey_id": essSurveyId,
            "survey_name": editInfo['survey_name'],
            "participants_type_id": editInfo['participants_type_id'],
            "from_date": editInfo['from_date'],
            "to_date": editInfo['to_date'],
            "section_documents": section_documents,
            "questions": editInfo['questions'].map((ele: any) => ({ ...ele, is_edit_click: false, question_type: ele.answer_type })),
            "is_active": editInfo['is_active'],
          })
        }
      };
    } catch (e) {
    };
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'empSurvey',
          severity: 'warn',
          summary: 'Survey Entry',
          detail: 'Check the errors',
        });
        return;
      };
      let empSurvey = JSON.parse(JSON.stringify(this.essFilters()));
      if (this.pageMode == 'NEW') {
        empSurvey['questions'] = empSurvey['questions'].filter((fl) => fl.is_active == true);
      };
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(empSurvey));
      let confirmEmpSurvey = await this._hqms.showConfirmMessage();
      if (confirmEmpSurvey) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnEssSurveyApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Survey Entry',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/employee-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Survey Entry',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.questionCnt = 0;
    this.essFilters.set({ ...JSON.parse(this.initialEmpSurvey) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/employee-dashboard');
  }

  async  onEmpSurveyUpload(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    thisObj.section_documents = [];
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this._hqms.hqmsToasterService({
        key: 'empSurvey',
        severity: 'warn',
        summary: 'Survey Questions',
        detail: 'Accepted Formats were .xlsx',
      });
      setTimeout(() => {
        thisFile.clear();
      }, 3000);
      return;
    };
    thisObj.section_documents.push(
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
            key: 'empSurvey',
            severity: 'warn',
            summary: 'Bulk Upload',
            detail: 'Sections with Questions required',
          });
          return;
        }
        if (!xlData[0].hasOwnProperty('Question Text') &&
          !xlData[0].hasOwnProperty('Answer Type') &&
          !xlData[0].hasOwnProperty('Question Order') &&
          !xlData[0].hasOwnProperty('Options')
        ) {
          this._hqms.hqmsToasterService({
            key: 'empSurvey',
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
            "options_json": (qstnEle['Options'] || "").split(' '),
            "ques_order": parseInt(qstnEle['Question Order']),
            "is_active": true,
            "is_edit_click": false,
          };
          thisObj['questions'].push(qstns);
        });
        thisObj['questions'] = thisObj['questions'].sort((a: any, b: any) => parseInt(a['ques_order']) - parseInt(b['ques_order']));
        this.getQstnCnt();
      };
      reader.readAsBinaryString(file);
    };
    thisFile.clear();
  }

  async removeEmpSurvey(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
      this.questionCnt = 0;
      this.essFilters().questions = [];
    };
  }

  public questionType = [
    {
      label: "MCQ's",
      value: "MCQ"
    },
    {
      label: "Free text",
      value: "FREE_TEXT"
    },
  ]
  public manual_qstn = signal({
    "question_id": null,
    "question_text": null,
    "question_type": null,
    "options_json": [],
    "ques_order": this.essFilters().questions.length,
    "is_active": true,
    "is_edit_click": false,
  });

  onManualAdd() {
    let manualTrng = JSON.parse(JSON.stringify(this.manual_qstn()));
    if (manualTrng.question_type != "FREE_TEXT") {
      manualTrng.options_json = manualTrng.options_json.split(' ')//.join(",")
    };
    this.essFilters().questions.push(manualTrng)
    this.manual_qstn.set({
      "question_id": null,
      "question_text": null,
      "question_type": null,
      "options_json": [],
      "ques_order": this.essFilters().questions.length,
      "is_active": true,
      "is_edit_click": false,
    });
    this.getQstnCnt();
  }

  public questionCnt: number = 0;
  editQstn(qstns, qstnIn) {
    qstns.is_edit_click = !qstns.is_edit_click;
    qstns.question_text = qstns.question_text;
  }

  async trashQstn(qstns) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete`);
    if (confirm) {
      qstns.is_active = false;
      this.getQstnCnt();
    }
  }

  getQstnCnt() {
    this.questionCnt = this.essFilters().questions.filter((sec) => sec.is_active == true).length;
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.essFilters().questions, event.previousIndex, event.currentIndex);
    this.essFilters().questions.forEach((item: any, index: number) => {
      item.ques_order = index + 1;
    });
  }

}
