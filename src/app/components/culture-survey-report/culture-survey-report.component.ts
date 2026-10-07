import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexDataLabels
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];         
  legend: ApexLegend;       
  fill: ApexFill;          
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
};

@Component({
    selector: 'app-culture-survey-report',
    imports: [NgApexchartsModule],
    templateUrl: './culture-survey-report.component.html',
    styleUrl: './culture-survey-report.component.scss'
})

export class CultureSurveyReportComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [25, 25, 25, 15, 10],
      chart: {
        type: "donut",
        height: window.innerWidth < 480 ? 280 : 320,
      },
      labels: ["Training", "Communication", "Culture", "Staffing", "Facility"],
      colors: ["#34D1A6", "#FFB11F", "#003488", "#FF5143", "#1D8C3A"],
      fill: {
        type: "solid"
      },
      stroke: {
        show: false,
        width: 0,
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: "bottom",
        fontSize: "14px",
        fontWeight: 500,
        labels: {
          colors: "#333"
        },
        markers: {
          shape: "circle"
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 250
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
  }
}
