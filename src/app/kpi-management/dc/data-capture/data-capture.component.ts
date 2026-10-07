import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
import { HqmsService } from '../../../services/hqms.service';

@Component({
  selector: 'app-data-capture',
  imports: [CommonModule, SharedModule],//
  templateUrl: './data-capture.component.html',
  styleUrl: './data-capture.component.scss',
})
export class DataCaptureComponent implements OnInit {
  private validations = inject(Validations);
  public selected_kpi = signal(null);
  public selected_dt = signal(null);
  public selectedKpicode = '';
  readonly FORM_NAME = 'DCCAPTURE';
  public errorMsg: any = {
    selected_dt: '',
    selected_kpi:''
  };
  onGetErr(ctrl:any,item:any){
    let res=this.validations.validateField(this.FORM_NAME,ctrl,item[ctrl]);
    item[ctrl + '_error'] = res?.message || '';
  }
  public dateType: any = 'date';
  public KpiList: any = [];
  public selectedDc = {
    "kpi_data_capture_id": null,
    "is_dc_completed": null,
    "from_dt": null,
    "to_dt": null,
    "kpi_id": null,
    "kpi_code": null,
    "kpi_name": null,
    "benchmark": [],
    "employees": [],
    "is_active": true,
    "kpi_formula": null,
    "kpi_type_id": null,
    "effective_to": null,
    "frequency_id": null,
    "category_name": null,
    "created_by_id": null,
    "custom_fields": [],
    "department_id": null,
    "kpi_type_name": null,
    "updated_by_id": null,
    "effective_from": null,
    "frequency_name": null,
    "kpi_definition": null,
    "department_name": null,
    "kpi_category_id": null,
    "numerator_label": null,
    "qr_barcode_track": false,
    "denominator_label": null,
    "evidence_mandatory": false,
    "exclusion_criteria": null,
    "unit_of_measure_id": null,
    "unit_of_measure_name": "",
    "data_capture_status": null,
  }
  public clearInfo = JSON.stringify(this.selectedDc);
  public minDateSetter: any = signal(null);
  public periodsList: any = [];

  constructor(private location: Location, public _hqms: HqmsService) { }

  goBack(): void {
    this.location.back();
  }

  showFilter = false;

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  onGetErrorMsgs(ctrl: any, item?: any) {
    if (item) {
      const result = this.validations.validateField(this.FORM_NAME, ctrl, item[ctrl]);
      item[ctrl + '_error'] = result?.message || '';
    } else {
      const result = this.validations.validateField(this.FORM_NAME, ctrl, this.selected_dt());
      this.errorMsg[ctrl] = result?.message || '';
    }
  }

  async onKpiSelect() {
    if (this.selected_kpi() != null) {
      this.selectedDc = JSON.parse(this.clearInfo)
      this.selected_dt.set(null);
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.selectedKpicode = this.KpiList.filter((r) => r.value == this.selected_kpi())[0]['code'];
      this.periodsList = this.getPeriods(this.selectedKpicode, 2);
    };
  }

  async onPeriodSelect() {
    this.onGetErrorMsgs('selected_dt');
    if (this.selected_dt() != null) {
      this.selectedDc = JSON.parse(this.clearInfo)
      let slctdDt = this.periodsList.filter((fl) => fl.value === this.selected_dt()); // apart from daily
      if (slctdDt.length > 0) {
        let param = {
          kpi_id: this.selected_kpi(),
          from_dt: slctdDt[0]['from_dt'],
          to_dt: slctdDt[0]['to_dt'],
        }
        await this.getselected_kpi(param)
      } else {
        let param = {
          kpi_id: this.selected_kpi(),
          from_dt: this.selected_dt(),
          to_dt: this.selected_dt(),
        }
        await this.getselected_kpi(param)
      };
    };
  }

  onNumeratorChange(dcInfo: any) {
    this.onGetErrorMsgs('numerator_value', dcInfo);
    if (dcInfo.numerator_value == null) {
      dcInfo.denominator_value = null;
      dcInfo.actual_score = null;
      dcInfo.is_deno_req = false;
      if (['Number', 'Days', 'HOURS', 'MINUTES'].includes(this.selectedDc['unit_of_measure_name'])) {
        dcInfo.display_score = null;
        this.onCalculateClick(dcInfo);
        dcInfo.is_deno_req = true;
      };
    };
  }

  onDenominatorChange(dcInfo: any) {
    this.onGetErrorMsgs('denominator_value', dcInfo);
    dcInfo.status = null;
    this.onCalculateClick(dcInfo);
  }
  onScoreChange(dcInfo: any) {
    this.onGetErrorMsgs('display_score', dcInfo);
    dcInfo.status = null;
    this.onCalculateClick(dcInfo);
  }
  public getSrvrDt: any = null;

