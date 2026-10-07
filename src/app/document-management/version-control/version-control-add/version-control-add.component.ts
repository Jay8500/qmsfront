import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import * as XLSX from 'xlsx';

// One document card on the Version Control form: details, files and access control together.
// Rules (SRS 2.3): description >= 120 characters, change summary 300-500, purpose <= 100.
// They are checked strictly when the document is submitted for approval; a draft can be saved
// with only name and type (bulk upload rows are completed later).
export const VC_RULES = { descMin: 120, summaryMin: 300, summaryMax: 500, purposeMax: 100 };

@Component({
  selector: 'app-version-control-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, FileUploadModule, SelectModule],
  templateUrl: './version-control-add.component.html',
  styleUrl: './version-control-add.component.scss'
})
export class VersionControlAddComponent implements OnInit {
  public router = inject(Router);
  public rules = VC_RULES;
  public pageMode = "NEW";
  public attachedFiles: any = [];
  selectedOptionEntry: string = 'SINGLE';
  public documentTypeList: any[] = [];
  public departmentList: any[] = [];
  public roleList: any[] = [];
  public employeeNameList: any[] = [];
  public dataEntryTypeList: any = [];
  public selectUpload: any = null;
  public approvalLevelList = [
    { label: 'Level 1 - Quality Team only', value: 'L1' },
    { label: 'Level 1 & 2 - Quality Team, then COO / MD', value: 'L1_L2' },
  ];
  public changeTypeList = [
    { label: 'Minor (v1.0 → v1.1)', value: 'MINOR' },
    { label: 'Major (v1.1 → v2.0)', value: 'MAJOR' },
  ];
  public uploadError1 = false;

  public newDocument(): any {
    return {
      "document_id": null,
      "data_entry_type_id": this.selectUpload,
      "document_no": null,
      "document_name": null,
      "document_type_id": null,
      "description": null,
      "purpose": null,
      "change_summary": null,
      "change_type": null,
      "approval_level_type": 'L1_L2',
      "department_id": null,
      "responsible_person_id": null,
      "review_date": null,
      "current_version": 1,
      "document_files": [],
      "is_expanded": true,
      "is_active": true,
      "access_control": []
    };
  }

