import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexFill,
  ApexTooltip,
  ApexResponsive
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
};

@Component({
    selector: 'app-clinical-patient-activities',
    imports: [NgApexchartsModule],
    templateUrl: './clinical-patient-activities.component.html',
    styleUrl: './clinical-patient-activities.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClinicalPatientActivitiesComponent {
  @ViewChild('chart') chart!: ChartComponent;
      public chartOptions: ChartOptions;
    
      constructor() {
       this.chartOptions = {
        series: [
          { name: "Admission", data: [44, 55, 41, 37, 22, 43, 21] },
          { name: "Surgery", data: [53, 32, 33, 52, 13, 43, 32] },
          { name: "Discharge", data: [12, 17, 11, 9, 15, 11, 20] }
        ],
        chart: {
          type: "bar",
          height: window.innerWidth < 480 ? 240 : 360,
          stacked: true
        },
        plotOptions: {
          bar: {
            horizontal: true,
            dataLabels: {
              position: 'center',
            }
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        },
        title: {
          text: "Fiction Books Sales"
        },
        xaxis: {
          categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          labels: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { show: true },
          axisBorder: { show: true },
          axisTicks: { show: true }
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val + "K";
            }
          }
        },
        fill: {
          opacity: 1
        },
        legend: {
          position: "top",
          horizontalAlign: "left",
          offsetX: 40
        },
        labels: [],
        responsive: [], 
        colors: ['#1D8C3A', '#D92D20', '#FFB11F'], 
        dataLabels: {
          enabled: true
        }
      };
    }
}
