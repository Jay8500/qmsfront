import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { HqmsService } from '../../../services/hqms.service';
import { Location,CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
@Component({
    selector: 'app-manage-meetings-add',
    standalone:true,
    templateUrl: './manage-meetings-add.component.html',
    styleUrl: './manage-meetings-add.component.scss',
    imports: [FormsModule,CommonModule, SharedModule,SelectModule,FileUploadModule]
})
export class ManageMeetingsAddComponent implements OnInit {
  public attachedFiles: any = [];
  public minDateSetter: any = signal(null);
  public assignerList:any = [];
  public actionStatusList:any = [];
  public pageMode:string = 'NEW';
  public router = inject(Router);
  public createMom :any = {
    "action":"I",
    "mom_id":null,
    meeting_id: null,
    meetingCode: null,
    meetingName: null,
    meetingDate: null,
    meetingPeriod: null,
    meetingStatus: null,
    meetingAgenda: [],
    mom_decision : [
				{
            "index" : 1,
						"mom_decision_id" : null,
						"is_active" : true,
						"decision_text" : null,
            "row_group" : 1,
						"mom_action" : [
							{
                "index" : 1,
								"mom_action_id" : null,
								"is_active" : true,
								"action_text" : null,
								"assigned_to_id": null,
								"planned_closure_date" : null,
								"action_status_id" : null,
								"mom_act_documents":[	]
							}
						]
				}
			],
    mom_old : []
  }
  constructor(private location: Location,public _hqms: HqmsService) {}

  goBack(): void {
    this.location.back();
  }

  async ngOnInit(){
    try{
     let momInfo: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "MOMSTATUS" });
      if (momInfo.status == 200) {
        this.actionStatusList = momInfo.data.entities.MOMSTATUS.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
      };

      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(getSrvrDt)
      let state = history.state;
       if(state?.data?.id){
        let participants: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "MOMPRTCPNT",
           "meeting_id": state['data']['id']
        });
       if (participants.status == 200) {
          this.assignerList = participants.data.map((ele: any) => ({
            label: ele.meeting_user_name,
            value: ele.meeting_user_id,
          }))
       };
        await this.getMeeting(state['data']['id'])
       };
    }catch(e){
    };
  }

  async getMeeting(id){
   try{
        let meeting: any = await this._hqms.customGetApiCall('GET', 'fnMomApi',
        {
          "meeting_id": id
        });
      if (meeting.status == 200) {
        let meetingInfo = meeting['data'][0];
        this.createMom['mom_id'] = meetingInfo.mom_id;
        this.createMom['meeting_id'] = meetingInfo.meeting_id;
        this.createMom['meetingCode'] = meetingInfo.meeting_code;
        this.createMom['meetingName'] = meetingInfo.meeting_name;
        this.createMom['meetingDate']=meetingInfo.meeting_date;
        this.createMom['meetingPeriod']=meetingInfo.meeting_period;
        this.createMom['meetingStatus']=meetingInfo.status;
        this.createMom['meetingAgenda'] = meetingInfo.meeting_agenda;
        if( meetingInfo.mom_decision.length > 0){
         this.createMom['mom_decision'] = meetingInfo.mom_decision.map((ele, index:number)=> ({
              ...ele,
              index : index +1 ,
              row_group : ele.mom_action.length +1,
              mom_action : ele.mom_action.map((ac,index)=> ({ ...ac, index :index+1  })  )
              }) );
        };

        let olderMoms:any = [];
        meetingInfo['mom_old'].forEach((old:any,odIn:number)=> {
         old['mom_decision'].forEach((dec:any, index:number)=> {
          olderMoms.push({
            ...dec,
            mom_id: old.mom_id,
           index : odIn +1 ,
           is_active : dec.is_active,
           row_group : dec.mom_action.length,
           mom_action : dec.mom_action.map((ac,acindex:any)=> ({ ...ac, index :acindex+1, is_active : ac.is_active  })  )
          })
         });
        });
       this.createMom['mom_old'] = olderMoms;
      }
   }catch(e){
   };
  }

  isLastActiveVisible(currentIndex:number):boolean{
    let activeConfigs = this.createMom.mom_decision.filter((c=>c.is_active));
    let lastActiveItem = activeConfigs[activeConfigs.length-1];
    let canAddmore = activeConfigs.length > 0;
    return canAddmore;
  }

  onAddDecison(decsion:any){
   let nextDecision = JSON.parse(JSON.stringify(decsion));
   nextDecision['index'] = nextDecision.index+1;
   nextDecision['mom_decision_id'] = null;
   nextDecision['is_active']= true;
   nextDecision['decision_text']= null;
   nextDecision['mom_action'] = [{
                "index": 1,
     	          "mom_action_id" : null,
								"is_active" : true,
								"action_text" : null,
								"assigned_to_id": null,
								"planned_closure_date" : null,
								"action_status_id" : null,
								"mom_act_documents":[	]
   }];
   nextDecision['row_group'] +=1;
   this.createMom.mom_decision.push(nextDecision)
  }

  onDeleteDecison(dosePrp:any,index:number){
    if(index > 0){
      dosePrp.is_active = false;
      dosePrp.mom_action.forEach((actn)=> {
        actn.is_active = false;
      })
    }
    this.createMom.mom_decision.forEach((dec, ind)=> {
      let getActive = this.createMom.mom_decision.filter(ac=> ac.is_active == true);
      getActive.forEach((ele, index)=> {
         ele.index = index+1
      })
    })
  }

   isActionLastActiveVisible(currentIndex:number, parentIndex:number):boolean{
    let activeConfigs = this.createMom.mom_decision[parentIndex]['mom_action'].filter((c=>c.is_active));
    let lastActiveItem = activeConfigs[activeConfigs.length-1];
    let canAddmore = activeConfigs.length > 0;
    return canAddmore;
  }

  onActionAddDecison(actn:any,parentIn:number){
   let nextAction = JSON.parse(JSON.stringify(actn));
   nextAction['index'] = nextAction.index + 1;
   nextAction['mom_action_id']= null;
   nextAction['decision_text']= null;
   nextAction['is_active'] = true;
   nextAction['action_text'] = null;
   nextAction['assigned_to_id'] = null;
   nextAction['planned_closure_date'] = null;
   nextAction['action_status_id'] = null;
   nextAction['mom_act_documents'] =  [];
   this.createMom.mom_decision[parentIn]['mom_action'].push(nextAction);
  }

  onActionDeleteDecison(action:any,index:number,parentIn:number){
    if(index > 0){
      action.is_active = false;
      action.mom_act_documents.forEach((ele)=> {
        ele.is_active =false
      })
    }
     this.createMom.mom_decision[parentIn]['mom_action'].forEach((actns, ind)=> {
      let getActive = this.createMom.mom_decision[parentIn]['mom_action'].filter(ac=> ac.is_active == true);
      getActive.forEach((ele, ind)=> {
         ele.index = ind+1
      })
    })
  }

  async  onDOCBulkUploadClick(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    thisObj.mom_act_documents = [];
    thisObj.mom_act_documents.push(
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

  async onDOCBulkUploadRemoveClick(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      if (thisFileIndex >= 0) {

      };
      // this.preAssess.clear();
    }
  }

  async  onSubmitClick(){
    try {
      let getMom = JSON.parse(JSON.stringify(this.createMom));
      let isValidForApi = (data) => {
        let hasName = (str) => !!str && str.trim().length > 0;
        return data.filter(parent =>
        hasName(parent.decision_text) && (parent.mom_action?.some(cld=> hasName(cld.action_text)))
        )
      }
      let readyApi = isValidForApi(getMom['mom_decision']);
      if (readyApi.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'MOM',
          severity: 'warn',
          summary: 'MOM',
          detail: 'Atleast Decision with an Action is required',
        });
        return;
      };
       getMom['mom_decision'].forEach(dec => {
        dec['sno'] = dec['index'];
        delete dec['row_group'];
        dec['mom_action'].forEach(actn => {
         actn['sno'] = actn['index'];
        });
       });
       getMom['mom_old'].forEach((old,oldIndex) => {
         old['sno'] = oldIndex + 1;
        old['mom_action'].forEach((actn,acIn) => {
          actn['sno'] = acIn  +1;
          delete actn.mom_act_documents;
        });
       })
      getMom['mom_decision'] = getMom['mom_decision'].concat(getMom['mom_old']);
      delete getMom['mom_old'];
      delete getMom['meetingCode'];
      delete getMom['meetingName'];
      delete getMom['meetingDate'];
      delete getMom['meetingPeriod'];
      delete getMom['meetingStatus'];
      delete getMom['meetingAgenda'];

      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(getMom));
      let cnfrmMom = await this._hqms.showConfirmMessage();
      if (cnfrmMom) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMomApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key:'MOM',
            severity: 'success',
            summary: 'MOM',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/manage-meetings-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key:'MOM',
            severity: 'warn',
            summary: 'MOM',
            detail: saveResult.message,
          });
        }
      };

    } catch (e) {
    }
  }

  async  onClearClick(){
   this.ngOnInit();
  }
}