  public createVersionControl = signal<any>({ "action": "I", "bulk_upload": [], "versions_control": [], "is_active": true });

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "DATAENTRY | DOCUMENTTYPE" });
      if (info.status == 200) {
        this.dataEntryTypeList = info.data['entities']['DATAENTRY']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }));
        this.documentTypeList = info.data['entities']['DOCUMENTTYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }))
      };
      let getDepartmentType: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": 'DEPARTMENT' });
      if (getDepartmentType.status == 200) {
        this.departmentList = getDepartmentType.data.map((ele: any) => ({ label: ele.department_name, value: ele.department_id }));
      }
      let getRoleType: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": 'ROLE' });
      if (getRoleType.status == 200) {
        this.roleList = getRoleType.data.map((ele: any) => ({ label: ele.role_name, value: ele.role_id }));
      }
      await this.loadPeople();

      let state = history.state;
      this.pageMode = state?.data?.mode || 'NEW';
      if (this.pageMode != 'NEW') {
        await this.editVersionControl(state['data']['id']);
      } else {
        const single = this.dataEntryTypeList.find((d: any) => d.value_code == 'SINGLE');
        this.selectUpload = single ? single.value : null;
        this.onDataEntryChange('SINGLE');
      }
    } catch (e) {
    };
  }

  // Staff users at this location (ids = users.user_id, as stored in responsible person / access control).
  // Older access rows may hold ids from the training faculty list, so those are added when missing.
  async loadPeople() {
    const people: any[] = [];
    try {
      const staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      if (staff?.status == 200 && Array.isArray(staff.data)) {
        staff.data.filter((ele: any) => !!ele.employee_id).forEach((ele: any) => people.push({
          label: ele.department_name ? `${ele.employee_name} (${ele.department_name})` : ele.employee_name,
          value: ele.employee_id
        }));
      }
      const faculty: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        { "faculty_type": "INTERNAL", "is_faculty": false });
      if (faculty?.status == 200 && Array.isArray(faculty.data)) {
        faculty.data.forEach((ele: any) => {
          if (ele.id && !people.some((p) => p.value == ele.id)) people.push({ label: ele.name, value: ele.id });
        });
      }
    } catch (e) { }
    this.employeeNameList = people;
  }

  async editVersionControl(documentId: any) {
    try {
      let getVersionControlEdit: any = await this._hqms.customGetApiCall('GET', 'fnDocumentApi',
        { "action": "E", "document_id": documentId });
      if (getVersionControlEdit.status == 200) {
        let editInfo = getVersionControlEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          const docs = editInfo['version_control'] || [];
          const code = docs.length > 1 ? 'MULTIPLE' : 'SINGLE';
          const entry = this.dataEntryTypeList.find((d: any) => d.value_code == code);
          this.selectUpload = entry ? entry.value : null;
          this.selectedOptionEntry = code;
          this.createVersionControl.set({
            "action": "U",
            "bulk_upload": [],
            "versions_control": docs.map((ele: any) => ({
              ...ele,
              review_date: ele.review_date ? new Date(ele.review_date) : null,
              access_control: (ele.access_control || []).map((ac: any) => ({ ...ac })),
              document_files: (ele.document_files || []).map((df: any) => ({ ...df })),
              is_active: true,
              is_expanded: true
            }))
          });
        }
      };
    } catch (e) { };
  }

  activeDocs() {
    return this.createVersionControl().versions_control.filter((v: any) => v.is_active);
  }

  isLocked(vcs: any) {
    return this.pageMode == 'VIEW' || vcs.can_edit === false;
  }

  hasApprovedVersion(vcs: any) {
    return !!vcs.current_version_no;
  }

  len(text: any) {
    return (text || '').trim().length;
  }

  // Problems that block a save (draft) - name and type only
  saveProblems(vcs: any): string[] {
    const p: string[] = [];
    if (this.len(vcs.document_name) == 0) p.push('Document Name is required');
    if (!vcs.document_type_id) p.push('Document Type is required');
    if (this.len(vcs.purpose) > this.rules.purposeMax) p.push(`Purpose: max ${this.rules.purposeMax} characters`);
    if (this.len(vcs.change_summary) > this.rules.summaryMax) p.push(`Change Summary: max ${this.rules.summaryMax} characters`);
    (vcs.access_control || []).filter((ac: any) => ac.is_active).forEach((ac: any, i: number) => {
      if (!ac.department_id && !ac.role_id && !ac.employee_id) p.push(`Access row ${i + 1}: choose a department, role or employee`);
    });
    return p;
  }

  // Extra rules checked before "Save & Submit for Approval" (same as the database check)
  submitProblems(vcs: any): string[] {
    const p = this.saveProblems(vcs);
    if (this.len(vcs.description) < this.rules.descMin) p.push(`Description: at least ${this.rules.descMin} characters`);
    const s = this.len(vcs.change_summary);
    if (s < this.rules.summaryMin || s > this.rules.summaryMax) p.push(`Change Summary: ${this.rules.summaryMin}-${this.rules.summaryMax} characters`);
    if (!vcs.department_id) p.push('Department is required');
    if (!vcs.responsible_person_id) p.push('Responsible Person is required');
    if (!vcs.approval_level_type) p.push('Approval Level is required');
    if (this.hasApprovedVersion(vcs) && !vcs.change_type) p.push('Change Type (Minor / Major) is required for a new version');
    if ((vcs.document_files || []).filter((f: any) => f.is_active).length == 0) p.push('Upload at least one file');
    return p;
  }

  private ymd(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private warn(detail: string) {
    this._hqms.hqmsToasterService({ key: 'versionControl', severity: 'warn', summary: 'Version Control', detail });
  }

  async onSubmitClick(submitForApproval: boolean = false) {
    try {
      if (this.selectUpload == null || this.selectUpload == '') {
        this.warn('Data entry upload is required');
        return;
      }
      const docs = this.activeDocs().filter((v: any) => v.can_edit !== false);
      if (docs.length == 0) {
        this.warn('At least one document is required');
        return;
      }
      for (let i = 0; i < docs.length; i++) {
        const problems = submitForApproval ? this.submitProblems(docs[i]) : this.saveProblems(docs[i]);
        if (problems.length > 0) {
          docs[i].is_expanded = true;
          this.warn(`Document ${i + 1}: ${problems[0]}${problems.length > 1 ? ` (+${problems.length - 1} more)` : ''}`);
          return;
        }
      }

      let getVCS = JSON.parse(JSON.stringify(this.createVersionControl()));
      delete getVCS['bulk_upload'];
      // keep: active documents, and removed documents that already exist (to deactivate them)
      getVCS.versions_control = getVCS.versions_control
        .filter((v: any) => v.can_edit !== false && (v.is_active || v.document_id != null))
        .map((v: any) => ({
          document_id: v.document_id,
          data_entry_type_id: this.selectUpload,
          document_no: (v.document_no || '').trim() || null,
          document_name: (v.document_name || '').trim(),
          document_type_id: v.document_type_id,
          description: (v.description || '').trim() || null,
          purpose: (v.purpose || '').trim() || null,
          change_summary: (v.change_summary || '').trim() || null,
          change_type: v.change_type || null,
          approval_level_type: v.approval_level_type || null,
          department_id: v.department_id || null,
          responsible_person_id: v.responsible_person_id || null,
          review_date: this.ymd(v.review_date),
          current_version: v.current_version || 1,
          is_active: v.is_active,
          document_files: (v.document_files || []).filter((df: any) => df.is_active || df.file_id != null),
          access_control: (v.access_control || []).filter((ac: any) => ac.is_active || ac.document_access_id != null)
            .map((ac: any) => ({
              document_access_id: ac.document_access_id || null,
              department_id: ac.department_id || null,
              role_id: ac.role_id || null,
              employee_id: ac.employee_id || null,
              can_view: ac.can_view !== false,
              can_download: !!ac.can_download,
              is_active: ac.is_active
            }))
        }));

      let formData = new FormData();
      this.attachedFiles.forEach((file: any) => formData.append("file", file.fileContent, file.fileName));
      formData.append("data", JSON.stringify(getVCS));
      const ok = await this._hqms.showConfirmMessage(submitForApproval
        ? 'Save and send for approval? The document cannot be edited while it is waiting for approval.'
        : undefined);
      if (!ok) return;
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnDocumentApi", formData);
      if (saveResult?.status != 200) {
        this.warn(saveResult?.message || 'Save failed');
        return;
      }
      let detail = saveResult.message;
      if (submitForApproval) {
        const ids = (Array.isArray(saveResult.data) ? saveResult.data : []).map((d: any) => d.document_id).filter((x: any) => !!x);
        const failed: string[] = [];
        for (const id of ids) {
          const sub: any = await this._hqms.customSaveApiCall("POST", "documentApprovalApi", { action: 'SUBMIT', document_id: id });
          if (sub?.status != 200) failed.push(sub?.message || 'Submit failed');
        }
        detail = failed.length == 0 ? 'Saved and submitted for approval' : `Saved. Not submitted: ${failed[0]}`;
      }
      this._hqms.hqmsToasterService({ severity: 'success', summary: 'Version Control', detail });
      this.attachedFiles = [];
      this.router.navigateByUrl('/version-control-dashboard');
    } catch (e) {
    }
  }

  onClearClick() {
    this.attachedFiles = [];
    this.createVersionControl.set({ "action": "I", "bulk_upload": [], "versions_control": [this.newDocument()], "is_active": true });
  }

  goBack(): void {
    this.router.navigateByUrl('/version-control-dashboard');
  }

  onDataEntryChange(option: string) {
    this.selectedOptionEntry = option;
    if (this.pageMode == 'NEW') {
      this.attachedFiles = [];
      this.createVersionControl.set({ "action": "I", "bulk_upload": [], "versions_control": [this.newDocument()], "is_active": true });
    }
  }

  onDataEntryRadio(asLst: any) {
    this.onDataEntryChange(asLst.value_code);
  }

  addDocument() {
    this.createVersionControl().versions_control.forEach((v: any) => v.is_expanded = false);
    this.createVersionControl().versions_control.push(this.newDocument());
  }

  async onBulkUploadClick(thisFile: any, fileSelected: any) {
    this.uploadError1 = false;
    const file = fileSelected.files[0];
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
      this.uploadError1 = true;
      this.warn('Accepted format: .xlsx');
      thisFile.clear();
      return;
    };
    const thisObj = this.createVersionControl();
    thisObj.bulk_upload = [{ file_name: file.name, is_active: true }];
    const reader = new FileReader();
    reader.onload = () => {
      const workBook = XLSX.read(reader.result, { type: 'binary', cellDates: true });
      const first = workBook.SheetNames[0];
      const xlData: any[] = first ? XLSX.utils.sheet_to_json(workBook.Sheets[first], { raw: false }) : [];
      if (xlData.length == 0) {
        this.warn('The sheet has no documents');
        return;
      }
      if (!xlData[0].hasOwnProperty('Document Name') || !xlData[0].hasOwnProperty('Document Type')) {
        this.warn('The sheet needs the columns Document Name and Document Type (Document No optional)');
        return;
      }
      const findBy = (list: any[], label: any) =>
        list.find((fl: any) => (fl.label || '').toLowerCase() == String(label || '').trim().toLowerCase());
      thisObj.versions_control = xlData.map((dta: any) => {
        const doc = this.newDocument();
        doc.document_no = dta['Document No'] || null;
        doc.document_name = dta['Document Name'];
        doc.document_type_id = findBy(this.documentTypeList, dta['Document Type'])?.value || null;
        doc.department_id = findBy(this.departmentList, dta['Department'])?.value || null;
        doc.purpose = dta['Purpose'] || null;
        doc.description = dta['Description'] || null;
        if (String(dta['Approval Level'] || '').toUpperCase().replace(/\s/g, '') == 'L1') doc.approval_level_type = 'L1';
        doc.is_expanded = false;
        return doc;
      });
      this.createVersionControl.set({ ...thisObj });
    };
    reader.readAsBinaryString(file);
    thisFile.clear();
  }

  onBulkUploadRemoveClick() {
    this.createVersionControl().bulk_upload = [];
  }

  onDocFileSelect(thisFile: any, fileSelected: any, vcs: any) {
    const file = fileSelected.files[0];
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowed.includes(file.type)) {
      this.warn('Accepted formats: PDF, Word, Excel');
      thisFile.clear();
      return;
    }
    if (this.attachedFiles.some((f: any) => f.fileName == file.name)) {
      this.warn('A file with this name is already added');
      thisFile.clear();
      return;
    }
    vcs.document_files.push({
      file_id: null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: null,
      fileSaveType: null,
      is_active: true,
      upload_file_name: file.name
    });
    this.attachedFiles.push({ "fileName": file.name, "fileContent": file });
    thisFile.clear();
  }

  async onDocFileRemove(doc: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      doc.is_active = false;
      this.attachedFiles = this.attachedFiles.filter((f: any) => f.fileName != doc.upload_file_name);
    }
  }

  activeFiles(vcs: any) {
    return (vcs.document_files || []).filter((f: any) => f.is_active);
  }

  trashDocument(vcsInfo: any, index: number) {
    if (vcsInfo.document_id == null) {
      (vcsInfo.document_files || []).forEach((f: any) => {
        this.attachedFiles = this.attachedFiles.filter((a: any) => a.fileName != f.upload_file_name);
      });
      this.createVersionControl().versions_control.splice(index, 1);
    } else {
      vcsInfo.is_active = false;
    };
  }

  activeAccess(vcs: any) {
    return (vcs.access_control || []).filter((ac: any) => ac.is_active);
  }

  addAccessRow(vcs: any) {
    vcs.access_control = vcs.access_control || [];
    vcs.access_control.push({
      document_access_id: null,
      department_id: null,
      role_id: null,
      employee_id: null,
      can_view: true,
      can_download: false,
      is_active: true,
    });
  }

  removeAccessRow(vcs: any, ac: any) {
    if (ac.document_access_id == null) {
      vcs.access_control.splice(vcs.access_control.indexOf(ac), 1);
    } else {
      ac.is_active = false;
    }
  }

  labelOf(list: any[], value: any) {
    return list.find((l: any) => l.value == value)?.label || '';
  }

  // Short text for the card header, e.g. "Nursing, Quality Team +1" or "Everyone"
  accessSummary(vcs: any) {
    const rows = this.activeAccess(vcs);
    if (rows.length == 0) return 'Everyone (no restriction)';
    const names = rows.map((ac: any) => this.labelOf(this.employeeNameList, ac.employee_id)
      || this.labelOf(this.roleList, ac.role_id) || this.labelOf(this.departmentList, ac.department_id) || 'Any');
    return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
  }
}
