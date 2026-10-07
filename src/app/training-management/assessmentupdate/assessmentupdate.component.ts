import { Component, inject, signal, OnInit, ViewChild, SecurityContext } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../shared/shared.module';
import { ImageViewerComponent } from '../../components/imageviewer/imageviewer.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HqmsService } from '../../services/hqms.service';

@Component({
  selector: 'app-assessmentupdate',
   imports: [ CommonModule, FormsModule, SelectModule, SharedModule, ImageViewerComponent],
  templateUrl: './assessmentupdate.component.html'
})
export class AssessmentupdateComponent implements OnInit {
    public santizer = inject(DomSanitizer)
    public selectedTraining = signal(null);
    @ViewChild('imgView') imgView!: ImageViewerComponent;
    constructor(private location: Location,  public _hqms: HqmsService) {}

    goBack(): void {
      this.location.back();
    }

    showFilter = false;

    filterToggle() {
      this.showFilter = !this.showFilter;
    }

  public assessmentTypesList: any = [
    {
          label: 'Pre Assessment',
          value:  'PRE',
          display:true,
          iseditable:false,
    },
    {
         label: 'Training',
          value:  'TRAINING',
          display:true,
            iseditable:false,
    },
    {
         label: 'Post Assessment',
          value:  'POST',
          display:true,
          iseditable:false,
    }
  ];
  public trainingList:any= [];
  public selectedTrainingInfo = {
   mode_of_training_name : null,
   faculty_type_name : null,
   supporting_documents : [],
   cover_images : [],
   description : null,
   assessment_type_name : null,
   faculty_name : null,
   designation_name : null,
   pre_questions : [],
   post_questions : [],
   is_preassmnt_completed : false,
   is_postassmnt_completed : false,
  };
  public onAssessmentTypeSelect = "";
  public clearInfo = JSON.stringify(this.selectedTrainingInfo);
  async onTrainingSelect(value: any) {
    if (value != null) {
      await this.getSelectedTraining(value);
    }
  }

