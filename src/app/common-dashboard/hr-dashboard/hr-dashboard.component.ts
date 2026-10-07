import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter,AfterViewInit, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { DepartmentRiskComponent } from '../../components/department-risk/department-risk.component';
import { ComplaintsNumberComponent } from '../../components/complaints-number/complaints-number.component';
import { DepartmentIncidentHappenComponent } from '../../components/department-incident-happen/department-incident-happen.component';
import { PremOverallReportComponent } from '../../components/prem-overall-report/prem-overall-report.component';
import { KpiManagementReportsOverallComponent } from '../../components/kpi-management-reports-overall/kpi-management-reports-overall.component';
import { DepartmentAuditOverallComponent } from '../../components/department-audit-overall/department-audit-overall.component';
import { HqmsService } from '../../services/hqms.service';
import { IncidentHappensComponent } from '../../components/incident-happens/incident-happens.component';
import { ComparisonBarchartComponent } from '../../components/comparison-barchart/comparison-barchart.component';
import { TrainingWiseReportsComponent } from '../../components/training-wise-reports/training-wise-reports.component';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-hr-dashboard',
    imports: [
     KpiManagementReportsOverallComponent,
     IncidentHappensComponent,
     ComparisonBarchartComponent,
     DepartmentAuditOverallComponent
    ],
    templateUrl: './hr-dashboard.component.html',
    styleUrl: './hr-dashboard.component.scss'
})
export class HrDashboardComponent implements  AfterViewInit {
  @ViewChild('incidentRpt') incidentRpt!: DepartmentAuditOverallComponent;
  @ViewChild('essRpt') essRpt!: ComparisonBarchartComponent;
  @ViewChild('scsr') scsr!: IncidentHappensComponent;
  @ViewChild('cRpt') cRpt!: KpiManagementReportsOverallComponent;
  @ViewChild('vctdRPT') vctdRPT!: IncidentHappensComponent;
  public router = inject(Router);
  isHr :boolean = false;
  isManageMnt:boolean = false;
  public upcmngRnwls:any = [];

  essRptList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  essRptText: string = 'Last Week';
  public essRpt_date_range_chart: any = null;
  public essRpt_chartMode:string = 'NEW';

  crRptList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  crRptText: string = 'Last Week';
  public crRpt_date_range_chart: any = null;
  public crRpt_chartMode:string = 'NEW';

  vccnRptList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  vccnRptText: string = 'Last Week';
  public vccnRpt_date_range_chart: any = null;
  public vccnRpt_chartMode:string = 'NEW';


  constructor( public _hqms: HqmsService,private activatedRoute: ActivatedRoute,public _datePipe: DatePipe){};

  async ngAfterViewInit(){
    try{
      await this.getIHWChart();
      await this.esrChartInfo(this.essRptText);
      await this.getSCSRChart();
      await this.crChartInfo(this.crRptText);
      await this.vaccChartInfo(this.vccnRptText);

    }catch(e){
    }
  }

  async esrChartInfo(option: string) {
    this.essRptText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.essRpt_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.essRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.essRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.essRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.essRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.essRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.essRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.essRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getESRChart();
  }

  async crChartInfo(option: string) {
    this.crRptText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.crRpt_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.crRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.crRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.crRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.crRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.crRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.crRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.crRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getCRChart();
  }

  async vaccChartInfo(option: string) {
    this.vccnRptText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.vccnRpt_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.vccnRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.vccnRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.vccnRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.vccnRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.vccnRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.vccnRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.vccnRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getVSRChart();
  }

  async getIHWChart(){
    try{
         let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnHrDashboardChartsApi',
        {
          "flag": "IHW"
        });
        if (adChrt.status == 200) {
           this.incidentRpt.plotData(adChrt['data'],'pie')//
        }
    }catch(e){
    };
  }

  async getESRChart(){
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnHrDashboardChartsApi',
        {
          "flag": "ESR"
        });
        if (adChrt.status == 200) {
          let crtDtaSt: any = {
              "labels": [],
              "series": [],
              "chartNames": ['Satisifed', 'Dissatisfied']
          };
          let allMonths :any = [];
          if(Object.keys(adChrt['data']['satisfied']  || {}).length > 0 ){
            allMonths = [];
            allMonths.push(Object.keys(adChrt['data']['satisfied'] ))
          };
          if(Object.keys(adChrt['data']['dissatisfied']  || {}).length > 0 ){
            allMonths = [];
          allMonths.push(Object.keys(adChrt['data']['dissatisfied'] ))
          };
          let labels:any = Array.from(new Set(allMonths));
          if(Object.keys(adChrt['data']['satisfied']  || {}).length > 0 ){
            crtDtaSt['series'].push(
            {
              name: "Satisfied",
              data: labels.map(mnth => adChrt['data'].satisfied[mnth] || 0)
            });
          };
          if(Object.keys(adChrt['data']['dissatisfied']  || {}).length > 0 ){
            crtDtaSt['series'].push(
              {
                name: "Dissatisfied",
                data: labels.map(mnth => adChrt['data'].dissatisfied[mnth] || 0)
              });
          };
          crtDtaSt['labels'] = labels;
          if (this.essRpt_chartMode == 'NEW') {
              this.essRpt.plotData(crtDtaSt, 'Pie')//
            } else {
              this.essRpt.updateSeries(crtDtaSt)//
          };
      }
    }catch(e){};
  }

  async getSCSRChart(){
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnHrDashboardChartsApi',
        {
          "flag": "SCSR"
        });
        if (adChrt.status == 200) {
         this.scsr.plotData(adChrt['data'],'donut','Survey')//
        }
    }catch(e){};
  }

  async getCRChart(){
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnHrDashboardChartsApi',
        {
          "flag": "CR"
        });
        if (adChrt.status == 200) {
          if (this.crRpt_chartMode == 'NEW') {
          this.cRpt.plotData(adChrt.data, 'Pie')//
          } else {
           this.cRpt.updateSeries(adChrt.data)//
          };
        }
    }catch(e){};
  }

//donut
  async getVSRChart(){
    this.upcmngRnwls = [];
    try{
          let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnHrDashboardChartsApi',
        {
          "flag": "VSR"
        });
        if (adChrt.status == 200) {
          if (this.vccnRpt_chartMode == 'NEW') {
            this.vctdRPT.plotData(adChrt.data,'pie','Status')//
          } else {
            this.vctdRPT.updateSeries(adChrt.data)//
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
