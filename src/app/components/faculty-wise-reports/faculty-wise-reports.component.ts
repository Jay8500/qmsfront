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
    selector: 'app-faculty-wise-reports',
    imports: [NgApexchartsModule],
    templateUrl: './faculty-wise-reports.component.html',
    styleUrl: './faculty-wise-reports.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FacultyWiseReportsComponent {

 @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [60, 15, 25, 10],
      chart: {
        type: "pie",
        height: window.innerWidth < 480 ? 240 : 360,
      },
      labels: ["Dhayanithi (25521)", "Dinesh Kumar(97521)", "Dr. Gowtham (56223)", "Dr. Billy (42256)", "Dr. Prathap Singh (63666)"],
          colors: ["#4C78FF", "#FF82AC", "#16DBCC", "#FFBB38", "#F24949"],
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
