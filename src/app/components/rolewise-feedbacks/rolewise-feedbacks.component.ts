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
    selector: 'app-rolewise-feedbacks',
    imports: [NgApexchartsModule],
    templateUrl: './rolewise-feedbacks.component.html',
    styleUrl: './rolewise-feedbacks.component.scss'
})
export class RolewiseFeedbacksComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [25, 25, 25, 25],
      chart: {
        type: "donut",
        width: 380
      },
      labels: ["Nurse", "Surgeon", "Receptionist", "Pharmacist"],
      colors: ["#4C78FF", "#FF82AC", "#16DBCC", "#FFBB38"],
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
