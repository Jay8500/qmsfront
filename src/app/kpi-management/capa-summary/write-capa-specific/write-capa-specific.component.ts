import { Component, signal, OnInit, NO_ERRORS_SCHEMA, ViewChild, ViewChildren, QueryList, inject } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { KpiIndicatorsComponent } from '../../../components/kpi-indicators/kpi-indicators.component';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-write-capa-specific',
  imports: [FormsModule, SharedModule, KpiIndicatorsComponent],
  templateUrl: './write-capa-specific.component.html',
  styleUrl: './write-capa-specific.component.scss',
  schemas: [NO_ERRORS_SCHEMA]
})
export class WriteCapaSpecificComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'WRITECAPA';
  public router = inject(Router);
  @ViewChild('indcWseRpt') indcWseRpt !: KpiIndicatorsComponent;
  public errorMsg: any = {
    reason_for_deviation: '', description: '', interpretation_learning: '',
    action_taken: '', reviewer_comments: '',
  };

  public createCapa: any = signal({
    "action": "k", /* capa*/
    "kpi_id": null,
    "capa_id": null,
    "kpi_code": null,
    "kpi_name": null,
    "kpi_type_name": null,
    "department_name": null,
    "frequency_name": null,
    "unit_of_measure_name": null,
    "kpi_formula": null,
    "target_benchmark": null,
    "kpi_actual_score_status": null,
    "description": null,
    "action_taken": null,
    "reason_for_deviation": null,
    "interpretation_learning": null,
    "reviewer_comments": null,
    "is_active": true,
    "updated_at": null,
    "status": null,
    "kpi_data_capture_id": null,
  })

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createCapa()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location, public _hqms: HqmsService, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editCapa(state['data']['id']);
        await this.peridChartInfo(this.periodText);
        await this.getKTPChart();
      }
    } catch (e) {
    };
  }

  async editCapa(dcId: any) {
    try {
      let getCapaInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiCapaSummaryList',
        {
          "kpi_data_capture_id": dcId
        });
      if (getCapaInfo.status == 200) {
        let editInfo = getCapaInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.createCapa.set({
            "action": "K",
            "kpi_id": editInfo.kpi_id,
            "capa_id": editInfo.capa_id || null,
            "kpi_code": editInfo.kpi_code,
            "kpi_name": editInfo.kpi_name,
            "kpi_type_name": editInfo.kpi_type_name,
            "department_name": editInfo.department_name,
            "frequency_name": editInfo.frequency_name,
            "unit_of_measure_name": editInfo.unit_of_measure_name,
            "kpi_formula": editInfo.kpi_formula,
            "target_benchmark": editInfo.benchmark[0]['target_benchmark'],
            "kpi_actual_score_status": editInfo.kpi_actual_score_status,
            "description": editInfo.description,
            "action_taken": editInfo.action_taken,
            "reason_for_deviation": editInfo.reason_for_deviation,
            "interpretation_learning": editInfo.interpretation_learning,
            "reviewer_comments": editInfo.reviewer_comments,
            "is_active": editInfo.is_active,
            "updated_at": editInfo.updated_at,
            "status": editInfo.status,
            "kpi_data_capture_id": editInfo.kpi_data_capture_id,
          });
        };
      };
    } catch (e) { };
  }

  async onSubmitClick() {
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid) {
      this._hqms.hqmsToasterService({
        key: 'capa',
        severity: 'warn',
        summary: 'Write CAPA',
        detail: 'Check the errors',
      });
      return;
    };
    let writeCapa = JSON.parse(JSON.stringify(this.createCapa()));
    delete writeCapa['kpi_code'];
    delete writeCapa['kpi_name'];
    delete writeCapa['kpi_type_name'];
    delete writeCapa['department_name'];
    delete writeCapa['frequency_name'];
    delete writeCapa['unit_of_measure_name'];
    delete writeCapa['kpi_formula'];
    delete writeCapa['target_benchmark'];
    delete writeCapa['kpi_actual_score_status'];
    delete writeCapa['is_active'];
    delete writeCapa['updated_at'];
    delete writeCapa['status'];
    let confirmCapa = await this._hqms.showConfirmMessage();
    if (confirmCapa) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnKpiWriteApi", writeCapa);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Write CAPA',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/capa-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Write CAPA',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    // this.createCapa.set({
    //   "action": "k",
    //   "kpi_id": null,
    //   "capa_id": null,
    //   "kpi_code": null,
    //   "kpi_name": null,
    //   "kpi_type_name": null,
    //   "department_name": null,
    //   "frequency_name": null,
    //   "unit_of_measure_name": null,
    //   "kpi_formula": null,
    //   "target_benchmark": null,
    //   "kpi_actual_score_status": null,
    //   "description": null,
    //   "action_taken": null,
    //   "reason_for_deviation": null,
    //   "interpretation_learning": null,
    //   "reviewer_comments": null,
    //   "is_active": true,
    //   "updated_at": null,
    //   "status": null,
    // });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.location.back();
  }

  periodList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  periodText: string = 'Last Week';
  public date_range_chart: any = null;
  public myChartMode = 'NEW';

  async peridChartInfo(option: string) {
    this.periodText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getKTPChart();
  }

  async getKTPChart() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range_chart != null) {
        let dates = this.date_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnKpiChartsApi',
        {
          "flag": "KTP",
          "from_dt": fromDt,
          "to_dt": toDate,
        });
      if (adChrt.status == 200) {
        this.indcWseRpt.plotData(adChrt['data'], "Indicator")
      }
    } catch (e) { }
  }
}
