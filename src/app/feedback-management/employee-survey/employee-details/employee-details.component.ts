import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { ImageViewerComponent } from '../../../components/imageviewer/imageviewer.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-employee-details',
  imports: [SharedModule, ImageViewerComponent],
  templateUrl: './employee-details.component.html',
})
export class EmployeeDetailsComponent implements OnInit {
  @ViewChild('imgView') imgView!: ImageViewerComponent;
  public santizer = inject(DomSanitizer)
  public router = inject(Router);
  public empDetails: any = {
    ess_survey_id: null,
    survey_name: null,
    participants_type_name: null,
    from_date: null,
    to_date: null,
    total_participants_cnt: null,
    total_satisfactory_cnt: null,
    attachedDoc: [],//NA
    remarksInfo: [],//NA
    surveyInfo: [],//NA
  };

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    let state = history.state;
    if (state != null) {
      await this.editEmpDetails(state['data']['id'])
    };
  }

  async editEmpDetails(essSurveyId: any) {
    try {
      let getEmpDetailsEdit: any = await this._hqms.customGetApiCall('GET', 'fnEssSRViewCapaReviewApi',
        {
          // "action": "E",
          "ess_survey_id": essSurveyId,
        });
      if (getEmpDetailsEdit.status == 200) {
        let editInfo = getEmpDetailsEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.empDetails = {
            ess_survey_id: editInfo.ess_survey_id,
            survey_name: editInfo.survey_name,
            participants_type_name: editInfo.participants_type_name,
            from_date: editInfo.from_date,
            to_date: editInfo.to_date,
            total_participants_cnt: editInfo.total_participants_cnt,
            total_satisfactory_cnt: editInfo.total_satisfactory_cnt,
            attachedDoc: editInfo.document_files != null ? editInfo.document_files.map((ele: any) => ({
              ...ele,
              is_viewed: false,
              fileOrImageUrl: ele.fileOrImageUrl != null ? this.santizer.bypassSecurityTrustResourceUrl(ele.fileOrImageUrl) : null,
            })) : [],
            remarksInfo: editInfo.remarksInfo || [],
            surveyInfo: editInfo.surveyInfo || [],
          };
        }
      };
    } catch (e) { };
  }

  onViewClick(getImageInfo: any) {
    getImageInfo['is_viewed'] = !getImageInfo['is_viewed']
    this.imgView.showImage(getImageInfo['fileOrImageUrl'], getImageInfo['file_type'], false, true);
  }

  showRemarks = false;

  toggleRemarks() {
    this.showRemarks = !this.showRemarks;
  }

}
