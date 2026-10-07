import { Component,inject} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { Validations } from '../../../validations';
import { OppePerformanceReportsComponent } from '../../../components/oppe-performance-reports/oppe-performance-reports.component';
import { HqmsService } from '../../../services/hqms.service';
@Component({
    selector: 'app-oppe-reports',
    imports:[SharedModule,FormsModule],
    templateUrl: './oppe-reports.component.html',
    styleUrl: './oppe-reports.component.scss'
})
export class OppeReportsComponent {


     public FORM_NAME="OPPEDOC"
      // goBack(): void {
      //   this.location.back();
      // }

      // showFilter = false;

      // filterToggle() {
      //   this.showFilter = !this.showFilter;
      // }
      public validation=inject(Validations);
      public oppeDoc:any={
        deptList_id:null,
        designationList_id:null,
        speciaList_id:null,
        consultList_id:null,
        from_dt:null,
        to_dt:null
      }
      public errMsg:any={
        deptList_id:'',
        designationList_id:'',
        speciaList_id:'',
        consultList_id:'',
        from_dt:'',
        to_dt:''

      }
      public pageMode=""
      constructor(public _hqms: HqmsService,) { }
      onGetErrMsg(ctrl:any){
          let res=this.validation.validateField(
              this.FORM_NAME,ctrl,this.oppeDoc[ctrl]
          )
          this.errMsg[ctrl]=res?.message || ''
      }
      public deptList:any=['','ICU','Laboratory','Emergency','Radiology','General Surgery','Cardiology']
      public consultList:any=['','Dr. Mukesh Kumar(2856)','Dr. Karthkeyan(2888)','Dr. Vinoth(2832)','Dr. Selva Kumar(2835)','Dr. Kaviya (2845)'];
      public speciaList:any=['','CABG','General Surgery','Neurology'];
      public designationList:any=['','Surgeon','Consultant','Medical Officer','Duty Doctor','Junior Resident','Physician']

      onSubmit(){
          Object.keys(this.errMsg).forEach((ctrl)=>{this.onGetErrMsg(ctrl)});
          let isValid=this._hqms.showErrorSummary(this.errMsg);
          if (isValid) {
            this._hqms.hqmsToasterService({
              key: 'prem',
              severity: 'warn',
              summary: 'oppe doctors',
              detail: 'Check the errors',
            });
            return;
          };
      }

    }
