import { Component, signal, QueryList, ViewChildren, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { DatePipe } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { Validations } from '../../validations';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-task-assignments-add',
  standalone: true,
  imports: [CommonModule, SharedModule, FileUploadModule],
  templateUrl: './task-assignments-add.component.html',
  providers: [DatePipe]
})
export class TaskAssignmentsAddComponent implements OnInit {
  private validations = inject(Validations);
  @ViewChildren('upCoverPage') upCoverPage!: FileUpload;
  readonly FORM_NAME = 'TaskAssignAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public minDateSetter: any = signal(null);
  public errorMsg: any = {
    task_name: '', role_id: '', assigned_to_id: '', start_datetime: '',
    end_datetime: '', task_description: '',
  };
  public roleList = [];
  public assignToList = [];
  public taskAssignn: any = JSON.stringify({
    "action": "I",
    "task_id": null,
    "task_name": null,
    "role_id": null,
    "assigned_to_id": null,
    "task_description": null,
    "deadline": null,
    "start_datetime": null,
    "end_datetime": null,
    "is_active": true,
    "supporting_documents": [],
  });
  public createTaskAssign = signal<any>({ ...JSON.parse(this.taskAssignn) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createTaskAssign()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location, public _hqms: HqmsService,private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('sDATE');
      let now = new Date(getSrvrDt);
      getSrvrDt = now.toISOString().split('T')[0] + 'T00:00';
      this.minDateSetter.set(getSrvrDt)
      let getRole: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": 'ROLE'
        }, true);
      if (getRole.status == 200) {
        this.roleList = getRole.data.map((ele: any) => ({
          label: ele.role_name,
          value: ele.role_id,
        }));
      };

      let getAssignTo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        }, true);
      if (getAssignTo.status == 200) {
        this.assignToList = getAssignTo.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          specialization_name: ele.specialization_name,
        }));
      };

      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editTaskAssign(state['data']['id'])
      };
    } catch (e) { };
  }

  async editTaskAssign(taskId: any) {
    try {
      let getTaskListEdit: any = await this._hqms.customGetApiCall('GET', 'fnTaskApi',
        {
          "action": "U",
          "task_id": taskId,
          "is_active": true,
        });
      if (getTaskListEdit.status == 200) {
        let editInfo = getTaskListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let supporting_documents = editInfo['supporting_documents'] != null ? editInfo['supporting_documents'] : [];
          this.createTaskAssign.set({
            "action": "U",
            "task_id": editInfo.task_id,
            "task_name": editInfo.task_name,
            "role_id": editInfo.role_id,
            "assigned_to_id": editInfo.assigned_to_id,
            "task_description": editInfo.task_description,
            "deadline": editInfo.deadline,
            "start_datetime": editInfo.start_datetime,
            "end_datetime": editInfo.end_datetime,
            "supporting_documents": supporting_documents,
            "is_active": editInfo.is_active,
          });
        }
      };
    } catch (e) {
    };
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
        key: 'task',
        severity: 'warn',
        summary: 'Task Assignments- Task Upload',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    this.uploadError1 = false;
    thisObj.supporting_documents.push(
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
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'task',
        severity: 'warn',
        summary: 'Task Assignments',
        detail: 'Check the errors',
      });
      return;
    };
    let tasks = JSON.parse(JSON.stringify(this.createTaskAssign()));
    tasks['start_datetime'] = this._datePipe.transform(new Date(tasks['start_datetime']), 'yyyy-MM-dd hh:mm a');
    tasks['end_datetime'] = this._datePipe.transform(new Date(tasks['end_datetime']), 'yyyy-MM-dd hh:mm a');
    if (this.pageMode == 'NEW') {
      tasks['supporting_documents'] = tasks['supporting_documents'].filter((fl: any) => fl.is_active == true);
    };
    let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(tasks));
    let confirmTaskAssign = await this._hqms.showConfirmMessage();
    if (confirmTaskAssign) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnTaskApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Task Assignments',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/task-assignments-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Task Assignments',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createTaskAssign.set({ ...JSON.parse(this.taskAssignn) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/task-assignments-dashboard');
  }

}
