import { Component, signal, QueryList, ViewChild, ViewChildren, inject, OnInit, SecurityContext } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
interface createTraining {
  "action": string,
  "training_id": any,
  "training_name": any,
  "description": any,
  "mandatory_flag": true,
  "faculty_type_id": any,
  "faculty_id": any,
  "faculty_name": any,
  "specialization_id": any,
  "specialization_name": any,
  "mode_of_training_id": any,
  "supporting_documents": [],
  "cover_images": [],
  "is_active": boolean,
  "is_feedback": boolean,
  "feedback_documents": any,
  "feedback_question": any,
};
import { ImageViewerComponent } from '../../components/imageviewer/imageviewer.component';
import { HqmsService } from '../../services/hqms.service';
import { Validations } from '../../validations';
import { SharedModule } from '../../shared/shared.module';
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import * as _ from 'lodash';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-training-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FileUploadModule,
    SharedModule, DragDropModule, ImageViewerComponent
  ],
  templateUrl: './training-add.component.html',
  styleUrl: './training-add.component.scss',
})
export class TrainingAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'NewTrainingForm';
  public router: any = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public santizer = inject(DomSanitizer);
  @ViewChild('imgView') imgView!: ImageViewerComponent;

  @ViewChild('sprtngDocs') sprtngDocs!: FileUpload;
  @ViewChild('upCoverPage') upCoverPage!: FileUpload;

  public errorMsg: any = { training_name: '', mode_of_training: '', faculty_type_id: '', faculty_id: '', description: '' };
  public trainingModeList = [];
  public facultyTypeList = [];
  public facultyNameList = [];
  public facultyDesigList = [
    {
      label: "Desig",
      value: 1
    },
  ];
  public selectedFcltyType: any = signal(null);
  public initialTraining: any = JSON.stringify({
    "action": "I", //INSERT
    "training_id": null,
    "training_name": "",
    "description": "",
    "mandatory_flag": true,
    "faculty_type_id": null,
    "faculty_id": null,
    "faculty_name": null,
    "specialization_id": null,
    "specialization_name": null,
    "mode_of_training_id": null,
    "supporting_documents": [],
    "cover_images": [],
    "is_active": true,
    "is_feedback": false,
    "feedback_documents": [],
    "feedback_question": [],
  });
  public createTraining = signal<createTraining>({ ...JSON.parse(this.initialTraining) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createTraining()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  onModeOfTrainingChange() {
    const result = this.validations.validateField(this.FORM_NAME, 'mode_of_training', this.createTraining().mode_of_training_id);
    this.errorMsg['mode_of_training'] = result?.message || '';
  }

  async onFacultyTypeChange() {
    const result = this.validations.validateField(this.FORM_NAME, 'faculty_type_id', this.createTraining().faculty_type_id);
    this.errorMsg['faculty_type_id'] = result?.message || '';
    let value = this.createTraining().faculty_type_id;
    if (value != null) {
      if (!["", null].includes(value)) {
        if (this.facultyTypeList.length > 0) {
          this.selectedFcltyType.set(this.facultyTypeList.filter((fl: any) => fl.value == value)[0]["value_code"])
          await this.onGetFaculty()
        };
      };
    };
  }

  onQuestionTypeChange() {
    this.manual_qstn().options_json = [];
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "FACULTYTYPE | MODEOFTRAINING" });
      if (info.status == 200) {
        this.facultyTypeList = info.data['entities']['FACULTYTYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.trainingModeList = info.data['entities']['MODEOFTRAINING']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editTraining(state['data']['id'])
      };
    } catch (e) {
    };
  }

  async editTraining(trainingId: any) {
    try {
      let getTraningsListEdit: any = await this._hqms.customGetApiCall('GET', 'trainingWriteApi',
        {
          "training_id": trainingId
        });
      if (getTraningsListEdit.status == 200) {
        let editInfo = getTraningsListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let findSlctdFaclty = this.facultyTypeList.filter((d: any) => d.value == editInfo['faculty_type_id']);
          if (findSlctdFaclty.length > 0) {
            this.selectedFcltyType.set(findSlctdFaclty[0]['value_code'])
            await this.onGetFaculty();
          };
          let cover_images = editInfo['cover_image_file_ids'].length > 0 ? editInfo['cover_image_file_ids'] : [];
          let feedback_documents = editInfo['feedback_documents'].length > 0 ? editInfo['feedback_documents'] : [];
          this.createTraining.set({
            "action": "U",
            "training_id": trainingId,
            "training_name": editInfo['training_name'],
            "description": editInfo['description'],
            "mandatory_flag": editInfo['mandatory_flag'],
            "faculty_type_id": editInfo['faculty_type_id'],
            "faculty_id": editInfo['faculty_id'],
            "faculty_name": editInfo['faculty_name'],
            "specialization_id": editInfo['specialization_id'],
            "specialization_name": editInfo['specialization_name'],
            "mode_of_training_id": editInfo['mode_of_training_id'],
            "supporting_documents": editInfo.support_doc_file_ids != null ? editInfo.support_doc_file_ids.map((ele: any) => ({
              ...ele,
              fileOrImageUrl: ele.fileOrImageUrl != null ? this.santizer.bypassSecurityTrustResourceUrl(ele.fileOrImageUrl) : null,
            })) : [],
            "cover_images": editInfo.cover_image_file_ids != null ? editInfo.cover_image_file_ids.map((ele: any) => ({
              ...ele,
              fileOrImageUrl: ele.fileOrImageUrl != null ?
                ele.fileOrImageUrl : null,
            })) : [],
            "is_active": editInfo['is_active'],
            "is_feedback": editInfo['is_feedback'],
            "feedback_documents": feedback_documents,
            "feedback_question": editInfo['feedback_question'].map((ele: any) => ({ ...ele, is_edit_click: false, question_type: ele.answer_type })),
          })
        }
      };
    } catch (e) {
      console.log("E e", e)
    };
  }

  getActiveimg(image: any) {
    let active = image.filter((im: any) => im.is_active == true);
    return active.length;
  }
  public uploadError = false;
  async  onFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError = false;
    // if (!['application/pdf'].includes(fileSelected.files[0].type)) {
    //   this.uploadError = true;
    //   this._hqms.hqmsToasterService({
    //     key: 'training',
    //     severity: 'warn',
    //     summary: 'Training - Supporting Documents',
    //     detail: 'Accepted Formats were .pdf',
    //   });
    //   setTimeout(() => {
    //     thisFile.clear();
    //     this.uploadError = false;
    //   }, 3000);
    //   return;
    // };
    this.uploadError = false;
    thisObj.supporting_documents.push(
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
    thisFile.clear();
  }

  async removeImage(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      this.uploadError = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
    };
    this.sprtngDocs.clear();
  }

  getCoverPageActiveimg(image: any) {
    let active = image.filter((im: any) => im.is_active == true);
    return active.length;
  }
  public uploadError1 = false;

  async  onCoverPageFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    if (['application/pdf'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'training',
        severity: 'warn',
        summary: 'Training - Cover Page',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    this.uploadError1 = false;
    thisObj.cover_images.push(
      {
        file_id: null,
        file_name: fileSelected.files[0].name,
        file_type: fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
        fileSaveType: null,
        is_active: true,
        upload_file_name: fileSelected.files[0].name
      });
    this.attachedFiles.push({ "fileName": fileSelected.files[0].name, "fileContent": fileSelected.files[0] });
    thisFile.clear();
  }

  async removeCoverPageImage(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      this.uploadError1 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
      this.upCoverPage.clear();
    }
  }

  async onSubmitClick() {
    try {
      this.onGetErrorMsgs('training_name');
      this.onModeOfTrainingChange();
      this.onGetErrorMsgs('faculty_id');
      this.onGetErrorMsgs('description');
      const facultyTypeResult = this.validations.validateField(this.FORM_NAME, 'faculty_type_id', this.createTraining().faculty_type_id);
      this.errorMsg['faculty_type_id'] = facultyTypeResult?.message || '';
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid || this.uploadError || this.uploadError1) {
        this._hqms.hqmsToasterService({
          key: 'training',
          severity: 'warn',
          summary: 'Training',
          detail: 'Check the errors',
        });
        return;
      };
      let training = JSON.parse(JSON.stringify(this.createTraining()));

      if (this.pageMode == 'NEW') {
        training['supporting_documents'] =
          training['supporting_documents'].filter((fl: any) => fl.is_active == true);
        training['cover_images'] =
          training['cover_images'].filter((fl: any) => fl.is_active == true);
        training['feedback_question'] = training['feedback_question'].filter((fl) => fl.is_active == true);
      };

      if (training.is_feedback == false) {
        delete training.feedback_question;
      }
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(training));
      let confirmTraining = await this._hqms.showConfirmMessage();
      if (confirmTraining) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "trainingWriteApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Training',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/master-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Training',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.uploadError = false;
    this.questionCnt = 0;
    this.uploadError1 = false;
    this.facultyNameList = [];
    this.createTraining.set({ ...JSON.parse(this.initialTraining) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.selectedFcltyType.set(null);
  }

  goBack(): void {
    this.router.navigateByUrl('/master-dashboard');
  }

  async onGetFaculty() {
    try {
      this.facultyNameList = [];
      let getFaculty: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": this.selectedFcltyType(),
          "is_faculty": true
        });
      if (getFaculty.status == 200) {
        this.facultyNameList = getFaculty.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          specialization_name: ele.specialization_name,
        }))
      };
    } catch (e) { };
  }

  async  onFeedbackUpload(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    thisObj.feedback_documents = [];
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'audit',
        severity: 'warn',
        summary: 'Feedback questions',
        detail: 'Accepted Formats were .xlsx',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    thisObj.feedback_documents.push(
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
            key: 'audit',
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
            key: 'feeback',
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
          thisObj['feedback_question'].push(qstns);
        });
        thisObj['feedback_question'] = thisObj['feedback_question'].sort((a: any, b: any) => parseInt(a['ques_order']) - parseInt(b['ques_order']));
        this.getQstnCnt();
      };
      reader.readAsBinaryString(file);
    };
    thisFile.clear();
  }

  async removeFeedback(doc: any, imgIndex: any) {
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
      this.createTraining().feedback_question = [];
    };
    this.sprtngDocs.clear();
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
    "ques_order": this.createTraining().feedback_question.length,
    "is_active": true,
    "is_edit_click": false,
  });

  onManualAdd() {
    let manualTrng = JSON.parse(JSON.stringify(this.manual_qstn()));
    if (manualTrng.question_type != "FREE_TEXT") {
      manualTrng.options_json = manualTrng.options_json.split(' ')//.join(",")
    };
    this.createTraining().feedback_question.push(manualTrng)
    this.manual_qstn.set({
      "question_id": null,
      "question_text": null,
      "question_type": null,
      "options_json": [],
      "ques_order": this.createTraining().feedback_question.length,
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
    this.questionCnt = this.createTraining().feedback_question.filter((sec) => sec.is_active == true).length;
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.createTraining().feedback_question, event.previousIndex, event.currentIndex);
    this.createTraining().feedback_question.forEach((item: any, index: number) => {
      item.ques_order = index + 1;
    });
  }

  public isVisibile: boolean = false;
  public headerText: string = "";
  onViewClick(getImageInfo: any) {
    this.headerText = (getImageInfo['file_name'] || '').toUpperCase()
    this.imgView.docType = '';
    this.isVisibile = true;
    let plainUrl: any = "";
    if (!["image/png", "image/jpg"].includes(getImageInfo.file_type)) {
      plainUrl = this.santizer.sanitize(SecurityContext.RESOURCE_URL, getImageInfo['fileOrImageUrl'])
    } else {
      plainUrl = getImageInfo['fileOrImageUrl']
    }
    this.imgView.showImage(plainUrl, getImageInfo['file_type'], false, true);
  }


  onFeedBackClick() {
    if (this.createTraining().is_feedback == false) {
      this.createTraining().feedback_documents = [];
      this.createTraining().feedback_question = [];
    };
  }
}
