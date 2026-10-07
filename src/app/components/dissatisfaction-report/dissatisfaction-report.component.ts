import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexFill,
  ApexYAxis,
  ApexTooltip,
  ApexTitleSubtitle,
  ApexXAxis
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  title: ApexTitleSubtitle;
  labels: string[];
  stroke: any; // ApexStroke;
  dataLabels: any; // ApexDataLabels;
  fill: ApexFill;
  plotOptions: ApexPlotOptions;
  colors: string[];
  tooltip: ApexTooltip;
};

@Component({
    selector: 'app-dissatisfaction-report',
    imports: [NgApexchartsModule],
    templateUrl: './dissatisfaction-report.component.html',
    styleUrl: './dissatisfaction-report.component.scss'
})
export class DissatisfactionReportComponent {
  @ViewChild('chart') chart!: ChartComponent;
    public chartOptions!: ChartOptions;
  
    constructor() {
      this.chartOptions = {
          series: [
          {
            name: "Dissatisfaction",
            type: "column",
            data: [2, 3, 1, 2, 3, 8]
          },
          {
            name: "Series",
            type: "line",
            data: [2, 3, 1, 2, 3, 8]
          }
        ],
        chart: {
          width: window.innerWidth < 480 ? 280 : 360,
          height: window.innerWidth < 480 ? 240 : 320,
          type: "line",
          stacked: false,
        },
        stroke: {
          width: [0, 3]
        },
        title: {
          text: "Traffic Sources"
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: [1]
        },
        labels: [
          "01 Jan",
          "02 Jan",
          "03 Jan",
          "04 Jan",
          "05 Jan",
          "06 Jan"
        ],
        xaxis: {
          type: "datetime",
          labels: {
            format: "MMM" 
          }
        },
        yaxis: [
          {
            title: {
              text: ""
            }
          }
        ],
        fill: {
          type: "solid"
        },
        colors: ['#062A64', '#16DBCC', '#FEB019'],
        tooltip: {
          shared: true,
          intersect: false
        },
        plotOptions: {
          bar: {
              horizontal: false,
              columnWidth: '10%',
              borderRadius: 8
            }
          }
      };
    }
}
