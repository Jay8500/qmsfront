import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { DepartmentRiskComponent } from '../../components/department-risk/department-risk.component';
import { ComplaintsNumberComponent } from '../../components/complaints-number/complaints-number.component';
import { DepartmentIncidentHappenComponent } from '../../components/department-incident-happen/department-incident-happen.component';
import { PremOverallReportComponent } from '../../components/prem-overall-report/prem-overall-report.component';
import { KpiManagementReportsOverallComponent } from '../../components/kpi-management-reports-overall/kpi-management-reports-overall.component';
import { DepartmentAuditOverallComponent } from '../../components/department-audit-overall/department-audit-overall.component';
import { HqmsService } from '../../services/hqms.service';
import { IncidentHappensComponent } from '../../components/incident-happens/incident-happens.component';
import { LocationsWiseIncidentComponent } from '../../components/locations-wise-incident/locations-wise-incident.component';
import { ComparisonBarchartComponent } from '../../components/comparison-barchart/comparison-barchart.component';
import { TrainingWiseReportsComponent } from '../../components/training-wise-reports/training-wise-reports.component';
import { DatePipe } from '@angular/common';
@Component({
    selector: 'app-management-dashboard',
    imports: [
      DepartmentAuditOverallComponent,
     KpiManagementReportsOverallComponent,
     IncidentHappensComponent,
     LocationsWiseIncidentComponent,
     ComparisonBarchartComponent,
     TrainingWiseReportsComponent
     ],
    templateUrl: './management-dashboard.component.html',
    styleUrl: './management-dashboard.component.scss'
})
export class ManagementDashboardComponent implements OnInit{ //fnDashboardChartsApi
  @ViewChild('incidentRpt') incidentRpt !: DepartmentAuditOverallComponent;
  @ViewChild('lctnWiseRpt') lctnWiseRpt !: LocationsWiseIncidentComponent;
  @ViewChild('depRisRpt') depRisRpt !: IncidentHappensComponent;
  @ViewChild('rCCRpt') rCCRpt !: ComparisonBarchartComponent;
  @ViewChild('areaChart') areaChart !: TrainingWiseReportsComponent;
  @ViewChild('kpi') kpi !: KpiManagementReportsOverallComponent;
  public router = inject(Router);
  isHr :boolean = false;
  isManageMnt:boolean = false;
  public upcmngRnwls:any = [];

  premList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  premText: string = 'Last Week';
  public prem_date_range_chart: any = null;
  public prem_chartMode:string = 'NEW';

  kpiList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  kpiText: string = 'Last Week';
  public kpi_date_range_chart: any = null;
  public kpi_chartMode:string = 'NEW';

  async premChartInfo(option: string) {
    this.premText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.prem_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.prem_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.prem_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.prem_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.prem_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.prem_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.prem_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.prem_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
   await this.getPFRchart();
  }

  async kpiChartInfo(option: string) {
    this.kpiText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.kpi_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.kpi_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.kpi_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.kpi_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.kpi_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.kpi_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.kpi_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.kpi_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
     await this.getKMRchart();
  }

  constructor( public _hqms: HqmsService,private activatedRoute: ActivatedRoute,public _datePipe: DatePipe){};

  async ngOnInit(){
    try{
      await this.getDWAchart();
      await this.getDWIchart();
      await this.getDWRchart();
      await this.premChartInfo(this.premText);
      await this.getCRchart();
      await this.getuRnwls();
      await this.kpiChartInfo(this.kpiText);
    }catch(e){
      console.log("ewerewrewrew",e)
    }
  }

  async getDWAchart(){
    try{
         let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "DWA"
        });
        if (adChrt.status == 200) {
           this.incidentRpt.plotData(adChrt['data'],'donut','Audits')//
        }
    }catch(e){};
  }

  async getDWIchart(){
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "DWI"
        });
        if (adChrt.status == 200) {
         this.lctnWiseRpt.plotData(adChrt['data'], 'Department wise incidents')
        }
    }catch(e){};
  }

  async getDWRchart(){
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "DWR"
        });
        if (adChrt.status == 200) {
         this.depRisRpt.plotData(adChrt['data'],'pie')//
        }
    }catch(e){};
  }

  async getPFRchart(){
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "PFR"
        });
        if (adChrt.status == 200) {
           let crtDtaSt: any = {
              "labels": [],
              "series": [],
              "chartNames": ['In Patient', 'Discharge','Out Patient']
           };
         let allMonths :any = [];
        if(Object.keys(adChrt['data']['inpatient']  || {}).length > 0 ){
          allMonths = [];
          allMonths.push(Object.keys(adChrt['data']['inpatient'] ))
         }

        if(Object.keys(adChrt['data']['discharge']  || {}).length > 0 ){
           allMonths = [];
         allMonths.push(Object.keys(adChrt['data']['discharge'] ))
         }

        if(Object.keys(adChrt['data']['outpatient']  || {}).length > 0 ){
           allMonths = [];
           allMonths.push(Object.keys(adChrt['data']['outpatient'] ))
         }

        let labels:any = Array.from(new Set(allMonths));
         if(Object.keys(adChrt['data']['inpatient']  || {}).length > 0 ){
          crtDtaSt['series'].push(
          {
            name: "In Patient",
            data: labels.map(mnth => adChrt['data'].inpatient[mnth] || 0)
          });
         };
         if(Object.keys(adChrt['data']['discharge']  || {}).length > 0 ){
          crtDtaSt['series'].push(
            {
              name: "Discharge",
              data: labels.map(mnth => adChrt['data'].discharge[mnth] || 0)
            });
         };
         if(Object.keys(adChrt['data']['outpatient']  || {}).length > 0 ){
            crtDtaSt['series'].push(
            {
               name: "Out Patient",
            data: labels.map(mnth => adChrt['data'].outpatient[mnth] || 0)
            }
            );
         };
        crtDtaSt['labels'] = labels;

       if (this.prem_chartMode == 'NEW') {
          this.rCCRpt.plotData(crtDtaSt, 'Pie')//
        } else {
          this.rCCRpt.updateSeries(crtDtaSt)//
        };

        }
    }catch(e){};
  }
  public cmplntCnt:any= 0;
  async getCRchart(){
    this.cmplntCnt = 0;
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "CR"
        });
        if (adChrt.status == 200) {
            this.cmplntCnt = adChrt['data'][0]['tota_cnt'];
           this.areaChart.plotData(adChrt['data'], 'Complaints')//
        }
    }catch(e){};
  }

  async getuRnwls(){
    this.upcmngRnwls = [];
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "UR"
        });
        if (adChrt.status == 200) {
           this.upcmngRnwls = adChrt['data']
        }
    }catch(e){};
  }

  async getKMRchart(){
    try{
           let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnDashboardChartsApi',
        {
          "flag": "KMR"
        });
        if (adChrt.status == 200) {

       if (this.kpi_chartMode == 'NEW') {
          this.kpi.plotData(adChrt['data'], 'Pie')//
        } else {
          this.kpi.updateSeries(adChrt['data'])//
        };
      }
    }catch(e){};
  }

  onPageRoute(ctrl){
     this.router.navigate(
        [
          `/${ctrl}`,
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              // mode: pageMode,
              // id: training == null ? null : training.training_id
            }
          }
        })
  }


}