  async  ngOnInit(){
     try{
      let trainingList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "TRAINING"
        });
       if (trainingList.status == 200) {
        this.trainingList = trainingList.data.map((ele: any) => ({
          label: ele.training_name,
          value: ele.training_id,
          faculty_name: ele.faculty_name,
          faculty_id: ele.faculty_id,
          mode_of_training_id: ele.mode_of_training_id
        }))
      };
     }catch(e){

     }
  }

  async getSelectedTraining(trainingId: any) {
    try {
       this.selectedTrainingInfo = JSON.parse(this.clearInfo)
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingAssessmentApi',
        {
          "training_id": trainingId
        });
      if (info.status == 200) {
        let editInfo = info['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let cover_images = editInfo['cover_image_file_ids'].length > 0 ? editInfo['cover_image_file_ids'] : [];
          this.selectedTrainingInfo['mode_of_training_name'] = editInfo['mode_of_training_name'];
          this.selectedTrainingInfo['faculty_type_name'] = editInfo['faculty_type_name'];
          this.selectedTrainingInfo['supporting_documents'] =   editInfo.support_doc_file_ids != null ? editInfo.support_doc_file_ids.map((ele: any) => ({
              ...ele,
              is_viewed: false,
              fileOrImageUrl: ele.fileOrImageUrl != null ? this.santizer.bypassSecurityTrustResourceUrl(ele.fileOrImageUrl) : null,
            })) : [];
          this.selectedTrainingInfo['cover_images'] = cover_images;
          this.selectedTrainingInfo['description'] = editInfo['description'];
          this.selectedTrainingInfo['faculty_name'] = editInfo['faculty_name'];
          this.selectedTrainingInfo['training_id'] = editInfo['training_id'];
          this.selectedTrainingInfo['training_schedule_id'] = editInfo['training_schedule_id'];
          this.selectedTrainingInfo['assessment_type_name'] = editInfo['assessment_type_name'];
          this.selectedTrainingInfo['is_preassmnt_completed'] = editInfo['is_preassmnt_completed'];
          this.selectedTrainingInfo['is_postassmnt_completed'] = editInfo['is_postassmnt_completed'];
          this.selectedTrainingInfo['designation_name'] = editInfo['designation_name'];
          this.selectedTrainingInfo['pre_questions'] = editInfo['pre_questions'].map((ele) => ( {...ele,  is_enable : true , is_response : ele.answer_text || null }  ) );
          this.selectedTrainingInfo['post_questions'] = editInfo['post_questions'].map((ele) => ( {...ele,  is_enable : true , is_response : ele.answer_text || null }  ) );
         this.onAssessmentTypeSelect = 'PRE';
         this.assessmentTypesList.forEach((ele)=> {
           if(editInfo['pre_questions'].length == 0 && ele.value == 'PRE' ){
            ele.display =false;
           };
           if(editInfo['post_questions'].length == 0 && ele.value == 'POST' ){
             ele.display = false;
           };
         });

      };
      };
    } catch (e) { };
  }


 async onSubmitClick(){
   try{
     let submitCnt: any = 0;
     let payLoad =  JSON.parse(JSON.stringify(this.selectedTrainingInfo));
     payLoad['action'] = "I";
     let dataArray:any = [];
     let fetchPreResponse = payLoad.pre_questions.filter((fl) => fl.is_response != null );
     let fetchPostResponse = payLoad.post_questions.filter((fl) => fl.is_response != null );
     dataArray = fetchPreResponse.concat(...fetchPostResponse);
     if(dataArray.length == 0 ){
        this._hqms.hqmsToasterService({
          key: 'att',
          severity: 'warn',
          summary: 'Atleast mark an assessment required',
          detail: 'Check the errors',
        });
        return;
     };
     dataArray.forEach((att)=> {
       att.answer_text = att.is_response;
       att.remarks = null;
       delete att.loc_id;
       delete att.org_id;
       delete att.status;
       delete att.display_seq;
       delete att.is_evidence;
       delete att.is_mandatory;
       delete att.options_json;
       delete att.question_text;
       delete att.question_type;
       delete att.updated_by_id;
       delete att.is_not_applicable;
       delete att.is_enable;
       delete att.is_response;
     });
     payLoad.questions = dataArray;
     delete payLoad.pre_questions;
     delete payLoad.post_questions;
     delete payLoad.faculty_id;
     delete payLoad.venue_name;
     delete payLoad.description;
     delete payLoad.faculty_name;
     delete payLoad.end_date_time;
     delete payLoad.training_name;
     delete payLoad.faculty_type_id;
     delete payLoad.start_date_time;
     delete payLoad.faculty_type_name;
     delete payLoad.assessment_type_name;
     delete payLoad.cover_image_file_ids;
     delete payLoad.support_doc_file_ids;
     delete payLoad.mode_of_training_name;
     delete payLoad.assessment_template_id;
     delete payLoad.supporting_documents;
     delete payLoad.cover_images;
     delete payLoad.designation_name;
     let confirmLicenseMaster = await this._hqms.showConfirmMessage();
     if (confirmLicenseMaster) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnTrainingAssessmentApi", payLoad);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Assessment',
            detail: saveResult.message,
          });
          this.onClearClick();

        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Assessment',
            detail: saveResult.message,
          });
        }
      };
   }catch(e){
   }
  }

  onClearClick(){
      this.onAssessmentTypeSelect ="";
      this.selectedTraining.set(null);
      this.selectedTrainingInfo = JSON.parse(this.clearInfo)
  }

    onViewClick(getImageInfo: any) {
    getImageInfo['is_viewed'] = !getImageInfo['is_viewed'];
    let plainUrl = this.santizer.sanitize(SecurityContext.RESOURCE_URL, getImageInfo['fileOrImageUrl'])
    this.imgView.showImage(plainUrl, getImageInfo['file_type'], false, true);
  }
}

