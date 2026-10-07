import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../shared/shared.module';
import { HqmsService } from '../../services/hqms.service';

@Component({
  selector: 'app-feedbackposting',
     imports: [ CommonModule, FormsModule, SelectModule, SharedModule],
  templateUrl: './feedbackposting.component.html'
})
export class FeedbackpostingComponent implements OnInit {
  public selectedTraining = signal(null);

  constructor(private location: Location,  public _hqms: HqmsService) {}

    goBack(): void {
      this.location.back();
    }

    showFilter = false;

    filterToggle() {
      this.showFilter = !this.showFilter;
    }

  public trainingList:any= [];
  public selectedTrainingInfo = {
   is_fb_completed : false,
   mode_of_training_name : null,
   faculty_type_name : null,
   supporting_documents : [],
   cover_images : [],
   description : null,
   faculty_name : null,
   designation_name : null,
   training_id : null,
   training_schedule_id : null,
   feedback_question : [],
  };
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
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingAttendeeFeedbackApi',
        {
          "training_id": trainingId
        });
      if (info.status == 200) {
        let editInfo = info['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.selectedTrainingInfo['mode_of_training_name'] = editInfo['mode_of_training_name'];
          this.selectedTrainingInfo['is_fb_completed'] = editInfo['is_fb_completed'];
          this.selectedTrainingInfo['faculty_type_name'] = editInfo['faculty_type_name'];
          this.selectedTrainingInfo['training_id'] = editInfo['training_id'];
          this.selectedTrainingInfo['training_schedule_id'] = editInfo['training_schedule_id'];
          this.selectedTrainingInfo['description'] = editInfo['description'];
          this.selectedTrainingInfo['faculty_name'] = editInfo['faculty_name'];
          this.selectedTrainingInfo['designation_name'] = editInfo['designation_name'];
          this.selectedTrainingInfo['feedback_question'] = editInfo['feedback_question'].map((ele) => ( {...ele,  is_enable : true , is_response : ele.answer_text || null  }  ) );
        }
      };
    } catch (e) { };
  }


 async onSubmitClick(){
   try{
     let submitCnt: any = 0;
     let payLoad =  JSON.parse(JSON.stringify(this.selectedTrainingInfo));
     payLoad['action'] = "I"
     if(payLoad.feedback_question.filter((fl) => fl.is_response != null ).length == 0 ){
        this._hqms.hqmsToasterService({
          key: 'att',
          severity: 'warn',
          summary: 'Atleast  Feedback required',
          detail: 'Check the errors',
        });
        return;
     };
      payLoad.feedback_question.forEach((att)=> {
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
       delete att.is_active;
     });
     payLoad.questions = payLoad.feedback_question;
     delete payLoad.feedback_question;
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
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnTrainingAttendeeFeedbackApi", payLoad);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Feedback',
            detail: saveResult.message,
          });
          this.onClearClick();

        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Feedback',
            detail: saveResult.message,
          });
        }
      };
   }catch(e){
   }
  }

    onClearClick(){
      this.selectedTraining.set(null);
      this.selectedTrainingInfo = JSON.parse(this.clearInfo)
    }
}

