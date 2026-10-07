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
    selector: 'app-report-piechart',
    imports: [NgApexchartsModule],
    templateUrl: './report-piechart.component.html',
    styleUrl: './report-piechart.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ReportPiechartComponent {
  @ViewChild("chart") chart!: ChartComponent;
    public chartOptions: ChartOptions;

    constructor() {
      this.chartOptions = {
        series: [25, 25, 25, 25],
        chart: {
          type: "donut",
          // height: window.innerWidth < 480 ? 220 : 340,
        },
        labels: ["Blood Bank", "In-Patient", "ICU", "Out Patient"],
        colors: ["#4B7BF5", "#19D4CA", "#FD77A1", "#FDBF4C"],
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
