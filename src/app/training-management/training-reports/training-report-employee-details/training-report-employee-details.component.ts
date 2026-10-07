import { Component, OnInit } from '@angular/core';
import { DecimalPipe, CommonModule } from '@angular/common';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
// import { SelectComponent } from '../../../smart/select/select.component';

interface TrainingData {
  id: number;
  trainingName: string;
  facultyName: string;
  modeOfTraining: string;
  trainingPeriod: string;
  attendance: number;
  score: number;
  result: string;
}

@Component({
  selector: 'app-training-report-employee-details',
  imports: [CommonModule],
  // SelectComponent
  templateUrl: './training-report-employee-details.component.html',
  styleUrl: './training-report-employee-details.component.scss'
})
export class TrainingReportEmployeeDetailsComponent implements OnInit {
  public empGrid: any = [];
  public copyData: any = [];
  public pageMode: string = 'VIEW';
  trainingData = [];

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    try {
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.getEmpViews(state['data']['id']);
      };
    } catch (e) { }
  }

  async getEmpViews(empId: string) {
    try {
      this.empGrid = [];
      this.trainingData = [];
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingEmployeeReportGet',
        {
          "employee_id": empId
        });
      if (info.status == 200) {
        let sourcedData: any = [];
        let trainings: any = [];
        info.data.forEach((prp: any, index: number) => {
          let crtEmps: any = {
            "sno": prp.sno,
            "role": prp.role,
            "employee_id": prp.employee_id,
            "employee_name": prp.employee_name,
            "last_attended": prp.last_attended,
            "trainings_attended": prp.trainings_attended,
            "total_certifications": prp.total_certifications
          };
          sourcedData.push(crtEmps);
          trainings = prp.training.map((ele: any, index: number) => ({ sno: index + 1, ...ele }))
        });
        this.trainingData = trainings;
        this.empGrid = [...sourcedData];
      };
    } catch (e) {
    };
  }
}