  async  ngOnInit() {
    try {
      this.getSrvrDt = await this._hqms.getServerDate('DATE');
      let KpiList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "KPI"
        }, true);
      if (KpiList.status == 200) {
        this.KpiList = KpiList.data.map((ele: any) => ({
          label: ele.kpi_name,
          value: ele.kpi_id,
          code: ele.frequency_name,
        }))
      };
    } catch (e) {

    }
  }

  async getselected_kpi(param: any) {
    try {
      this.selectedDc = JSON.parse(this.clearInfo)
      let info: any = await this._hqms.customGetApiCall('GET', 'fnKpiDCApi',
        {
          "kpi_id": param['kpi_id'],
          from_dt: param['from_dt'],
          to_dt: param['to_dt']
        });
      if (info.status == 200) {
        let editInfo = info['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.selectedDc.kpi_id = param['kpi_id'];
          this.selectedDc.kpi_data_capture_id = editInfo['kpi_data_capture_id'];
          this.selectedDc.from_dt = param['from_dt'];
          this.selectedDc.to_dt = param['to_dt'];
          this.selectedDc.kpi_code = editInfo.kpi_code;
          this.selectedDc.kpi_type_name = editInfo.kpi_type_name;
          this.selectedDc.department_name = editInfo.department_name;
          this.selectedDc.unit_of_measure_name = editInfo.unit_of_measure_name;
          this.selectedDc.benchmark = editInfo.benchmark;
          this.selectedDc.kpi_formula = editInfo.kpi_formula;
          this.selectedDc.numerator_label = editInfo.numerator_label;
          this.selectedDc.department_id = editInfo.department_id;
          this.selectedDc.data_capture_status = editInfo.data_capture_status;
          this.selectedDc.denominator_label = editInfo.denominator_label;
          this.selectedDc.custom_fields = editInfo.custom_fields.map((cF) => ({
            ...cF, options_json: cF.options_json.length > 0 ?
              cF.options_json.map((ele) => ({ label: ele, value: ele })) : []
          }));
          this.selectedDc.employees = editInfo.employees.map((ele) => ({
            ...ele,
            is_active: true,
            is_deno_req: false,
            display_score: ele.actual_score != null ? this.scoreDisplayLabel(ele, editInfo.unit_of_measure_name) : null
          }));
        }
      };
    } catch (e) { };
  }

  async onSubmitClick(saveCtrl: string) {
    try {
      let payLoad = JSON.parse(JSON.stringify(this.selectedDc));
      payLoad['action'] = "S";
      payLoad["data_capture_status"] = saveCtrl;
      delete payLoad['benchmark'];
      delete payLoad['kpi_code'];
      delete payLoad['kpi_name'];
      delete payLoad['kpi_formula'];
      delete payLoad['kpi_type_name'];
      delete payLoad['department_name'];
      delete payLoad['numerator_label'];
      delete payLoad['denominator_label'];
      delete payLoad['unit_of_measure_name'];
      delete payLoad['kpi_type_id'];
      delete payLoad['effective_to'];
      delete payLoad['frequency_id'];
      delete payLoad['category_name'];
      delete payLoad['created_by_id'];
      delete payLoad['updated_by_id'];
      delete payLoad['effective_from'];
      delete payLoad['frequency_name'];
      delete payLoad['kpi_definition'];
      delete payLoad['kpi_category_id'];
      delete payLoad['qr_barcode_track'];
      delete payLoad['evidence_mandatory'];
      delete payLoad['exclusion_criteria'];
      delete payLoad['unit_of_measure_id'];
      delete payLoad['display_score'];
      let confirmLicenseMaster = await this._hqms.showConfirmMessage();
      if (confirmLicenseMaster) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnKpiMstrApi", payLoad);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Kpi Data Capture',
            detail: saveResult.message,
          });
          this.onClearClick();

        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Kpi Data Capture',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.selected_kpi.set(null);
    this.selected_dt.set(null);
    this.selectedKpicode = ''
    this.selectedDc = JSON.parse(this.clearInfo);
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  getPeriods(frequency: string, yearsCnt: number = 2) {
    let periods: any = [];
    try {
      let currentYear = new Date(this.getSrvrDt).getFullYear();
      let currentMonth = new Date(this.getSrvrDt).getUTCMonth();
      for (let i = 0; i < yearsCnt; i++) {
        let targetYr = currentYear - i;
        if (frequency === 'Monthly') {
          let strtMnth = (targetYr === currentYear) ? currentMonth : 11;
          for (let m = strtMnth; m >= 0; m--) {
            periods.push({
              label: `${new Date(targetYr, m).toLocaleDateString('default', { month: 'long' })} ${targetYr}`,
              value: `${new Date(targetYr, m).toLocaleDateString('default', { month: 'long' })} ${targetYr}`,
              from_dt: new Date(targetYr, m, 1).toISOString().split('T')[0],
              to_dt: new Date(targetYr, m + 1, 0).toISOString().split('T')[0],
            })
          }
        } else if (frequency === 'Quarterly') {
          let quarters = [
            {
              id: 'Q1', m: [0, 2]
            },
            {
              id: 'Q2', m: [3, 5]
            },
            {
              id: 'Q3', m: [6, 8]
            },
            {
              id: 'Q4', m: [9, 11]
            }
          ];
          quarters.reverse().forEach((qs) => {
            if (targetYr < currentYear || qs.m[0] <= currentMonth) {
              periods.push({
                label: `${qs.id} ${targetYr}`,
                value: `${qs.id} ${targetYr}`,
                from_dt: new Date(targetYr, qs.m[0], 1).toISOString().split('T')[0],
                to_dt: new Date(targetYr, qs.m[0] + 1, 0).toISOString().split('T')[0],
              })
            }
          })
        } else if (frequency === 'Weekly') {
          let totalWeeks = (targetYr === currentYear) ? this.getISOWeek(new Date(this.getSrvrDt)) : 52;
          for (let w = totalWeeks; w >= 1; w--) {
            let weekData = this.getWeekDates(targetYr, w);
            periods.push({
              label: `Week ${w}, ${targetYr} (${weekData.start}-${weekData.end})`,
              value: `Week ${w}, ${targetYr} (${weekData.start}-${weekData.end})`,
              from_dt: weekData.from,
              to_dt: weekData.to
            })
          };
        } else if (frequency === 'Yearly') {
          periods.push({
            label: `Year ${targetYr}`,
            value: `Year ${targetYr}`,
            from_dt: `${targetYr}-01-01`,
            to_dt: `${targetYr}-12-31`
          })
        } else {
          periods = [];
        }
      };
    } catch (e) {
    }
    return periods;
  }

  getISOWeek(d: Date): number {
    let date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    let week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
  }

  getWeekDates(year: number, week: number) {
    let simple = new Date(year, 0, 1 + (week - 1) * 7);
    let dow = simple.getDay();
    let ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    };
    let from = new Date(ISOweekStart);
    let to = new Date(ISOweekStart);
    to.setDate(to.getDate() + 6);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      start: from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      end: to.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    }
  }

  onCalculateClick(dcInfo: any) {
    try {
      let nmrtrVal = parseInt(dcInfo.numerator_value || 0);
      let denoVal = parseInt(dcInfo.denominator_value || 0);
      switch (this.selectedDc['unit_of_measure_name']) {
        case "Percentage (%)": //D required
          dcInfo.actual_score = denoVal > 0 ? (nmrtrVal / denoVal) * 100 : 0;
          dcInfo.display_score = this.scoreDisplayLabel(dcInfo, 'Percentage (%)');
          break;
        case "Rate per 100": //D required
          dcInfo.actual_score = denoVal > 0 ? (nmrtrVal / denoVal) * 100 : 0;
          dcInfo.display_score = this.scoreDisplayLabel(dcInfo, 'Rate per 100');
          break;
        case "Ratio"://D required
          dcInfo.actual_score = denoVal > 0 ? (nmrtrVal / denoVal) * 100 : 0;
          dcInfo.display_score = this.scoreDisplayLabel(dcInfo, 'Ratio');
          break;
        case "Number":
        case "Days":
        case "HOURS":
        case "MINUTES"://D not required
          dcInfo.denominator_value = null;
          dcInfo.actual_score = nmrtrVal;
          dcInfo.display_score = this.scoreDisplayLabel(dcInfo, 'MINUTES')
          dcInfo.denoVal = null;
          break;
        default:// D not required
          dcInfo.actual_score = nmrtrVal;
          dcInfo.display_score = nmrtrVal.toString();
          break;
      };
      let green = this.selectedDc['benchmark'][0]['complaint_benchmark'];
      let amber = this.selectedDc['benchmark'][0]['partial_complaint_benchmark'];
      //  let green =  this.selectedDc['benchmark'][0]['non_complaint_benchark'];
      if (dcInfo.actual_score >= green) {
        dcInfo.status = 'Compliance';
      } else if (dcInfo.actual_score >= amber) {
        dcInfo.status = 'Partial Compliance';
      } else {
        dcInfo.status = 'Non-Compliance';
      }
    } catch (e) { };
  }

  scoreDisplayLabel(dcInfo, ctrl) {
    let text: string = "";
    switch (ctrl) {
      case "Number":
      case "Days":
      case "HOURS":
      case "MINUTES":
        text = `${dcInfo.actual_score}`;
        break;
      case "Ratio":
        text = `${dcInfo.numerator_value}:${dcInfo.denominator_value}`;
        break;
      case "Percentage (%)":
        text = `${dcInfo.actual_score.toFixed(2)} %`;
        break;
      case "Rate per 100":
        text = `${dcInfo.actual_score}`;
        break;
    }
    return text;
  }
}


