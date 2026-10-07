import { Component, OnInit, signal } from '@angular/core';
import { HqmsService } from '../../../services/hqms.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-audit-master-details',
  templateUrl: './audit-master-details.component.html',
})
export class AuditMasterDetailsComponent implements OnInit {
  public readOnlyAdt: any = signal({
    action: "I", //INSERT
    audit_template_id: null,
    audit_type_id: null,
    audit_type: null,
    audit_template_code: null,
    audit_name: "",
    category_type_id: null,
    category_type: null,
    capa_required: "Y",
    mandatory_flag: true,
    section_documents: [],
    sections_temp: [],
    sections: [],
    question_documents: [],
    questions: [],
    questions_temp: [],
    is_active: true,
    updated_at: null,
    status: null,
  })
  constructor(private location: Location, public _hqms: HqmsService, ) { }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editAudit(state['data']['id'])
      }
    } catch (e) {

    };
  }

  async editAudit(audit_template_id: any) {
    try {
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
          let sections = editInfo['sections'].length > 0 ? editInfo['sections'] : [];
          let getQstns: any = [];
          let qstnCnt = 0;
          if (editInfo['sections'].length > 0) {
            editInfo['sections'].forEach((ele) => {
              qstnCnt = qstnCnt + ele['questions'].length
            })
          };
          this.readOnlyAdt.set({
            "action": "U",
            "audit_template_id": editInfo['audit_template_id'],
            "audit_type_id": editInfo['audit_type_id'],
            "audit_type": editInfo['audit_type'],
            "audit_name": editInfo['audit_name'],
            "category_type_id": editInfo['category_type_id'],
            "capa_required": editInfo['capa_required'],
            "mandatory_flag": editInfo['mandatory_flag'],
            "section_documents": sctnDoc,
            "sections_temp": sections,
            "sections": sections,
            "question_documents": qstnDoc,
            "questions": qstnCnt,
            "questions_temp": qstnCnt,
            "is_active": editInfo['is_active'],
            "updated_at": editInfo['updated_at'],
            "status": editInfo['status'],
            "audit_template_code": editInfo['audit_template_code'],
            "category_type": editInfo['category_type'],
          });
        };
      };
    } catch (e) { };
  }

}
