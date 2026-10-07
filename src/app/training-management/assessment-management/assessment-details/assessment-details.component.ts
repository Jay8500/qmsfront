import { Component, signal, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
@Component({
  selector: 'app-assessment-details',
  imports: [SharedModule],//ImageViewerComponent
  templateUrl: './assessment-details.component.html',
  schemas: [NO_ERRORS_SCHEMA]
})
export class AssessmentDetailsComponent implements OnInit {
  public readOnlyAssesment: any = signal({
    "action": "I", //INSERT
    "assessment_template_id": null,
    "training_id": "",
    "assessment_type_id": null,
    "total_score": null,
    "pass_mark": null,
    "pre_assessment_files": [],
    "post_assessment_files": [],
    "training_name": null,
    "assessment_type_name": null,
    "total_questions": null,
    "updated_at": null,
    "created_at": null,
    "is_active": true,
    "status": null,
    "pre_assessment_file": [],
    "post_assessment_file": [],
    "pre_questions" : [],
    "post_questions" : [],
  })

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editAssessment(state['data']['id'])
      };
    } catch (e) { }
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
          this.readOnlyAssesment.set({
            "action": "U",
            "training_id": editInfo['training_id'],
            "assessment_type_id": editInfo['assessment_type_id'],
            "total_score": editInfo['total_score'],
            "pass_mark": editInfo['pass_mark'],
            "pre_assessment_files": pre_assessment_files,
            "post_assessment_files": post_assessment_files,
            "assessment_template_id": editInfo['assessment_template_id'],
            "training_name": editInfo["training_name"],
            "assessment_type_name": editInfo["assessment_type_name"],
            "total_questions": editInfo["total_questions"],
            "created_at": editInfo["created_at"],
            "updated_at": editInfo["updated_at"],
            "pre_assessment_file": editInfo["pre_assessment_file"],
            "post_assessment_file": editInfo["post_assessment_file"],
            "pre_questions": editInfo["pre_questions"],
            "post_questions": editInfo["post_questions"],
            "is_active": editInfo["is_active"],
            "status": editInfo["status"],
          });
          // this.isAssessMentType = this.assessmentTypesList.filter((ty) => ty.value == editInfo['assessment_type_id'])[0]['value_code']
        }
      };
    } catch (e) {
    };
  }

  goBack(): void {
    this.location.back();
  }

}
